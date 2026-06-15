import { app, safeStorage } from 'electron';
import { promises as fs } from 'fs';
import * as path from 'path';
import { randomBytes } from 'crypto';

const KEY_DIR = 'secure-keys';

// 仅当显式设置该环境变量时，才允许在 OS 级加密不可用时以明文持久化密钥（用于无 keyring 的开发环境）。
// 默认拒绝明文落盘，避免把保护私钥的主密钥静默写成明文。
function plaintextAllowed(): boolean {
  return process.env.VC_ALLOW_PLAINTEXT_KEYS === '1';
}

async function ensureDir(dir: string): Promise<void> {
  await fs.mkdir(dir, { recursive: true });
}

async function readFileOrNull(filePath: string): Promise<Buffer | null> {
  try {
    return await fs.readFile(filePath);
  } catch (err: any) {
    if (err.code === 'ENOENT') return null;
    throw err;
  }
}

export class SecureKeyStore {
  private static async storePath(name: string): Promise<string> {
    await app.whenReady();
    const dir = path.join(app.getPath('userData'), KEY_DIR);
    await ensureDir(dir);
    return path.join(dir, `${name}.bin`);
  }

  static async getKey(name: string): Promise<string> {
    const filePath = await this.storePath(name);
    const existing = await readFileOrNull(filePath);

    if (existing) {
      if (safeStorage.isEncryptionAvailable()) {
        try {
          return safeStorage.decryptString(existing);
        } catch (err) {
          // 不再静默把解密失败的内容当明文（防降级）；仅在显式允许明文时才兼容旧数据
          if (plaintextAllowed()) {
            return existing.toString('utf8');
          }
          throw new Error('Failed to decrypt secure key store; refusing plaintext fallback');
        }
      }
      if (plaintextAllowed()) {
        return existing.toString('utf8');
      }
      throw new Error('OS encryption unavailable; set VC_ALLOW_PLAINTEXT_KEYS=1 to permit plaintext key storage');
    }

    const fresh = randomBytes(32).toString('hex');
    await this.setKey(name, fresh);
    return fresh;
  }

  static async setKey(name: string, value: string): Promise<void> {
    const filePath = await this.storePath(name);
    let payload: Buffer;
    if (safeStorage.isEncryptionAvailable()) {
      payload = safeStorage.encryptString(value);
    } else if (plaintextAllowed()) {
      payload = Buffer.from(value, 'utf8');
    } else {
      throw new Error('OS encryption unavailable; set VC_ALLOW_PLAINTEXT_KEYS=1 to permit plaintext key storage');
    }
    await fs.writeFile(filePath, payload, { mode: 0o600 });
  }

  static async deleteKey(name: string): Promise<void> {
    const filePath = await this.storePath(name);
    try {
      await fs.unlink(filePath);
    } catch (err: any) {
      if (err.code !== 'ENOENT') throw err;
    }
  }
}
