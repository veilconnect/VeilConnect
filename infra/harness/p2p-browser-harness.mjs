/**
 * Puppeteer 编排器：开两个 headless Chromium 页面（A=offer, B=answer），各自加载浏览器 bundle，
 * 在【真实 libwebrtc】上完成 VeilConnect 安全握手 + Double Ratchet 双向加密 + MITM 负测。
 * 单机 loopback（两页同机，host 候选直连）。验证「真实 Chromium WebRTC 下全栈可用」。
 *
 * 跨主机扩展：把 makeOffer/makeAnswer 的 SDP 经文件 scp 在两台机器各跑一个本脚本即可
 * （真实 libwebrtc 没有 node-datachannel 的 ICE 怪癖）。
 */
import puppeteer from 'puppeteer';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import http from 'http';

const __dirname = dirname(fileURLToPath(import.meta.url));
const bundle = readFileSync(resolve(__dirname, '../../dist-harness/browser-bundle.js'), 'utf8');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const fail = (m) => { console.error('❌', m); process.exit(1); };

// crypto.subtle 仅在安全上下文可用 → 经 http://127.0.0.1 提供页面（localhost 视为安全上下文）
const server = http.createServer((req, res) => {
  if (req.url === '/bundle.js') { res.setHeader('Content-Type', 'text/javascript'); res.end(bundle); }
  else { res.setHeader('Content-Type', 'text/html'); res.end('<!doctype html><html><body><script src="/bundle.js"></script></body></html>'); }
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const PORT = server.address().port;

const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
try {
  const [A, B] = [await browser.newPage(), await browser.newPage()];
  for (const [tag, p] of [['A', A], ['B', B]]) {
    p.on('console', (m) => console.log(`  [page ${tag}]`, m.text()));
    p.on('pageerror', (e) => console.error(`  [page ${tag} ERROR]`, e.message));
    await p.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: 'load' });
    await p.waitForFunction(() => typeof window.VC !== 'undefined', { timeout: 10000 });
  }

  const aSelf = await A.evaluate(() => window.VC.init('offer'));
  const bSelf = await B.evaluate(() => window.VC.init('answer'));
  console.log('A userId', aSelf.userId, '| B userId', bSelf.userId);

  const offer = await A.evaluate(() => window.VC.makeOffer());
  const answer = await B.evaluate((o) => window.VC.makeAnswer(o), offer);
  await A.evaluate((a) => window.VC.acceptAnswer(a), answer);
  console.log('SDP 交换完成，等待真实 ICE/DTLS 连接 + 握手…');

  // 轮询直到两端都安全且各收到 2 条
  let ra, rb;
  for (let i = 0; i < 40; i++) {
    await sleep(500);
    ra = await A.evaluate(() => window.VC.result());
    rb = await B.evaluate(() => window.VC.result());
    if (ra.secure && rb.secure && ra.received.length >= 2 && rb.received.length >= 2) break;
  }
  await A.evaluate(() => window.VC.finalize());
  await B.evaluate(() => window.VC.finalize());
  ra = await A.evaluate(() => window.VC.result());
  rb = await B.evaluate(() => window.VC.result());

  console.log('A:', JSON.stringify(ra));
  console.log('B:', JSON.stringify(rb));
  const okA = ra.secure && ra.received.length >= 2 && ra.mitmRejected;
  const okB = rb.secure && rb.received.length >= 2 && rb.mitmRejected;
  const sasMatch = ra.sas && ra.sas === rb.sas;
  if (okA && okB && sasMatch) {
    console.log(`✅ BROWSER PASS — 真实 Chromium WebRTC：双向 E2E 成功，SAS 一致(${ra.sas})，MITM 被拒`);
  } else {
    fail(`未通过 okA=${okA} okB=${okB} sasMatch=${sasMatch}`);
  }
} finally {
  await browser.close();
  server.close();
}
