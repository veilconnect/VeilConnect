#!/usr/bin/env bash
#
# spin-instance.sh —— 一条命令在【全新 VPS + 全新域名】上拉起一个一次性 VeilConnect 实例，
# 供「域名/IP 被封即轮换」的抗封锁打法使用。封了就 --down 拆掉，换下一个域名再 spin 一个。
#
# 它只是把既有的 scripts/install.sh 推到远端执行（复用其密钥生成 / Let's Encrypt / 抗 SSRF 配置），
# 本机不接触任何实例密钥（TURN/IP 指纹等都在远端 .env 内生成，权限 600）。
#
# 用法：
#   拉起（有域名，自动 HTTPS）： scripts/spin-instance.sh up root@<VPS_IP> chat.example.com
#   拉起（无域名，用 sslip.io）： scripts/spin-instance.sh up root@<VPS_IP>
#   拆除（彻底删数据卷+目录）：   scripts/spin-instance.sh down root@<VPS_IP>
#   仅查看状态：                 scripts/spin-instance.sh status root@<VPS_IP>
#
# 前提：
#   - 远端是干净的 Ubuntu/Debian VPS，你有 root（或免密 sudo）SSH 访问。
#   - 用域名模式时，该域名的 A 记录须先指向 VPS 公网 IP，且 80/443 公网可达（Let's Encrypt 要求）。
#   - 本机有本仓库工作区（脚本会 rsync 构建上下文到远端，无需远端能访问私有 Git）。
#
# 设计取舍：默认【一次性】——不开持久化房间、易拆除。要长期实例请直接用 scripts/install.sh。
set -euo pipefail

SELF_DIR="$(cd "$(dirname "$0")/.." && pwd)"
REMOTE_DIR_DEFAULT="veilconnect-instance"
SSH_OPTS=(-o ConnectTimeout=15 -o StrictHostKeyChecking=accept-new)

c_green() { printf '\033[32m%s\033[0m\n' "$*"; }
c_red()   { printf '\033[31m%s\033[0m\n' "$*"; }
c_blue()  { printf '\033[36m%s\033[0m\n' "$*"; }
c_yellow(){ printf '\033[33m%s\033[0m\n' "$*"; }
die()     { c_red "✖ $*"; exit 1; }

usage() { sed -n '2,30p' "$0" | sed 's/^# \{0,1\}//'; exit "${1:-0}"; }

[ $# -ge 2 ] || usage 1
ACTION="$1"; TARGET="$2"; DOMAIN="${3:-}"
REMOTE_DIR="${REMOTE_DIR:-$REMOTE_DIR_DEFAULT}"

ssh_run() { ssh "${SSH_OPTS[@]}" "$TARGET" "$@"; }

require_repo() {
  [ -f "$SELF_DIR/docker-compose.yml" ] || die "未在仓库根目录找到 docker-compose.yml。"
  [ -f "$SELF_DIR/scripts/install.sh" ] || die "缺 scripts/install.sh。"
}

check_ssh() {
  c_blue "→ 测试 SSH 连接 $TARGET …"
  ssh_run 'echo ok' >/dev/null 2>&1 || die "无法 SSH 到 $TARGET（检查密钥/地址）。"
}

ensure_docker() {
  c_blue "→ 检查远端 Docker …"
  if ssh_run 'command -v docker >/dev/null 2>&1 && docker compose version >/dev/null 2>&1'; then
    c_green "  Docker 已就绪。"
  else
    c_yellow "  远端无 Docker，正在安装（get.docker.com）…"
    ssh_run 'curl -fsSL https://get.docker.com | sh' || die "Docker 安装失败。"
  fi
}

dns_precheck() {
  [ -n "$DOMAIN" ] || { c_yellow "  未给域名 → 远端将用 <公网IP>.sslip.io（仍是真证书）。"; return 0; }
  local host_ip dom_ip
  host_ip="$(ssh_run "curl -fsS --max-time 8 https://api.ipify.org || true")"
  dom_ip="$(getent ahostsv4 "$DOMAIN" 2>/dev/null | awk 'NR==1{print $1}')"
  if [ -n "$host_ip" ] && [ -n "$dom_ip" ] && [ "$host_ip" != "$dom_ip" ]; then
    c_yellow "  ⚠ $DOMAIN 解析为 $dom_ip，但 VPS 公网 IP 是 $host_ip。"
    c_yellow "    Let's Encrypt 签发会失败——请先把 A 记录指向 $host_ip 再继续。"
    read -r -p "    仍要继续吗？[y/N] " a; [ "$a" = y ] || [ "$a" = Y ] || die "已中止。"
  fi
}

push_context() {
  c_blue "→ 同步构建上下文到 $TARGET:~/$REMOTE_DIR …"
  ssh_run "mkdir -p ~/$REMOTE_DIR"
  # 排除项对齐 .dockerignore + 本机密钥/产物，绝不上传 .env / node_modules / .git。
  rsync -az --delete -e "ssh ${SSH_OPTS[*]}" \
    --exclude '.git' --exclude '.env' --exclude 'node_modules' --exclude '**/node_modules' \
    --exclude 'dist' --exclude 'dist-harness' --exclude 'release' --exclude 'coverage' \
    --exclude 'server/public' --exclude '**/*.map' \
    "$SELF_DIR"/ "$TARGET:~/$REMOTE_DIR/" \
    || die "rsync 失败。"
}

do_up() {
  require_repo; check_ssh; ensure_docker; dns_precheck; push_context
  c_blue "→ 在远端运行 install.sh（生成密钥 + 自动 HTTPS + 启动栈）…"
  # install.sh 需要 root；有域名就传域名，否则走 sslip.io。
  ssh_run "cd ~/$REMOTE_DIR && sudo bash scripts/install.sh ${DOMAIN:-}" || die "远端 install.sh 失败。"

  local url
  if [ -n "$DOMAIN" ]; then url="https://$DOMAIN"; else
    local ip; ip="$(ssh_run "curl -fsS --max-time 8 https://api.ipify.org")"; url="https://${ip}.sslip.io"
  fi
  c_blue "→ 健康检查 $url/health …"
  if ssh_run "curl -fsS --max-time 10 http://localhost:3001/health >/dev/null 2>&1"; then
    c_green "  信令进程健康。"
  else
    c_yellow "  本地健康检查未通过（可能仍在构建/签证书）。稍后用 'status' 复查。"
  fi
  echo
  c_green "✔ 实例已拉起：$url"
  c_yellow "  分享：把上面的链接通过【带外渠道】（当面/已建立的私密信道）发给对端，勿公开张贴。"
  c_yellow "  封了就轮换： scripts/spin-instance.sh down $TARGET   然后换新域名/新 VPS 再 up。"
}

do_down() {
  check_ssh
  c_blue "→ 拆除远端实例（down -v + 删目录，彻底清数据）…"
  ssh_run "cd ~/$REMOTE_DIR 2>/dev/null && sudo docker compose down -v --remove-orphans || true; rm -rf ~/$REMOTE_DIR"
  c_green "✔ 已拆除并清理 ~/$REMOTE_DIR（含数据卷）。"
}

do_status() {
  check_ssh
  ssh_run "cd ~/$REMOTE_DIR 2>/dev/null && sudo docker compose ps || echo '（无该目录/未部署）'"
  ssh_run "curl -fsS --max-time 8 http://localhost:3001/health || echo '（信令未响应）'"
}

case "$ACTION" in
  up)     do_up ;;
  down)   do_down ;;
  status) do_status ;;
  -h|--help|help) usage 0 ;;
  *) die "未知动作：$ACTION（用 up|down|status）" ;;
esac
