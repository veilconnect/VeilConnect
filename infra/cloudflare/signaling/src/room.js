/**
 * SignalingRoom —— Cloudflare Durable Object：一个房间一个实例，持有该房间的 WebSocket 连接并中继 SDP/ICE。
 *
 * 这是把 server/signaling-server.js 的房间逻辑移植到 Cloudflare 上（DO 天然就是「单房间状态机」）。
 * 保留同样的安全语义：
 *   - 首位加入者锁定 token（SHA-256）与人数上限；后续以**常量时间**比对 token 摘要。
 *   - 房间满员拒绝；消息体积上限 64KB；非 JSON / 未知类型拒绝。
 *   - 信令服务器是**不可信中继**：只搬运 SDP/ICE，读不到 DataChannel 上的端到端密文。
 *
 * 协议与 src/web/signaling/SignalingClient.ts 完全一致：
 *   收 client → join_room / leave_room / signal / ping / pong
 *   发 server → welcome / room_joined / client_joined / client_left / signal / pong / error
 */

const MAX_ROOM_CLIENTS = 4;
const MAX_MSG_BYTES = 64 * 1024;
const RATE_WINDOW_MS = 60_000;   // 失败 join 限流窗口
const MAX_FAILED_JOINS = 10;     // 每 IP 每窗口最多失败 join 次数（防 token 爆破，对齐 node 服务器）
const encoder = new TextEncoder();

async function sha256hex(s) {
  const buf = await crypto.subtle.digest('SHA-256', encoder.encode(String(s)));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function hmacSha256hex(secret, s) {
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(String(secret)),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(String(s)));
  return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('');
}

