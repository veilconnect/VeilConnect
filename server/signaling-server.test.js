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
const SignalingServer = require('./signaling-server');

// 测试用 origin 必须在默认白名单内，否则 verifyClient 会 403
const ORIGIN = 'http://localhost:8080';
const VALID_TOKEN = 'super-secret-token-1234'; // >= 16 chars

let server;
let port;

/** 启动服务器并返回实际监听端口 */
function startServer() {
    return new Promise((resolve) => {
        const s = new SignalingServer(0); // 端口 0 = 由系统分配空闲端口
        s.server.listen(0, () => {
            resolve({ s, port: s.server.address().port });
        });
    });
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

beforeAll(async () => {
    const started = await startServer();
    server = started.s;
    port = started.port;
});

afterAll(async () => {
    if (server) server.stop();
    // 给 server.close 回调一点时间
    await new Promise((r) => setTimeout(r, 100));
});

describe('SignalingServer 安全加固', () => {
    let sockets = [];

    afterEach(async () => {
        await Promise.all(sockets.map(closeSocket));
        sockets = [];
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
});
