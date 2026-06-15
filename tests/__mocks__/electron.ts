/**
 * Electron API 测试 mock。仅覆盖被 src/main 引用的部分。
 */
import * as os from 'os';
import * as path from 'path';
import { mkdtempSync } from 'fs';

const tmpUserData = mkdtempSync(path.join(os.tmpdir(), 'vc-test-'));

export const app = {
  getPath: (name: string) => {
    if (name === 'userData') return tmpUserData;
    return os.tmpdir();
  },
  whenReady: async () => undefined,
  getVersion: () => '0.0.0-test',
  quit: () => undefined
};

export const safeStorage = {
  isEncryptionAvailable: () => false,
  encryptString: (s: string) => Buffer.from(s, 'utf8'),
  decryptString: (b: Buffer) => b.toString('utf8')
};

export const ipcMain = {
  handle: jest.fn(),
  on: jest.fn(),
  removeHandler: jest.fn()
};

export const BrowserWindow = jest.fn();
export const Notification = { isSupported: () => false };
