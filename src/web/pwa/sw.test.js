/**
 * Service Worker 逻辑的确定性单测（不依赖浏览器）。
 * 把 sw.js 放进受控沙箱，注入假的 self/caches/fetch/Response，断言关键行为：
 *   1) 跨源请求（信令 wss / TURN / blob 都在 signal.veilconnect.org）一律放行、绝不缓存。
 *   2) 同源已缓存资源：stale-while-revalidate 立刻返回缓存。
 *   3) 离线 + 导航未命中：回退到缓存的应用外壳。
 *   4) 非 GET 不拦截。
 * 以 node --test 运行：node --test src/web/pwa/sw.test.js
 */
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

const SW_SRC = fs.readFileSync(path.join(__dirname, 'sw.js'), 'utf8');
const ORIGIN = 'https://veilconnect.org';

function makeEnv({ online = true } = {}) {
  const store = new Map();
  class FakeResponse {
    constructor(body, init = {}) { this.body = body; this.status = init.status ?? 200; this.ok = this.status >= 200 && this.status < 300; this.type = init.type ?? 'basic'; }
    clone() { return new FakeResponse(this.body, { status: this.status, type: this.type }); }
  }
  const cache = {
    async match(req) { return store.get(typeof req === 'string' ? req : req.url) || undefined; },
    async put(req, res) { store.set(typeof req === 'string' ? req : req.url, res); },
    async add(u) { store.set(u, new FakeResponse('precached:' + u, { status: 200, type: 'basic' })); },
    async addAll(list) { for (const u of list) await this.add(u); },
    async keys() { return [...store.keys()]; },
  };
  const caches = {
    async open() { return cache; },
    async keys() { return ['vc-shell-v1']; },
    async delete() { return true; },
    async match(req) { return cache.match(req); },
  };
  const listeners = {};
  const self = {
    addEventListener: (t, fn) => { listeners[t] = fn; },
    skipWaiting() {}, clients: { claim() {} },
    location: { origin: ORIGIN, protocol: 'https:' },
  };
  const fetchMock = async () => {
    if (!online) throw new Error('offline');
    return new FakeResponse('network', { status: 200, type: 'basic' });
  };
  const sandbox = { self, caches, fetch: fetchMock, Response: FakeResponse, URL, Promise, console };
  // eslint-disable-next-line no-new-func
  new Function(...Object.keys(sandbox), SW_SRC)(...Object.values(sandbox));
  return { listeners, store, cache, FakeResponse };
}

function fireFetch(listeners, request) {
  let captured;
  const event = { request, respondWith: (p) => { captured = p; } };
  listeners.fetch(event);
  return captured; // undefined = SW 未接管（放行给浏览器）
}

test('跨源请求（信令/TURN/blob）放行且不缓存', async () => {
  const { listeners, store } = makeEnv();
  for (const url of [
    'https://signal.veilconnect.org/?room=abc',          // wss 信令同主机
    'https://signal.veilconnect.org/turn-credentials',    // TURN 凭据
    'https://signal.veilconnect.org/blob/deadbeef',       // 密文 blob
  ]) {
    const captured = fireFetch(listeners, { url, method: 'GET', mode: 'cors' });
    assert.strictEqual(captured, undefined, `应放行: ${url}`);
  }
  assert.strictEqual(store.size, 0, '跨源响应绝不写入缓存');
});

test('非 GET 不拦截', () => {
  const { listeners } = makeEnv();
  const captured = fireFetch(listeners, { url: ORIGIN + '/', method: 'POST', mode: 'navigate' });
  assert.strictEqual(captured, undefined);
});

test('同源已缓存资源：立刻返回缓存（SWR）', async () => {
  const { listeners, cache } = makeEnv({ online: true });
  await cache.put(ORIGIN + '/main.abc.js', new (makeEnv().FakeResponse)('cached-asset', { status: 200, type: 'basic' }));
  const res = await fireFetch(listeners, { url: ORIGIN + '/main.abc.js', method: 'GET', mode: 'no-cors' });
  assert.strictEqual(res.body, 'cached-asset');
});

test('离线 + 导航未命中：回退到缓存外壳 /index.html', async () => {
  const { listeners, cache } = makeEnv({ online: false });
  await cache.add('/index.html'); // 模拟此前已安装/缓存外壳
  const res = await fireFetch(listeners, { url: ORIGIN + '/some/deep/route', method: 'GET', mode: 'navigate' });
  assert.strictEqual(res.body, 'precached:/index.html');
});

test('在线未命中：取网络并缓存', async () => {
  const { listeners, store } = makeEnv({ online: true });
  const res = await fireFetch(listeners, { url: ORIGIN + '/new.js', method: 'GET', mode: 'no-cors' });
  assert.strictEqual(res.body, 'network');
  assert.ok(store.has(ORIGIN + '/new.js'), '在线取回的同源资源应写入缓存');
});
