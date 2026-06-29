#!/usr/bin/env bash
#
# VeilConnect 一键部署 —— 普通用户零门槛，三种场景自动适配：
#
#   ① 有公网域名（推荐，正式对外）：
#       sudo bash scripts/install.sh chat.example.com
#       → Caddy 自动签发 Let's Encrypt 证书。需域名已解析到本机且 80/443 公网可达。
#
#   ② 有公网 IP 但没有域名：
#       sudo bash scripts/install.sh
#       → 自动用 <公网IP>.sslip.io 作域名（免买域名，仍是 Let's Encrypt 真证书）。
#         同样需要 80/443 公网可达（中国大陆云服务器多需备案/放通）。
#
#   ③ 局域网 / 无公网 / 想先本机试用：
#       sudo bash scripts/install.sh --local
#       → 用本机 LAN IP + Caddy 内置 CA 自签证书（免域名/免备案）。
#         浏览器首次访问点「信任/继续」即可。默认走 8080/8443 端口，避开既有 80/443 服务。
#
# 可选环境变量：EXTERNAL_IP、BIND_IP、TURN_SECRET、HTTP_PORT、HTTPS_PORT、TURN_TRANSPORT、SIGNAL_IP_HASH_SECRET、ROOM_TOKEN_HASH_SECRET、METRICS_READ_TOKEN
set -euo pipefail

cd "$(dirname "$0")/.."
ROOT="$(pwd)"

c_green() { printf '\033[32m%s\033[0m\n' "$1"; }
c_red()   { printf '\033[31m%s\033[0m\n' "$1"; }
c_blue()  { printf '\033[36m%s\033[0m\n' "$1"; }
die()     { c_red "✖ $1"; exit 1; }

[ "$(id -u)" -eq 0 ] || die "请用 root 运行：sudo bash scripts/install.sh"
[ -f "$ROOT/docker-compose.yml" ] || die "未在仓库根目录找到 docker-compose.yml，请在 clone 出的目录内运行。"

env_get() {
  local key="$1"
  [ -f "$ROOT/.env" ] || return 0
  grep "^${key}=" "$ROOT/.env" | head -1 | cut -d= -f2- || true
}

env_default() {
  local key="$1"
  local current="${!key:-}"
  if [ -n "$current" ]; then
    printf '%s' "$current"
  else
    env_get "$key"
  fi
}

# --- 1. Docker ---
if ! command -v docker >/dev/null 2>&1; then
  c_blue "→ 未检测到 Docker，正在安装（get.docker.com 官方脚本）…"
  curl -fsSL https://get.docker.com | sh || die "Docker 安装失败"
  systemctl enable --now docker 2>/dev/null || true
fi

# --- 2. docker compose：优先 v2 插件（与新版 Docker 兼容）；缺则自动安装；
#        独立版 docker-compose(v1) 与 Docker 25+ 已知不兼容(KeyError ContainerConfig)，仅作末路回退。
if docker compose version >/dev/null 2>&1; then
  COMPOSE="docker compose"
else
  c_blue "→ 未检测到 docker compose v2，正在安装 docker-compose-plugin…"
  (apt-get update -y && apt-get install -y docker-compose-plugin) >/dev/null 2>&1 || true
  if docker compose version >/dev/null 2>&1; then
    COMPOSE="docker compose"
  elif command -v docker-compose >/dev/null 2>&1; then
    COMPOSE="docker-compose"
    c_red "⚠ 仅找到旧版 docker-compose(v1)，与新版 Docker 可能不兼容；建议安装 docker-compose-plugin。"
  else
    die "未找到 docker compose，请手动安装 docker-compose-plugin 后重试。"
  fi
fi
c_green "✓ Docker 就绪（compose: $COMPOSE）"

# --- 3. 解析部署模式与域名 ---
ARG="${1:-${DOMAIN:-}}"
MODE=""           # public | local
CADDYFILE="$(env_default CADDYFILE)"; CADDYFILE="${CADDYFILE:-./Caddyfile}"
HTTP_PORT="$(env_default HTTP_PORT)"; HTTP_PORT="${HTTP_PORT:-80}"
HTTPS_PORT="$(env_default HTTPS_PORT)"; HTTPS_PORT="${HTTPS_PORT:-443}"
BIND_IP="$(env_default BIND_IP)"
EXTERNAL_IP="$(env_default EXTERNAL_IP)"
TURN_TRANSPORT="$(env_default TURN_TRANSPORT)"; TURN_TRANSPORT="${TURN_TRANSPORT:-both}"

