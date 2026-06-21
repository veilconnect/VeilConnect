/**
 * 安全码（Safety Number / SAS）派生 —— 从 SimpleP2PChat 抽出的纯逻辑，便于单测与复用。
 *
 * 基于双方「长期 Ed25519 身份公钥」派生，因此跨会话稳定、可带外（电话/当面）核对；
 * 对密钥排序后再哈希，保证两端算出同一个值。两端比对一致即可排除「粘贴邀请码的渠道被
 * 中间人中继并替换密钥」的全程 MITM。
 *
 * 取 SHA-256 前 10 字节并对 10^20 取模 → 20 位十进制。10^20 ≈ 2^66.4，是此处瓶颈，
 * 故有效熵约 66 bit：主动攻击者要伪造同码，需研磨出一对身份公钥使其组合哈希落在同一
 * 20 位值上，约 2^66 量级。
 *
 * 本模块不引用 window / Worker / React，只用 globalThis.crypto.subtle，故可在 Node 测试环境直接跑。
 */

/** SAS 模数：10^20（≈ 2^66.4），即 20 位十进制的取值空间。 */
export const SAFETY_CODE_MODULUS = 100_000_000_000_000_000_000n;

/** 把 20 位数字串按每 4 位分组以便人眼核对（"1234 5678 9012 3456 7890"）。 */
export function groupSafetyCode(code: string): string {
  return code.replace(/(\d{4})(?=\d)/g, '$1 ');
}

/**
 * 由两端长期身份公钥（base64）派生 20 位安全码（已分组显示）。
 * 对两个公钥字符串排序后再拼接哈希，保证与对端结果一致。
 */
export async function deriveSafetyCode(aIdentityKey: string, bIdentityKey: string): Promise<string> {
  const [x, y] = [aIdentityKey, bIdentityKey].sort();
  const data = new TextEncoder().encode(`veilconnect-safety|${x}|${y}`);
  const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', data));
  let num = 0n;
  for (let i = 0; i < 10; i++) num = (num << 8n) | BigInt(digest[i]);
  const code = (num % SAFETY_CODE_MODULUS).toString().padStart(20, '0');
  return groupSafetyCode(code);
}
