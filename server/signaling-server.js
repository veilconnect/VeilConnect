/**
 * VeilConnect 信令服务器
 * 支持WebRTC P2P连接建立的信令中继
 * 版本: 1.0.0
 * 作者: VeilConnect Team
 */

const express = require('express');
const http = require('http');
const https = require('https');
const fs = require('fs');
const WebSocket = require('ws');
const path = require('path');
const cors = require('cors');

const DEFAULT_ALLOWED_ORIGINS = ['http://localhost:8080', 'http://127.0.0.1:8080', 'file://'];
const MAX_WS_PAYLOAD = 64 * 1024;          // 64 KB
const MAX_ROOM_CLIENTS = 4;
const CONNECTIONS_PER_IP_PER_MIN = 30;
const MAX_FAILED_JOINS_PER_IP_PER_MIN = 10;   // 防止暴力枚举房间 token
const RATE_LIMIT_WINDOW_MS = 60_000;
const HEARTBEAT_TIMEOUT_MS = 90_000;

class SignalingServer {
    constructor(port = 3001) {
        this.port = port;
        this.app = express();

        // 可选 HTTPS：设 TLS_CERT + TLS_KEY（PEM 路径）即以 https 起服务，wss 自动随之启用。
        // 内网/WG 测试必须走 HTTPS——浏览器 crypto.subtle 仅在安全上下文（HTTPS 或 localhost）可用，
        // 经 http://<内网IP> 访问会导致全部加密能力不可用。未设则回退 http（仅 localhost 开发用）。
        const tlsCert = process.env.TLS_CERT;
        const tlsKey = process.env.TLS_KEY;
        if (tlsCert && tlsKey) {
            this.server = https.createServer({
                cert: fs.readFileSync(tlsCert),
                key: fs.readFileSync(tlsKey)
            }, this.app);
            this.protocol = 'https';
        } else {
            this.server = http.createServer(this.app);
            this.protocol = 'http';
        }
        this.wss = new WebSocket.Server({
            server: this.server,
            maxPayload: MAX_WS_PAYLOAD,
            verifyClient: (info, cb) => this.verifyClient(info, cb)
        });

        this.rooms = new Map();        // roomId -> { clients:Set, tokenHash:string }
        this.clients = new Map();      // websocket -> clientInfo
        this.rateBuckets = new Map();  // ip -> { count, windowStart }
        this.failedJoinBuckets = new Map(); // ip -> { count, windowStart } 失败 join 限速

        this.allowedOrigins = (process.env.ALLOWED_ORIGINS
            ? process.env.ALLOWED_ORIGINS.split(',').map(s => s.trim()).filter(Boolean)
            : DEFAULT_ALLOWED_ORIGINS);

        // 反向代理跳数：默认 0（直接暴露，按 socket 源地址识别 IP，不可伪造）。
        // 部署在 Caddy/Nginx 等反代之后必须设为代理跳数（单层 Caddy = 1），
        // 否则所有用户在服务端都呈现为代理容器的同一个 IP，导致按 IP 的限流/防爆破全部退化为全局阈值。
        // 取 X-Forwarded-For 的「倒数第 trustProxyHops 段」：每经过一层可信代理都会向 XFF 追加它直连的对端地址，
        // 故倒数第 1 段是 Caddy 亲自写入的真实客户端地址，无法被客户端伪造（客户端伪造的内容只会出现在更靠左的位置）。
        this.trustProxyHops = parseInt(process.env.TRUST_PROXY || '0', 10) || 0;

        // 隐私默认：默认【不】记录任何含元数据（客户端 IP / clientId / roomId / 消息类型）的日志，
        // 以免信令服务器变成「谁在何时与谁连接」的旁路元数据库。运维排障可设 SIGNAL_VERBOSE=1 开启。
        this.verbose = process.env.SIGNAL_VERBOSE === '1';

        // —— 异步文件 blob 暂存（网盘式:链接即密钥;服务器只存【密文】,无密钥解不开)——
        // 默认开启;BLOB_STORE=off 关闭(回到"服务器零存储")。BLOB_DIR 默认 server/blobs;
        // 单文件上限 BLOB_MAX_MB(默认50);TTL BLOB_TTL_H(默认24h,过期自动删)。
        this.blobEnabled = process.env.BLOB_STORE !== 'off';
        this.blobDir = process.env.BLOB_DIR || path.join(__dirname, 'blobs');
        this.blobMaxBytes = (parseInt(process.env.BLOB_MAX_MB || '50', 10) || 50) * 1024 * 1024;
        this.blobTtlMs = (parseInt(process.env.BLOB_TTL_H || '24', 10) || 24) * 3600 * 1000;
        this.blobs = new Map(); // id -> { size, expiresAt }
        if (this.blobEnabled) this.initBlobStore();

        this.setupMiddleware();
        this.setupRoutes();
        this.setupWebSocket();
        this.startHeartbeatSweeper();

        console.log('🚀 VeilConnect 信令服务器初始化完成');
        console.log(`🔐 Allowed origins: ${this.allowedOrigins.join(', ')}`);
        console.log(`🔀 Trust proxy hops: ${this.trustProxyHops}${this.trustProxyHops === 0 ? ' (直接暴露；若在反代后请设 TRUST_PROXY=代理跳数)' : ''}`);
        console.log(`🕵️  Verbose metadata logging: ${this.verbose ? 'ON (含 IP/clientId，排障用)' : 'OFF (隐私默认，不记录元数据)'}`);
    }

