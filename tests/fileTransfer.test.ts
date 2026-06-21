import {
  chunkCount,
  chunkRange,
  isImageMime,
  formatBytes,
  bytesToBase64,
  base64ToBytes,
  concatChunks,
  sha256Hex,
  generateFileKey,
  importFileKey,
  encryptChunk,
  decryptChunk,
  ChunkAssembler,
  DEFAULT_CHUNK_SIZE,
} from '../src/web/fileTransfer/fileTransfer';

describe('chunkCount', () => {
  it('rounds up partial chunks', () => {
    expect(chunkCount(0)).toBe(1);            // 空文件按 1 块，统一收尾
    expect(chunkCount(1, 64)).toBe(1);
    expect(chunkCount(64, 64)).toBe(1);
    expect(chunkCount(65, 64)).toBe(2);
    expect(chunkCount(200, 64)).toBe(4);
  });
  it('uses default chunk size', () => {
    expect(chunkCount(DEFAULT_CHUNK_SIZE + 1)).toBe(2);
  });
  it('rejects invalid input', () => {
    expect(() => chunkCount(-1)).toThrow();
    expect(() => chunkCount(10, 0)).toThrow();
  });
});

describe('chunkRange', () => {
  it('clamps the final chunk to total length', () => {
    expect(chunkRange(0, 64, 200)).toEqual({ start: 0, end: 64 });
    expect(chunkRange(3, 64, 200)).toEqual({ start: 192, end: 200 });
  });
  it('covers the whole file with no gaps or overlaps', () => {
    const total = 1000;
    const size = 64;
    const n = chunkCount(total, size);
    let cursor = 0;
    for (let i = 0; i < n; i++) {
      const { start, end } = chunkRange(i, size, total);
      expect(start).toBe(cursor);
      cursor = end;
    }
    expect(cursor).toBe(total);
  });
});

describe('isImageMime', () => {
  it('detects image MIME types', () => {
    expect(isImageMime('image/png')).toBe(true);
    expect(isImageMime('image/jpeg')).toBe(true);
    expect(isImageMime('IMAGE/WEBP')).toBe(true);
  });
  it('rejects non-images and junk', () => {
    expect(isImageMime('application/pdf')).toBe(false);
    expect(isImageMime('')).toBe(false);
    expect(isImageMime(undefined)).toBe(false);
    expect(isImageMime(null)).toBe(false);
  });
});

describe('formatBytes', () => {
  it('formats across units', () => {
    expect(formatBytes(0)).toBe('0 B');
    expect(formatBytes(512)).toBe('512 B');
    expect(formatBytes(1024)).toBe('1 KB');
    expect(formatBytes(1536)).toBe('1.5 KB');
    expect(formatBytes(1024 * 1024)).toBe('1 MB');
  });
  it('handles bad input', () => {
    expect(formatBytes(-5)).toBe('—');
  });
});

describe('base64 round-trip', () => {
  it('survives arbitrary bytes including large buffers', () => {
    const bytes = new Uint8Array(200000);
    for (let i = 0; i < bytes.length; i++) bytes[i] = (i * 31 + 7) & 0xff;
    const round = base64ToBytes(bytesToBase64(bytes));
    expect(round.length).toBe(bytes.length);
    expect(round).toEqual(bytes);
  });
  it('handles empty input', () => {
    expect(bytesToBase64(new Uint8Array(0))).toBe('');
    expect(base64ToBytes('')).toEqual(new Uint8Array(0));
  });
});

describe('concatChunks', () => {
  it('joins chunks in order', () => {
    const out = concatChunks([new Uint8Array([1, 2]), new Uint8Array([3]), new Uint8Array([4, 5])]);
    expect(Array.from(out)).toEqual([1, 2, 3, 4, 5]);
  });
});

describe('sha256Hex', () => {
  it('matches a known vector for empty input', async () => {
    // SHA-256("") well-known value
    expect(await sha256Hex(new Uint8Array(0))).toBe(
      'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
    );
  });
  it('is stable and 64 hex chars', async () => {
    const h = await sha256Hex(new TextEncoder().encode('veilconnect'));
    expect(h).toMatch(/^[0-9a-f]{64}$/);
    expect(await sha256Hex(new TextEncoder().encode('veilconnect'))).toBe(h);
  });
});

describe('AES-GCM chunk encryption', () => {
  it('round-trips a chunk and rejects tampering', async () => {
    const { key, raw } = await generateFileKey();
    const plain = new TextEncoder().encode('secret photo bytes');
    const { iv, data } = await encryptChunk(key, plain);

    // base64 ciphertext must differ from plaintext base64
    expect(data).not.toBe(bytesToBase64(plain));

    // importable on the receive side from the raw key
    const imported = await importFileKey(raw);
    const decrypted = await decryptChunk(imported, iv, data);
    expect(new TextDecoder().decode(decrypted)).toBe('secret photo bytes');

    // flipping a ciphertext byte must fail the GCM tag
    const corrupt = base64ToBytes(data);
    corrupt[0] ^= 0xff;
    await expect(decryptChunk(imported, iv, bytesToBase64(corrupt))).rejects.toBeTruthy();
  });

  it('uses a fresh IV per call', async () => {
    const { key } = await generateFileKey();
    const plain = new Uint8Array([9, 9, 9]);
    const a = await encryptChunk(key, plain);
    const b = await encryptChunk(key, plain);
    expect(a.iv).not.toBe(b.iv);
  });
});

describe('ChunkAssembler', () => {
  it('tracks progress and reassembles in order regardless of arrival order', () => {
    const asm = new ChunkAssembler(3);
    expect(asm.isComplete()).toBe(false);
    expect(asm.add(2, new Uint8Array([3]))).toBe(true);
    expect(asm.add(0, new Uint8Array([1]))).toBe(true);
    expect(asm.receivedCount).toBe(2);
    expect(asm.progress).toBeCloseTo(2 / 3);
    expect(asm.missing()).toEqual([1]);
    expect(asm.add(1, new Uint8Array([2]))).toBe(true);
    expect(asm.isComplete()).toBe(true);
    expect(Array.from(asm.assemble())).toEqual([1, 2, 3]);
  });

  it('ignores duplicates and out-of-range chunks without inflating count', () => {
    const asm = new ChunkAssembler(2);
    expect(asm.add(0, new Uint8Array([1]))).toBe(true);
    expect(asm.add(0, new Uint8Array([99]))).toBe(false); // duplicate
    expect(asm.add(5, new Uint8Array([1]))).toBe(false);  // out of range
    expect(asm.add(-1, new Uint8Array([1]))).toBe(false);
    expect(asm.receivedCount).toBe(1);
  });

  it('throws when assembling before complete and rejects bad totals', () => {
    expect(() => new ChunkAssembler(0)).toThrow();
    const asm = new ChunkAssembler(2);
    asm.add(0, new Uint8Array([1]));
    expect(() => asm.assemble()).toThrow();
  });

  it('reassembles to a hash matching the original file', async () => {
    const file = new Uint8Array(1000);
    for (let i = 0; i < file.length; i++) file[i] = (i * 7) & 0xff;
    const size = 64;
    const n = chunkCount(file.length, size);
    const asm = new ChunkAssembler(n);
    // feed in shuffled order
    for (const seq of [...Array(n).keys()].reverse()) {
      const { start, end } = chunkRange(seq, size, file.length);
      asm.add(seq, file.subarray(start, end));
    }
    expect(await sha256Hex(asm.assemble())).toBe(await sha256Hex(file));
  });
});
