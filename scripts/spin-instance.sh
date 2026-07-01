#!/usr/bin/env bash
#
# spin-instance.sh —— 一条命令拉起/拆除一个【一次性】VeilConnect 实例，供「封了即轮换」抗封锁打法。
#
# 两种用法：
#   A) 你已有 VPS（自己开好的机器）：
#        scripts/spin-instance.sh up   root@<VPS_IP> [chat.example.com]
#        scripts/spin-instance.sh down root@<VPS_IP>
#        scripts/spin-instance.sh status root@<VPS_IP>
#
#   B) 连 VPS 都帮你开（调云 API 自动开机器 → 部署 → 用完 destroy 删机器）：
#        HCLOUD_TOKEN=xxx  scripts/spin-instance.sh provision hetzner [chat.example.com]
#        VULTR_API_KEY=xxx scripts/spin-instance.sh provision vultr   [chat.example.com]
#        scripts/spin-instance.sh destroy hetzner <server_id>
#        scripts/spin-instance.sh destroy vultr   <instance_id>
#      不给域名 → 自动用 <公网IP>.sslip.io（真 Let's Encrypt 证书，全自动，无需手动 DNS）。
#      给自定义域名 → 需在【开机后】把 A 记录指向新 IP；provision 会打印 IP 并等待你确认。
#
# 复用既有 scripts/install.sh 在【远端】生成密钥并起栈——实例密钥（TURN/IP 指纹等）只在远端 .env
# 内生成，权限 600，本机与云 API 都不接触。
#
# 前提：本机有本仓库、ssh/rsync/curl/python3、以及一把 SSH 公钥（~/.ssh/id_*.pub）。
# 代理坏掉时可设 SPIN_CURL_OPTS="--noproxy *" 让 API 调用直连。
set -euo pipefail

SELF_DIR="$(cd "$(dirname "$0")/.." && pwd)"
REMOTE_DIR="${REMOTE_DIR:-veilconnect-instance}"
SSH_OPTS=(-o ConnectTimeout=15 -o StrictHostKeyChecking=accept-new -o UserKnownHostsFile="${HOME}/.ssh/known_hosts")
# shellcheck disable=SC2206
CURL_EXTRA=(${SPIN_CURL_OPTS:-})

