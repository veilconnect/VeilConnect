/**
 * 信令客户端 —— 通过 server/signaling-server.js 的房间机制交换 WebRTC SDP/ICE。
 *
 * 用原生 WebSocket，协议对齐信令服务器：
 *   发：{ type:'join_room', roomId, token } / { type:'signal', data }
 *   收：{ type:'welcome', clientId } / { type:'room_joined' } / { type:'client_joined' }
 *       { type:'client_left' } / { type:'signal', from, data } / { type:'ping' } / { type:'error', error }
 *
 * 信令服务器被视为**不可信中继**：它只搬运 SDP/ICE，无法读取后续 DataChannel 上的端到端密文；
 * 抵御其作恶（替换密钥做 MITM）依赖上层强制的 SAS 带外核对（见 SimpleP2PChat 的安全码流程）。
 */

export interface SignalingHandlers {
  onWelcome?: (clientId: string) => void;
  onJoined?: (clientCount: number) => void;
  onPeerJoined?: (clientCount: number) => void;
  onPeerLeft?: (clientCount: number) => void;
  onSignal?: (data: any, from: string) => void;
  onError?: (error: string) => void;
  onClose?: () => void;
}

// 构建期注入（webpack DefinePlugin）：托管版指向独立信令 Worker；自部署版为空 → 回退同源。
declare const __VC_SIGNALING_URL__: string | undefined;

/**
 * 默认信令地址，优先级：
 *   ① localStorage 'vc.signalingUrl' 覆盖（dev/调试）
 *   ② 构建期注入的 __VC_SIGNALING_URL__（如 Cloudflare Pages 版 → wss://signal.veilconnect.org）
 *   ③ 同源 wss（自部署：信令服务器同时托管网页）
 */
export function defaultSignalingUrl(): string {
  try {
    const override = typeof localStorage !== 'undefined' && localStorage.getItem('vc.signalingUrl');
    if (override) return override;
  } catch { /* ignore */ }
  try {
    if (typeof __VC_SIGNALING_URL__ === 'string' && __VC_SIGNALING_URL__) return __VC_SIGNALING_URL__;
  } catch { /* 未注入（如测试环境）→ 忽略 */ }
  const proto = location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${proto}//${location.host}`;
}

/** 生成房间 ID（短）与房间 token（≥16 字符，满足信令服务器校验）。 */
export function generateRoomCredentials(): { roomId: string; token: string } {
  const rand = (len: number) => {
    const bytes = crypto.getRandomValues(new Uint8Array(len));
    return Array.from(bytes).map(b => b.toString(36).padStart(2, '0')).join('').slice(0, len);
  };
  return { roomId: rand(10), token: rand(32) };
}

/**
 * 自定义房间号最小长度。在线爆破已由信令侧「失败 join 限流」挡住（每 IP 10 次/分钟，
 * Cloudflare DO 与 node 服务器均有），此长度作纵深防御，降低被随手猜中的概率；
 * 真正的机密性仍靠握手后强制的 SAS 带外核对 / 配对码（见 deriveRoomCredentials 注释）。
 */
export const MIN_ROOM_CODE_LENGTH = 8;

/** 归一化用户输入的房间号：去首尾空白、合并内部空白、转小写——两端约定同一个号即可连上。 */
export function normalizeRoomCode(code: string): string {
  return (code || '').trim().replace(/\s+/g, ' ').toLowerCase();
}

export function isValidRoomCode(code: string): boolean {
  return normalizeRoomCode(code).length >= MIN_ROOM_CODE_LENGTH;
}

function toHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * 由「双方约定的房间号」**确定性派生** roomId 与 token，使两人只交换一个短号码即可会合，
 * 无需传那串很长、易在转发渠道泄露的房间链接。
 *
 * 安全说明（重要）：派生用的是公开 KDF（SHA-256 + 域分隔），故 token 的保密性 == 房间号本身的熵。
 * 短房间号是**可猜测**的——它只是「会合标识」，不是抗中间人的机密。真正阻止中间人读取内容的，
 * 是握手后强制的**安全码(SAS)带外核对 / 配对码**（见 SimpleP2PChat 的内容门禁，未核对前不放行任何内容）。
 * 因此用自定义房间号时，请务必核对安全码或启用配对码。
 */
export async function deriveRoomCredentials(code: string): Promise<{ roomId: string; token: string }> {
  const norm = normalizeRoomCode(code);
  const enc = new TextEncoder();
  const [roomDigest, tokenDigest] = await Promise.all([
    crypto.subtle.digest('SHA-256', enc.encode(`veilconnect-room-id|v1|${norm}`)),
    crypto.subtle.digest('SHA-256', enc.encode(`veilconnect-room-token|v1|${norm}`))
  ]);
  // roomId 取摘要前若干字节（避免与 token 同源可逆推），token 用完整 64 hex（满足服务器 16-128 长度）。
  return { roomId: `rc-${toHex(roomDigest).slice(0, 20)}`, token: toHex(tokenDigest) };
}

export class SignalingClient {
  private ws: WebSocket | null = null;
  private handlers: SignalingHandlers;
  private url: string;

  constructor(handlers: SignalingHandlers, url: string = defaultSignalingUrl()) {
    this.handlers = handlers;
    this.url = url;
  }

  /**
   * 连接并在收到 welcome 后 resolve。
   * 传入 roomId 时把它作为 `?room=` 附到 URL——Cloudflare 信令 Worker 据此把连接路由到对应房间的
   * Durable Object；自托管的 Node 信令服务器忽略该查询参数（房间仍由 join_room 消息确定），故两端兼容。
   */
  connect(roomId?: string): Promise<void> {
    return new Promise((resolve, reject) => {
      let url = this.url;
      if (roomId) {
        try {
          const u = new URL(this.url);
          if (!u.searchParams.has('room')) u.searchParams.set('room', roomId);
          url = u.toString();
        } catch { /* 非法 URL：原样使用 */ }
      }
      try {
        this.ws = new WebSocket(url);
      } catch (err) {
        return reject(err);
      }
      const ws = this.ws;
      const timer = setTimeout(() => reject(new Error('信令连接超时')), 8000);

      ws.onmessage = (e) => {
        let msg: any;
        try { msg = JSON.parse(e.data); } catch { return; }
        switch (msg.type) {
          case 'welcome':
            clearTimeout(timer);
            this.handlers.onWelcome?.(msg.clientId);
            resolve();
            break;
          case 'room_joined':
            this.handlers.onJoined?.(msg.clientCount);
            break;
          case 'client_joined':
            this.handlers.onPeerJoined?.(msg.clientCount);
            break;
          case 'client_left':
            this.handlers.onPeerLeft?.(msg.clientCount);
            break;
          case 'signal':
            this.handlers.onSignal?.(msg.data, msg.from);
            break;
          case 'ping':
            this.send({ type: 'pong', timestamp: Date.now() });
            break;
          case 'error':
            this.handlers.onError?.(msg.error || '信令错误');
            break;
          default:
            break;
        }
      };
      ws.onerror = () => {
        clearTimeout(timer);
        this.handlers.onError?.('信令连接错误');
        reject(new Error('信令连接错误'));
      };
      ws.onclose = () => {
        this.handlers.onClose?.();
      };
    });
  }

  join(roomId: string, token: string, maxClients?: number): void {
    // maxClients 仅房主（首个加入者）设置生效；服务器据此锁定房间人数上限。
    this.send({ type: 'join_room', roomId, token, maxClients });
  }

  sendSignal(data: any): void {
    this.send({ type: 'signal', data });
  }

  private send(obj: any): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(obj));
    }
  }

  close(): void {
    try { this.ws?.close(); } catch { /* ignore */ }
    this.ws = null;
  }
}
