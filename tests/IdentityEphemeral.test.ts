import * as nacl from 'tweetnacl';
import * as naclUtil from 'tweetnacl-util';
import { IdentityManager } from '../src/main/identity/IdentityManager';

/**
 * 临时会话公钥的身份签名 / 验证（抵御中间人替换临时密钥）。
 */
describe('IdentityManager 临时密钥签名', () => {
  let mgr: IdentityManager;
  let ephemeralKey: string;

  beforeEach(() => {
    mgr = new IdentityManager('id-key');
    ephemeralKey = naclUtil.encodeBase64(nacl.box.keyPair().publicKey);
  });

  it('签名可被本身份公钥验证通过', () => {
    const id = mgr.getCurrentIdentity()!;
    const sig = mgr.signEphemeralKey(ephemeralKey);
    expect(mgr.verifyEphemeralKey(id.publicKey, ephemeralKey, sig)).toBe(true);
  });

  it('篡改临时公钥后验证失败', () => {
    const id = mgr.getCurrentIdentity()!;
    const sig = mgr.signEphemeralKey(ephemeralKey);
    const tampered = naclUtil.encodeBase64(nacl.box.keyPair().publicKey);
    expect(mgr.verifyEphemeralKey(id.publicKey, tampered, sig)).toBe(false);
  });

  it('用其他身份公钥验证失败（防止冒充签名者）', () => {
    const sig = mgr.signEphemeralKey(ephemeralKey);
    const other = new IdentityManager('other-key').getCurrentIdentity()!;
    expect(mgr.verifyEphemeralKey(other.publicKey, ephemeralKey, sig)).toBe(false);
  });

  it('非法 base64 输入时安全返回 false 而非抛错', () => {
    expect(mgr.verifyEphemeralKey('!!!', ephemeralKey, 'xxx')).toBe(false);
  });
});

describe('IdentityManager 导出口令策略', () => {
  it('口令短于 12 字符被拒绝', () => {
    const mgr = new IdentityManager('id-key-2');
    expect(() => mgr.exportIdentityEncrypted('short')).toThrow(/short/i);
  });

  it('足够长口令可加密导出并往返还原', () => {
    const mgr = new IdentityManager('id-key-3');
    const blob = mgr.exportIdentityEncrypted('a-strong-passphrase');
    const mgr2 = new IdentityManager('id-key-4');
    const restored = mgr2.importIdentityEncrypted(blob, 'a-strong-passphrase');
    expect(restored.userId).toBe(mgr.getCurrentIdentity()!.userId);
  });
});
