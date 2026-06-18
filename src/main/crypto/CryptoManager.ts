import * as nacl from 'tweetnacl';
import * as naclUtil from 'tweetnacl-util';
import Store from 'electron-store';

export interface KeyPair {
  publicKey: string;
  secretKey: string;
}

export interface EncryptedMessage {
  nonce: string;
  ciphertext: string;
  timestamp: number;
}

/**
 * X25519（NaCl box）密钥管理。
 *
 * ⚠️ 安全模型注记（避免误读）：网页版的**实时聊天消息不走本类**——实时收发由
 * `RatchetManager`（Double Ratchet）端到端加密，提供每条消息级前向保密与断后向自愈。
 * 本类在当前网页版中的**唯一实时职责**是产出 box 公钥（`getPublicKey`/`generateKeyPair`），
 * 由 `IdentityManager.attachBoxPublicKey` 用 Ed25519 身份私钥签名后绑定进身份，供对端验签防 MITM。
 *
 * 其余 `encryptMessage/decryptMessage/encrypt/decrypt/encryptFile/decryptFile/verifySignature`
 * 是自桌面端移植保留、且有单元测试覆盖的通用 NaCl box / Ed25519 原语，
 * 但**未接入网页实时消息路径**（无对应 worker channel 调用）。保留作为离线/文件等场景的可用原语；
 * 切勿据此误以为聊天消息走的是静态 box 共享密钥。
 */
export class CryptoManager {
  private store: Store;
  private keyPair: nacl.BoxKeyPair | null = null;
  private sharedSecrets: Map<string, Uint8Array> = new Map();

  constructor(encryptionKey: string) {
    this.store = new Store({
      name: 'crypto-keys',
      encryptionKey
    });

    this.loadOrGenerateKeyPair();
  }

  /**
   * 生成或加载密钥对
   */
  private loadOrGenerateKeyPair(): void {
    const storedKeyPair = this.store.get('keyPair') as KeyPair | undefined;
    
    if (storedKeyPair) {
      // 从存储中恢复密钥对
      this.keyPair = {
        publicKey: naclUtil.decodeBase64(storedKeyPair.publicKey),
        secretKey: naclUtil.decodeBase64(storedKeyPair.secretKey)
      };
    } else {
      // 生成新的密钥对
      this.generateKeyPair();
    }
  }

  /**
   * 生成新的密钥对
   */
  public generateKeyPair(): KeyPair {
    this.keyPair = nacl.box.keyPair();
    
    const keyPairData: KeyPair = {
      publicKey: naclUtil.encodeBase64(this.keyPair.publicKey),
      secretKey: naclUtil.encodeBase64(this.keyPair.secretKey)
    };
    
    // 保存到本地存储
    this.store.set('keyPair', keyPairData);
    
    return keyPairData;
  }

  /**
   * 获取公钥
   */
  public getPublicKey(): string {
    if (!this.keyPair) {
      throw new Error('Key pair not initialized');
    }
    return naclUtil.encodeBase64(this.keyPair.publicKey);
  }

  /**
   * 计算共享密钥
   */
  private getSharedSecret(peerPublicKey: string): Uint8Array {
    if (!this.keyPair) {
      throw new Error('Key pair not initialized');
    }

    // 检查缓存
    if (this.sharedSecrets.has(peerPublicKey)) {
      return this.sharedSecrets.get(peerPublicKey)!;
    }

    // 计算共享密钥
    const peerPublicKeyBytes = naclUtil.decodeBase64(peerPublicKey);
    const sharedSecret = nacl.box.before(peerPublicKeyBytes, this.keyPair.secretKey);
    
    // 缓存共享密钥
    this.sharedSecrets.set(peerPublicKey, sharedSecret);
    
    return sharedSecret;
  }

  /**
   * 加密数据 - IPC接口方法
   */
  public encrypt(data: string, recipientPublicKey: string): EncryptedMessage {
    return this.encryptMessage(JSON.parse(data), recipientPublicKey);
  }

  /**
   * 解密数据 - IPC接口方法
   */
  public decrypt(encryptedData: string, senderPublicKey: string): string {
    const encryptedMessage: EncryptedMessage = JSON.parse(encryptedData);
    const decrypted = this.decryptMessage(encryptedMessage, senderPublicKey);
    return JSON.stringify(decrypted);
  }

  /**
   * 加密消息
   */
  public encryptMessage(message: any, peerPublicKey: string): EncryptedMessage {
    const sharedSecret = this.getSharedSecret(peerPublicKey);
    const messageBytes = naclUtil.decodeUTF8(JSON.stringify(message));
    const nonce = nacl.randomBytes(nacl.box.nonceLength);
    
    const ciphertext = nacl.box.after(messageBytes, nonce, sharedSecret);
    
    return {
      nonce: naclUtil.encodeBase64(nonce),
      ciphertext: naclUtil.encodeBase64(ciphertext),
      timestamp: Date.now()
    };
  }

  /**
   * 解密消息
   */
  public decryptMessage(encryptedMessage: EncryptedMessage, peerPublicKey: string): any {
    const sharedSecret = this.getSharedSecret(peerPublicKey);
    const nonce = naclUtil.decodeBase64(encryptedMessage.nonce);
    const ciphertext = naclUtil.decodeBase64(encryptedMessage.ciphertext);
    
    const decrypted = nacl.box.open.after(ciphertext, nonce, sharedSecret);
    
    if (!decrypted) {
      throw new Error('Failed to decrypt message');
    }
    
    const messageString = naclUtil.encodeUTF8(decrypted);
    return JSON.parse(messageString);
  }

  // 注：原 signMessage 已移除——它用 X25519 box 私钥（32B）调 nacl.sign（需 Ed25519 64B），
  // 必抛 "bad secret key size"，属死代码。签名一律走 IdentityManager 的 Ed25519 keypair。

  /**
   * 验证数字签名（Ed25519 公钥验签，纯静态运算，不依赖本机 box 私钥）
   */
  public verifySignature(message: string, signature: string, publicKey: string): boolean {
    const messageBytes = naclUtil.decodeUTF8(message);
    const signatureBytes = naclUtil.decodeBase64(signature);
    const publicKeyBytes = naclUtil.decodeBase64(publicKey);
    
    return nacl.sign.detached.verify(messageBytes, signatureBytes, publicKeyBytes);
  }

  /**
   * 加密文件
   */
  public encryptFile(fileBuffer: Buffer, peerPublicKey: string): EncryptedMessage {
    const sharedSecret = this.getSharedSecret(peerPublicKey);
    const nonce = nacl.randomBytes(nacl.box.nonceLength);
    
    const ciphertext = nacl.box.after(new Uint8Array(fileBuffer), nonce, sharedSecret);
    
    return {
      nonce: naclUtil.encodeBase64(nonce),
      ciphertext: naclUtil.encodeBase64(ciphertext),
      timestamp: Date.now()
    };
  }

  /**
   * 解密文件
   */
  public decryptFile(encryptedFile: EncryptedMessage, peerPublicKey: string): Buffer {
    const sharedSecret = this.getSharedSecret(peerPublicKey);
    const nonce = naclUtil.decodeBase64(encryptedFile.nonce);
    const ciphertext = naclUtil.decodeBase64(encryptedFile.ciphertext);
    
    const decrypted = nacl.box.open.after(ciphertext, nonce, sharedSecret);
    
    if (!decrypted) {
      throw new Error('Failed to decrypt file');
    }
    
    return Buffer.from(decrypted);
  }

  /**
   * 清理缓存的共享密钥
   */
  public clearSharedSecrets(): void {
    this.sharedSecrets.clear();
  }
} 