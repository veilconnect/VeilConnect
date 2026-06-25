/**
 * 异步文件(网盘式)——「链接即密钥」端到端加密的暂存上传/下载，【流式分块】版(VCB2)。
 *
 * 模型(用户选定 A 方案):发送方本地用随机密钥加密文件 → 上传【密文】到 R2(经信令 Worker)→
 * 把密钥放进分享链接的 #片段(`#dl=<id>&k=<密钥>`),**绝不发给服务器**。接收方打开链接 →
 * 下载密文 → 用片段里的密钥本地解密。可异步(对方不在线也能下),不需事先交换身份。
 *
 * 为什么流式分块(相对早先 VCB1 的"整文件一次性"):
 *  - 大文件不再【整体读入内存】——发送端按片读+逐块加密+流式上传;Worker 把请求体直接流给 R2
 *    (不再 request.arrayBuffer(),不会 OOM);接收端逐块解密、可边解边写盘。
 *  - 因此支持几百 MB ~ GB 级,且不经 P2P 中继(走服务器带宽,通常快得多),对方离线也能收。
 *
 * 安全边界(务必读懂):
 *  - 服务器只存【密文 + 大小/过期】,无密钥解不开;文件名/类型也加密在头里,不暴露给服务器。
 *  - 密钥在链接 #片段(浏览器不会把 # 后内容发给服务器)。谁拿到完整链接谁能解——与"链接+提取码"
 *    同性质,链接务必经可信渠道发。
 *  - 可选「提取密码」:内容密钥 = HKDF(链接随机密钥, 密码)。链接泄露但密码未泄露时仍安全。
 *  - blob 有 TTL(服务器侧)自动过期删除。
 *
 * 容器格式 VCB2(纯字节,流式):
 *   magic 'VCB2'(4) | headerLen(4,uint32 BE) | headerIv(12)+headerCipher
 *   随后重复 totalChunks 次: chunkLen(4,uint32 BE) | chunkIv(12)+chunkCipher
 *   - headerCipher = AES-GCM(JSON{name,mime,size,chunkSize,totalChunks}, AAD='VCB2:hdr')
 *   - 第 i 块 chunkCipher = AES-GCM(明文片, AAD=uint32BE(i)) —— AAD 绑定块序,防重排/重放;
 *     header 里的 totalChunks/size 在解密后校验,防截断。
 *
 * 纯逻辑(打包/解包/派生/链接)只用 globalThis.crypto.subtle,可在 Node 测试环境直接跑;
 * upload/download 用 fetch + ReadableStream(浏览器)。
 */

// blob 端点基址:自部署默认同源('');托管版构建期注入 __VC_BLOB_BASE__ 指向独立 Worker(R2)。
declare const __VC_BLOB_BASE__: string | undefined;
function blobBase(explicit?: string): string {
  if (explicit) return explicit;
  try { if (typeof __VC_BLOB_BASE__ === 'string' && __VC_BLOB_BASE__) return __VC_BLOB_BASE__; } catch { /* 未注入 */ }
  return '';
}

const MAGIC = new Uint8Array([0x56, 0x43, 0x42, 0x32]); // 'VCB2'
const IV_LEN = 12;
const RAW_KEY_BYTES = 32;
/** 每块明文大小(1 MiB)。流式:每次只在内存里持有一块。 */
export const STREAM_CHUNK_SIZE = 1024 * 1024;
const HEADER_AAD = new TextEncoder().encode('VCB2:hdr');
const enc = new TextEncoder();
const dec = new TextDecoder();

