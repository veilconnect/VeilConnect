import { SecureKeyStore } from '../src/main/security/SecureKeyStore';

/**
 * SecureKeyStore：在 OS 级加密不可用（测试 mock 即如此）时，
 * 默认必须拒绝明文落盘，除非显式设置 VC_ALLOW_PLAINTEXT_KEYS=1。
 */
describe('SecureKeyStore 明文降级保护', () => {
  const original = process.env.VC_ALLOW_PLAINTEXT_KEYS;

  afterEach(() => {
    if (original === undefined) delete process.env.VC_ALLOW_PLAINTEXT_KEYS;
    else process.env.VC_ALLOW_PLAINTEXT_KEYS = original;
  });

  it('未允许明文时 setKey 抛错而不落盘', async () => {
    delete process.env.VC_ALLOW_PLAINTEXT_KEYS;
    await expect(SecureKeyStore.setKey('test-refuse', 'secret')).rejects.toThrow(/plaintext/i);
  });

  it('显式允许明文时可写入并读回', async () => {
    process.env.VC_ALLOW_PLAINTEXT_KEYS = '1';
    await SecureKeyStore.setKey('test-allow', 'hello-secret');
    expect(await SecureKeyStore.getKey('test-allow')).toBe('hello-secret');
  });

  it('允许明文时，getKey 对新名字自动生成 32 字节随机密钥', async () => {
    process.env.VC_ALLOW_PLAINTEXT_KEYS = '1';
    const key = await SecureKeyStore.getKey('test-fresh-key');
    expect(key).toMatch(/^[0-9a-f]{64}$/);
  });
});