    /** 仅在 SIGNAL_VERBOSE=1 时输出含元数据的日志（IP / clientId / roomId / 消息类型）。 */
    vlog(...args) {
        if (this.verbose) console.log(...args);
    }

    /** 初始化 blob 存储:建目录 + 扫描已有文件重建过期表(以 mtime+TTL 估算)。 */
    initBlobStore() {
        try {
            fs.mkdirSync(this.blobDir, { recursive: true });
            for (const f of fs.readdirSync(this.blobDir)) {
                if (!/^[a-f0-9]{32}$/.test(f)) continue;
                const st = fs.statSync(path.join(this.blobDir, f));
                this.blobs.set(f, { size: st.size, expiresAt: st.mtimeMs + this.blobTtlMs });
            }
        } catch (e) { console.error('blob store init failed:', e.message); }
    }

    /** 删除已过期的 blob(由心跳清扫器周期调用)。 */
    sweepBlobs(now = Date.now()) {
        if (!this.blobEnabled) return;
        for (const [id, meta] of this.blobs) {
            if (now > meta.expiresAt) {
                try { fs.unlinkSync(path.join(this.blobDir, id)); } catch { /* 已不在 */ }
                this.blobs.delete(id);
            }
        }
    }

    /**
     * 解析客户端真实 IP（用于限流 / 防 token 爆破 / TURN 凭据限速）。
     * trustProxyHops=0：直接用 socket 源地址（直连暴露，不可伪造）。
     * trustProxyHops=N>0：取 X-Forwarded-For 的倒数第 N 段（最近的 N 层可信代理各追加一段，
     *   倒数第 N 段即最外层可信代理之外的真实客户端，客户端无法伪造该位置）。
     */
    clientIp(req) {
        if (this.trustProxyHops > 0) {
            const raw = (req && req.headers && req.headers['x-forwarded-for']) || '';
            const chain = raw.split(',').map(s => s.trim()).filter(Boolean);
            if (chain.length) {
                const idx = chain.length - this.trustProxyHops;
                return chain[idx >= 0 ? idx : 0];
            }
        }
        return (req && req.socket && req.socket.remoteAddress) || 'unknown';
    }

    isOriginAllowed(origin) {
        if (!origin) return false;
        return this.allowedOrigins.includes('*') || this.allowedOrigins.includes(origin);
    }

    verifyClient(info, cb) {
        const origin = info.origin || info.req.headers.origin;
        const remoteIp = this.clientIp(info.req);

        if (!this.isOriginAllowed(origin)) {
            this.vlog(`🚫 拒绝连接（origin 不在白名单）: ${origin} from ${remoteIp}`);
            return cb(false, 403, 'Origin not allowed');
        }

        if (!this.checkRateLimit(remoteIp)) {
            this.vlog(`🚫 拒绝连接（限速）: ${remoteIp}`);
            return cb(false, 429, 'Too many connections');
        }

        cb(true);
    }

