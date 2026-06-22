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

async function sha256hex(s) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(String(s)));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
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
    this.clients = new Map(); // ws -> { id, roomId, ip }
    this.tokenHash = null;    // 首位加入者锁定
    this.maxClients = 2;
    this.roomId = null;
    this.failedJoins = new Map(); // ip -> { count, windowStart }（不随房间清空而复位，避免断连即重置限流）
  }

  // 该 IP 是否已被失败 join 限流（不增加计数）。
  isJoinThrottled(ip) {
    const b = this.failedJoins.get(ip);
    if (!b || Date.now() - b.windowStart > RATE_WINDOW_MS) return false;
    return b.count >= MAX_FAILED_JOINS;
  }

  // 记录一次失败的 join 尝试。
  recordFailedJoin(ip) {
    const now = Date.now();
    const b = this.failedJoins.get(ip);
    if (!b || now - b.windowStart > RATE_WINDOW_MS) { this.failedJoins.set(ip, { count: 1, windowStart: now }); return; }
    b.count++;
  }

  async fetch(request) {
    if (request.headers.get('Upgrade') !== 'websocket') {
      return new Response('expected websocket', { status: 400 });
    }
    const pair = new WebSocketPair();
    const client = pair[0];
    const server = pair[1];
    server.accept();
    const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
    const info = { id: 'client_' + crypto.randomUUID().replace(/-/g, '').slice(0, 12), roomId: null, ip };
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
    const client = this.clients.get(ws);
    if (!client) return;
    const ip = client.ip || 'unknown';
    // 失败 join 限流：防止已知 roomId 后对房间 token 不限速爆破（自定义房间号场景下尤其关键）。
    if (this.isJoinThrottled(ip)) {
      return this.send(ws, { type: 'error', error: 'Too many failed join attempts, try again later' });
    }
    const { roomId, token, maxClients } = msg;
    if (typeof roomId !== 'string' || roomId.length < 4 || roomId.length > 128) {
      this.recordFailedJoin(ip);
      return this.send(ws, { type: 'error', error: 'Invalid roomId' });
    }
    if (typeof token !== 'string' || token.length < 16 || token.length > 128) {
      this.recordFailedJoin(ip);
      return this.send(ws, { type: 'error', error: 'Token required (16-128 chars)' });
    }
    const tokenHash = await sha256hex(token);
    if (this.tokenHash === null) {
      // 首位加入者（房主）锁定 token 与人数上限（夹紧到 [2, MAX_ROOM_CLIENTS]）。
      let cap = Number.isInteger(maxClients) ? maxClients : 2;
      cap = Math.max(2, Math.min(MAX_ROOM_CLIENTS, cap));
      this.tokenHash = tokenHash;
      this.maxClients = cap;
      this.roomId = roomId;
    } else if (!timingSafeEqualHex(this.tokenHash, tokenHash)) {
      this.recordFailedJoin(ip);
      return this.send(ws, { type: 'error', error: 'Invalid room token' });
    }

    const occupants = this.occupants();
    if (occupants >= this.maxClients) {
      this.recordFailedJoin(ip);
      return this.send(ws, { type: 'error', error: 'Room full' });
    }
    client.roomId = roomId;
    const count = occupants + 1;
    this.send(ws, { type: 'room_joined', roomId, clientCount: count, timestamp: Date.now() });
    this.broadcast({ type: 'client_joined', clientId: client.id, clientCount: count, timestamp: Date.now() }, ws);
  }

  relay(ws, msg) {
    const client = this.clients.get(ws);
    if (!client || !client.roomId) return this.send(ws, { type: 'error', error: 'Not in a room' });
    this.broadcast({ type: 'signal', from: client.id, data: msg.data, timestamp: Date.now() }, ws);
  }

  leave(ws) {
    const client = this.clients.get(ws);
    if (!client || !client.roomId) return;
    client.roomId = null;
    this.broadcast({ type: 'client_left', clientId: client.id, clientCount: this.occupants(), timestamp: Date.now() }, ws);
    this.maybeReset();
  }

  onClose(ws) {
    const client = this.clients.get(ws);
    this.clients.delete(ws);
    if (client && client.roomId) {
      this.broadcast({ type: 'client_left', clientId: client.id, clientCount: this.occupants(), timestamp: Date.now() }, ws);
    }
    this.maybeReset();
  }

  /** 房间空了即复位 token/上限锁（对齐 node 服务器「无人即删房」，避免 token 长期被旧值锁死）。 */
  maybeReset() {
    if (this.occupants() === 0) {
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
