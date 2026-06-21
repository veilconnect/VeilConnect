# 密码学选型说明（Crypto Rationale）

> 为什么用这些原语、参数怎么定的、依赖怎么钉。配套断言见 `tests/`（CryptoManager / RatchetManager /
> IdentityManager / IdentityEphemeral / E2EHandshake / HandshakeFuzz / safetyCode）。

## 原语与库

| 用途 | 选型 | 库 | 钉版本 |
|---|---|---|---|
| 身份签名 | Ed25519 | `tweetnacl` | **精确钉** `1.0.3` |
| 加密（盒） | X25519 + XSalsa20-Poly1305（NaCl box） | `tweetnacl` | 同上 |
| 编码 | base64 | `tweetnacl-util` | **精确钉** `0.15.1` |
| 会话棘轮 | Double Ratchet + X3DH 风格 prekey | `@privacyresearch/libsignal-protocol-typescript` | **精确钉** `0.0.16` |
| 口令派生 | PBKDF2-HMAC-SHA256 | WebCrypto / Node `crypto` | 平台内置 |
| 对称加密 | AES-256-GCM | WebCrypto / Node `crypto` | 平台内置 |
| 哈希 | SHA-256 / SHA-384(SRI) | WebCrypto / Node `crypto` | 平台内置 |

**为什么精确钉**：密码学依赖一旦被悄悄换版（哪怕 patch）都可能改变行为或引入后门，故对
`tweetnacl` / `tweetnacl-util` / libsignal 去掉 `^`，锁死到具体版本；升级须人工评审 + 过测试。
`package-lock.json` 进一步用 integrity 哈希锁住产物。CI 用 `npm ci`（严格按 lock 安装）。

## 关键参数与依据

- **PBKDF2 迭代 600,000**：对齐 OWASP 对 PBKDF2-SHA256 的现行建议（2023+）。
  - *已知更优*：Argon2id 抗 GPU/ASIC 更强。**未采用的原因**：WebCrypto 原生不提供 Argon2，
    引入 WASM 实现会增大"下发脚本"的攻击面与体积，与浏览器 E2EE 的信任边界权衡后暂留 PBKDF2。
    列为路线项（见下）。
- **AES-256-GCM**：12B 随机 IV、128-bit 标签；每次导出/每个文件块独立随机 IV。
  GCM authTag 失败即抛错（错误口令/篡改），见 `tests/IdentityManager.test.ts`。
- **userId 派生**：`Base58( SHA-256(Ed25519_pub)[:16] )`，22–23 字符；
  16 字节（128-bit）抗碰撞，任何人可 `verifyUserId` 无信任校验。
- **安全码（SAS）熵 ≈ 66 bit**：`SHA-256("veilconnect-safety|"+sort(pubA,pubB))` 前 10 字节对 10^20 取模。
  对密钥排序保证两端一致；瓶颈在 10^20≈2^66.4。断言见 `tests/safetyCode.test.ts`（排序无关、确定性、雪崩、格式）。
- **棘轮发起方裁决**：由 `userId` 较大者确定性地作为发起方，避免双方同时建立出站会话导致棘轮错乱。

## 认证握手的强制性（防 MITM 的可验证断言）

1. `importPeerIdentity`：userId↔publicKey + Ed25519(boxPublicKey) 绑定签名，任一失败 **throw**。
2. `verifyEphemeralKey`：ratchet 身份公钥须由对端长期身份私钥签名，失败即判 MITM 并断开。
3. 任何分支 **绝不降级明文**；SAS 未带外确认前发送按钮禁用。
4. 对抗性输入（畸形 JSON、篡改签名、错配 ID、未绑定身份、随机签名）全部被拒——见
   `tests/HandshakeFuzz.test.ts`（含 50 次随机签名 fuzz 恒返回 false）。

## 升级/审计路线
- [ ] 引入 Argon2id（评估 WASM 体积 vs 安全收益）。
- [ ] 第三方密码学审计（Cure53 / Trail of Bits 量级），公开报告。
- [ ] 评估迁移到官方 libsignal 绑定。
- [ ] 群聊改用 MLS（RFC 9420）而非 N² Double Ratchet。
