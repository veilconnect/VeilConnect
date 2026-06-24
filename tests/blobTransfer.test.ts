import {
  generateRawKey, deriveContentKey, packBlob, unpackBlob,
  buildShareLink, parseShareHash, toB64url, fromB64url
} from '../src/web/blob/blobTransfer';

// Node 20+ 暴露全局 crypto.subtle(含 HKDF/AES-GCM),本模块可直接在测试环境跑。
describe('blobTransfer (网盘式链接即密钥)', () => {
  const fileBytes = new Uint8Array(5000);
  for (let i = 0; i < fileBytes.length; i++) fileBytes[i] = (i * 7 + 3) & 0xff;

  describe('base64url', () => {
    it('往返一致,无 +/=', () => {
      const r = generateRawKey();
      const s = toB64url(r);
      expect(s).not.toMatch(/[+/=]/);
      expect(Array.from(fromB64url(s))).toEqual(Array.from(r));
    });
  });

  describe('pack/unpack(无密码)', () => {
    it('往返:解出原文件 + 元数据', async () => {
      const raw = generateRawKey();
      const key = await deriveContentKey(raw);
      const container = await packBlob(fileBytes, 'a.bin', 'application/octet-stream', key);
      const { meta, bytes } = await unpackBlob(container, key);
      expect(meta.name).toBe('a.bin');
      expect(meta.size).toBe(5000);
      expect(Array.from(bytes)).toEqual(Array.from(fileBytes));
    });

    it('错误密钥 → 解密失败(GCM 抛错)', async () => {
      const key = await deriveContentKey(generateRawKey());
      const container = await packBlob(fileBytes, 'a.bin', '', key);
      const wrong = await deriveContentKey(generateRawKey());
      await expect(unpackBlob(container, wrong)).rejects.toThrow();
    });

    it('篡改密文 → 完整性/GCM 失败', async () => {
      const raw = generateRawKey();
      const key = await deriveContentKey(raw);
      const container = await packBlob(fileBytes, 'a.bin', '', key);
      container[container.length - 5] ^= 0xff; // 翻转文件密文末尾一字节
      await expect(unpackBlob(container, key)).rejects.toThrow();
    });

    it('非 VCB1 容器 → 拒绝', async () => {
      const key = await deriveContentKey(generateRawKey());
      await expect(unpackBlob(new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]), key)).rejects.toThrow(/blob/i);
    });
  });

  describe('提取密码(链接+密码两者齐备才解)', () => {
    it('同链接密钥 + 正确密码 → 解开;错密码 → 失败;无密码 → 失败', async () => {
      const raw = generateRawKey();
      const encKey = await deriveContentKey(raw, 'open-sesame');
      const container = await packBlob(fileBytes, 'secret.bin', '', encKey);

      const right = await deriveContentKey(raw, 'open-sesame');
      const { bytes } = await unpackBlob(container, right);
      expect(Array.from(bytes)).toEqual(Array.from(fileBytes));

      const wrongPw = await deriveContentKey(raw, 'wrong');
      await expect(unpackBlob(container, wrongPw)).rejects.toThrow();

      const noPw = await deriveContentKey(raw); // 有密码加密,却不带密码 → 派生出不同 key
      await expect(unpackBlob(container, noPw)).rejects.toThrow();
    });
  });

  describe('分享链接', () => {
    it('build/parse 往返;p=1 标记密码', () => {
      const raw = generateRawKey();
      const id = 'a'.repeat(32);
      const link = buildShareLink('https://host:8443/', id, raw, true);
      expect(link).toContain(`#dl=${id}`);
      expect(link).toContain('&p=1');
      const parsed = parseShareHash(link.slice(link.indexOf('#')));
      expect(parsed).not.toBeNull();
      expect(parsed!.id).toBe(id);
      expect(parsed!.needsPassword).toBe(true);
      expect(Array.from(parsed!.rawKey)).toEqual(Array.from(raw));
    });

    it('非法/缺参数 → null', () => {
      expect(parseShareHash('#room=abc&t=def')).toBeNull();
      expect(parseShareHash('#dl=short&k=xx')).toBeNull();
    });
  });
});
