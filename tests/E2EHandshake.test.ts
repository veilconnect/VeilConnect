/**
 * 端到端功能集成测试：用真实的 IdentityManager / CryptoManager / RatchetManager
 * 复刻 SimpleP2PChat 的完整安全握手流程（两台「设备」Alice / Bob），验证：
 *   1. 身份绑定 + ratchet 签名互验通过
 *   2. 确定性发起方选举 + Double Ratchet 建会话 + 双向加解密 round-trip
 *   3. 安全码（SAS）两端一致、20 位、~66bit
 *   4. MITM（替换加密公钥）被拒；伪造 ratchet 身份签名被拒
 *
 * 这是「软件功能」级别的测试，覆盖单元测试之外的跨模块协作路径。
 */
import { webcrypto } from 'crypto';
import { IdentityManager } from '../src/main/identity/IdentityManager';
import { CryptoManager } from '../src/main/crypto/CryptoManager';
import { RatchetManager } from '../src/main/crypto/RatchetManager';

// 与 SimpleP2PChat.deriveSafetyCode 完全一致的算法（该函数内嵌于 .tsx，无法直接 import）
async function deriveSafetyCode(aIdentityKey: string, bIdentityKey: string): Promise<string> {
  const [x, y] = [aIdentityKey, bIdentityKey].sort();
  const data = new TextEncoder().encode(`veilconnect-safety|${x}|${y}`);
  const digest = new Uint8Array(await (webcrypto as any).subtle.digest('SHA-256', data));
  let num = 0n;
  for (let i = 0; i < 10; i++) num = (num << 8n) | BigInt(digest[i]);
  const code = (num % 100_000_000_000_000_000_000n).toString().padStart(20, '0');
  return code.replace(/(\d{4})(?=\d)/g, '$1 ');
}

/** 复刻主进程 bootstrap：把 box 公钥绑定进身份并签名（main.ts:bindCurrentBoxKeyToIdentity）。 */
function makeDevice(idKey: string, cryptoKey: string, nickname: string) {
  const id = new IdentityManager(idKey);
  id.updateUserInfo({ nickname });
  const crypto = new CryptoManager(cryptoKey);
  id.attachBoxPublicKey(crypto.getPublicKey());
  const ratchet = new RatchetManager();
  return { id, crypto, ratchet };
}

/** 复刻 SimpleP2PChat.sendIdentity 的 hello 包。 */
async function buildHello(dev: ReturnType<typeof makeDevice>) {
  const self = dev.id.getCurrentIdentity()!;
  const bundle = await dev.ratchet.getLocalBundle();
  const ratchetSignature = dev.id.signEphemeralKey(bundle.identityKey);
  return {
    type: 'hello',
    userId: self.userId,
    publicKey: self.publicKey,
    boxPublicKey: self.boxPublicKey,
    keyBindingSignature: self.keyBindingSignature,
    ratchetBundle: bundle,
    ratchetSignature,
    nickname: self.nickname
  };
}

