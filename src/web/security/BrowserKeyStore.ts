/**
 * 浏览器版密钥库，替代桌面端的 SecureKeyStore（后者依赖 Electron safeStorage / OS keychain，
 * 浏览器没有等价物）。
 *
 * 模型：
 *  - 一个「keyring」记录存在 IndexedDB，内含各库（identity/crypto/database/message-history）的
 *    per-store 主密钥（每个 32B，hex 字符串，喂给 electron-store-shim 的 encryptionKey）。
 *  - keyring 整体用「用户口令经 PBKDF2-SHA256(600k) 派生的主密钥 + AES-256-GCM」加密。
 *  - 解锁时输入口令 → 派生主密钥 → 解密 keyring → per-store 密钥载入内存。口令/派生密钥只在
 *    Web Worker 内处理，绝不发回 UI 线程。
 *
 * 安全说明（须在文档诚实告知）：浏览器无 OS keychain，私钥经此口令加密后落 IndexedDB，
 * 安全性弱于桌面版的 safeStorage；Web Worker 仅提供软隔离。
 *
 * 接口与 SecureKeyStore 对齐（getKey/setKey/deleteKey 均 async），额外提供 unlock/isInitialized。
 */

const DB_NAME = 'veilconnect-store';
const OBJ_STORE = 'kv';
const KEYRING_ID = '__keyring__';
const PBKDF2_ITERATIONS = 600_000;
const SALT_LEN = 16;
const IV_LEN = 12;
const PER_STORE_KEY_BYTES = 32;

// ---- IndexedDB（与 electron-store-shim 同库；indexedDB.open 幂等，可安全并存）----
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(OBJ_STORE)) {
        req.result.createObjectStore(OBJ_STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function idbGet(id: string): Promise<Uint8Array | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const req = db.transaction(OBJ_STORE, 'readonly').objectStore(OBJ_STORE).get(id);
    req.onsuccess = () => {
      const v = req.result;
      if (!v) return resolve(null);
      resolve(v instanceof Uint8Array ? v : new Uint8Array(v as ArrayBuffer));
    };
    req.onerror = () => reject(req.error);
  });
}

async function idbPut(id: string, bytes: Uint8Array): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(OBJ_STORE, 'readwrite');
    tx.objectStore(OBJ_STORE).put(bytes, id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// ---- 编码/派生工具 ----
function toHex(bytes: Uint8Array): string {
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function deriveMasterKey(passphrase: string, salt: Uint8Array): Promise<CryptoKey> {
  const baseKey = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(passphrase),
    'PBKDF2',
    false,
    ['deriveKey']
  );
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: salt as unknown as BufferSource, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

interface KeyringBlob {
  v: 1;
  salt: string; // base64
  iv: string;   // base64
  ct: string;   // base64 (AES-GCM 密文，含 authTag)
}

function b64encode(bytes: Uint8Array): string {
  let s = '';
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s);
}
function b64decode(b64: string): Uint8Array {
  const s = atob(b64);
  const out = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i);
  return out;
}

export class BrowserKeyStore {
  // 解锁后内存中的 per-store 密钥（name → hex）；以及当前会话的口令上下文（用于写回 keyring）。
  private static keys: Record<string, string> | null = null;
  private static masterKey: CryptoKey | null = null;
  private static salt: Uint8Array | null = null;

  /** 浏览器里是否已经创建过 keyring（决定 UI 显示「解锁」还是「设置口令」）。 */
  static async isInitialized(): Promise<boolean> {
    return (await idbGet(KEYRING_ID)) !== null;
  }

