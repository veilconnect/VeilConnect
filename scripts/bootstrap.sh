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

# 2. 克隆（或更新）仓库
if [ -d "$DIR/.git" ]; then
  echo "→ 更新已有仓库 $DIR…"
  git -C "$DIR" fetch --depth 1 origin "$BRANCH" && git -C "$DIR" reset --hard "origin/$BRANCH"
else
  echo "→ 克隆仓库到 $DIR…"
  git clone --depth 1 -b "$BRANCH" "$REPO" "$DIR"
fi

# 3. 交给一键安装脚本（装 Docker/compose、配置、起栈），透传参数
cd "$DIR"
echo "→ 运行 scripts/install.sh $*"
exec bash scripts/install.sh "$@"
