# VeilConnect 威胁模型（STRIDE）

> 本文把"谁能做什么、不能做什么"写成可核对的清单，并指向对应的代码断言/测试。
> 目标：让安全模型从"自我声称"变成"可验证"。配套测试见 `tests/HandshakeFuzz.test.ts`、
> `tests/E2EHandshake.test.ts`、`tests/safetyCode.test.ts`、`server/signaling-server.test.js`。

## 资产

| 资产 | 位置 | 保护手段 |
|---|---|---|
| Ed25519 身份私钥 | 浏览器 IndexedDB（口令派生密钥加密） | PBKDF2-SHA256 60万轮 + AES-256-GCM；仅在加密 Web Worker 内解密使用 |
| X25519 加密私钥 | 同上 | 同上；私钥永不出 Worker（`toRendererIdentity` 剥离 secretKey） |
| 消息明文 | 仅两端内存（默认）/可选 IndexedDB（开 `vc.persist`） | Double Ratchet 每消息密钥；持久化时 per-store 密钥 AES 加密 |
| 房间 token | 一次性，URL fragment | `crypto.getRandomValues`；服务端 SHA-256 + 常量时间比对 |

## 信任边界与各角色能力

### 1. 信令服务器（被视为不可信中继）
- **能**：看到 WS 连接的来源 IP、房间内有几个连接、转发不透明的 SDP/ICE。
- **不能**：读取消息内容（端到端加密）；冒充对端而不被 SAS 发现（替换身份公钥会改变安全码，带外核对即暴露）；枚举房间 token（失败 join 限速 + 常量时间比对，见 server 测试）。
- **缓解**：默认不记录元数据日志（`SIGNAL_VERBOSE` 关闭时不落 IP/clientId/roomId）。

### 2. TURN 中继
- **能**：看到双方 relay 流量的存在与时序、双方公网出口（中继侧）。
- **不能**：解密 DTLS/SRTP 之上的 DataChannel 内容。
- **缓解**：relayOnly 默认开启以隐藏对端真实 IP；建议 `turns:`（TLS）混入 HTTPS 流量。

### 3. 网页部署者（根信任，最强对手）
- **能**：下发被篡改的 HTML/JS，从而窃取口令与私钥。**这是浏览器端 E2EE 的固有天花板。**
- **缓解（部分、可验证）**：构建产物注入 SRI（`scripts/gen-sri.js`，浏览器拒绝执行哈希不符的脚本）；发布 `sri-manifest.json` 供比对；提供可复现构建（见 `docs/REPRODUCIBLE_BUILD.md`）。
- **根本消除（已提供）**：改用本仓库的**桌面客户端**（`src/main/electron/`）。它只 `loadFile` 本地代码、绝不加载远程，配合代码签名 + 可复现构建，使根信任回到可独立审计的客户端。详见 `docs/DESKTOP_BUILD.md`。

### 4. 主动网络中间人（MITM）
- **不能**：在不被发现的情况下插入自己——`importPeerIdentity` 强制校验 userId↔publicKey 与 box 绑定签名；`verifyEphemeralKey` 校验 ratchet 身份签名；任一失败立即断开、绝不降级明文；最终 20 位 SAS 带外核对兜底。断言见 `tests/HandshakeFuzz.test.ts`。

## STRIDE 逐项

| 类别 | 威胁 | 状态 | 依据 |
|---|---|---|---|
| **S**poofing 冒充 | 冒充他人身份 | 缓解 | userId 由公钥派生且可校验；SAS 带外核对 |
| | MITM 替换加密公钥 | 缓解 | box 绑定签名强制验签（`importPeerIdentity`） |
| | MITM 替换 ratchet 临时密钥 | 缓解 | `verifyEphemeralKey` 强制验签 |
| **T**ampering 篡改 | 篡改密文/文件块 | 缓解 | Double Ratchet 认证加密；文件块 AES-GCM + 全文件 SHA-256 校验 |
| | 篡改下发脚本 | **部分** | SRI + manifest（部署者仍是根信任，见角色 3） |
| **R**epudiation 抵赖 | — | 不在范围 | 设计上不做不可抵赖性（反而利于否认性） |
| **I**nfo Disclosure 泄露 | 读取消息内容 | 缓解 | E2EE + 前向保密 |
| | 元数据（谁/何时/IP） | **残留** | 中继可见连接事件；默认不记日志但无法消除。高威胁场景叠加 VPN/Tor |
| | 私钥落盘 | 缓解 | 口令加密；弱于桌面 OS keychain（已披露） |
| **D**oS | token 爆破 | 缓解 | 失败 join 限速（每 IP 60s/10 次） |
| | 连接洪泛 | 缓解 | 每 IP 60s/30 连接；WS/HTTP 体积 64KB 上限；心跳清理 |
| | TURN 盗刷 | 缓解 | `/turn-credentials` 每 IP 限速 + 时限凭据 |
| **E**oP 提权 | XSS 注入 | 缓解 | CSP `script-src 'self'`、`nosniff`；私钥在 Worker 软隔离 |
| | XFF 伪造抬高信任 | 缓解 | `TRUST_PROXY` 取 XFF 倒数第 N 段（见 server 测试） |

## 已知残留风险（诚实清单）
1. **部署者可换脚本** → 网页 E2EE 天花板；用 SRI 缓解，根除需签名原生客户端。
2. **元数据可观测** → 非抗审查工具；叠加 VPN/Tor。
3. **浏览器密钥保护弱于桌面** → 无 OS keychain；Web Worker 仅软隔离。
4. **CSP `connect-src` 较宽**（`https: wss:`）→ 为支持任意 TURN/信令主机；高安全部署可在反代收紧到固定域名。
