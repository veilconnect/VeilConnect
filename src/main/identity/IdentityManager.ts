import * as nacl from 'tweetnacl';
import * as naclUtil from 'tweetnacl-util';
import { createHash, pbkdf2Sync, randomBytes, createCipheriv, createDecipheriv } from 'crypto';
import Store from 'electron-store';

export interface UserIdentity {
  userId: string;              // 基于公钥派生的用户 ID（Base58）
  publicKey: string;           // Ed25519 签名公钥（Base64）
  secretKey: string;           // Ed25519 签名私钥（Base64）
  boxPublicKey?: string;       // X25519 加密公钥（Base64），由 CryptoManager 注入
  keyBindingSignature?: string;// Ed25519(boxPublicKey) — 把加密密钥绑定到身份
  nickname: string;
  avatar?: string;
  createdAt: number;
}

export interface PeerIdentity {
  userId: string;
  publicKey: string;
  boxPublicKey?: string;
  keyBindingSignature?: string;
  nickname: string;
  avatar?: string;
  verified: boolean;
  addedAt: number;
}

const BASE58_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
const PBKDF2_ITERATIONS = 600_000; // 对齐 OWASP 对 PBKDF2-SHA256 的现行建议
const MIN_EXPORT_PASSWORD_LEN = 12;
const PBKDF2_KEY_LEN = 32;
const SALT_LEN = 16;
const IV_LEN = 12;
const EXPORT_VERSION = '2.0';

interface StoreShape {
  userIdentity?: UserIdentity;
  peerIdentities?: Record<string, PeerIdentity>;
}

export class IdentityManager {
  private store: Store<StoreShape>;
  private currentIdentity: UserIdentity | null = null;

  constructor(encryptionKey: string) {
    this.store = new Store<StoreShape>({
      name: 'user-identity',
      encryptionKey
    });

    this.loadOrCreateIdentity();
  }

  private generateUserId(publicKey: Uint8Array): string {
    const hash = createHash('sha256').update(publicKey).digest();
    return this.base58Encode(hash.slice(0, 16));
  }

  private base58Encode(buffer: Buffer): string {
    let result = '';
    let num = BigInt('0x' + buffer.toString('hex'));

    while (num > 0) {
      const remainder = num % 58n;
      result = BASE58_ALPHABET[Number(remainder)] + result;
      num = num / 58n;
    }

    for (let i = 0; i < buffer.length && buffer[i] === 0; i++) {
      result = '1' + result;
    }

    return result || '1';
  }

  public verifyUserId(userId: string, publicKey: string): boolean {
    try {
      const publicKeyBytes = naclUtil.decodeBase64(publicKey);
      const expectedUserId = this.generateUserId(publicKeyBytes);
      return userId === expectedUserId;
    } catch {
      return false;
    }
  }

  private loadOrCreateIdentity(): void {
    const stored = this.store.get('userIdentity') as UserIdentity | undefined;

    if (stored && this.verifyUserId(stored.userId, stored.publicKey)) {
      this.currentIdentity = stored;
      console.log('[Identity] loaded:', stored.userId);
    } else {
      this.createNewIdentity();
    }
  }

  public createNewIdentity(nickname: string = 'Guest User'): UserIdentity {
    const keyPair = nacl.sign.keyPair();
    const userId = this.generateUserId(keyPair.publicKey);

    const identity: UserIdentity = {
      userId,
      publicKey: naclUtil.encodeBase64(keyPair.publicKey),
      secretKey: naclUtil.encodeBase64(keyPair.secretKey),
      nickname,
      avatar: '👤',
      createdAt: Date.now()
    };

    this.store.set('userIdentity', identity);
    this.currentIdentity = identity;

    console.log('[Identity] created:', userId);
    return identity;
  }

  public getCurrentIdentity(): UserIdentity | null {
    if (this.currentIdentity && !this.currentIdentity.avatar) {
      this.currentIdentity = { ...this.currentIdentity, avatar: '👤' };
      this.store.set('userIdentity', this.currentIdentity);
    }
    return this.currentIdentity;
  }

  public saveIdentity(identity: UserIdentity): UserIdentity {
    if (!this.verifyUserId(identity.userId, identity.publicKey)) {
      throw new Error('Invalid user identity data');
    }

    this.currentIdentity = {
      ...identity,
      avatar: identity.avatar || '👤'
    };
    this.store.set('userIdentity', this.currentIdentity);
    return this.currentIdentity;
  }

  public updateUserInfo(updates: Partial<Pick<UserIdentity, 'nickname' | 'avatar'>>): boolean {
    if (!this.currentIdentity) return false;

    this.currentIdentity = {
      ...this.currentIdentity,
      ...updates,
      avatar: updates.avatar || this.currentIdentity.avatar || '👤'
    };

    this.store.set('userIdentity', this.currentIdentity);
    return true;
  }

