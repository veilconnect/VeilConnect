/**
 * 浏览器内运行的 VeilConnect 安全握手（供 Puppeteer 驱动，跑在真实 Chromium libwebrtc 上）。
 * 复用 App 真实的 RatchetManager（libsignal，浏览器原生）；身份/SAS 用 tweetnacl + SubtleCrypto
 * 按 IdentityManager 完全相同的字节运算实现（浏览器内不便引 node-crypto 的 createHash 等）。
 * 协议与 SimpleP2PChat 一致：hello → 验签 → 确定性发起方 → Double Ratchet → 加密往返。
 * 末尾把 API 挂到 window.VC，编排器经 page.evaluate 调用。
 */
import { RatchetManager } from '../../src/main/crypto/RatchetManager';
import * as nacl from 'tweetnacl';
import * as naclUtil from 'tweetnacl-util';

const BASE58 = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
function base58(buf: Uint8Array): string {
  let hex = ''; for (const b of buf) hex += b.toString(16).padStart(2, '0');
  let num = BigInt('0x' + hex); let out = '';
  while (num > 0n) { out = BASE58[Number(num % 58n)] + out; num /= 58n; }
  for (let i = 0; i < buf.length && buf[i] === 0; i++) out = '1' + out;
  return out || '1';
}
async function sha256(b: Uint8Array): Promise<Uint8Array> {
  return new Uint8Array(await crypto.subtle.digest('SHA-256', b));
}
async function userIdFromPub(pub: Uint8Array): Promise<string> {
  return base58((await sha256(pub)).slice(0, 16));
}
async function deriveSafetyCode(aKey: string, bKey: string): Promise<string> {
  const [x, y] = [aKey, bKey].sort();
  const digest = await sha256(new TextEncoder().encode(`veilconnect-safety|${x}|${y}`));
  let num = 0n; for (let i = 0; i < 10; i++) num = (num << 8n) | BigInt(digest[i]);
  return (num % 100_000_000_000_000_000_000n).toString().padStart(20, '0').replace(/(\d{4})(?=\d)/g, '$1 ');
}

const log = (...a: unknown[]) => console.log('[VC]', ...a);

let self: any = null, ratchet: RatchetManager, pc: RTCPeerConnection, dc: RTCDataChannel | null = null;
let peerId: string | null = null, secure = false, mitmRejected = false, sas = '';
const received: string[] = [];
let resolveSent: () => void; const sentDone = new Promise<void>((r) => { resolveSent = r; });

function waitIce(p: RTCPeerConnection, ms = 5000) {
  return new Promise<void>((res) => {
    if (p.iceGatheringState === 'complete') return res();
    const h = () => { if (p.iceGatheringState === 'complete') { p.removeEventListener('icegatheringstatechange', h); res(); } };
    p.addEventListener('icegatheringstatechange', h); setTimeout(res, ms);
  });
}

async function buildHello() {
  const bundle = await ratchet.getLocalBundle();
  const sig = naclUtil.encodeBase64(nacl.sign.detached(naclUtil.decodeBase64(bundle.identityKey), self.secret));
  return { type: 'hello', userId: self.userId, publicKey: self.publicKey, boxPublicKey: self.boxPublicKey,
    keyBindingSignature: self.keyBindingSignature, ratchetBundle: bundle, ratchetSignature: sig, nickname: self.role };
}

async function importAndVerifyPeer(msg: any): Promise<string> {
  const pub = naclUtil.decodeBase64(msg.publicKey);
  if ((await userIdFromPub(pub)) !== msg.userId) throw new Error('userId 不匹配');
  const boxOk = nacl.sign.detached.verify(naclUtil.decodeBase64(msg.boxPublicKey), naclUtil.decodeBase64(msg.keyBindingSignature), pub);
  if (!boxOk) throw new Error('box 绑定签名无效');
  const ratchetOk = nacl.sign.detached.verify(naclUtil.decodeBase64(msg.ratchetBundle.identityKey), naclUtil.decodeBase64(msg.ratchetSignature), pub);
  if (!ratchetOk) throw new Error('ratchet 签名无效');
  return msg.userId;
}