/** 常量时间比较两个等长 hex 摘要（避免计时侧信道；同为 sha256 hex 时恒等长）。 */
function timingSafeEqualHex(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export class SignalingRoom {
  constructor(state, env) {
    this.state = state;
    this.env = env;
    this.ipHashSecret = env?.IP_HASH_SECRET || crypto.randomUUID();
    this.roomTokenHashSecret = env?.ROOM_TOKEN_HASH_SECRET || env?.IP_HASH_SECRET || null;
    this.clients = new Map(); // ws -> { id, roomId, ipFingerprint }
    this.tokenHash = null;    // 首位加入者锁定
    this.maxClients = 2;
    this.roomId = null;
    this.persistent = false;
    this.createdAt = null;
    this.updatedAt = null;
    this.loadedRoomMeta = false;
    this.failedJoins = new Map(); // ipFingerprint -> { count, windowStart }（不随房间清空而复位，避免断连即重置限流）
  }

  async clientIpFingerprint(request) {
    const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
    return sha256hex(`${this.ipHashSecret}:${ip}`);
  }

  async hashToken(token) {
    if (this.roomTokenHashSecret) return hmacSha256hex(this.roomTokenHashSecret, token);
    return sha256hex(token);
  }

  async loadRoomMeta() {
    if (this.loadedRoomMeta) return;
    this.loadedRoomMeta = true;
    const meta = await this.state.storage.get('room_meta');
    if (!meta || typeof meta !== 'object' || meta.persistent !== true) return;
    if (typeof meta.tokenHash !== 'string' || !/^[a-f0-9]{64}$/i.test(meta.tokenHash)) return;
    this.tokenHash = meta.tokenHash;
    this.roomId = typeof meta.roomId === 'string' ? meta.roomId : null;
    let cap = Number.isInteger(meta.maxClients) ? meta.maxClients : 2;
    this.maxClients = Math.max(2, Math.min(MAX_ROOM_CLIENTS, cap));
    this.persistent = true;
    this.createdAt = Number.isFinite(meta.createdAt) ? meta.createdAt : Date.now();
    this.updatedAt = Number.isFinite(meta.updatedAt) ? meta.updatedAt : Date.now();
  }

  async saveRoomMeta() {
    if (!this.persistent || !this.tokenHash || !this.roomId) return;
    const now = Date.now();
    if (!this.createdAt) this.createdAt = now;
    this.updatedAt = now;
    await this.state.storage.put('room_meta', {
      version: 1,
      roomId: this.roomId,
      tokenHash: this.tokenHash,
      maxClients: this.maxClients,
      persistent: true,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    });
  }

  // 该客户端 IP 指纹是否已被失败 join 限流（不增加计数）。
  isJoinThrottled(ipFingerprint) {
    const b = this.failedJoins.get(ipFingerprint);
    if (!b || Date.now() - b.windowStart > RATE_WINDOW_MS) return false;
    return b.count >= MAX_FAILED_JOINS;
  }

  // 清理过期的失败计数项（防止多 IP 攻击把 Map 撑大）。
  sweepFailedJoins(now) {
    for (const [ipFingerprint, b] of this.failedJoins) {
      if (now - b.windowStart > RATE_WINDOW_MS) this.failedJoins.delete(ipFingerprint);
    }
  }

  // 记录一次失败的 join 尝试。
  recordFailedJoin(ipFingerprint) {
    const now = Date.now();
    this.sweepFailedJoins(now);
    const b = this.failedJoins.get(ipFingerprint);
    if (!b || now - b.windowStart > RATE_WINDOW_MS) { this.failedJoins.set(ipFingerprint, { count: 1, windowStart: now }); return; }
    b.count++;
  }

  // 匿名使用计数（仅 idFromName('__metrics__') 这个单例 DO 会被路由到此）：
  // 持久存于 DO storage（不受 R2 生命周期影响）；事务保证并发自增不丢。无任何身份/IP/内容。
  async incrPairing() {
    return await this.state.storage.transaction(async (txn) => {
      const total = ((await txn.get('pair_total')) || 0) + 1;
      const days = (await txn.get('pair_days')) || {};
      const day = new Date().toISOString().slice(0, 10);
      days[day] = (days[day] || 0) + 1;
      const keys = Object.keys(days).sort();
      while (keys.length > 120) delete days[keys.shift()]; // 仅留最近约 120 天
      await txn.put('pair_total', total);
      await txn.put('pair_days', days);
      return total;
    });
  }

  async fetch(request) {
    const url = new URL(request.url);
    if (url.pathname === '/__incr' && request.method === 'POST') {
      const total = await this.incrPairing();
      return new Response(JSON.stringify({ ok: true, total }), { headers: { 'Content-Type': 'application/json' } });
    }
    if (url.pathname === '/__count') {
      const total = (await this.state.storage.get('pair_total')) || 0;
      const days = (await this.state.storage.get('pair_days')) || {};
      return new Response(JSON.stringify({ total, days }), { headers: { 'Content-Type': 'application/json' } });
    }

    if (request.headers.get('Upgrade') !== 'websocket') {
      return new Response('expected websocket', { status: 400 });
    }
    const pair = new WebSocketPair();
    const client = pair[0];
    const server = pair[1];
    server.accept();
    const ipFingerprint = await this.clientIpFingerprint(request);
    const info = { id: 'client_' + crypto.randomUUID().replace(/-/g, '').slice(0, 12), roomId: null, ipFingerprint };
    this.clients.set(server, info);
    this.send(server, { type: 'welcome', clientId: info.id, timestamp: Date.now() });

    server.addEventListener('message', (ev) => { void this.onMessage(server, ev.data); });
    server.addEventListener('close', () => this.onClose(server));
    server.addEventListener('error', () => this.onClose(server));

    return new Response(null, { status: 101, webSocket: client });
  }

  async onMessage(ws, data) {
    if (typeof data === 'string' && data.length > MAX_MSG_BYTES) {
      return this.send(ws, { type: 'error', error: 'message too large' });
    }
    let msg;
    try { msg = JSON.parse(data); } catch { return this.send(ws, { type: 'error', error: 'Invalid JSON message' }); }
    const client = this.clients.get(ws);
    if (!client) return;

    switch (msg.type) {
      case 'join_room': return this.join(ws, msg);
      case 'leave_room': return this.leave(ws);
      case 'signal': return this.relay(ws, msg);
      case 'ping': return this.send(ws, { type: 'pong', timestamp: Date.now() });
      case 'pong': return;
      default: return this.send(ws, { type: 'error', error: `Unknown message type: ${msg.type}` });
    }
  }

  async join(ws, msg) {
    await this.loadRoomMeta();
    const client = this.clients.get(ws);
    if (!client) return;
    const ipFingerprint = client.ipFingerprint || 'unknown';
    // 失败 join 限流：防止已知 roomId 后对房间 token 不限速爆破（自定义房间号场景下尤其关键）。
    if (this.isJoinThrottled(ipFingerprint)) {
      return this.send(ws, { type: 'error', error: 'Too many failed join attempts, try again later' });
    }
    const { roomId, token, maxClients } = msg;
    const wantsPersistent = msg.persistent === true;
    if (typeof roomId !== 'string' || roomId.length < 4 || roomId.length > 128) {
      this.recordFailedJoin(ipFingerprint);
      return this.send(ws, { type: 'error', error: 'Invalid roomId' });
    }
    if (typeof token !== 'string' || token.length < 16 || token.length > 128) {
      this.recordFailedJoin(ipFingerprint);
      return this.send(ws, { type: 'error', error: 'Token required (16-128 chars)' });
    }
    const tokenHash = await this.hashToken(token);
    if (this.tokenHash === null) {
      // 首位加入者（房主）锁定 token 与人数上限（夹紧到 [2, MAX_ROOM_CLIENTS]）。
      let cap = Number.isInteger(maxClients) ? maxClients : 2;
      cap = Math.max(2, Math.min(MAX_ROOM_CLIENTS, cap));
      this.tokenHash = tokenHash;
      this.maxClients = cap;
      this.roomId = roomId;
      this.persistent = wantsPersistent;
      this.createdAt = Date.now();
      if (this.persistent) await this.saveRoomMeta();
    } else if (!timingSafeEqualHex(this.tokenHash, tokenHash)) {
      this.recordFailedJoin(ipFingerprint);
      return this.send(ws, { type: 'error', error: 'Invalid room token' });
    } else if (wantsPersistent && !this.persistent) {
      this.persistent = true;
      if (!this.roomId) this.roomId = roomId;
      await this.saveRoomMeta();
    }

    const occupants = this.occupants();
    if (occupants >= this.maxClients) {
      // 满员不计入失败 join：token 正确的合法用户撞满房不应被误限流（Codex 复审指出）。
      return this.send(ws, { type: 'error', error: 'Room full' });
    }
    client.roomId = roomId;
    const count = occupants + 1;
    this.send(ws, { type: 'room_joined', roomId, clientCount: count, persistent: this.persistent, timestamp: Date.now() });
    this.broadcast({ type: 'client_joined', clientId: client.id, clientCount: count, timestamp: Date.now() }, ws);
  }

  relay(ws, msg) {
    const client = this.clients.get(ws);
    if (!client || !client.roomId) return this.send(ws, { type: 'error', error: 'Not in a room' });
    this.broadcast({ type: 'signal', from: client.id, data: msg.data, timestamp: Date.now() }, ws);
  }

  async leave(ws) {
    const client = this.clients.get(ws);
    if (!client || !client.roomId) return;
    client.roomId = null;
    this.broadcast({ type: 'client_left', clientId: client.id, clientCount: this.occupants(), timestamp: Date.now() }, ws);
    await this.maybeReset();
  }

  onClose(ws) {
    const client = this.clients.get(ws);
    this.clients.delete(ws);
    if (client && client.roomId) {
      this.broadcast({ type: 'client_left', clientId: client.id, clientCount: this.occupants(), timestamp: Date.now() }, ws);
    }
    void this.maybeReset();
  }

  /** 一次性房间空了即复位；持久化房间只刷新 room_meta，保留入口供后续复用。 */
  async maybeReset() {
    if (this.occupants() === 0) {
      if (this.persistent) {
        await this.saveRoomMeta();
        return;
      }
      this.tokenHash = null;
      this.roomId = null;
      this.maxClients = 2;
    }
  }

  occupants() {
    let n = 0;
    for (const c of this.clients.values()) if (c.roomId) n++;
    return n;
  }

  broadcast(obj, exclude) {
    for (const [ws, c] of this.clients) {
      if (ws !== exclude && c.roomId) this.send(ws, obj);
    }
  }

  send(ws, obj) {
    try { ws.send(JSON.stringify(obj)); } catch { /* 连接已关闭 */ }
  }
}
