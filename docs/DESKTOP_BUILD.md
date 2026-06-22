# VeilConnect 桌面客户端：构建、签名与可复现发布

> **为什么有桌面端**：网页版的根信任始终在"下发 HTML/JS 的服务器"——恶意/被攻陷的部署者
> 能换脚本窃取私钥，这是浏览器端 E2EE 的物理天花板（SRI 只能让篡改可检测，无法根除）。
> 桌面端**只加载随签名安装包分发的本地代码**（`loadFile`，绝不加载远程），把根信任挪回
> **可独立审计、可复现构建、代码签名**的客户端本身。这是突破"高威胁场景适配"上限的唯一路径。

## 架构

```
src/main/electron/
├── main.ts          # 主进程：硬化 BrowserWindow + 注册 IPC + 钥匙串生命周期
├── preload.ts       # contextBridge 暴露 window.electronAPI（形状与 web 桥接完全一致）
├── ipcHandlers.ts   # channel→Manager 映射（与 crypto-worker.ts 逐条一致）
└── secureKeyStore.ts# OS 钥匙串(safeStorage)保护的 per-store 密钥库（无需用户口令）
```

渲染端（`src/renderer/*`）与网页版**同一份代码**：网页用 Worker 桥接 + 口令解锁；桌面由
preload 注入 `window.electronAPI` 并用 OS 钥匙串自动解锁（`index.tsx` 检测到
`window.electronAPI.keystore` 即跳过口令门禁）。

## 相对网页版的安全增益

| 维度 | 网页版 | 桌面版 |
|---|---|---|
| 代码来源 | 服务器每次现场下发（可被换） | 随签名包分发的本地代码（`loadFile`，篡改即签名失效） |
| 私钥保护 | 用户口令 PBKDF2 派生 + IndexedDB | **OS 钥匙串**（Keychain/DPAPI/libsecret），安全失败拒绝明文落盘 |
| 进程隔离 | Web Worker 软隔离 | 主进程/渲染进程硬隔离 + `sandbox` + `contextIsolation` |
| 远程导航 | 受 CSP 约束 | CSP + 拒绝一切非 file:// 导航与新窗口 + 禁用 webview |

## 已实现的窗口 / 进程 / IPC 硬化（经独立评审后加固）

- `contextIsolation: true`、`sandbox: true`、`nodeIntegration: false`、禁用 `webviewTag`。
- 导航白名单：只允许导航到**精确的打包入口** `dist/renderer/index.html`，其它一律拒绝。
- 外链白名单：交给系统浏览器的 URL 仅限 `http/https`，拒绝 `javascript:`/`data:`/自定义协议。
- 主进程兜底 CSP，含 `object-src 'none'` / `frame-src 'none'` / `frame-ancestors 'none'` / `base-uri 'self'`。
- 钥匙串强度校验：`safeStorage` 不可用即拒启动；Linux 退化为 `basic_text`（硬编码密钥）亦拒启动。
- 明文逃生口 `VEIL_ALLOW_PLAINTEXT_KEYRING` 仅在 `!app.isPackaged`（开发/测试）生效，**发布版恒禁用**。

> 仍待补强（路线项，见文末）：IPC 入参 schema 校验与最小权限化；对"导出私钥/清库/换身份"等
> 敏感操作要求本地用户确认或 OS 认证（防被污染的渲染端经合法 API 静默导出私钥）；Trusted Types；
> 收紧 `connect-src` 到固定域名。

## 本地构建（开发）

```bash
nvm use 20
npm ci
npm run build:electron     # 构建渲染端→dist/renderer + 编译主进程→dist/electron
npm run electron:dev       # 用本地 electron 启动（需先 npm i electron 的二进制）
```

> CI 与本仓库默认 `ELECTRON_SKIP_BINARY_DOWNLOAD=1` 只装类型不下二进制（类型检查足够）；
> 真要运行,请正常安装 electron 二进制(electron 是根 devDependency)。
>
> **打包依赖是隔离的**:`electron-builder` 不在根 `package.json`,而在 `desktop-build/`(独立
> `package-lock.json`,全树锁定 + integrity)。这样只做网页/自托管的贡献者无需拉这一大坨,
> 且发布构建走 `npm ci` 锁定校验、堵供应链口子。打包前先 `npm run desktop:deps` 装好它。

## 签名 + 公证打包（发布）

```bash
npm run desktop:deps       # 一次性:从 desktop-build/ 锁定 lockfile 装 electron-builder(npm ci 校验)
npm run dist               # build:electron + 用隔离的 electron-builder(按 electron-builder.yml)
```

签名机密**只来自 CI 环境变量/密钥库，绝不入库**：

| 平台 | 变量 |
|---|---|
| macOS 签名 | `CSC_LINK`(.p12 base64) · `CSC_KEY_PASSWORD` |
| macOS 公证 | `APPLE_ID` · `APPLE_APP_SPECIFIC_PASSWORD` · `APPLE_TEAM_ID` |
| Windows 签名 | `CSC_LINK` · `CSC_KEY_PASSWORD`（或 Azure Trusted Signing） |

产物：`release/` 下的 dmg/zip（mac）、nsis exe（win）、AppImage/deb（linux），均已签名。

## 可复现发布（让"换包"可被发现）

1. 固定工具链：`nvm use 20` + `npm ci`（按 lock + integrity 安装，无版本漂移）。
2. `electron-builder.yml` 已设 `npmRebuild: false`、`removePackageScripts: true` 收敛非确定性。
3. 发布时公布**未签名中间产物的哈希**（`dist/renderer`、`dist/electron`）；任何人重复上述步骤
   应得到相同字节，再比对哈希。签名是最后一层不可复现的封装，但被签名内容可复现。
4. 配合代码签名：用户既能验证"来自可信发布者"（签名），也能验证"内容来自公开源码"（哈希）。

## 仍未完成（诚实声明，路线项）
- 本仓库只装 electron **类型**、未跑实际打包/签名（需签名证书 + 各平台 runner）。
- 自动更新通道（`publish`）未启用；启用后更新包须同样校验签名。
- 桌面端渲染流程（跳过口令门禁、钥匙串自动解锁）已接线并通过类型检查，但尚无端到端
  GUI 测试覆盖，首次发布前需在三大平台实机联调。
- 第三方安全审计仍待进行（见 `docs/security/CRYPTO_RATIONALE.md` 路线）。
