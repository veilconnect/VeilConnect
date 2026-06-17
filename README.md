# VeilConnect

> 可自部署的**网页**端到端加密聊天（React + TypeScript + WebRTC，纯浏览器，无需安装客户端）

VeilConnect 是一个**用户可以自己从网上部署**的网页加密聊天工具：部署者在自己的服务器上一键跑起，任何人用浏览器打开网页即可加密聊天。消息通过 WebRTC 在两个浏览器之间直接传递，服务器不存储任何聊天内容。身份基于 Ed25519 公钥派生；消息走 **Double Ratchet**（Signal 协议）提供**每条消息级前向保密与断后向自愈**，棘轮身份由长期 Ed25519 身份签名绑定以抵御 MITM。

> 自部署步骤见 [`docs/user/SELF_HOST_GUIDE.md`](docs/user/SELF_HOST_GUIDE.md)。

---

## 功能特性

- **零安装**：纯网页，浏览器打开即用；部署者 `docker compose up` 一键自托管（网页+信令+TURN+HTTPS）
- **去中心化身份**：Ed25519 签名公钥的 SHA-256 哈希前 16 字节 → Base58 编码（去 `0/O/I/l`，类似比特币地址）
- **加密公钥绑定**：X25519 加密公钥由 Ed25519 身份私钥签名，导入对端时强制验签，防 MITM 替换
- **端到端加密 + 前向保密**：消息走 Double Ratchet（Signal 协议的 TS 实现），每条消息一把密钥、用后即删，提供每条消息级前向保密与断后向自愈，并天然抗重放；棘轮 prekey bundle 由长期 Ed25519 身份签名绑定
- **私钥不出 Web Worker**：签名/解密均在浏览器的加密 Web Worker 内完成，UI 线程只拿公开字段（桌面版「私钥不出主进程」的浏览器类比）
- **口令解锁的本地身份**：身份私钥经用户口令（PBKDF2-SHA256 60 万轮 + AES-256-GCM）加密后存浏览器 IndexedDB
- **加密身份导出 / 导入**：PBKDF2-SHA256（60 万轮）+ AES-256-GCM，支持换设备迁移
- **多语言界面**：内置 zh-CN / en / ja / es 四套翻译，可热切换
- **自动信令房间 + 分享链接**：一方建房得到链接，另一方打开即自动建连（信令服务器视为不可信中继，靠 SAS 防 MITM）
- **默认强制中继（relayOnly）**：默认只走 TURN relay 候选，隐藏双方真实 IP；自托管 coturn 经 `/turn-credentials` 开箱签发时限凭据。设 `localStorage.vc.relayOnly='0'` 可关闭（暴露 IP 换连通，本地联调用）
- **加固信令服务器**：Origin 白名单、房间 token、连接限速、消息体积上限、CSP 响应头

---

## 项目结构

```
veilconnect/
├── src/
│   ├── main/                          # 共享加密能力（被 Web Worker 复用，原桌面端 Manager）
│   │   ├── crypto/CryptoManager.ts    # NaCl box 加解密
│   │   ├── crypto/RatchetManager.ts   # Double Ratchet（libsignal，浏览器原样运行）
│   │   ├── identity/                  # 身份、ID 派生、密钥绑定、AES-GCM 导出
│   │   ├── database/                  # 简化 KV（联系人 + 消息）
│   │   ├── storage/                   # MessageHistoryManager（带过期）
│   │   └── presence/                  # 在线状态广播
│   ├── web/                           # 纯网页适配层（替代 Electron 主进程/preload）
│   │   ├── index.tsx                  # 入口：口令解锁门禁 → VeilConnectApp
│   │   ├── worker/crypto-worker.ts    # 加密 Web Worker（私钥只在此，channel 路由）
│   │   ├── bridge/electronAPI.ts      # window.electronAPI 桥接（postMessage → Worker）
│   │   ├── security/BrowserKeyStore.ts# 口令派生主密钥的浏览器密钥库
│   │   ├── signaling/SignalingClient.ts # WebSocket 信令房间客户端
│   │   └── shims/                     # electron-store / crypto 的浏览器替身（webpack alias）
│   └── renderer/                      # React UI（与桌面端共享，几乎未改）
│       ├── VeilConnectApp.tsx         # 身份未就绪 → SimpleApp / 已就绪 → SimpleP2PChat
│       ├── SimpleApp.tsx              # 身份生成 / 切换 UI
│       ├── components/SimpleP2PChat.tsx # 信令建连 + 握手 + SAS + 收发
│       └── i18n/                      # 4 语言翻译 + Context Provider
├── server/signaling-server.js         # 信令服务器（房间 + /turn-credentials + 托管 SPA）
├── webpack.web.config.js              # 网页 SPA + Worker 打包（输出 server/public）
├── Dockerfile · docker-compose.yml · Caddyfile · .env.example   # 一键自部署栈
├── tests/                             # Jest 单元测试（74 cases）
└── jest.config.js
```

