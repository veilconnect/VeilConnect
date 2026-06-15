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

  /**
   * @deprecated 这里的 keyPair 是 X25519 box 密钥（32B），但 nacl.sign 需要 Ed25519 64B 私钥，
   * 调用必抛 "bad secret key size"。签名能力请用 IdentityManager 的 Ed25519 keypair。
   * 留此方法仅为兼容老调用，未来版本将移除。
   */
  public signMessage(message: string): string {
    if (!this.keyPair) {
      throw new Error('Key pair not initialized');
    }

    const messageBytes = naclUtil.decodeUTF8(message);
    const signature = nacl.sign.detached(messageBytes, this.keyPair.secretKey);
    
    return naclUtil.encodeBase64(signature);
  }

  /**
   * 验证数字签名
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