c_green() { printf '\033[32m%s\033[0m\n' "$*"; }
c_red()   { printf '\033[31m%s\033[0m\n' "$*"; }
c_blue()  { printf '\033[36m%s\033[0m\n' "$*"; }
c_yellow(){ printf '\033[33m%s\033[0m\n' "$*"; }
die()     { c_red "✖ $*"; exit 1; }
require_cmd() { command -v "$1" >/dev/null 2>&1 || die "需要命令：$1"; }
# 从 stdin 的 JSON 取值：jval "表达式(以 d 为根)"，如 jval "d['server']['id']"
jval() { python3 -c "import sys,json
try:
    d=json.load(sys.stdin); print($1)
except Exception:
    pass"; }

usage() { sed -n '2,37p' "$0" | sed 's/^# \{0,1\}//'; exit "${1:-0}"; }

# ---------- 通用 SSH / 部署（沿用已有 install.sh） ----------
TARGET=""; DOMAIN=""
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
    c_yellow "    Let's Encrypt 会失败——先把 A 记录指向 $host_ip 再继续。"
    read -r -p "    仍要继续吗？[y/N] " a; [ "$a" = y ] || [ "$a" = Y ] || die "已中止。"
  fi
}
push_context() {
  c_blue "→ 同步构建上下文到 $TARGET:~/$REMOTE_DIR …"
  ssh_run "mkdir -p ~/$REMOTE_DIR"
  rsync -az --delete -e "ssh ${SSH_OPTS[*]}" \
    --exclude '.git' --exclude '.env' --exclude 'node_modules' --exclude '**/node_modules' \
    --exclude 'dist' --exclude 'dist-harness' --exclude 'release' --exclude 'coverage' \
    --exclude 'server/public' --exclude '**/*.map' \
    "$SELF_DIR"/ "$TARGET:~/$REMOTE_DIR/" || die "rsync 失败。"
}
do_up() {
  require_repo; check_ssh; ensure_docker; dns_precheck; push_context
  c_blue "→ 远端运行 install.sh（生成密钥 + 自动 HTTPS + 启动栈）…"
  ssh_run "cd ~/$REMOTE_DIR && sudo bash scripts/install.sh ${DOMAIN:-}" || die "远端 install.sh 失败。"
  local url ip
  if [ -n "$DOMAIN" ]; then url="https://$DOMAIN"; else
    ip="$(ssh_run "curl -fsS --max-time 8 https://api.ipify.org")"; url="https://${ip}.sslip.io"
  fi
  c_blue "→ 健康检查 …"
  if ssh_run "curl -fsS --max-time 10 http://localhost:3001/health >/dev/null 2>&1"; then
    c_green "  信令进程健康。"
  else
    c_yellow "  本地健康检查未过（可能仍在构建/签证书），稍后用 status 复查。"
  fi
  echo; c_green "✔ 实例已拉起：$url"
  c_yellow "  分享：把链接通过【带外私密渠道】发给对端，勿公开张贴。"
}
do_down() {
  check_ssh
  c_blue "→ 拆除远端实例（down -v + 删目录）…"
  ssh_run "cd ~/$REMOTE_DIR 2>/dev/null && sudo docker compose down -v --remove-orphans || true; rm -rf ~/$REMOTE_DIR"
  c_green "✔ 已拆除并清理 ~/$REMOTE_DIR（含数据卷）。"
}
do_status() {
  check_ssh
  ssh_run "cd ~/$REMOTE_DIR 2>/dev/null && sudo docker compose ps || echo '（无该目录/未部署）'"
  ssh_run "curl -fsS --max-time 8 http://localhost:3001/health || echo '（信令未响应）'"
}

# ---------- 云 API 自动开/删机器 ----------
find_pubkey() {
  local f
  for f in "$HOME"/.ssh/id_ed25519.pub "$HOME"/.ssh/id_rsa.pub "$HOME"/.ssh/id_ecdsa.pub; do
    [ -f "$f" ] && { echo "$f"; return 0; }
  done
  die "未找到 SSH 公钥（~/.ssh/id_*.pub）。先 ssh-keygen -t ed25519 生成一把。"
}
wait_ssh() {
  local ip="$1" i
  c_blue "→ 等待 $ip SSH 就绪（新机器开机 + SSH 起来，约 30–120s）…"
  for i in $(seq 1 60); do
    ssh "${SSH_OPTS[@]}" -o BatchMode=yes "root@$ip" 'echo ok' >/dev/null 2>&1 && { c_green "  SSH 就绪。"; return 0; }
    sleep 5
  done
  die "$ip SSH 一直连不上（检查云控制台/安全组是否放通 22）。"
}
confirm_spend() {
  [ "${SPIN_YES:-0}" = 1 ] && return 0
  c_yellow "  即将在 $1 创建一台按小时计费的 VPS（用完请务必 destroy 以停止计费）。"
  read -r -p "  继续？[y/N] " a; [ "$a" = y ] || [ "$a" = Y ] || die "已取消。"
}

