/**
 * VeilConnect TURN 凭据签发 Worker（Cloudflare Workers，免费）
 *
 * 作用：客户端 GET 这个 Worker，它用你 Cloudflare 账号里的 TURN Key 调用
 * Cloudflare Realtime API 现签一份「短时效」TURN 凭据并返回，避免把长期密钥写进客户端。
 *
 * 部署：
 *   1. Cloudflare 控制台 → Realtime / Calls → TURN，创建一个 TURN App，拿到 KEY_ID 和 API_TOKEN。
 *   2. 创建 Worker，粘贴本文件。
 *   3. 在 Worker 的 Settings → Variables 添加（建议设为 Secret）：
 *        TURN_KEY_ID   = <你的 TURN Key ID>
 *        TURN_API_TOKEN= <你的 TURN API Token>
 *      （可选）TTL_SECONDS = 86400   ALLOW_ORIGIN = *（或限定为你的应用来源）
 *   4. 部署后把 Worker 的 URL 填进 VeilConnect：
 *        - 代码默认值：src/renderer/components/SimpleP2PChat.tsx 的 DEFAULT_TURN_ENDPOINT
 *        - 或运行时：localStorage.setItem('vc.turnEndpoint', 'https://<worker>.workers.dev')
 *
 * 返回格式（直接喂给浏览器 RTCPeerConnection）：
 *   { "iceServers": { "urls": [...], "username": "...", "credential": "..." } }
 */
export default {
  async fetch(request, env) {
    const allowOrigin = env.ALLOW_ORIGIN || '*';
    const cors = {
      'Access-Control-Allow-Origin': allowOrigin,
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    };
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: cors });
    }
    if (!env.TURN_KEY_ID || !env.TURN_API_TOKEN) {
      return new Response(JSON.stringify({ error: 'TURN_KEY_ID / TURN_API_TOKEN 未配置' }), {
        status: 500, headers: { ...cors, 'Content-Type': 'application/json' }
      });
    }
    const ttl = parseInt(env.TTL_SECONDS || '86400', 10);
    try {
      const r = await fetch(
        `https://rtc.live.cloudflare.com/v1/turn/keys/${env.TURN_KEY_ID}/credentials/generate`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${env.TURN_API_TOKEN}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ ttl })
        }
      );
      const data = await r.json();
      // Cloudflare 返回 { iceServers: {...} }；原样转发
      return new Response(JSON.stringify(data), {
        status: r.ok ? 200 : 502,
        headers: { ...cors, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
      });
    } catch (e) {
      return new Response(JSON.stringify({ error: String(e) }), {
        status: 502, headers: { ...cors, 'Content-Type': 'application/json' }
      });
    }
  }
};
