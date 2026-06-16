/**
 * 跨主机 P2P 端到端功能测试 harness（headless，使用 node-datachannel【原生 API】做手动信令）。
 *
 * 复用 App 的【真实】主进程模块 —— IdentityManager / CryptoManager / RatchetManager ——
 * 在两台真实主机之间建立真实 DataChannel，跑 SimpleP2PChat 完全相同的安全握手协议：
 * hello → 身份/box 绑定/ratchet 验签 → 确定性发起方 → Double Ratchet 建会话 → 加密消息往返，
 * 并做一次 MITM 负测（篡改 boxPublicKey 应被拒）。
 *
 * 用 node-datachannel 原生 API（onLocalDescription/onLocalCandidate/setRemoteDescription/
 * addRemoteCandidate），这是其文档化的、可靠的手动信令接口（polyfill 在 offerer 侧手动信令有缺陷）。
 *
 * SDP+候选打包成单个 JSON 在两主机间 scp 传递（带外信令，等价于 App 的「粘贴邀请码」）。
 *   node p2p-harness.js offer  <offerOut.json> <answerIn.json>
 *   node p2p-harness.js answer <offerIn.json>  <answerOut.json>
 */
import * as nodeDataChannel from 'node-datachannel';
import { webcrypto } from 'crypto';
import * as fs from 'fs';
import { IdentityManager } from '../../src/main/identity/IdentityManager';
import { CryptoManager } from '../../src/main/crypto/CryptoManager';
import { RatchetManager } from '../../src/main/crypto/RatchetManager';

const TAG = (process.argv[2] || '?').toUpperCase();
const log = (...a: unknown[]) => console.log(`[${TAG}]`, ...a);
const fail = (msg: string): never => { console.error(`[${TAG}] ❌ ${msg}`); process.exit(1); };
if (process.env.VC_LOG) nodeDataChannel.initLogger(process.env.VC_LOG as any, (l: any, m: any) => console.error('[ndc]', l, m));

// 与 SimpleP2PChat.deriveSafetyCode 完全一致：身份公钥排序 → SHA-256 前 10 字节 → %10^20 → 20 位
async function deriveSafetyCode(aKey: string, bKey: string): Promise<string> {
  const [x, y] = [aKey, bKey].sort();
  const data = new TextEncoder().encode(`veilconnect-safety|${x}|${y}`);
  const digest = new Uint8Array(await (webcrypto as any).subtle.digest('SHA-256', data));
  let num = 0n;
  for (let i = 0; i < 10; i++) num = (num << 8n) | BigInt(digest[i]);
  return (num % 100_000_000_000_000_000_000n).toString().padStart(20, '0').replace(/(\d{4})(?=\d)/g, '$1 ');
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
async function waitForFile(path: string, timeoutMs = 60000): Promise<string> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (fs.existsSync(path) && fs.statSync(path).size > 0) return fs.readFileSync(path, 'utf8');
    await sleep(300);
  }
  return fail(`等待信令文件超时: ${path}`);
}

interface Signal { sdp: string; type: string; candidates: { cand: string; mid: string }[]; }