// —— base64url(链接安全,无 +/=)——
export function toB64url(bytes: Uint8Array): string {
  let s = ''; for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
export function fromB64url(str: string): Uint8Array {
  const s = str.replace(/-/g, '+').replace(/_/g, '/');
  const pad = s.length % 4 ? '='.repeat(4 - (s.length % 4)) : '';
  const bin = atob(s + pad);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

/** 生成链接随机密钥(32B)。 */
export function generateRawKey(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(RAW_KEY_BYTES));
}

/**
 * 由「链接随机密钥」(+可选提取密码)派生 AES-GCM 内容密钥。
 * 无密码:直接用随机密钥;有密码:HKDF-SHA256(ikm=随机密钥, info=密码) → 链接+密码两者齐备才解得开。
 */
export async function deriveContentKey(raw: Uint8Array, password?: string): Promise<CryptoKey> {
  if (!password) {
    return crypto.subtle.importKey('raw', raw as unknown as BufferSource, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);
  }
  const ikm = await crypto.subtle.importKey('raw', raw as unknown as BufferSource, 'HKDF', false, ['deriveKey']);
  return crypto.subtle.deriveKey(
    { name: 'HKDF', hash: 'SHA-256', salt: enc.encode('veilconnect-blob-v1') as unknown as BufferSource, info: enc.encode(password) as unknown as BufferSource },
    ikm, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']
  );
}

// —— 小工具 ——
function u32be(n: number): Uint8Array {
  const b = new Uint8Array(4); new DataView(b.buffer).setUint32(0, n >>> 0, false); return b;
}
async function gcmEnc(key: CryptoKey, plain: Uint8Array, aad: Uint8Array): Promise<Uint8Array> {
  const iv = crypto.getRandomValues(new Uint8Array(IV_LEN));
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv: iv as unknown as BufferSource, additionalData: aad as unknown as BufferSource }, key, plain as unknown as BufferSource));
  const out = new Uint8Array(IV_LEN + ct.length); out.set(iv, 0); out.set(ct, IV_LEN);
  return out;
}
async function gcmDec(key: CryptoKey, ivPlusCt: Uint8Array, aad: Uint8Array): Promise<Uint8Array> {
  const iv = ivPlusCt.subarray(0, IV_LEN);
  const ct = ivPlusCt.subarray(IV_LEN);
  return new Uint8Array(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: iv as unknown as BufferSource, additionalData: aad as unknown as BufferSource }, key, ct as unknown as BufferSource));
}

export interface BlobMeta { name: string; mime: string; size: number; chunkSize: number; totalChunks: number; }

/** 估算 VCB2 容器总字节数(用于上报给服务器做大小上限判断)。 */
export function estimateContainerSize(fileSize: number, headerPlainLen: number, chunkSize = STREAM_CHUNK_SIZE): number {
  const totalChunks = fileSize === 0 ? 0 : Math.ceil(fileSize / chunkSize);
  const headerFrame = 4 + IV_LEN + (headerPlainLen + 16);
  let body = 0;
  for (let i = 0; i < totalChunks; i++) {
    const plain = Math.min(chunkSize, fileSize - i * chunkSize);
    body += 4 + IV_LEN + plain + 16;
  }
  return MAGIC.length + headerFrame + body;
}

// —— 流式上传:把 File 编码成 VCB2 字节流(逐块读+加密),作为 fetch 的请求体 ——
export function buildUploadStream(file: File, key: CryptoKey): ReadableStream<Uint8Array> {
  const chunkSize = STREAM_CHUNK_SIZE;
  const totalChunks = file.size === 0 ? 0 : Math.ceil(file.size / chunkSize);
  const meta: BlobMeta = { name: file.name || 'file', mime: file.type || 'application/octet-stream', size: file.size, chunkSize, totalChunks };
  async function* gen(): AsyncGenerator<Uint8Array> {
    yield MAGIC;
    const headerFrame = await gcmEnc(key, enc.encode(JSON.stringify(meta)), HEADER_AAD);
    yield u32be(headerFrame.length);
    yield headerFrame;
    for (let i = 0; i < totalChunks; i++) {
      const start = i * chunkSize;
      const slice = new Uint8Array(await file.slice(start, Math.min(start + chunkSize, file.size)).arrayBuffer());
      const frame = await gcmEnc(key, slice, u32be(i));
      yield u32be(frame.length);
      yield frame;
    }
  }
  const it = gen();
  return new ReadableStream<Uint8Array>({
    async pull(controller) {
      const { value, done } = await it.next();
      if (done) controller.close();
      else controller.enqueue(value);
    }
  });
}

