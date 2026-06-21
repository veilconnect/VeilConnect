// 两个独立浏览器(Playwright/Chromium)走「自定义房间号」流程的端到端冒烟/诊断脚本。
//
// 这是可选的手动 E2E 工具(不进 CI;playwright 非项目依赖)。运行前需装 playwright:
//   npm i -D playwright && npx playwright install chromium
// 用法:
//   node scripts/two-browser-test.mjs [url] [roomcode] [relay:off|on]
//   PLAYWRIGHT_PATH=/path/to/playwright node scripts/two-browser-test.mjs ...   # 指定已装的 playwright
import { createRequire } from 'module';
import { existsSync } from 'fs';
import { dirname, join } from 'path';
const require = createRequire(import.meta.url);
function resolveChromium() {
  const tries = [];
  if (process.env.PLAYWRIGHT_PATH) tries.push(process.env.PLAYWRIGHT_PATH);
  tries.push('playwright', 'playwright-core');
  // 全局安装(nvm/npm -g): <node>/../lib/node_modules/playwright
  const globalLib = join(dirname(process.execPath), '..', 'lib', 'node_modules', 'playwright');
  if (existsSync(globalLib)) tries.push(globalLib);
  for (const t of tries) { try { return require(t).chromium; } catch { /* next */ } }
  throw new Error('找不到 playwright。请 `npm i -D playwright && npx playwright install chromium`，或用 PLAYWRIGHT_PATH 指向已装目录。');
}
const chromium = resolveChromium();

const URL = process.argv[2] || 'https://10.0.0.12:8446';
const CODE = process.argv[3] || 'test-room-123';
const PASS = 'pw-test-passphrase-123';

const launchArgs = [
  '--no-sandbox',
  '--ignore-certificate-errors',
  // 关键:不要用 mDNS(.local) 混淆本机 host 候选,否则两个浏览器在同机也连不上
  '--disable-features=WebRtcHideLocalIpsWithMdns'
];

function wire(page, tag, sink) {
  page.on('console', m => sink.push(`[${tag}] ${m.type()}: ${m.text()}`));
  page.on('pageerror', e => sink.push(`[${tag}] PAGEERROR: ${e.message}`));
}

async function unlockAndEnter(page) {
  // 解锁门禁:填口令(首次需两次),点进入
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(800);
  const pw = page.locator('input[type="password"]');
  if (await pw.count()) {
    const inputs = page.locator('input[type="password"], input[placeholder*="口令"]');
    const n = await inputs.count();
    await inputs.nth(0).fill(PASS);
    if (n > 1) await inputs.nth(1).fill(PASS);
    await page.getByRole('button', { name: /创建并进入|解锁|进入/ }).first().click();
    await page.waitForTimeout(1500);
  }
  // 若落到身份生成页,点生成
  const gen = page.getByRole('button', { name: /生成身份|生成新身份|开始/ });
  if (await gen.count()) { try { await gen.first().click({ timeout: 2000 }); } catch {} await page.waitForTimeout(1200); }
}

async function openRoomCodeDialog(page) {
  await page.getByRole('button', { name: /房间号/ }).first().click();
  await page.waitForTimeout(400);
  await page.locator('input[placeholder*="房间号"]').first().fill(CODE);
}

(async () => {
  const logs = [];
  const browser = await chromium.launch({ headless: true, args: launchArgs });
  const ctxA = await browser.newContext({ ignoreHTTPSErrors: true });
  const ctxB = await browser.newContext({ ignoreHTTPSErrors: true });
  // 第4个参数 relayMode: 'off' → 设 vc.relayOnly=0 直连; 其它/缺省 → 保持默认(relayOnly ON, 走 TURN)
  const relayMode = process.argv[4] || 'off';
  if (relayMode === 'off') {
    for (const c of [ctxA, ctxB]) await c.addInitScript(() => { try { localStorage.setItem('vc.relayOnly','0'); } catch {} });
  }
  const A = await ctxA.newPage(); const B = await ctxB.newPage();
  wire(A, 'A', logs); wire(B, 'B', logs);

  try {
    await A.goto(URL, { waitUntil: 'domcontentloaded', timeout: 20000 });
    await B.goto(URL, { waitUntil: 'domcontentloaded', timeout: 20000 });
    await unlockAndEnter(A); await unlockAndEnter(B);

    // 确认聊天界面就绪(有 房间号 按钮)
    await A.getByRole('button', { name: /房间号/ }).first().waitFor({ timeout: 10000 });
    await B.getByRole('button', { name: /房间号/ }).first().waitFor({ timeout: 10000 });
    logs.push('--- both reached chat UI ---');

    // A 创建, B 加入（exact 以避开主面板的 "🔗 创建房间"）
    await openRoomCodeDialog(A);
    await A.getByRole('button', { name: '创建房间', exact: true }).click();
    await A.waitForTimeout(1500);
    logs.push('--- A created room by code ---');

    await openRoomCodeDialog(B);
    await B.getByRole('button', { name: '加入房间', exact: true }).click();
    logs.push('--- B joined room by code ---');

    // 等待连接 / 安全状态
    let connected = false;
    for (let i = 0; i < 25; i++) {
      await A.waitForTimeout(1000);
      const aTxt = await A.locator('body').innerText().catch(()=>'');
      const bTxt = await B.locator('body').innerText().catch(()=>'');
      if (/已加密|已验证|安全码|待核对/.test(aTxt) || /已加密|已验证|安全码|待核对/.test(bTxt)) { connected = true; logs.push(`--- secure UI appeared at ${i+1}s ---`); break; }
      if (/已连接|connected/i.test(aTxt) && /已连接|connected/i.test(bTxt)) { connected = true; logs.push(`--- both connected at ${i+1}s ---`); break; }
    }
    logs.push(`\n=== RESULT: ${connected ? 'CONNECTED/secure-stage reached' : 'NOT CONNECTED (timeout)'} ===`);

    // dump final status text
    const statusA = await A.locator('body').innerText().catch(()=>'').then(t => (t.match(/(未连接|连接中|已连接|已加密[^\n]*|待核对[^\n]*|已验证[^\n]*)/g)||[]).join(' | '));
    const statusB = await B.locator('body').innerText().catch(()=>'').then(t => (t.match(/(未连接|连接中|已连接|已加密[^\n]*|待核对[^\n]*|已验证[^\n]*)/g)||[]).join(' | '));
    logs.push(`A status: ${statusA}`);
    logs.push(`B status: ${statusB}`);
  } catch (e) {
    logs.push(`SCRIPT ERROR: ${e.message}`);
  } finally {
    console.log(logs.join('\n'));
    await browser.close();
  }
})();
