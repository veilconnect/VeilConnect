# VeilConnect 自部署指南（网页加密聊天）

VeilConnect 现在是一个**可自托管的网页端到端加密聊天工具**：你在自己的服务器上跑起来，任何人用浏览器打开网页即可加密聊天，无需安装任何客户端。

- 端到端加密在**浏览器内**完成（Double Ratchet / 每条消息级前向保密），服务器看不到明文。
- 信令服务器与 TURN 中继只搬运建连数据，**被视为不可信中继**。
- 防中间人靠**强制的安全码（SAS）带外核对**——连接后务必与对方电话/当面核对一致再聊天。

---

## 一、准备

- 一台 Linux 服务器，装好 Docker（脚本缺则自动装，并会确保 docker compose v2）。
- 放行端口：网页+HTTPS（默认 **80/443**，local 自签模式 **8080/8443**）、**3478/UDP+TCP**（TURN）、**49160-49200/UDP**（TURN relay）。
- HTTPS 是硬性要求（WebCrypto/WebRTC 需安全上下文）——下面三种模式分别解决证书来源。

## 二、一键安装（按你的条件三选一）

```bash
git clone <本仓库> veilconnect && cd veilconnect
```

**① 有公网域名（正式对外，最佳）**
```bash
sudo bash scripts/install.sh chat.example.com   # 域名须解析到本机、80/443 公网可达
```
Caddy 自动签发 Let's Encrypt 证书，访问 `https://chat.example.com`。

**② 有公网 IP 但没买域名**
```bash
sudo bash scripts/install.sh                     # 自动用 <公网IP>.sslip.io 作域名（真证书，免买域名）
```
同样需 80/443 公网可达（中国大陆云服务器多需备案/放通）。

**③ 局域网 / 无公网 / 先本机试用（免域名免备案）**
```bash
sudo bash scripts/install.sh --local             # 用本机 LAN IP + Caddy 自签证书，默认 8080/8443
```
访问 `https://<本机IP>:8443`，浏览器首次提示证书不受信任，点「高级 → 继续前往」信任即可（之后即为安全上下文，加密正常）。局域网内其它设备用同一地址访问。

脚本统一会：装 Docker（缺则装）+ 确保 docker compose v2 → 选定模式/域名 → 探测 IP → 生成 TURN 密钥 → 写 `.env` → 放行 ufw → `docker compose up -d --build`。重复运行幂等（复用已有 TURN 密钥）。
可用环境变量覆盖：`EXTERNAL_IP=` `TURN_SECRET=` `HTTP_PORT=` `HTTPS_PORT=`。

### 手动方式（等价）

```bash
cp .env.example .env        # 编辑 DOMAIN / EXTERNAL_IP / TURN_SECRET=$(openssl rand -hex 32)
docker compose up -d --build
```

栈内三个服务：
| 服务 | 作用 |
|---|---|
| `app` | 打包好的网页 SPA + 信令服务器（WebSocket 房间）+ `/turn-credentials` 签发 |
| `coturn` | 自托管 TURN 中继，穿透 NAT、隐藏双方真实 IP（relayOnly 默认开启） |
| `caddy` | 反向代理 + 自动 HTTPS，并透传 WebSocket |

## 三、使用

1. 打开网页 → 首次设置一个**口令**（用于加密保护本设备上的身份私钥）。
2. 点「创建房间」→ 得到一条分享链接，发给对方（通过可信渠道）。
3. 对方在浏览器打开链接 → 自动加入并建立加密连接。
4. **务必**与对方通过电话/当面核对屏幕上的**安全码**一致 → 点「一致，确认」后才能开始发消息。

## 四、安全模型与注意事项

- **必须 HTTPS**：浏览器的 WebCrypto 与 WebRTC 仅在安全上下文可用，本栈用 Caddy 自动 HTTPS 满足。
- **私钥保护弱于桌面版**：浏览器无操作系统 keychain，身份私钥经你的口令（PBKDF2-SHA256 600k 派生主密钥 + AES-GCM）加密后存于浏览器 IndexedDB；所有加密在 Web Worker 内完成，私钥不进入 UI 线程。忘记口令将无法恢复本设备身份——请用应用内的**加密身份导出**做备份，便于换设备恢复。
- **SAS 不可跳过**：信令服务器/TURN 即便作恶（试图替换密钥做中间人），只要双方带外核对安全码不一致即可发现。核对前输入框保持禁用。
- **元数据**：内容已端到端加密，但「谁在何时连接、IP」等元数据仍可能对中继方可见。高威胁场景请叠加 VPN/Tor，并仅用可信服务器。

## 五、本地联调（无需 TLS / TURN）

```bash
# 终端 1：构建并起信令服务器（本地同源）
npm install && npm run build:web
ALLOWED_ORIGINS="http://localhost:3001" PORT=3001 npm run serve
# 浏览器开两个标签访问 http://localhost:3001
#   localhost 是安全上下文豁免，WebCrypto 可用
#   本地无 TURN，需在两个标签的 DevTools 执行：localStorage.setItem('vc.relayOnly','0')
```

开发热重载（webpack dev server, 8080）：另需把信令地址指到 3001：
`localStorage.setItem('vc.signalingUrl','ws://localhost:3001')`。

## 六、自定义 TURN（可选）

默认 `/turn-credentials` 用内置 coturn 签发凭据，开箱即用。如要换外部 TURN：
- 静态：浏览器 `localStorage.setItem('vc.turn', JSON.stringify({urls:'turn:host:3478',username:'u',credential:'p'}))`
- 动态端点：`localStorage.setItem('vc.turnEndpoint','https://your-endpoint')`