    checkRateLimit(ip) {
        const now = Date.now();
        const bucket = this.rateBuckets.get(ip);
        if (!bucket || now - bucket.windowStart > RATE_LIMIT_WINDOW_MS) {
            this.rateBuckets.set(ip, { count: 1, windowStart: now });
            return true;
        }
        bucket.count++;
        return bucket.count <= CONNECTIONS_PER_IP_PER_MIN;
    }

    // 检查该 IP 是否已被失败 join 限速（不增加计数）
    isJoinThrottled(ip) {
        const now = Date.now();
        const bucket = this.failedJoinBuckets.get(ip);
        if (!bucket || now - bucket.windowStart > RATE_LIMIT_WINDOW_MS) return false;
        return bucket.count >= MAX_FAILED_JOINS_PER_IP_PER_MIN;
    }

    // 记录一次失败的 join 尝试
    recordFailedJoin(ip) {
        const now = Date.now();
        const bucket = this.failedJoinBuckets.get(ip);
        if (!bucket || now - bucket.windowStart > RATE_LIMIT_WINDOW_MS) {
            this.failedJoinBuckets.set(ip, { count: 1, windowStart: now });
            return;
        }
        bucket.count++;
    }

    sweepRateLimitBuckets(now = Date.now()) {
        const expired = (bucket) => !bucket || now - bucket.windowStart > RATE_LIMIT_WINDOW_MS;
        for (const [ip, bucket] of this.rateBuckets) {
            if (expired(bucket)) this.rateBuckets.delete(ip);
        }
        for (const [ip, bucket] of this.failedJoinBuckets) {
            if (expired(bucket)) this.failedJoinBuckets.delete(ip);
        }
    }

    hashToken(token) {
        return require('crypto').createHash('sha256').update(String(token)).digest('hex');
    }

    // 常量时间比较两个 sha256 十六进制摘要，避免计时侧信道
    tokenHashMatches(expectedHash, providedHash) {
        const crypto = require('crypto');
        const a = Buffer.from(String(expectedHash), 'utf8');
        const b = Buffer.from(String(providedHash), 'utf8');
        // 先校验长度相等（timingSafeEqual 要求等长）；同为 sha256 hex 时恒等长
        if (a.length !== b.length) return false;
        return crypto.timingSafeEqual(a, b);
    }
    
    setupMiddleware() {
        // 安全响应头（网页托管）：CSP 限制脚本仅本地（抗 XSS），放行 ws/wss 信令与 https TURN 拉取。
        // worker-src 'self' blob: 以兼容打包出的加密 Web Worker。WebRTC(UDP) 不受 CSP 约束。
        this.app.use((req, res, next) => {
            res.setHeader('Content-Security-Policy',
                "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; " +
                "img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self' https: wss: ws:; " +
                "worker-src 'self' blob:; base-uri 'self'; form-action 'self'");
            res.setHeader('X-Content-Type-Options', 'nosniff');
            res.setHeader('Referrer-Policy', 'no-referrer');
            next();
        });

        // 前置 origin 校验：未通过直接 403，避免 cors 抛错走默认 500 错误页
        this.app.use((req, res, next) => {
            const origin = req.headers.origin;
            if (origin && !this.isOriginAllowed(origin)) {
                return res.status(403).json({ error: 'Origin not allowed' });
            }
            next();
        });

        // CORS 头补充
        this.app.use(cors({
            origin: (origin, callback) => callback(null, !origin || this.isOriginAllowed(origin)),
            methods: ['GET', 'POST'],
            allowedHeaders: ['Content-Type']
        }));

        // JSON 解析 — 信令载荷 64KB 上限
        this.app.use(express.json({ limit: '64kb' }));

        // 静态文件服务
        this.app.use(express.static(path.join(__dirname, 'public')));

        this.app.use((req, res, next) => {
            this.vlog(`📡 ${req.method} ${req.url}`);
            next();
        });
    }
    
