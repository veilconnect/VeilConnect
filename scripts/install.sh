#!/usr/bin/env bash
#
# VeilConnect 一键安装（云服务器）。自动：① 装 Docker（缺则装）② 探测公网 IP
# ③ 生成 TURN 密钥 ④ 写 .env ⑤ 放行防火墙 ⑥ docker compose 起栈。
#
# 用法（在 git clone 进来的仓库根目录执行）：
#   sudo bash scripts/install.sh chat.example.com
#   sudo DOMAIN=chat.example.com bash scripts/install.sh
#   sudo bash scripts/install.sh           # 交互式询问域名
#
# 可选环境变量覆盖：EXTERNAL_IP（公网IP）、TURN_SECRET（共享密钥）
set -euo pipefail

cd "$(dirname "$0")/.."   # 切到仓库根目录
ROOT="$(pwd)"

c_green() { printf '\033[32m%s\033[0m\n' "$1"; }
c_red()   { printf '\033[31m%s\033[0m\n' "$1"; }
c_blue()  { printf '\033[36m%s\033[0m\n' "$1"; }
die()     { c_red "✖ $1"; exit 1; }

[ "$(id -u)" -eq 0 ] || die "请用 root 运行：sudo bash scripts/install.sh"
[ -f "$ROOT/docker-compose.yml" ] || die "未在仓库根目录找到 docker-compose.yml，请在 clone 出的目录内运行。"

# --- 1. 域名 ---
DOMAIN="${1:-${DOMAIN:-}}"
if [ -z "$DOMAIN" ]; then
  read -rp "请输入已解析到本机的域名（如 chat.example.com）: " DOMAIN
fi
[ -n "$DOMAIN" ] || die "域名不能为空。"

# --- 2. Docker ---
if ! command -v docker >/dev/null 2>&1; then
  c_blue "→ 未检测到 Docker，正在安装（get.docker.com 官方脚本）…"
  curl -fsSL https://get.docker.com | sh || die "Docker 安装失败"
  systemctl enable --now docker 2>/dev/null || true
fi
docker compose version >/dev/null 2>&1 || die "未找到 docker compose 插件，请升级 Docker 到含 compose v2 的版本。"
c_green "✓ Docker 就绪"

# --- 3. 公网 IP ---
EXTERNAL_IP="${EXTERNAL_IP:-}"
if [ -z "$EXTERNAL_IP" ]; then
  for url in https://api.ipify.org https://ifconfig.me https://icanhazip.com; do
    EXTERNAL_IP="$(curl -fsS --max-time 5 "$url" 2>/dev/null | tr -d '[:space:]')" && [ -n "$EXTERNAL_IP" ] && break
  done
fi
[ -n "$EXTERNAL_IP" ] || die "无法自动探测公网 IP，请用 EXTERNAL_IP=x.x.x.x 重试。"
c_green "✓ 公网 IP：$EXTERNAL_IP"

# --- 4. 生成 / 复用 .env（幂等：已存在则保留 TURN_SECRET） ---
if [ -f "$ROOT/.env" ] && grep -q '^TURN_SECRET=' "$ROOT/.env"; then
  TURN_SECRET="$(grep '^TURN_SECRET=' "$ROOT/.env" | head -1 | cut -d= -f2-)"
  c_blue "→ 复用已有 .env 中的 TURN_SECRET"
else
  TURN_SECRET="${TURN_SECRET:-$(openssl rand -hex 32)}"
fi
cat > "$ROOT/.env" <<EOF
DOMAIN=$DOMAIN
EXTERNAL_IP=$EXTERNAL_IP
TURN_SECRET=$TURN_SECRET
EOF
c_green "✓ 已写入 .env"

# --- 5. 防火墙（仅在 ufw 存在且 active 时操作） ---
if command -v ufw >/dev/null 2>&1 && ufw status 2>/dev/null | grep -q "Status: active"; then
  c_blue "→ 放行端口 80/443(tcp) 3478(udp+tcp) 49160-49200(udp)…"
  ufw allow 80/tcp >/dev/null; ufw allow 443/tcp >/dev/null
  ufw allow 3478/tcp >/dev/null; ufw allow 3478/udp >/dev/null
  ufw allow 49160:49200/udp >/dev/null
  c_green "✓ ufw 规则已添加"
else
  c_blue "→ 未启用 ufw，跳过本机防火墙。请确保云厂商安全组放行："
  echo "    80,443/tcp · 3478/udp+tcp · 49160-49200/udp"
fi

# --- 6. 起栈 ---
c_blue "→ 构建并启动（docker compose up -d --build，首次较慢）…"
docker compose up -d --build || die "docker compose 启动失败"

echo
c_green "════════════════════════════════════════════"
c_green " VeilConnect 已部署：https://$DOMAIN"
c_green "════════════════════════════════════════════"
echo "下一步验证："
echo "  1) curl -s https://$DOMAIN/health           # 期望 healthy"
echo "  2) curl -s https://$DOMAIN/turn-credentials # 期望返回 iceServers"
echo "  3) 浏览器打开 https://$DOMAIN ，设口令 → 创建房间 → 用另一台/另一网络打开链接 → 核对安全码"
echo
echo "查看日志： docker compose logs -f caddy   (证书签发)"
echo "          docker compose logs -f app|coturn"
echo
echo "⚠ 首次需等 Caddy 申请 Let's Encrypt 证书（数十秒），要求域名已解析到 $EXTERNAL_IP 且 80/443 可达。"
