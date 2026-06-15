import * as nacl from 'tweetnacl';
import * as naclUtil from 'tweetnacl-util';
import { createHash } from 'crypto';
import Store from 'electron-store';

export interface CustomIdOptions {
  customId: string;           // 用户自定义的ID
  suffix?: string;            // 可选的唯一性后缀
  reservationProof?: string;  // ID预留证明
}

export interface CustomUserIdentity {
  customId: string;           // 自定义用户ID
  canonicalId: string;        // 规范化ID (基于公钥)
  publicKey: string;          // Ed25519公钥
  secretKey: string;          // Ed25519私钥
  nickname: string;           // 用户昵称
  avatar?: string;            // 头像
  createdAt: number;          // 创建时间
  idType: 'custom' | 'canonical' | 'hybrid';
}

export class CustomIdManager {
  private store: Store;
  private reservedIds: Set<string> = new Set();

  constructor() {
    this.store = new Store({
      name: 'custom-identity',
      encryptionKey: 'veilconnect-custom-id-key'
    });
    
    this.loadReservedIds();
  }

  /**
   * 方案1: 自定义ID + 公钥哈希后缀
   * 格式: customname#a1b2c3d4
   */
  public createHybridId(customId: string, publicKey: Uint8Array): string {
    // 验证自定义ID格式
    if (!this.validateCustomId(customId)) {
      throw new Error('Invalid custom ID format');
    }

    // 生成公钥哈希后缀 (前8位)
    const hash = createHash('sha256').update(publicKey).digest();
    const suffix = hash.slice(0, 4).toString('hex');
    
    return `${customId}#${suffix}`;
  }

  /**
   * 方案2: 纯自定义ID + 区块链预留机制
   * 需要先在分布式网络中预留ID
   */
  public async reserveCustomId(customId: string, publicKey: string): Promise<string> {
    if (!this.validateCustomId(customId)) {
      throw new Error('Invalid custom ID format');
    }

    // 检查本地是否已被预留
    if (this.reservedIds.has(customId.toLowerCase())) {
      throw new Error('Custom ID already reserved');
    }

    // 生成预留证明 (签名)
    const timestamp = Date.now();
    const reservationData = JSON.stringify({
      customId,
      publicKey,
      timestamp
    });

    const publicKeyBytes = naclUtil.decodeBase64(publicKey);
    const reservationHash = createHash('sha256')
      .update(reservationData)
      .digest();

    // 在实际实现中，这里应该向DHT网络广播预留请求
    // 并等待网络确认
    await this.broadcastReservation(customId, reservationHash);

    // 本地记录预留
    this.reservedIds.add(customId.toLowerCase());
    this.saveReservedIds();

    return customId;
  }

  /**
   * 方案3: 分层ID系统
   * 格式: domain.subdomain.username
   */
  public createHierarchicalId(
    domain: string,
    subdomain: string,
    username: string,
    publicKey: Uint8Array
  ): string {
    const parts = [domain, subdomain, username].filter(Boolean);
    
    // 验证各部分格式
    parts.forEach(part => {
      if (!this.validateIdPart(part)) {
        throw new Error(`Invalid ID part: ${part}`);
      }
    });

    const hierarchicalId = parts.join('.');
    
    // 添加公钥验证码
    const hash = createHash('sha256').update(publicKey).digest();
    const checksum = hash.slice(0, 2).toString('hex');
    
    return `${hierarchicalId}:${checksum}`;
  }

  /**
   * 验证自定义ID格式
   */
  private validateCustomId(customId: string): boolean {
    // 规则:
    // - 长度: 3-32个字符
    // - 字符: 字母、数字、下划线、连字符
    // - 不能以数字开头
    // - 不能包含连续的特殊字符
    const regex = /^[a-zA-Z][a-zA-Z0-9_-]{2,31}$/;
    
    if (!regex.test(customId)) {
      return false;
    }

    // 检查连续特殊字符
    if (/[_-]{2,}/.test(customId)) {
      return false;
    }

    // 检查保留词
    const reservedWords = [
      'admin', 'root', 'system', 'veilconnect',
      'support', 'help', 'api', 'www', 'mail'
    ];
    
    if (reservedWords.includes(customId.toLowerCase())) {
      return false;
    }

    return true;
  }

  /**
   * 验证ID部分 (用于分层ID)
   */
  private validateIdPart(part: string): boolean {
    const regex = /^[a-zA-Z][a-zA-Z0-9_-]{1,15}$/;
    return regex.test(part);
  }

  /**
   * 创建带自定义ID的用户身份
   */
  public createCustomIdentity(
    customIdOptions: CustomIdOptions,
    nickname: string = '匿名用户'
  ): CustomUserIdentity {
    // 生成密钥对
    const keyPair = nacl.sign.keyPair();
    
    // 生成规范化ID (基于公钥)
    const canonicalId = this.generateCanonicalId(keyPair.publicKey);
    
    // 根据选项生成自定义ID
    let finalCustomId: string;
    let idType: 'custom' | 'canonical' | 'hybrid';

    if (customIdOptions.customId) {
      if (customIdOptions.suffix) {
        // 混合模式: 自定义ID + 后缀
        finalCustomId = `${customIdOptions.customId}${customIdOptions.suffix}`;
        idType = 'hybrid';
      } else {
        // 纯自定义模式
        finalCustomId = customIdOptions.customId;
        idType = 'custom';
      }
    } else {
      // 回退到规范化ID
      finalCustomId = canonicalId;
      idType = 'canonical';
    }

    const identity: CustomUserIdentity = {
      customId: finalCustomId,
      canonicalId,
      publicKey: naclUtil.encodeBase64(keyPair.publicKey),
      secretKey: naclUtil.encodeBase64(keyPair.secretKey),
      nickname,
      createdAt: Date.now(),
      idType
    };

    // 保存身份
    this.store.set('customUserIdentity', identity);
    
    return identity;
  }

