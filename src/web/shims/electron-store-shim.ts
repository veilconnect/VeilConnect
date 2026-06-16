/**
 * 浏览器版 `electron-store` 替身（经 webpack alias 注入，替换桌面端的 electron-store）。
 *
 * 难点：electron-store 是**同步** API（store.get 直接返回值），而各 Manager 在构造函数里就同步读取；
 * 但浏览器持久化（IndexedDB）是异步的，且本模块运行在 **Web Worker** 内（Worker 无 localStorage）。
 *
 * 解法：内存缓存 + 异步水合。
 *  - Worker 在构造任何 Manager 之前，先 `await hydrateStore(name, key)` 把该库从 IndexedDB
 *    解密载入内存（registry）。
 *  - Store 的 get/set/delete/clear 全部对内存对象**同步**操作 —— 与 electron-store 行为一致。
 *  - set/delete/clear 触发**异步写回**（nacl.secretbox 加密后写入 IndexedDB），按库串行排队，不阻塞调用方。
 *
 * 加密：每个库整体用其 encryptionKey（64-hex = 32B）经 nacl.secretbox(同步) 加密；
 * 主密钥本身由 BrowserKeyStore 以用户口令派生（见 src/web/security/BrowserKeyStore.ts）。
 *
 * 兼容点：支持 electron-store 的点号路径（SimpleDatabaseManager 用 'messages.<peerId>'、
 * 'counters.messageId' 等）与 defaults 构造项（仅补缺失的顶层键）。
 */
import * as nacl from 'tweetnacl';
import * as naclUtil from 'tweetnacl-util';

const DB_NAME = 'veilconnect-store';
const OBJ_STORE = 'kv';

// ---------------------------------------------------------------------------
// 点号路径读写（对齐 electron-store / dot-prop 的常用语义）
// ---------------------------------------------------------------------------
function getPath(obj: Record<string, any>, path: string): any {
  if (!path.includes('.')) return obj[path];
  let cur: any = obj;
  for (const part of path.split('.')) {
    if (cur == null) return undefined;
    cur = cur[part];
  }
  return cur;
}

function setPath(obj: Record<string, any>, path: string, value: any): void {
  if (!path.includes('.')) { obj[path] = value; return; }
  const parts = path.split('.');
  let cur: any = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const p = parts[i];
    if (typeof cur[p] !== 'object' || cur[p] == null) cur[p] = {};
    cur = cur[p];
  }
  cur[parts[parts.length - 1]] = value;
}

function deletePath(obj: Record<string, any>, path: string): void {
  if (!path.includes('.')) { delete obj[path]; return; }
  const parts = path.split('.');
  let cur: any = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const p = parts[i];
    if (cur[p] == null) return;
    cur = cur[p];
  }
  delete cur[parts[parts.length - 1]];
}

// ---------------------------------------------------------------------------
// 同步对称加密（nacl.secretbox：key 32B / nonce 24B）
// ---------------------------------------------------------------------------
function hexToBytes(hex: string): Uint8Array {
  const clean = hex.length >= 64 ? hex.slice(0, 64) : hex.padEnd(64, '0');
  const out = new Uint8Array(32);
  for (let i = 0; i < 32; i++) out[i] = parseInt(clean.substr(i * 2, 2), 16);
  return out;
}

function encryptBlob(data: unknown, key: Uint8Array): Uint8Array {
  const msg = naclUtil.decodeUTF8(JSON.stringify(data));
  const nonce = nacl.randomBytes(nacl.secretbox.nonceLength);
  const box = nacl.secretbox(msg, nonce, key);
  const out = new Uint8Array(nonce.length + box.length);
  out.set(nonce, 0);
  out.set(box, nonce.length);
  return out;
}