/** 按需读取字节流的小工具:从 ReadableStream 读出恰好 n 字节(跨网络分片拼接),不足返回 null。 */
class ByteStreamReader {
  private reader: ReadableStreamDefaultReader<Uint8Array>;
  private queue: Uint8Array[] = [];
  private qlen = 0;
  private done = false;
  constructor(stream: ReadableStream<Uint8Array>) { this.reader = stream.getReader(); }
  async readExact(n: number): Promise<Uint8Array | null> {
    while (this.qlen < n && !this.done) {
      const { value, done } = await this.reader.read();
      if (done) { this.done = true; } else if (value && value.length) { this.queue.push(value); this.qlen += value.length; }
    }
    if (this.qlen < n) return null;
    const out = new Uint8Array(n); let off = 0;
    while (off < n) {
      const head = this.queue[0];
      const take = Math.min(head.length, n - off);
      out.set(head.subarray(0, take), off); off += take;
      if (take === head.length) this.queue.shift(); else this.queue[0] = head.subarray(take);
      this.qlen -= take;
    }
    return out;
  }
  async readU32(): Promise<number | null> {
    const b = await this.readExact(4);
    return b ? new DataView(b.buffer, b.byteOffset).getUint32(0, false) : null;
  }
}

/** 上传 VCB2 流,返回 { id, expiresAt }。declaredBytes=明文文件大小(供服务器做上限判断)。 */
export async function uploadBlobStream(file: File, key: CryptoKey, baseUrl?: string): Promise<{ id: string; expiresAt: number }> {
  const body = buildUploadStream(file, key);
  const init: RequestInit & { duplex?: string } = {
    method: 'POST',
    headers: { 'Content-Type': 'application/octet-stream', 'X-VC-Declared-Bytes': String(file.size) },
    body: body as unknown as BodyInit,
    duplex: 'half' // 流式请求体必需(Chromium 支持)
  };
  const r = await fetch(`${blobBase(baseUrl)}/blob`, init);
  if (!r.ok) throw new Error(`upload failed: ${r.status}`);
  return r.json();
}

