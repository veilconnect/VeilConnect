import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from '../i18n/useTranslation';

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

/**
 * 由双方的 X25519 box 公钥派生一个 6 位安全码（SAS）。
 * 两端比对结果一致即可排除「粘贴渠道被中间人中继并替换密钥」的攻击。
 * 对密钥排序后再哈希，保证双方算出同一个值。
 */
// 安全码（safety number）：基于双方「长期 Ed25519 身份公钥」派生，因此跨会话稳定、可带外核对。
// 取 SHA-256 前 8 字节（64 位熵），主动攻击者需 ~2^64 算力研磨碰撞身份，远高于旧版 ~20 位。
async function deriveSafetyCode(aIdentityKey: string, bIdentityKey: string): Promise<string> {
  const [x, y] = [aIdentityKey, bIdentityKey].sort();
  const data = new TextEncoder().encode(`veilconnect-safety|${x}|${y}`);
  const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', data));
  let num = 0n;
  for (let i = 0; i < 8; i++) num = (num << 8n) | BigInt(digest[i]);
  const code = (num % 10_000_000_000_000_000n).toString().padStart(16, '0');
  return code.replace(/(\d{4})(?=\d)/g, '$1 '); // 16 位分 4 组显示
}

// 默认 STUN：国内可达（Cloudflare + 小米 + B站），替换在中国被墙的 Google STUN。
// IPv6 候选由浏览器在有 IPv6 时自动收集，无需额外配置。
const DEFAULT_ICE_SERVERS: RTCIceServer[] = [
  { urls: 'stun:stun.cloudflare.com:3478' },
  { urls: 'stun:stun.miwifi.com:3478' },
  { urls: 'stun:stun.chat.bilibili.com:3478' }
];
// TURN 临时凭据签发端点（Cloudflare Worker / 自建后端）。留空则不启用动态 TURN；
// 运行时可用 localStorage 'vc.turnEndpoint' 覆盖，或用 'vc.turn' 直接配静态 TURN（自建 coturn）。
// 强制中继可用 localStorage 'vc.relayOnly' = '1'（隐藏双方真实 IP，代价是流量绕 TURN）。
const DEFAULT_TURN_ENDPOINT = '';

interface SimpleP2PChatProps {
  onClose?: () => void;
  userIdentity?: {
    customId: string;
    nickname: string;
    publicKey: string;
    privateKey: string;
  };
}