    setupRoutes() {
        // 健康检查
        this.app.get('/health', (req, res) => {
            res.json({
                status: 'healthy',
                timestamp: new Date().toISOString(),
                version: '1.0.0',
                rooms: this.rooms.size,
                clients: this.clients.size
            });
        });
        
        // 仅返回房间客户端数量；不区分"房间不存在/存在"以免泄漏房间存在性
        // 始终返回 200 + clientCount（不存在则为 0），避免 404 vs 200 暴露信息
        this.app.get('/api/rooms/:roomId', (req, res) => {
            const room = this.rooms.get(req.params.roomId);
            const clientCount = room ? room.clients.size : 0;
            res.json({ roomId: req.params.roomId, clientCount });
        });

        // 仅返回房间总数，不再列出 roomId（避免被外部枚举）
        this.app.get('/api/rooms', (req, res) => {
            res.json({ totalRooms: this.rooms.size, totalClients: this.clients.size });
        });

        // TURN 临时凭据签发：基于 coturn use-auth-secret（TURN REST API），替代外部 Cloudflare Worker。
        // username = 过期 unix 时间戳；credential = base64(HMAC-SHA1(TURN_SECRET, username))。
        // 需环境变量 TURN_SECRET + TURN_HOST（与 coturn 的 static-auth-secret/realm 一致）。
        this.app.get('/turn-credentials', (req, res) => {
            // 每 IP 限速，缓解无鉴权端点被脚本反复拉取以盗刷 TURN 中继带宽
            const ip = this.clientIp(req);
            if (!this.checkRateLimit(ip)) {
                return res.status(429).json({ error: 'Too many requests' });
            }
            const secret = process.env.TURN_SECRET;
            const host = process.env.TURN_HOST;
            if (!secret || !host) {
                // 未配置 TURN 属预期状态（如本地联调），返回 200 + 空 iceServers + configured:false，
                // 而非 503——避免浏览器控制台出现红色网络错误噪音。客户端据此不添加任何 TURN，
                // 由前端安全守卫照常告警（仍不静默降级，relayOnly 仍默认开启）。
                return res.json({ iceServers: [], configured: false });
            }
            const ttl = parseInt(process.env.TURN_TTL || '3600', 10);
            const port = process.env.TURN_PORT || '3478';
            const username = String(Math.floor(Date.now() / 1000) + ttl);
            const credential = require('crypto').createHmac('sha1', secret).update(username).digest('base64');
            // TURN_TRANSPORT: both(默认) | tcp | udp。隧道(wg)环境下 TCP 中继比 UDP 更稳(避免 MTU/分片)。
            const transport = (process.env.TURN_TRANSPORT || 'both').toLowerCase();
            const urls = [];
            if (transport !== 'tcp') urls.push(`turn:${host}:${port}?transport=udp`);
            if (transport !== 'udp') urls.push(`turn:${host}:${port}?transport=tcp`);
            if (process.env.TURNS_PORT) {
                urls.push(`turns:${host}:${process.env.TURNS_PORT}?transport=tcp`);
            }
            res.json({ iceServers: [{ urls, username, credential }], ttl });
        });

        // —— 异步文件 blob：上传密文(流式落盘,大小上限,每 IP 限流) / 下载密文 ——
        // 服务器只搬运密文,无密钥解不开;密钥在分享链接的 #片段里,绝不到服务器。
        if (this.blobEnabled) {
            this.app.post('/blob', (req, res) => {
                const ip = this.clientIp(req);
                if (!this.checkRateLimit(ip)) return res.status(429).json({ error: 'Too many requests' });
                const id = require('crypto').randomBytes(16).toString('hex');
                const tmp = path.join(this.blobDir, id + '.tmp');
                const out = fs.createWriteStream(tmp);
                let bytes = 0, aborted = false;
                const fail = (code, msg) => { aborted = true; out.destroy(); try { fs.unlinkSync(tmp); } catch {} if (!res.headersSent) res.status(code).json({ error: msg }); try { req.destroy(); } catch {} };
                req.on('data', (chunk) => { if (aborted) return; bytes += chunk.length; if (bytes > this.blobMaxBytes) return fail(413, 'File too large'); out.write(chunk); });
                req.on('end', () => {
                    if (aborted) return;
                    out.end(() => {
                        try { fs.renameSync(tmp, path.join(this.blobDir, id)); }
                        catch { return res.status(500).json({ error: 'store failed' }); }
                        const expiresAt = Date.now() + this.blobTtlMs;
                        this.blobs.set(id, { size: bytes, expiresAt });
                        this.vlog(`📦 blob 上传 ${id} (${bytes}B) from ${ip}`);
                        res.json({ id, size: bytes, expiresAt });
                    });
                });
                req.on('error', () => fail(400, 'upload error'));
            });
            this.app.get('/blob/:id', (req, res) => {
                const id = req.params.id;
                if (!/^[a-f0-9]{32}$/.test(id)) return res.status(400).json({ error: 'bad id' });
                const meta = this.blobs.get(id);
                const fp = path.join(this.blobDir, id);
                if (!meta || Date.now() > meta.expiresAt || !fs.existsSync(fp)) return res.status(404).json({ error: 'not found or expired' });
                res.setHeader('Content-Type', 'application/octet-stream');
                res.setHeader('Content-Length', meta.size);
                res.setHeader('Cache-Control', 'no-store');
                fs.createReadStream(fp).pipe(res);
            });
        }

        // SPA 回退：非 API/健康/凭据/blob 路由一律返回 index.html（支持前端路由 / 直接打开分享链接）
        this.app.get('*', (req, res, next) => {
            if (req.path.startsWith('/api') || req.path === '/health' || req.path === '/turn-credentials' || req.path.startsWith('/blob')) {
                return next();
            }
            res.sendFile(path.join(__dirname, 'public', 'index.html'), (err) => {
                if (err) next();
            });
        });

        // 404 处理
        this.app.use((req, res) => {
            res.status(404).json({
                error: 'Endpoint not found',
                path: req.url,
                method: req.method
            });
        });
    }
    
