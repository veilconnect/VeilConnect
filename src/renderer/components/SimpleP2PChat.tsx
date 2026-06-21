import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from '../i18n/useTranslation';
import { SignalingClient, generateRoomCredentials } from '../../web/signaling/SignalingClient';
import {
  ChunkAssembler,
  DEFAULT_CHUNK_SIZE,
  FileOfferMeta,
  MAX_FILE_SIZE,
  chunkCount,
  chunkRange,
  decryptChunk,
  encryptChunk,
  formatBytes,
  generateFileKey,
  importFileKey,
  isImageMime,
  sha256Hex
} from '../../web/fileTransfer/fileTransfer';

/** 从链接或裸 hash 解析房间参数：支持完整 URL（含 #room=..&t=..）或纯 'room=..&t=..'。 */
function parseRoomLink(input: string): { roomId: string; token: string } | null {
  try {
    const hash = input.includes('#') ? input.slice(input.indexOf('#') + 1) : input;
    const params = new URLSearchParams(hash);
    const roomId = params.get('room');
    const token = params.get('t');
    if (roomId && token) return { roomId, token };
  } catch { /* ignore */ }
  return null;
}

interface Message {
  id: string;
  text: string;
  type: 'sent' | 'received' | 'system';
  timestamp: number;
}

interface SelfIdentity {
  userId: string;
  publicKey: string;
  boxPublicKey?: string;
  keyBindingSignature?: string;
  nickname: string;
}

type SecureStatus = 'idle' | 'pending' | 'secure' | 'failed';

type FileTransferStatus = 'sending' | 'receiving' | 'completed' | 'failed' | 'cancelled';
type FileTransferDirection = 'sent' | 'received';

interface FileTransferView {
  id: string;
  direction: FileTransferDirection;
  name: string;
  size: number;
  mime: string;
  progress: number;
  status: FileTransferStatus;
  url?: string;
  error?: string;
}

interface ReceivingFile {
  meta: FileOfferMeta;
  key: CryptoKey;
  assembler: ChunkAssembler;
}

const FILE_BACKPRESSURE_HIGH = 1024 * 1024;
const FILE_BACKPRESSURE_LOW = 256 * 1024;

function randomTransferId(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
}

function waitForDataChannelBackpressure(channel: RTCDataChannel): Promise<void> {
  if (channel.bufferedAmount <= FILE_BACKPRESSURE_HIGH) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const previous = channel.onbufferedamountlow;
    channel.bufferedAmountLowThreshold = FILE_BACKPRESSURE_LOW;
    const timer = window.setTimeout(() => {
      channel.onbufferedamountlow = previous;
      reject(new Error('file transfer backpressure timeout'));
    }, 15_000);
    channel.onbufferedamountlow = (event) => {
      window.clearTimeout(timer);
      channel.onbufferedamountlow = previous;
      if (typeof previous === 'function') previous.call(channel, event);
      resolve();
    };
  });
}

/**
 * 安全码（safety number / SAS）：基于双方「长期 Ed25519 身份公钥」派生，
 * 因此跨会话稳定、可带外（电话/当面）核对；对密钥排序后再哈希，保证双方算出同一个值。
 * 两端比对一致即可排除「粘贴邀请码的渠道被中间人中继并替换密钥」的全程 MITM。
 *
 * 取 SHA-256 前 10 字节并对 10^20 取模 → 20 位十进制。10^20 ≈ 2^66.4，是此处瓶颈，
 * 故有效熵约 66 bit（而非旧版 16 位 / 实际 ~53 bit）：主动攻击者要伪造同码，需研磨出
 * 一对身份公钥使其组合哈希落在同一 20 位值上，约 2^66 量级。
 */
async function deriveSafetyCode(aIdentityKey: string, bIdentityKey: string): Promise<string> {
  const [x, y] = [aIdentityKey, bIdentityKey].sort();
  const data = new TextEncoder().encode(`veilconnect-safety|${x}|${y}`);
  const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', data));
  let num = 0n;
  for (let i = 0; i < 10; i++) num = (num << 8n) | BigInt(digest[i]);
  const code = (num % 100_000_000_000_000_000_000n).toString().padStart(20, '0'); // 10^20 ≈ 2^66
  return code.replace(/(\d{4})(?=\d)/g, '$1 '); // 20 位分 5 组显示
}

// STUN 选择策略：默认只用 Cloudflare；仅当探测到 Cloudflare 不可达时，才回退到小米 + B站。
// （三者都替换了在中国被墙的 Google STUN。）注意：RTCPeerConnection 的 iceServers 数组是
// 并行查询、没有原生「失败才用下一个」的串行回退；要实现「不可用才回退」必须先主动探测可达性。
// IPv6 候选由浏览器在有 IPv6 时自动收集，无需额外配置。
const PRIMARY_STUN: RTCIceServer = { urls: 'stun:stun.cloudflare.com:3478' };
const FALLBACK_STUN: RTCIceServer[] = [
  { urls: 'stun:stun.miwifi.com:3478' },
  { urls: 'stun:stun.chat.bilibili.com:3478' }
];
// 探测前的安全默认：先把全部列上（保证即使用户在探测完成前就建连也有可用 STUN），
// 探测完成后再按结果收敛为「仅 Cloudflare」或「仅小米+B站」。
const DEFAULT_ICE_SERVERS: RTCIceServer[] = [PRIMARY_STUN, ...FALLBACK_STUN];

/**
 * 探测某个 STUN 是否可达：用仅含该 STUN 的临时 PeerConnection 收集候选，
 * 在超时内拿到 server-reflexive(srflx) 候选即视为可达（说明 STUN 成功返回了公网映射）。
 * 探测用的 PC 立即关闭，不参与真正的会话。
 */
