# 代码签名与公证启用指南（桌面安装包）

发布流水线 `.github/workflows/release.yml` **已就绪**:配好下面对应的仓库 Secret 后,推 `v*` 标签
即**自动**签名(macOS 再公证);未配则该平台出**未签名**包(可用,但 macOS Gatekeeper / Windows
SmartScreen 会提示)。证书机密**只放仓库 Secret,绝不入库**。

签名/公证的意义:把"根信任从服务器挪回客户端"——分发签名安装包,OS 可校验来源与完整性、篡改即失效;
配合可复现构建(见 `REPRODUCIBLE_BUILD.md`)与 Release 附带的 `SHA256SUMS-*.txt`,用户能多重自验。

> 注:证书需各自申请(需付费账户),本仓库无法代为获取——这是部署方/发布方的一次性准备。

## 需要准备的 Secret

| 平台 | Secret | 内容 |
|---|---|---|
| macOS 签名 | `MAC_CSC_LINK` | "Developer ID Application" 证书的 `.p12` 文件，**base64 编码**后的字符串 |
| macOS 签名 | `MAC_CSC_KEY_PASSWORD` | 该 `.p12` 的导出密码 |
| macOS 公证 | `APPLE_ID` | Apple 开发者账号邮箱 |
| macOS 公证 | `APPLE_APP_SPECIFIC_PASSWORD` | 该账号的 App 专用密码（appleid.apple.com 生成） |
| macOS 公证 | `APPLE_TEAM_ID` | 10 位 Team ID |
| Windows 签名 | `WIN_CSC_LINK` | 代码签名证书 `.pfx` 文件，**base64 编码**后的字符串 |
| Windows 签名 | `WIN_CSC_KEY_PASSWORD` | 该 `.pfx` 的密码 |

- 三组互相独立:只配 mac → 只有 mac 签名;只配 win → 只有 win 签名;mac 配了证书但没配 `APPLE_*` → 签名但不公证。
- mac 与 win 用**各自**的 `*_CSC_LINK`,流水线在各平台只取本平台证书,不会互相串。

## 把证书转成 base64

```bash
# macOS（.p12）
base64 -i DeveloperID.p12 | tr -d '\n'        # 复制输出
# Windows 证书（.pfx），在任意机器上：
base64 -w0 codesign.pfx                         # Linux
base64 -i codesign.pfx | tr -d '\n'             # macOS
```

## 写入仓库 Secret

需要对仓库有 admin 权限。二选一:

```bash
# 方式 A：gh CLI（注意 --body 会进 shell 历史，可改用 < 文件）
gh secret set MAC_CSC_LINK            < mac_p12.b64
gh secret set MAC_CSC_KEY_PASSWORD    --body '••••'
gh secret set APPLE_ID                --body 'you@example.com'
gh secret set APPLE_APP_SPECIFIC_PASSWORD --body 'xxxx-xxxx-xxxx-xxxx'
gh secret set APPLE_TEAM_ID           --body 'XXXXXXXXXX'
gh secret set WIN_CSC_LINK            < win_pfx.b64
gh secret set WIN_CSC_KEY_PASSWORD    --body '••••'
```

方式 B：仓库网页 → Settings → Secrets and variables → Actions → New repository secret，逐个粘贴。

## 启用后发布

```bash
# 版本 +1 后
git tag -a v2.0.3 -m "..."
git push origin v2.0.3        # 触发 release.yml：检测到 Secret → 自动签名/公证
```

发布后到 Release 页确认安装包已签名(mac:`spctl -a -vv App.app` 应显示 accepted;
win:右键属性→数字签名应有有效签名)。

## Windows 推荐:Azure Trusted Signing（免自管 .pfx）

流水线已**接好** Azure Trusted Signing,且**优先于** `.pfx`:Windows job 检测到下面的 Azure 配置即走
Azure 签名,否则回退 `WIN_CSC_LINK`,再否则未签名。Azure 由微软托管证书,无需你保管 `.pfx`。

需要的 Secret（机密 + 配置）：

| Secret | 类型 | 内容 |
|---|---|---|
| `AZURE_TENANT_ID` | 机密 | 服务主体的租户 ID |
| `AZURE_CLIENT_ID` | 机密 | 服务主体(App 注册)的 Client ID |
| `AZURE_CLIENT_SECRET` | 机密 | 服务主体密钥（electron-builder 用 DefaultAzureCredential 读取这三者） |
| `AZURE_ENDPOINT` | 配置 | Trusted Signing 账户区域端点，如 `https://eus.codesigning.azure.net/` |
| `AZURE_CODE_SIGNING_ACCOUNT_NAME` | 配置 | Trusted Signing 账户名 |
| `AZURE_CERT_PROFILE_NAME` | 配置 | 证书配置文件名 |
| `AZURE_PUBLISHER_NAME` | 配置 | 证书里的发布者名（可选，用于校验） |

准备步骤（一次性）：在 Azure 建 **Trusted Signing 账户**与**证书配置文件**,完成身份验证;创建一个
**服务主体**并授予该账户的 “Trusted Signing Certificate Profile Signer” 角色;把上面三项凭据 + 四项配置写入仓库 Secret。

```bash
gh secret set AZURE_TENANT_ID --body '...'
gh secret set AZURE_CLIENT_ID --body '...'
gh secret set AZURE_CLIENT_SECRET --body '...'
gh secret set AZURE_ENDPOINT --body 'https://eus.codesigning.azure.net/'
gh secret set AZURE_CODE_SIGNING_ACCOUNT_NAME --body '...'
gh secret set AZURE_CERT_PROFILE_NAME --body '...'
gh secret set AZURE_PUBLISHER_NAME --body 'CN=...'   # 可选
```

> ⚠️ **首次启用请先验证**:本仓库维护者无 Azure 账户、无法预先实跑这条路径。配好后请先用一个测试 tag
> 触发一次,确认 Windows job 通过、`.exe` 数字签名有效(右键属性→数字签名)。若 electron-builder 提示
> 缺少签名工具,按其报错与 electron-builder 当前版本的 Azure Trusted Signing 文档补齐对应 helper 即可——
> 流水线的配置注入(`win.azureSignOptions`)与凭据传递已就位,无需改结构。

只配 Azure 就**不要**再设 `WIN_CSC_LINK`(避免歧义);两者同时存在时流水线**优先 Azure**。
