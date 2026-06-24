/**
 * 异步文件(网盘式)——「链接即密钥」端到端加密的暂存上传/下载。
 *
 * 模型(用户选定 A 方案):发送方本地用随机密钥加密文件 → 上传【密文】到信令服务器的 blob 存储 →
 * 把密钥放进分享链接的 #片段(`#dl=<id>&k=<密钥>`),**绝不发给服务器**。接收方打开链接 →
 * 下载密文 → 用片段里的密钥本地解密。可异步(对方不在线也能下),不需事先交换身份。
 *
 * 安全边界(务必读懂):
 *  - 服务器只存【密文 + 大小/时间元数据】,无密钥解不开;文件名/类型也加密在容器里,不暴露给服务器。
 *  - 密钥在链接 #片段(浏览器不会把 # 后的内容发给服务器)。但**谁拿到完整链接谁能解**——
 *    与百度网盘"链接+提取码"同性质,链接务必经可信渠道发。
 *  - 可选「提取密码」:设了密码后,真正的内容密钥 = HKDF(链接随机密钥, 密码)。这样链接泄露但密码未泄露时仍安全。
 *  - blob 有 TTL(服务器侧,默认 24h)会自动过期删除。
 *
 * 容器格式(纯字节):magic 'VCB1'(4) | metaBlockLen(4, uint32 BE) | metaIv(12)+metaCipher | fileIv(12)+fileCipher
 *   metaCipher = AES-GCM(JSON{name,mime,size,sha256})  fileCipher = AES-GCM(明文文件字节)
 *
 * 纯逻辑(pack/unpack/派生/链接)不引用 window,只用 globalThis.crypto.subtle,可在 Node 测试环境直接跑;
 * upload/download 用 fetch(浏览器)。
 */

// blob 端点基址:自部署默认同源('');托管版构建期注入 __VC_BLOB_BASE__ 指向独立 Worker(R2)。
declare const __VC_BLOB_BASE__: string | undefined;
function blobBase(explicit?: string): string {
  if (explicit) return explicit;
  try { if (typeof __VC_BLOB_BASE__ === 'string' && __VC_BLOB_BASE__) return __VC_BLOB_BASE__; } catch { /* 未注入 */ }
  return '';
}

const MAGIC = new Uint8Array([0x56, 0x43, 0x42, 0x31]); // 'VCB1'
const IV_LEN = 12;
const RAW_KEY_BYTES = 32;
/** 设了提取密码时的 KDF 轮数(密码可能弱,作纵深;链接随机密钥本身已 256bit)。 */
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

async function sha256hex(bytes: Uint8Array): Promise<string> {
  const d = new Uint8Array(await crypto.subtle.digest('SHA-256', bytes as unknown as BufferSource));
  return Array.from(d).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function gcmEnc(key: CryptoKey, plain: Uint8Array): Promise<Uint8Array> {
  const iv = crypto.getRandomValues(new Uint8Array(IV_LEN));
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv: iv as unknown as BufferSource }, key, plain as unknown as BufferSource));
  const out = new Uint8Array(IV_LEN + ct.length); out.set(iv, 0); out.set(ct, IV_LEN);
  return out;
}
async function gcmDec(key: CryptoKey, ivPlusCt: Uint8Array): Promise<Uint8Array> {
  const iv = ivPlusCt.subarray(0, IV_LEN);
  const ct = ivPlusCt.subarray(IV_LEN);
  return new Uint8Array(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: iv as unknown as BufferSource }, key, ct as unknown as BufferSource));
}

export interface BlobMeta { name: string; mime: string; size: number; sha256: string; }

