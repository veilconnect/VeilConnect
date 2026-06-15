# VeilConnect

> P2P 端到端加密聊天桌面客户端（Electron + React + TypeScript）

VeilConnect 通过 WebRTC 在两个客户端之间直接建立加密通道传递消息，不依赖中央服务器存储任何聊天内容。身份基于 Ed25519 公钥派生；消息走 **Double Ratchet**（Signal 协议）提供**每条消息级前向保密与断后向自愈**，棘轮身份由长期 Ed25519 身份签名绑定以抵御 MITM。

---

## 功能特性

- **去中心化身份**：Ed25519 签名公钥的 SHA-256 哈希前 16 字节 → Base58 编码（去 `0/O/I/l`，类似比特币地址）
- **加密公钥绑定**：X25519 加密公钥由 Ed25519 身份私钥签名，导入对端时强制验签，防 MITM 替换
- **端到端加密 + 前向保密**：消息走 Double Ratchet（Signal 协议的 TS 实现），每条消息一把密钥、用后即删，提供每条消息级前向保密与断后向自愈，并天然抗重放；棘轮 prekey bundle 由长期 Ed25519 身份签名绑定
- **私钥不出主进程**：签名/解密均在 Electron 主进程完成，渲染进程只拿公开字段
- **加密身份导出 / 导入**：PBKDF2-SHA256（60 万轮）+ AES-256-GCM，支持设备迁移
- **多语言界面**：内置 zh-CN / en / ja / es 四套翻译，可热切换
- **支持 TURN 中继**：默认 STUN-only，通过 `localStorage.vc.turn` 注入 TURN 服务器
- **断点续传文件**：64KB 分块、SHA-256 校验、暂停/恢复/取消
- **加固信令服务器**：Origin 白名单、房间 token、连接限速、消息体积上限

---

## 项目结构

```
veilconnect/
├── src/
│   ├── main/                          # Electron 主进程
│   │   ├── main.ts                    # 启动入口 + IPC 路由
│   │   ├── preload.ts                 # contextBridge → window.electronAPI
│   │   ├── crypto/CryptoManager.ts    # NaCl box 加解密
│   │   ├── identity/                  # 身份、ID 派生、密钥绑定、AES-GCM 导出
│   │   ├── database/                  # 简化 KV（联系人 + 消息）
│   │   ├── storage/                   # MessageHistoryManager（带过期）
│   │   ├── presence/                  # 在线状态广播
│   │   ├── transfer/                  # 断点续传文件
│   │   └── security/                  # SecureKeyStore（基于 Electron safeStorage）
│   └── renderer/                      # React 渲染进程
│       ├── VeilConnectApp.tsx         # 入口：身份未就绪 → SimpleApp / 已就绪 → SimpleP2PChat
│       ├── SimpleApp.tsx              # 身份生成 / 切换 UI
│       ├── components/                # ChatWindow、SimpleP2PChat、LanguageSelector 等
│       └── i18n/                      # 4 语言翻译 + Context Provider
├── server/                            # 独立信令服务器（独立 package.json）
│   └── signaling-server.js
├── tests/                             # Jest 单元测试（56 cases，>80% 主进程覆盖）
├── webpack.main.config.js             # 主进程 + preload 打包
├── webpack.renderer.config.js         # 渲染进程打包
└── jest.config.js
```

---

## 快速上手

### 前置

- Node 18+（推荐 20 LTS）
- npm 9+
- 打包成 .dmg / .AppImage / .exe 时分别需要对应平台或 wine

### 开发

```bash
npm install               # 装依赖（会下载平台对应的 Electron 二进制）
npm run typecheck         # tsc --noEmit
npm test                  # 跑 56 个单元测试
npm run build             # 产出 dist/main.js + dist/preload.js + dist/renderer/
npm start                 # 用打包后的 dist 启动 Electron
```

开发模式（热重载渲染端）：

```bash
npm run dev               # concurrently 跑 main watch + dev server + electron
```

### 打包分发

```bash
npm run pack              # electron-builder --dir，仅产出未打包目录（用于调试包装）
npm run dist:linux        # AppImage (x64)
npm run dist:mac          # dmg (x64 + arm64)
npm run dist:win          # NSIS 安装包 (x64)
```

产物在 `release/` 下。跨平台构建：mac 包需要 macOS 主机，win 包在 Linux 上需要 wine。

### 信令服务器（可选）

当前桌面客户端走的是「邀请码粘贴」模式，**默认不需要信令服务器**。如果要切到自动信令：

```bash
cd server
npm install
ALLOWED_ORIGINS="http://localhost:8080,file://" PORT=3001 npm start
```

