# VeilConnect 身份安全

> 本文档描述 v2.2.0 实际实现的身份与密钥安全机制。前序版本的实现并不完整，本版本是首次端到端可用。

---

## 概览

VeilConnect 的身份包含两套独立的密钥对，分别承担「签名」与「加密」职责：

| 用途 | 算法 | 密钥来源 |
|---|---|---|
| 身份签名 / userId 派生 | Ed25519 | `IdentityManager` 持有 secretKey |
| 消息 / 文件加密 | X25519 + XSalsa20-Poly1305（NaCl box） | `CryptoManager` 持有 box keypair |

`userId` 通过 Ed25519 公钥派生：

```
userId = Base58( SHA-256(publicKey)[0..16] )
```

Base58 字母表去除 `0/O/I/l`（与比特币地址一致），结果约 22–23 字符。任意人拿到 `(userId, publicKey)` 都可通过 `verifyUserId` 校验绑定，无需可信第三方。

---

## 加密公钥绑定（v2.2 新增）

**问题**：旧版（v2.1 及更早）`userId` 派生自 Ed25519 公钥，但实际消息加密用的是另一对独立的 X25519 box keypair——两者没有任何密码学绑定。攻击者可以构造「正确 userId + 正确签名公钥 + 错误 box 公钥」的伪身份，让对方加密发往攻击者持有 box 私钥的密钥下。

**修复**：主进程 bootstrap 阶段自动把 box 公钥用 Ed25519 secretKey 签名：

```ts
keyBindingSignature = Ed25519.sign(boxPublicKey, secretKey)
```

身份导出格式新增两个字段：

```json
{
  "userId": "3zLvynwAWpzYCkk5K3rJX3",
  "publicKey": "Base64(Ed25519 publicKey 32B)",
  "boxPublicKey": "Base64(X25519 publicKey 32B)",
  "keyBindingSignature": "Base64(Ed25519 signature 64B)",
  "nickname": "...",
  "avatar": "..."
}
```

`importPeerIdentity` 进行两层校验：

1. `verifyUserId(userId, publicKey)` — userId 必须等于 SHA-256(publicKey) 派生值
2. `Ed25519.verify(boxPublicKey, keyBindingSignature, publicKey)` — 加密公钥必须由身份私钥签名

任一失败即抛错拒绝。

**兼容性**：为了避免长期维护弱身份格式，旧格式（无 `boxPublicKey` / `keyBindingSignature`）不再可导入。所有对端身份必须携带加密公钥绑定签名。

---

## 密码保护的身份导出 / 导入

用于设备迁移和备份。`exportIdentityEncrypted(password)` 输出 JSON：

```json
{
  "version": "2.0",
  "encrypted": true,
  "salt":       "Base64(16B)",
  "iv":         "Base64(12B)",
  "authTag":    "Base64(16B)",
  "ciphertext": "Base64(...)"
}
```

加密过程：

```
salt  = random(16B)
iv    = random(12B)
key   = PBKDF2-SHA256(password, salt, 100_000 iters, 32B)
out   = AES-256-GCM(JSON.stringify(identity), key, iv)
```

**密钥派生**：PBKDF2-SHA256，100,000 轮，盐 128bit。抗字典 / 彩虹表攻击。

**加密**：AES-256-GCM。GCM 内置 16B 认证标签——错误密码、密文篡改、IV 篡改任一都会导致 `decipher.final()` 抛错。

**密码要求**：当前最低 4 字符（仅防止空密码意外提交），实际使用强烈建议 12+ 字符强密码。

---

## 当前实现的 IPC 通道

主进程注册的与身份安全相关的 IPC handler（参见 `src/main/main.ts`）：

| Channel | 入参 | 出参 |
|---|---|---|
| `identity:getCurrentIdentity` | — | `UserIdentity \| null` |
| `identity:createNewIdentity` | `nickname?: string` | `UserIdentity` |
| `identity:exportIdentity` | — | JSON string（公开身份，不含 secretKey） |
| `identity:exportIdentityEncrypted` | `password: string` | JSON string（加密载荷） |
| `identity:importPeerIdentity` | `data: string` | `PeerIdentity`（验证签名后保存到对端列表） |
| `identity:importIdentityEncrypted` | `payload, password` | `UserIdentity`（解密 + 替换本地身份） |
| `identity:generateQRCode` | — | JSON string |
| `identity:parseQRCode` | `data: string` | `PeerIdentity` |
| `identity:verifyUserId` | `userId, publicKey` | `boolean` |

渲染端通过 `window.electronAPI.identity.*`（见 `src/main/preload.ts`）调用。

---

## 测试覆盖

