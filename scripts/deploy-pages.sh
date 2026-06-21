#!/usr/bin/env bash
# 构建并部署 veilconnect.org 托管版到 Cloudflare Pages：
#   - 把网页 SPA 用「指向 signal.veilconnect.org 的信令/TURN」构建（含 SRI 注入）
#   - 叠加 /download 落地下载页 + _headers 安全响应头
#   - wrangler pages deploy
#
# 用法（需先让 wrangler 能鉴权，例如 `set -a; . ~/veilconnect-deploy.env; set +a`）：
#   bash scripts/deploy-pages.sh
set -euo pipefail
cd "$(dirname "$0")/.."

SIGNAL="${VC_SIGNALING_URL:-wss://signal.veilconnect.org}"
TURN="${VC_TURN_ENDPOINT:-https://signal.veilconnect.org/turn-credentials}"
PROJECT="${PAGES_PROJECT:-veilconnect}"

echo "==> build SPA for Pages (signaling=$SIGNAL, turn=$TURN)"
VC_SIGNALING_URL="$SIGNAL" VC_TURN_ENDPOINT="$TURN" npm run build:web

echo "==> assemble Pages dir (landing/download page + security headers)"
rm -rf server/public/download
cp -r infra/cloudflare/pages/download server/public/download
cp infra/cloudflare/pages/_headers server/public/_headers

echo "==> deploy to Cloudflare Pages (project: $PROJECT)"
wrangler pages deploy server/public --project-name "$PROJECT" --commit-dirty=true
