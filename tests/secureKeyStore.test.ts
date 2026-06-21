import { SecureKeyStore, SafeStorageLike, KeyringFs } from '../src/main/electron/secureKeyStore';

// 内存 fs + 可切换可用性的假 safeStorage，用于纯逻辑单测（不依赖 Electron 运行时）。
function memFs(): KeyringFs & { store: Map<string, Buffer> } {
  const store = new Map<string, Buffer>();
  return {
    store,
    existsSync: (p) => store.has(p),
    readFileSync: (p) => store.get(p)!,
    writeFileSync: (p, d) => { store.set(p, Buffer.from(d)); },
    rmSync: (p) => { store.delete(p); }
  };
}

function fakeSafeStorage(available = true): SafeStorageLike {
  // "加密"用一个固定前缀 + base64，足以验证 round-trip 与"非明文落盘"。
  return {
    isEncryptionAvailable: () => available,
    encryptString: (s) => Buffer.from('ENC:' + Buffer.from(s, 'utf8').toString('base64'), 'utf8'),
    decryptString: (b) => {
      const t = b.toString('utf8');
      if (!t.startsWith('ENC:')) throw new Error('bad blob');
      return Buffer.from(t.slice(4), 'base64').toString('utf8');
    }
  };
}

const FILE = '/userData/keyring.enc';

describe('SecureKeyStore (桌面 OS 钥匙串密钥库)', () => {
  it('首次 getKey 生成 32 字节 hex 并持久化（密文非明文）', () => {
    const fs = memFs();
    const ks = new SecureKeyStore({ filePath: FILE, safeStorage: fakeSafeStorage(), fs });
    const k = ks.getKey('identity-store');
    expect(k).toMatch(/^[0-9a-f]{64}$/);
    const onDisk = fs.store.get(FILE)!.toString('utf8');
    expect(onDisk.startsWith('ENC:')).toBe(true);     // 经 safeStorage 加密
    expect(onDisk).not.toContain(k);                  // 明文密钥不出现在盘上
  });

  it('同名 getKey 稳定，跨实例可还原', () => {
    const fs = memFs();
    const ks1 = new SecureKeyStore({ filePath: FILE, safeStorage: fakeSafeStorage(), fs });
    const a = ks1.getKey('crypto-store');
    expect(ks1.getKey('crypto-store')).toBe(a);
    // 新实例从同一"磁盘"载入
    const ks2 = new SecureKeyStore({ filePath: FILE, safeStorage: fakeSafeStorage(), fs });
    expect(ks2.getKey('crypto-store')).toBe(a);
  });

  it('不同库各自独立的密钥', () => {
    const fs = memFs();
    const ks = new SecureKeyStore({ filePath: FILE, safeStorage: fakeSafeStorage(), fs });
    expect(ks.getKey('a')).not.toBe(ks.getKey('b'));
  });

  it('isInitialized 反映文件存在性；reset 清空', () => {
    const fs = memFs();
    const ks = new SecureKeyStore({ filePath: FILE, safeStorage: fakeSafeStorage(), fs });
    expect(ks.isInitialized()).toBe(false);
    ks.getKey('x');
    expect(ks.isInitialized()).toBe(true);
    ks.reset();
    expect(ks.isInitialized()).toBe(false);
  });

  it('系统加密不可用且未允许明文 → 安全失败（拒绝写盘）', () => {
    const fs = memFs();
    const ks = new SecureKeyStore({ filePath: FILE, safeStorage: fakeSafeStorage(false), fs });
    expect(() => ks.getKey('x')).toThrow(/拒绝以明文/);
    expect(fs.store.has(FILE)).toBe(false);
  });

  it('显式允许明文时落盘带审计标记，可 round-trip', () => {
    const fs = memFs();
    const ks = new SecureKeyStore({ filePath: FILE, safeStorage: fakeSafeStorage(false), fs, allowPlaintext: true });
    const k = ks.getKey('x');
    expect(fs.store.get(FILE)!.toString('utf8').startsWith('VEIL_PLAINTEXT_KEYRING:')).toBe(true);
    const ks2 = new SecureKeyStore({ filePath: FILE, safeStorage: fakeSafeStorage(false), fs, allowPlaintext: true });
    expect(ks2.getKey('x')).toBe(k);
  });

  it('加密格式 keyring 在 safeStorage 不可用时拒绝解密（不静默丢失）', () => {
    const fs = memFs();
    new SecureKeyStore({ filePath: FILE, safeStorage: fakeSafeStorage(true), fs }).getKey('x');
    const broken = new SecureKeyStore({ filePath: FILE, safeStorage: fakeSafeStorage(false), fs });
    expect(() => broken.getKey('y')).toThrow(/safeStorage 不可用/);
  });
});