/** 把文件字节 + 元数据打包成加密容器(上传用)。 */
export async function packBlob(fileBytes: Uint8Array, name: string, mime: string, key: CryptoKey): Promise<Uint8Array> {
  const meta: BlobMeta = { name, mime: mime || 'application/octet-stream', size: fileBytes.length, sha256: await sha256hex(fileBytes) };
  const metaBlock = await gcmEnc(key, enc.encode(JSON.stringify(meta)));
  const fileBlock = await gcmEnc(key, fileBytes);
  const out = new Uint8Array(4 + 4 + metaBlock.length + fileBlock.length);
  out.set(MAGIC, 0);
  new DataView(out.buffer).setUint32(4, metaBlock.length, false);
  out.set(metaBlock, 8);
  out.set(fileBlock, 8 + metaBlock.length);
  return out;
}

/** 解开加密容器(下载后用):解密元数据 + 文件,并校验 SHA-256。密钥/密码错误或被篡改即抛错。 */
export async function unpackBlob(container: Uint8Array, key: CryptoKey): Promise<{ meta: BlobMeta; bytes: Uint8Array }> {
  if (container.length < 8 || container[0] !== MAGIC[0] || container[1] !== MAGIC[1] || container[2] !== MAGIC[2] || container[3] !== MAGIC[3]) {
    throw new Error('Not a VeilConnect blob');
  }
  const metaLen = new DataView(container.buffer, container.byteOffset).getUint32(4, false);
  const metaBlock = container.subarray(8, 8 + metaLen);
  const fileBlock = container.subarray(8 + metaLen);
  const meta = JSON.parse(dec.decode(await gcmDec(key, metaBlock))) as BlobMeta;   // 密钥错→GCM 抛错
  const bytes = await gcmDec(key, fileBlock);
  if (bytes.length !== meta.size || (await sha256hex(bytes)) !== meta.sha256) {
    throw new Error('Integrity check failed');
  }
  return { meta, bytes };
}

// —— 分享链接 ——
/** 构造分享链接:密钥放 #片段(不发服务器);needsPassword 时附 p=1 让接收方知道要输密码。 */
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

// —— 浏览器侧:上传 / 下载 ——
/** 上传密文容器,返回 { id, expiresAt }。baseUrl 默认同源。 */
export async function uploadBlob(container: Uint8Array, baseUrl?: string): Promise<{ id: string; size: number; expiresAt: number }> {
  const r = await fetch(`${blobBase(baseUrl)}/blob`, { method: 'POST', headers: { 'Content-Type': 'application/octet-stream' }, body: container as unknown as BodyInit });
  if (!r.ok) throw new Error(`upload failed: ${r.status}`);
  return r.json();
}
/** 下载密文容器。 */
export async function downloadBlob(id: string, baseUrl?: string): Promise<Uint8Array> {
  const r = await fetch(`${blobBase(baseUrl)}/blob/${id}`);
  if (!r.ok) throw new Error(`download failed: ${r.status}`);
  return new Uint8Array(await r.arrayBuffer());
}

/** 一步:加密文件 → 上传 → 返回分享链接。 */
export async function shareFile(file: File, opts: { origin: string; baseUrl?: string; password?: string }): Promise<{ link: string; id: string; expiresAt: number }> {
  const raw = generateRawKey();
  const key = await deriveContentKey(raw, opts.password);
  const bytes = new Uint8Array(await file.arrayBuffer());
  const container = await packBlob(bytes, file.name || 'file', file.type, key);
  const { id, expiresAt } = await uploadBlob(container, opts.baseUrl || '');
  return { link: buildShareLink(opts.origin, id, raw, !!opts.password), id, expiresAt };
}

/** 一步:下载 → 解密 → 返回 { meta, blob }。 */
export async function receiveFile(id: string, rawKey: Uint8Array, opts: { baseUrl?: string; password?: string }): Promise<{ meta: BlobMeta; blob: Blob }> {
  const key = await deriveContentKey(rawKey, opts.password);
  const container = await downloadBlob(id, opts.baseUrl || '');
  const { meta, bytes } = await unpackBlob(container, key);
  return { meta, blob: new Blob([bytes], { type: meta.mime }) };
}
