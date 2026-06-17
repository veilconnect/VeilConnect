#!/usr/bin/env bash
#
# VeilConnect 一行引导安装 —— 空白服务器零手工下载。
#
#   curl -fsSL https://raw.githubusercontent.com/veilconnect/VeilConnect/main/scripts/bootstrap.sh | sudo bash -s -- --local
#   curl -fsSL https://raw.githubusercontent.com/veilconnect/VeilConnect/main/scripts/bootstrap.sh | sudo bash -s -- chat.example.com
#   curl -fsSL https://raw.githubusercontent.com/veilconnect/VeilConnect/main/scripts/bootstrap.sh | sudo bash         # 公网IP无域名→sslip.io
#
# 本脚本自动：装 git（缺则装）→ 克隆/更新仓库到 /opt/veilconnect → 调用 scripts/install.sh
# （install.sh 再负责装 Docker/compose、生成配置、起栈）。透传所有参数给 install.sh。
set -euo pipefail

REPO="${VEILCONNECT_REPO:-https://github.com/veilconnect/VeilConnect.git}"
BRANCH="${VEILCONNECT_BRANCH:-main}"
DIR="${VEILCONNECT_DIR:-/opt/veilconnect}"

[ "$(id -u)" -eq 0 ] || { echo "请用 root 运行：… | sudo bash -s -- [域名|--local]"; exit 1; }

# 1. 安装 git（apt / dnf / yum 自适配）
if ! command -v git >/dev/null 2>&1; then
  echo "→ 安装 git…"
  if   command -v apt-get >/dev/null 2>&1; then apt-get update -y && apt-get install -y git ca-certificates curl
  elif command -v dnf     >/dev/null 2>&1; then dnf install -y git ca-certificates curl
  elif command -v yum     >/dev/null 2>&1; then yum install -y git ca-certificates curl
  else echo "✖ 无法自动安装 git，请手动安装后重试"; exit 1; fi
fi

# 2. 获取仓库（git clone 带重试；失败回退到 tarball——中国访问 github 常间歇性 TLS 中断）
TARBALL="${VEILCONNECT_TARBALL:-https://codeload.github.com/veilconnect/VeilConnect/tar.gz/refs/heads/$BRANCH}"
fetch_via_tarball() {
  echo "→ 改用 tarball 下载（curl）…"
  rm -rf "$DIR"; mkdir -p "$DIR"
  curl -fsSL --retry 3 "$TARBALL" | tar xz -C "$DIR" --strip-components=1
}
if [ -d "$DIR/.git" ]; then
  echo "→ 更新已有仓库 $DIR…"
  git -C "$DIR" fetch --depth 1 origin "$BRANCH" && git -C "$DIR" reset --hard "origin/$BRANCH" || { echo "更新失败，重新获取…"; rm -rf "$DIR"; }
fi
if [ ! -e "$DIR/docker-compose.yml" ]; then
  ok=0
  for i in 1 2 3; do
    echo "→ 克隆仓库到 $DIR（第 $i 次）…"
    rm -rf "$DIR"
    if git clone --depth 1 -b "$BRANCH" "$REPO" "$DIR" 2>/dev/null; then ok=1; break; fi
    echo "  git clone 失败，重试…"; sleep 2
  done
  [ "$ok" = "1" ] || fetch_via_tarball || { echo "✖ 仓库获取失败（git 与 tarball 均不可达）。可设 VEILCONNECT_REPO/VEILCONNECT_TARBALL 指向国内镜像后重试。"; exit 1; }
fi

# 3. 交给一键安装脚本（装 Docker/compose、配置、起栈），透传参数
cd "$DIR"
echo "→ 运行 scripts/install.sh $*"
exec bash scripts/install.sh "$@"