export const SimpleP2PChat: React.FC<SimpleP2PChatProps> = ({ onClose, userIdentity }) => {
  const { t } = useTranslation();
  // WebRTC状态
  const [pc, setPc] = useState<RTCPeerConnection | null>(null);
  const [dc, setDc] = useState<RTCDataChannel | null>(null);
  const [role, setRole] = useState<'host' | 'guest' | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  
  // 聊天状态
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [offerCode, setOfferCode] = useState('');
  const [answerCode, setAnswerCode] = useState('');
  const [inputCode, setInputCode] = useState('');
  
  // 对话框状态
  const [showOfferDialog, setShowOfferDialog] = useState(false);
  const [showAnswerDialog, setShowAnswerDialog] = useState(false);
  const [showJoinDialog, setShowJoinDialog] = useState(false);

  // 端到端加密 / 身份验证状态
  const [secureStatus, setSecureStatus] = useState<SecureStatus>('idle');
  const [peerInfo, setPeerInfo] = useState<{ userId: string; nickname: string } | null>(null);
  const [safetyCode, setSafetyCode] = useState('');

  // Refs
  const heartbeatInterval = useRef<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const selfIdentityRef = useRef<SelfIdentity | null>(null);
  const peerBoxKeyRef = useRef<string | null>(null);
  const disconnectRef = useRef<(() => void) | null>(null);
  // Double Ratchet：对端地址（用对端 userId 作为会话地址）
  const peerIdRef = useRef<string | null>(null);
  // 本地 ratchet prekey bundle + 其身份签名记忆化为单个 promise，
  // 避免 sendIdentity 与对端 hello 到达之间的竞态。
  const bundleInitRef = useRef<Promise<{ bundle: any; signature: string }> | null>(null);

  // WebRTC ICE 服务器：默认国内 STUN；TURN 可选（静态 vc.turn，或经端点动态签发临时凭据）。
  // 仅 STUN 即可覆盖公网/锥形NAT/双 IPv6 的用户；对称 NAT/大内网用户需 TURN 中继。
  const iceServersRef = useRef<RTCIceServer[]>([...DEFAULT_ICE_SERVERS]);
  const relayOnlyRef = useRef<boolean>(false);

  // 启动时加载 TURN 配置（静态 + 动态签发）；失败不影响仅 STUN 的连接
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const servers: RTCIceServer[] = [...DEFAULT_ICE_SERVERS];
      try {
        if (typeof localStorage !== 'undefined') {
          relayOnlyRef.current = localStorage.getItem('vc.relayOnly') === '1';
          const raw = localStorage.getItem('vc.turn');
          if (raw) {
            const turn = JSON.parse(raw) as RTCIceServer;
            if (turn && turn.urls) servers.push(turn);
          }
        }
      } catch {
        // 忽略坏配置
      }
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
          // 动态签发失败则仅用 STUN（外加已有的静态 TURN）
        }
      }
      if (!cancelled) iceServersRef.current = servers;
    })();
    return () => { cancelled = true; };
  }, []);

  // 等待 ICE 收集完成（带超时，避免轮询死循环）
  const waitForIceGathering = (target: RTCPeerConnection, timeoutMs = 5000) =>
    new Promise<void>((resolve) => {
      if (target.iceGatheringState === 'complete') return resolve();
      let done = false;
      const finish = () => {
        if (done) return;
        done = true;
        target.removeEventListener('icegatheringstatechange', onChange);
        resolve();
      };
      const onChange = () => {
        if (target.iceGatheringState === 'complete') finish();
      };
      target.addEventListener('icegatheringstatechange', onChange);
      setTimeout(finish, timeoutMs);
    });

  // 日志和消息处理
  const log = useCallback((msg: string, type: 'INFO' | 'ERROR' | 'WARN' = 'INFO') => {
    console.log(`[${type}] ${msg}`);
    const icon = type === 'INFO' ? 'ℹ️' : type === 'ERROR' ? '❌' : '⚠️';
    addMessage(`${icon} ${msg}`, 'system');
  }, []);

  const addMessage = useCallback((text: string, type: 'sent' | 'received' | 'system') => {
    const newMessage: Message = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      text,
      type,
      timestamp: Date.now()
    };
    setMessages(prev => [...prev, newMessage]);
  }, []);

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
        log(`加载本地身份失败: ${err}`, 'ERROR');
      }
    })();
  }, [log]);

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
      log('本地身份缺少加密公钥，无法建立安全通道', 'ERROR');
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
      log(`发起安全握手失败: ${err instanceof Error ? err.message : err}`, 'ERROR');
      setSecureStatus('failed');
    }
  }, [log, ensureBundle]);

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
        log(`已验证对方身份 (${String(peer.userId).slice(0, 12)}…)，棘轮通道已建立（发起方）`);
      } else {
        setSecureStatus('pending');
        log(`已验证对方身份 (${String(peer.userId).slice(0, 12)}…)，等待对端建立棘轮通道…`);
      }
    } catch (err) {
      setSecureStatus('failed');
      peerBoxKeyRef.current = null;
      peerIdRef.current = null;
      log(`对方身份验证失败，可能存在中间人攻击，已断开：${err instanceof Error ? err.message : err}`, 'ERROR');
      disconnectRef.current?.();
    }
  }, [log]);

  // 收到密文：经 Double Ratchet 解密（棘轮天然抗重放：每条消息密钥用后即删）
  const handleCipher = useCallback(async (payload: any) => {
    const peerId = peerIdRef.current;
    if (!peerId || !payload || typeof payload.t !== 'number') {
      log('安全通道未建立或密文格式错误，已丢弃', 'WARN');
      return;
    }
    try {
      const api = (window as any).electronAPI;
      // type 3（prekey 消息）会在接收方建立入站会话
      const plain = await api.ratchet.decrypt(peerId, payload.t, payload.b);
      const obj = JSON.parse(plain) as { c?: string; t?: string };
      if (obj.c === 'init') {
        // 发起方的会话建立控制消息：入站棘轮已就绪，标记安全（不显示）
        setSecureStatus('secure');
        return;
      }
      if (typeof obj.t === 'string') {
        addMessage(obj.t, 'received');
      }
    } catch {
      log('收到无法解密的消息（已丢弃）', 'ERROR');
    }
  }, [addMessage, log]);

  // 心跳机制
  const startHeartbeat = useCallback(() => {
    if (heartbeatInterval.current) return;
    
    heartbeatInterval.current = window.setInterval(() => {
      if (dc && dc.readyState === 'open') {
        try {
          const ping = { type: 'ping', timestamp: Date.now() };
          dc.send(JSON.stringify(ping));
        } catch (error) {
          log(`心跳发送失败: ${error}`, 'ERROR');
        }
      }
    }, 10000);
  }, [dc, log]);

  const stopHeartbeat = useCallback(() => {
    if (heartbeatInterval.current) {
      clearInterval(heartbeatInterval.current);
      heartbeatInterval.current = null;
    }
  }, []);

  // 创建PeerConnection
  const createPeerConnection = useCallback(() => {
    try {
      const newPc = new RTCPeerConnection({
        iceServers: iceServersRef.current,
        iceTransportPolicy: relayOnlyRef.current ? 'relay' : 'all'
      });
      log('PeerConnection创建成功');

      newPc.onicecandidate = (event) => {
        if (event.candidate) {
          log(`收集ICE候选: ${event.candidate.type}`);
        } else {
          log('ICE收集完成');
        }
      };

      newPc.onconnectionstatechange = () => {
        log(`连接状态: ${newPc.connectionState}`);
        
        if (newPc.connectionState === 'connected') {
          setConnectionStatus('connected');
          log('连接成功！可以开始聊天了！');
          startHeartbeat();
        } else if (newPc.connectionState === 'disconnected' || newPc.connectionState === 'failed') {
          setConnectionStatus('disconnected');
          stopHeartbeat();
        }
      };

      setPc(newPc);
      return newPc;
    } catch (error) {
      log(`创建PeerConnection失败: ${error}`, 'ERROR');
      return null;
    }
  }, [log, startHeartbeat, stopHeartbeat]);

  // 设置数据通道
  const setupDataChannel = useCallback((channel: RTCDataChannel) => {
    channel.onopen = () => {
      log('数据通道已打开，开始安全握手…');
      setConnectionStatus('connected');
      setSecureStatus('pending');
      void sendIdentity(channel);
    };

    channel.onclose = () => {
      log('数据通道已关闭');
      setConnectionStatus('disconnected');
      setSecureStatus('idle');
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
        default:
          // 未知/明文消息一律丢弃，杜绝降级到明文
          log('收到未知类型的帧，已忽略', 'WARN');
      }
    };

    setDc(channel);
  }, [log, sendIdentity, handleHello, handleCipher]);

  // 创建连接
  const createConnection = useCallback(async () => {
    const newPc = createPeerConnection();
    if (!newPc) return;

    setRole('host');
    setConnectionStatus('connecting');

    // 创建数据通道
    const channel = newPc.createDataChannel('chat', { ordered: true });
    setupDataChannel(channel);

    try {
      const offer = await newPc.createOffer();
      await newPc.setLocalDescription(offer);

      await waitForIceGathering(newPc);

      const fullOffer = JSON.stringify(newPc.localDescription);
      setOfferCode(fullOffer);
      setShowOfferDialog(true);
      log('邀请码已生成');
    } catch (error) {
      log(`创建连接失败: ${error}`, 'ERROR');
    }
  }, [createPeerConnection, setupDataChannel, log]);

  // 处理应答
  const handleAnswer = useCallback(async () => {
    if (!pc || !inputCode.trim()) return;

    try {
      const answer = JSON.parse(inputCode.trim());
      await pc.setRemoteDescription(answer);
      setShowOfferDialog(false);
      setInputCode('');
      log('应答已处理，等待连接建立');
    } catch (error) {
      log(`处理应答失败: ${error}`, 'ERROR');
    }
  }, [pc, inputCode, log]);

  // 加入连接
  const joinConnection = useCallback(async () => {
    if (!inputCode.trim()) return;

    const newPc = createPeerConnection();
    if (!newPc) return;

    setRole('guest');
    setConnectionStatus('connecting');

    newPc.ondatachannel = (event) => {
      setupDataChannel(event.channel);
    };

    try {
      const offer = JSON.parse(inputCode.trim());
      await newPc.setRemoteDescription(offer);

      const answer = await newPc.createAnswer();
      await newPc.setLocalDescription(answer);

      await waitForIceGathering(newPc);

      const fullAnswer = JSON.stringify(newPc.localDescription);
      setAnswerCode(fullAnswer);
      setShowAnswerDialog(true);
      setShowJoinDialog(false);
      setInputCode('');
      log('应答码已生成');
    } catch (error) {
      log(`加入连接失败: ${error}`, 'ERROR');
    }
  }, [inputCode, createPeerConnection, setupDataChannel, log]);

  // 发送消息（端到端加密）
  const sendMessage = useCallback(async () => {
    if (!messageInput.trim() || !dc || dc.readyState !== 'open') return;
    const peerId = peerIdRef.current;
    if (secureStatus !== 'secure' || !peerId) {
      log('安全通道尚未建立，无法发送消息', 'WARN');
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
      log(`发送消息失败: ${error}`, 'ERROR');
    }
  }, [messageInput, dc, secureStatus, addMessage, log]);

  // 断开连接
  const disconnect = useCallback(() => {
    if (pc) {
      pc.close();
      setPc(null);
    }
    if (dc) {
      dc.close();
      setDc(null);
    }
    setRole(null);
    setConnectionStatus('disconnected');
    setOfferCode('');
    setAnswerCode('');
    // 销毁棘轮会话状态
    if (peerIdRef.current) {
      void (window as any).electronAPI?.ratchet?.close?.(peerIdRef.current);
      peerIdRef.current = null;
    }
    bundleInitRef.current = null;
    peerBoxKeyRef.current = null;
    setSecureStatus('idle');
    setPeerInfo(null);
    setSafetyCode('');
    stopHeartbeat();
    log('连接已断开');
  }, [pc, dc, stopHeartbeat, log]);

  // 让握手回调（handleHello）能在验证失败时触发断开，避免 useCallback 定义顺序问题
  useEffect(() => {
    disconnectRef.current = disconnect;
  }, [disconnect]);

  // 复制到剪贴板
  const copyToClipboard = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      log('已复制到剪贴板');
    } catch (error) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      log('已复制到剪贴板');
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
    input: {
      flex: 1,
      padding: '10px 15px',
      border: '2px solid #e9ecef',
      borderRadius: '8px',
      fontSize: '14px',
      outline: 'none'
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
      {/* 头部 */}
      <div style={styles.header}>
        <h3>💬 P2P 安全聊天</h3>
        {onClose && (
          <button style={styles.closeBtn} onClick={onClose}>
            ×
          </button>
        )}
      </div>

      {/* 状态栏 */}
      <div style={styles.statusBar}>
        <div style={styles.statusLight}></div>
        <span>{getStatusText()}</span>
        {secureStatus === 'secure' && (
          <span style={{ ...styles.secureBadge, background: '#27ae60' }} title="消息已端到端加密，且对方身份已通过密钥绑定签名验证">
            🔒 已加密 · 已验证
          </span>
        )}
        {secureStatus === 'pending' && (
          <span style={{ ...styles.secureBadge, background: '#f39c12' }}>🔄 安全握手中…</span>
        )}
        {secureStatus === 'failed' && (
          <span style={{ ...styles.secureBadge, background: '#e74c3c' }}>⛔ 验证失败</span>
        )}
        {userIdentity && (
          <span style={{ marginLeft: '20px', fontSize: '12px', color: '#666' }}>
            用户: {userIdentity.nickname} ({userIdentity.customId})
          </span>
        )}
      </div>

      {/* 安全码：请与对方通过其他可信渠道（电话/当面）核对一致，以排除中间人 */}
      {secureStatus === 'secure' && safetyCode && (
        <div style={styles.safetyBar}>
          <span>🛡️ 安全码 <strong style={{ fontFamily: 'monospace', letterSpacing: 1 }}>{safetyCode}</strong></span>
          {peerInfo && (
            <span style={{ color: '#666' }}>
              对方: {peerInfo.nickname} ({peerInfo.userId.slice(0, 12)}…)
            </span>
          )}
          <span style={{ color: '#999' }}>请与对方带外核对此码一致</span>
        </div>
      )}

      {/* 控制面板 */}
      <div style={styles.controlsPanel}>
        <button style={styles.btn} onClick={createConnection}>
          🔗 {t.chat.createConnection}
        </button>
        <button style={styles.btnSecondary} onClick={() => setShowJoinDialog(true)}>
          🔌 {t.chat.joinConnection}
        </button>
        {connectionStatus === 'connected' && (
          <button style={styles.btnDanger} onClick={disconnect}>
            ❌ {t.chat.disconnect}
          </button>
        )}
      </div>

      {/* 消息区域 */}
      <div style={styles.messagesContainer}>
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
        <div ref={messagesEndRef} />
      </div>

      {/* 输入区域 */}
      <div style={styles.inputArea}>
        <input
          style={styles.input}
          type="text"
          value={messageInput}
          onChange={(e) => setMessageInput(e.target.value)}
          onKeyPress={(e) => { if (e.key === 'Enter') void sendMessage(); }}
          placeholder={secureStatus === 'secure' ? t.chat.typePlaceholder : '等待安全通道建立…'}
          disabled={connectionStatus !== 'connected' || secureStatus !== 'secure'}
        />
        <button
          style={styles.btn}
          onClick={() => void sendMessage()}
          disabled={connectionStatus !== 'connected' || secureStatus !== 'secure'}
        >
          {(t.chat as any).send ?? '发送'}
        </button>
      </div>

      {/* 邀请码对话框 */}
      {showOfferDialog && (
        <div style={styles.modal}>
          <div style={styles.modalContent}>
            <h3>🔗 邀请码已生成</h3>
            <p>请将以下邀请码发送给对方：</p>
            <textarea style={styles.textarea} value={offerCode} readOnly />
            <p>对方发送应答码后，请粘贴到下方：</p>
            <textarea 
              style={styles.textarea} 
              value={inputCode}
              onChange={(e) => setInputCode(e.target.value)}
              placeholder="粘贴应答码..."
            />
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button style={styles.btnSecondary} onClick={() => setShowOfferDialog(false)}>
                关闭
              </button>
              <button style={styles.btn} onClick={() => copyToClipboard(offerCode)}>
                📋 复制邀请码
              </button>
              <button style={styles.btn} onClick={handleAnswer}>
                确认应答
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 应答码对话框 */}
      {showAnswerDialog && (
        <div style={styles.modal}>
          <div style={styles.modalContent}>
            <h3>🔌 应答码已生成</h3>
            <p>请将以下应答码发送给对方：</p>
            <textarea style={styles.textarea} value={answerCode} readOnly />
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button style={styles.btnSecondary} onClick={() => setShowAnswerDialog(false)}>
                关闭
              </button>
              <button style={styles.btn} onClick={() => copyToClipboard(answerCode)}>
                📋 复制应答码
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 加入连接对话框 */}
      {showJoinDialog && (
        <div style={styles.modal}>
          <div style={styles.modalContent}>
            <h3>🔌 加入连接</h3>
            <p>请粘贴对方的邀请码：</p>
            <textarea 
              style={styles.textarea} 
              value={inputCode}
              onChange={(e) => setInputCode(e.target.value)}
              placeholder="粘贴邀请码..."
            />
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button style={styles.btnSecondary} onClick={() => setShowJoinDialog(false)}>
                取消
              </button>
              <button style={styles.btn} onClick={joinConnection}>
                加入连接
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 