---

## 快速上手

### 前置

- Node 18+（推荐 20 LTS）、npm 9+
- 自托管生产环境：Docker + Docker Compose、公网 IP、一个解析到本机的域名

### 一行安装（空白服务器，无需手工下载）

在一台干净的 Linux 服务器上，**一条命令**即可（自动装 git/Docker、克隆代码、生成配置、起栈）：

```bash
# ① 有公网域名（解析到本机、80/443 公网可达）
curl -fsSL https://raw.githubusercontent.com/veilconnect/VeilConnect/main/scripts/bootstrap.sh | sudo bash -s -- chat.example.com

# ② 有公网 IP 但没买域名（自动用 <IP>.sslip.io 签真证书）
curl -fsSL https://raw.githubusercontent.com/veilconnect/VeilConnect/main/scripts/bootstrap.sh | sudo bash

# ③ 局域网 / 无公网 / 先本机试用（自签证书，免域名免备案）
curl -fsSL https://raw.githubusercontent.com/veilconnect/VeilConnect/main/scripts/bootstrap.sh | sudo bash -s -- --local
```

完成后按提示访问 `https://<域名或IP[:端口]>`。代码默认克隆到 `/opt/veilconnect`。

> 已 clone 仓库者也可直接：`sudo bash scripts/install.sh [域名|--local]`。
> 手动等价：`cp .env.example .env`（填好）→ `docker compose up -d --build`。完整说明见 [`docs/user/SELF_HOST_GUIDE.md`](docs/user/SELF_HOST_GUIDE.md)。

### 开发 / 本地构建

```bash
npm install               # 装依赖
npm run typecheck         # tsc --noEmit
npm test                  # 跑 74 个单元测试
npm run build:web         # 打包 SPA + Worker 到 server/public
npm run dev:web           # webpack dev server（热重载，8080）
```

本地双标签页联调（localhost 是安全上下文豁免，无需 TLS）：

```bash
npm run build:web
ALLOWED_ORIGINS="http://localhost:3001" PORT=3001 npm run serve
# 浏览器开两个标签访问 http://localhost:3001
# 本地无 TURN：在两个标签 DevTools 执行 localStorage.setItem('vc.relayOnly','0')
```

### 信令服务器加固项

| 项 | 说明 |
|---|---|
| Origin 白名单 | `ALLOWED_ORIGINS` 环境变量，逗号分隔；不在名单内 → HTTP 403 |
| 房间 Token | join_room 必须提供 16-128 字符 token；首位加入者锁定 token，后续以 SHA-256 摘要做**常量时间**比对 |
| 失败 join 限速 | 每 IP 60s 内最多 10 次失败 join（防房间 token 暴力枚举） |
| 连接限速 | 每 IP 60s 内最多 30 次 WS 连接 |
| 消息体积上限 | WS payload 64KB / HTTP body 64KB |
| 房间容量 | 默认 4 人 |
| 心跳超时 | 90s 未活跃自动断开 |

---

## 安全模型

### 身份

```
secretKey (Ed25519, 64B) ← 仅本地，never serialized 除非用户主动加密导出
publicKey (Ed25519, 32B) → SHA-256 → 前 16B → Base58 → userId
```

