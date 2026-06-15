import { PresenceManager } from '../src/main/presence/PresenceManager';

describe('PresenceManager', () => {
  let mgr: PresenceManager;

  beforeEach(() => {
    mgr = new PresenceManager({ interval: 60_000, timeout: 60_000 });
  });

  afterEach(() => {
    mgr.destroy();
  });

  it('构造时本地状态默认为 online', () => {
    expect(mgr.getLocalStatus().status).toBe('online');
  });

  it('setLocalStatus 触发 presenceChange 事件', () => {
    const seen: any[] = [];
    mgr.on('presenceChange', (p) => seen.push(p));

    mgr.setLocalStatus('busy', 'in a meeting');

    expect(seen).toHaveLength(1);
    expect(seen[0].status).toBe('busy');
    expect(seen[0].customStatus).toBe('in a meeting');
  });

  it('updatePresence 写入并触发事件', () => {
    const events: any[] = [];
    mgr.on('presenceChange', (p) => events.push(p));

    mgr.updatePresence('user-1', 'online');
    expect(mgr.getPresence('user-1')?.status).toBe('online');
    expect(events).toHaveLength(1);
  });

  it('getOnlineUsers 不包含本地用户', () => {
    mgr.updatePresence('peer-a', 'online');
    mgr.updatePresence('peer-b', 'away');

    const online = mgr.getOnlineUsers();
    expect(online).toHaveLength(1);
    expect(online[0].userId).toBe('peer-a');
  });

  it('getBatchPresence 仅返回存在的用户', () => {
    mgr.updatePresence('peer-a', 'online');
    mgr.updatePresence('peer-b', 'offline');

    const batch = mgr.getBatchPresence(['peer-a', 'peer-c']);
    expect(batch.size).toBe(1);
    expect(batch.get('peer-a')?.status).toBe('online');
  });

  it('removePresence 删除节点并触发事件', () => {
    const removed: any[] = [];
    mgr.on('presenceRemoved', (id) => removed.push(id));

    mgr.updatePresence('peer-x', 'online');
    mgr.removePresence('peer-x');

    expect(mgr.getPresence('peer-x')).toBeNull();
    expect(removed).toEqual(['peer-x']);
  });

  it('removePresence 对本地用户无效', () => {
    mgr.removePresence('__local__');
    expect(mgr.getLocalStatus()).toBeTruthy();
  });

  it('getStatistics 排除本地用户', () => {
    mgr.updatePresence('a', 'online');
    mgr.updatePresence('b', 'online');
    mgr.updatePresence('c', 'away');

    const stats = mgr.getStatistics();
    expect(stats.total).toBe(3);
    expect(stats.online).toBe(2);
    expect(stats.away).toBe(1);
  });

  it('updateConfig 重启 sweep 定时器，不抛错', () => {
    expect(() => mgr.updateConfig({ interval: 30_000 })).not.toThrow();
    expect(mgr.getConfig().interval).toBe(30_000);
  });

  describe('心跳超时', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });
    afterEach(() => {
      jest.useRealTimers();
    });

    it('超过 timeout 且未刷新的节点被标记为 offline', () => {
      const m = new PresenceManager({ interval: 1000, timeout: 5000 });
      m.updatePresence('stale', 'online');
      expect(m.getPresence('stale')?.status).toBe('online');

      // 推进时间超过 timeout
      jest.advanceTimersByTime(6000);
      // 触发一次 sweep
      jest.advanceTimersByTime(1000);

      expect(m.getPresence('stale')?.status).toBe('offline');
      m.destroy();
    });
  });
});