  /**
   * 生成规范化ID (基于公钥的原始方案)
   */
  private generateCanonicalId(publicKey: Uint8Array): string {
    const hash = createHash('sha256').update(publicKey).digest();
    const truncated = hash.slice(0, 16);
    return this.base58Encode(truncated);
  }

  /**
   * Base58编码
   */
  private base58Encode(buffer: Buffer): string {
    const alphabet = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
    let result = '';
    let num = BigInt('0x' + buffer.toString('hex'));
    
    while (num > 0) {
      const remainder = num % 58n;
      result = alphabet[Number(remainder)] + result;
      num = num / 58n;
    }
    
    for (let i = 0; i < buffer.length && buffer[i] === 0; i++) {
      result = '1' + result;
    }
    
    return result;
  }

  /**
   * 验证自定义ID的所有权
   */
  public verifyCustomId(customId: string, publicKey: string, signature: string): boolean {
    try {
      // 验证签名
      const message = `I own the custom ID: ${customId}`;
      const messageBytes = naclUtil.decodeUTF8(message);
      const signatureBytes = naclUtil.decodeBase64(signature);
      const publicKeyBytes = naclUtil.decodeBase64(publicKey);
      
      return nacl.sign.detached.verify(messageBytes, signatureBytes, publicKeyBytes);
    } catch (error) {
      return false;
    }
  }

  /**
   * 解析混合ID
   */
  public parseHybridId(hybridId: string): { customPart: string; hashPart: string } | null {
    const match = hybridId.match(/^(.+)#([a-f0-9]{8})$/);
    if (!match) return null;
    
    return {
      customPart: match[1],
      hashPart: match[2]
    };
  }

  /**
   * 解析分层ID
   */
  public parseHierarchicalId(hierarchicalId: string): {
    parts: string[];
    checksum: string;
  } | null {
    const match = hierarchicalId.match(/^(.+):([a-f0-9]{4})$/);
    if (!match) return null;
    
    return {
      parts: match[1].split('.'),
      checksum: match[2]
    };
  }

  /**
   * 搜索用户 (支持模糊匹配)
   */
  public searchUsers(query: string): CustomUserIdentity[] {
    // 在实际实现中，这里应该查询DHT网络
    // 返回匹配的用户列表
    const allUsers = this.store.get('knownUsers', []) as CustomUserIdentity[];
    
    return allUsers.filter(user => 
      user.customId.toLowerCase().includes(query.toLowerCase()) ||
      user.nickname.toLowerCase().includes(query.toLowerCase())
    );
  }

  /**
   * 广播ID预留请求 (模拟)
   */
  private async broadcastReservation(customId: string, proof: Buffer): Promise<void> {
    // 在实际实现中，这里应该:
    // 1. 向DHT网络广播预留请求
    // 2. 等待网络节点确认
    // 3. 处理冲突解决
    
    console.log(`Broadcasting reservation for ${customId}`);
    
    // 模拟网络延迟
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 模拟成功预留
    return Promise.resolve();
  }

  /**
   * 加载已预留的ID
   */
  private loadReservedIds(): void {
    const reserved = this.store.get('reservedIds', []) as string[];
    this.reservedIds = new Set(reserved);
  }

  /**
   * 保存已预留的ID
   */
  private saveReservedIds(): void {
    this.store.set('reservedIds', Array.from(this.reservedIds));
  }

  /**
   * 生成ID可用性报告
   */
  public async checkIdAvailability(customId: string): Promise<{
    available: boolean;
    suggestions: string[];
    reason?: string;
  }> {
    if (!this.validateCustomId(customId)) {
      return {
        available: false,
        suggestions: [],
        reason: 'Invalid format'
      };
    }

    if (this.reservedIds.has(customId.toLowerCase())) {
      const suggestions = this.generateSuggestions(customId);
      return {
        available: false,
        suggestions,
        reason: 'Already reserved'
      };
    }

    // 在实际实现中，这里应该查询DHT网络
    return {
      available: true,
      suggestions: []
    };
  }

  /**
   * 生成ID建议
   */
  private generateSuggestions(baseId: string): string[] {
    const suggestions: string[] = [];
    
    // 添加数字后缀
    for (let i = 1; i <= 5; i++) {
      suggestions.push(`${baseId}${i}`);
    }
    
    // 添加下划线变体
    suggestions.push(`${baseId}_`);
    suggestions.push(`_${baseId}`);
    
    // 添加年份后缀
    const year = new Date().getFullYear();
    suggestions.push(`${baseId}${year}`);
    
    return suggestions.slice(0, 5);
  }
} 