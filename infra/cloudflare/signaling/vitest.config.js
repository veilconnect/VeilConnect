import { defineConfig } from 'vitest/config';
import { cloudflareTest } from '@cloudflare/vitest-pool-workers';

// DO 单测在真实 workerd 运行时里跑（含 DO storage / WebSocketPair / crypto.subtle）。
// 注入固定的 ROOM_TOKEN_HASH_SECRET / IP_HASH_SECRET，使 token 摘要在「冷启动」前后可复现。
export default defineConfig({
  plugins: [
    cloudflareTest({
      wrangler: { configPath: './wrangler.toml' },
      miniflare: {
        bindings: {
          ROOM_TOKEN_HASH_SECRET: 'test-room-token-secret-fixed-0123456789',
          IP_HASH_SECRET: 'test-ip-hash-secret-fixed-0123456789',
        },
      },
    }),
  ],
});