describe('E2E 安全握手（Alice ↔ Bob）', () => {
  it('完整握手 + Double Ratchet 双向加解密 + SAS 一致', async () => {
    const alice = makeDevice('alice-id', 'alice-crypto', 'Alice');
    const bob = makeDevice('bob-id', 'bob-crypto', 'Bob');

    const aliceHello = await buildHello(alice);
    const bobHello = await buildHello(bob);

    // —— 各自校验对端 hello（复刻 handleHello 的强制验证）——
    const peerAtBob = bob.id.importPeerIdentity(JSON.stringify(aliceHello));
    expect(peerAtBob.verified).toBe(true);
    expect(
      bob.id.verifyEphemeralKey(aliceHello.publicKey, aliceHello.ratchetBundle.identityKey, aliceHello.ratchetSignature)
    ).toBe(true);

    const peerAtAlice = alice.id.importPeerIdentity(JSON.stringify(bobHello));
    expect(peerAtAlice.verified).toBe(true);
    expect(
      alice.id.verifyEphemeralKey(bobHello.publicKey, bobHello.ratchetBundle.identityKey, bobHello.ratchetSignature)
    ).toBe(true);

    // —— 确定性发起方：userId 较大者 ——
    const aliceIsInitiator = peerAtBob.userId > peerAtAlice.userId; // 在 bob 看来 alice 是较大者?
    // 直接用各自视角判断，和 UI 一致：self.userId > peer.userId
    const aliceInit = aliceHello.userId > peerAtAlice.userId;
    const bobInit = bobHello.userId > peerAtBob.userId;
    expect(aliceInit).toBe(!bobInit); // 恰好一方是发起方
    void aliceIsInitiator;

    const initiator = aliceInit ? alice : bob;
    const responder = aliceInit ? bob : alice;
    const initiatorPeerId = aliceInit ? peerAtAlice.userId : peerAtBob.userId; // 对端 userId
    const responderPeerId = aliceInit ? peerAtBob.userId : peerAtAlice.userId;
    const initiatorBundle = aliceInit ? bobHello.ratchetBundle : aliceHello.ratchetBundle; // 用对端 bundle 建会话

    // —— 发起方建会话并发首条 prekey 控制密文 ——
    await initiator.ratchet.establish(initiatorPeerId, initiatorBundle);
    const initMsg = await initiator.ratchet.encrypt(initiatorPeerId, JSON.stringify({ c: 'init' }));
    expect(initMsg.type).toBe(3); // prekey whisper message

    // —— 响应方解密 init，建立入站会话 ——
    const initPlain = await responder.ratchet.decrypt(responderPeerId, initMsg.type, initMsg.body);
    expect(JSON.parse(initPlain)).toEqual({ c: 'init' });

    // —— 双向消息 round-trip ——
    const m1 = await initiator.ratchet.encrypt(initiatorPeerId, JSON.stringify({ t: '你好 🌏 from initiator' }));
    const m1plain = await responder.ratchet.decrypt(responderPeerId, m1.type, m1.body);
    expect(JSON.parse(m1plain)).toEqual({ t: '你好 🌏 from initiator' });

    const m2 = await responder.ratchet.encrypt(responderPeerId, JSON.stringify({ t: 'reply from responder 🔒' }));
    const m2plain = await initiator.ratchet.decrypt(initiatorPeerId, m2.type, m2.body);
    expect(JSON.parse(m2plain)).toEqual({ t: 'reply from responder 🔒' });

    // —— SAS 两端一致、20 位数字、~66bit ——
    const sasA = await deriveSafetyCode(aliceHello.publicKey, peerAtAlice.publicKey);
    const sasB = await deriveSafetyCode(bobHello.publicKey, peerAtBob.publicKey);
    expect(sasA).toBe(sasB);
    expect(sasA.replace(/\s/g, '')).toHaveLength(20);
    expect(/^\d{4}( \d{4}){4}$/.test(sasA)).toBe(true);
  });

  it('MITM：替换加密公钥（boxPublicKey）的 hello 被拒', async () => {
    const alice = makeDevice('alice-id', 'alice-crypto', 'Alice');
    const bob = makeDevice('bob-id', 'bob-crypto', 'Bob');
    const attacker = new CryptoManager('attacker-crypto');

    const aliceHello: any = await buildHello(alice);
    // 中间人保留 alice 的身份签名，但把加密公钥换成自己的 → 绑定签名应失效
    aliceHello.boxPublicKey = attacker.getPublicKey();

    expect(() => bob.id.importPeerIdentity(JSON.stringify(aliceHello))).toThrow(/binding/i);
  });

  it('MITM：伪造的 ratchet 身份签名被拒', async () => {
    const alice = makeDevice('alice-id', 'alice-crypto', 'Alice');
    const bob = makeDevice('bob-id', 'bob-crypto', 'Bob');
    const aliceHello = await buildHello(alice);

    // 用 bob 自己的签名冒充对 alice ratchet 身份的签名（签名者不符）
    const forged = bob.id.signEphemeralKey(aliceHello.ratchetBundle.identityKey);
    expect(
      bob.id.verifyEphemeralKey(aliceHello.publicKey, aliceHello.ratchetBundle.identityKey, forged)
    ).toBe(false);
  });

  it('SAS：不同对端产生不同安全码', async () => {
    const alice = makeDevice('alice-id', 'alice-crypto', 'Alice');
    const bob = makeDevice('bob-id', 'bob-crypto', 'Bob');
    const carol = makeDevice('carol-id', 'carol-crypto', 'Carol');
    const a = alice.id.getCurrentIdentity()!.publicKey;
    const b = bob.id.getCurrentIdentity()!.publicKey;
    const c = carol.id.getCurrentIdentity()!.publicKey;
    expect(await deriveSafetyCode(a, b)).not.toBe(await deriveSafetyCode(a, c));
  });
});
