/**
 * 配对码（Pairing Code）—— 基于「双方预共享的高熵配对码」的自动抗 MITM 认证。
 *
 * 背景与定位（务必读懂，避免误用）：
 *  - 现有抗 MITM 的唯一防线是用户**手动**核对 20 位安全码（SAS，见 safetyCode.ts）。现实中几乎没人核对。
 *  - 本模块提供一种**密码学自动**的替代：双方在带外（当面/电话/另一可信渠道）共享一个**系统生成的高熵配对码**，
 *    握手时各自证明「知道同一个码」，并把证明**绑定到本端实际观测到的会话密钥**。
 *  - 若存在主动中间人（含作恶信令服务器），两端观测到的身份/棘轮公钥不同 → transcript 不同 → 证明互不匹配 →
 *    自动判定为中间人并断开。**不再依赖用户肉眼核对**。
 *
 * 为什么必须是「系统生成的高熵码」而非「用户自定义密码」（与 Codex/GPT-5.5 研讨一致）：
 *  - 本方案不是 PAKE。中间人能同时看到两端发出的 proof，因此**可对配对码做离线字典爆破**。
 *  - 唯有当码本身是高熵（此处 128bit）时离线爆破才不现实。**切勿**把它降级成用户随手输入的弱口令——
 *    那需要真正的 PAKE（SPAKE2/CPace）才安全。UI 文案因此称其为「配对码」而非「密码」。
 *
 * 为什么 transcript 只绑定密钥、不绑定 DTLS 指纹：
 *  - 端到端加密实际由 Double Ratchet 提供，会话密钥源自双方的「棘轮身份公钥」，且该公钥由长期 Ed25519 身份签名绑定。
 *  - 主动中间人若想读明文，必须用**自己的**身份+棘轮公钥分别冒充两端（无法转发真公钥，否则解不开棘轮）。
 *    这恰好使两端观测到的公钥不同 → transcript 不同。绑定这些公钥已足以检测 MITM，无需解析 SDP 取 DTLS 指纹。
 *
 * 协议（commit-then-reveal，抗反射/顺序自适应）：
 *   1. 双方在 hello 交换身份与棘轮公钥后，各自构造**相同**的 transcript（对双方三元组排序，故与谁是 host 无关）。
 *   2. proof 按角色绑定：myProof = HMAC(codeKey, transcript | myRole)，myRole ∈ {A,B} 由排序结果确定。
 *   3. 先交换 commit = SHA-256(proof)，待收到对端 commit 后再 reveal 自己的 proof。
 *   4. 收到对端 reveal：校验 SHA-256(peerProof)==peerCommit，再用本端算出的「对端角色 proof」常量时间比对。
 *      一致 → 配对成功，放行内容；不一致 → 配对码错误或存在中间人 → 立即断开、不展示任何内容。
 *
 * 本模块为纯逻辑：不引用 window / Worker / React，只用 globalThis.crypto.subtle，可在 Node 测试环境直接跑。
 */

/** 协议版本 / KDF 域分隔标签（参与 KDF salt 与 transcript，换版本即不互通，防跨协议重放）。 */
export const PAIRING_VERSION = 'veilconnect-pairing-v1';

/** 配对码原始熵：16 字节 = 128 bit。高熵是本方案安全性的前提（见文件头注）。 */
export const PAIRING_CODE_BYTES = 16;

/**
 * 配对码 KDF 迭代轮数。配对码本身已是 128bit 高熵，离线爆破不现实，
 * 故此处迭代仅作纵深防御（兼顾用户误把它当口令用的边缘情况），取适中值。
 */
export const PAIRING_PBKDF2_ITERATIONS = 200_000;

/**
 * 配对码最小长度（= 生成长度 26）。短于此即视为低熵弱码并拒绝，
 * 防止本模块被误当「用户口令」API 复用（弱口令场景需 PAKE，非本方案）。
 */
export const MIN_PAIRING_CODE_LENGTH = 26;

/** 一次性 nonce 字节数（绑定进 transcript 以防旧 proof 重放）。 */
export const PAIRING_NONCE_BYTES = 16;

/** 去歧义 Base32 字母表（Crockford 风格，去掉 I L O U）。 */
const BASE32_ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

