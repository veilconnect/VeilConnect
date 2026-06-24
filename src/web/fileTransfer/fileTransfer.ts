/**
 * 文件传输：纯逻辑 + 加密原语（与 UI / WebRTC 解耦，便于单测）。
 *
 * 设计要点：
 * - 大文件【分块】经 DataChannel 传输，绝不整体塞进一条 JSON。
 * - 每个文件随机生成一把【一次性 AES-256-GCM 密钥】；该密钥 + 元数据经既有
 *   Double Ratchet 加密的控制消息发送（故密钥本身受端到端认证信道保护），
 *   随后用它对每个分块做 AES-GCM 加密（每块独立随机 IV + 认证标签）。
 * - 接收端重组后校验【字节数 + 全文件 SHA-256】，一致才算完成，杜绝静默损坏/截断。
 *
 * 本模块不引用 window / Worker，只用 globalThis.crypto.subtle，故可在 Node 测试环境直接跑。
 */

/**
 * 每个分块的明文大小（8 KiB）。AES-GCM 加 16B 标签、base64 +33%、再套 JSON 帧后，
 * 单条 DataChannel 消息约 ~11 KB，稳在 WebRTC 跨端互操作建议的 16 KiB 上限内。
 *
 * 为何不是更大：经 TURN（尤其 turns/TCP）中继时，>16 KiB 的单条 SCTP 消息会在中继路径上
 * 卡死（文本类小消息正常、大分块收不全）。直连(Chrome↔Chrome)虽可达 256 KiB，但默认
 * relayOnly 隐藏 IP 时必经中继，故按中继的安全上限取值，保证两种路径都可靠。
 */
export const DEFAULT_CHUNK_SIZE = 8 * 1024;

/** 单文件大小上限（100 MiB）。MVP 全量读入内存并算哈希，故设一个保守上限。 */
export const MAX_FILE_SIZE = 100 * 1024 * 1024;

/** AES-GCM 推荐 12 字节 IV。 */
const IV_BYTES = 12;

/** 经 Double Ratchet 控制消息下发的文件元数据 + 一次性密钥。 */
export interface FileOfferMeta {
  id: string;
  name: string;
  size: number;
  mime: string;
  chunkSize: number;
  totalChunks: number;
  /** 全文件明文的 SHA-256（hex），接收端重组后比对。 */
  hash: string;
  /** 一次性 AES-256-GCM 原始密钥（base64）。 */
  key: string;
}

/** 给定文件字节数与分块大小，算出分块总数（空文件按 1 块处理，便于统一收尾流程）。 */
export function chunkCount(size: number, chunkSize: number = DEFAULT_CHUNK_SIZE): number {
  if (!Number.isFinite(size) || size < 0) throw new Error('invalid size');
  if (!Number.isFinite(chunkSize) || chunkSize <= 0) throw new Error('invalid chunkSize');
  if (size === 0) return 1;
  return Math.ceil(size / chunkSize);
}

/** 取第 seq 块的字节范围 [start, end)（end 不超过总长度）。 */
export function chunkRange(seq: number, chunkSize: number, total: number): { start: number; end: number } {
  if (seq < 0) throw new Error('invalid seq');
  const start = seq * chunkSize;
  const end = Math.min(start + chunkSize, total);
  return { start, end: Math.max(start, end) };
}

/** MIME 是否为图片（用于收到后内联预览）。 */
export function isImageMime(mime: string | undefined | null): boolean {
  return typeof mime === 'string' && /^image\//i.test(mime.trim());
}

/** 人类可读体积，给 UI 用。 */
export function formatBytes(n: number): string {
  if (!Number.isFinite(n) || n < 0) return '—';
  if (n < 1024) return `${n} B`;
  const units = ['KB', 'MB', 'GB', 'TB'];
  let v = n / 1024;
  let i = 0;
  while (v >= 1024 && i < units.length - 1) { v /= 1024; i++; }
  const s = Number.isInteger(v) ? v.toString() : v.toFixed(v >= 10 ? 0 : 1);
  return `${s} ${units[i]}`;
}

// ---- base64 <-> 字节（btoa/atob 在 Node 20+ 与浏览器中均可用；分段避免大数组爆栈）----

