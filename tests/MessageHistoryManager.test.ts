import { MessageHistoryManager, HistoryMessage } from '../src/main/storage/MessageHistoryManager';
import { CryptoManager } from '../src/main/crypto/CryptoManager';

function makeMessage(over: Partial<HistoryMessage> = {}): HistoryMessage {
  return {
    id: Math.random().toString(36).slice(2),
    sessionId: 'session-1',
    peerId: 'peer-A',
    direction: 'outgoing',
    content: 'hello',
    contentType: 'text',
    timestamp: Date.now(),
    status: 'sent',
    ...over
  };
}

describe('MessageHistoryManager', () => {
  let mgr: MessageHistoryManager;
  let crypto: CryptoManager;

  beforeEach(() => {
    crypto = new CryptoManager('crypto-test');
    mgr = new MessageHistoryManager('history-key', crypto);
  });

  afterEach(() => {
    mgr.destroy();
  });

  describe('CRUD', () => {
    it('saveMessage 插入新消息', () => {
      const m = makeMessage();
      mgr.saveMessage(m);
      expect(mgr.getMessages()).toHaveLength(1);
    });

    it('saveMessage 同 id 视为更新', () => {
      const m = makeMessage({ id: 'fixed-id', content: 'v1' });
      mgr.saveMessage(m);
      mgr.saveMessage({ ...m, content: 'v2' });

      const all = mgr.getMessages();
      expect(all).toHaveLength(1);
      expect(all[0].content).toBe('v2');
    });

    it('updateMessageStatus 改状态', () => {
      const m = makeMessage({ id: 'X', status: 'pending' });
      mgr.saveMessage(m);
      expect(mgr.updateMessageStatus('X', 'delivered')).toBe(true);
      expect(mgr.getMessages()[0].status).toBe('delivered');
    });

    it('updateMessageStatus 对不存在的 ID 返回 false', () => {
      expect(mgr.updateMessageStatus('nope', 'sent')).toBe(false);
    });

    it('deleteMessage 删除消息', () => {
      const m = makeMessage({ id: 'D' });
      mgr.saveMessage(m);
      expect(mgr.deleteMessage('D')).toBe(true);
      expect(mgr.getMessages()).toHaveLength(0);
    });

    it('clearSessionMessages 按 sessionId 清空', () => {
      mgr.saveMessage(makeMessage({ id: '1', sessionId: 'a' }));
      mgr.saveMessage(makeMessage({ id: '2', sessionId: 'b' }));
      mgr.saveMessage(makeMessage({ id: '3', sessionId: 'a' }));

      const removed = mgr.clearSessionMessages('a');
      expect(removed).toBe(2);
      expect(mgr.getMessages()).toHaveLength(1);
      expect(mgr.getMessages()[0].sessionId).toBe('b');
    });
  });

  describe('过滤与查询', () => {
    beforeEach(() => {
      mgr.saveMessage(makeMessage({ id: '1', timestamp: 100, sessionId: 's1', peerId: 'A' }));
      mgr.saveMessage(makeMessage({ id: '2', timestamp: 200, sessionId: 's2', peerId: 'B' }));
      mgr.saveMessage(makeMessage({ id: '3', timestamp: 300, sessionId: 's1', peerId: 'A' }));
    });

    it('按 sessionId 过滤', () => {
      const got = mgr.getMessages({ sessionId: 's1' });
      expect(got).toHaveLength(2);
    });

    it('按 peerId 过滤', () => {
      const got = mgr.getMessages({ peerId: 'B' });
      expect(got).toHaveLength(1);
    });

    it('按时间范围过滤', () => {
      const got = mgr.getMessages({ since: 150, until: 250 });
      expect(got).toHaveLength(1);
      expect(got[0].id).toBe('2');
    });

    it('limit 截取最近 N 条', () => {
      const got = mgr.getMessages({ limit: 2 });
      expect(got).toHaveLength(2);
      // 应按 timestamp 升序，limit 取末尾
      expect(got.map(m => m.id)).toEqual(['2', '3']);
    });

    it('searchMessages 按关键词', () => {
      mgr.saveMessage(makeMessage({ id: 'kw', content: '加密通信测试' }));
      const got = mgr.searchMessages('加密');
      expect(got).toHaveLength(1);
      expect(got[0].id).toBe('kw');
    });

    it('searchMessages 在指定 session 内', () => {
      mgr.saveMessage(makeMessage({ id: 'a', sessionId: 'X', content: 'hello' }));
      mgr.saveMessage(makeMessage({ id: 'b', sessionId: 'Y', content: 'hello' }));

      const got = mgr.searchMessages('hello', 'X');
      expect(got).toHaveLength(1);
      expect(got[0].sessionId).toBe('X');
    });
  });

  describe('过期裁剪', () => {
    it('setMessageExpiry 标记过期时间', () => {
      mgr.saveMessage(makeMessage({ id: 'E' }));
      expect(mgr.setMessageExpiry('E', 60_000)).toBe(true);
    });

    it('过期消息不再出现在 getMessages', () => {
      mgr.saveMessage(makeMessage({ id: 'E' }));
      mgr.setMessageExpiry('E', -1000); // 已经过期
      expect(mgr.getMessages()).toHaveLength(0);
    });

    it('未过期消息仍返回', () => {
      mgr.saveMessage(makeMessage({ id: 'E' }));
      mgr.setMessageExpiry('E', 60_000);
      expect(mgr.getMessages()).toHaveLength(1);
    });
  });

  describe('导出 + 统计', () => {
    beforeEach(() => {
      mgr.saveMessage(makeMessage({ id: '1', sessionId: 'a', status: 'sent' }));
      mgr.saveMessage(makeMessage({ id: '2', sessionId: 'a', status: 'failed' }));
      mgr.saveMessage(makeMessage({ id: '3', sessionId: 'b', status: 'delivered' }));
    });

    it('exportMessages JSON 格式', () => {
      const out = mgr.exportMessages(undefined, 'json');
      const parsed = JSON.parse(out);
      expect(parsed).toHaveLength(3);
    });

    it('exportMessages TXT 格式', () => {
      const out = mgr.exportMessages(undefined, 'txt');
      expect(out.split('\n')).toHaveLength(3);
    });

    it('exportMessages 按 session 过滤', () => {
      const out = mgr.exportMessages('a', 'json');
      expect(JSON.parse(out)).toHaveLength(2);
    });

    it('getStatistics 分类统计', () => {
      const stats = mgr.getStatistics();
      expect(stats.total).toBe(3);
      expect(stats.bySession).toEqual({ a: 2, b: 1 });
      expect(stats.byStatus.sent).toBe(1);
      expect(stats.byStatus.failed).toBe(1);
      expect(stats.byStatus.delivered).toBe(1);
    });
  });
});
