# VeilConnect TURN / STUN 配置指南（中国环境）

## 背景
- **`relayOnly` 现在默认开启**（安全优先）：连接只用 TURN 的 relay 候选，**隐藏双方真实 IP，邀请码(SDP)里也不出现真实 IP**。因此**必须配置可用 TURN**（见下方方案）连接才能建立；否则点「建连」会收到告警且连不上。
  - 要放弃此保护以换连通性：显式设 `localStorage.vc.relayOnly = '0'`。
- 关闭 relayOnly 后才用 STUN：优先 **Cloudflare STUN**（境外），启动探测其可达性，**仅当 Cloudflare 不可达才回退小米 / B站**（中国节点，最后兜底）。
  - 说明：RTCPeerConnection 的 `iceServers` 是并行查询、无原生串行回退，故「不可用才回退」由一次 srflx 候选探测（约 1.5s 超时）实现。relay 模式下根本不接触 STUN。
- **对称 NAT / 运营商大内网（CGNAT）必须 TURN 中继**；relayOnly 默认开后本就强制走 TURN。
- 所有数据始终端到端加密（Double Ratchet）；TURN/STUN 看不到内容，只看到元数据（IP、时间、流量）。

## ⚠️ 威胁模型须知（目标：不被中国相关方截获）
- **内容**：端到端加密，STUN/TURN/运营商/GFW 都读不到明文。这部分安全。
- **元数据 = 取决于中继的司法管辖**：relay 把信任收敛到 TURN 服务器一家，但那家就能看到双方 IP + 流量时序。
  - 用**中国境内**的 TURN（如腾讯云 coturn）= 把元数据直接交给对手管辖。**反此目标。**
  - 用 **Cloudflare（美国）TURN** = 元数据交给境外一家，对「防中国」可接受但非零信任。
  - 最强：自建 TURN 放在**可信境外**司法管辖。
- **邀请码渠道**：开 relayOnly 后 SDP 不含真实 IP，但「连接发生过」仍会暴露——邀请码与安全码请走可信带外渠道（勿用微信系）。
- **DPI / 流量指纹**：本应用无抗审查传输，WebRTC/DTLS 可被识别。如需隐藏「在用此类工具」，请把整个 App 套 VPN/Tor（本软件范围之外）。

## 运行时可调开关（localStorage，无需改代码）
| 键 | 作用 |
|---|---|
| `vc.relayOnly` | **默认 `'1'`（开）**：强制走 TURN 中继，隐藏双方真实 IP。设 `'0'` 关闭（暴露真实 IP 换连通）|
| `vc.turnEndpoint` | TURN 临时凭据签发端点 URL（推荐 Cloudflare Worker / 自建）|
| `vc.turn` | 直接配静态 TURN，JSON：`{"urls":"turn:host:3478","username":"u","credential":"p"}` |

## 方案 A：Cloudflare TURN（当前选定方案；免费额度、省服务器）
1. 见 `cloudflare-turn-worker.js` 顶部注释，建 TURN App + 部署 Worker。
2. 把 Worker URL 填入 `DEFAULT_TURN_ENDPOINT`（`src/renderer/components/SimpleP2PChat.tsx`）或 `localStorage['vc.turnEndpoint']`。
3. relayOnly 默认已开，配好后即「真实 IP 不出本机、全程经 Cloudflare 中继」。
- 优点：纯文字聊天几乎免费、免运维；元数据集中在境外一家（对「防中国」优于境内）。
- 缺点：信任与元数据集中在 Cloudflare（美国）一家；GFW 若封 Cloudflare 则连不上（relayOnly 下不会降级泄露 IP，而是连接失败）。

## 方案 B：自建 coturn（元数据自控；**为本目标须放在可信境外**）
> 注意：原文示例用境内腾讯云——那会把元数据交到中国管辖，**与「防中国截获」目标相悖**。
> 为此目标请选**可信境外**司法管辖的 VPS。下面的安装步骤通用，差别只在机房位置。

在有公网 IP 的 VPS（**境外、可信管辖**）上：

```bash
sudo apt-get update && sudo apt-get install -y coturn
sudo sed -i 's/#TURNSERVER_ENABLED=1/TURNSERVER_ENABLED=1/' /etc/default/coturn
```
`/etc/turnserver.conf` 关键项（用时效凭据，客户端无需账号）：
```
listening-port=3478
fingerprint
use-auth-secret
static-auth-secret=<生成一串足够长的随机密钥>
realm=veilconnect
total-quota=0
no-tcp-relay            # 仅按需
no-multicast-peers
# TLS（可选，更隐蔽）：tls-listening-port=5349 + cert/pkey
min-port=49152
max-port=65535
```
```bash
sudo systemctl enable --now coturn
```
**腾讯云安全组放行**：`3478 UDP+TCP`、（TLS）`5349 TCP`、中继端口段 `49152-65535 UDP`。

### 客户端如何拿 coturn 的时效凭据（use-auth-secret / 无账号）
`username = <过期时间戳>`，`credential = base64(HMAC-SHA1(username, static-auth-secret))`。
两种接法：
- 用一个极小后端/Worker 按上式算好后通过 `vc.turnEndpoint` 返回 `{iceServers:{urls,username,credential}}`；
- 或简单起步：先用**静态长期凭据**（coturn 用 `lt-cred-mech` + `user=用户:密码`），把 `{"urls":"turn:你的IP:3478","username":"...","credential":"..."}` 写进 `vc.turn` / `DEFAULT_TURN_ENDPOINT` 返回值。生产建议用上面的时效方案。

## 容量参考（纯文字，1 万用户）
STUN 几乎免费；TURN 瓶颈是「并发中继会话数 × 每会话带宽」。文字场景一台 **4核8G / 百兆带宽** coturn 足以支撑 1 万用户。详见对话记录中的容量估算。