# --- Hetzner Cloud ---
hetzner_api() { # method path [body]
  local m="$1" p="$2" b="${3:-}"; local a=(-s "${CURL_EXTRA[@]}" -m 40 -H "Authorization: Bearer ${HCLOUD_TOKEN:-}" -H "Content-Type: application/json" -X "$m" "https://api.hetzner.cloud/v1$p")
  [ -n "$b" ] && a+=(-d "$b"); curl "${a[@]}"
}
hetzner_ensure_key() { # echo -> key name
  local pub name body existing
  pub="$(cat "$(find_pubkey)")"; name="veilconnect-spin"
  existing="$(hetzner_api GET "/ssh_keys" | python3 -c "import sys,json
d=json.load(sys.stdin); pk=sys.argv[1].split()[:2]
print(next((k['name'] for k in d.get('ssh_keys',[]) if k.get('public_key','').split()[:2]==pk), ''))" "$pub")"
  if [ -n "$existing" ]; then echo "$existing"; return 0; fi
  body="$(python3 -c "import json,sys; print(json.dumps({'name':sys.argv[1],'public_key':sys.argv[2]}))" "$name" "$pub")"
  hetzner_api POST "/ssh_keys" "$body" >/dev/null || true   # 已存在(同料不同名)时忽略
  echo "$name"
}
hetzner_create() { # echo -> "IP SERVER_ID"
  [ -n "${HCLOUD_TOKEN:-}" ] || die "缺 HCLOUD_TOKEN（Hetzner Cloud API token）。"
  require_cmd curl; require_cmd python3
  local key name body resp ip id
  key="$(hetzner_ensure_key)"
  name="vc-$(date +%s)"
  body="$(python3 -c "import json,sys
print(json.dumps({'name':sys.argv[1],'server_type':'${HCLOUD_TYPE:-cx22}','image':'${HCLOUD_IMAGE:-ubuntu-24.04}','location':'${HCLOUD_LOCATION:-ash}','ssh_keys':[sys.argv[2]],'public_net':{'enable_ipv4':True,'enable_ipv6':True}}))" "$name" "$key")"
  resp="$(hetzner_api POST "/servers" "$body")"
  ip="$(printf '%s' "$resp" | jval "d['server']['public_net']['ipv4']['ip']")"
  id="$(printf '%s' "$resp" | jval "d['server']['id']")"
  [ -n "$ip" ] && [ -n "$id" ] || die "Hetzner 创建失败：$(printf '%s' "$resp" | jval "d.get('error',{}).get('message','未知错误')")"
  echo "$ip $id"
}
hetzner_delete() {
  [ -n "${HCLOUD_TOKEN:-}" ] || die "缺 HCLOUD_TOKEN。"
  hetzner_api DELETE "/servers/$1" >/dev/null && c_green "✔ 已删除 Hetzner 服务器 $1。" || die "删除失败。"
}