let sent = false;
async function sendTests() {
  if (sent || !peerId || !dc) return; sent = true;
  for (const text of [`hi-from-${self.role}-1 你好🌏`, `hi-from-${self.role}-2 🔒`]) {
    const { type, body } = await ratchet.encrypt(peerId, JSON.stringify({ t: text }));
    dc.send(JSON.stringify({ type: 'cipher', payload: { t: type, b: body } }));
  }
  resolveSent();
}

async function onHello(msg: any) {
  peerId = await importAndVerifyPeer(msg);
  sas = await deriveSafetyCode(self.publicKey, msg.publicKey);
  log('对端已验证', peerId, 'SAS', sas);
  if (self.userId > peerId) {
    await ratchet.establish(peerId, msg.ratchetBundle);
    const init = await ratchet.encrypt(peerId, JSON.stringify({ c: 'init' }));
    dc!.send(JSON.stringify({ type: 'cipher', payload: { t: init.type, b: init.body } }));
    secure = true; await sendTests();
  }
}
async function onCipher(p: any) {
  if (!peerId) return;
  const obj = JSON.parse(await ratchet.decrypt(peerId, p.t, p.b));
  if (obj.c === 'init') { secure = true; await sendTests(); return; }
  if (typeof obj.t === 'string') received.push(obj.t);
}
function wire(ch: RTCDataChannel) {
  dc = ch;
  ch.onopen = () => buildHello().then((h) => ch.send(JSON.stringify(h)));
  ch.onmessage = (e) => {
    let m: any; try { m = JSON.parse(e.data); } catch { return; }
    if (m.type === 'hello') void onHello(m);
    else if (m.type === 'cipher') void onCipher(m.payload);
  };
}

const VC = {
  async init(role: string) {
    const kp = nacl.sign.keyPair();
    const box = nacl.box.keyPair();
    const publicKey = naclUtil.encodeBase64(kp.publicKey);
    const boxPublicKey = naclUtil.encodeBase64(box.publicKey);
    const keyBindingSignature = naclUtil.encodeBase64(nacl.sign.detached(box.publicKey, kp.secretKey));
    self = { role, secret: kp.secretKey, publicKey, boxPublicKey, keyBindingSignature, userId: await userIdFromPub(kp.publicKey) };
    ratchet = new RatchetManager();
    pc = new RTCPeerConnection({ iceServers: [] });
    return { userId: self.userId, publicKey, boxPublicKey };
  },
  async makeOffer() {
    const ch = pc.createDataChannel('chat'); wire(ch);
    await pc.setLocalDescription(await pc.createOffer()); await waitIce(pc);
    return pc.localDescription!.sdp;
  },
  async makeAnswer(offerSdp: string) {
    pc.ondatachannel = (e) => wire(e.channel);
    await pc.setRemoteDescription({ type: 'offer', sdp: offerSdp });
    await pc.setLocalDescription(await pc.createAnswer()); await waitIce(pc);
    return pc.localDescription!.sdp;
  },
  async acceptAnswer(answerSdp: string) {
    await pc.setRemoteDescription({ type: 'answer', sdp: answerSdp });
  },
  async finalize() {
    // MITM 负测：篡改对端 boxPublicKey 后 importAndVerify 必须抛错
    try {
      const evil = await buildHello();
      (evil as any).boxPublicKey = naclUtil.encodeBase64(nacl.box.keyPair().publicKey);
      await importAndVerifyPeer(evil);
    } catch { mitmRejected = true; }
  },
  result() { return { secure, received, mitmRejected, sas, connState: pc?.connectionState }; },
  sentDonePromise() { return sentDone; }
};
(globalThis as any).VC = VC;
