import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from '../i18n/useTranslation';
import { SignalingClient, generateRoomCredentials, deriveRoomCredentials, isValidRoomCode, normalizeRoomCode } from '../../web/signaling/SignalingClient';
import {
  ChunkAssembler,
  DEFAULT_CHUNK_SIZE,
  FileOfferMeta,
  MAX_FILE_SIZE,
  chunkCount,
  chunkRange,
  encryptChunkRaw,
  decryptChunkRaw,
  packChunkFrame,
  unpackChunkFrame,
  formatBytes,
  generateFileKey,
  importFileKey,
  isImageMime,
  sha256Hex
} from '../../web/fileTransfer/fileTransfer';
import { deriveSafetyCode } from '../../web/security/safetyCode';
import { shareFile } from '../../web/blob/blobTransfer';

// 异步文件(网盘式)总开关:自部署默认开;托管版(无 /blob 后端)构建期注入 __VC_BLOB_ENABLED__=false 隐藏入口。
declare const __VC_BLOB_ENABLED__: boolean | undefined;
const BLOB_ENABLED = typeof __VC_BLOB_ENABLED__ === 'undefined' ? true : !!__VC_BLOB_ENABLED__;
import {
  generatePairingCode,
  generateNonce,
  groupPairingCode,
  normalizePairingCode,
  isValidPairingCode,
  preparePairing,
  verifyPeerReveal,
  contentGateOpen,
  PairingMaterials,
  PartyKeys
} from '../../web/security/pairing';

/** 配对码握手超时：pairRequired 后这段时间内未完成校验即断开，避免永久“验证中”。 */
const PAIR_HANDSHAKE_TIMEOUT_MS = 45_000;
import {
  DEFAULT_ICE_SERVERS,
  DEFAULT_TURN_ENDPOINT,
  FALLBACK_STUN,
  PRIMARY_STUN,
  hasTurnServer,
  probeStun,
  readRelayOnly,
  readStaticTurn
} from '../../web/webrtc/iceConfig';
import { waitForDataChannelBackpressure } from '../../web/webrtc/backpressure';
import { reportPairingSuccess } from '../../web/metrics';

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
  lastPct?: number; // 进度节流：上次已上报的整百分点
}

function displayNickname(nickname: string | undefined | null): string {
  const name = (nickname || '').trim();
  if (!name) return '';
  if (name === 'Guest User' || name === '匿名用户' || name === '未知用户') return '';
  if (/^User_[a-z0-9]+_[a-z0-9]+$/i.test(name)) return '';
  return name;
}

function formatIdentityLabel(prefix: string, nickname: string | undefined | null, userId: string | undefined | null): string {
  const name = displayNickname(nickname);
  const id = (userId || '').trim();
  if (name && id) return `${prefix}${name} · ${id}`;
  if (name) return `${prefix}${name}`;
  return `${prefix}${id}`;
}

