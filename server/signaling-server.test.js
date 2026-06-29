/**
 * VeilConnect 信令服务器 — 安全加固测试
 *
 * 运行方式（根目录 jest 配置的 roots/testMatch 不会自动包含本文件，
 * 故需显式覆盖 roots/testMatch）:
 *
 *   npx jest server/signaling-server.test.js \
 *     --roots ./server --testMatch "**\/*.test.js"
 *
 * 依赖：server/node_modules 下的 ws 已安装。
 */

const WebSocket = require('ws');
const fs = require('fs');
const os = require('os');
const path = require('path');
const SignalingServer = require('./signaling-server');

// 测试用 origin 必须在默认白名单内，否则 verifyClient 会 403
const ORIGIN = 'http://localhost:8080';
const VALID_TOKEN = 'super-secret-token-1234'; // >= 16 chars
const METRICS_TOKEN = 'test-metrics-token-1234';
const IP_HASH_SECRET = 'test-ip-hash-secret-1234';

let server;
let port;
let savedMetricsReadToken;
let savedIpHashSecret;
let savedPersistentRoomStore;
let persistentRoomStoreDir;

/** 启动服务器并返回实际监听端口 */
function startServer() {
    return new Promise((resolve) => {
        savedMetricsReadToken = process.env.METRICS_READ_TOKEN;
        savedIpHashSecret = process.env.SIGNAL_IP_HASH_SECRET;
        savedPersistentRoomStore = process.env.PERSISTENT_ROOM_STORE;
        persistentRoomStoreDir = fs.mkdtempSync(path.join(os.tmpdir(), 'veilconnect-rooms-'));
        process.env.METRICS_READ_TOKEN = METRICS_TOKEN;
        process.env.SIGNAL_IP_HASH_SECRET = IP_HASH_SECRET;
        process.env.PERSISTENT_ROOM_STORE = path.join(persistentRoomStoreDir, 'rooms.json');
        const s = new SignalingServer(0); // 端口 0 = 由系统分配空闲端口
        s.server.listen(0, () => {
            resolve({ s, port: s.server.address().port });
        });
    });
}

function restoreEnv(name, value) {
    if (value === undefined) delete process.env[name];
    else process.env[name] = value;
}

function metricsHeaders(token = METRICS_TOKEN) {
    return { origin: ORIGIN, authorization: `Bearer ${token}` };
}

/**
 * 建立一个 ws 连接并等待 open，返回 socket。
 * 立即附加消息缓冲，避免 nextMessage 监听器附加前到达的消息（如 welcome）丢失。
 */
function connect() {
    return new Promise((resolve, reject) => {
        const ws = new WebSocket(`ws://127.0.0.1:${port}`, {
            headers: { origin: ORIGIN }
        });
        ws._inbox = [];        // 已收到但未被消费的消息队列
        ws._waiters = [];      // 等待中的 { predicate, resolve }
        ws.on('message', (raw) => {
            let msg;
            try { msg = JSON.parse(raw.toString()); } catch { return; }
            const idx = ws._waiters.findIndex((w) => w.predicate(msg));
            if (idx !== -1) {
                const [w] = ws._waiters.splice(idx, 1);
                clearTimeout(w.timer);
                w.resolve(msg);
            } else {
                ws._inbox.push(msg);
            }
        });
        ws.on('open', () => resolve(ws));
        ws.on('error', reject);
    });
}

/** 等待该 socket 上下一条满足 predicate 的消息（先查缓冲队列） */
function nextMessage(ws, predicate = () => true, timeout = 4000) {
    return new Promise((resolve, reject) => {
        const idx = ws._inbox.findIndex((m) => predicate(m));
        if (idx !== -1) {
            const [m] = ws._inbox.splice(idx, 1);
            return resolve(m);
        }
        const waiter = { predicate, resolve };
        waiter.timer = setTimeout(() => {
            const i = ws._waiters.indexOf(waiter);
            if (i !== -1) ws._waiters.splice(i, 1);
            reject(new Error('timeout waiting for message'));
        }, timeout);
        ws._waiters.push(waiter);
    });
}

function closeSocket(ws) {
    return new Promise((resolve) => {
        if (!ws || ws.readyState === WebSocket.CLOSED) return resolve();
        ws.on('close', () => resolve());
        try { ws.close(); } catch { resolve(); }
    });
}