`userId` 是 22-23 字符的字符串，例如 `3zLvynwAWpzYCkk5K3rJX3`。任何人拿到 `(userId, publicKey)` 都能通过 `verifyUserId` 校验绑定关系，无需信任发布者。

### 加密公钥绑定

`CryptoManager` 在初始化时生成一对独立的 X25519 box keypair。**主进程 bootstrap 阶段**会自动把 box 公钥用 Ed25519 secretKey 签名，把签名结果写回身份：

```ts
keyBindingSignature = Ed25519.sign(boxPublicKey, secretKey)
```

`importPeerIdentity` 接到对端身份后，强制验证 `Ed25519.verify(boxPublicKey, signature, publicKey)`——这一步杜绝了「假冒身份但替换加密公钥」的 MITM 攻击（即旧版的设计漏洞）。

### 会话握手与端到端加密

DataChannel 打开后，双方交换身份包（`userId / publicKey / boxPublicKey / keyBindingSignature`）外加各自的 **Double Ratchet prekey bundle 及其身份签名**，完成认证握手：

1. 收端用 `importPeerIdentity` 强制校验 `userId↔publicKey` 与 box 公钥绑定签名，并验证 ratchet 身份公钥确由对端长期 Ed25519 身份私钥签名，**任一失败即判定中间人并立即断开**，绝不降级到明文。
2. **每条消息级前向保密**：消息经 Double Ratchet 加密，每条一把密钥、用后即删——单条消息密钥泄露不波及其前后消息（前向保密 + 断后向自愈），并天然抗重放。棘轮初始密钥由 prekey bundle 经 X3DH 风格协商得到，bundle 身份已被上面的 Ed25519 签名绑定。
3. 为避免双方同时建立出站会话导致棘轮错乱，由 `userId` 较大者**确定性地**作为发起方：它先建立会话并发一条控制密文，对端据此建立入站会话，之后双向自由收发。
4. UI 由两端**长期身份公钥**派生一个 20 位（约 66-bit 熵）**安全码（SAS）**，用户通过电话/当面等带外渠道核对一致，即可排除「粘贴邀请码的渠道被中继替换密钥」这类全程中继 MITM。

**安全码核对是强制的**：安全通道建立后、用户点「一致，确认」之前，输入框与发送按钮保持禁用，此阶段状态栏显示 `🔒 已加密 · 待核对安全码`；带外核对确认后才解锁输入并显示 `🔒 已加密 · 已验证`。安全握手未完成时输入框同样禁用，且任何分支都绝不降级到明文。

### 加密导出

```
salt   = random(16B)
iv     = random(12B)
key    = PBKDF2-SHA256(password, salt, 600_000, 32B)   # 对齐 OWASP 现行建议；口令最少 12 字符
cipher = AES-256-GCM(JSON.stringify(identity), key, iv)
```

输出 JSON：`{ version, encrypted: true, salt, iv, authTag, ciphertext }`，全部 base64。导入时 GCM authTag 失败即抛错（错误密码 / 篡改）。

---

## 测试

```
$ npm test
Test Suites: 8 passed, 8 total
Tests:       77 passed, 77 total

File                       | % Stmts | % Branch | % Funcs | % Lines
All files                  |   83.66 |    60.17 |    86.2 |   85.44
 CryptoManager.ts          |   91.66 |    28.57 |     100 |   91.66
 RatchetManager.ts         |   93.22 |       75 |       88 |    93.1
 IdentityManager.ts        |   72.15 |    47.27 |   69.23 |   75.51
 PresenceManager.ts        |   98.07 |      100 |   93.75 |    100
 MessageHistoryManager.ts  |   90.69 |       75 |   89.65 |   93.93
```

关键的安全断言（不仅是 happy path）：