    setupWebSocket() {
        this.wss.on('connection', (ws, req) => {
            const clientId = this.generateClientId();
            const clientInfo = {
                id: clientId,
                ws: ws,
                joinedAt: new Date().toISOString(),
                lastSeen: Date.now(),
                roomId: null,
                ip: this.clientIp(req),
                userAgent: req.headers['user-agent'] || 'unknown'
            };
            
            this.clients.set(ws, clientInfo);
            
            this.vlog(`👤 客户端连接: ${clientId} (总计: ${this.clients.size})`);
            
            // 发送欢迎消息
            this.sendMessage(ws, {
                type: 'welcome',
                clientId: clientId,
                timestamp: Date.now()
            });
            
            // 处理消息
            ws.on('message', (data) => {
                try {
                    const message = JSON.parse(data.toString());
                    this.handleMessage(ws, message);
                } catch (error) {
                    console.error('❌ 消息解析错误:', error);
                    this.sendMessage(ws, {
                        type: 'error',
                        error: 'Invalid JSON message',
                        timestamp: Date.now()
                    });
                }
            });
            
            // 处理断开连接
            ws.on('close', () => {
                this.handleDisconnect(ws);
            });
            
            // 处理错误
            ws.on('error', (error) => {
                console.error(`❌ WebSocket错误 (${clientId}):`, error);
                this.handleDisconnect(ws);
            });
        });
        
        console.log('🔌 WebSocket服务器已启动');
    }
    
    handleMessage(ws, message) {
        const client = this.clients.get(ws);
        if (!client) return;
        
        this.vlog(`📨 收到消息 (${client.id}): ${message.type}`);
        
        // 收到任意消息都视为活跃，刷新心跳时间戳
        client.lastSeen = Date.now();

        switch (message.type) {
            case 'join_room':
                this.handleJoinRoom(ws, message.roomId, message.token, message.maxClients);
                break;

            case 'leave_room':
                this.handleLeaveRoom(ws);
                break;

            case 'signal':
                this.handleSignalMessage(ws, message);
                break;

            case 'ping':
                this.sendMessage(ws, {
                    type: 'pong',
                    timestamp: Date.now()
                });
                break;

            case 'pong':
                // 客户端回复服务端的心跳
                break;

            default:
                console.log(`⚠️ 未知消息类型: ${message.type}`);
                this.sendMessage(ws, {
                    type: 'error',
                    error: `Unknown message type: ${message.type}`,
                    timestamp: Date.now()
                });
        }
    }
    