if [ -z "$ARG" ] && [ "$CADDYFILE" = "./Caddyfile.local" ]; then
  ARG="--local"
elif [ -z "$ARG" ]; then
  ARG="$(env_get DOMAIN)"
fi

lan_ip() { ip -4 addr show scope global 2>/dev/null | grep -oE 'inet [0-9.]+' | awk '{print $2}' | grep -v '^127\.' | head -1; }
pub_ip() {
  local ip=""
  for url in https://api.ipify.org https://ifconfig.me https://icanhazip.com; do
    ip="$(curl -fsS --max-time 5 "$url" 2>/dev/null | tr -d '[:space:]')" && [ -n "$ip" ] && { echo "$ip"; return; }
  done
}

if [ "$ARG" = "--local" ] || [ "$ARG" = "local" ]; then
  MODE="local"
  EXTERNAL_IP="${EXTERNAL_IP:-$(lan_ip)}"
  [ -n "$EXTERNAL_IP" ] || die "无法探测本机 LAN IP，请用 EXTERNAL_IP=x.x.x.x 重试。"
  DOMAIN="$EXTERNAL_IP"
  BIND_IP="${BIND_IP:-$EXTERNAL_IP}"
  CADDYFILE="./Caddyfile.local"
  # 自签模式默认避开既有 80/443
  HTTP_PORT="${HTTP_PORT:-8080}"; [ "$HTTP_PORT" = "80" ] && HTTP_PORT=8080
  HTTPS_PORT="${HTTPS_PORT:-8443}"; [ "$HTTPS_PORT" = "443" ] && HTTPS_PORT=8443
else
  MODE="public"
  CADDYFILE="./Caddyfile"
  EXTERNAL_IP="${EXTERNAL_IP:-$(pub_ip)}"
  [ -n "$EXTERNAL_IP" ] || die "无法探测公网 IP。局域网/无公网请改用：sudo bash scripts/install.sh --local"
  BIND_IP="${BIND_IP:-0.0.0.0}"
  if [ -n "$ARG" ]; then
    DOMAIN="$ARG"                       # ① 显式域名
  else
    DOMAIN="${EXTERNAL_IP}.sslip.io"    # ② 公网 IP 无域名 → sslip.io 自动域名
    c_blue "→ 未提供域名，自动使用 $DOMAIN（基于公网 IP，免买域名）"
  fi
fi

# 浏览器实际 Origin（含非标准端口）；用于信令服务器 Origin 白名单
if [ "$HTTPS_PORT" = "443" ]; then PUBLIC_ORIGIN="https://$DOMAIN"; else PUBLIC_ORIGIN="https://$DOMAIN:$HTTPS_PORT"; fi
c_green "✓ 模式：$MODE · 域名/地址：$DOMAIN · 端口：${HTTP_PORT}/${HTTPS_PORT} · 监听：$BIND_IP · 出口IP：$EXTERNAL_IP"

# --- 4. 生成 / 复用 .env（幂等：保留已有 TURN_SECRET / 信令隐私密钥 / 房间摘要密钥） ---
TURN_SECRET="$(env_default TURN_SECRET)"
if [ -n "$TURN_SECRET" ]; then
  c_blue "→ 复用已有 .env 中的 TURN_SECRET"
else
  TURN_SECRET="$(openssl rand -hex 32)"
fi
SIGNAL_IP_HASH_SECRET="$(env_default SIGNAL_IP_HASH_SECRET)"
if [ -n "$SIGNAL_IP_HASH_SECRET" ]; then
  c_blue "→ 复用已有 .env 中的 SIGNAL_IP_HASH_SECRET"
else
  SIGNAL_IP_HASH_SECRET="$(openssl rand -hex 32)"
fi
ROOM_TOKEN_HASH_SECRET="$(env_default ROOM_TOKEN_HASH_SECRET)"
if [ -n "$ROOM_TOKEN_HASH_SECRET" ]; then
  c_blue "→ 复用已有 .env 中的 ROOM_TOKEN_HASH_SECRET"
else
  ROOM_TOKEN_HASH_SECRET="$(openssl rand -hex 32)"
fi
METRICS_READ_TOKEN="$(env_default METRICS_READ_TOKEN)"
if [ -n "$METRICS_READ_TOKEN" ]; then
  c_blue "→ 复用已有 .env 中的 METRICS_READ_TOKEN"
else
  METRICS_READ_TOKEN="$(openssl rand -hex 32)"
