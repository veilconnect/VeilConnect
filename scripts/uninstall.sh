#!/usr/bin/env bash
#
# VeilConnect 一键卸载（与 install.sh 对称）。
#
#   sudo bash /opt/veilconnect/scripts/uninstall.sh            # 停栈 + 删容器/网络/卷/本地镜像
#   sudo bash /opt/veilconnect/scripts/uninstall.sh --purge    # 额外：移除 ufw 端口规则 + 删除安装目录
#   一行远程卸载：curl -fsSL <raw>/scripts/uninstall.sh | sudo bash -s -- --purge
#
# 说明：用户身份/密钥只存在各自浏览器(IndexedDB)，服务器端本就不保存任何聊天数据；
#       本脚本只清服务器端的容器/镜像/卷/配置/目录。
set -uo pipefail

[ "$(id -u)" -eq 0 ] || { echo "请用 root 运行：sudo bash scripts/uninstall.sh [--purge]"; exit 1; }
PURGE=0; [ "${1:-}" = "--purge" ] && PURGE=1

# 定位安装目录：脚本在仓库内则用其上级；被管道执行(curl|bash)则用 VEILCONNECT_DIR（默认 /opt/veilconnect）
DIR=""
if [ -n "${BASH_SOURCE:-}" ] && [ -f "$(dirname "${BASH_SOURCE:-}")/../docker-compose.yml" ]; then
  DIR="$(cd "$(dirname "${BASH_SOURCE}")/.." && pwd)"
else
  DIR="${VEILCONNECT_DIR:-/opt/veilconnect}"
fi
[ -f "$DIR/docker-compose.yml" ] || { echo "✖ 未找到安装目录($DIR/docker-compose.yml)。可设 VEILCONNECT_DIR= 指定。"; exit 1; }
cd "$DIR"

# compose 检测
if docker compose version >/dev/null 2>&1; then COMPOSE="docker compose"
elif command -v docker-compose >/dev/null 2>&1; then COMPOSE="docker-compose"
else COMPOSE=""; fi

# 读端口（用于 --purge 清 ufw 规则）
HTTP_PORT=80; HTTPS_PORT=443
[ -f "$DIR/.env" ] && {
  v=$(grep '^HTTP_PORT=' "$DIR/.env" | cut -d= -f2-); [ -n "$v" ] && HTTP_PORT="$v"
  v=$(grep '^HTTPS_PORT=' "$DIR/.env" | cut -d= -f2-); [ -n "$v" ] && HTTPS_PORT="$v"
}

echo "→ 停止并删除容器/网络/卷/镜像（含 caddy/coturn 基础镜像）…"
if [ -n "$COMPOSE" ]; then
  $COMPOSE down -v --rmi all --remove-orphans 2>/dev/null || true
fi
# 兜底：清理可能残留的同名容器、本项目镜像、命名卷
docker rm -f veilconnect-app-1 veilconnect-coturn-1 veilconnect-caddy-1 \
             veilconnect_app_1 veilconnect_coturn_1 veilconnect_caddy_1 2>/dev/null || true
docker images --format '{{.Repository}}:{{.Tag}} {{.ID}}' 2>/dev/null | grep -iE 'veilconnect' | awk '{print $2}' | xargs -r docker rmi -f 2>/dev/null || true
docker volume ls -q 2>/dev/null | grep -i veilconnect | xargs -r docker volume rm -f 2>/dev/null || true

if [ "$PURGE" = "1" ]; then
  if command -v ufw >/dev/null 2>&1 && ufw status 2>/dev/null | grep -q "Status: active"; then
    echo "→ 移除 ufw 端口规则…"
    for r in "${HTTP_PORT}/tcp" "${HTTPS_PORT}/tcp" 3478/tcp 3478/udp 49160:49200/udp; do
      ufw delete allow "$r" >/dev/null 2>&1 || true
    done
  fi
  echo "→ 清理悬空镜像与未使用的构建缓存（reclaim VeilConnect 构建残留）…"
  docker image prune -f >/dev/null 2>&1 || true
  docker builder prune -f >/dev/null 2>&1 || true
  echo "→ 删除安装目录 $DIR…"
  cd /    # 离开目录再删，避免删除运行中的 CWD
  rm -rf "$DIR"
fi

echo "✓ VeilConnect 已卸载。"
echo "  （浏览器端身份/密钥在各自浏览器 IndexedDB，如需清除请在浏览器「清除站点数据」。）"