    handleJoinRoom(ws, roomId, token, maxClients) {
        const client = this.clients.get(ws);
        if (!client) return;

        const ip = client.ip || 'unknown';

        // 失败 join 限速：阻止暴力枚举房间 token
        if (this.isJoinThrottled(ip)) {
            this.vlog(`🚫 join_room 被限速（失败次数过多）: ${ip}`);
            return this.sendMessage(ws, { type: 'error', error: 'Too many failed join attempts, try again later' });
        }

        if (typeof roomId !== 'string' || roomId.length < 4 || roomId.length > 128) {
            this.recordFailedJoin(ip);
            return this.sendMessage(ws, { type: 'error', error: 'Invalid roomId' });
        }
        if (typeof token !== 'string' || token.length < 16 || token.length > 128) {
            this.recordFailedJoin(ip);
            return this.sendMessage(ws, { type: 'error', error: 'Token required (16-128 chars)' });
        }

        if (client.roomId) {
            this.handleLeaveRoom(ws);
        }

        const tokenHash = this.hashToken(token);
        let room = this.rooms.get(roomId);

        if (!room) {
            // 首位加入者（房主）建立房间并锁定 token 与人数上限。
            // 上限由房主指定，默认 2（严格一对一），并夹紧到 [2, MAX_ROOM_CLIENTS]。
            let cap = Number.isInteger(maxClients) ? maxClients : 2;
            cap = Math.max(2, Math.min(MAX_ROOM_CLIENTS, cap));
            room = { clients: new Set(), tokenHash, maxClients: cap };
            this.rooms.set(roomId, room);
        } else if (!this.tokenHashMatches(room.tokenHash, tokenHash)) {
            this.vlog(`🚫 房间 token 不匹配: ${roomId}`);
            this.recordFailedJoin(ip);
            return this.sendMessage(ws, { type: 'error', error: 'Invalid room token' });
        }

        // 人数上限以房主创建时锁定的值为准（后续加入者无法放宽）。
        const roomCap = room.maxClients || MAX_ROOM_CLIENTS;
        if (room.clients.size >= roomCap) {
            this.recordFailedJoin(ip);
            return this.sendMessage(ws, { type: 'error', error: 'Room full' });
        }

        room.clients.add(ws);
        client.roomId = roomId;

        this.vlog(`🏠 客户端 ${client.id} 加入房间 ${roomId} (房间人数: ${room.clients.size})`);

        this.sendMessage(ws, {
            type: 'room_joined',
            roomId,
            clientCount: room.clients.size,
            timestamp: Date.now()
        });

        this.broadcastToRoom(roomId, {
            type: 'client_joined',
            clientId: client.id,
            clientCount: room.clients.size,
            timestamp: Date.now()
        }, ws);
    }
    
    handleLeaveRoom(ws) {
        const client = this.clients.get(ws);
        if (!client || !client.roomId) return;

        const room = this.rooms.get(client.roomId);
        if (room) {
            room.clients.delete(ws);

            this.vlog(`🚪 客户端 ${client.id} 离开房间 ${client.roomId} (房间人数: ${room.clients.size})`);

            this.broadcastToRoom(client.roomId, {
                type: 'client_left',
                clientId: client.id,
                clientCount: room.clients.size,
                timestamp: Date.now()
            }, ws);

            if (room.clients.size === 0) {
                this.rooms.delete(client.roomId);
                this.vlog(`🗑️ 房间 ${client.roomId} 已删除（无人）`);
            }
        }

        client.roomId = null;
    }
    
