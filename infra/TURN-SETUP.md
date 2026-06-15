# VeilConnect TURN / STUN 配置指南（中国环境）

## 背景
- 应用默认 ICE 现已改用**国内可达的 STUN**（Cloudflare / 小米 / B站），替换了在中国被墙的 Google STUN。
- 仅靠 STUN 可覆盖：同局域网、公网 IP、锥形 NAT、双方 IPv6 的用户。
- **对称 NAT / 运营商大内网（CGNAT，中国移动网络与许多宽带）必须 TURN 中继**才能远程连通。
- 所有数据始终端到端加密（Double Ratchet）；TURN/STUN 看不到内容，只看到元数据（双方 IP、时间、流量）。

## 运行时可调开关（localStorage，无需改代码）
| 键 | 作用 |
|---|---|
| `vc.turnEndpoint` | TURN 临时凭据签发端点 URL（Cloudflare Worker / 自建）|
| `vc.turn` | 直接配静态 TURN，JSON：`{"urls":"turn:host:3478","username":"u","credential":"p"}` |
| `vc.relayOnly` | `'1'` = 强制走 TURN 中继（隐藏双方真实 IP，流量绕服务器）|

## 方案 A：Cloudflare TURN（免费额度，省服务器）
1. 见 `cloudflare-turn-worker.js` 顶部注释，建 TURN App + 部署 Worker。
2. 把 Worker URL 填入 `DEFAULT_TURN_ENDPOINT`（`src/renderer/components/SimpleP2PChat.tsx`）或 `localStorage['vc.turnEndpoint']`。
- 优点：纯文字聊天几乎免费、免运维。
- 缺点：元数据经 Cloudflare（境外）；中国 UDP 链路偶有抖动。

## 方案 B：自建 coturn（推荐，元数据自控、境内最稳）
在有公网 IP 的境内 VPS（如腾讯云）上：

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