fi
# coturn 中继 SSRF 加固：仅公网模式禁止中继到环回/私网/链路本地/CGNAT，
# 防 network_mode:host 下 coturn 被当作打内网的跳板。local/LAN 模式必须留空，
# 否则会拒绝合法私网对端、打断局域网互连。可经环境变量 TURN_EXTRA_ARGS 覆盖。
TURN_EXTRA_ARGS="${TURN_EXTRA_ARGS:-$(env_default TURN_EXTRA_ARGS)}"
if [ -z "$TURN_EXTRA_ARGS" ] && [ "$MODE" = "public" ]; then
  TURN_EXTRA_ARGS="--no-loopback-peers --denied-peer-ip=10.0.0.0-10.255.255.255 --denied-peer-ip=172.16.0.0-172.31.255.255 --denied-peer-ip=192.168.0.0-192.168.255.255 --denied-peer-ip=169.254.0.0-169.254.255.255 --denied-peer-ip=100.64.0.0-100.127.255.255"
fi

cat > "$ROOT/.env" <<EOF
DOMAIN=$DOMAIN
EXTERNAL_IP=$EXTERNAL_IP
BIND_IP=$BIND_IP
TURN_SECRET=$TURN_SECRET
SIGNAL_IP_HASH_SECRET=$SIGNAL_IP_HASH_SECRET
ROOM_TOKEN_HASH_SECRET=$ROOM_TOKEN_HASH_SECRET
PERSISTENT_ROOM_STORE=/data/persistent-rooms.json
METRICS_READ_TOKEN=$METRICS_READ_TOKEN
HTTP_PORT=$HTTP_PORT
HTTPS_PORT=$HTTPS_PORT
CADDYFILE=$CADDYFILE
PUBLIC_ORIGIN=$PUBLIC_ORIGIN
TURN_TRANSPORT=$TURN_TRANSPORT
TURN_EXTRA_ARGS=$TURN_EXTRA_ARGS
EOF
chmod 600 "$ROOT/.env"   # 含 TURN_SECRET / 信令隐私密钥，限制为属主可读写
c_green "✓ 已写入 .env（chmod 600）"

# --- 5. 防火墙（仅在 ufw active 时操作） ---
if command -v ufw >/dev/null 2>&1 && LC_ALL=C ufw status 2>/dev/null | grep -q "Status: active"; then
  c_blue "→ 放行端口 ${HTTP_PORT}/${HTTPS_PORT}(tcp) 3478(udp+tcp) 49160-49200(udp)…"
  ufw allow ${HTTP_PORT}/tcp >/dev/null; ufw allow ${HTTPS_PORT}/tcp >/dev/null
  ufw allow 3478/tcp >/dev/null; ufw allow 3478/udp >/dev/null
  ufw allow 49160:49200/udp >/dev/null
  c_green "✓ ufw 规则已添加"
else
  c_blue "→ 未启用 ufw，跳过本机防火墙。云厂商安全组请放行：${HTTP_PORT},${HTTPS_PORT}/tcp · 3478/udp+tcp · 49160-49200/udp"
fi

# --- 6. 起栈 ---
c_blue "→ 构建并启动（$COMPOSE up -d --build，首次较慢）…"
$COMPOSE up -d --build || die "$COMPOSE 启动失败"

echo
c_green "════════════════════════════════════════════"
c_green " VeilConnect 已部署：$PUBLIC_ORIGIN"
c_green "════════════════════════════════════════════"
if [ "$MODE" = "local" ]; then
  echo "⚠ 自签证书：浏览器首次访问会提示「不安全」，点「高级 → 继续前往」即可正常使用（连接仍加密，且应用端到端加密与此证书无关）。"
  echo "  其它设备用同一地址 $PUBLIC_ORIGIN 访问。"
  echo "  彻底消除警告：在设备上访问 ${PUBLIC_ORIGIN}/root-ca.crt 下载根证书并安装到「受信任根证书」（每台装一次）。"
  echo "  要做到「任何设备零配置无警告」：改用域名部署 → sudo bash scripts/install.sh <你的域名>（Let's Encrypt 公网证书）。"
else
  echo "⚠ 首次需等 Caddy 申请 Let's Encrypt 证书（数十秒），要求域名 $DOMAIN 已解析到 $EXTERNAL_IP 且 ${HTTP_PORT}/${HTTPS_PORT} 公网可达。"
fi
echo "验证：curl -sk $PUBLIC_ORIGIN/health   # 期望 healthy"
echo "日志：$COMPOSE logs -f caddy|app|coturn"