async function main() {
  const mode = process.argv[2];
  if (mode !== 'offer' && mode !== 'answer') fail('mode 必须是 offer 或 answer');

  // —— 真实身份 + 加密公钥绑定（复刻 main.ts 的 bootstrap）——
  const seed = `${mode}-${process.pid}-${Date.now()}`;
  const id = new IdentityManager(`harness-id-${seed}`);
  id.updateUserInfo({ nickname: mode === 'offer' ? 'OffererNode' : 'AnswererNode' });
  const cryptoMgr = new CryptoManager(`harness-crypto-${seed}`);
  id.attachBoxPublicKey(cryptoMgr.getPublicKey());
  const ratchet = new RatchetManager();
  const self = id.getCurrentIdentity()!;
  log('身份就绪 userId=', self.userId, ' boxPub/绑定签名=', !!self.boxPublicKey, !!self.keyBindingSignature);

  const cfg: any = { iceServers: [] };
  if (process.env.VC_BIND) cfg.bindAddress = process.env.VC_BIND;
  cfg.portRangeBegin = parseInt(process.env.VC_PORT_MIN || '60000', 10);
  cfg.portRangeEnd = parseInt(process.env.VC_PORT_MAX || '61000', 10);
  if (process.env.VC_MTU) cfg.mtu = parseInt(process.env.VC_MTU, 10);
  // TURN 中继（App 的生产默认路径）：VC_TURN 形如 turn:user:pass@host:port；
  // VC_RELAY=1 → 强制只用 relay 候选（双方都只对 TURN 发出站连接，绕开直连 ICE 限制）。
  if (process.env.VC_TURN) cfg.iceServers.push(process.env.VC_TURN);
  if (process.env.VC_RELAY === '1') cfg.iceTransportPolicy = 'relay';
  const pc = new nodeDataChannel.PeerConnection('vc-' + mode, cfg);

  let peerId: string | null = null;
  let secure = false;
  const received: string[] = [];
  let resolveRecv: () => void; const recvDone = new Promise<void>((r) => { resolveRecv = r; });
  let resolveSent: () => void; const sentDone = new Promise<void>((r) => { resolveSent = r; });

  // 收集本地 SDP + 候选；gathering 完成后产出一个完整 Signal
  let localDesc: { sdp: string; type: string } | null = null;
  const localCands: { cand: string; mid: string }[] = [];
  let resolveGather: (s: Signal) => void;
  const gathered = new Promise<Signal>((r) => { resolveGather = r; });
  pc.onLocalDescription((sdp: string, type: string) => { localDesc = { sdp, type }; });
  pc.onLocalCandidate((cand: string, mid: string) => localCands.push({ cand, mid }));
  pc.onGatheringStateChange((state: string) => {
    log('gatheringState=', state);
    if (state === 'complete' && localDesc) resolveGather({ ...localDesc, candidates: localCands });
  });
  pc.onStateChange((s: string) => log('connectionState=', s));
  pc.onIceStateChange((s: string) => log('iceState=', s));

  async function buildHello() {
    const bundle = await ratchet.getLocalBundle();
    const ratchetSignature = id.signEphemeralKey(bundle.identityKey);
    return { type: 'hello', userId: self.userId, publicKey: self.publicKey, boxPublicKey: self.boxPublicKey,
      keyBindingSignature: self.keyBindingSignature, ratchetBundle: bundle, ratchetSignature, nickname: self.nickname };
  }

  let sent = false;
  async function sendTestMessages(dc: any) {
    if (sent || !peerId) return; sent = true;
    for (const text of [`hello-from-${TAG}-1 你好🌏`, `hello-from-${TAG}-2 🔒`]) {
      const { type, body } = await ratchet.encrypt(peerId, JSON.stringify({ t: text }));
      dc.sendMessage(JSON.stringify({ type: 'cipher', payload: { t: type, b: body } }));
      log('→ 已加密发送:', text);
    }
    resolveSent();
  }

  async function onHello(msg: any, dc: any) {
    const peer = id.importPeerIdentity(JSON.stringify(msg)); // 校验 userId↔pub + box 绑定签名
    const ratchetOk = id.verifyEphemeralKey(msg.publicKey, msg.ratchetBundle.identityKey, msg.ratchetSignature);
    if (!peer.verified || !ratchetOk) return fail('对端身份/ratchet 验签失败（疑似 MITM）');
    peerId = peer.userId;
    log('✅ 对端已验证 userId=', peer.userId, ' verified=', peer.verified, ' ratchetSig=', ratchetOk);
    log('🛡️ 安全码(SAS)=', await deriveSafetyCode(self.publicKey, msg.publicKey));
    if (self.userId > peer.userId) {
      await ratchet.establish(peer.userId, msg.ratchetBundle);
      const init = await ratchet.encrypt(peer.userId, JSON.stringify({ c: 'init' }));
      dc.sendMessage(JSON.stringify({ type: 'cipher', payload: { t: init.type, b: init.body } }));
      secure = true; log('棘轮通道已建立（发起方）'); sendTestMessages(dc);
    } else {
      log('等待对端建立棘轮通道（响应方）…');
    }
  }

  async function onCipher(payload: any, dc: any) {
    if (!peerId) return;
    const plain = await ratchet.decrypt(peerId, payload.t, payload.b);
    const obj = JSON.parse(plain);
    if (obj.c === 'init') { secure = true; log('入站棘轮就绪，安全通道建立'); sendTestMessages(dc); return; }
    if (typeof obj.t === 'string') { received.push(obj.t); log('← 已解密收到:', obj.t); if (received.length >= 2) resolveRecv(); }
  }

  function wire(dc: any) {
    dc.onOpen(() => { log('DataChannel open，发起安全握手'); buildHello().then((h) => dc.sendMessage(JSON.stringify(h))); });
    dc.onMessage((data: any) => {
      let m: any; try { m = JSON.parse(typeof data === 'string' ? data : data.toString()); } catch { return; }
      if (m.type === 'hello') void onHello(m, dc);
      else if (m.type === 'cipher') void onCipher(m.payload, dc);
    });
  }

  if (mode === 'offer') {
    const [, , , offerOut, answerIn] = process.argv;
    const dc = pc.createDataChannel('chat'); // 触发自动生成 offer + 候选收集
    wire(dc);
    const sig = await gathered;
    fs.writeFileSync(offerOut, JSON.stringify(sig));
    log('已写出 offer(', sig.candidates.length, '候选) →', offerOut, '；等待 answer…');
    const ans = JSON.parse(await waitForFile(answerIn)) as Signal;
    pc.setRemoteDescription(ans.sdp, ans.type as any);
    for (const c of ans.candidates) pc.addRemoteCandidate(c.cand, c.mid);
    log('已载入 answer(', ans.candidates.length, '候选)，等待连接…');
  } else {
    const [, , , offerIn, answerOut] = process.argv;
    pc.onDataChannel((dc: any) => wire(dc));
    const offer = JSON.parse(await waitForFile(offerIn)) as Signal;
    pc.setRemoteDescription(offer.sdp, offer.type as any); // 触发生成 answer + 候选收集
    for (const c of offer.candidates) pc.addRemoteCandidate(c.cand, c.mid);
    const sig = await gathered;
    fs.writeFileSync(answerOut, JSON.stringify(sig));
    log('已写出 answer(', sig.candidates.length, '候选) →', answerOut, '；等待连接…');
  }

  const timer = setTimeout(() => fail('整体超时：未在限定时间内完成加密消息往返'), 45000);
  await Promise.all([recvDone, sentDone]);
  await sleep(2000);
  clearTimeout(timer);

  // —— MITM 负测：篡改对端 boxPublicKey 的 hello 必须被拒 ——
  let mitmRejected = false;
  try {
    const evil: any = await buildHello();
    evil.boxPublicKey = new CryptoManager(`evil-${seed}`).getPublicKey();
    id.importPeerIdentity(JSON.stringify(evil));
  } catch { mitmRejected = true; }

  log('==== SUMMARY ====');
  log('secure=', secure, ' 收到消息数=', received.length, ' MITM被拒=', mitmRejected);
  try { pc.close(); } catch { /* ignore */ }
  if (secure && received.length >= 2 && mitmRejected) { log('✅ PASS'); process.exit(0); }
  fail(`未通过：secure=${secure} received=${received.length} mitmRejected=${mitmRejected}`);
}

main().catch((e) => fail(String(e?.stack || e)));