信令服务器加固项：

| 项 | 说明 |
|---|---|
| Origin 白名单 | `ALLOWED_ORIGINS` 环境变量，逗号分隔；不在名单内 → HTTP 403 |
| 房间 Token | join_room 必须提供 8-128 字符 token；首位加入者锁定 token，后续以 SHA-256 比对 |
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
4. UI 由两端**长期身份公钥**派生一个 16 位（约 64-bit 熵）**安全码（SAS）**，用户通过电话/当面等带外渠道核对一致，即可排除「粘贴邀请码的渠道被中继替换密钥」这类全程中继 MITM。

安全通道建立前输入框禁用，状态栏显示 `🔒 已加密 · 已验证`。

### 加密导出

```
salt   = random(16B)
iv     = random(12B)
key    = PBKDF2-SHA256(password, salt, 100_000, 32B)
cipher = AES-256-GCM(JSON.stringify(identity), key, iv)
```

输出 JSON：`{ version, encrypted: true, salt, iv, authTag, ciphertext }`，全部 base64。导入时 GCM authTag 失败即抛错（错误密码 / 篡改）。

---

## 测试

```
$ npm test
Test Suites: 4 passed, 4 total
Tests:       56 passed, 56 total

File                       | % Stmts | % Branch | % Funcs | % Lines
All files                  |   82.05 |    57.89 |   84.33 |   83.75
 CryptoManager.ts          |   83.07 |       25 |   92.85 |   83.07
 IdentityManager.ts        |   70.94 |       44 |   66.66 |   73.72
 PresenceManager.ts        |   98.07 |      100 |   93.75 |   100
 MessageHistoryManager.ts  |   90.69 |       75 |   89.65 |   93.93
```

关键的安全断言（不仅是 happy path）：

- ✅ `verifyUserId` 拒绝篡改的 ID / 无效公钥
- ✅ AES-GCM 错误密码导入抛错（authTag 校验）
- ✅ 每次导出密文不同（验证随机盐 + IV）
- ✅ `importPeerIdentity` 拒绝 userId↔publicKey 不匹配
- ✅ `importPeerIdentity` 拒绝 boxPublicKey 签名失效（防 MITM）
- ✅ 兼容 v1 旧明文身份格式（无 boxPublicKey 时跳过验签）
- ✅ 加密消息篡改后 box.open 失败抛错
- ✅ 用错误对端公钥解密失败

---

## 架构注记

### 三层 IPC

```
渲染进程 ──invoke──► preload.ts ──ipcRenderer.invoke──► 主进程 ipcMain.handle
                            │
                            └── contextBridge.exposeInMainWorld('electronAPI', api)
```

所有渲染端代码通过 `window.electronAPI.<namespace>.<method>` 调用主进程能力，nodeIntegration 关闭、contextIsolation 开启。

### 密钥管理

- `SecureKeyStore` 使用 Electron 的 `safeStorage`（macOS Keychain / Windows DPAPI / Linux libsecret）加密存储 4 个 store 主密钥（文件 mode 0600）
- `safeStorage` 不可用时**默认拒绝**明文落盘；仅当显式设置 `VC_ALLOW_PLAINTEXT_KEYS=1`（如无 keyring 的开发环境）才允许明文，避免静默把主密钥写成明文
- 4 个 store：identity / crypto / database / message-history，各自独立加密

### WebRTC 信令

桌面客户端默认走的是离线邀请码模式：

1. 主机点「创建连接」→ 生成 offer + 等 ICE 收集（5s 超时）→ 序列化 SDP 为邀请码
2. 客户端粘贴邀请码 → 生成 answer SDP → 反向粘贴回主机
3. 双方 DataChannel 打开 → 心跳保活

没有信令服务器参与（实测 SimpleP2PChat 完全不调 socket.io）。`server/signaling-server.js` 是为「未来自动信令」准备的，目前已加固但未接入。

---

## 限制 / 已知问题

- **聊天本身无消息持久化**：`SimpleP2PChat` 关闭即丢历史。`MessageHistoryManager` 已实现但还没接 UI。
- **没有 TURN 默认配置**：对称 NAT 下打不通；用户需自行在 `localStorage.vc.turn` 注入。
- **没有 icon**：打包产物使用 Electron 默认图标。
- **不支持多对话**：`SimpleP2PChat` 只能维护一个活动连接。
- **i18n 覆盖未完成**：SimpleP2PChat 的对话框内字符串仍有约 15 处硬编码中文。

---

## 许可

MIT — © 2025 VeilConnect Team
