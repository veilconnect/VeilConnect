# 可复现构建与子资源完整性（SRI）

> 浏览器端 E2EE 的根信任在"下发网页的服务器"。要把"部署者偷换脚本"从**不可检测**变为
> **可检测**，需要两件事：(1) 任何人能从源码构出**字节级相同**的产物；(2) 浏览器**强制校验**
> 所加载脚本的哈希。本项目对二者都提供了机制。

## 1. SRI（已内建，CI 强制）

- 构建后自动运行 `scripts/gen-sri.js`（`postbuild:web`）：
  - 给 `server/public/index.html` 的本地 `<script>`/样式表注入 `integrity="sha384-…"` + `crossorigin`。
    浏览器会**拒绝执行**哈希不符的脚本——部署者若篡改 bundle，页面直接报错而非静默中招。
  - 生成 `server/public/sri-manifest.json`（文件名 → sha384），作为对外公示与比对锚点。
- CI 步骤 `npm run sri:check` 校验注入的哈希与产物一致，防止"忘记重生成"。

> 注意：加密 Web Worker 由 `new Worker(url)` 加载，不经 `<script>` 标签，故其完整性由
> 同源 + CSP `worker-src 'self'` 约束；如需对 worker 也做哈希钉定，可改用 `Blob` + 预校验加载，
> 列为路线项。

## 2. 复现构建步骤

```bash
# 固定 Node 版本（建议 20 LTS）；严格按 lock 安装，杜绝版本漂移
nvm use 20
npm ci                 # 按 package-lock.json + integrity 安装，不解析新版本
npm run build:web      # 产出 server/public/*，并自动生成 sri-manifest.json
sha384sum server/public/main.*.js
cat server/public/sri-manifest.json
```

把你本地算出的 `sha384sum` 与官方发布页/manifest 公示的值逐一比对：
- **一致** → 你运行的就是公开源码构出的同一份字节。
- **不一致** → 该部署下发了与公开源码不同的脚本，**不要在其上输入口令/敏感内容**。

## 3. 决定可复现性的因素（已尽量收敛）
- `npm ci` + 钉死的密码学依赖（见 `docs/security/CRYPTO_RATIONALE.md`）消除依赖漂移。
- webpack 生产模式输出基于内容哈希命名（`main.<hash>.js`），内容变则名变。
- 时间戳/路径等非确定性来源：webpack 默认产物不含构建时间戳；如发现差异，固定 `NODE_OPTIONS`、
  locale、时区（`TZ=UTC`）后重试。

## 4. 仍未根除的部分（诚实声明）
SRI 能让"换脚本"**当场失败或被发现**，但**首次**拿到 index.html 仍来自部署者——一个恶意部署者
可以连 index.html 里的 integrity 一起改。要彻底摆脱"信任服务器现场下发代码"，唯一出路是
**签名分发的原生/移动客户端 + 自动更新校验签名**（路线项）。在此之前，请：
- 优先自建部署；
- 对第三方部署，核对 manifest 哈希、固定版本，或改用桌面客户端；
- 高威胁场景叠加 VPN/Tor 以对抗元数据观测。