function decryptBlob(bytes: Uint8Array, key: Uint8Array): Record<string, any> | null {
  const nonce = bytes.slice(0, nacl.secretbox.nonceLength);
  const box = bytes.slice(nacl.secretbox.nonceLength);
  const plain = nacl.secretbox.open(box, nonce, key);
  if (!plain) return null;
  try {
    const parsed = JSON.parse(naclUtil.encodeUTF8(plain));
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// IndexedDB（Worker 内可用；localStorage 不可用）
// ---------------------------------------------------------------------------
let dbPromise: Promise<IDBDatabase> | null = null;
function openDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(OBJ_STORE)) {
        req.result.createObjectStore(OBJ_STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

async function idbGet(name: string): Promise<Uint8Array | null> {
  const db = await openDB();
  return new Promise<Uint8Array | null>((resolve, reject) => {
    const tx = db.transaction(OBJ_STORE, 'readonly');
    const req = tx.objectStore(OBJ_STORE).get(name);
    req.onsuccess = () => {
      const v = req.result;
      if (!v) return resolve(null);
      resolve(v instanceof Uint8Array ? v : new Uint8Array(v as ArrayBuffer));
    };
    req.onerror = () => reject(req.error);
  });
}

async function idbPut(name: string, bytes: Uint8Array): Promise<void> {
  const db = await openDB();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(OBJ_STORE, 'readwrite');
    tx.objectStore(OBJ_STORE).put(bytes, name);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// ---------------------------------------------------------------------------
// registry：库名 → { 主密钥, 内存数据, 写回队列 }
// ---------------------------------------------------------------------------
interface Entry {
  key: Uint8Array;
  data: Record<string, any>;
  queue: Promise<void>;
}
const registry = new Map<string, Entry>();

/**
 * 在构造对应 Manager 之前调用：从 IndexedDB 解密载入该库到内存。
 * 重复调用同名库直接返回（已水合）。
 */
export async function hydrateStore(name: string, encryptionKeyHex: string): Promise<void> {
  if (registry.has(name)) return;
  const key = hexToBytes(encryptionKeyHex);
  let data: Record<string, any> = {};
  try {
    const raw = await idbGet(name);
    if (raw) {
      const dec = decryptBlob(raw, key);
      if (dec) data = dec;
    }
  } catch (err) {
    console.warn('[electron-store-shim] hydrate failed for', name, err);
  }
  registry.set(name, { key, data, queue: Promise.resolve() });
}

/** 一次性水合多个库（name → encryptionKeyHex）。 */
export async function hydrateStores(map: Record<string, string>): Promise<void> {
  await Promise.all(Object.entries(map).map(([name, key]) => hydrateStore(name, key)));
}

/** 清空所有库（内存 + IndexedDB）。用于「重置身份/登出」。 */
export async function wipeAll(): Promise<void> {
  const names = Array.from(registry.keys());
  registry.clear();
  const db = await openDB();
  await Promise.all(names.map(name => new Promise<void>((resolve) => {
    const tx = db.transaction(OBJ_STORE, 'readwrite');
    tx.objectStore(OBJ_STORE).delete(name);
    tx.oncomplete = () => resolve();
    tx.onerror = () => resolve();
  })));
}

interface StoreOptions<T> {
  name: string;
  encryptionKey: string;
  defaults?: Partial<T>;
}

export default class Store<T extends Record<string, any> = Record<string, any>> {
  private readonly name: string;
  private readonly entry: Entry;

  constructor(opts: StoreOptions<T>) {
    this.name = opts.name;
    let entry = registry.get(opts.name);
    if (!entry) {
      // 理论上 Worker 已先 hydrate；退化为内存空库（仍可工作，只是这次会话从空开始）。
      console.warn('[electron-store-shim] store used before hydrate:', opts.name);
      entry = { key: hexToBytes(opts.encryptionKey), data: {}, queue: Promise.resolve() };
      registry.set(opts.name, entry);
    }
    this.entry = entry;

    // electron-store 语义：defaults 仅补缺失的顶层键
    if (opts.defaults) {
      for (const k of Object.keys(opts.defaults)) {
        if (this.entry.data[k] === undefined) {
          this.entry.data[k] = (opts.defaults as any)[k];
        }
      }
    }
  }

  get(key: string, defaultValue?: any): any {
    const v = getPath(this.entry.data, key);
    return v === undefined ? defaultValue : v;
  }

  set(key: string | Partial<T>, value?: any): void {
    if (key !== null && typeof key === 'object') {
      for (const k of Object.keys(key)) setPath(this.entry.data, k, (key as any)[k]);
    } else {
      setPath(this.entry.data, key as string, value);
    }
    this.persist();
  }

  delete(key: string): void {
    deletePath(this.entry.data, key);
    this.persist();
  }

  has(key: string): boolean {
    return getPath(this.entry.data, key) !== undefined;
  }

  clear(): void {
    this.entry.data = {};
    this.persist();
  }

  get store(): T {
    return this.entry.data as T;
  }

  // 异步加密写回 IndexedDB；按库串行，避免并发事务竞争。失败仅告警（内存仍是最新）。
  private persist(): void {
    const { entry, name } = this;
    const snapshot = JSON.parse(JSON.stringify(entry.data));
    entry.queue = entry.queue
      .then(() => idbPut(name, encryptBlob(snapshot, entry.key)))
      .catch(err => console.warn('[electron-store-shim] persist failed for', name, err));
  }
}