  /**
   * 用口令解锁（或首次创建）keyring。成功后 per-store 密钥载入内存，后续 getKey 同步可得。
   * @throws 口令错误（GCM 解密失败）时抛错。
   */
  static async unlock(passphrase: string): Promise<void> {
    const existing = await idbGet(KEYRING_ID);

    if (existing) {
      const blob: KeyringBlob = JSON.parse(new TextDecoder().decode(existing));
      const salt = b64decode(blob.salt);
      const iv = b64decode(blob.iv);
      const masterKey = await deriveMasterKey(passphrase, salt);
      let plain: ArrayBuffer;
      try {
        plain = await crypto.subtle.decrypt(
          { name: 'AES-GCM', iv: iv as unknown as BufferSource },
          masterKey,
          b64decode(blob.ct) as unknown as BufferSource
        );
      } catch {
        throw new Error('口令错误或 keyring 已损坏');
      }
      this.keys = JSON.parse(new TextDecoder().decode(plain));
      this.masterKey = masterKey;
      this.salt = salt;
    } else {
      // 首次：生成 salt + 主密钥，per-store 密钥惰性生成（首个 getKey 时补齐并写回）。
      const salt = crypto.getRandomValues(new Uint8Array(SALT_LEN));
      this.masterKey = await deriveMasterKey(passphrase, salt);
      this.salt = salt;
      this.keys = {};
      await this.persistKeyring();
    }
  }

  /** 是否已解锁（内存中持有 per-store 密钥）。 */
  static isUnlocked(): boolean {
    return this.keys !== null && this.masterKey !== null;
  }

  /** 锁定：清除内存中的密钥（不删除持久化数据）。 */
  static lock(): void {
    this.keys = null;
    this.masterKey = null;
    this.salt = null;
  }

  /**
   * 重置：清空本地全部数据（keyring + 各库），回到「未初始化」状态。
   * 用于「忘记口令」——旧身份不可恢复，清空后可用新口令重新创建身份。
   * 清空的是同一 IndexedDB 库的整个 kv 存储（含 electron-store-shim 写入的身份/密钥）。
   */
  static async reset(): Promise<void> {
    this.lock();
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(OBJ_STORE, 'readwrite');
      tx.objectStore(OBJ_STORE).clear();
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  /**
   * 取某库的 per-store 密钥；不存在则生成并写回 keyring（对齐 SecureKeyStore.getKey 的语义）。
   */
  static async getKey(name: string): Promise<string> {
    if (!this.keys || !this.masterKey) {
      throw new Error('BrowserKeyStore 未解锁，请先调用 unlock()');
    }
    if (!this.keys[name]) {
      this.keys[name] = toHex(crypto.getRandomValues(new Uint8Array(PER_STORE_KEY_BYTES)));
      await this.persistKeyring();
    }
    return this.keys[name];
  }

  static async setKey(name: string, value: string): Promise<void> {
    if (!this.keys) throw new Error('BrowserKeyStore 未解锁');
    this.keys[name] = value;
    await this.persistKeyring();
  }

  static async deleteKey(name: string): Promise<void> {
    if (!this.keys) throw new Error('BrowserKeyStore 未解锁');
    delete this.keys[name];
    await this.persistKeyring();
  }

  /** 修改解锁口令：用新口令重新派生主密钥并重写 keyring（per-store 密钥不变）。 */
  static async changePassphrase(newPassphrase: string): Promise<void> {
    if (!this.keys) throw new Error('BrowserKeyStore 未解锁');
    const salt = crypto.getRandomValues(new Uint8Array(SALT_LEN));
    this.masterKey = await deriveMasterKey(newPassphrase, salt);
    this.salt = salt;
    await this.persistKeyring();
  }

  private static async persistKeyring(): Promise<void> {
    if (!this.keys || !this.masterKey || !this.salt) throw new Error('keyring 状态不完整');
    const iv = crypto.getRandomValues(new Uint8Array(IV_LEN));
    const ct = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: iv as unknown as BufferSource },
      this.masterKey,
      new TextEncoder().encode(JSON.stringify(this.keys))
    );
    const blob: KeyringBlob = {
      v: 1,
      salt: b64encode(this.salt),
      iv: b64encode(iv),
      ct: b64encode(new Uint8Array(ct))
    };
    await idbPut(KEYRING_ID, new TextEncoder().encode(JSON.stringify(blob)));
  }
}