/**
 * transcript / proof 各字段间的分隔符。选 '|'：它既不在去歧义 Base32 字母表内，也不在 base64 字母表
 * （A-Za-z0-9+/=）内，故无论拼接公钥（base64）还是配对码片段都不会产生边界歧义。
 */
const SEP = '|';

const enc = new TextEncoder();

function base32Encode(bytes: Uint8Array): string {
  let bits = 0;
  let value = 0;
  let out = '';
  for (const b of bytes) {
    value = (value << 8) | b;
    bits += 8;
    while (bits >= 5) {
      out += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) out += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  return out;
}

function bytesToBase64(bytes: Uint8Array): string {
  let s = '';
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s);
}

/**
 * 生成一个高熵配对码（128bit），以去歧义 Base32 表示（26 个字符）。
 * 仅返回归一化（无分隔符、大写）形式；展示分组用 groupPairingCode。
 */
export function generatePairingCode(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(PAIRING_CODE_BYTES));
  return base32Encode(bytes);
}

/** 每 4 个字符插入一个连字符，便于人眼/口头核对（"ABCD-EFGH-…"）。 */
export function groupPairingCode(code: string): string {
  return normalizePairingCode(code).replace(/(.{4})(?=.)/g, '$1-');
}

/** 生成一次性 nonce（base64）。每端每会话各生成一个，经 hello 交换并纳入 transcript，防旧 proof 重放。 */
export function generateNonce(): string {
  return bytesToBase64(crypto.getRandomValues(new Uint8Array(PAIRING_NONCE_BYTES)));
}

/** 配对码是否达到高熵长度要求（归一化后 ≥ MIN_PAIRING_CODE_LENGTH）。供 UI 与本模块拒绝弱码。 */
export function isValidPairingCode(code: string): boolean {
  return normalizePairingCode(code).length >= MIN_PAIRING_CODE_LENGTH;
}

/**
 * 归一化用户输入：转大写、去除非字母数字分隔符、纠正常见易混字符（I/L→1, O→0, U→V），
 * 仅保留字母表内字符。幂等。用户抄错会在比对阶段失败（重输即可），这里只做无歧义的规整。
 */
export function normalizePairingCode(input: string): string {
  return (input || '')
    .toUpperCase()
    .replace(/[IL]/g, '1')
    .replace(/O/g, '0')
    .replace(/U/g, 'V')
    .split('')
    .filter(ch => BASE32_ALPHABET.includes(ch))
    .join('');
}

/** 由配对码派生 HMAC-SHA256 密钥（PBKDF2，salt 绑定协议版本标签）。 */
export async function derivePairingKey(code: string): Promise<CryptoKey> {
  const normalized = normalizePairingCode(code);
  const baseKey = await crypto.subtle.importKey(
    'raw',
    enc.encode(normalized),
    'PBKDF2',
    false,
    ['deriveKey']
  );
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: enc.encode(`${PAIRING_VERSION}${SEP}salt`) as unknown as BufferSource,
      iterations: PAIRING_PBKDF2_ITERATIONS,
      hash: 'SHA-256'
    },
    baseKey,
    { name: 'HMAC', hash: 'SHA-256', length: 256 },
    false,
    ['sign']
  );
}

/** 单方在握手中观测到的密钥与一次性 nonce（公钥均为 base64）。 */
export interface PartyKeys {
  /** Ed25519 长期身份公钥 */
  identityKey: string;
  /** X25519 加密（box）公钥 */
  boxKey: string;
  /** Double Ratchet 身份公钥 */
  ratchetKey: string;
  /** 本端本会话一次性 nonce（base64），防旧 proof 重放 */
  nonce: string;
}

export interface TranscriptResult {
  /** 双方共同、与顺序无关的 transcript 字符串 */
  transcript: string;
  /** 本端在排序后的角色（'A' = 排序在前者） */
  selfRole: 'A' | 'B';
  /** 对端角色（与 selfRole 相反） */
  peerRole: 'A' | 'B';
}

function partyTuple(p: PartyKeys): string {
  // base64 不含 SEP（'|'），故拼接无歧义；身份+box+棘轮+nonce 绑在同一元组内防中间人跨元组拆换、防重放。
  return `${p.identityKey}${SEP}${p.boxKey}${SEP}${p.ratchetKey}${SEP}${p.nonce}`;
}

