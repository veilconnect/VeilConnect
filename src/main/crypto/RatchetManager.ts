import {
  KeyHelper,
  SignalProtocolAddress,
  SessionBuilder,
  SessionCipher,
  setWebCrypto
} from '@privacyresearch/libsignal-protocol-typescript';
import type { KeyPairType, StorageType } from '@privacyresearch/libsignal-protocol-typescript';
import { webcrypto } from 'crypto';

// 在 Node/Electron 主进程注入 WebCrypto 实现（库默认面向浏览器）。
setWebCrypto(webcrypto as unknown as Crypto);

function ab2b64(ab: ArrayBuffer): string {
  return Buffer.from(new Uint8Array(ab)).toString('base64');
}
function b642ab(b64: string): ArrayBuffer {
  const buf = Buffer.from(b64, 'base64');
  return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
}

/** 对端公开的 prekey bundle（已 base64 化以便 IPC/JSON 传输）。 */
export interface RatchetBundle {
  registrationId: number;
  identityKey: string;
  signedPreKey: { keyId: number; publicKey: string; signature: string };
  preKey: { keyId: number; publicKey: string };
}

/** 进程内内存存储，实现 libsignal 的 StorageType。会话状态随进程生命周期存在。 */
class InMemoryStore implements StorageType {
  private s = new Map<string, unknown>();
  set(k: string, v: unknown): void { this.s.set(k, v); }
  removeSession(addr: string): void { this.s.delete('session' + addr); }

  async getIdentityKeyPair(): Promise<KeyPairType | undefined> {
    return this.s.get('identityKey') as KeyPairType | undefined;
  }
  async getLocalRegistrationId(): Promise<number | undefined> {
    return this.s.get('registrationId') as number | undefined;
  }
  // 身份信任由上层用 Ed25519 身份签名对 ratchet 身份公钥做带外认证，这里恒为可信。
  async isTrustedIdentity(): Promise<boolean> { return true; }
  async saveIdentity(addr: string, key: ArrayBuffer): Promise<boolean> {
    this.s.set('identity' + addr, key);
    return true;
  }
  async loadPreKey(id: string | number): Promise<KeyPairType | undefined> {
    return this.s.get('prekey' + id) as KeyPairType | undefined;
  }
  async storePreKey(id: string | number, kp: KeyPairType): Promise<void> { this.s.set('prekey' + id, kp); }
  async removePreKey(id: string | number): Promise<void> { this.s.delete('prekey' + id); }
  async storeSession(addr: string, rec: string): Promise<void> { this.s.set('session' + addr, rec); }
  async loadSession(addr: string): Promise<string | undefined> {
    return this.s.get('session' + addr) as string | undefined;
  }
  async loadSignedPreKey(id: string | number): Promise<KeyPairType | undefined> {
    return this.s.get('signed' + id) as KeyPairType | undefined;
  }
  async storeSignedPreKey(id: string | number, kp: KeyPairType): Promise<void> { this.s.set('signed' + id, kp); }
  async removeSignedPreKey(id: string | number): Promise<void> { this.s.delete('signed' + id); }
}

/**
 * Double Ratchet 会话管理（基于 Signal 协议的 TS 移植 libsignal-protocol-typescript）。
 * 提供每条消息级前向保密与断后向自愈：每条消息一把密钥、用后即删，
 * 单条消息密钥泄露不影响其前后的消息。ratchet 身份公钥由上层 Ed25519 身份签名绑定，抵御 MITM。
 */
export class RatchetManager {
  private store = new InMemoryStore();
  private provisioned = false;
  private keyCounter = 1;

  private async ensureIdentity(): Promise<void> {
    if (this.provisioned) return;
    const identity = await KeyHelper.generateIdentityKeyPair();
    const registrationId = KeyHelper.generateRegistrationId();
    this.store.set('identityKey', identity);
    this.store.set('registrationId', registrationId);
    this.provisioned = true;
  }

  /** ratchet 身份公钥（b64），供上层用长期 Ed25519 身份私钥签名以绑定身份。 */
  async getIdentityKey(): Promise<string> {
    await this.ensureIdentity();
    const id = (await this.store.getIdentityKeyPair())!;
    return ab2b64(id.pubKey);
  }

  /** 生成并存储一组一次性 prekey，返回对端用于建立会话的公开 bundle。 */
  async getLocalBundle(): Promise<RatchetBundle> {
    await this.ensureIdentity();
    const id = (await this.store.getIdentityKeyPair())!;
    const registrationId = (await this.store.getLocalRegistrationId())!;
    const preKeyId = this.keyCounter++;
    const signedPreKeyId = this.keyCounter++;
    const pre = await KeyHelper.generatePreKey(preKeyId);
    await this.store.storePreKey(preKeyId, pre.keyPair);
    const signed = await KeyHelper.generateSignedPreKey(id, signedPreKeyId);
    await this.store.storeSignedPreKey(signedPreKeyId, signed.keyPair);
    return {
      registrationId,
      identityKey: ab2b64(id.pubKey),
      signedPreKey: {
        keyId: signedPreKeyId,
        publicKey: ab2b64(signed.keyPair.pubKey),
        signature: ab2b64(signed.signature)
      },
      preKey: { keyId: preKeyId, publicKey: ab2b64(pre.keyPair.pubKey) }
    };
  }

  /** 用对端 bundle 建立出站会话（仅由确定性选出的发起方调用）。 */
  async establish(peerId: string, bundle: RatchetBundle): Promise<void> {
    const addr = new SignalProtocolAddress(peerId, 1);
    const builder = new SessionBuilder(this.store, addr);
    await builder.processPreKey({
      registrationId: bundle.registrationId,
      identityKey: b642ab(bundle.identityKey),
      signedPreKey: {
        keyId: bundle.signedPreKey.keyId,
        publicKey: b642ab(bundle.signedPreKey.publicKey),
        signature: b642ab(bundle.signedPreKey.signature)
      },
      preKey: { keyId: bundle.preKey.keyId, publicKey: b642ab(bundle.preKey.publicKey) }
    });
  }

  async encrypt(peerId: string, plaintext: string): Promise<{ type: number; body: string }> {
    const cipher = new SessionCipher(this.store, new SignalProtocolAddress(peerId, 1));
    const msg = await cipher.encrypt(new TextEncoder().encode(plaintext).buffer as ArrayBuffer);
    if (typeof msg.body !== 'string') {
      throw new Error('Ratchet encryption produced no body');
    }
    // body 是二进制字符串(latin1)，转 base64 以安全跨 IPC/JSON。
    return { type: msg.type, body: Buffer.from(msg.body, 'binary').toString('base64') };
  }

  async decrypt(peerId: string, type: number, bodyB64: string): Promise<string> {
    const cipher = new SessionCipher(this.store, new SignalProtocolAddress(peerId, 1));
    const body = Buffer.from(bodyB64, 'base64').toString('binary');
    const plain = type === 3
      ? await cipher.decryptPreKeyWhisperMessage(body, 'binary')
      : await cipher.decryptWhisperMessage(body, 'binary');
    return new TextDecoder().decode(plain);
  }

  closeSession(peerId: string): void {
    this.store.removeSession(new SignalProtocolAddress(peerId, 1).toString());
  }
}