    handleSignalMessage(ws, message) {
        const client = this.clients.get(ws);
        if (!client || !client.roomId) {
            this.sendMessage(ws, {
                type: 'error',
                error: 'Not in a room',
                timestamp: Date.now()
            });
            return;
        }
        
        // 转发信令消息到房间内其他客户端
        const signalData = {
            type: 'signal',
            from: client.id,
            data: message.data,
            timestamp: Date.now()
        };
        
        this.broadcastToRoom(client.roomId, signalData, ws);
        
        this.vlog(`🔄 转发信令 (${client.id} -> 房间 ${client.roomId}): ${message.data?.type || 'unknown'}`);
    }
    
    handleDisconnect(ws) {
        const client = this.clients.get(ws);
        if (!client) return;
        
        this.vlog(`👋 客户端断开连接: ${client.id}`);
        
        // 离开房间
        this.handleLeaveRoom(ws);
        
        // 移除客户端
        this.clients.delete(ws);
        
        this.vlog(`📊 当前连接数: ${this.clients.size}`);
    }
    
    broadcastToRoom(roomId, message, excludeWs = null) {
        const room = this.rooms.get(roomId);
        if (!room) return;

        let sentCount = 0;
        room.clients.forEach(clientWs => {
            if (clientWs !== excludeWs && clientWs.readyState === WebSocket.OPEN) {
                this.sendMessage(clientWs, message);
                sentCount++;
            }
        });

        this.vlog(`📢 广播消息到房间 ${roomId}: ${sentCount} 个客户端`);
    }
    
    sendMessage(ws, message) {
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify(message));
        }
    }
    
    generateClientId() {
        return 'client_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
    }

    startHeartbeatSweeper() {
        this.heartbeatTimer = setInterval(() => {
            const now = Date.now();
            this.sweepRateLimitBuckets(now);
            this.sweepBlobs(now);
            for (const [ws, client] of this.clients) {
                if (now - client.lastSeen > HEARTBEAT_TIMEOUT_MS) {
                    this.vlog(`💤 关闭闲置连接: ${client.id}`);
                    try { ws.close(1000, 'Idle timeout'); } catch {}
                    this.handleDisconnect(ws);
                    continue;
                }
                if (ws.readyState === WebSocket.OPEN) {
                    this.sendMessage(ws, { type: 'ping', timestamp: now });
                }
            }
        }, 30_000);
    }
    
    start() {
        const wsScheme = this.protocol === 'https' ? 'wss' : 'ws';
        this.server.listen(this.port, () => {
            console.log(`🌟 VeilConnect 信令服务器启动成功! (${this.protocol.toUpperCase()})`);
            console.log(`📡 WebSocket: ${wsScheme}://localhost:${this.port}`);
            console.log(`🌐 HTTP API: ${this.protocol}://localhost:${this.port}`);
            console.log(`💚 健康检查: ${this.protocol}://localhost:${this.port}/health`);
            console.log(`📊 房间管理: http://localhost:${this.port}/api/rooms`);
            console.log('');
            console.log('🔗 支持的WebSocket消息类型:');
            console.log('  - join_room: 加入房间');
            console.log('  - leave_room: 离开房间');
            console.log('  - signal: WebRTC信令中继');
            console.log('  - ping: 心跳检测');
            console.log('');
        });
    }
    
    stop() {
        console.log('🛑 正在关闭信令服务器...');
        if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);

        this.clients.forEach((client, ws) => {
            try { ws.close(1000, 'Server shutting down'); } catch {}
        });

        this.server.close(() => {
            console.log('✅ 信令服务器已关闭');
        });
    }
}

// 如果直接运行此文件，启动服务器
if (require.main === module) {
    const port = process.env.PORT || 3001;
    const server = new SignalingServer(port);
    
    // 优雅关闭处理
    process.on('SIGINT', () => {
        console.log('\n⚡ 收到 SIGINT 信号');
        server.stop();
        process.exit(0);
    });
    
    process.on('SIGTERM', () => {
        console.log('\n⚡ 收到 SIGTERM 信号');
        server.stop();
        process.exit(0);
    });
    
    server.start();
}

module.exports = SignalingServer;