# --- Vultr ---
vultr_api() { # method path [body]
  local m="$1" p="$2" b="${3:-}"; local a=(-s "${CURL_EXTRA[@]}" -m 40 -H "Authorization: Bearer ${VULTR_API_KEY:-}" -H "Content-Type: application/json" -X "$m" "https://api.vultr.com/v2$p")
  [ -n "$b" ] && a+=(-d "$b"); curl "${a[@]}"
}
vultr_os_id() {
  local id="${VULTR_OS_ID:-}"
  [ -n "$id" ] && { echo "$id"; return; }
  vultr_api GET "/os?per_page=500" | jval "next((str(o['id']) for o in d.get('os',[]) if o.get('name','').startswith('Ubuntu 24.04') and o.get('arch')=='x64'), '')"
}
vultr_ensure_key() { # echo -> sshkey id
  local pub existing body
  pub="$(cat "$(find_pubkey)")"
  existing="$(vultr_api GET "/ssh-keys?per_page=500" | python3 -c "import sys,json
d=json.load(sys.stdin); pk=sys.argv[1].split()[:2]
print(next((k['id'] for k in d.get('ssh_keys',[]) if k.get('ssh_key','').split()[:2]==pk), ''))" "$pub")"
  if [ -n "$existing" ]; then echo "$existing"; return 0; fi
  body="$(python3 -c "import json,sys; print(json.dumps({'name':'veilconnect-spin','ssh_key':sys.argv[1]}))" "$pub")"
  vultr_api POST "/ssh-keys" "$body" | jval "d['ssh_key']['id']"
}
vultr_create() { # echo -> "IP INSTANCE_ID"
  [ -n "${VULTR_API_KEY:-}" ] || die "缺 VULTR_API_KEY（Vultr API key）。"
  require_cmd curl; require_cmd python3
  local os key body resp id ip i
  os="$(vultr_os_id)"; [ -n "$os" ] || die "找不到 Ubuntu 24.04 的 os_id（可设 VULTR_OS_ID 覆盖）。"
  key="$(vultr_ensure_key)"; [ -n "$key" ] || die "SSH key 注册失败。"
  body="$(python3 -c "import json,sys
print(json.dumps({'region':'${VULTR_REGION:-ewr}','plan':'${VULTR_PLAN:-vc2-1c-1gb}','os_id':int(sys.argv[1]),'sshkey_id':[sys.argv[2]],'label':'vc-'+sys.argv[3],'hostname':'vc-'+sys.argv[3]}))" "$os" "$key" "$(date +%s)")"
  resp="$(vultr_api POST "/instances" "$body")"
  id="$(printf '%s' "$resp" | jval "d['instance']['id']")"
  [ -n "$id" ] || die "Vultr 创建失败：$(printf '%s' "$resp" | jval "d.get('error','未知错误')")"
  c_blue "→ 等待 Vultr 分配公网 IP …"
  for i in $(seq 1 60); do
    ip="$(vultr_api GET "/instances/$id" | jval "d['instance']['main_ip']")"
    [ -n "$ip" ] && [ "$ip" != "0.0.0.0" ] && break
    sleep 5
  done
  [ -n "$ip" ] && [ "$ip" != "0.0.0.0" ] || die "等待 IP 超时（instance $id）。"
  echo "$ip $id"
}
vultr_delete() {
  [ -n "${VULTR_API_KEY:-}" ] || die "缺 VULTR_API_KEY。"
  vultr_api DELETE "/instances/$1" >/dev/null && c_green "✔ 已删除 Vultr 实例 $1。" || die "删除失败。"
}

do_provision() {
  local provider="$TARGET" out ip id   # 复用 $2 作为 provider
  require_repo; require_cmd python3; require_cmd curl; require_cmd ssh; require_cmd rsync
  case "$provider" in
    hetzner) confirm_spend Hetzner; out="$(hetzner_create)" ;;
    vultr)   confirm_spend Vultr;   out="$(vultr_create)" ;;
    *) die "未知 provider：$provider（支持 hetzner|vultr）" ;;
  esac
  ip="${out% *}"; id="${out#* }"
  c_green "✔ 已开机：$provider 服务器 IP=$ip  ID=$id"
  wait_ssh "$ip"
  TARGET="root@$ip"    # 交给既有部署流程（DOMAIN 已由 $3 填好；空则 sslip.io）
  do_up
  echo
  c_yellow "  ★ 记下拆除命令（用完务必执行，否则持续计费）："
  c_yellow "      scripts/spin-instance.sh destroy $provider $id"
}
do_destroy() {
  local provider="$TARGET" id="$DOMAIN"   # 复用 $2=provider $3=server_id
  [ -n "$id" ] || die "用法：destroy <hetzner|vultr> <server_id>"
  case "$provider" in
    hetzner) hetzner_delete "$id" ;;
    vultr)   vultr_delete "$id" ;;
    *) die "未知 provider：$provider" ;;
  esac
}

# ---------- 入口 ----------
[ $# -ge 1 ] || usage 1
ACTION="$1"; TARGET="${2:-}"; DOMAIN="${3:-}"
case "$ACTION" in
  up)        [ -n "$TARGET" ] || usage 1; do_up ;;
  down)      [ -n "$TARGET" ] || usage 1; do_down ;;
  status)    [ -n "$TARGET" ] || usage 1; do_status ;;
  provision) [ -n "$TARGET" ] || usage 1; do_provision ;;
  destroy)   [ -n "$TARGET" ] || usage 1; do_destroy ;;
  -h|--help|help) usage 0 ;;
  *) die "未知动作：$ACTION（用 up|down|status|provision|destroy）" ;;
esac