- ✅ `verifyUserId` 拒绝篡改的 ID / 无效公钥
- ✅ AES-GCM 错误密码导入抛错（authTag 校验）
- ✅ 每次导出密文不同（验证随机盐 + IV）
- ✅ `importPeerIdentity` 拒绝 userId↔publicKey 不匹配
- ✅ `importPeerIdentity` 拒绝 boxPublicKey 签名失效（防 MITM）
- ✅ 兼容 v1 旧明文身份格式（无 boxPublicKey 时跳过验签）
- ✅ `verifyEphemeralKey` 拒绝伪造的 ratchet 身份签名（防 MITM）
- ✅ Double Ratchet 往返加解密、抗重放（重放旧密文被拒）
- ✅ `verifySignature` 接受正确 Ed25519 签名、拒绝篡改消息
- ✅ 加密消息篡改后 box.open 失败抛错
- ✅ 用错误对端公钥解密失败

---

## 架构注记

### 浏览器内的「主进程」：Web Worker + 桥接

```
React UI ──调用──► window.electronAPI.<域>.<方法>
                        │
              src/web/bridge/electronAPI.ts ──postMessage──► Web Worker (crypto-worker.ts)
                                                                   └── 全部 Manager + 私钥（不出 Worker）
```

渲染端代码与桌面端**完全一致**地通过 `window.electronAPI.<域>.<方法>` 调用能力；桥接层把调用经 `postMessage` 转给加密 Web Worker，私钥与解密只在 Worker 上下文内，发回 UI 的身份对象一律剥离 secretKey。`electron-store` 与 Node `crypto` 经 webpack alias 换成浏览器 shim（`src/web/shims/`），各 Manager 业务代码几乎零改动。

### 密钥管理

- `BrowserKeyStore`：用户口令经 PBKDF2-SHA256(60 万轮) 派生主密钥，AES-256-GCM 加密一个 keyring（含 4 个 per-store 密钥）存于 IndexedDB
- per-store 密钥作为各库的 encryptionKey，经 `nacl.secretbox` 同步加密后写入 IndexedDB（`electron-store-shim` 内存缓存 + 异步写回，绕开 IndexedDB 异步性与 electron-store 同步 API 的冲突）
- 浏览器无 OS keychain，安全性弱于桌面版的 `safeStorage`，详见自部署指南的安全说明

### WebRTC 信令（自动房间）

1. 一方点「创建房间」→ 生成 roomId + 一次性 token → 加入信令房间 → 得到分享链接
2. 另一方打开链接 → 自动加入房间 → host 收到「对方入房」后发 offer，guest 回 answer，双方 trickle ICE
3. DataChannel 打开 → 交换身份包 + 强制验签 + **SAS 待核对** → 带外核对一致后解锁输入

`server/signaling-server.js` 同时托管打包好的网页 SPA、提供 WebSocket 信令房间、并经 `/turn-credentials` 用 coturn 共享密钥签发时限 TURN 凭据。信令服务器被视为**不可信中继**，防 MITM 完全依赖强制的 SAS 带外核对。

---

## 限制 / 已知问题

- **必须 HTTPS**：浏览器 WebCrypto/WebRTC 需安全上下文，自部署栈用 Caddy 自动 HTTPS 满足；localhost 联调豁免。
- **浏览器密钥保护弱于桌面版**：无 OS keychain，私钥靠用户口令加密落 IndexedDB；Web Worker 仅软隔离。忘记口令需用加密导出的身份文件在新设备恢复。
- **聊天本身无消息持久化**：`SimpleP2PChat` 关闭即丢历史。`MessageHistoryManager` 已实现但还没接 UI。
- **TURN 凭据**：自托管 coturn 默认经 `/turn-credentials` 开箱签发；本地无 TURN 时设 `vc.relayOnly='0'`（会暴露真实 IP，仅联调用）。
- **非抗审查工具**：内容端到端加密，但无流量混淆 / DPI 抗性，元数据（连接发生、IP）仍可能暴露给中继方。高威胁场景请额外叠加 VPN/Tor。
- **不支持多对话**：`SimpleP2PChat` 只能维护一个活动连接。
- **i18n 覆盖未完成**：SimpleP2PChat 部分对话框字符串仍为硬编码中文。

---

## 许可

MIT — © 2025 VeilConnect Team
