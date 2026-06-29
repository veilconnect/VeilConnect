/**
 * VeilConnect 信令 Worker（Cloudflare）——替代自托管的 Node 信令服务器。
 *
 * 路由：
 *   GET  /health             → 健康检查
 *   GET  /turn-credentials   → 经 Cloudflare Realtime(Calls) TURN 现签短时效凭据（不暴露长期密钥）
 *   POST /blob               → 异步文件(网盘式)上传【密文】到 R2，返回 {id,size,expiresAt}
 *   GET  /blob/<id>          → 下载密文(32hex id；过期/不存在 404；惰性删除已过期对象)
 *   WS   /?room=<roomId>      → 升级为 WebSocket，按 roomId 路由到对应的 SignalingRoom Durable Object
 *
 * Origin 白名单（ALLOWED_ORIGINS，逗号分隔）在升级前校验，未通过 403。
 * 信令被视为不可信中继：只搬运 SDP/ICE，读不到端到端密文。
 * blob：服务器只存【密文 + 大小/过期】，密钥在分享链接 #片段里，绝不到服务器——无密钥解不开。
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
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type, X-VC-Declared-Bytes',
    'Vary': 'Origin'
  };
}
function json(obj, status, extra) {
  return new Response(JSON.stringify(obj), { status: status || 200, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...(extra || {}) } });
}
function bearerToken(request) {
  const value = request.headers.get('Authorization') || '';
  const match = value.match(/^Bearer\s+(.+)$/i);
  return match ? match[1] : '';
}
function timingSafeEqualString(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
function canReadMetrics(request, env) {
  return Boolean(env.METRICS_READ_TOKEN) && timingSafeEqualString(bearerToken(request), env.METRICS_READ_TOKEN);
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

// —— 异步文件 blob（R2 后端）——
function genBlobId() {
  const b = crypto.getRandomValues(new Uint8Array(16));
  return Array.from(b).map(x => x.toString(16).padStart(2, '0')).join('');
}
function blobMaxBytes(env) {
  return (parseInt(env.BLOB_MAX_MB || '50', 10) || 50) * 1024 * 1024;
}
function blobTtlMs(env) {
  return (parseInt(env.BLOB_TTL_H || '24', 10) || 24) * 3600 * 1000;
}

/**
 * POST /blob：把密文容器【流式】存入 R2，返回 {id,expiresAt}。要求来源在白名单（防跨站滥用）。
 * 大文件不再 arrayBuffer 整体读入(会 OOM 撑爆 Worker 128MB),而是把 request.body 直接流给 R2。
 * 大小上限按客户端声明的明文大小(X-VC-Declared-Bytes)或 Content-Length 预判；落库后再以 R2 实际
 * 大小复核(超限则删除并 413)。
 */
async function blobUpload(request, env) {
  const origin = request.headers.get('Origin');
  const cors = corsHeaders(origin, env);
  if (!env.BLOB) return json({ error: 'blob storage not configured' }, 503, cors);
  // 防跨站滥用：仅允许白名单来源上传（curl 等无来源请求一并拒绝；更强的洪泛防护建议在 WAF/Rate Limiting 配）。
  if (!isOriginAllowed(origin, env)) return json({ error: 'Origin not allowed' }, 403, cors);
  if (!request.body) return json({ error: 'empty body' }, 400, cors);
  const max = blobMaxBytes(env);
  const declared = parseInt(request.headers.get('X-VC-Declared-Bytes') || request.headers.get('Content-Length') || '0', 10);
  if (declared && declared > max) return json({ error: 'File too large' }, 413, cors);
  const id = genBlobId();
  const expiresAt = Date.now() + blobTtlMs(env);
  let obj;
  try {
    obj = await env.BLOB.put(id, request.body, {
      httpMetadata: { contentType: 'application/octet-stream', cacheControl: 'no-store' },
      customMetadata: { expiresAt: String(expiresAt) }
    });
  } catch (e) {
    return json({ error: 'store failed: ' + String(e && e.message || e) }, 502, cors);
  }
  // 落库后按 R2 实际大小复核(防客户端少报 declared 绕过上限)
  if (obj && typeof obj.size === 'number' && (obj.size === 0 || obj.size > max)) {
    try { await env.BLOB.delete(id); } catch { /* ignore */ }
    return json({ error: obj.size === 0 ? 'empty body' : 'File too large' }, obj.size === 0 ? 400 : 413, cors);
  }
  return json({ id, size: obj && obj.size, expiresAt }, 200, cors);
}

/** GET /blob/<id>：取回密文。32hex 校验；过期或不存在 404，过期对象惰性删除。 */
async function blobDownload(id, request, env) {
  const origin = request.headers.get('Origin');
  const cors = corsHeaders(origin, env);
  if (!env.BLOB) return json({ error: 'blob storage not configured' }, 503, cors);
  if (!/^[a-f0-9]{32}$/.test(id)) return json({ error: 'bad id' }, 400, cors);
  const obj = await env.BLOB.get(id);
  if (!obj) return json({ error: 'not found or expired' }, 404, cors);
  const expiresAt = parseInt(obj.customMetadata?.expiresAt || '0', 10);
  if (expiresAt && Date.now() > expiresAt) {
    try { await env.BLOB.delete(id); } catch { /* 已不在 */ }
    return json({ error: 'not found or expired' }, 404, cors);
  }
  return new Response(obj.body, {
    status: 200,
    headers: { ...cors, 'Content-Type': 'application/octet-stream', 'Content-Length': String(obj.size), 'Cache-Control': 'no-store' }
  });
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
    if (url.pathname === '/blob' && request.method === 'POST') {
      return blobUpload(request, env);
    }
    if (url.pathname.startsWith('/blob/') && request.method === 'GET') {
      return blobDownload(url.pathname.slice('/blob/'.length), request, env);
    }

    // —— 匿名使用计数（一次成功配对 = +1，无任何身份/IP/内容/精确时间）——
    // 路由到单例 DO（idFromName('__metrics__')）做持久原子计数。
    if (url.pathname === '/metrics/pair' && request.method === 'POST') {
      if (!isOriginAllowed(origin, env)) {
        return new Response('Origin not allowed', { status: 403, headers: corsHeaders(origin, env) });
      }
      const stub = env.SIGNALING_ROOM.get(env.SIGNALING_ROOM.idFromName('__metrics__'));
      const r = await stub.fetch('https://do/__incr', { method: 'POST' });
      return new Response(await r.text(), { status: 200, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...corsHeaders(origin, env) } });
    }
    if (url.pathname === '/metrics' && request.method === 'GET') {
      if (!canReadMetrics(request, env)) {
        return json({ error: 'not found' }, 404, corsHeaders(origin, env));
      }
      const stub = env.SIGNALING_ROOM.get(env.SIGNALING_ROOM.idFromName('__metrics__'));
      const r = await stub.fetch('https://do/__count');
      return new Response(await r.text(), { status: 200, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...corsHeaders(origin, env) } });
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