export function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  const step = 0x8000; // 32K，避免 String.fromCharCode 参数过多
  for (let i = 0; i < bytes.length; i += step) {
    binary += String.fromCharCode(...bytes.subarray(i, i + step));
  }
  return btoa(binary);
}

export function base64ToBytes(b64: string): Uint8Array {
  const binary = atob(b64);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
  return out;
}

/** 拼接多个分块为单个 Uint8Array（按传入顺序）。 */
export function concatChunks(chunks: Uint8Array[]): Uint8Array {
  const total = chunks.reduce((n, c) => n + c.length, 0);
  const out = new Uint8Array(total);
  let off = 0;
  for (const c of chunks) { out.set(c, off); off += c.length; }
  return out;
}

/** 全文件明文的 SHA-256（hex）。 */
export async function sha256Hex(data: Uint8Array): Promise<string> {
  const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', data));
  let hex = '';
  for (const b of digest) hex += b.toString(16).padStart(2, '0');
  return hex;
}

/** 生成一次性 AES-256-GCM 密钥，返回 CryptoKey 与其 base64 原始密钥（用于经控制消息下发）。 */
export async function generateFileKey(): Promise<{ key: CryptoKey; raw: string }> {
  const key = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']);
  const raw = new Uint8Array(await crypto.subtle.exportKey('raw', key));
  return { key, raw: bytesToBase64(raw) };
}

/** 从 base64 原始密钥导入 AES-GCM 密钥（接收端用）。 */
export async function importFileKey(rawB64: string): Promise<CryptoKey> {
  const raw = base64ToBytes(rawB64);
  return crypto.subtle.importKey('raw', raw, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);
}

/** 用一次性密钥加密单个分块，随机 IV，返回 base64 的 iv + 密文（含 GCM 标签）。 */
export async function encryptChunk(key: CryptoKey, plain: Uint8Array): Promise<{ iv: string; data: string }> {
  const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES));
  const cipher = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, plain));
  return { iv: bytesToBase64(iv), data: bytesToBase64(cipher) };
}

/** 解密单个分块；IV 或标签不符（被篡改/损坏）时 subtle.decrypt 抛错。 */
export async function decryptChunk(key: CryptoKey, ivB64: string, dataB64: string): Promise<Uint8Array> {
  const iv = base64ToBytes(ivB64);
  const cipher = base64ToBytes(dataB64);
  return new Uint8Array(await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, cipher));
}

/**
 * 接收端分块重组簿记：纯逻辑（不碰密钥/网络），便于单测。
 * 记录已收到哪些 seq、避免重复计数，按序重组并报告完整性。
 */
export class ChunkAssembler {
  readonly totalChunks: number;
  private readonly chunks: (Uint8Array | undefined)[];
  private received = 0;

  constructor(totalChunks: number) {
    if (!Number.isInteger(totalChunks) || totalChunks <= 0) throw new Error('invalid totalChunks');
    this.totalChunks = totalChunks;
    this.chunks = new Array(totalChunks);
  }

  /** 加入第 seq 块；返回是否为「新」块（重复/越界返回 false，不影响计数）。 */
  add(seq: number, bytes: Uint8Array): boolean {
    if (!Number.isInteger(seq) || seq < 0 || seq >= this.totalChunks) return false;
    if (this.chunks[seq] !== undefined) return false;
    this.chunks[seq] = bytes;
    this.received++;
    return true;
  }

  get receivedCount(): number {
    return this.received;
  }

  /** 进度 0..1。 */
  get progress(): number {
    return this.received / this.totalChunks;
  }

  isComplete(): boolean {
    return this.received === this.totalChunks;
  }

  /** 仍缺失的 seq 列表（用于诊断）。 */
  missing(): number[] {
    const out: number[] = [];
    for (let i = 0; i < this.totalChunks; i++) if (this.chunks[i] === undefined) out.push(i);
    return out;
  }

  /** 按序拼接为完整字节；尚未收齐则抛错。 */
  assemble(): Uint8Array {
    if (!this.isComplete()) throw new Error('not complete');
    return concatChunks(this.chunks as Uint8Array[]);
  }
}
