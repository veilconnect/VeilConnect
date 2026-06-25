import { reportPairingSuccess } from '../src/web/metrics';

/**
 * 匿名配对计数信标：必须是「无体、无自定义标识头」的 fire-and-forget，
 * 且任何网络错误都不得抛出（绝不影响聊天）。jest 下 __VC_BLOB_BASE__ 未注入 → 同源 '/metrics/pair'。
 */
describe('reportPairingSuccess（匿名信标）', () => {
  const realFetch = (global as { fetch?: unknown }).fetch;
  afterEach(() => { (global as { fetch?: unknown }).fetch = realFetch; });

  it('POST 到 /metrics/pair，无 body、无自定义头，且吞错不抛', () => {
    const calls: Array<[string, Record<string, unknown>]> = [];
    (global as { fetch?: unknown }).fetch = (url: string, opts: Record<string, unknown>) => {
      calls.push([url, opts]);
      return Promise.reject(new Error('network down')); // 模拟失败 → 必须被吞掉
    };
    expect(() => reportPairingSuccess()).not.toThrow();
    expect(calls).toHaveLength(1);
    expect(calls[0][0]).toMatch(/\/metrics\/pair$/);
    expect(calls[0][1].method).toBe('POST');
    expect(calls[0][1].body).toBeUndefined();        // 无体 = 简单请求,免 CORS 预检
    expect(calls[0][1].headers).toBeUndefined();     // 无自定义标识头
  });

  it('fetch 本身抛同步异常也不抛出', () => {
    (global as { fetch?: unknown }).fetch = () => { throw new Error('boom'); };
    expect(() => reportPairingSuccess()).not.toThrow();
  });
});
