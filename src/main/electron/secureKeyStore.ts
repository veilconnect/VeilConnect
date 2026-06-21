/**
 * 桌面端密钥库 —— 用操作系统钥匙串（Electron safeStorage）保护各库的 per-store 密钥。
 *
 * 这是浏览器版 BrowserKeyStore 的「升级版」：浏览器没有 OS keychain，只能靠用户口令 +
 * PBKDF2 派生密钥落 IndexedDB；桌面端可把 keyring 交给 OS 级凭据保护
 * （macOS Keychain / Windows DPAPI / Linux libsecret），**无需用户口令即可强保护**，
 * 这正是把信任从"服务器现场下发代码"挪回"签名原生客户端"后才能拿到的能力。
 *
 * 模型：
 *  - keyring = { [storeName]: 32B 随机密钥的 hex }，喂给各 Manager 的 electron-store encryptionKey。
 *  - keyring 整体经 safeStorage.encryptString 加密后写入 userData/keyring.enc。
 *  - 启动时 safeStorage.decryptString 还原。**安全失败即关闭**：若系统加密不可用，默认拒绝
 *    以明文落盘（可用 VEIL_ALLOW_PLAINTEXT_KEYRING=1 显式放宽，仅供无 keychain 的测试环境）。
 *
 * 依赖以构造参数注入（safeStorage / fs / 路径），故可在 Jest 中用假实现做纯逻辑单测，
 * 真实运行时由 main.ts 注入 Electron 的 safeStorage 与 userData 路径。
 */
import { randomBytes } from 'crypto';

const PER_STORE_KEY_BYTES = 32;

/** safeStorage 的最小接口（便于注入/测试）。 */
export interface SafeStorageLike {
  isEncryptionAvailable(): boolean;
  encryptString(plain: string): Buffer;
  decryptString(encrypted: Buffer): string;
}

/** 文件读写的最小接口（便于注入/测试）。 */
export interface KeyringFs {
  existsSync(path: string): boolean;
  readFileSync(path: string): Buffer;
  writeFileSync(path: string, data: Buffer): void;
  rmSync?(path: string, options?: { force?: boolean }): void;
}

export interface SecureKeyStoreOptions {
  filePath: string;
  safeStorage: SafeStorageLike;
  fs: KeyringFs;
  /** 系统加密不可用时是否允许明文落盘（默认 false=安全失败）。 */
  allowPlaintext?: boolean;
}

/** 明文 keyring 的标记前缀（仅 allowPlaintext 时使用，便于审计区分）。 */
const PLAINTEXT_MARKER = 'VEIL_PLAINTEXT_KEYRING:';

export class SecureKeyStore {
  private readonly filePath: string;
  private readonly safeStorage: SafeStorageLike;
  private readonly fs: KeyringFs;
  private readonly allowPlaintext: boolean;
  private keys: Record<string, string> | null = null;

  constructor(opts: SecureKeyStoreOptions) {
    this.filePath = opts.filePath;
    this.safeStorage = opts.safeStorage;
    this.fs = opts.fs;
    this.allowPlaintext = !!opts.allowPlaintext;
  }

  /** 是否已创建 keyring 文件。 */
  isInitialized(): boolean {
    return this.fs.existsSync(this.filePath);
  }

  /** 载入（或在不存在时创建空）keyring 到内存。 */
  load(): void {
    if (this.fs.existsSync(this.filePath)) {
      const raw = this.fs.readFileSync(this.filePath);
      this.keys = this.decryptKeyring(raw);
    } else {
      this.keys = {};
      this.persist();
    }
  }

  private ensureLoaded(): Record<string, string> {
    if (!this.keys) this.load();
    return this.keys!;
  }

  /** 取某库 per-store 密钥；不存在则生成并写回（对齐 BrowserKeyStore.getKey 语义）。 */
  getKey(name: string): string {
    const keys = this.ensureLoaded();
    if (!keys[name]) {
      keys[name] = randomBytes(PER_STORE_KEY_BYTES).toString('hex');
      this.persist();
    }
    return keys[name];
  }

  setKey(name: string, value: string): void {
    const keys = this.ensureLoaded();
    keys[name] = value;
    this.persist();
  }

  deleteKey(name: string): void {
    const keys = this.ensureLoaded();
    delete keys[name];
    this.persist();
  }

  /** 重置：清空 keyring（忘记/换身份）。 */
  reset(): void {
    this.keys = {};
    if (this.fs.rmSync && this.fs.existsSync(this.filePath)) {
      this.fs.rmSync(this.filePath, { force: true });
    } else {
      this.persist();
    }
  }

  private persist(): void {
    const json = JSON.stringify(this.keys ?? {});
    let blob: Buffer;
    if (this.safeStorage.isEncryptionAvailable()) {
      blob = this.safeStorage.encryptString(json);
    } else if (this.allowPlaintext) {
      blob = Buffer.from(PLAINTEXT_MARKER + json, 'utf8');
    } else {
      throw new Error(
        '操作系统加密(safeStorage)不可用，拒绝以明文保存密钥。' +
        '请确认已登录桌面会话/钥匙串可用；测试环境可设 VEIL_ALLOW_PLAINTEXT_KEYRING=1。'
      );
    }
    this.fs.writeFileSync(this.filePath, blob);
  }

  private decryptKeyring(raw: Buffer): Record<string, string> {
    const asText = raw.toString('utf8');
    if (asText.startsWith(PLAINTEXT_MARKER)) {
      if (!this.allowPlaintext) {
        throw new Error('检测到明文 keyring，但未允许明文模式，拒绝载入。');
      }
      return JSON.parse(asText.slice(PLAINTEXT_MARKER.length));
    }
    if (!this.safeStorage.isEncryptionAvailable()) {
      throw new Error('keyring 为系统加密格式，但当前 safeStorage 不可用，无法解密。');
    }
    return JSON.parse(this.safeStorage.decryptString(raw));
  }
}