/**
 * 构造与顺序无关的 transcript：对「本端三元组」与「对端三元组」整体排序后拼接，
 * 因此 host/guest 两端算出的 transcript 完全相同；同时把每个 box/ratchet 公钥与其所属身份公钥**绑在同一元组内**，
 * 防止中间人在元组之间拆换密钥。返回本端/对端角色，供 role-bound proof 使用。
 */
export function buildTranscript(self: PartyKeys, peer: PartyKeys): TranscriptResult {
  const selfTuple = partyTuple(self);
  const peerTuple = partyTuple(peer);
  const selfIsFirst = selfTuple <= peerTuple;
  const [first, second] = selfIsFirst ? [selfTuple, peerTuple] : [peerTuple, selfTuple];
  return {
    transcript: `${PAIRING_VERSION}${SEP}${first}${SEP}${second}`,
    selfRole: selfIsFirst ? 'A' : 'B',
    peerRole: selfIsFirst ? 'B' : 'A'
  };
}

/** 角色绑定的 proof = base64(HMAC-SHA256(codeKey, transcript | role))。role 前加 SEP 以免与 base64 末字符歧义。 */
export async function computeProof(key: CryptoKey, transcript: string, role: 'A' | 'B'): Promise<string> {
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(`${transcript}${SEP}${role}`));
  return bytesToBase64(new Uint8Array(sig));
}

/** proof 的承诺值 = base64(SHA-256(proof))，commit-then-reveal 用。 */
export async function commitProof(proof: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', enc.encode(proof));
  return bytesToBase64(new Uint8Array(digest));
}

/**
 * 内容门禁的唯一真值来源：配对模式（pairRequired）只认 pairVerified；
 * 否则认手动核对的 SAS（sasConfirmed）。任一路径未达成即不放行（fail-closed）。
 * 抽成纯函数以便单测，避免门禁逻辑在多处各写一份导致两条路径互相绕过。
 */
export function contentGateOpen(pairRequired: boolean, pairVerified: boolean, sasConfirmed: boolean): boolean {
  return pairRequired ? pairVerified : sasConfirmed;
}

/** 常量时间字符串比较（避免计时侧信道）。长度不等直接 false。 */
export function constantTimeEqual(a: string, b: string): boolean {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/**
 * 一步备好本端握手所需材料：transcript、本端 proof 与其 commit、用于校验对端的「对端角色 proof」。
 * 调用方流程：先发 myCommit；收到对端 commit 后发 myProof；收到对端 proof 时
 * 先校验 commit（commitProof(peerProof)==对端 commit），再 constantTimeEqual(peerProof, expectedPeerProof)。
 */
export interface PairingMaterials {
  transcript: string;
  selfRole: 'A' | 'B';
  peerRole: 'A' | 'B';
  myProof: string;
  myCommit: string;
  expectedPeerProof: string;
}

export async function preparePairing(code: string, self: PartyKeys, peer: PartyKeys): Promise<PairingMaterials> {
  if (!isValidPairingCode(code)) {
    throw new Error(`Pairing code too short (min ${MIN_PAIRING_CODE_LENGTH} chars)`);
  }
  const key = await derivePairingKey(code);
  const { transcript, selfRole, peerRole } = buildTranscript(self, peer);
  const myProof = await computeProof(key, transcript, selfRole);
  const [myCommit, expectedPeerProof] = await Promise.all([
    commitProof(myProof),
    computeProof(key, transcript, peerRole)
  ]);
  return { transcript, selfRole, peerRole, myProof, myCommit, expectedPeerProof };
}

/**
 * 校验对端的 reveal：commit 绑定 + 常量时间比对。任一不符即视为「配对码错误或存在中间人」。
 */
export async function verifyPeerReveal(
  materials: Pick<PairingMaterials, 'expectedPeerProof'>,
  peerCommit: string,
  peerProof: string
): Promise<boolean> {
  const recomputedCommit = await commitProof(peerProof);
  if (!constantTimeEqual(recomputedCommit, peerCommit)) return false;
  return constantTimeEqual(peerProof, materials.expectedPeerProof);
}
