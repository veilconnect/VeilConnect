/**
 * 隐私友好的匿名使用计数 —— 仅用于回答「到底有没有真实配对成功」。
 *
 * 设计原则（务必维持,否则就违背了产品的隐私模型）：
 *  - 只发一个【空】信标到信令服务器,不带任何身份/房间/对端/IP/内容/精确时间。
 *  - 服务器只对一个【全局计数器】+1（外加按天的总数,用于趋势）,不存任何逐事件记录。
 *  - 仅在「配对/SAS 验证成功」(密码学确认无中间人) 时触发,且只由 host 一端发,
 *    使「一次成功配对 = 计数 +1」,而非两端各记一次。
 *  - 失败静默,绝不影响聊天。
 *
 * 端点：<base>/metrics/pair（POST 空体）。base 复用 __VC_BLOB_BASE__：
 *  托管版 → https://signal.veilconnect.org（信令 Worker）；自部署版 → 同源信令服务器。
 *  现有 CSP 已放行（connect-src 含 'self' 与 signal.veilconnect.org）,无需改 CSP。
 */

declare const __VC_BLOB_BASE__: string | undefined;

/** 计数信标的 HTTP 基址：托管版指向信令 Worker；自部署版同源（空串）。 */
function metricsBase(): string {
  try {
    if (typeof __VC_BLOB_BASE__ === 'string' && __VC_BLOB_BASE__) return __VC_BLOB_BASE__;
  } catch { /* 未注入 */ }
  return '';
}

/**
 * 上报一次「配对成功」。fire-and-forget：不等结果、吞掉一切错误,绝不阻塞或影响 UI。
 * 调用方负责「仅 host、每次连接至多一次」的去重（见 SimpleP2PChat）。
 */
export function reportPairingSuccess(): void {
  try {
    const url = `${metricsBase()}/metrics/pair`;
    // 无头无体的「简单请求」：不触发 CORS 预检、更可能在页面卸载时送达；keepalive 同理。
    void fetch(url, { method: 'POST', keepalive: true, mode: 'cors' }).catch(() => { /* 静默 */ });
  } catch { /* 静默 */ }
}
