import * as nacl from 'tweetnacl';
import * as naclUtil from 'tweetnacl-util';
import { createHash } from 'crypto';
import { IdentityManager } from '../src/main/identity/IdentityManager';

/**
 * 握手鲁棒性 / 拒绝性属性测试：对 importPeerIdentity / verifyEphemeralKey 喂入大量
 * 畸形与对抗性输入，确保它们【绝不接受伪造数据】，且不会因意外异常崩溃（只能抛错或返回 false）。
 * 这是「安全模型自洽」与「防 MITM」的可验证断言，而不仅是 happy path。
 */
const KEY = 'fuzz-key';

function makeBoundIdentity() {
  // 生成一个合法、已绑定 box 公钥的对端身份 JSON（host 侧视角）。
  const signKp = nacl.sign.keyPair();
  const boxKp = nacl.box.keyPair();
  const publicKey = naclUtil.encodeBase64(signKp.publicKey);
  const boxPublicKey = naclUtil.encodeBase64(boxKp.publicKey);
  const sig = nacl.sign.detached(boxKp.publicKey, signKp.secretKey);
  // generateUserId 等价派生：sha256(pub) 前 16B 经 Base58。
  const hash = createHash('sha256').update(signKp.publicKey).digest();
  const userId = base58(hash.slice(0, 16));
  return {
    signKp, boxKp, publicKey, boxPublicKey,
    keyBindingSignature: naclUtil.encodeBase64(sig),
    userId
  };
}

const B58 = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
function base58(buf: Buffer): string {
  let num = BigInt('0x' + buf.toString('hex'));
  let out = '';
  while (num > 0n) { out = B58[Number(num % 58n)] + out; num /= 58n; }
  for (let i = 0; i < buf.length && buf[i] === 0; i++) out = '1' + out;
  return out || '1';
}

describe('Handshake fuzzing — 拒绝伪造/畸形输入', () => {
  let mgr: IdentityManager;
  beforeEach(() => { mgr = new IdentityManager(KEY); });

  const garbage = [
    '', '{}', '[]', 'null', 'true', '"x"', '{"data":null}', '{not json',
    '{"userId":"","publicKey":""}', '{"userId":"AAAA","publicKey":"!!!"}',
    JSON.stringify({ userId: 'x'.repeat(1000), publicKey: 'y'.repeat(1000) }),
    JSON.stringify({ data: { userId: 1, publicKey: {}, boxPublicKey: [], keyBindingSignature: false } })
  ];

  it.each(garbage)('importPeerIdentity 拒绝畸形输入: %s', (input) => {
    expect(() => mgr.importPeerIdentity(input)).toThrow();
  });

  it('拒绝 userId 与 publicKey 不匹配（即便 box 绑定自洽）', () => {
    const v = makeBoundIdentity();
    const forged = JSON.stringify({ ...v, userId: 'AAAAAAAAAAAAAAAAAAAAAA' });
    expect(() => mgr.importPeerIdentity(forged)).toThrow(/ID does not match/);
  });

  it('拒绝 box 绑定签名被篡改（MITM 替换加密公钥）', () => {
    const v = makeBoundIdentity();
    const otherBox = naclUtil.encodeBase64(nacl.box.keyPair().publicKey);
    const forged = JSON.stringify({ ...v, boxPublicKey: otherBox }); // 签名仍是旧 box 的
    expect(() => mgr.importPeerIdentity(forged)).toThrow(/Key binding/);
  });

  it('拒绝缺少 box 绑定的未绑定身份', () => {
    const v = makeBoundIdentity();
    const noBinding = JSON.stringify({ userId: v.userId, publicKey: v.publicKey });
    expect(() => mgr.importPeerIdentity(noBinding)).toThrow(/Key binding signature required/);
  });

  it('接受合法且自洽的对端身份', () => {
    const v = makeBoundIdentity();
    const ok = JSON.stringify({
      userId: v.userId, publicKey: v.publicKey,
      boxPublicKey: v.boxPublicKey, keyBindingSignature: v.keyBindingSignature,
      nickname: 'peer'
    });
    const peer = mgr.importPeerIdentity(ok);
    expect(peer.verified).toBe(true);
    expect(peer.userId).toBe(v.userId);
  });

  it('verifyEphemeralKey 对随机签名恒返回 false（不抛错）', () => {
    const v = makeBoundIdentity();
    for (let i = 0; i < 50; i++) {
      const fakeEph = naclUtil.encodeBase64(nacl.randomBytes(33));
      const fakeSig = naclUtil.encodeBase64(nacl.randomBytes(64));
      expect(mgr.verifyEphemeralKey(v.publicKey, fakeEph, fakeSig)).toBe(false);
    }
  });

  it('verifyEphemeralKey 接受由对应身份私钥签发的临时公钥', () => {
    const v = makeBoundIdentity();
    const eph = nacl.box.keyPair().publicKey;
    const sig = nacl.sign.detached(eph, v.signKp.secretKey);
    expect(mgr.verifyEphemeralKey(v.publicKey, naclUtil.encodeBase64(eph), naclUtil.encodeBase64(sig))).toBe(true);
  });
});