async function probeStun(server: RTCIceServer, timeoutMs = 1500): Promise<boolean> {
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
// TURN 临时凭据签发端点（推荐 Cloudflare Worker，见 infra/cloudflare-turn-worker.js；或自建后端）。
// 自部署：信令服务器内置 GET /turn-credentials（基于 coturn use-auth-secret 签发时限凭据），
// 故默认端点即同源的 '/turn-credentials'，开箱即用；可用 localStorage 'vc.turnEndpoint' 覆盖，
// 'vc.turn' 可直接配静态 TURN。
// 注意：relayOnly 现在【默认开启】（隐藏双方真实 IP）——因此必须有可用 TURN 连接才能建立。
//      若要放弃此保护以换连通性（如本地双标签页联调），显式设 localStorage 'vc.relayOnly' = '0'。
const DEFAULT_TURN_ENDPOINT = '/turn-credentials';

interface SimpleP2PChatProps {
  userIdentity?: {
    customId: string;
    nickname: string;
    publicKey: string;
    privateKey: string;
  };
}

export const SimpleP2PChat: React.FC<SimpleP2PChatProps> = ({ userIdentity }) => {
  const { t } = useTranslation();
  // WebRTC状态
  const [pc, setPc] = useState<RTCPeerConnection | null>(null);
  const [dc, setDc] = useState<RTCDataChannel | null>(null);
  const [role, setRole] = useState<'host' | 'guest' | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');

  // 聊天状态
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [fileTransfers, setFileTransfers] = useState<FileTransferView[]>([]);

  // 信令房间状态
  const [roomLink, setRoomLink] = useState('');     // host 建房后生成的分享链接
  const [inputCode, setInputCode] = useState('');   // guest 手动粘贴的房间链接
  const [showRoomDialog, setShowRoomDialog] = useState(false);
  const [showJoinDialog, setShowJoinDialog] = useState(false);

  // 端到端加密 / 身份验证状态
  const [secureStatus, setSecureStatus] = useState<SecureStatus>('idle');
  const [peerInfo, setPeerInfo] = useState<{ userId: string; nickname: string } | null>(null);
  const [safetyCode, setSafetyCode] = useState('');
  // 用户是否已带外核对安全码（SAS）。在确认前只能声称「已加密」，不能声称「已验证/抗 MITM」。
  const [sasConfirmed, setSasConfirmed] = useState(false);

  // UI：瞬时提示（toast）、关于面板展开、本机昵称（可改）
  const [toasts, setToasts] = useState<{ id: number; text: string; kind: 'info' | 'warn' | 'error' }[]>([]);
  const [showAbout, setShowAbout] = useState(false);
  const [myName, setMyName] = useState(userIdentity?.nickname || '');

  // Refs
  const heartbeatInterval = useRef<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const selfIdentityRef = useRef<SelfIdentity | null>(null);
  const peerBoxKeyRef = useRef<string | null>(null);
  const disconnectRef = useRef<(() => void) | null>(null);
  // Double Ratchet：对端地址（用对端 userId 作为会话地址）
  const peerIdRef = useRef<string | null>(null);
  // 信令 / WebRTC：当前 PeerConnection、信令客户端、早到的 ICE 候选缓冲、ICE 配置就绪信号
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const signalingRef = useRef<SignalingClient | null>(null);
  const pendingCandidatesRef = useRef<RTCIceCandidateInit[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const receivingFilesRef = useRef<Map<string, ReceivingFile>>(new Map());
  const pendingFileChunksRef = useRef<Map<string, any[]>>(new Map());
  const cancelledFilesRef = useRef<Set<string>>(new Set());
  const objectUrlsRef = useRef<Set<string>>(new Set());
  const iceReadyRef = useRef<{ promise: Promise<void>; resolve: () => void } | null>(null);
  if (!iceReadyRef.current) {
    let resolve!: () => void;
    const promise = new Promise<void>(r => (resolve = r));
    iceReadyRef.current = { promise, resolve };
  }
  // 本地 ratchet prekey bundle + 其身份签名记忆化为单个 promise，
  // 避免 sendIdentity 与对端 hello 到达之间的竞态。
  const bundleInitRef = useRef<Promise<{ bundle: any; signature: string }> | null>(null);

  // WebRTC ICE 服务器与中继策略。为「尽量安全、不被中国相关方截获元数据」：
  // - relayOnly 默认开启：只用 TURN 的 relay 候选，隐藏双方真实 IP，邀请码(SDP)里也不出现真实 IP；
  // - STUN 仅在关闭 relayOnly 时才用，优先 Cloudflare（境外），探测不可达才回退小米/B站（中国节点，仅最后兜底）。
  const iceServersRef = useRef<RTCIceServer[]>([...DEFAULT_ICE_SERVERS]);
  const relayOnlyRef = useRef<boolean>(true);
  // relayOnly 开启却无可用 TURN 时的告警，建连时surface给用户（避免静默无法连接 / 静默泄露 IP）
  const iceWarningRef = useRef<string | null>(null);

  // 启动时确定 ICE 配置：① relayOnly 默认开（可用 vc.relayOnly='0' 关）；② 非 relay 才探测/选 STUN；
  // ③ 叠加 TURN（静态 vc.turn / 动态 vc.turnEndpoint，推荐 Cloudflare Worker）；④ 守卫并告警。
  useEffect(() => {
    let cancelled = false;
    (async () => {
      // relayOnly 默认开启（尽量安全）；显式设 vc.relayOnly='0' 才关闭（以暴露真实 IP 换连通性）
      let relayOnly = true;
      try {
        if (typeof localStorage !== 'undefined') {
          relayOnly = localStorage.getItem('vc.relayOnly') !== '0';
        }
      } catch { /* 忽略 */ }
      relayOnlyRef.current = relayOnly;

      // STUN 仅在非 relay 模式下需要（relay 模式只收集 TURN 的 relay 候选，根本不接触 STUN）。
      let servers: RTCIceServer[] = [];
      if (!relayOnly) {
        const cloudflareOk = await probeStun(PRIMARY_STUN);
        servers = cloudflareOk ? [PRIMARY_STUN] : [...FALLBACK_STUN];
        // 早于 log() 声明（TDZ），用 console 记录；不向聊天窗注入系统消息
        console.log(`[ICE] ${cloudflareOk ? 'STUN: 使用 Cloudflare' : 'STUN: Cloudflare 不可达，回退到小米 + B站（中国节点）'}`);
      }

      // 静态 TURN（自建 coturn）：vc.turn = {"urls":"turn:host:3478","username":"u","credential":"p"}
      try {
        if (typeof localStorage !== 'undefined') {
          const raw = localStorage.getItem('vc.turn');
          if (raw) {
            const turn = JSON.parse(raw) as RTCIceServer;
            if (turn && turn.urls) servers.push(turn);
          }
        }
      } catch {
        // 忽略坏配置
      }

      // 动态 TURN：从签发端点（推荐 Cloudflare Worker，见 infra/cloudflare-turn-worker.js）现签临时凭据
      const endpoint = (typeof localStorage !== 'undefined' && localStorage.getItem('vc.turnEndpoint')) || DEFAULT_TURN_ENDPOINT;
      if (endpoint) {
        try {
          const ctrl = new AbortController();
          const timer = setTimeout(() => ctrl.abort(), 4000);
          const resp = await fetch(endpoint, { signal: ctrl.signal });
          clearTimeout(timer);
          if (resp.ok) {
            const data = await resp.json();
            const ice = data.iceServers ?? data;
            (Array.isArray(ice) ? ice : [ice]).forEach((s: any) => { if (s && s.urls) servers.push(s); });
          }
        } catch {
          // 动态签发失败：不静默降级（降级 = 泄露真实 IP），交由下面的守卫告警
        }
      }

      // 安全守卫：relayOnly 开启却没有任何 TURN → 无法建连。为「尽量安全」不自动降级，
      // 仅记录告警，建连时再 surface 给用户（提示部署 Cloudflare TURN 或临时关 relayOnly）。
      const hasTurn = servers.some(s => {
        const urls = Array.isArray(s.urls) ? s.urls : [s.urls];
        return urls.some(u => typeof u === 'string' && u.startsWith('turn'));
      });
      iceWarningRef.current = (relayOnly && !hasTurn)
        ? t.chat.p2p.relayNotReady
        : null;
      if (relayOnly && !hasTurn) {
        console.warn('[ICE] relayOnly 已开启但未配置可用 TURN：部署 coturn 或设 localStorage.vc.turnEndpoint；或临时设 vc.relayOnly=0（会暴露双方真实 IP）。');
      }

      if (!cancelled) iceServersRef.current = servers;
      // 通知建连流程：ICE 配置已就绪（避免自动加入早于配置完成而用到默认/空 TURN）
      iceReadyRef.current?.resolve();
    })();
    return () => { cancelled = true; };
  }, []);

  // 瞬时提示（toast）：状态/提示不再塞进聊天记录，改为右上角浮层、自动消失
  const pushToast = useCallback((text: string, kind: 'info' | 'warn' | 'error' = 'info') => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, text, kind }]);
    const ttl = kind === 'error' ? 6000 : kind === 'warn' ? 5000 : 3200;
    setTimeout(() => setToasts(prev => prev.filter(x => x.id !== id)), ttl);
  }, []);

  // 日志：用户可见提示走 toast（不污染聊天记录）；同时进 console 便于排查
  const log = useCallback((msg: string, type: 'INFO' | 'ERROR' | 'WARN' = 'INFO') => {
    console.log(`[${type}] ${msg}`);
    pushToast(msg, type === 'ERROR' ? 'error' : type === 'WARN' ? 'warn' : 'info');
  }, [pushToast]);

  // 纯技术细节：只进 console，不显示给用户（避免用 WebRTC/信令术语吓到普通用户）
  const dev = useCallback((msg: string) => {
    console.log(`[DEV] ${msg}`);
  }, []);

  // 复位加密/验证状态（断开、对方离开、握手失败时调用，避免出现「未连接却已验证」的矛盾状态）
  const resetSecureState = useCallback(() => {
    if (peerIdRef.current) {
      void (window as any).electronAPI?.ratchet?.close?.(peerIdRef.current);
      peerIdRef.current = null;
    }
    bundleInitRef.current = null;
    peerBoxKeyRef.current = null;
    setSecureStatus('idle');
    setPeerInfo(null);
    setSafetyCode('');
    setSasConfirmed(false);
  }, []);

  // 修改本机昵称（对端在握手后会看到它）
  const renameSelf = useCallback(async () => {
    const next = (window.prompt(t.chat.p2p.setNicknamePrompt, myName || '') || '').trim();
    if (!next || next === myName) return;
    try {
      await (window as any).electronAPI?.identity?.updateUserInfo?.({ nickname: next });
      if (selfIdentityRef.current) selfIdentityRef.current.nickname = next;
      setMyName(next);
      pushToast(t.chat.p2p.nicknameUpdated);
    } catch {
      pushToast(t.chat.p2p.nicknameUpdateFailed, 'error');
    }
  }, [myName, pushToast]);

  const addMessage = useCallback((text: string, type: 'sent' | 'received' | 'system') => {
    const newMessage: Message = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      text,
      type,
      timestamp: Date.now()
    };
    setMessages(prev => [...prev, newMessage]);
  }, []);

  const updateFileTransfer = useCallback((id: string, patch: Partial<FileTransferView>) => {
    setFileTransfers(prev => prev.map(item => item.id === id ? { ...item, ...patch } : item));
  }, []);

  const upsertFileTransfer = useCallback((transfer: FileTransferView) => {
    setFileTransfers(prev => {
      const idx = prev.findIndex(item => item.id === transfer.id);
      if (idx === -1) return [...prev, transfer];
      const next = [...prev];
      next[idx] = { ...next[idx], ...transfer };
      return next;
    });
  }, []);

  const hasActiveFileTransfer = useCallback(() => (
    fileTransfers.some(item => item.status === 'sending' || item.status === 'receiving')
  ), [fileTransfers]);

  const clearFileTransferState = useCallback(() => {
    receivingFilesRef.current.clear();
    pendingFileChunksRef.current.clear();
    cancelledFilesRef.current.clear();
    for (const url of objectUrlsRef.current) URL.revokeObjectURL(url);
    objectUrlsRef.current.clear();
    setFileTransfers([]);
  }, []);

  const sendEncryptedControl = useCallback(async (obj: Record<string, unknown>, channel: RTCDataChannel = dc as RTCDataChannel) => {
    const peerId = peerIdRef.current;
    if (!peerId || !channel || channel.readyState !== 'open') {
      throw new Error('secure channel unavailable');
    }
    const api = (window as any).electronAPI;
    const { type, body } = await api.ratchet.encrypt(peerId, JSON.stringify(obj));
    channel.send(JSON.stringify({ type: 'cipher', payload: { t: type, b: body } }));
  }, [dc]);

  // 滚动到底部
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // 载入本地身份（含 X25519 box 公钥及其绑定签名），用于安全握手
  useEffect(() => {
    (async () => {
      try {
        const api = (window as any).electronAPI;
        if (!api?.identity) return;
        const id = await api.identity.getCurrentIdentity();
        if (id) {
          selfIdentityRef.current = {
            userId: id.userId,
            publicKey: id.publicKey,
            boxPublicKey: id.boxPublicKey,
            keyBindingSignature: id.keyBindingSignature,
            nickname: id.nickname
          };
        }
      } catch (err) {
        log(t.chat.p2p.loadIdentityFailed, 'ERROR');
        dev(`加载本地身份失败: ${err}`);
      }
    })();
  }, [log, dev]);

  // 创建（并记忆化）本地 ratchet prekey bundle，并用长期 Ed25519 身份私钥签名其身份公钥
  const ensureBundle = useCallback(async () => {
    if (!bundleInitRef.current) {
      bundleInitRef.current = (async () => {
        const api = (window as any).electronAPI;
        const bundle = await api.ratchet.localBundle();
        // 用身份私钥对 ratchet 身份公钥签名，使对端能把它绑定到已认证身份（防 MITM）
        const signature = await api.identity.signEphemeralKey(bundle.identityKey);
        return { bundle, signature };
      })();
    }
    return bundleInitRef.current;
  }, []);

  // 发送身份包：长期身份字段用于鉴权，外加 ratchet prekey bundle 及其身份签名（每条消息级前向保密）
  const sendIdentity = useCallback(async (channel: RTCDataChannel) => {
    const id = selfIdentityRef.current;
    if (!id || !id.boxPublicKey || !id.keyBindingSignature) {
      log(t.chat.p2p.identityIncomplete, 'ERROR');
      dev('本地身份缺少 boxPublicKey/keyBindingSignature');
      setSecureStatus('failed');
      return;
    }
    try {
      const { bundle, signature } = await ensureBundle();
      channel.send(JSON.stringify({
        type: 'hello',
        userId: id.userId,
        publicKey: id.publicKey,
        boxPublicKey: id.boxPublicKey,
        keyBindingSignature: id.keyBindingSignature,
        ratchetBundle: bundle,
        ratchetSignature: signature,
        nickname: id.nickname
      }));
    } catch (err) {
      log(t.chat.p2p.secureChannelFailed, 'ERROR');
      dev(`发起安全握手失败: ${err instanceof Error ? err.message : err}`);
      setSecureStatus('failed');
    }
  }, [log, dev, ensureBundle]);

  const handleFileCancel = useCallback((id: string) => {
    receivingFilesRef.current.delete(id);
    pendingFileChunksRef.current.delete(id);
    cancelledFilesRef.current.add(id);
    updateFileTransfer(id, { status: 'cancelled', error: t.chat.p2p.file.cancelled });
  }, [t.chat.p2p.file.cancelled, updateFileTransfer]);

  const processFileChunk = useCallback(async (id: string, chunk: any, rx: ReceivingFile) => {
    if (cancelledFilesRef.current.has(id)) return;
    try {
      const plain = await decryptChunk(rx.key, chunk.iv, chunk.data);
      const fresh = rx.assembler.add(chunk.seq, plain);
      if (!fresh) return;
      updateFileTransfer(id, { progress: rx.assembler.progress });
      if (!rx.assembler.isComplete()) return;

      const assembled = rx.assembler.assemble();
      const okSize = assembled.byteLength === rx.meta.size;
      const okHash = (await sha256Hex(assembled)) === rx.meta.hash;
      receivingFilesRef.current.delete(id);
      pendingFileChunksRef.current.delete(id);
      if (!okSize || !okHash) {
        updateFileTransfer(id, {
          status: 'failed',
          progress: 1,
          error: t.chat.p2p.file.verifyFailed
        });
        log(t.chat.p2p.file.verifyFailed, 'ERROR');
        return;
      }

      const blob = new Blob([assembled], { type: rx.meta.mime || 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      objectUrlsRef.current.add(url);
      updateFileTransfer(id, {
        status: 'completed',
        progress: 1,
        url
      });
    } catch (err) {
      receivingFilesRef.current.delete(id);
      pendingFileChunksRef.current.delete(id);
      updateFileTransfer(id, {
        status: 'failed',
        error: t.chat.p2p.file.failed
      });
      dev(`file chunk failed: ${err instanceof Error ? err.message : err}`);
    }
  }, [dev, log, t.chat.p2p.file.failed, t.chat.p2p.file.verifyFailed, updateFileTransfer]);

  const handleFileOffer = useCallback(async (meta: FileOfferMeta) => {
    try {
      if (!meta || typeof meta.id !== 'string' || typeof meta.name !== 'string' ||
          typeof meta.size !== 'number' || typeof meta.hash !== 'string' ||
          typeof meta.key !== 'string' || typeof meta.totalChunks !== 'number') {
        throw new Error('invalid file offer');
      }
      if (meta.size > MAX_FILE_SIZE) {
        throw new Error('file too large');
      }
      if (hasActiveFileTransfer()) {
        void sendEncryptedControl({ c: 'file_cancel', id: meta.id, reason: 'busy' }).catch(() => undefined);
        log(t.chat.p2p.file.busy, 'WARN');
        return;
      }
      const key = await importFileKey(meta.key);
      receivingFilesRef.current.set(meta.id, {
        meta,
        key,
        assembler: new ChunkAssembler(meta.totalChunks)
      });
      upsertFileTransfer({
        id: meta.id,
        direction: 'received',
        name: meta.name,
        size: meta.size,
        mime: meta.mime || 'application/octet-stream',
        progress: 0,
        status: 'receiving'
      });
      log(`${t.chat.p2p.file.incoming} ${meta.name} (${formatBytes(meta.size)})`);
      const queued = pendingFileChunksRef.current.get(meta.id) || [];
      pendingFileChunksRef.current.delete(meta.id);
      const rx = receivingFilesRef.current.get(meta.id);
      if (rx) {
        for (const chunk of queued) void processFileChunk(meta.id, chunk, rx);
      }
    } catch (err) {
      log(t.chat.p2p.file.offerFailed, 'ERROR');
      dev(`file offer failed: ${err instanceof Error ? err.message : err}`);
    }
  }, [dev, hasActiveFileTransfer, log, processFileChunk, sendEncryptedControl, t.chat.p2p.file.busy, t.chat.p2p.file.incoming, t.chat.p2p.file.offerFailed, upsertFileTransfer]);

  const handleFileChunk = useCallback(async (chunk: any) => {
    const id = chunk?.id;
    if (typeof id !== 'string' || cancelledFilesRef.current.has(id)) return;
    const rx = receivingFilesRef.current.get(id);
    if (!rx) {
      const queued = pendingFileChunksRef.current.get(id) || [];
      if (queued.length < 2048) {
        queued.push(chunk);
        pendingFileChunksRef.current.set(id, queued);
      }
      return;
    }
    await processFileChunk(id, chunk, rx);
  }, [processFileChunk]);

  // 收到对端身份包：强制验证身份绑定 + ratchet 密钥签名，任一失败即视为中间人攻击并断开
  const handleHello = useCallback(async (bundle: any, channel: RTCDataChannel) => {
    const self = selfIdentityRef.current;
    try {
      if (!bundle?.boxPublicKey || !bundle?.keyBindingSignature) {
        throw new Error('对方未提供加密公钥绑定');
      }
      if (!bundle?.ratchetBundle || !bundle?.ratchetSignature) {
        throw new Error('对方未提供 ratchet 密钥包');
      }
      const api = (window as any).electronAPI;
      // importPeerIdentity 内部校验 userId↔publicKey 以及 Ed25519(boxPublicKey) 绑定签名，任一失败抛错
      const peer = await api.identity.importPeerIdentity(JSON.stringify(bundle));
      // 校验 ratchet 身份公钥确由对端长期身份私钥签名 —— 把棘轮身份绑定到已认证身份，防 MITM
      const ratchetOk = await api.identity.verifyEphemeralKey(
        bundle.publicKey, bundle.ratchetBundle.identityKey, bundle.ratchetSignature
      );
      if (!ratchetOk) {
        throw new Error('ratchet 身份签名无效');
      }
      peerIdRef.current = peer.userId;
      peerBoxKeyRef.current = bundle.boxPublicKey;
      setPeerInfo({ userId: peer.userId, nickname: peer.nickname });
      // 安全码基于稳定的长期身份公钥派生，便于带外核对
      if (self?.publicKey) {
        setSafetyCode(await deriveSafetyCode(self.publicKey, bundle.publicKey));
      }

      // 确定性选出发起方（userId 较大者）：避免双方同时建立出站会话导致棘轮错乱
      const amInitiator = !!self && self.userId > peer.userId;
      if (amInitiator) {
        await api.ratchet.establish(peer.userId, bundle.ratchetBundle);
        // 立即发一条控制密文（type 3 prekey 消息），让对端据此建立入站会话
        const init = await api.ratchet.encrypt(peer.userId, JSON.stringify({ c: 'init' }));
        channel.send(JSON.stringify({ type: 'cipher', payload: { t: init.type, b: init.body } }));
        setSecureStatus('secure');
        log(t.chat.p2p.e2eEstablished);
        dev(`ratchet established as initiator, peer=${String(peer.userId).slice(0, 12)}…`);
      } else {
        setSecureStatus('pending');
        log(t.chat.p2p.e2eEstablishing);
        dev(`ratchet pending as responder, peer=${String(peer.userId).slice(0, 12)}…`);
      }
    } catch (err) {
      setSecureStatus('failed');
      peerBoxKeyRef.current = null;
      peerIdRef.current = null;
      log(t.chat.p2p.peerVerifyFailed, 'ERROR');
      dev(`identity verification failed: ${err instanceof Error ? err.message : err}`);
      disconnectRef.current?.();
    }
  }, [log, dev]);

  // 收到密文：经 Double Ratchet 解密（棘轮天然抗重放：每条消息密钥用后即删）
  const handleCipher = useCallback(async (payload: any) => {
    const peerId = peerIdRef.current;
    if (!peerId || !payload || typeof payload.t !== 'number') {
      dev('安全通道未建立或密文格式错误，已丢弃');
      return;
    }
    try {
      const api = (window as any).electronAPI;
      // type 3（prekey 消息）会在接收方建立入站会话
      const plain = await api.ratchet.decrypt(peerId, payload.t, payload.b);
      const obj = JSON.parse(plain) as { c?: string; t?: string; f?: FileOfferMeta; id?: string };
      if (obj.c === 'init') {
        // 发起方的会话建立控制消息：入站棘轮已就绪，标记安全并提示接收方核对安全码
        setSecureStatus('secure');
        log(t.chat.p2p.e2eEstablished);
        return;
      }
      if (obj.c === 'file_offer' && obj.f) {
        void handleFileOffer(obj.f);
        return;
      }
      if (obj.c === 'file_cancel' && typeof obj.id === 'string') {
        handleFileCancel(obj.id);
        return;
      }
      if (obj.c === 'file_complete') {
        return;
      }
      if (typeof obj.t === 'string') {
        addMessage(obj.t, 'received');
      }
    } catch {
      dev('收到无法解密的消息（已丢弃）');
    }
  }, [addMessage, handleFileCancel, handleFileOffer, log, dev]);

  // 心跳机制
  const startHeartbeat = useCallback(() => {
    if (heartbeatInterval.current) return;

    heartbeatInterval.current = window.setInterval(() => {
      if (dc && dc.readyState === 'open') {
        try {
          const ping = { type: 'ping', timestamp: Date.now() };
          dc.send(JSON.stringify(ping));
        } catch (error) {
          dev(`心跳发送失败: ${error}`);
        }
      }
    }, 10000);
  }, [dc, dev]);

  const stopHeartbeat = useCallback(() => {
    if (heartbeatInterval.current) {
      clearInterval(heartbeatInterval.current);
      heartbeatInterval.current = null;
    }
  }, []);

  // 创建PeerConnection
  const createPeerConnection = useCallback(() => {
    try {
      // relayOnly 但无 TURN 时给出可见告警，避免「点了建连却永远连不上」一脸懵
      if (iceWarningRef.current) log(iceWarningRef.current, 'WARN');
      const newPc = new RTCPeerConnection({
        iceServers: iceServersRef.current,
        iceTransportPolicy: relayOnlyRef.current ? 'relay' : 'all'
      });
      if (relayOnlyRef.current) log(t.chat.p2p.relayNotice);
      dev(relayOnlyRef.current ? 'PeerConnection 创建成功（relay 模式）' : 'PeerConnection 创建成功');

      newPc.onicecandidate = (event) => {
        if (event.candidate) {
          dev(`收集 ICE 候选: ${event.candidate.type}`);
        } else {
          dev('ICE 收集完成');
        }
      };

      newPc.onconnectionstatechange = () => {
        dev(`连接状态: ${newPc.connectionState}`);

        if (newPc.connectionState === 'connected') {
          setConnectionStatus('connected');
          log(t.chat.p2p.connectedEstablishing);
          startHeartbeat();
        } else if (newPc.connectionState === 'disconnected' || newPc.connectionState === 'failed') {
          setConnectionStatus('disconnected');
          resetSecureState();
          stopHeartbeat();
        }
      };

      setPc(newPc);
      return newPc;
    } catch (error) {
      log(t.chat.p2p.connectFailed, 'ERROR');
      dev(`创建 PeerConnection 失败: ${error}`);
      return null;
    }
  }, [log, dev, resetSecureState, startHeartbeat, stopHeartbeat]);

  // 设置数据通道
  const setupDataChannel = useCallback((channel: RTCDataChannel) => {
    channel.onopen = () => {
      dev('数据通道已打开，开始安全握手');
      setConnectionStatus('connected');
      setSecureStatus('pending');
      setSasConfirmed(false);
      void sendIdentity(channel);
    };

    channel.onclose = () => {
      log(t.chat.p2p.peerDisconnected);
      setConnectionStatus('disconnected');
      resetSecureState();
      clearFileTransferState();
    };

    channel.onmessage = (event) => {
      let data: any;
      try {
        data = JSON.parse(event.data);
      } catch {
        // 非 JSON 帧一律忽略：本协议只接受结构化的密文/控制帧
        return;
      }
      switch (data.type) {
        case 'ping':
          channel.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
          break;
        case 'pong':
          break;
        case 'hello':
          void handleHello(data, channel);
          break;
        case 'cipher':
          void handleCipher(data.payload);
          break;
        case 'file_chunk':
          void handleFileChunk(data);
          break;
        default:
          // 未知/明文消息一律丢弃，杜绝降级到明文
          dev('收到未知类型的帧，已忽略');
      }
    };

    setDc(channel);
  }, [log, resetSecureState, clearFileTransferState, sendIdentity, handleHello, handleCipher, handleFileChunk]);

  // 早到的 ICE 候选可能先于 remoteDescription 抵达：先缓冲，设好远端描述后再补加。
  const addOrBufferCandidate = useCallback(async (target: RTCPeerConnection, cand: RTCIceCandidateInit) => {
    if (target.remoteDescription && target.remoteDescription.type) {
      try { await target.addIceCandidate(cand); } catch { /* 忽略无效候选 */ }
    } else {
      pendingCandidatesRef.current.push(cand);
    }
  }, []);

  const flushCandidates = useCallback(async (target: RTCPeerConnection) => {
    const list = pendingCandidatesRef.current;
    pendingCandidatesRef.current = [];
    for (const c of list) {
      try { await target.addIceCandidate(c); } catch { /* 忽略 */ }
    }
  }, []);

  /**
   * 经信令房间建立 P2P 连接。host 在对端入房后发 offer，guest 收到 offer 后回 answer，
   * 双方 trickle ICE。DataChannel 打开后，既有的 hello/cipher/SAS 握手原样接管（与传输方式无关）。
   */
  const beginSession = useCallback(async (asHost: boolean, roomId: string, token: string, maxClients?: number) => {
    // 等待 ICE 配置（relayOnly / TURN）就绪，避免用到默认/空配置
    await iceReadyRef.current?.promise;

    const newPc = createPeerConnection();
    if (!newPc) return;
    pcRef.current = newPc;
    pendingCandidatesRef.current = [];
    setRole(asHost ? 'host' : 'guest');
    setConnectionStatus('connecting');

    // trickle：本地 ICE 候选随收随经信令转发给对端
    newPc.onicecandidate = (event) => {
      if (event.candidate) {
        signalingRef.current?.sendSignal({ kind: 'candidate', candidate: event.candidate.toJSON() });
      }
    };

    if (asHost) {
      const channel = newPc.createDataChannel('chat', { ordered: true });
      setupDataChannel(channel);
    } else {
      newPc.ondatachannel = (event) => setupDataChannel(event.channel);
    }

    const signaling = new SignalingClient({
      onPeerJoined: async () => {
        if (!asHost) return; // 仅 host 主动发起 offer
        try {
          const offer = await newPc.createOffer();
          await newPc.setLocalDescription(offer);
          signalingRef.current?.sendSignal({ kind: 'offer', sdp: newPc.localDescription });
          log(t.chat.p2p.peerJoinedConnecting);
          dev('sent offer');
        } catch (err) {
          log(t.chat.p2p.negotiationFailed, 'ERROR');
          dev(`创建 offer 失败: ${err instanceof Error ? err.message : err}`);
        }
      },
      onSignal: async (data) => {
        try {
          if (data?.kind === 'offer' && !asHost) {
            await newPc.setRemoteDescription(data.sdp);
            await flushCandidates(newPc);
            const answer = await newPc.createAnswer();
            await newPc.setLocalDescription(answer);
            signalingRef.current?.sendSignal({ kind: 'answer', sdp: newPc.localDescription });
            dev('received offer, sent answer');
          } else if (data?.kind === 'answer' && asHost) {
            await newPc.setRemoteDescription(data.sdp);
            await flushCandidates(newPc);
            dev('received answer');
          } else if (data?.kind === 'candidate' && data.candidate) {
            await addOrBufferCandidate(newPc, data.candidate);
          }
        } catch (err) {
          log(t.chat.p2p.negotiationError, 'ERROR');
          dev(`处理信令失败: ${err instanceof Error ? err.message : err}`);
        }
      },
      onPeerLeft: () => { log(t.chat.p2p.peerLeft, 'WARN'); setConnectionStatus('disconnected'); resetSecureState(); },
      onError: (e) => { log(t.chat.p2p.signalingError, 'ERROR'); dev(`signaling error: ${e}`); },
      onClose: () => {
        if (signalingRef.current !== signaling) return;
        dev('信令连接已关闭');
        signalingRef.current = null;

        // 信令在 WebRTC/DataChannel 真正建立前断开时，本次房间已不可继续使用；
        // 直接回到未连接状态，避免页面长期卡在「连接中」和失效分享链接。
        if (newPc.connectionState !== 'connected') {
          log(t.chat.p2p.signalingError, 'WARN');
          try { newPc.close(); } catch { /* ignore */ }
          if (pcRef.current === newPc) pcRef.current = null;
          setPc(prev => prev === newPc ? null : prev);
          setDc(null);
          setConnectionStatus('disconnected');
          setRoomLink('');
          setShowRoomDialog(false);
          resetSecureState();
          clearFileTransferState();
          stopHeartbeat();
        }
      }
    });
    signalingRef.current = signaling;

    try {
      if (iceWarningRef.current) log(iceWarningRef.current, 'WARN');
      await signaling.connect();
      // 仅房主把人数上限发给服务器锁定；访客不传（也无法放宽房主设定）。
      signaling.join(roomId, token, asHost ? maxClients : undefined);
      log(asHost ? t.chat.p2p.roomReadyWaiting : t.chat.p2p.joinedConnecting);
      dev(`joined room ${roomId}`);
    } catch (err) {
      log(t.chat.p2p.serverConnectFailed, 'ERROR');
      dev(`信令连接失败: ${err instanceof Error ? err.message : err}`);
      setConnectionStatus('disconnected');
    }
  }, [createPeerConnection, setupDataChannel, addOrBufferCandidate, flushCandidates, resetSecureState, clearFileTransferState, stopHeartbeat, log, dev]);

  // host：创建房间并生成分享链接
  const createRoom = useCallback(async () => {
    const { roomId, token } = generateRoomCredentials();
    const base = `${location.origin}${location.pathname}`;
    setRoomLink(`${base}#room=${roomId}&t=${token}`);
    setShowRoomDialog(true);
    // 严格一对一：房间人数上限锁定为 2（满员后服务器拒绝其他人加入）
    await beginSession(true, roomId, token, 2);
  }, [beginSession]);

  // guest：用房间参数加入
  const joinRoom = useCallback(async (roomId: string, token: string) => {
    setShowJoinDialog(false);
    setInputCode('');
    await beginSession(false, roomId, token);
  }, [beginSession]);

  // guest：手动粘贴房间链接加入
  const joinByPastedLink = useCallback(async () => {
    const parsed = parseRoomLink(inputCode.trim());
    if (!parsed) {
      log('房间链接无效，应形如 https://…/#room=xxx&t=yyy', 'ERROR');
      return;
    }
    await joinRoom(parsed.roomId, parsed.token);
  }, [inputCode, joinRoom, log]);

  // 打开页面时若 URL 带房间参数（分享链接），自动加入；随后清掉 hash 里的 token 避免泄漏到历史
  useEffect(() => {
    const parsed = parseRoomLink(location.hash);
    if (!parsed) return;
    try { history.replaceState(null, '', location.pathname + location.search); } catch { /* ignore */ }
    void joinRoom(parsed.roomId, parsed.token);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 发送消息（端到端加密）
  const sendMessage = useCallback(async () => {
    if (!messageInput.trim() || !dc || dc.readyState !== 'open') return;
    const peerId = peerIdRef.current;
    if (secureStatus !== 'secure' || !peerId) {
      log(t.chat.p2p.notSecureYet, 'WARN');
      return;
    }
    // 强制带外核对：在用户确认安全码一致前不允许发送，避免在未排除中间人的情况下泄露明文
    if (!sasConfirmed) {
      log(t.chat.p2p.verifySasFirst, 'WARN');
      return;
    }

    const message = messageInput.trim();
    try {
      const api = (window as any).electronAPI;
      // 经 Double Ratchet 加密：每条消息一把密钥，提供每条消息级前向保密
      const { type, body } = await api.ratchet.encrypt(peerId, JSON.stringify({ t: message }));
      dc.send(JSON.stringify({ type: 'cipher', payload: { t: type, b: body } }));
      addMessage(message, 'sent');
      setMessageInput('');
    } catch (error) {
      log(`${t.chat.sendFailed}: ${error}`, 'ERROR');
    }
  }, [messageInput, dc, secureStatus, sasConfirmed, addMessage, log]);

  const sendFile = useCallback(async (file: File) => {
    if (!dc || dc.readyState !== 'open' || connectionStatus !== 'connected' || secureStatus !== 'secure' || !sasConfirmed) {
      log(t.chat.p2p.verifySasFirst, 'WARN');
      return;
    }
    if (hasActiveFileTransfer()) {
      log(t.chat.p2p.file.busy, 'WARN');
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      log(t.chat.p2p.file.tooLarge, 'WARN');
      return;
    }

    const id = randomTransferId();
    try {
      const bytes = new Uint8Array(await file.arrayBuffer());
      const hash = await sha256Hex(bytes);
      const { key, raw } = await generateFileKey();
      const totalChunks = chunkCount(bytes.byteLength, DEFAULT_CHUNK_SIZE);
      const meta: FileOfferMeta = {
        id,
        name: file.name || 'file',
        size: bytes.byteLength,
        mime: file.type || 'application/octet-stream',
        chunkSize: DEFAULT_CHUNK_SIZE,
        totalChunks,
        hash,
        key: raw
      };

      const localUrl = URL.createObjectURL(file);
      objectUrlsRef.current.add(localUrl);
      upsertFileTransfer({
        id,
        direction: 'sent',
        name: meta.name,
        size: meta.size,
        mime: meta.mime,
        progress: 0,
        status: 'sending',
        url: localUrl
      });

      await sendEncryptedControl({ c: 'file_offer', f: meta }, dc);
      for (let seq = 0; seq < totalChunks; seq++) {
        if (cancelledFilesRef.current.has(id)) {
          await sendEncryptedControl({ c: 'file_cancel', id }, dc).catch(() => undefined);
          updateFileTransfer(id, { status: 'cancelled', error: t.chat.p2p.file.cancelled });
          return;
        }
        const { start, end } = chunkRange(seq, DEFAULT_CHUNK_SIZE, bytes.byteLength);
        const encrypted = await encryptChunk(key, bytes.subarray(start, end));
        dc.send(JSON.stringify({
          type: 'file_chunk',
          id,
          seq,
          iv: encrypted.iv,
          data: encrypted.data
        }));
        updateFileTransfer(id, { progress: (seq + 1) / totalChunks });
        await waitForDataChannelBackpressure(dc);
      }
      await sendEncryptedControl({ c: 'file_complete', id }, dc).catch(() => undefined);
      updateFileTransfer(id, { status: 'completed', progress: 1 });
    } catch (err) {
      updateFileTransfer(id, { status: 'failed', error: t.chat.p2p.file.failed });
      log(t.chat.p2p.file.offerFailed, 'ERROR');
      dev(`file send failed: ${err instanceof Error ? err.message : err}`);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }, [connectionStatus, dc, dev, hasActiveFileTransfer, log, sasConfirmed, secureStatus, sendEncryptedControl, t.chat.p2p.file.busy, t.chat.p2p.file.cancelled, t.chat.p2p.file.failed, t.chat.p2p.file.offerFailed, t.chat.p2p.file.tooLarge, t.chat.p2p.verifySasFirst, updateFileTransfer, upsertFileTransfer]);

  const handleFileInputChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0];
    if (!file) return;
    void sendFile(file);
  }, [sendFile]);

  const cancelFileTransfer = useCallback((id: string) => {
    cancelledFilesRef.current.add(id);
    receivingFilesRef.current.delete(id);
    updateFileTransfer(id, { status: 'cancelled', error: t.chat.p2p.file.cancelled });
    void sendEncryptedControl({ c: 'file_cancel', id }).catch(() => undefined);
  }, [sendEncryptedControl, t.chat.p2p.file.cancelled, updateFileTransfer]);

  // 断开连接
  const disconnect = useCallback(() => {
    if (signalingRef.current) {
      signalingRef.current.close();
      signalingRef.current = null;
    }
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    if (pc) {
      pc.close();
      setPc(null);
    }
    if (dc) {
      dc.close();
      setDc(null);
    }
    pendingCandidatesRef.current = [];
    setRole(null);
    setConnectionStatus('disconnected');
    setRoomLink('');
    setShowRoomDialog(false);
    resetSecureState();
    clearFileTransferState();
    stopHeartbeat();
    log(t.chat.p2p.disconnectedManual);
  }, [pc, dc, stopHeartbeat, resetSecureState, clearFileTransferState, log]);

  // 让握手回调（handleHello）能在验证失败时触发断开，避免 useCallback 定义顺序问题
  useEffect(() => {
    disconnectRef.current = disconnect;
  }, [disconnect]);

  // 复制到剪贴板
  const copyToClipboard = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      log(t.chat.p2p.copiedToClipboard);
    } catch (error) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      log(t.chat.p2p.copiedToClipboard);
    }
  }, [log]);

  // 组件卸载时清理：仅在真正卸载时断开。
  // 注意：依赖必须为空 []，否则 disconnect 随 pc/dc 变化而重建，会在建连过程中
  // （setPc/setDc 触发重渲染）误触发 cleanup 把刚建立的连接/数据通道关掉。改用 ref 取最新 disconnect。
  useEffect(() => {
    return () => {
      disconnectRef.current?.();
    };
  }, []);

  // 获取状态颜色
  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return '#27ae60';
      case 'connecting': return '#f39c12';
      default: return '#e74c3c';
    }
  };

  const getStatusText = () => {
    switch (connectionStatus) {
      case 'connected': return t.chat.connected;
      case 'connecting': return t.chat.connecting;
      default: return t.chat.notConnected;
    }
  };

  const fileStatusText = (status: FileTransferStatus) => {
    switch (status) {
      case 'sending': return t.chat.p2p.file.sending;
      case 'receiving': return t.chat.p2p.file.receiving;
      case 'completed': return t.chat.p2p.file.completed;
      case 'failed': return t.chat.p2p.file.failed;
      case 'cancelled': return t.chat.p2p.file.cancelled;
    }
  };

  const canSendContent = connectionStatus === 'connected' && secureStatus === 'secure' && sasConfirmed;
  const fileTransferBusy = fileTransfers.some(item => item.status === 'sending' || item.status === 'receiving');

  const styles = {
    container: {
      display: 'flex',
      flexDirection: 'column' as const,
      height: '100%',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    },
    header: {
      background: 'linear-gradient(135deg, #667eea, #764ba2)',
      color: 'white',
      padding: '15px 20px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    },
    closeBtn: {
      background: 'none',
      border: 'none',
      color: 'white',
      fontSize: '20px',
      cursor: 'pointer',
      padding: '5px'
    },
    statusBar: {
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      padding: '10px 20px',
      background: '#f8f9fa',
      borderBottom: '1px solid #e9ecef'
    },
    statusLight: {
      width: '10px',
      height: '10px',
      borderRadius: '50%',
      backgroundColor: getStatusColor()
    },
    secureBadge: {
      marginLeft: '12px',
      padding: '2px 8px',
      borderRadius: '10px',
      color: 'white',
      fontSize: '11px',
      fontWeight: 600
    },
    safetyBar: {
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
      padding: '6px 20px',
      background: '#eafaf1',
      borderBottom: '1px solid #d4efdf',
      fontSize: '12px',
      flexWrap: 'wrap' as const
    },
    controlsPanel: {
      padding: '15px 20px',
      background: '#f8f9fa',
      borderBottom: '1px solid #e9ecef',
      display: 'flex',
      gap: '10px',
      flexWrap: 'wrap' as const
    },
    btn: {
      padding: '8px 16px',
      border: 'none',
      borderRadius: '6px',
      background: '#667eea',
      color: 'white',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: '600'
    },
    btnSecondary: {
      padding: '8px 16px',
      border: '2px solid #667eea',
      borderRadius: '6px',
      background: 'white',
      color: '#667eea',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: '600'
    },
    btnDanger: {
      padding: '8px 16px',
      border: 'none',
      borderRadius: '6px',
      background: '#e74c3c',
      color: 'white',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: '600'
    },
    messagesContainer: {
      flex: 1,
      overflowY: 'auto' as const,
      padding: '15px 20px',
      background: 'white'
    },
    message: {
      marginBottom: '12px',
      padding: '8px 12px',
      borderRadius: '8px',
      maxWidth: '70%',
      wordWrap: 'break-word' as const
    },
    sentMessage: {
      background: '#667eea',
      color: 'white',
      alignSelf: 'flex-end',
      marginLeft: 'auto'
    },
    receivedMessage: {
      background: '#e9ecef',
      color: '#333'
    },
    systemMessage: {
      background: '#fff3cd',
      color: '#856404',
      fontSize: '12px',
      textAlign: 'center' as const,
      margin: '0 auto'
    },
    inputArea: {
      display: 'flex',
      gap: '10px',
      padding: '15px 20px',
      borderTop: '1px solid #e9ecef',
      background: 'white'
    },
    iconBtn: {
      width: '42px',
      minWidth: '42px',
      height: '42px',
      border: '2px solid #667eea',
      borderRadius: '8px',
      background: 'white',
      color: '#667eea',
      cursor: 'pointer',
      fontSize: '18px',
      fontWeight: '600'
    },
    input: {
      flex: 1,
      padding: '10px 15px',
      border: '2px solid #e9ecef',
      borderRadius: '8px',
      fontSize: '14px',
      outline: 'none'
    },
    fileCard: {
      marginBottom: '12px',
      padding: '10px 12px',
      borderRadius: '8px',
      maxWidth: '70%',
      border: '1px solid #dbe2ea',
      background: '#f8fbff',
      color: '#2d3748'
    },
    fileCardSent: {
      marginLeft: 'auto',
      background: '#eef0ff',
      borderColor: '#c8cef7'
    },
    fileName: {
      fontWeight: 700,
      fontSize: '13px',
      marginBottom: '4px',
      wordBreak: 'break-word' as const
    },
    progressOuter: {
      width: '100%',
      height: '6px',
      background: '#e9ecef',
      borderRadius: '999px',
      overflow: 'hidden',
      marginTop: '8px'
    },
    progressInner: {
      height: '100%',
      background: '#667eea',
      borderRadius: '999px'
    },
    imagePreview: {
      display: 'block',
      maxWidth: '260px',
      maxHeight: '180px',
      borderRadius: '6px',
      marginTop: '8px',
      objectFit: 'contain' as const,
      background: '#fff'
    },
    modal: {
      position: 'fixed' as const,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    },
    modalContent: {
      background: 'white',
      padding: '30px',
      borderRadius: '15px',
      maxWidth: '500px',
      width: '90%'
    },
    textarea: {
      width: '100%',
      height: '120px',
      margin: '15px 0',
      padding: '15px',
      border: '2px solid #e9ecef',
      borderRadius: '8px',
      fontFamily: 'monospace',
      fontSize: '12px',
      resize: 'vertical' as const
    }
  };

  return (
    <div style={styles.container}>
      {/* 瞬时提示浮层（右上角，自动消失），不污染聊天记录 */}
      {toasts.length > 0 && (
        <div style={{ position: 'fixed', top: 14, right: 14, zIndex: 2000, display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 360 }}>
          {toasts.map(t => (
            <div key={t.id} style={{
              padding: '9px 14px', borderRadius: 8, color: 'white', fontSize: 13, boxShadow: '0 4px 14px rgba(0,0,0,0.18)',
              background: t.kind === 'error' ? '#e74c3c' : t.kind === 'warn' ? '#e67e22' : '#34495e'
            }}>{t.text}</div>
          ))}
        </div>
      )}

      {/* 头部：标题 + 本机身份 + 连接/加密状态 + 关于 */}
      <div style={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0 }}>
          <h3 style={{ margin: 0 }}>{t.chat.p2p.headerTitle}</h3>
          <span
            style={{ fontSize: 12, opacity: 0.9, cursor: 'pointer', whiteSpace: 'nowrap' }}
            onClick={renameSelf}
            title={t.chat.p2p.editNicknameTitle}
          >
            {t.chat.p2p.mePrefix}{myName || t.chat.p2p.unnamed}{userIdentity?.customId ? ` · ${userIdentity.customId.slice(0, 8)}…` : ''} ✎
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
            <span style={styles.statusLight}></span>{getStatusText()}
          </span>
          {secureStatus === 'secure' && sasConfirmed && (
            <span style={{ ...styles.secureBadge, background: '#27ae60' }} title={t.chat.p2p.badgeVerifiedTitle}>
              {t.chat.p2p.badgeVerified}
            </span>
          )}
          {secureStatus === 'secure' && !sasConfirmed && (
            <span style={{ ...styles.secureBadge, background: '#f39c12' }} title={t.chat.p2p.badgeEncryptedTitle}>
              {t.chat.p2p.badgePendingSas}
            </span>
          )}
          {secureStatus === 'pending' && (
            <span style={{ ...styles.secureBadge, background: '#f39c12' }}>{t.chat.p2p.badgeHandshaking}</span>
          )}
          {secureStatus === 'failed' && (
            <span style={{ ...styles.secureBadge, background: '#e74c3c' }}>{t.chat.p2p.badgeFailed}</span>
          )}
          <span
            style={{ ...styles.secureBadge, background: 'rgba(255,255,255,0.2)', cursor: 'pointer' }}
            onClick={() => setShowAbout(v => !v)}
            title={t.chat.p2p.aboutTitle}
          >{t.chat.p2p.aboutToggle}</span>
        </div>
      </div>

      {/* 安全码聚焦弹窗：连接已加密但尚未核对时，强制聚焦这一步（反正未确认也不能发消息） */}
      {secureStatus === 'secure' && safetyCode && !sasConfirmed && (
        <div style={styles.modal}>
          <div style={{ ...styles.modalContent, maxWidth: 440, textAlign: 'center' }}>
            <h3 style={{ margin: '0 0 6px' }}>{t.chat.p2p.sasDialogTitle}</h3>
            <p style={{ color: '#666', fontSize: 14, margin: '0 0 16px' }}>
              {t.chat.p2p.sasDialogBodyLine1}<br />{t.chat.p2p.sasDialogBodyLine2}
            </p>
            <div style={{
              fontFamily: 'monospace', fontSize: 26, fontWeight: 700, letterSpacing: 2,
              background: '#f4f7ff', border: '2px solid #667eea', borderRadius: 10, padding: '16px 12px', color: '#33375a'
            }}>
              {safetyCode}
            </div>
            {peerInfo && (
              <p style={{ color: '#888', fontSize: 12, margin: '12px 0 18px' }}>
                {t.chat.p2p.peerPrefix}{peerInfo.nickname}（{peerInfo.userId.slice(0, 12)}…）
              </p>
            )}
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button
                style={{ ...styles.btn, padding: '10px 22px', fontSize: 15 }}
                onClick={() => { setSasConfirmed(true); pushToast(t.chat.p2p.sasConfirmedToast); }}
              >
                {t.chat.p2p.sasAgree}
              </button>
              <button
                style={{ ...styles.btnDanger, padding: '10px 22px', fontSize: 15 }}
                onClick={() => { log(t.chat.p2p.sasMismatch, 'ERROR'); disconnect(); }}
              >
                {t.chat.p2p.sasDisagree}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 已核对后的常驻安全码条（小字参考，绿色） */}
      {secureStatus === 'secure' && safetyCode && sasConfirmed && (
        <div style={styles.safetyBar}>
          <span>{t.chat.p2p.sasBarLabel} <strong style={{ fontFamily: 'monospace', letterSpacing: 1 }}>{safetyCode}</strong></span>
          {peerInfo && <span style={{ color: '#666' }}>{t.chat.p2p.peerPrefix}{peerInfo.nickname} ({peerInfo.userId.slice(0, 12)}…)</span>}
          <span style={{ color: '#27ae60', fontWeight: 600 }}>{t.chat.p2p.sasVerifiedMark}</span>
        </div>
      )}

      {/* 控制面板 */}
      <div style={styles.controlsPanel}>
        <button
          style={styles.btn}
          onClick={createRoom}
          disabled={connectionStatus !== 'disconnected'}
          title={t.chat.p2p.createRoomTitle}
        >
          {t.chat.p2p.createRoomBtn}
        </button>
        <span style={{ fontSize: 12, color: '#888' }}>{t.chat.p2p.oneToOneNote}</span>
        <button
          style={styles.btnSecondary}
          onClick={() => setShowJoinDialog(true)}
          disabled={connectionStatus !== 'disconnected'}
        >
          {t.chat.p2p.joinRoomBtn}
        </button>
        {connectionStatus !== 'disconnected' && (
          <button style={styles.btnDanger} onClick={disconnect}>
            ❌ {t.chat.disconnect}
          </button>
        )}
      </div>

      {/* 房间分享（host）：内联卡片，全部在同一页面内完成；连接建立后(connected)自动消失，无弹窗。 */}
      {roomLink && showRoomDialog && connectionStatus !== 'connected' && (
        <div style={{ padding: '12px', background: '#eef6ff', borderTop: '1px solid #cfe3fb' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <strong>{t.chat.p2p.roomCreatedHeading}</strong>
            <span style={{ fontSize: 12, color: connectionStatus === 'connecting' ? '#f39c12' : '#3498db' }}>
              {connectionStatus === 'connecting' ? t.chat.p2p.establishingEncrypted : t.chat.p2p.waitingPeerJoin}
            </span>
          </div>
          <input
            type="text"
            style={{ width: '100%', margin: '4px 0', padding: '8px 10px', border: '1px solid #cfe3fb', borderRadius: 6, fontFamily: 'monospace', fontSize: 12, boxSizing: 'border-box' }}
            value={roomLink}
            readOnly
            onFocus={(e) => e.currentTarget.select()}
          />
          <p style={{ fontSize: 12, color: '#856404', background: '#fff3cd', padding: '6px 10px', borderRadius: 6, margin: '6px 0' }}>
            {t.chat.p2p.roomLinkWarning}
          </p>
          <div style={{ display: 'flex', gap: 10 }}>
            <button style={styles.btn} onClick={() => copyToClipboard(roomLink)}>{t.chat.p2p.copyLink}</button>
            <button style={styles.btnSecondary} onClick={() => setShowRoomDialog(false)}>{t.chat.p2p.collapse}</button>
          </div>
        </div>
      )}

      {/* 关于 / 隐私与本地数据（默认折叠，点头部「ⓘ 关于」展开，减轻首屏密度） */}
      {showAbout && (
        <div style={{ padding: '10px 12px', background: '#f1f8f4', borderTop: '1px solid #e0eee5', fontSize: 12, color: '#555', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <span title={t.chat.p2p.aboutPrivacyTitle}>
            {t.chat.p2p.aboutPrivacyBody}
          </span>
          <button
            style={{ padding: '3px 10px', fontSize: 12, border: '1px solid #e0b4b4', borderRadius: 5, background: 'white', color: '#c0392b', cursor: 'pointer' }}
            onClick={async () => {
              if (!window.confirm(t.chat.p2p.clearDataConfirm)) return;
              try { await (window as any).electronAPI?.system?.clearLocalData?.(); } catch { /* ignore */ }
              window.location.reload();
            }}
            title={t.chat.p2p.clearDataTitle}
          >
            {t.chat.p2p.clearDataBtn}
          </button>
        </div>
      )}

      {/* 消息区域 */}
      <div style={styles.messagesContainer}>
        {messages.length === 0 && (
          <div style={{ color: '#aaa', textAlign: 'center', marginTop: 48, fontSize: 13, lineHeight: 1.8, whiteSpace: 'pre-line' }}>
            {connectionStatus === 'connected'
              ? t.chat.p2p.emptyConnected
              : t.chat.p2p.emptyDisconnected}
          </div>
        )}
        {messages.map((message) => (
          <div
            key={message.id}
            style={{
              ...styles.message,
              ...(message.type === 'sent' ? styles.sentMessage :
                  message.type === 'received' ? styles.receivedMessage :
                  styles.systemMessage)
            }}
          >
            {message.text}
            <div style={{ fontSize: '10px', marginTop: '4px', opacity: 0.7 }}>
              {new Date(message.timestamp).toLocaleTimeString()}
            </div>
          </div>
        ))}
        {fileTransfers.map((file) => (
          <div
            key={file.id}
            style={{
              ...styles.fileCard,
              ...(file.direction === 'sent' ? styles.fileCardSent : {})
            }}
          >
            <div style={styles.fileName}>{file.name}</div>
            <div style={{ fontSize: 12, opacity: 0.78 }}>
              {file.direction === 'sent' ? t.chat.p2p.file.sent : t.chat.p2p.file.received} · {formatBytes(file.size)} · {fileStatusText(file.status)}
              {file.status !== 'completed' && ` · ${Math.round(file.progress * 100)}%`}
            </div>
            {file.status !== 'completed' && file.status !== 'failed' && file.status !== 'cancelled' && (
              <div style={styles.progressOuter}>
                <div style={{ ...styles.progressInner, width: `${Math.max(2, Math.round(file.progress * 100))}%` }} />
              </div>
            )}
            {file.error && (
              <div style={{ fontSize: 12, color: '#c0392b', marginTop: 6 }}>{file.error}</div>
            )}
            {file.status === 'completed' && file.url && isImageMime(file.mime) && (
              <img src={file.url} alt={t.chat.p2p.file.imageAlt} style={styles.imagePreview} />
            )}
            {file.status === 'completed' && file.url && (
              <a
                href={file.url}
                download={file.name}
                style={{ display: 'inline-block', marginTop: 8, fontSize: 12, color: '#4b5bdc', fontWeight: 700 }}
              >
                {t.chat.p2p.file.download}
              </a>
            )}
            {(file.status === 'sending' || file.status === 'receiving') && (
              <button
                style={{ ...styles.btnSecondary, padding: '4px 10px', fontSize: 12, marginTop: 8 }}
                onClick={() => cancelFileTransfer(file.id)}
              >
                {t.chat.p2p.file.cancel}
              </button>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* 输入区域 */}
      <div style={styles.inputArea}>
        <input
          ref={fileInputRef}
          type="file"
          style={{ display: 'none' }}
          onChange={handleFileInputChange}
        />
        <button
          style={{ ...styles.iconBtn, opacity: canSendContent && !fileTransferBusy ? 1 : 0.45, cursor: canSendContent && !fileTransferBusy ? 'pointer' : 'not-allowed' }}
          title={t.chat.p2p.file.attachTitle}
          aria-label={t.chat.p2p.file.attachTitle}
          onClick={() => fileInputRef.current?.click()}
          disabled={!canSendContent || fileTransferBusy}
        >
          📎
        </button>
        <input
          style={styles.input}
          type="text"
          value={messageInput}
          onChange={(e) => setMessageInput(e.target.value)}
          onKeyPress={(e) => { if (e.key === 'Enter') void sendMessage(); }}
          placeholder={
            secureStatus !== 'secure'
              ? t.chat.p2p.placeholderWaitingSecure
              : !sasConfirmed
                ? t.chat.p2p.placeholderConfirmSas
                : t.chat.typePlaceholder
          }
          disabled={!canSendContent}
        />
        <button
          style={styles.btn}
          onClick={() => void sendMessage()}
          disabled={!canSendContent}
        >
          {t.chat.send}
        </button>
      </div>

      {/* 加入房间对话框（guest）：手动粘贴房间链接（通常直接打开链接即可，无需这一步） */}
      {showJoinDialog && (
        <div style={styles.modal}>
          <div style={styles.modalContent}>
            <h3>{t.chat.p2p.joinRoomDialogTitle}</h3>
            <p>{t.chat.p2p.pasteRoomLink}</p>
            <textarea
              style={styles.textarea}
              value={inputCode}
              onChange={(e) => setInputCode(e.target.value)}
              placeholder="https://…/#room=xxx&t=yyy"
            />
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button style={styles.btnSecondary} onClick={() => { setShowJoinDialog(false); setInputCode(''); }}>
                {t.chat.p2p.cancel}
              </button>
              <button style={styles.btn} onClick={joinByPastedLink}>
                {t.chat.p2p.join}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
