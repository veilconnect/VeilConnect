import * as nacl from 'tweetnacl';
import * as naclUtil from 'tweetnacl-util';
import { CryptoManager } from '../src/main/crypto/CryptoManager';

describe('CryptoManager', () => {
  let alice: CryptoManager;
  let bob: CryptoManager;
  let alicePub: string;
  let bobPub: string;

  beforeEach(() => {
    alice = new CryptoManager('alice-key');
    bob = new CryptoManager('bob-key');
    alicePub = alice.getPublicKey();
    bobPub = bob.getPublicKey();
  });

  describe('密钥对', () => {
    it('构造时自动生成密钥对，getPublicKey 返回 base64', () => {
      expect(alicePub).toMatch(/^[A-Za-z0-9+/=]+$/);
      expect(naclUtil.decodeBase64(alicePub)).toHaveLength(nacl.box.publicKeyLength);
    });

    it('generateKeyPair 可主动重新生成（公钥变化）', () => {
      const oldPub = alice.getPublicKey();
      alice.generateKeyPair();
      expect(alice.getPublicKey()).not.toBe(oldPub);
    });
  });

  describe('消息加解密 round-trip', () => {
    it('Alice 加密 → Bob 解密得到原文', () => {
      const plain = { kind: 'chat', text: '你好世界 🌏', ts: 1234567890 };
      const cipher = alice.encryptMessage(plain, bobPub);

      const decoded = bob.decryptMessage(cipher, alicePub);
      expect(decoded).toEqual(plain);
    });

    it('密文被篡改后解密失败', () => {
      const cipher = alice.encryptMessage({ msg: 'secret' }, bobPub);
      const tampered = { ...cipher, ciphertext: cipher.ciphertext.slice(0, -2) + 'AA' };
      expect(() => bob.decryptMessage(tampered, alicePub)).toThrow(/decrypt/i);
    });

    it('用错误对端公钥解密失败', () => {
      const eve = new CryptoManager('eve-key');
      const cipher = alice.encryptMessage({ msg: 'secret' }, bobPub);
      expect(() => bob.decryptMessage(cipher, eve.getPublicKey())).toThrow();
    });

    it('encrypt/decrypt IPC 接口（JSON 字符串包装）round-trip', () => {
      const plain = JSON.stringify({ hello: 'world' });
      const cipher = alice.encrypt(plain, bobPub);
      const decryptedStr = bob.decrypt(JSON.stringify(cipher), alicePub);
      expect(decryptedStr).toBe(plain);
    });

    it('SimpleP2PChat 实际收发约定：纯文本经 JSON 包装后端到端 round-trip', () => {
      // 发送端：crypto.encrypt(JSON.stringify(text), peerKey)
      const text = '机密消息 🔒 line\nbreak';
      const payload = alice.encrypt(JSON.stringify(text), bobPub);
      // 接收端：JSON.parse(crypto.decrypt(JSON.stringify(payload), peerKey))
      const received = JSON.parse(bob.decrypt(JSON.stringify(payload), alicePub));
      expect(received).toBe(text);
    });
  });

  describe('数字签名', () => {
    it('verifySignature 用 Ed25519 公钥校验：正确签名通过、错误签名拒绝', () => {
      // CryptoManager 持有的是 X25519 box keypair，不能用于签名；签名一律由 Ed25519 身份完成。
      // 这里用独立的 nacl.sign keypair 验证 verifySignature 的纯静态验签逻辑。
      const signer = nacl.sign.keyPair();
      const msg = 'hello';
      const sig = naclUtil.encodeBase64(
        nacl.sign.detached(naclUtil.decodeUTF8(msg), signer.secretKey)
      );
      const pub = naclUtil.encodeBase64(signer.publicKey);
      expect(alice.verifySignature(msg, sig, pub)).toBe(true);
      expect(alice.verifySignature('tampered', sig, pub)).toBe(false);
    });
  });

  describe('文件加解密', () => {
    it('Buffer round-trip', () => {
      const data = Buffer.from([0x00, 0xff, 0x7f, 0x80, 0x42, 0x55]);
      const enc = alice.encryptFile(data, bobPub);
      const dec = bob.decryptFile(enc, alicePub);
      expect(Buffer.compare(dec, data)).toBe(0);
    });

    it('损坏的文件密文解密失败', () => {
      const data = Buffer.from('payload');
      const enc = alice.encryptFile(data, bobPub);
      const broken = { ...enc, nonce: 'AAAAAAAAAAAAAAAAAAAAAAAA' };
      expect(() => bob.decryptFile(broken, alicePub)).toThrow();
    });
  });

  describe('共享密钥缓存', () => {
    it('clearSharedSecrets 后仍能正确解密（重算）', () => {
      const cipher = alice.encryptMessage({ x: 1 }, bobPub);
      alice.clearSharedSecrets();
      bob.clearSharedSecrets();
      const decoded = bob.decryptMessage(cipher, alicePub);
      expect(decoded).toEqual({ x: 1 });
    });
  });
});