// —— 分享链接 ——
/** 构造分享链接:密钥放 #片段(不发服务器);needsPassword 时附 p=1。 */
export function buildShareLink(baseUrl: string, id: string, rawKey: Uint8Array, needsPassword: boolean): string {
  const base = baseUrl.replace(/[#?].*$/, '').replace(/\/$/, '');
  return `${base}/#dl=${id}&k=${toB64url(rawKey)}${needsPassword ? '&p=1' : ''}`;
}
/** 从 location.hash 解析下载参数。 */
export function parseShareHash(hash: string): { id: string; rawKey: Uint8Array; needsPassword: boolean } | null {
  try {
    const h = hash.includes('#') ? hash.slice(hash.indexOf('#') + 1) : hash;
    const p = new URLSearchParams(h);
    const id = p.get('dl'); const k = p.get('k');
    if (!id || !k || !/^[a-f0-9]{32}$/.test(id)) return null;
    return { id, rawKey: fromB64url(k), needsPassword: p.get('p') === '1' };
  } catch { return null; }
}

/**
 * 托管版(Cloudflare)单次上传上限:Cloudflare Workers 请求体上限 100MB,故卡在 95MB 给余量。
 * 自部署(同源 Node)不受此限(由 Node 服务器自身 BLOB_MAX_MB 控制),故仅在指向独立 Worker 时生效。
 */
export const HOSTED_BLOB_MAX_BYTES = 95 * 1024 * 1024;
export class BlobTooLargeError extends Error { constructor() { super('blob-too-large'); this.name = 'BlobTooLargeError'; } }

/** 一步:流式加密 + 上传 File → 返回分享链接。 */
export async function shareFile(file: File, opts: { origin: string; baseUrl?: string; password?: string }): Promise<{ link: string; id: string; expiresAt: number }> {
  if (blobBase(opts.baseUrl) && file.size > HOSTED_BLOB_MAX_BYTES) throw new BlobTooLargeError();
  const raw = generateRawKey();
  const key = await deriveContentKey(raw, opts.password);
  const { id, expiresAt } = await uploadBlobStream(file, key, opts.baseUrl || '');
  return { link: buildShareLink(opts.origin, id, raw, !!opts.password), id, expiresAt };
}

/**
 * 流式下载 + 解密 VCB2。
 * sink 提供时逐块写出(用于边解边写盘,适合大文件),返回 { meta };
 * 不提供时在内存累积成 Blob 返回 { meta, blob }(适合中小文件)。
 * 密钥/密码错误、被篡改、块缺失/重排、大小不符都会抛错。
 */
export async function receiveFile(
  id: string,
  rawKey: Uint8Array,
  opts: { baseUrl?: string; password?: string; sink?: (bytes: Uint8Array) => Promise<void> | void; onProgress?: (received: number, total: number) => void }
): Promise<{ meta: BlobMeta; blob?: Blob }> {
  const key = await deriveContentKey(rawKey, opts.password);
  const r = await fetch(`${blobBase(opts.baseUrl)}/blob/${id}`);
  if (!r.ok || !r.body) throw new Error(`download failed: ${r.status}`);
  return decodeBlobStream(r.body, key, opts);
}

/** 解析并解密一条 VCB2 字节流(与网络解耦,便于单测)。语义同 receiveFile。 */
export async function decodeBlobStream(
  stream: ReadableStream<Uint8Array>,
  key: CryptoKey,
  opts: { sink?: (bytes: Uint8Array) => Promise<void> | void; onProgress?: (received: number, total: number) => void } = {}
): Promise<{ meta: BlobMeta; blob?: Blob }> {
  const sr = new ByteStreamReader(stream);

  const magic = await sr.readExact(4);
  if (!magic || magic[0] !== MAGIC[0] || magic[1] !== MAGIC[1] || magic[2] !== MAGIC[2] || magic[3] !== MAGIC[3]) {
    throw new Error('Not a VeilConnect blob (VCB2)');
  }
  const headerLen = await sr.readU32();
  if (headerLen === null || headerLen <= 0 || headerLen > 1 << 20) throw new Error('bad header');
  const headerFrame = await sr.readExact(headerLen);
  if (!headerFrame) throw new Error('truncated header');
  const meta = JSON.parse(dec.decode(await gcmDec(key, headerFrame, HEADER_AAD))) as BlobMeta; // 密钥错→GCM 抛错
  if (!meta || typeof meta.totalChunks !== 'number' || typeof meta.size !== 'number') throw new Error('bad meta');

  const parts: Uint8Array[] = [];
  let received = 0;
  for (let i = 0; i < meta.totalChunks; i++) {
    const len = await sr.readU32();
    if (len === null || len <= IV_LEN || len > meta.chunkSize + IV_LEN + 64) throw new Error('truncated/oversized chunk');
    const frame = await sr.readExact(len);
    if (!frame) throw new Error('truncated chunk');
    const plain = await gcmDec(key, frame, u32be(i)); // AAD=i 绑定块序;错位/篡改即抛错
    received += plain.length;
    if (opts.sink) await opts.sink(plain); else parts.push(plain);
    opts.onProgress?.(received, meta.size);
  }
  if (received !== meta.size) throw new Error('size mismatch (truncated)');

  if (opts.sink) return { meta };
  // 安全：Blob 一律标为 application/octet-stream，绝不用对端可控的 meta.mime。
  // 否则 text/html 文件经 URL.createObjectURL 得到本源 blob: URL，手动导航即可在应用源执行脚本
  // （存储型 XSS，可窃取本地身份/密钥）。真实 mime 仍保留在 meta.mime 供 UI 展示/另存判断。
  return { meta, blob: new Blob(parts as unknown as BlobPart[], { type: 'application/octet-stream' }) };
}