function waitFor(predicate, timeout = 1500) {
    return new Promise((resolve, reject) => {
        const started = Date.now();
        const tick = () => {
            if (predicate()) return resolve();
            if (Date.now() - started > timeout) return reject(new Error('timeout waiting for condition'));
            setTimeout(tick, 25);
        };
        tick();
    });
}

beforeAll(async () => {
    const started = await startServer();
    server = started.s;
    port = started.port;
});

afterAll(async () => {
    if (server) server.stop();
    restoreEnv('METRICS_READ_TOKEN', savedMetricsReadToken);
    restoreEnv('SIGNAL_IP_HASH_SECRET', savedIpHashSecret);
    restoreEnv('PERSISTENT_ROOM_STORE', savedPersistentRoomStore);
    if (persistentRoomStoreDir) fs.rmSync(persistentRoomStoreDir, { recursive: true, force: true });
    // 给 server.close 回调一点时间
    await new Promise((r) => setTimeout(r, 100));
});

describe('SignalingServer 安全加固', () => {
    let sockets = [];

    afterEach(async () => {
        await Promise.all(sockets.map(closeSocket));
        sockets = [];
        server.rateBuckets.clear();
        server.failedJoinBuckets.clear();
        server.rooms.clear();
    });

    test('两个相同 token 的客户端可加入同房并互相中继 signal', async () => {
        const roomId = 'roomAlpha';
        const a = await connect();
        const b = await connect();
        sockets.push(a, b);

        // 丢弃 welcome 消息后发送 join
        await nextMessage(a, (m) => m.type === 'welcome');
        await nextMessage(b, (m) => m.type === 'welcome');

        a.send(JSON.stringify({ type: 'join_room', roomId, token: VALID_TOKEN }));
        const aJoined = await nextMessage(a, (m) => m.type === 'room_joined');
        expect(aJoined.roomId).toBe(roomId);

        b.send(JSON.stringify({ type: 'join_room', roomId, token: VALID_TOKEN }));
        const bJoined = await nextMessage(b, (m) => m.type === 'room_joined');
        expect(bJoined.clientCount).toBe(2);

        // a 发 signal，b 应收到
        const bGetsSignal = nextMessage(b, (m) => m.type === 'signal');
        a.send(JSON.stringify({ type: 'signal', data: { type: 'offer', sdp: 'x' } }));
        const relayed = await bGetsSignal;
        expect(relayed.data).toEqual({ type: 'offer', sdp: 'x' });
    });

    test('一次性房间无人后删除，持久化房间无人后保留入口', async () => {
        const ephemeralRoom = 'roomEphemeral';
        const a = await connect();
        sockets.push(a);
        await nextMessage(a, (m) => m.type === 'welcome');
        a.send(JSON.stringify({ type: 'join_room', roomId: ephemeralRoom, token: VALID_TOKEN }));
        await nextMessage(a, (m) => m.type === 'room_joined');
        expect(server.rooms.has(ephemeralRoom)).toBe(true);

        await closeSocket(a);
        await waitFor(() => !server.rooms.has(ephemeralRoom));

        const persistentRoom = 'roomPersistent';
        const b = await connect();
        sockets.push(b);
        await nextMessage(b, (m) => m.type === 'welcome');
        b.send(JSON.stringify({ type: 'join_room', roomId: persistentRoom, token: VALID_TOKEN, persistent: true, maxClients: 2 }));
        const bJoined = await nextMessage(b, (m) => m.type === 'room_joined');
        expect(bJoined.clientCount).toBe(1);
        expect(server.rooms.get(persistentRoom).persistent).toBe(true);

        await closeSocket(b);
        await waitFor(() => server.rooms.has(persistentRoom) && server.rooms.get(persistentRoom).clients.size === 0);
        expect(server.rooms.get(persistentRoom).tokenHash).toMatch(/^[a-f0-9]{64}$/);

        const saved = JSON.parse(fs.readFileSync(process.env.PERSISTENT_ROOM_STORE, 'utf8'));
        expect(saved.rooms[persistentRoom]).toMatchObject({ persistent: true, maxClients: 2 });
        expect(JSON.stringify(saved)).not.toContain('client_');
        expect(JSON.stringify(saved)).not.toContain('127.0.0.1');

        const c = await connect();
        sockets.push(c);
        await nextMessage(c, (m) => m.type === 'welcome');
        c.send(JSON.stringify({ type: 'join_room', roomId: persistentRoom, token: VALID_TOKEN }));
        const cJoined = await nextMessage(c, (m) => m.type === 'room_joined');
        expect(cJoined.clientCount).toBe(1);

        const d = await connect();
        sockets.push(d);
        await nextMessage(d, (m) => m.type === 'welcome');
        d.send(JSON.stringify({ type: 'join_room', roomId: persistentRoom, token: 'wrong-token-abcdef' }));
        const err = await nextMessage(d, (m) => m.type === 'error');
        expect(err.error).toBe('Invalid room token');
    });

    test('错误 token 的第二个客户端被拒绝（Invalid room token）', async () => {
        const roomId = 'roomBeta';
        const a = await connect();
        const b = await connect();
        sockets.push(a, b);

        await nextMessage(a, (m) => m.type === 'welcome');
        await nextMessage(b, (m) => m.type === 'welcome');

        a.send(JSON.stringify({ type: 'join_room', roomId, token: VALID_TOKEN }));
        await nextMessage(a, (m) => m.type === 'room_joined');

        b.send(JSON.stringify({ type: 'join_room', roomId, token: 'wrong-token-abcdef' }));
        const err = await nextMessage(b, (m) => m.type === 'error');
        expect(err.error).toBe('Invalid room token');
    });

    test('短于 16 字符的 token 被拒绝', async () => {
        const a = await connect();
        sockets.push(a);
        await nextMessage(a, (m) => m.type === 'welcome');

        a.send(JSON.stringify({ type: 'join_room', roomId: 'roomGamma', token: 'short123' }));
        const err = await nextMessage(a, (m) => m.type === 'error');
        expect(err.error).toMatch(/16-128 chars/);
    });

    test('未配置 TURN 时 /turn-credentials 返回 200 + configured:false + 空 iceServers（不报 503，避免浏览器控制台噪音）', async () => {
        const savedSecret = process.env.TURN_SECRET;
        const savedHost = process.env.TURN_HOST;
        delete process.env.TURN_SECRET;
        delete process.env.TURN_HOST;
        try {
            const resp = await fetch(`http://localhost:${port}/turn-credentials`, {
                headers: { origin: ORIGIN }
            });
            expect(resp.status).toBe(200);
            const data = await resp.json();
            expect(data.configured).toBe(false);
            expect(data.iceServers).toEqual([]);
        } finally {
            if (savedSecret !== undefined) process.env.TURN_SECRET = savedSecret;
            if (savedHost !== undefined) process.env.TURN_HOST = savedHost;
        }
    });

    test('匿名配对计数：POST /metrics/pair 自增，GET /metrics 需管理令牌且不记任何标识', async () => {
        const denied = await fetch(`http://localhost:${port}/metrics`, { headers: { origin: ORIGIN } });
        expect(denied.status).toBe(404);

        const before = await (await fetch(`http://localhost:${port}/metrics`, { headers: metricsHeaders() })).json();
        const r = await fetch(`http://localhost:${port}/metrics/pair`, { method: 'POST', headers: { origin: ORIGIN } });
        const body = await r.json();
        expect(body.ok).toBe(true);
        const after = await (await fetch(`http://localhost:${port}/metrics`, { headers: metricsHeaders() })).json();
        expect(after.total).toBe((before.total || 0) + 1);
        // 仅聚合字段，无任何逐事件/IP/房间记录
        expect(Object.keys(after).sort()).toEqual(['days', 'total']);
        const day = new Date().toISOString().slice(0, 10);
        expect(after.days[day]).toBeGreaterThanOrEqual(1);
    });

    test('连接状态只保留 IP 指纹，不保留明文 IP / User-Agent / 加入时间', async () => {
        const a = await connect();
        sockets.push(a);
        const welcome = await nextMessage(a, (m) => m.type === 'welcome');
        const clientInfo = [...server.clients.values()].find((c) => c.id === welcome.clientId);

        expect(clientInfo).toBeTruthy();
        expect(clientInfo.ip).toBeUndefined();
        expect(clientInfo.userAgent).toBeUndefined();
        expect(clientInfo.joinedAt).toBeUndefined();
        expect(clientInfo.ipFingerprint).toMatch(/^[a-f0-9]{64}$/);
        expect(clientInfo.ipFingerprint).not.toContain('127.0.0.1');
    });

    test('CSP connect-src 收敛：含 self/wss/ws，但不含宽松的裸 https:（防注入脚本外传明文）', async () => {
        const resp = await fetch(`http://localhost:${port}/health`, { headers: { origin: ORIGIN } });
        const csp = resp.headers.get('content-security-policy') || '';
        const connectSrc = (csp.match(/connect-src ([^;]*)/) || [, ''])[1].trim();
        expect(connectSrc).toContain("'self'");
        expect(connectSrc).toContain('wss:');
        expect(connectSrc).toContain('ws:');
        // 裸 https:（scheme-only）会放行向任意 HTTPS 主机外传 → 必须不在白名单内
        expect(connectSrc.split(/\s+/)).not.toContain('https:');
    });

    describe('clientIp（反代后真实 IP 解析）', () => {
        const fakeReq = (xff, socketIp = '10.0.0.5') => ({
            headers: xff === undefined ? {} : { 'x-forwarded-for': xff },
            socket: { remoteAddress: socketIp }
        });
        let saved;
        beforeEach(() => { saved = server.trustProxyHops; });
        afterEach(() => { server.trustProxyHops = saved; });

        test('trustProxyHops=0：忽略 XFF，用 socket 源地址（防伪造）', () => {
            server.trustProxyHops = 0;
            expect(server.clientIp(fakeReq('1.2.3.4', '10.0.0.5'))).toBe('10.0.0.5');
        });

        test('trustProxyHops=1：取 XFF 倒数第 1 段（代理亲自追加的真实客户端）', () => {
            server.trustProxyHops = 1;
            // 客户端伪造了 1.2.3.4，Caddy 追加真实对端 203.0.113.9 → 取最右
            expect(server.clientIp(fakeReq('1.2.3.4, 203.0.113.9'))).toBe('203.0.113.9');
        });

        test('trustProxyHops=1 但无 XFF：回退 socket 源地址', () => {
            server.trustProxyHops = 1;
            expect(server.clientIp(fakeReq(undefined, '198.51.100.7'))).toBe('198.51.100.7');
        });

        test('trustProxyHops=2：取倒数第 2 段（两层可信代理）', () => {
            server.trustProxyHops = 2;
            expect(server.clientIp(fakeReq('1.1.1.1, 203.0.113.9, 172.16.0.1'))).toBe('203.0.113.9');
        });
    });

    test('clientFingerprint 对同一 IP 稳定，且不会暴露原始地址', () => {
        const req = { headers: {}, socket: { remoteAddress: '198.51.100.77' } };
        const a = server.clientFingerprint(req);
        const b = server.clientFingerprint(req);
        expect(a).toBe(b);
        expect(a).toMatch(/^[a-f0-9]{64}$/);
        expect(a).not.toContain('198.51.100.77');
    });

    test('同一连接/IP 多次失败 join 后被限速', async () => {
        const a = await connect();
        sockets.push(a);
        await nextMessage(a, (m) => m.type === 'welcome');

        // MAX_FAILED_JOINS_PER_IP_PER_MIN = 10：先制造 10 次失败（短 token）
        for (let i = 0; i < 10; i++) {
            a.send(JSON.stringify({ type: 'join_room', roomId: 'roomThrottle', token: 'short' }));
            await nextMessage(a, (m) => m.type === 'error');
        }

        // 第 11 次（即便给出合法 token）也应被限速拦截
        a.send(JSON.stringify({ type: 'join_room', roomId: 'roomThrottle', token: VALID_TOKEN }));
        const err = await nextMessage(a, (m) => m.type === 'error');
        expect(err.error).toMatch(/Too many failed join attempts/);
    });

    test('过期的连接限速和失败 join 限速 bucket 会被清理', () => {
        const now = Date.now();
        server.rateBuckets.set('198.51.100.10', { count: 30, windowStart: now - 61_000 });
        server.rateBuckets.set('198.51.100.11', { count: 1, windowStart: now });
        server.failedJoinBuckets.set('198.51.100.20', { count: 10, windowStart: now - 61_000 });
        server.failedJoinBuckets.set('198.51.100.21', { count: 1, windowStart: now });

        server.sweepRateLimitBuckets(now);

        expect(server.rateBuckets.has('198.51.100.10')).toBe(false);
        expect(server.rateBuckets.has('198.51.100.11')).toBe(true);
        expect(server.failedJoinBuckets.has('198.51.100.20')).toBe(false);
        expect(server.failedJoinBuckets.has('198.51.100.21')).toBe(true);
    });
});
