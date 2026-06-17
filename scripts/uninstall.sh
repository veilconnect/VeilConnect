#!/usr/bin/env bash
#
# VeilConnect 一键卸载（默认即自动彻底清理全部残留）。
#
#   sudo bash /opt/veilconnect/scripts/uninstall.sh             # 自动清全部：容器/网络/卷/全部镜像/构建缓存/ufw规则/安装目录
#   sudo bash /opt/veilconnect/scripts/uninstall.sh --keep-dir   # 保留安装目录与 .env（其余照清）
#   sudo bash /opt/veilconnect/scripts/uninstall.sh --keep-cache # 不动全局悬空镜像/构建缓存（多项目共用机器时用）
#   一行远程：curl -fsSL <raw>/scripts/uninstall.sh | sudo bash
#
# 说明：用户身份/密钥只存在各自浏览器(IndexedDB)，服务器端本就不保存任何聊天数据；
#       本脚本默认自动清除服务器端的容器/镜像/卷/构建缓存/ufw 规则/安装目录，无需额外参数。
set -uo pipefail

[ "$(id -u)" -eq 0 ] || { echo "请用 root 运行：sudo bash scripts/uninstall.sh [--keep-dir] [--keep-cache]"; exit 1; }

# 默认全清；可选保留项。兼容旧的 --purge（现为默认行为，等价无操作）。
KEEP_DIR=0; KEEP_CACHE=0
for a in "$@"; do
  case "$a" in
    --keep-dir)   KEEP_DIR=1 ;;
    --keep-cache) KEEP_CACHE=1 ;;
    --purge|"")   ;;  # 兼容：彻底清理已是默认
    *) echo "未知参数: $a（可用 --keep-dir / --keep-cache）" ;;
  esac
done

# 定位安装目录：脚本在仓库内则用其上级；被管道执行(curl|bash)则用 VEILCONNECT_DIR（默认 /opt/veilconnect）
if [ -n "${BASH_SOURCE:-}" ] && [ -f "$(dirname "${BASH_SOURCE:-}")/../docker-compose.yml" ]; then
  DIR="$(cd "$(dirname "${BASH_SOURCE}")/.." && pwd)"
else
  DIR="${VEILCONNECT_DIR:-/opt/veilconnect}"
fi

# compose 检测
if docker compose version >/dev/null 2>&1; then COMPOSE="docker compose"
elif command -v docker-compose >/dev/null 2>&1; then COMPOSE="docker-compose"
else COMPOSE=""; fi

# 读端口（用于清 ufw 规则）；目录不在时退默认值
HTTP_PORT=80; HTTPS_PORT=443
if [ -f "$DIR/.env" ]; then
  v=$(grep '^HTTP_PORT='  "$DIR/.env" | cut -d= -f2-); [ -n "$v" ] && HTTP_PORT="$v"
  v=$(grep '^HTTPS_PORT=' "$DIR/.env" | cut -d= -f2-); [ -n "$v" ] && HTTPS_PORT="$v"
fi

echo "→ 停止并删除容器/网络/卷/镜像（含 caddy/coturn 基础镜像）…"
if [ -n "$COMPOSE" ] && [ -f "$DIR/docker-compose.yml" ]; then
  ( cd "$DIR" && $COMPOSE down -v --rmi all --remove-orphans 2>/dev/null ) || true
fi
# 兜底：按名清理可能残留的容器/镜像/卷（即便 compose 文件已丢失也清干净）
docker rm -f veilconnect-app-1 veilconnect-coturn-1 veilconnect-caddy-1 \
             veilconnect_app_1 veilconnect_coturn_1 veilconnect_caddy_1 2>/dev/null || true
docker images --format '{{.Repository}}:{{.Tag}} {{.ID}}' 2>/dev/null | grep -iE 'veilconnect' | awk '{print $2}' | xargs -r docker rmi -f 2>/dev/null || true
docker volume ls -q 2>/dev/null | grep -i veilconnect | xargs -r docker volume rm -f 2>/dev/null || true

# ufw 规则（VeilConnect 自己加的端口，安全移除）
if command -v ufw >/dev/null 2>&1 && LC_ALL=C ufw status 2>/dev/null | grep -q "Status: active"; then
  echo "→ 移除 ufw 端口规则…"
  for r in "${HTTP_PORT}/tcp" "${HTTPS_PORT}/tcp" 3478/tcp 3478/udp 49160:49200/udp; do
    ufw delete allow "$r" >/dev/null 2>&1 || true
  done
fi

# 悬空镜像与未使用构建缓存（默认清；--keep-cache 跳过，避免多项目共用机器误伤）
if [ "$KEEP_CACHE" = "0" ]; then
  echo "→ 清理悬空镜像与未使用的构建缓存…"
  docker image prune -f >/dev/null 2>&1 || true
  docker builder prune -f >/dev/null 2>&1 || true
fi

# 安装目录（默认删；--keep-dir 保留）
if [ "$KEEP_DIR" = "0" ] && [ -d "$DIR" ]; then
  echo "→ 删除安装目录 $DIR…"
  cd /    # 离开目录再删，避免删除运行中的 CWD
  rm -rf "$DIR"
fi

echo "✓ VeilConnect 已彻底卸载，残留已自动清理。"
echo "  （浏览器端身份/密钥在各自浏览器 IndexedDB，如需清除请在浏览器「清除站点数据」。）"