function randomTransferId(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
}

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
  // 自定义房间号：双方约定一个短号码即可会合，无需传那串很长、易在转发渠道泄露的链接。
  const [showRoomCodeDialog, setShowRoomCodeDialog] = useState(false);
  const [roomCodeInput, setRoomCodeInput] = useState('');
  const [sharedRoomCode, setSharedRoomCode] = useState(''); // host 创建后展示给对方的房间号

  // 端到端加密 / 身份验证状态
  const [secureStatus, setSecureStatus] = useState<SecureStatus>('idle');
  const [peerInfo, setPeerInfo] = useState<{ userId: string; nickname: string } | null>(null);
  const [safetyCode, setSafetyCode] = useState('');
  // 用户是否已带外核对安全码（SAS）。在确认前只能声称「已加密」，不能声称「已验证/抗 MITM」。
  const [sasConfirmed, setSasConfirmed] = useState(false);

  // 配对码（自动抗 MITM）：双方带外共享一个高熵配对码，握手时密码学自动核对，无需肉眼比对 SAS。
  // pairRequired：本会话是否启用配对码（任一端启用即双方都走，fail-closed 不降级）。
  const [pairRequired, setPairRequired] = useState(false);
  const [pairVerified, setPairVerified] = useState(false);
  const [usePairing, setUsePairing] = useState(false); // host 建房时是否启用
  const [pairingCode, setPairingCode] = useState('');   // host 生成的配对码（供展示/带外分享）
  const [showPairEnter, setShowPairEnter] = useState(false); // guest 输入配对码弹窗
  const [pairEnterInput, setPairEnterInput] = useState('');
  const [joinPairInput, setJoinPairInput] = useState('');     // guest 加入弹窗里可选预填配对码
  // 异步文件(网盘式):上传加密 blob 得分享链接(无需对方在线)
  const [blobLink, setBlobLink] = useState('');
  const [blobBusy, setBlobBusy] = useState(false);
  const blobInputRef = useRef<HTMLInputElement>(null);

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

  // 配对码握手状态（用 ref 以便在 DataChannel 回调里同步读写，避免 setState 异步竞态）。
  const pairRequiredRef = useRef<boolean>(false);     // 本会话是否启用配对码
  const pairCodeRef = useRef<string | null>(null);    // 归一化后的配对码（host 生成 / guest 输入）
  const pairVerifiedRef = useRef<boolean>(false);
  const pairReportedRef = useRef<boolean>(false);          // 匿名计数去重：本次连接是否已上报过配对成功
  const pairSelfKeysRef = useRef<PartyKeys | null>(null);   // 本端身份/box/棘轮三元组
  const pairPeerKeysRef = useRef<PartyKeys | null>(null);   // 对端三元组（来自 hello）
  const pairMaterialsRef = useRef<PairingMaterials | null>(null);
  const peerPairCommitRef = useRef<string | null>(null);
  const peerPairRevealRef = useRef<string | null>(null);
  const myCommitSentRef = useRef<boolean>(false);
  const myRevealSentRef = useRef<boolean>(false);
  const pairSelfNonceRef = useRef<string | null>(null); // 本端本会话一次性 nonce（防重放）
  const pairTimeoutRef = useRef<number | null>(null);    // 配对握手超时计时器
  // startPairing / enterPairingMode 在文件后段定义，handleHello 在前段，用 ref 指针打破顺序依赖。
  const startPairingRef = useRef<((channel: RTCDataChannel) => Promise<void>) | null>(null);
  const enterPairingModeRef = useRef<(() => void) | null>(null);
  // 早于 handleHello 完成(peerId 未设)到达的密文先缓冲,握手完成后顺序重放——防 {c:'init'} 因竞态丢失。
  const pendingCipherRef = useRef<any[]>([]);
  const handleCipherRef = useRef<((payload: any) => Promise<void>) | null>(null);
  // handleHello 重入防护:已完成或处理中则忽略重复/恶意 hello(await 拉长了重入窗口,防 secure 被打回 pending)。
  const helloInFlightRef = useRef<boolean>(false);

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
      const relayOnly = readRelayOnly();
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
      const staticTurn = readStaticTurn();
      if (staticTurn) servers.push(staticTurn);

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
      const hasTurn = hasTurnServer(servers);
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
    historyLoadedRef.current = null;
    sasConfirmedRef.current = false;
    queuedRxRef.current = [];
    pendingCipherRef.current = [];
    helloInFlightRef.current = false;
    peerBoxKeyRef.current = null;
    // 配对码会话状态（保留 host 已生成的 pairCode/pairRequired 设置直到真正断开，避免重连丢失）
    pairVerifiedRef.current = false;
    pairSelfKeysRef.current = null;
    pairPeerKeysRef.current = null;
    pairMaterialsRef.current = null;
    peerPairCommitRef.current = null;
    peerPairRevealRef.current = null;
    myCommitSentRef.current = false;
    myRevealSentRef.current = false;
    pairSelfNonceRef.current = null;
    if (pairTimeoutRef.current) { clearTimeout(pairTimeoutRef.current); pairTimeoutRef.current = null; }
    pairReportedRef.current = false; // 重置匿名计数去重：下次新配对成功可再计一次
    setSecureStatus('idle');
    setPeerInfo(null);
    setSafetyCode('');
    setSasConfirmed(false);
    setPairVerified(false);
  }, []);

  // 启动配对握手超时：到时仍未验证则断开（避免永久“验证中”卡死）。
  const armPairingTimeout = useCallback(() => {
    if (pairTimeoutRef.current) return;
    pairTimeoutRef.current = window.setTimeout(() => {
      pairTimeoutRef.current = null;
      if (pairRequiredRef.current && !pairVerifiedRef.current) {
        log(t.chat.p2p.pairTimedOut, 'ERROR');
        disconnectRef.current?.();
      }
    }, PAIR_HANDSHAKE_TIMEOUT_MS);
  }, [log]);

  // 进入配对模式（fail-closed 总开关）：任何一端要求、或收到任何 pair-* 帧都会调用。
  // 一旦进入：① 启动超时；② 若此前已走手动 SAS 放行（疑似 late 配对帧/降级注入），立即断开。
  const enterPairingMode = useCallback(() => {
    const firstTime = !pairRequiredRef.current;
    if (firstTime) {
      pairRequiredRef.current = true;
      setPairRequired(true);
    }
    // 幂等地启动超时（host/预填码 guest 已提前置 pairRequired=true，仍需在连接活跃后开始计时）。
    armPairingTimeout();
    // 首次进入配对模式时若此前已走手动 SAS 放行（疑似 late 配对帧/降级注入），立即断开。
    if (firstTime && sasConfirmedRef.current && !pairVerifiedRef.current) {
      log(t.chat.p2p.pairFailed, 'ERROR');
      disconnectRef.current?.();
    }
  }, [armPairingTimeout, log]);

  useEffect(() => { enterPairingModeRef.current = enterPairingMode; }, [enterPairingMode]);

  // 内容门禁统一判定：配对模式只认 pairVerified；否则认手动 SAS（向后兼容）。
  const isContentUnlocked = useCallback(() => (
    contentGateOpen(pairRequiredRef.current, pairVerifiedRef.current, sasConfirmedRef.current)
  ), []);

  // 匿名使用计数：配对/SAS 验证成功（密码学确认无中间人）时,仅由 host 一端、每次连接至多一次
  // 上报一个【空】信标,使「一次成功配对 = +1」。不含任何身份/房间/IP/内容/精确时间。详见 web/metrics.ts。
  useEffect(() => {
    if (role === 'host' && !pairReportedRef.current
        && contentGateOpen(pairRequired, pairVerified, sasConfirmed)) {
      pairReportedRef.current = true;
      reportPairingSuccess();
    }
  }, [role, pairRequired, pairVerified, sasConfirmed]);

  // 修改本机昵称（对端在握手后会看到它）
  const renameSelf = useCallback(async () => {
    const next = (window.prompt(t.chat.p2p.setNicknamePrompt, displayNickname(myName)) || '').trim();
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

  // 可选的消息持久化（默认关，保持「关页即焚」的隐私默认）。
  // 设 localStorage 'vc.persist' = '1' 开启：文本消息按对端 userId 分会话，经加密 Web Worker
  // 内的 MessageHistoryManager（per-store 密钥 AES 加密落 IndexedDB）保存，重连后自动载入。
  const persistRef = useRef<boolean>(false);
  const historyLoadedRef = useRef<string | null>(null);
  useEffect(() => {
    try {
      persistRef.current = typeof localStorage !== 'undefined' && localStorage.getItem('vc.persist') === '1';
    } catch { /* ignore */ }
  }, []);

  // SAS 待核对期间：解密照常（证明安全信道），但对端的【可见内容】（文本/文件 offer）先入队、
  // 不进入 UI，直到用户带外核对安全码并确认一致后才统一放行。
  // 这样可避免「未排除中间人时，对端注入的内容已先展示」的钓鱼/混淆面（codex 评审指出的接收侧缺口）。
  const sasConfirmedRef = useRef<boolean>(false);
  const queuedRxRef = useRef<Array<{ kind: 'text'; peerId: string; text: string } | { kind: 'file'; meta: FileOfferMeta }>>([]);
  useEffect(() => { sasConfirmedRef.current = sasConfirmed; }, [sasConfirmed]);

  const persistMessage = useCallback(async (peerId: string, text: string, direction: 'incoming' | 'outgoing') => {
    if (!persistRef.current || !peerId) return;
    try {
      await (window as any).electronAPI?.messageHistory?.save?.({
        id: `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
        sessionId: peerId,
        peerId,
        direction,
        content: text,
        contentType: 'text',
        timestamp: Date.now(),
        status: 'delivered'
      });
    } catch { /* 持久化失败不影响收发 */ }
  }, []);

  const loadHistory = useCallback(async (peerId: string) => {
    if (!persistRef.current || !peerId || historyLoadedRef.current === peerId) return;
    historyLoadedRef.current = peerId;
    try {
      const rows = await (window as any).electronAPI?.messageHistory?.get?.({ sessionId: peerId });
      if (!Array.isArray(rows) || rows.length === 0) return;
      const restored: Message[] = rows
        .filter((m: any) => m && m.contentType === 'text' && typeof m.content === 'string')
        .map((m: any) => ({
          id: String(m.id),
          text: m.content,
          type: m.direction === 'outgoing' ? 'sent' : 'received',
          timestamp: Number(m.timestamp) || Date.now()
        }));
      if (restored.length) setMessages(prev => [...restored, ...prev]);
    } catch { /* 历史载入失败静默忽略 */ }
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
      // 本会话一次性 nonce（防旧 proof 重放），随 hello 交换并纳入配对 transcript。
      if (!pairSelfNonceRef.current) pairSelfNonceRef.current = generateNonce();
      channel.send(JSON.stringify({
        type: 'hello',
        userId: id.userId,
        publicKey: id.publicKey,
        boxPublicKey: id.boxPublicKey,
        keyBindingSignature: id.keyBindingSignature,
        ratchetBundle: bundle,
        ratchetSignature: signature,
        nickname: id.nickname,
        // 是否要求用配对码验证（对端据此提示输入；任一端要求即双方都走，fail-closed）
        pairing: pairRequiredRef.current,
        pairNonce: pairSelfNonceRef.current
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

  // chunk: { seq: number; iv: Uint8Array; cipher: Uint8Array }（来自二进制帧解析）
  const processFileChunk = useCallback(async (id: string, chunk: any, rx: ReceivingFile) => {
    if (cancelledFilesRef.current.has(id)) return;
    try {
      const plain = await decryptChunkRaw(rx.key, chunk.iv, chunk.cipher);
      const fresh = rx.assembler.add(chunk.seq, plain);
      if (!fresh) return;
      const pct = Math.floor(rx.assembler.progress * 100); // 按整百分点节流上报
      if (pct !== rx.lastPct) { rx.lastPct = pct; updateFileTransfer(id, { progress: rx.assembler.progress }); }
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
      // 全局上限：防攻击者用大量不同 id 的「孤儿 chunk」在 offer/验证放行前耗尽内存。
      let total = 0;
      for (const arr of pendingFileChunksRef.current.values()) total += arr.length;
      if (total >= 8192) return;
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
    // 重入防护:已完成握手(peerId 已设)或正在处理,则忽略重复/恶意 hello——
    // 否则下面的 await 期间二次进入会把已 secure 的状态打回 pending。
    if (peerIdRef.current || helloInFlightRef.current) { dev('忽略重复/并发 hello'); return; }
    helloInFlightRef.current = true;
    // 健壮性:确保本机身份已载入(慢设备上 onopen 可能早于身份加载完成)。
    let self = selfIdentityRef.current;
    if (!self) {
      try {
        const id = await (window as any).electronAPI?.identity?.getCurrentIdentity?.();
        if (id) {
          selfIdentityRef.current = {
            userId: id.userId, publicKey: id.publicKey, boxPublicKey: id.boxPublicKey,
            keyBindingSignature: id.keyBindingSignature, nickname: id.nickname
          };
          self = selfIdentityRef.current;
        }
      } catch { /* 下面 fail closed */ }
    }
    if (!self) {
      // 身份仍取不到 → fail closed:无本机身份无法算安全码,会话不可信,拒绝握手。
      helloInFlightRef.current = false;
      log(t.chat.p2p.loadIdentityFailed, 'ERROR');
      dev('本机身份缺失,拒绝握手'); disconnectRef.current?.();
      return;
    }
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
      void loadHistory(peer.userId);
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

      // —— 配对码（自动抗 MITM）——
      // 始终记录双方「身份 + box + 棘轮 + nonce」：transcript 绑定它们，中间人必须冒充→两端观测不同→证明不匹配。
      // 即便对端 hello 的 pairing 标志被中间人剥离，后续收到 pair-commit/reveal 也能据此启动（降级防御）。
      if (self?.publicKey && self.boxPublicKey) {
        const myBundle = await ensureBundle();
        if (!pairSelfNonceRef.current) pairSelfNonceRef.current = generateNonce();
        pairSelfKeysRef.current = {
          identityKey: self.publicKey,
          boxKey: self.boxPublicKey,
          ratchetKey: myBundle.bundle.identityKey,
          nonce: pairSelfNonceRef.current
        };
        pairPeerKeysRef.current = {
          identityKey: bundle.publicKey,
          boxKey: bundle.boxPublicKey,
          ratchetKey: bundle.ratchetBundle.identityKey,
          nonce: typeof bundle.pairNonce === 'string' ? bundle.pairNonce : ''
        };
      }
      // 任一端要求即双方都走（fail-closed，不降级到仅手动 SAS）。
      const usePair = !!bundle.pairing || pairRequiredRef.current;
      if (usePair) {
        enterPairingModeRef.current?.();
        if (pairCodeRef.current) await startPairingRef.current?.(channel);
        else setShowPairEnter(true); // 本端尚无配对码（guest）→ 提示输入
      }

      // 重放握手完成前缓冲的早到密文(如竞态先到的 {c:'init'})。放在最后(含配对设置之后,
      // 避免配对模式下短暂出现「secure 但 pairRequired 未置位」的 UI 抖动);**顺序 await**——
      // ratchet 解密有状态,乱序会导致后到的消息先跑而解不开。
      if (pendingCipherRef.current.length) {
        const buffered = pendingCipherRef.current;
        pendingCipherRef.current = [];
        dev(`replaying ${buffered.length} buffered cipher(s)`);
        for (const p of buffered) { try { await handleCipherRef.current?.(p); } catch { /* 单条失败不影响其余 */ } }
      }
    } catch (err) {
      setSecureStatus('failed');
      peerBoxKeyRef.current = null;
      peerIdRef.current = null;
      helloInFlightRef.current = false;   // 允许失败后重试
      log(t.chat.p2p.peerVerifyFailed, 'ERROR');
      dev(`identity verification failed: ${err instanceof Error ? err.message : err}`);
      disconnectRef.current?.();
    }
  }, [log, dev, loadHistory, ensureBundle]);

  // 收到密文：经 Double Ratchet 解密（棘轮天然抗重放：每条消息密钥用后即删）
  // SAS 确认后放行此前入队的对端可见内容（文本进聊天记录、文件 offer 进入接收流程）。
  const flushQueuedRx = useCallback(() => {
    const queued = queuedRxRef.current;
    queuedRxRef.current = [];
    for (const item of queued) {
      if (item.kind === 'text') {
        addMessage(item.text, 'received');
        void persistMessage(item.peerId, item.text, 'incoming');
      } else {
        void handleFileOffer(item.meta);
      }
    }
  }, [addMessage, persistMessage, handleFileOffer]);

  const handleCipher = useCallback(async (payload: any) => {
    if (!payload || typeof payload.t !== 'number') {
      dev('密文格式错误，已丢弃');
      return;
    }
    const peerId = peerIdRef.current;
    if (!peerId) {
      // handleHello 尚未完成(peerId 未设):缓冲早到密文,握手完成后由 handleHello 重放,
      // 避免发起方的 {c:'init'} 因竞态先到而被丢弃 → responder 永停 pending、永不弹安全码。
      if (pendingCipherRef.current.length < 64) { pendingCipherRef.current.push(payload); dev('密文早于握手完成,已缓冲待重放'); }
      else dev('早到密文缓冲已满(>64),丢弃本条');
      return;
    }
    try {
      const api = (window as any).electronAPI;
      // type 3（prekey 消息）会在接收方建立入站会话
      const plain = await api.ratchet.decrypt(peerId, payload.t, payload.b);
      // 健壮性:能成功解密即证明入站安全信道已建立 → 确保转入 secure(幂等)。
      // 这样即便 {c:'init'} 仍因某种原因丢失,后续任一消息也能把 responder 推进到 secure。
      setSecureStatus('secure');
      const obj = JSON.parse(plain) as { c?: string; t?: string; f?: FileOfferMeta; id?: string };
      if (obj.c === 'init') {
        // 发起方的会话建立控制消息：入站棘轮已就绪，标记安全并提示接收方核对安全码
        log(t.chat.p2p.e2eEstablished);
        return;
      }
      // 控制类消息（取消/完成）始终处理；但「新文件 offer」与「文本」在 SAS 确认前先入队。
      if (obj.c === 'file_cancel' && typeof obj.id === 'string') {
        handleFileCancel(obj.id);
        return;
      }
      if (obj.c === 'file_complete') {
        return;
      }
      if (obj.c === 'file_offer' && obj.f) {
        if (isContentUnlocked()) void handleFileOffer(obj.f);
        else queuedRxRef.current.push({ kind: 'file', meta: obj.f });
        return;
      }
      if (typeof obj.t === 'string') {
        if (isContentUnlocked()) {
          addMessage(obj.t, 'received');
          void persistMessage(peerId, obj.t, 'incoming');
        } else {
          // 未核对安全码/未通过配对码前不展示对端内容，仅入队，待放行
          queuedRxRef.current.push({ kind: 'text', peerId, text: obj.t });
          dev('内容门禁未放行，已缓存对端消息，待 SAS/配对码确认后放行');
        }
      }
    } catch {
      dev('收到无法解密的消息（已丢弃）');
    }
  }, [addMessage, handleFileCancel, handleFileOffer, persistMessage, log, dev, isContentUnlocked]);

  // 让 handleHello（前段定义）能顺序 await 重放缓冲密文(handleCipher 本身是 async)。
  useEffect(() => { handleCipherRef.current = handleCipher; }, [handleCipher]);

  // ——————————————————— 配对码（自动抗 MITM）握手 ———————————————————
  // 校验对端 reveal：commit 绑定 + 常量时间比对。一致=已密码学确认无中间人→放行内容；
  // 不一致=配对码错误或存在中间人→立即断开、不展示任何内容。
  const tryVerifyPairing = useCallback(async () => {
    const m = pairMaterialsRef.current;
    const commit = peerPairCommitRef.current;
    const reveal = peerPairRevealRef.current;
    if (!m || !commit || !reveal || pairVerifiedRef.current) return; // 材料未齐或已完成
    let ok = false;
    try { ok = await verifyPeerReveal(m, commit, reveal); } catch { ok = false; }
    if (ok) {
      pairVerifiedRef.current = true;
      setPairVerified(true);
      if (pairTimeoutRef.current) { clearTimeout(pairTimeoutRef.current); pairTimeoutRef.current = null; }
      // 配对成功 = 已密码学确认无中间人。门禁走 isContentUnlocked()（配对模式认 pairVerified），
      // 不再借道 sasConfirmed，避免两条路径互相绕过；放行此前入队的对端内容。
      flushQueuedRx();
      pushToast(t.chat.p2p.pairVerifiedBadge);
    } else {
      log(t.chat.p2p.pairFailed, 'ERROR');
      disconnectRef.current?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flushQueuedRx, pushToast, log]);

  // 已发 commit 且收到对端 commit 后，再 reveal 自己的 proof（commit-then-reveal）。
  const maybeSendReveal = useCallback((channel: RTCDataChannel) => {
    if (myCommitSentRef.current && peerPairCommitRef.current && !myRevealSentRef.current &&
        pairMaterialsRef.current && channel.readyState === 'open') {
      channel.send(JSON.stringify({ type: 'pair-reveal', proof: pairMaterialsRef.current.myProof }));
      myRevealSentRef.current = true;
    }
  }, []);

  // 备好本端配对材料并发出 commit；若对端 commit/reveal 已到则顺势 reveal/校验。
  const startPairing = useCallback(async (channel: RTCDataChannel) => {
    const code = pairCodeRef.current;
    const self = pairSelfKeysRef.current;
    const peer = pairPeerKeysRef.current;
    if (!code || !self || !peer || pairMaterialsRef.current) return; // 缺料或已开始
    let materials: PairingMaterials;
    try { materials = await preparePairing(code, self, peer); }
    catch (err) { dev(`pairing prepare failed: ${err instanceof Error ? err.message : err}`); return; }
    pairMaterialsRef.current = materials;
    if (channel.readyState === 'open' && !myCommitSentRef.current) {
      channel.send(JSON.stringify({ type: 'pair-commit', commit: materials.myCommit }));
      myCommitSentRef.current = true;
    }
    maybeSendReveal(channel);
    if (peerPairRevealRef.current) void tryVerifyPairing();
  }, [dev, maybeSendReveal, tryVerifyPairing]);

  // 让 handleHello（前段定义）能调用 startPairing。
  useEffect(() => { startPairingRef.current = startPairing; }, [startPairing]);

  const handlePairCommit = useCallback(async (data: any, channel: RTCDataChannel) => {
    if (typeof data?.commit !== 'string') return;
    peerPairCommitRef.current = data.commit;
    // 降级防御：收到任何 pair-* 帧即进入配对模式（即便 hello 的 pairing 标志被中间人剥离）。
    enterPairingModeRef.current?.();
    if (!pairCodeRef.current) { setShowPairEnter(true); return; } // 等用户输入码
    if (!pairMaterialsRef.current) await startPairing(channel);
    else { maybeSendReveal(channel); void tryVerifyPairing(); } // reveal 可能已缓冲，补一次校验
  }, [startPairing, maybeSendReveal, tryVerifyPairing]);

  const handlePairReveal = useCallback(async (data: any, channel: RTCDataChannel) => {
    if (typeof data?.proof !== 'string') return;
    peerPairRevealRef.current = data.proof;
    enterPairingModeRef.current?.();
    // reveal 可能早于本端备料：若有码则确保已启动握手（startPairing 内会顺势校验缓冲的 reveal）。
    if (pairCodeRef.current && !pairMaterialsRef.current) await startPairing(channel);
    else if (!pairCodeRef.current) setShowPairEnter(true);
    await tryVerifyPairing();
  }, [startPairing, tryVerifyPairing]);

  // guest 输入配对码后：归一化 + 长度校验（拒弱码）→ 进入配对模式 → 启动握手。
  const confirmPairCode = useCallback(async () => {
    const norm = normalizePairingCode(pairEnterInput);
    if (!isValidPairingCode(norm)) { log(t.chat.p2p.pairMissingCode, 'WARN'); return; }
    pairCodeRef.current = norm;
    enterPairingModeRef.current?.();
    setShowPairEnter(false);
    setPairEnterInput('');
    if (dc && dc.readyState === 'open') await startPairing(dc);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pairEnterInput, dc, startPairing, log]);

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
    channel.binaryType = 'arraybuffer'; // 文件分块走二进制帧（ArrayBuffer），免 base64 膨胀
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
      // 二进制帧 = 文件分块（ArrayBuffer）：解析后走文件接收流程，绝不走 JSON 分支。
      if (event.data instanceof ArrayBuffer) {
        const frame = unpackChunkFrame(event.data);
        if (frame) void handleFileChunk(frame);
        else dev('收到无法解析的二进制帧，已忽略');
        return;
      }
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
        case 'pair-commit':
          void handlePairCommit(data, channel);
          break;
        case 'pair-reveal':
          void handlePairReveal(data, channel);
          break;
        default:
          // 未知/明文消息一律丢弃，杜绝降级到明文
          dev('收到未知类型的帧，已忽略');
      }
    };

    setDc(channel);
  }, [log, resetSecureState, clearFileTransferState, sendIdentity, handleHello, handleCipher, handleFileChunk, handlePairCommit, handlePairReveal]);

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

    // host 发 offer：幂等（只发一次）。同时支持两种到场顺序——
    // ① host 先入房、guest 后到（onPeerJoined）；② guest 先入房、host 后到（onJoined 时已满 2 人）。
    // 后者正是「自定义房间号」流程需要的：双方都先知道房间号，谁先点都行。
    let offerSent = false;
    const sendOfferOnce = async () => {
      if (!asHost || offerSent) return;
      offerSent = true;
      try {
        const offer = await newPc.createOffer();
        await newPc.setLocalDescription(offer);
        signalingRef.current?.sendSignal({ kind: 'offer', sdp: newPc.localDescription });
        log(t.chat.p2p.peerJoinedConnecting);
        dev('sent offer');
      } catch (err) {
        offerSent = false; // 失败回滚，允许后续重试
        log(t.chat.p2p.negotiationFailed, 'ERROR');
        dev(`创建 offer 失败: ${err instanceof Error ? err.message : err}`);
      }
    };
    const signaling = new SignalingClient({
      onJoined: (clientCount: number) => {
        // 自己入房时房间已有对端（≥2 人）→ host 立即发 offer（对端先到的情形）。
        if (asHost && clientCount >= 2) void sendOfferOnce();
      },
      onPeerJoined: () => { void sendOfferOnce(); },
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
          setSharedRoomCode('');
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
      await signaling.connect(roomId); // 传 roomId 以便 Cloudflare 信令 Worker 路由到房间 DO
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
    // host 启用配对码：生成高熵码并锁定本会话走配对验证（hello 会带 pairing 标志通知对端）。
    if (usePairing) {
      const code = generatePairingCode();
      pairCodeRef.current = code;
      pairRequiredRef.current = true;
      setPairRequired(true);
      setPairingCode(code);
    }
    // 严格一对一：房间人数上限锁定为 2（满员后服务器拒绝其他人加入）
    await beginSession(true, roomId, token, 2);
  }, [beginSession, usePairing]);

  // guest：用房间参数加入
  const joinRoom = useCallback(async (roomId: string, token: string) => {
    setShowJoinDialog(false);
    setInputCode('');
    await beginSession(false, roomId, token);
  }, [beginSession]);

  // guest：手动粘贴房间链接加入。可选预填配对码 → 本地声明持有，立即锁定 fail-closed，
  // 不再依赖远端 hello/pair-commit 通知（防中间人剥离这些帧使本端静默退回手动 SAS）。
  const joinByPastedLink = useCallback(async () => {
    const parsed = parseRoomLink(inputCode.trim());
    if (!parsed) {
      log(t.chat.p2p.invalidRoomLink, 'ERROR');
      return;
    }
    const codeInput = normalizePairingCode(joinPairInput);
    if (codeInput) {
      if (!isValidPairingCode(codeInput)) { log(t.chat.p2p.pairMissingCode, 'WARN'); return; }
      pairCodeRef.current = codeInput;
      pairRequiredRef.current = true;   // 在 beginSession/sendIdentity 之前置真，使本端 hello 带 pairing 标志
      setPairRequired(true);
      setJoinPairInput('');
    }
    await joinRoom(parsed.roomId, parsed.token);
  }, [inputCode, joinPairInput, joinRoom, log]);

  // 自定义房间号：host 先开房（确定性派生 roomId/token），把短号码告诉对方。
  const createRoomByCode = useCallback(async () => {
    const norm = normalizeRoomCode(roomCodeInput);
    if (!isValidRoomCode(norm)) { log(t.chat.p2p.roomCodeTooShort, 'WARN'); return; }
    const { roomId, token } = await deriveRoomCredentials(norm);
    setSharedRoomCode(norm);
    setRoomLink('');                 // 房间号模式不展示长链接
    setShowRoomCodeDialog(false);
    setRoomCodeInput('');
    setShowRoomDialog(true);         // 复用房间面板展示「房间号」与状态
    await beginSession(true, roomId, token, 2);
  }, [roomCodeInput, beginSession, log]);

  // 自定义房间号：guest 用同一个号码加入（派生出与 host 相同的 roomId/token）。
  const joinRoomByCode = useCallback(async () => {
    const norm = normalizeRoomCode(roomCodeInput);
    if (!isValidRoomCode(norm)) { log(t.chat.p2p.roomCodeTooShort, 'WARN'); return; }
    const { roomId, token } = await deriveRoomCredentials(norm);
    setShowRoomCodeDialog(false);
    setRoomCodeInput('');
    await beginSession(false, roomId, token);
  }, [roomCodeInput, beginSession, log]);

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
    // 强制抗 MITM 门禁：配对模式须 pairVerified、否则须手动核对 SAS，未放行前不允许发送（防泄露明文）
    if (!contentGateOpen(pairRequired, pairVerified, sasConfirmed)) {
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
      void persistMessage(peerId, message, 'outgoing');
      setMessageInput('');
    } catch (error) {
      log(`${t.chat.sendFailed}: ${error}`, 'ERROR');
    }
  }, [messageInput, dc, secureStatus, sasConfirmed, pairRequired, pairVerified, addMessage, persistMessage, log]);

  const sendFile = useCallback(async (file: File) => {
    const gateOk = contentGateOpen(pairRequired, pairVerified, sasConfirmed);
    if (!dc || dc.readyState !== 'open' || connectionStatus !== 'connected' || secureStatus !== 'secure' || !gateOk) {
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
      let lastPct = -1; // 进度按整百分点节流，避免分块变小后 setState 风暴
      for (let seq = 0; seq < totalChunks; seq++) {
        if (cancelledFilesRef.current.has(id)) {
          await sendEncryptedControl({ c: 'file_cancel', id }, dc).catch(() => undefined);
          updateFileTransfer(id, { status: 'cancelled', error: t.chat.p2p.file.cancelled });
          return;
        }
        const { start, end } = chunkRange(seq, DEFAULT_CHUNK_SIZE, bytes.byteLength);
        const { iv, cipher } = await encryptChunkRaw(key, bytes.subarray(start, end));
        dc.send(packChunkFrame(id, seq, iv, cipher)); // 二进制帧:免 base64,载荷近翻倍
        const pct = Math.floor(((seq + 1) / totalChunks) * 100);
        if (pct !== lastPct) { lastPct = pct; updateFileTransfer(id, { progress: (seq + 1) / totalChunks }); }
        await waitForDataChannelBackpressure(dc);
      }
      await sendEncryptedControl({ c: 'file_complete', id }, dc).catch(() => undefined);
      updateFileTransfer(id, { status: 'completed', progress: 1 });
    } catch (err) {
      await sendEncryptedControl({ c: 'file_cancel', id, reason: 'failed' }, dc).catch(() => undefined);
      updateFileTransfer(id, { status: 'failed', error: t.chat.p2p.file.failed });
      log(t.chat.p2p.file.offerFailed, 'ERROR');
      dev(`file send failed: ${err instanceof Error ? err.message : err}`);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }, [connectionStatus, dc, dev, hasActiveFileTransfer, log, sasConfirmed, pairRequired, pairVerified, secureStatus, sendEncryptedControl, t.chat.p2p.file.busy, t.chat.p2p.file.cancelled, t.chat.p2p.file.failed, t.chat.p2p.file.offerFailed, t.chat.p2p.file.tooLarge, t.chat.p2p.verifySasFirst, updateFileTransfer, upsertFileTransfer]);

  const handleFileInputChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0];
    if (!file) return;
    void sendFile(file);
  }, [sendFile]);

  // 异步文件(网盘式):本地加密 → 上传密文 → 得分享链接(密钥在链接 #片段,服务器解不开)。
  // 无需对方在线;可选提取密码。链接经可信渠道发给对方,对方打开即下载解密。
  const handleBlobShareChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0];
    if (event.currentTarget) event.currentTarget.value = '';
    if (!file) return;
    setBlobBusy(true); setBlobLink('');
    try {
      const pw = (window.prompt(t.chat.p2p.blobPasswordPrompt, '') || '').trim();
      const { link } = await shareFile(file, { origin: location.origin, password: pw || undefined });
      setBlobLink(link);
      log(t.chat.p2p.blobReady);
    } catch (err) {
      if (err instanceof Error && err.message === 'blob-too-large') { log(t.chat.p2p.blobTooLarge, 'WARN'); setBlobBusy(false); return; }
      log(t.chat.p2p.blobFailed, 'ERROR');
      dev(`blob share failed: ${err instanceof Error ? err.message : err}`);
    } finally {
      setBlobBusy(false);
    }
  }, [log, dev]);

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
    setSharedRoomCode('');
    setShowRoomDialog(false);
    setShowRoomCodeDialog(false);
    // 彻底清除配对码会话设置（resetSecureState 故意保留它以便重连，断开时才清）
    pairRequiredRef.current = false;
    pairCodeRef.current = null;
    pairSelfNonceRef.current = null;
    if (pairTimeoutRef.current) { clearTimeout(pairTimeoutRef.current); pairTimeoutRef.current = null; }
    setPairRequired(false);
    setPairingCode('');
    setShowPairEnter(false);
    setPairEnterInput('');
    setJoinPairInput('');
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

  const canSendContent = connectionStatus === 'connected' && secureStatus === 'secure' && contentGateOpen(pairRequired, pairVerified, sasConfirmed);
  const fileTransferBusy = fileTransfers.some(item => item.status === 'sending' || item.status === 'receiving');
  const myUserId = selfIdentityRef.current?.userId || userIdentity?.customId || '';
  const myIdentityLabel = formatIdentityLabel(t.chat.p2p.mePrefix, myName, myUserId);

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
      marginInlineStart: '12px',
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
      marginInlineStart: 'auto'
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
      marginInlineStart: 'auto',
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
        <div style={{ position: 'fixed', top: 14, insetInlineEnd: 14, zIndex: 2000, display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 360 }}>
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
            style={{ fontSize: 12, opacity: 0.9, cursor: 'pointer', overflowWrap: 'anywhere' }}
            onClick={renameSelf}
            title={t.chat.p2p.editNicknameTitle}
          >
            {myIdentityLabel} ✎
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
            <span style={styles.statusLight}></span>{getStatusText()}
          </span>
          {secureStatus === 'secure' && pairRequired && pairVerified && (
            <span style={{ ...styles.secureBadge, background: '#27ae60' }} title={t.chat.p2p.pairVerifiedBadge}>
              {t.chat.p2p.pairVerifiedBadge}
            </span>
          )}
          {secureStatus === 'secure' && pairRequired && !pairVerified && (
            <span style={{ ...styles.secureBadge, background: '#f39c12' }} title={t.chat.p2p.badgeEncryptedTitle}>
              {t.chat.p2p.pairVerifyingBadge}
            </span>
          )}
          {secureStatus === 'secure' && !pairRequired && sasConfirmed && (
            <span style={{ ...styles.secureBadge, background: '#27ae60' }} title={t.chat.p2p.badgeVerifiedTitle}>
              {t.chat.p2p.badgeVerified}
            </span>
          )}
          {secureStatus === 'secure' && !pairRequired && !sasConfirmed && (
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

      {/* 安全码聚焦弹窗：连接已加密但尚未核对时，强制聚焦这一步（反正未确认也不能发消息）。
          启用配对码时跳过此弹窗——改由配对码自动验证。 */}
      {secureStatus === 'secure' && safetyCode && !sasConfirmed && !pairRequired && (
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
              <p style={{ color: '#888', fontSize: 12, margin: '12px 0 18px', overflowWrap: 'anywhere' }}>
                {formatIdentityLabel(t.chat.p2p.peerPrefix, peerInfo.nickname, peerInfo.userId)}
              </p>
            )}
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button
                style={{ ...styles.btn, padding: '10px 22px', fontSize: 15 }}
                onClick={() => { sasConfirmedRef.current = true; setSasConfirmed(true); flushQueuedRx(); pushToast(t.chat.p2p.sasConfirmedToast); }}
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

      {/* 配对码状态条：验证中 / 已验证（替代手动 SAS） */}
      {secureStatus === 'secure' && pairRequired && (
        <div style={styles.safetyBar}>
          {pairVerified ? (
            <span style={{ color: '#27ae60', fontWeight: 600 }}>{t.chat.p2p.pairVerifiedMark}</span>
          ) : (
            <span style={{ color: '#b9770e' }}>{t.chat.p2p.pairVerifyingBadge}</span>
          )}
          {peerInfo && <span style={{ color: '#666', overflowWrap: 'anywhere' }}>{formatIdentityLabel(t.chat.p2p.peerPrefix, peerInfo.nickname, peerInfo.userId)}</span>}
        </div>
      )}

      {/* 已核对后的常驻安全码条（小字参考，绿色）；配对码模式下不显示 SAS 条 */}
      {secureStatus === 'secure' && safetyCode && sasConfirmed && !pairRequired && (
        <div style={styles.safetyBar}>
          <span>{t.chat.p2p.sasBarLabel} <strong style={{ fontFamily: 'monospace', letterSpacing: 1 }}>{safetyCode}</strong></span>
          {peerInfo && <span style={{ color: '#666', overflowWrap: 'anywhere' }}>{formatIdentityLabel(t.chat.p2p.peerPrefix, peerInfo.nickname, peerInfo.userId)}</span>}
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
        <label style={{ fontSize: 12, color: '#555', display: 'inline-flex', alignItems: 'center', gap: 5, cursor: connectionStatus === 'disconnected' ? 'pointer' : 'not-allowed' }}>
          <input
            type="checkbox"
            checked={usePairing}
            disabled={connectionStatus !== 'disconnected'}
            onChange={(e) => setUsePairing(e.target.checked)}
          />
          {t.chat.p2p.pairUseToggle}
        </label>
        <button
          style={styles.btnSecondary}
          onClick={() => setShowJoinDialog(true)}
          disabled={connectionStatus !== 'disconnected'}
        >
          {t.chat.p2p.joinRoomBtn}
        </button>
        <button
          style={styles.btnSecondary}
          onClick={() => { setRoomCodeInput(''); setShowRoomCodeDialog(true); }}
          disabled={connectionStatus !== 'disconnected'}
          title={t.chat.p2p.roomCodeTitle}
        >
          {t.chat.p2p.roomCodeBtn}
        </button>
        {connectionStatus !== 'disconnected' && (
          <button style={styles.btnDanger} onClick={disconnect}>
            ❌ {t.chat.disconnect}
          </button>
        )}
        {/* 异步文件(网盘式):随时可用,无需对方在线。托管版无 /blob 后端时隐藏入口。 */}
        {BLOB_ENABLED && (<>
          <button
            style={{ ...styles.btnSecondary, opacity: blobBusy ? 0.6 : 1 }}
            onClick={() => blobInputRef.current?.click()}
            disabled={blobBusy}
            title={t.chat.p2p.blobShareTitle}
          >
            {blobBusy ? t.chat.p2p.blobUploading : t.chat.p2p.blobShareBtn}
          </button>
          <input ref={blobInputRef} type="file" style={{ display: 'none' }} onChange={handleBlobShareChange} />
        </>)}
      </div>

      {/* 异步文件分享链接结果卡片 */}
      {BLOB_ENABLED && blobLink && (
        <div style={{ padding: '12px', background: '#eef9f1', borderTop: '1px solid #cde9d6' }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>{t.chat.p2p.blobLinkHeading}</div>
          <input
            type="text" value={blobLink} readOnly onFocus={(e) => e.currentTarget.select()}
            style={{ width: '100%', margin: '4px 0', padding: '8px 10px', border: '1px solid #cde9d6', borderRadius: 6, fontFamily: 'monospace', fontSize: 12, boxSizing: 'border-box' }}
          />
          <p style={{ fontSize: 12, color: '#a05a00', margin: '6px 0' }}>{t.chat.p2p.blobLinkHint}</p>
          <div style={{ display: 'flex', gap: 10 }}>
            <button style={styles.btn} onClick={() => copyToClipboard(blobLink)}>{t.chat.p2p.copyLink}</button>
            <button style={styles.btnSecondary} onClick={() => setBlobLink('')}>{t.chat.p2p.collapse}</button>
          </div>
        </div>
      )}

      {/* 房间分享（host）：内联卡片，全部在同一页面内完成；连接建立后(connected)自动消失，无弹窗。 */}
      {(roomLink || sharedRoomCode) && showRoomDialog && connectionStatus !== 'connected' && (
        <div style={{ padding: '12px', background: '#eef6ff', borderTop: '1px solid #cfe3fb' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <strong>{t.chat.p2p.roomCreatedHeading}</strong>
            <span style={{ fontSize: 12, color: connectionStatus === 'connecting' ? '#f39c12' : '#3498db' }}>
              {connectionStatus === 'connecting' ? t.chat.p2p.establishingEncrypted : t.chat.p2p.waitingPeerJoin}
            </span>
          </div>
          {sharedRoomCode ? (
            <>
              <div style={{ fontSize: 12, color: '#555', marginBottom: 4 }}>{t.chat.p2p.roomCodeShareLabel}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', margin: '2px 0 6px' }}>
                <code style={{ fontSize: 20, fontWeight: 700, letterSpacing: 2, color: '#2c5fa4' }}>{sharedRoomCode}</code>
                <button style={{ ...styles.btnSecondary, padding: '4px 10px', fontSize: 12 }} onClick={() => copyToClipboard(sharedRoomCode)}>{t.chat.p2p.copyLink}</button>
              </div>
              <p style={{ fontSize: 12, color: '#856404', background: '#fff3cd', padding: '6px 10px', borderRadius: 6, margin: '6px 0' }}>
                {t.chat.p2p.roomCodeShareHint}
              </p>
            </>
          ) : (
            <>
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
            </>
          )}
          {pairingCode && (
            <div style={{ margin: '8px 0', padding: '8px 10px', background: '#eef9f1', border: '1px solid #cde9d6', borderRadius: 6 }}>
              <div style={{ fontSize: 12, color: '#555', marginBottom: 4 }}>{t.chat.p2p.pairCodeLabel}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <code style={{ fontSize: 16, fontWeight: 700, letterSpacing: 1, color: '#2c7a4b' }}>{groupPairingCode(pairingCode)}</code>
                <button style={{ ...styles.btnSecondary, padding: '4px 10px', fontSize: 12 }} onClick={() => copyToClipboard(groupPairingCode(pairingCode))}>{t.chat.p2p.copyLink}</button>
              </div>
              <p style={{ fontSize: 12, color: '#a05a00', margin: '6px 0 0' }}>{t.chat.p2p.pairShareHint}</p>
            </div>
          )}
          <div style={{ display: 'flex', gap: 10 }}>
            {roomLink && <button style={styles.btn} onClick={() => copyToClipboard(roomLink)}>{t.chat.p2p.copyLink}</button>}
            <button style={styles.btnSecondary} onClick={() => setShowRoomDialog(false)}>{t.chat.p2p.collapse}</button>
          </div>
        </div>
      )}

      {/* 配对码输入弹窗（guest）：对端启用配对码且本端尚无码时，强制输入 */}
      {showPairEnter && (
        <div style={styles.modal}>
          <div style={{ ...styles.modalContent, maxWidth: 440 }}>
            <h3 style={{ marginTop: 0 }}>{t.chat.p2p.pairEnterTitle}</h3>
            <p style={{ color: '#666', fontSize: 14 }}>{t.chat.p2p.pairEnterBody}</p>
            <input
              style={{ width: '100%', padding: '10px 12px', border: '2px solid #e9ecef', borderRadius: 8, fontFamily: 'monospace', fontSize: 15, boxSizing: 'border-box', letterSpacing: 1 }}
              value={pairEnterInput}
              onChange={(e) => setPairEnterInput(e.target.value)}
              onKeyPress={(e) => { if (e.key === 'Enter') void confirmPairCode(); }}
              placeholder={t.chat.p2p.pairEnterPlaceholder}
              autoFocus
            />
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 16 }}>
              <button style={styles.btnDanger} onClick={() => { setShowPairEnter(false); disconnect(); }}>{t.chat.p2p.cancel}</button>
              <button style={styles.btn} onClick={() => void confirmPairCode()}>{t.chat.p2p.pairConfirmBtn}</button>
            </div>
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
      {/* 自定义房间号弹窗：双方约定一个短号码——一方「创建」、另一方「加入」。 */}
      {showRoomCodeDialog && (
        <div style={styles.modal}>
          <div style={styles.modalContent}>
            <h3>{t.chat.p2p.roomCodeDialogTitle}</h3>
            <p style={{ color: '#666', fontSize: 14 }}>{t.chat.p2p.roomCodeDialogBody}</p>
            <input
              style={{ width: '100%', padding: '10px 12px', border: '2px solid #e9ecef', borderRadius: 8, fontFamily: 'monospace', fontSize: 16, boxSizing: 'border-box', letterSpacing: 1 }}
              value={roomCodeInput}
              onChange={(e) => setRoomCodeInput(e.target.value)}
              placeholder={t.chat.p2p.roomCodePlaceholder}
              autoFocus
            />
            <p style={{ fontSize: 12, color: '#856404', background: '#fff3cd', padding: '6px 10px', borderRadius: 6, margin: '10px 0 0' }}>
              {t.chat.p2p.roomCodeSecurityHint}
            </p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: 14, flexWrap: 'wrap' }}>
              <button style={styles.btnSecondary} onClick={() => { setShowRoomCodeDialog(false); setRoomCodeInput(''); }}>
                {t.chat.p2p.cancel}
              </button>
              <button style={styles.btnSecondary} onClick={() => void joinRoomByCode()}>
                {t.chat.p2p.roomCodeJoinBtn}
              </button>
              <button style={styles.btn} onClick={() => void createRoomByCode()}>
                {t.chat.p2p.roomCodeCreateBtn}
              </button>
            </div>
          </div>
        </div>
      )}

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
            <div style={{ fontSize: 12, color: '#555', margin: '4px 0 4px' }}>{t.chat.p2p.pairJoinOptional}</div>
            <input
              style={{ width: '100%', padding: '8px 10px', border: '2px solid #e9ecef', borderRadius: 8, fontFamily: 'monospace', fontSize: 14, boxSizing: 'border-box', letterSpacing: 1 }}
              value={joinPairInput}
              onChange={(e) => setJoinPairInput(e.target.value)}
              placeholder={t.chat.p2p.pairEnterPlaceholder}
            />
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: 12 }}>
              <button style={styles.btnSecondary} onClick={() => { setShowJoinDialog(false); setInputCode(''); setJoinPairInput(''); }}>
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
