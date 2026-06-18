#!/usr/bin/env bash
# VeilConnect 全栈测试：从静态检查一路验到真实 WebRTC 全栈。
# 用法: npm run test:all
# 跳过重步骤: SKIP_SMOKE=1 / SKIP_HARNESS=1 / SKIP_BROWSER=1
set -uo pipefail
cd "$(dirname "$0")/.."
ROOT=$(pwd)
PASS=(); FAIL=(); SKIP=()
step() { echo; echo "======================================================"; echo "▶ $1"; echo "======================================================"; }
ok()   { PASS+=("$1"); echo "✅ $1"; }
bad()  { FAIL+=("$1"); echo "❌ $1"; }
skip() { SKIP+=("$1"); echo "⏭️  跳过：$1（$2）"; }

# ① 类型检查
step "① typecheck (tsc --noEmit)"
if npm run -s typecheck; then ok "typecheck"; else bad "typecheck"; fi

# ② 单元 + 集成测试（含 E2EHandshake）
step "② 单元 + 集成测试 (jest)"
if npm test --silent; then ok "jest"; else bad "jest"; fi

# ②b 信令服务器安全加固测试（默认 roots 不含 server/，需显式覆盖；依赖 server/node_modules 的 ws）
step "②b 信令服务器安全测试 (jest server/)"
if node -e "require('./server/node_modules/ws')" >/dev/null 2>&1; then
  if npx jest server/signaling-server.test.js --roots ./server --testMatch "**/*.test.js" --silent; then
    ok "signaling (token/限速/反代真实IP)"
  else
    bad "signaling"
  fi
else
  skip "signaling" "server/node_modules 缺 ws（cd server && npm i）"
fi

# ③ 生产构建
step "③ 生产构建 (webpack)"
if npm run -s build; then ok "build"; else bad "build"; fi

# ④ 网页服务冒烟：起信令服务器托管构建产物，验证 SPA / 健康检查 / CSP
step "④ 网页服务冒烟 (serve + curl)"
if [[ "${SKIP_SMOKE:-0}" == "1" ]]; then
  skip "smoke" "SKIP_SMOKE=1"
else
  SMOKE_PORT=3987
  ALLOWED_ORIGINS="http://localhost:${SMOKE_PORT}" PORT=${SMOKE_PORT} node server/signaling-server.js >/tmp/vc-web-smoke.log 2>&1 &
  SP=$!
  # 轮询等服务器就绪（最多 ~15s）；固定 sleep 会因启动需 ~2-3s 而抢跑误报
  for i in $(seq 1 30); do curl -sf "http://localhost:${SMOKE_PORT}/health" >/dev/null 2>&1 && break; sleep 0.5; done
  if curl -sf "http://localhost:${SMOKE_PORT}/health" >/dev/null \
     && curl -s "http://localhost:${SMOKE_PORT}/" | grep -q 'id="root"' \
     && curl -sI "http://localhost:${SMOKE_PORT}/" | grep -qi "content-security-policy"; then
    ok "smoke (SPA + health + CSP)"
  else
    bad "smoke"; echo "  --- web smoke 日志尾部 ---"; tail -5 /tmp/vc-web-smoke.log 2>/dev/null
  fi
  kill $SP 2>/dev/null
fi

# ⑤ 全栈真实 WebRTC（node-datachannel，单机 loopback）
step "⑤ 全栈 harness (node-datachannel loopback)"
if [[ "${SKIP_HARNESS:-0}" == "1" ]]; then
  skip "harness" "SKIP_HARNESS=1"
elif node -e "require('node-datachannel')" >/dev/null 2>&1; then
  npx webpack --config infra/harness/webpack.harness.js >/tmp/vc-hbuild.log 2>&1
  rm -f /tmp/vc-ta-o.json /tmp/vc-ta-a.json /tmp/vc-ta-o.log /tmp/vc-ta-a.log
  timeout 60 node dist-harness/p2p-harness.js offer  /tmp/vc-ta-o.json /tmp/vc-ta-a.json >/tmp/vc-ta-o.log 2>&1 &
  OP=$!
  timeout 60 node dist-harness/p2p-harness.js answer /tmp/vc-ta-o.json /tmp/vc-ta-a.json >/tmp/vc-ta-a.log 2>&1 &
  AP=$!
  wait $OP; r1=$?; wait $AP; r2=$?
  if [[ $r1 -eq 0 && $r2 -eq 0 ]] && grep -q "✅ PASS" /tmp/vc-ta-o.log && grep -q "✅ PASS" /tmp/vc-ta-a.log; then
    ok "harness (loopback E2E + MITM)"
  else
    bad "harness"; echo "  --- offer 尾部 ---"; tail -4 /tmp/vc-ta-o.log
  fi
else
  skip "harness" "未装 node-datachannel（npm i -D node-datachannel）"
fi

# ⑥ 真实 Chromium WebRTC（Puppeteer，单机 loopback）
step "⑥ 真实 Chromium WebRTC (Puppeteer loopback)"
if [[ "${SKIP_BROWSER:-0}" == "1" ]]; then
  skip "browser" "SKIP_BROWSER=1"
elif node -e "require('puppeteer')" >/dev/null 2>&1; then
  npx webpack --config infra/harness/webpack.browser.js >/tmp/vc-bbuild.log 2>&1
  if timeout 120 node infra/harness/p2p-browser-harness.mjs >/tmp/vc-browser.log 2>&1 \
     && grep -q "BROWSER PASS" /tmp/vc-browser.log; then
    ok "browser (real libwebrtc E2E + MITM)"
  else
    bad "browser"; echo "  --- browser 日志尾部 ---"; tail -8 /tmp/vc-browser.log 2>/dev/null
  fi
else
  skip "browser" "未装 puppeteer（npm i -D puppeteer）"
fi

# 汇总
echo; echo "======================================================"
echo "测试汇总：${#PASS[@]} 通过, ${#FAIL[@]} 失败, ${#SKIP[@]} 跳过"
for p in "${PASS[@]:-}"; do [[ -n "$p" ]] && echo "  ✅ $p"; done
for s in "${SKIP[@]:-}"; do [[ -n "$s" ]] && echo "  ⏭️  $s"; done
for f in "${FAIL[@]:-}"; do [[ -n "$f" ]] && echo "  ❌ $f"; done
echo "======================================================"
[[ ${#FAIL[@]} -eq 0 ]] && exit 0 || exit 1
