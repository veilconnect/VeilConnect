/**
 * VeilConnect 信令 Worker（Cloudflare）——替代自托管的 Node 信令服务器。
 *
 * 路由：
 *   GET  /health             → 健康检查
 *   GET  /turn-credentials   → 经 Cloudflare Realtime(Calls) TURN 现签短时效凭据（不暴露长期密钥）
 *   WS   /?room=<roomId>      → 升级为 WebSocket，按 roomId 路由到对应的 SignalingRoom Durable Object
 *
 * Origin 白名单（ALLOWED_ORIGINS，逗号分隔）在升级前校验，未通过 403。
 * 信令被视为不可信中继：只搬运 SDP/ICE，读不到端到端密文。
 */
import { SignalingRoom } from './room.js';
export { SignalingRoom };

const DEFAULT_ALLOWED = ['http://localhost:8080', 'http://127.0.0.1:8080'];

function allowedOrigins(env) {
  const list = (env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
  return list.length ? list : DEFAULT_ALLOWED;
}
function isOriginAllowed(origin, env) {
  const list = allowedOrigins(env);
  return list.includes('*') || (!!origin && list.includes(origin));
}
function corsHeaders(origin, env) {
  const ok = isOriginAllowed(origin, env);
  return {
    'Access-Control-Allow-Origin': ok ? origin : 'null',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Vary': 'Origin'
  };
}
function json(obj, status, extra) {
  return new Response(JSON.stringify(obj), { status: status || 200, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...(extra || {}) } });
}

/** 经 Cloudflare Realtime TURN 现签凭据（需 secret TURN_KEY_ID / TURN_API_TOKEN）。 */
async function turnCredentials(request, env) {
  const origin = request.headers.get('Origin');
  const cors = corsHeaders(origin, env);
  if (!env.TURN_KEY_ID || !env.TURN_API_TOKEN) {
    // 未配置 TURN 属预期（如纯本地联调）：返回空 iceServers + configured:false，前端据此告警不静默降级。
    return json({ iceServers: [], configured: false }, 200, cors);
  }
  const ttl = parseInt(env.TURN_TTL || '86400', 10);
  try {
    const r = await fetch(
      `https://rtc.live.cloudflare.com/v1/turn/keys/${env.TURN_KEY_ID}/credentials/generate`,
      { method: 'POST', headers: { Authorization: `Bearer ${env.TURN_API_TOKEN}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ ttl }) }
    );
    const data = await r.json();
    return json(data, r.ok ? 200 : 502, cors);
  } catch (e) {
    return json({ error: String(e) }, 502, cors);
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = request.headers.get('Origin');

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders(origin, env) });
    }
    if (url.pathname === '/health') {
      return json({ status: 'healthy', ts: Date.now() }, 200, corsHeaders(origin, env));
    }
    if (url.pathname === '/turn-credentials') {
      return turnCredentials(request, env);
    }

    // WebSocket 升级 → 路由到房间 DO。
    // 注:房间 token 爆破由 DO 内「失败 join 限流」(每 IP 10 次/分钟)挡住;
    // 连接洪泛(海量 WS 建连)建议在 Cloudflare 仪表盘配 WAF/Rate Limiting 规则在边缘拦截。
    if ((request.headers.get('Upgrade') || '').toLowerCase() === 'websocket') {
      if (!isOriginAllowed(origin, env)) {
        return new Response('Origin not allowed', { status: 403 });
      }
      const room = url.searchParams.get('room');
      if (!room || room.length < 4 || room.length > 128) {
        return new Response('missing or invalid ?room', { status: 400 });
      }
      const id = env.SIGNALING_ROOM.idFromName(room);
      const stub = env.SIGNALING_ROOM.get(id);
      return stub.fetch(request);
    }

    return new Response('VeilConnect signaling worker', { status: 200, headers: corsHeaders(origin, env) });
  }
};
