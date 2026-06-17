/**
 * 信令客户端 —— 通过 server/signaling-server.js 的房间机制交换 WebRTC SDP/ICE。
 *
 * 用原生 WebSocket，协议对齐信令服务器：
 *   发：{ type:'join_room', roomId, token } / { type:'signal', data }
 *   收：{ type:'welcome', clientId } / { type:'room_joined' } / { type:'client_joined' }
 *       { type:'client_left' } / { type:'signal', from, data } / { type:'error', error }
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

/** 默认信令地址：同源（部署时信令服务器同时托管网页）。dev 可用 localStorage 'vc.signalingUrl' 覆盖。 */
export function defaultSignalingUrl(): string {
  try {
    const override = typeof localStorage !== 'undefined' && localStorage.getItem('vc.signalingUrl');
    if (override) return override;
  } catch { /* ignore */ }
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

export class SignalingClient {
  private ws: WebSocket | null = null;
  private handlers: SignalingHandlers;
  private url: string;

  constructor(handlers: SignalingHandlers, url: string = defaultSignalingUrl()) {
    this.handlers = handlers;
    this.url = url;
  }

  /** 连接并在收到 welcome 后 resolve。 */
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.url);
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
