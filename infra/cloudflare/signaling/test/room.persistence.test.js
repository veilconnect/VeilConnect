// SignalingRoom 房间持久化的【确定性】单测：覆盖 server/signaling-server 上已验证的「重启恢复」
// 在 Durable Object 侧的对应路径——saveRoomMeta 落 DO storage，全新实例 loadRoomMeta 冷加载恢复锁。
//
// 关键点：loadRoomMeta() 有一次性门闩(loadedRoomMeta)，每个 DO 实例只读一次 storage。
// 要真正走到「从 storage 冷加载」，必须有一个【在 meta 落盘之后才新建】的实例——线上只有 DO 被驱逐后
// 才会发生且无法按需触发。这里用 `new SignalingRoom(state, env)` 复用同一 state，确定性地模拟驱逐后冷启动。
import { env, runInDurableObject } from 'cloudflare:test';
import { describe, it, expect } from 'vitest';
import { SignalingRoom } from '../src/worker.js';

const TOKEN = 'persist-secret-token-123456'; // >= 16 字符

function stubFor(name) {
  const id = env.SIGNALING_ROOM.idFromName(name);
  return env.SIGNALING_ROOM.get(id);
}

describe('SignalingRoom 持久化房间冷加载', () => {
  it('持久化房间空置后落盘；全新实例 loadRoomMeta 恢复 token 锁与配置', async () => {
    const stub = stubFor('persist-room-cold');
    await runInDurableObject(stub, async (instance, state) => {
      // 模拟房主创建持久化房间后离开：设字段 → maybeReset（occupants=0 且 persistent → 落盘并保留锁）
      instance.tokenHash = await instance.hashToken(TOKEN);
      instance.roomId = 'persist-room-cold';
      instance.maxClients = 3;
      instance.persistent = true;
      await instance.maybeReset();

      // 1) 落盘内容正确，且不含任何身份/IP
      const meta = await state.storage.get('room_meta');
      expect(meta).toMatchObject({ version: 1, persistent: true, roomId: 'persist-room-cold', maxClients: 3 });
      expect(meta.tokenHash).toMatch(/^[a-f0-9]{64}$/);
      expect(JSON.stringify(meta)).not.toContain('client_');

      // 持久化房间空置后【不】复位内存锁（入口保留）
      expect(instance.tokenHash).not.toBeNull();

      // 2) 全新实例（模拟驱逐后冷启动）——复用同一 state/storage
      const revived = new SignalingRoom(state, env);
      expect(revived.tokenHash).toBeNull();      // 加载前：空
      expect(revived.loadedRoomMeta).toBe(false);

      await revived.loadRoomMeta();

      // 3) 锁与配置从 storage 恢复
      expect(revived.persistent).toBe(true);
      expect(revived.roomId).toBe('persist-room-cold');
      expect(revived.maxClients).toBe(3);
      expect(revived.tokenHash).toMatch(/^[a-f0-9]{64}$/);

      // 4) 原 token 仍匹配、错误 token 不匹配（锁跨冷启动存活）
      expect(revived.tokenHash).toBe(await revived.hashToken(TOKEN));
      expect(revived.tokenHash).not.toBe(await revived.hashToken('totally-wrong-token-xyz'));
    });
  });

  it('一次性房间空置后不落盘，且内存锁复位；冷启动无可恢复', async () => {
    const stub = stubFor('ephemeral-room-cold');
    await runInDurableObject(stub, async (instance, state) => {
      instance.tokenHash = await instance.hashToken(TOKEN);
      instance.roomId = 'ephemeral-room-cold';
      instance.maxClients = 2;
      instance.persistent = false; // 一次性
      await instance.maybeReset();

      expect(await state.storage.get('room_meta')).toBeUndefined(); // 未落盘
      expect(instance.tokenHash).toBeNull(); // 内存锁复位
      expect(instance.roomId).toBeNull();

      const revived = new SignalingRoom(state, env);
      await revived.loadRoomMeta();
      expect(revived.persistent).toBe(false); // 无 meta 可恢复
      expect(revived.tokenHash).toBeNull();
    });
  });

  it('真实 WS 路径：持久化 join 立即落盘且 room_joined 标记 persistent=true', async () => {
    const stub = stubFor('persist-ws-room');
    const res = await stub.fetch('https://do/?room=persist-ws-room', {
      headers: { Upgrade: 'websocket' },
    });
    const ws = res.webSocket;
    expect(ws).toBeTruthy();
    ws.accept();

    const inbox = [];
    ws.addEventListener('message', (e) => { try { inbox.push(JSON.parse(e.data)); } catch {} });
    const waitFor = async (pred, ms = 3000) => {
      const start = Date.now();
      while (Date.now() - start < ms) {
        const f = inbox.find(pred);
        if (f) return f;
        await new Promise((r) => setTimeout(r, 15));
      }
      throw new Error('timeout waiting for message');
    };

    await waitFor((m) => m.type === 'welcome');
    ws.send(JSON.stringify({ type: 'join_room', roomId: 'persist-ws-room', token: TOKEN, persistent: true, maxClients: 2 }));
    const joined = await waitFor((m) => m.type === 'room_joined');
    expect(joined.persistent).toBe(true);
    expect(joined.clientCount).toBe(1);

    // 持久化 join 即时落盘（无需等离开）
    await runInDurableObject(stub, async (_instance, state) => {
      const meta = await state.storage.get('room_meta');
      expect(meta?.persistent).toBe(true);
      expect(meta?.roomId).toBe('persist-ws-room');
      expect(meta?.tokenHash).toMatch(/^[a-f0-9]{64}$/);
    });
    ws.close();
  });
});