  public updateIdentity(updates: Partial<Pick<UserIdentity, 'nickname' | 'avatar'>> & { userId: string }): UserIdentity {
    if (!this.currentIdentity || this.currentIdentity.userId !== updates.userId) {
      throw new Error('Identity not initialized or mismatched user');
    }

    this.updateUserInfo({ nickname: updates.nickname, avatar: updates.avatar });
    return this.currentIdentity;
  }

  /**
   * 把 X25519 加密公钥绑定进 Ed25519 身份。
   * 用签名私钥对 box 公钥做 detached 签名，对端可凭此验证 sign↔box 同属一人。
   */
  public attachBoxPublicKey(boxPublicKey: string): UserIdentity {
    if (!this.currentIdentity) throw new Error('Identity not initialized');

    const secretKey = naclUtil.decodeBase64(this.currentIdentity.secretKey);
    const boxKeyBytes = naclUtil.decodeBase64(boxPublicKey);
    const signature = nacl.sign.detached(boxKeyBytes, secretKey);

    this.currentIdentity = {
      ...this.currentIdentity,
      boxPublicKey,
      keyBindingSignature: naclUtil.encodeBase64(signature)
    };
    this.store.set('userIdentity', this.currentIdentity);
    return this.currentIdentity;
  }

  /**
   * 用长期 Ed25519 身份私钥对一次性会话临时公钥签名。
   * 对端可凭此确认该临时密钥确实来自已验证的身份，从而抵御中间人替换临时密钥。
   */
  public signEphemeralKey(ephemeralPublicKey: string): string {
    if (!this.currentIdentity) throw new Error('Identity not initialized');
    const secretKey = naclUtil.decodeBase64(this.currentIdentity.secretKey);
    const signature = nacl.sign.detached(naclUtil.decodeBase64(ephemeralPublicKey), secretKey);
    return naclUtil.encodeBase64(signature);
  }

  /**
   * 验证对端会话临时公钥确由对端长期 Ed25519 身份私钥签发。
   */
  public verifyEphemeralKey(peerPublicKey: string, ephemeralPublicKey: string, signature: string): boolean {
    try {
      return nacl.sign.detached.verify(
        naclUtil.decodeBase64(ephemeralPublicKey),
        naclUtil.decodeBase64(signature),
        naclUtil.decodeBase64(peerPublicKey)
      );
    } catch {
      return false;
    }
  }

  /**
   * 验证对端 box 公钥确实由对端签名公钥签发。
   */
  public verifyKeyBinding(peer: Pick<PeerIdentity, 'publicKey' | 'boxPublicKey' | 'keyBindingSignature'>): boolean {
    if (!peer.boxPublicKey || !peer.keyBindingSignature) return false;
    try {
      const message = naclUtil.decodeBase64(peer.boxPublicKey);
      const sig = naclUtil.decodeBase64(peer.keyBindingSignature);
      const signerPub = naclUtil.decodeBase64(peer.publicKey);
      return nacl.sign.detached.verify(message, sig, signerPub);
    } catch {
      return false;
    }
  }

  /**
   * 公开身份导出（不含私钥）。
   */
  public exportIdentity(): string {
    if (!this.currentIdentity) throw new Error('No identity available');

    return JSON.stringify({
      version: EXPORT_VERSION,
      encrypted: false,
      data: {
        userId: this.currentIdentity.userId,
        publicKey: this.currentIdentity.publicKey,
        boxPublicKey: this.currentIdentity.boxPublicKey,
        keyBindingSignature: this.currentIdentity.keyBindingSignature,
        nickname: this.currentIdentity.nickname,
        avatar: this.currentIdentity.avatar
      }
    });
  }

  /**
   * 含私钥的加密导出，使用 PBKDF2-SHA256(100k) 派生密钥 + AES-256-GCM。
   * 输出 JSON: { version, encrypted: true, salt, iv, authTag, ciphertext }（均 base64）。
   */
  public exportIdentityEncrypted(password: string): string {
    if (!this.currentIdentity) throw new Error('No identity available');
    if (!password || password.length < MIN_EXPORT_PASSWORD_LEN) {
      throw new Error(`Password too short (min ${MIN_EXPORT_PASSWORD_LEN} chars)`);
    }

    const payload = JSON.stringify(this.currentIdentity);
    const salt = randomBytes(SALT_LEN);
    const iv = randomBytes(IV_LEN);
    const key = pbkdf2Sync(password, salt, PBKDF2_ITERATIONS, PBKDF2_KEY_LEN, 'sha256');

    const cipher = createCipheriv('aes-256-gcm', key, iv);
    const ciphertext = Buffer.concat([cipher.update(payload, 'utf8'), cipher.final()]);
    const authTag = cipher.getAuthTag();

    return JSON.stringify({
      version: EXPORT_VERSION,
      encrypted: true,
      salt: salt.toString('base64'),
      iv: iv.toString('base64'),
      authTag: authTag.toString('base64'),
      ciphertext: ciphertext.toString('base64')
    });
  }

