import {
  generateRawKey, deriveContentKey, buildUploadStream, decodeBlobStream,
  buildShareLink, parseShareHash, toB64url, fromB64url, STREAM_CHUNK_SIZE
} from '../src/web/blob/blobTransfer';

// Node 20+ 暴露全局 crypto.subtle / Blob / ReadableStream,本模块可直接在测试环境跑。
function fakeFile(bytes: Uint8Array, name: string, type = 'application/octet-stream'): File {
  const blob = new Blob([bytes], { type });
  (blob as any).name = name;
  return blob as unknown as File;
}
async function streamToBytes(s: ReadableStream<Uint8Array>): Promise<Uint8Array> {
  const reader = s.getReader(); const parts: Uint8Array[] = []; let len = 0;
  for (;;) { const { value, done } = await reader.read(); if (done) break; parts.push(value); len += value.length; }
  const out = new Uint8Array(len); let o = 0; for (const p of parts) { out.set(p, o); o += p.length; } return out;
}
function bytesToStream(b: Uint8Array): ReadableStream<Uint8Array> {
  return new ReadableStream<Uint8Array>({ start(c) { c.enqueue(b); c.close(); } });
}
async function blobBytes(b: Blob): Promise<Uint8Array> { return new Uint8Array(await b.arrayBuffer()); }

describe('blobTransfer (网盘式 · 流式分块 VCB2)', () => {
  const small = new Uint8Array(5000);
  for (let i = 0; i < small.length; i++) small[i] = (i * 7 + 3) & 0xff;
  // 跨多块:2.5 * 1MiB → 3 块
  const big = new Uint8Array(Math.floor(STREAM_CHUNK_SIZE * 2.5));
  for (let i = 0; i < big.length; i++) big[i] = (i * 131 + 17) & 0xff;

  describe('base64url', () => {
    it('往返一致,无 +/=', () => {
      const r = generateRawKey();
      const s = toB64url(r);
      expect(s).not.toMatch(/[+/=]/);
      expect(Array.from(fromB64url(s))).toEqual(Array.from(r));
    });
  });

  describe('编码/解码(无密码)', () => {
    it('单块往返:解出原文件 + 元数据', async () => {
      const key = await deriveContentKey(generateRawKey());
      const { meta, blob } = await decodeBlobStream(buildUploadStream(fakeFile(small, 'a.bin'), key), key);
      expect(meta.name).toBe('a.bin');
      expect(meta.size).toBe(5000);
      expect(meta.totalChunks).toBe(1);
      expect(Array.from(await blobBytes(blob!))).toEqual(Array.from(small));
    });

    it('多块往返(2.5MiB → 3 块)字节完全一致', async () => {
      const key = await deriveContentKey(generateRawKey());
      const { meta, blob } = await decodeBlobStream(buildUploadStream(fakeFile(big, 'big.bin'), key), key);
      expect(meta.totalChunks).toBe(3);
      expect(meta.size).toBe(big.length);
      expect(Array.from(await blobBytes(blob!))).toEqual(Array.from(big));
    });

    it('sink 模式:逐块写出,不返回 blob', async () => {
      const key = await deriveContentKey(generateRawKey());
      const parts: Uint8Array[] = [];
      const { meta, blob } = await decodeBlobStream(buildUploadStream(fakeFile(big, 'b.bin'), key), key, { sink: (b) => { parts.push(b); } });
      expect(blob).toBeUndefined();
      const total = parts.reduce((n, p) => n + p.length, 0);
      expect(total).toBe(meta.size);
      const joined = new Uint8Array(total); let o = 0; for (const p of parts) { joined.set(p, o); o += p.length; }
      expect(Array.from(joined)).toEqual(Array.from(big));
    });

    it('错误密钥 → 解密失败', async () => {
      const key = await deriveContentKey(generateRawKey());
      const container = await streamToBytes(buildUploadStream(fakeFile(small, 'a.bin'), key));
      const wrong = await deriveContentKey(generateRawKey());
      await expect(decodeBlobStream(bytesToStream(container), wrong)).rejects.toThrow();
    });

    it('篡改密文 → GCM 失败', async () => {
      const key = await deriveContentKey(generateRawKey());
      const container = await streamToBytes(buildUploadStream(fakeFile(small, 'a.bin'), key));
      container[container.length - 5] ^= 0xff;
      await expect(decodeBlobStream(bytesToStream(container), key)).rejects.toThrow();
    });

    it('截断(丢尾部) → 失败', async () => {
      const key = await deriveContentKey(generateRawKey());
      const container = await streamToBytes(buildUploadStream(fakeFile(big, 'a.bin'), key));
      await expect(decodeBlobStream(bytesToStream(container.subarray(0, container.length - 100)), key)).rejects.toThrow();
    });

    it('非 VCB2 容器 → 拒绝', async () => {
      const key = await deriveContentKey(generateRawKey());
      await expect(decodeBlobStream(bytesToStream(new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8])), key)).rejects.toThrow(/VCB2/i);
    });
  });

  describe('提取密码(链接+密码两者齐备才解)', () => {
    it('正确密码解开;错密码/无密码失败', async () => {
      const raw = generateRawKey();
      const encKey = await deriveContentKey(raw, 'open-sesame');
      const container = await streamToBytes(buildUploadStream(fakeFile(small, 'secret.bin'), encKey));

      const right = await deriveContentKey(raw, 'open-sesame');
      const { blob } = await decodeBlobStream(bytesToStream(container), right);
      expect(Array.from(await blobBytes(blob!))).toEqual(Array.from(small));

      const wrongPw = await deriveContentKey(raw, 'wrong');
      await expect(decodeBlobStream(bytesToStream(container), wrongPw)).rejects.toThrow();

      const noPw = await deriveContentKey(raw);
      await expect(decodeBlobStream(bytesToStream(container), noPw)).rejects.toThrow();
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
