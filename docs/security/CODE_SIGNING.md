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

## Windows 备选:Azure Trusted Signing

不想自管 `.pfx` 可改用 Azure Trusted Signing(electron-builder 支持)。需在打包步骤改用
`azureSignOptions` 并提供 `AZURE_*` 凭据。本仓库默认走 `.pfx` 路径;如需切换告知维护者。
