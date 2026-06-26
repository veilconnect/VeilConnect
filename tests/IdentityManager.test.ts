import * as nacl from 'tweetnacl';
import * as naclUtil from 'tweetnacl-util';
import { IdentityManager } from '../src/main/identity/IdentityManager';

const KEY = 'test-encryption-key';

describe('IdentityManager', () => {
  let mgr: IdentityManager;

  beforeEach(() => {
    mgr = new IdentityManager(KEY);
  });

  describe('身份生成与持久化', () => {
    it('构造时自动生成身份并通过 verifyUserId 校验', () => {
      const id = mgr.getCurrentIdentity();
      expect(id).not.toBeNull();
      expect(id!.userId).toMatch(/^[1-9A-HJ-NP-Za-km-z]+$/); // Base58 字母表
      expect(mgr.verifyUserId(id!.userId, id!.publicKey)).toBe(true);
    });

    it('verifyUserId 对篡改的 userId 返回 false', () => {
      const id = mgr.getCurrentIdentity()!;
      expect(mgr.verifyUserId('AAAA' + id.userId.slice(4), id.publicKey)).toBe(false);
    });

    it('verifyUserId 对无效公钥返回 false', () => {
      const id = mgr.getCurrentIdentity()!;
      expect(mgr.verifyUserId(id.userId, 'not-base64-!@#$')).toBe(false);
    });

    it('createNewIdentity 用指定昵称', () => {
      const newId = mgr.createNewIdentity('Alice');
      expect(newId.nickname).toBe('Alice');
      expect(newId.avatar).toBe('👤');
    });
  });

  describe('attachBoxPublicKey + verifyKeyBinding', () => {
    it('用 Ed25519 私钥签名 X25519 公钥，能被自身验签通过', () => {
      const boxKeyPair = nacl.box.keyPair();
      const boxPub = naclUtil.encodeBase64(boxKeyPair.publicKey);

      const updated = mgr.attachBoxPublicKey(boxPub);
      expect(updated.boxPublicKey).toBe(boxPub);
      expect(updated.keyBindingSignature).toBeTruthy();

      expect(
        mgr.verifyKeyBinding({
          publicKey: updated.publicKey,
          boxPublicKey: updated.boxPublicKey,
          keyBindingSignature: updated.keyBindingSignature
        })
      ).toBe(true);
    });

    it('签名作用在错误公钥上时验证失败', () => {
      const boxKeyPair = nacl.box.keyPair();
      const boxPub = naclUtil.encodeBase64(boxKeyPair.publicKey);
      const updated = mgr.attachBoxPublicKey(boxPub);

      // 篡改 box 公钥
      const tampered = naclUtil.encodeBase64(nacl.box.keyPair().publicKey);
      expect(
        mgr.verifyKeyBinding({
          publicKey: updated.publicKey,
          boxPublicKey: tampered,
          keyBindingSignature: updated.keyBindingSignature
        })
      ).toBe(false);
    });

    it('缺少签名或公钥时返回 false 而不是抛错', () => {
      expect(mgr.verifyKeyBinding({ publicKey: 'x' } as any)).toBe(false);
    });
  });

  describe('AES-256-GCM 密码导出 / 导入', () => {
    it('round-trip：用正确密码可解密恢复完整身份', () => {
      const boxPub = naclUtil.encodeBase64(nacl.box.keyPair().publicKey);
      mgr.attachBoxPublicKey(boxPub);
      const original = mgr.getCurrentIdentity()!;

      const password = 'CorrectHorseBatteryStaple';
      const encrypted = mgr.exportIdentityEncrypted(password);

      // 创建新实例（mock store 每个实例独立），模拟"另一台设备"
      const mgr2 = new IdentityManager(KEY);
      const restored = mgr2.importIdentityEncrypted(encrypted, password);

      expect(restored.userId).toBe(original.userId);
      expect(restored.publicKey).toBe(original.publicKey);
      expect(restored.secretKey).toBe(original.secretKey);
      expect(restored.boxPublicKey).toBe(original.boxPublicKey);
      expect(restored.keyBindingSignature).toBe(original.keyBindingSignature);
    });

    it('错误密码导入抛错', () => {
      const encrypted = mgr.exportIdentityEncrypted('right-password');
      const mgr2 = new IdentityManager(KEY);
      expect(() => mgr2.importIdentityEncrypted(encrypted, 'wrong-password')).toThrow();
    });

    it('密码过短拒绝导出', () => {
      expect(() => mgr.exportIdentityEncrypted('ab')).toThrow(/short/i);
    });

    it('每次导出的密文不同（随机盐 + IV）', () => {
      const a = mgr.exportIdentityEncrypted('same-password');
      const b = mgr.exportIdentityEncrypted('same-password');
      expect(a).not.toBe(b);
    });
  });

  describe('对端身份导入与防伪', () => {
    function makeForeignIdentity(_nickname: string): {
      userId: string;
      publicKey: string;
      secretKey: Uint8Array;
      boxPub: string;
      signature: string;
    } {
      const signKp = nacl.sign.keyPair();
      const boxKp = nacl.box.keyPair();
      const boxPubB64 = naclUtil.encodeBase64(boxKp.publicKey);
      const signature = naclUtil.encodeBase64(
        nacl.sign.detached(boxKp.publicKey, signKp.secretKey)
      );
      // 用真实的 generateUserId 算法计算（Base58(SHA-256(publicKey)[:16])）
      const _tempMgr = new IdentityManager(KEY + '-other');
      // 通过 verifyUserId 反推预期 userId：直接用 mgr 计算
      // 实际上 generateUserId 是私有方法 — 我们换种方式：试错枚举不现实，
      // 直接通过 verifyUserId 校验来确保我们手算正确。
      const hash = require('crypto').createHash('sha256').update(signKp.publicKey).digest();
      const truncated = hash.slice(0, 16);
      const ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
      let num = BigInt('0x' + truncated.toString('hex'));
      let userId = '';
      while (num > 0n) {
        userId = ALPHABET[Number(num % 58n)] + userId;
        num = num / 58n;
      }
      for (let i = 0; i < truncated.length && truncated[i] === 0; i++) userId = '1' + userId;

      return {
        userId,
        publicKey: naclUtil.encodeBase64(signKp.publicKey),
        secretKey: signKp.secretKey,
        boxPub: boxPubB64,
        signature
      };
    }

    it('importPeerIdentity 校验 userId↔publicKey + 签名绑定，全部正确则保存', () => {
      const peer = makeForeignIdentity('Bob');
      const payload = JSON.stringify({
        userId: peer.userId,
        publicKey: peer.publicKey,
        boxPublicKey: peer.boxPub,
        keyBindingSignature: peer.signature,
        nickname: 'Bob'
      });

      const saved = mgr.importPeerIdentity(payload);
      expect(saved.userId).toBe(peer.userId);
      expect(saved.verified).toBe(true);

      const all = mgr.getPeerIdentities();
      expect(all[peer.userId]).toBeDefined();
    });

    it('userId 不匹配公钥时拒绝导入', () => {
      const peer = makeForeignIdentity('Eve');
      const payload = JSON.stringify({
        userId: '1111ZZZZ', // 显式篡改
        publicKey: peer.publicKey,
        boxPublicKey: peer.boxPub,
        keyBindingSignature: peer.signature,
        nickname: 'Eve'
      });

      expect(() => mgr.importPeerIdentity(payload)).toThrow(/match/i);
    });

    it('boxPublicKey 签名错误时拒绝导入（防 MITM 替换加密公钥）', () => {
      const peer = makeForeignIdentity('Mallory');
      const fakeBoxPub = naclUtil.encodeBase64(nacl.box.keyPair().publicKey);

      const payload = JSON.stringify({
        userId: peer.userId,
        publicKey: peer.publicKey,
        boxPublicKey: fakeBoxPub, // 没用真签名公钥签名的另一对密钥
        keyBindingSignature: peer.signature,
        nickname: 'Mallory'
      });

      expect(() => mgr.importPeerIdentity(payload)).toThrow(/binding/i);
    });

    it('拒绝无 boxPublicKey/keyBindingSignature 的旧格式身份', () => {
      const peer = makeForeignIdentity('Legacy');
      const payload = JSON.stringify({
        userId: peer.userId,
        publicKey: peer.publicKey,
        nickname: 'Legacy'
      });

      expect(() => mgr.importPeerIdentity(payload)).toThrow(/binding/i);
    });

    it('只带 boxPublicKey 但缺绑定签名时拒绝导入（不可绕过验签）', () => {
      const peer = makeForeignIdentity('HalfBound');
      const payload = JSON.stringify({
        userId: peer.userId,
        publicKey: peer.publicKey,
        boxPublicKey: peer.boxPub, // 提供了 box 公钥却不给签名
        nickname: 'HalfBound'
      });

      expect(() => mgr.importPeerIdentity(payload)).toThrow(/binding/i);
    });
  });

  describe('QR 码', () => {
    it('generateQRCodeData → parseQRCodeData round-trip', () => {
      const boxPub = naclUtil.encodeBase64(nacl.box.keyPair().publicKey);
      mgr.attachBoxPublicKey(boxPub);

      const qr = mgr.generateQRCodeData();
      // 用第二个 mgr 解析（不同 store）
      const mgr2 = new IdentityManager(KEY);
      const peer = mgr2.parseQRCodeData(qr);

      expect(peer.userId).toBe(mgr.getCurrentIdentity()!.userId);
    });

    it('非 veilconnect_identity 类型拒绝', () => {
      const qr = JSON.stringify({ type: 'something-else', userId: 'x', publicKey: 'y' });
      expect(() => mgr.parseQRCodeData(qr)).toThrow(/type/i);
    });
  });
});
