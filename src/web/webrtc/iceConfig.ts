/**
 * ICE / STUN / TURN / relayOnly 配置 —— 从 SimpleP2PChat 抽出，便于单测与复用。
 *
 * 安全默认：relayOnly 默认开启（只用 TURN 的 relay 候选，隐藏双方真实 IP，邀请码 SDP 里也不出现真实 IP）。
 * STUN 仅在显式关闭 relayOnly 时才用，优先 Cloudflare（境外），探测不可达才回退小米/B站（中国节点兜底）。
 */

export const PRIMARY_STUN: RTCIceServer = { urls: 'stun:stun.cloudflare.com:3478' };
export const FALLBACK_STUN: RTCIceServer[] = [
  { urls: 'stun:stun.miwifi.com:3478' },
  { urls: 'stun:stun.chat.bilibili.com:3478' }
];
// 探测前的安全默认：先把全部列上（保证即使在探测完成前建连也有可用 STUN），探测后再收敛。
export const DEFAULT_ICE_SERVERS: RTCIceServer[] = [PRIMARY_STUN, ...FALLBACK_STUN];

// 构建期注入（webpack DefinePlugin）：托管版指向独立信令 Worker 的 /turn-credentials；
// 自部署版为空 → 同源 '/turn-credentials'（信令服务器内置该端点）。
declare const __VC_TURN_ENDPOINT__: string | undefined;
export const DEFAULT_TURN_ENDPOINT: string =
  (typeof __VC_TURN_ENDPOINT__ === 'string' && __VC_TURN_ENDPOINT__) ? __VC_TURN_ENDPOINT__ : '/turn-credentials';

/** 一个 iceServers 配置里是否含至少一个 TURN（relay 模式下没有 TURN 就无法建连）。 */
export function hasTurnServer(servers: RTCIceServer[]): boolean {
  return servers.some(s => {
    const urls = Array.isArray(s.urls) ? s.urls : [s.urls];
    return urls.some(u => typeof u === 'string' && u.startsWith('turn'));
  });
}

/** 读取 relayOnly 偏好：默认 true；仅当 localStorage 'vc.relayOnly' === '0' 时关闭。 */
export function readRelayOnly(storage?: Pick<Storage, 'getItem'>): boolean {
  try {
    const s = storage ?? (typeof localStorage !== 'undefined' ? localStorage : undefined);
    if (!s) return true;
    return s.getItem('vc.relayOnly') !== '0';
  } catch {
    return true;
  }
}

/**
 * 探测某个 STUN 是否可达：用仅含该 STUN 的临时 PeerConnection 收集候选，
 * 在超时内拿到 server-reflexive(srflx) 候选即视为可达。探测用的 PC 立即关闭。
 */
export async function probeStun(server: RTCIceServer, timeoutMs = 1500): Promise<boolean> {
  return new Promise<boolean>((resolve) => {
    let pc: RTCPeerConnection | null = null;
    let done = false;
    const finish = (ok: boolean) => {
      if (done) return;
      done = true;
      try { pc?.close(); } catch { /* ignore */ }
      resolve(ok);
    };
    try {
      pc = new RTCPeerConnection({ iceServers: [server] });
      pc.createDataChannel('probe');
      pc.onicecandidate = (e) => {
        if (e.candidate && e.candidate.type === 'srflx') finish(true);
      };
      pc.createOffer().then((o) => pc!.setLocalDescription(o)).catch(() => finish(false));
      setTimeout(() => finish(false), timeoutMs);
    } catch {
      finish(false);
    }
  });
}

export interface IceBuildResult {
  servers: RTCIceServer[];
  relayOnly: boolean;
  /** relayOnly 开启却无可用 TURN 时为 true（无法建连，需向用户告警）。 */
  relayWithoutTurn: boolean;
}

/**
 * 从 localStorage 读取静态 TURN（vc.turn）。坏配置静默忽略。
 */
export function readStaticTurn(storage?: Pick<Storage, 'getItem'>): RTCIceServer | null {
  try {
    const s = storage ?? (typeof localStorage !== 'undefined' ? localStorage : undefined);
    if (!s) return null;
    const raw = s.getItem('vc.turn');
    if (!raw) return null;
    const turn = JSON.parse(raw) as RTCIceServer;
    return turn && turn.urls ? turn : null;
  } catch {
    return null;
  }
}