  /**
   * 解密并导入自己的身份（用于设备迁移）。
   */
  public importIdentityEncrypted(payload: string, password: string): UserIdentity {
    const parsed = JSON.parse(payload);
    if (!parsed.encrypted) throw new Error('Payload is not encrypted');

    const salt = Buffer.from(parsed.salt, 'base64');
    const iv = Buffer.from(parsed.iv, 'base64');
    const authTag = Buffer.from(parsed.authTag, 'base64');
    const ciphertext = Buffer.from(parsed.ciphertext, 'base64');

    const key = pbkdf2Sync(password, salt, PBKDF2_ITERATIONS, PBKDF2_KEY_LEN, 'sha256');
    const decipher = createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);

    let plaintext: string;
    try {
      plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8');
    } catch {
      throw new Error('Invalid password or corrupted file');
    }

    const identity = JSON.parse(plaintext) as UserIdentity;
    if (!this.verifyUserId(identity.userId, identity.publicKey)) {
      throw new Error('Identity integrity check failed');
    }

    this.currentIdentity = identity;
    this.store.set('userIdentity', identity);
    return identity;
  }

  /**
   * 导入对端身份。必须通过 ID/公钥校验，并且若带 box 公钥则验证绑定签名。
   */
  public importPeerIdentity(identityData: string): PeerIdentity {
    const parsed = JSON.parse(identityData);
    // 兼容 v1（直接是字段）和 v2（{data:{...}}）格式
    const data = parsed.data ? parsed.data : parsed;

    if (!this.verifyUserId(data.userId, data.publicKey)) {
      throw new Error('Invalid user identity: ID does not match public key');
    }

    // 只有同时带 box 公钥与绑定签名、且验签通过，才算「加密公钥已验证」。
    // 缺失任一字段属于无加密绑定的 v1 旧身份：仍可保存，但绝不能标记为 verified。
    const hasBinding = !!(data.boxPublicKey && data.keyBindingSignature);
    if (data.boxPublicKey || data.keyBindingSignature) {
      const ok = hasBinding && this.verifyKeyBinding({
        publicKey: data.publicKey,
        boxPublicKey: data.boxPublicKey,
        keyBindingSignature: data.keyBindingSignature
      });
      if (!ok) throw new Error('Key binding signature invalid');
    }

    const peerIdentity: PeerIdentity = {
      userId: data.userId,
      publicKey: data.publicKey,
      boxPublicKey: data.boxPublicKey,
      keyBindingSignature: data.keyBindingSignature,
      nickname: data.nickname || '未知用户',
      avatar: data.avatar,
      verified: hasBinding,
      addedAt: Date.now()
    };

    this.savePeerIdentity(peerIdentity);
    return peerIdentity;
  }

  private savePeerIdentity(peerIdentity: PeerIdentity): void {
    const peers = this.store.get('peerIdentities', {}) as Record<string, PeerIdentity>;
    peers[peerIdentity.userId] = peerIdentity;
    this.store.set('peerIdentities', peers);
  }

  public getPeerIdentities(): Record<string, PeerIdentity> {
    return this.store.get('peerIdentities', {}) as Record<string, PeerIdentity>;
  }

  public getPeerIdentity(userId: string): PeerIdentity | null {
    const peers = this.getPeerIdentities();
    return peers[userId] || null;
  }

  public generateQRCodeData(): string {
    if (!this.currentIdentity) throw new Error('No identity available');

    return JSON.stringify({
      type: 'veilconnect_identity',
      version: EXPORT_VERSION,
      userId: this.currentIdentity.userId,
      publicKey: this.currentIdentity.publicKey,
      boxPublicKey: this.currentIdentity.boxPublicKey,
      keyBindingSignature: this.currentIdentity.keyBindingSignature,
      nickname: this.currentIdentity.nickname,
      avatar: this.currentIdentity.avatar,
      timestamp: Date.now()
    });
  }

  public parseQRCodeData(qrData: string): PeerIdentity {
    const data = JSON.parse(qrData);
    if (data.type !== 'veilconnect_identity') {
      throw new Error('Invalid QR code type');
    }
    return this.importPeerIdentity(JSON.stringify(data));
  }

  public getShortUserId(userId?: string): string {
    const id = userId || this.currentIdentity?.userId;
    if (!id) return '';
    return id.substring(0, 8) + '...';
  }

  public removePeerIdentity(userId: string): boolean {
    const peers = this.getPeerIdentities();
    if (peers[userId]) {
      delete peers[userId];
      this.store.set('peerIdentities', peers);
      return true;
    }
    return false;
  }

  public resetIdentity(): void {
    this.store.clear();
    this.currentIdentity = null;
    this.createNewIdentity();
  }
}