`tests/IdentityManager.test.ts` 18 个 case，关键安全断言：

- 篡改的 `userId` 被拒
- 错误密码导入抛错（不静默失败）
- 重复导出密文每次不同（盐 + IV 随机性）
- `importPeerIdentity` 拒绝 userId↔publicKey 不匹配
- `importPeerIdentity` 拒绝 `boxPublicKey` 签名失效（防 MITM 替换）
- `importPeerIdentity` 拒绝缺少 `boxPublicKey` / `keyBindingSignature` 的旧格式身份
- QR 码非 `veilconnect_identity` 类型拒绝

执行：

```bash
npm test
```

---

## 密钥存储

主进程 4 个独立加密 store（`electron-store` + AES）：

| Store | 内容 |
|---|---|
| `user-identity` | UserIdentity + peerIdentities |
| `crypto-keys` | NaCl box keypair |
| `conversation-db` | 联系人 + 消息（简化 KV） |
| `message-history` | HistoryMessage 列表 + 过期时间 |

各 store 的对称密钥由 `SecureKeyStore` 管理，落盘前由 Electron `safeStorage` 进一步加密：

- macOS：Keychain Services
- Windows：DPAPI
- Linux：libsecret / kwallet

> **更新（fail-closed）**：当前桌面端 `src/main/electron/secureKeyStore.ts` **不再降级为明文**。
> `safeStorage` 不可用时**拒绝写盘**（抛错）；Linux 上若后端退化为 `basic_text`（硬编码密钥≈明文）
> 主进程亦**拒绝启动**。仅在【未打包】的开发/测试且显式 `VEIL_ALLOW_PLAINTEXT_KEYRING=1` 时才允许
> 带审计标记的明文落盘——发布版恒禁用。详见 `docs/DESKTOP_BUILD.md`。

---

## 设计上的剩余风险

1. **导出口令最小长度 12 字符**（`MIN_EXPORT_PASSWORD_LEN`，本文旧值 4 已废弃）：阻挡弱口令误用。
2. **PBKDF2-SHA256 600,000 轮**（本文旧值 100k 已废弃，对齐 OWASP）：比 Argon2 抗 GPU 弱，但避免引入原生模块依赖。Argon2id 列为路线项（见 `docs/security/CRYPTO_RATIONALE.md`）。
   **恶意渲染端导出风险**：`exportIdentityEncrypted(password)` 用渲染端传入的口令加密含私钥的身份后返回——被 XSS/供应链污染的渲染端可借此导出私钥。缓解路线：对导出/清库/换身份等敏感操作要求本地用户确认或 OS 认证（待实现）。
3. **本地 store 加密 key 派生自固定字符串**：`SecureKeyStore.getKey` 第一次启动会随机生成并持久化；该 key 本身受 `safeStorage` 保护。如果攻击者已能读取用户的 `userData` 目录且 `safeStorage` 不可用，加密形同虚设——这与所有桌面端本地存储面临的「本地威胁模型」一致。
4. **TOFU**：导入对端身份时按 first-seen 信任。后续应支持安全字带（safety number）人工核验，或 sigchain。

---

## 变更历史

### v2.2.0 — 2026 Q2（当前）

- ✅ 新增 `boxPublicKey` + `keyBindingSignature`，加密公钥绑定身份（**安全修复**）
- ✅ 实现 `exportIdentityEncrypted` / `importIdentityEncrypted`（PBKDF2 + AES-256-GCM）
- ✅ IPC 通道 `identity:exportIdentityEncrypted` / `identity:importIdentityEncrypted`
- ✅ 18 个单元测试覆盖核心安全断言
- ✅ 拒绝 v1 / v2.1 未绑定旧格式导入，长期安全模型不保留弱兼容
- ✅ 修复源码 GBK 编码乱码

### v2.1.0 — 之前承诺的 Cloudflare Pages 版本

文档描述但源码未实现的功能。本版本以桌面端为主体重新落地。

---

## 实施位置

| 功能 | 文件 |
|---|---|
| Ed25519 keypair / userId 派生 | `src/main/identity/IdentityManager.ts` |
| 加密公钥绑定签名 | `IdentityManager.attachBoxPublicKey` / `verifyKeyBinding` |
| AES-GCM 导出 / 导入 | `IdentityManager.exportIdentityEncrypted` / `importIdentityEncrypted` |
| NaCl box 加解密 | `src/main/crypto/CryptoManager.ts` |
| 主密钥存储 | `src/main/security/SecureKeyStore.ts` |
| 渲染端调用 | `window.electronAPI.identity.*`（`src/main/preload.ts`） |
| 测试 | `tests/IdentityManager.test.ts` |
