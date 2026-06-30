/*
 * VeilConnect Service Worker —— 离线优先外壳缓存。
 *
 * 目的（抗封锁）：用户在域名仍可达时打开过一次，应用外壳（HTML/JS/Worker/图标）即被缓存；
 * 之后即便 veilconnect.org 被 DNS 污染 / SNI 阻断，**界面仍能从缓存离线启动**——只剩信令
 * (wss) 与 TURN 中继需要穿透。配合自部署/镜像轮换，可显著降低「打不开网页」这一最脆弱环节。
 *
 * 策略：
 *   - 仅拦截【同源 GET】。跨源请求（signal.veilconnect.org 的 wss 信令 / TURN / blob）一律放行，
 *     绝不缓存——避免把动态信令/密文中继误存，也不触碰 WebSocket。
 *   - 同源资源走 stale-while-revalidate：命中缓存即刻返回，并在后台联网刷新；未命中则联网取回并缓存。
 *   - 离线且导航请求未命中：回退到缓存的应用外壳（/index.html）。
 *
 * 安全说明：SW 只是缓存层，不削弱 E2EE 或 SRI——脚本仍带 integrity，浏览器对缓存命中的响应
 * 同样执行 SRI 校验；被篡改的缓存无法绕过完整性检查。
 */
const CACHE = 'vc-shell-v1';
const SHELL = ['/', '/index.html', '/manifest.webmanifest', '/icon-192.png', '/icon-512.png', '/icon.svg'];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE).then((cache) =>
      // 逐个尝试，单个失败（如 Pages 上 /index.html 路径差异）不应让整次安装失败。
      Promise.allSettled(SHELL.map((u) => cache.add(u)))
    )
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))),
    ])
  );
});

self.addEventListener('message', (event) => {
  if (event.data === 'skipWaiting') self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  let url;
  try { url = new URL(req.url); } catch { return; }

  // 只处理同源 http(s)。跨源（信令/TURN/blob）与非 http(s) 一律交给浏览器原样处理。
  if (url.origin !== self.location.origin) return;
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return;

  event.respondWith(staleWhileRevalidate(req));
});

async function staleWhileRevalidate(req) {
  const cache = await caches.open(CACHE);
  const cached = await cache.match(req);

  const networkPromise = fetch(req)
    .then((res) => {
      // 仅缓存成功的同源基本响应（避免 opaque / 错误页污染缓存）。
      if (res && res.ok && res.type === 'basic') cache.put(req, res.clone()).catch(() => {});
      return res;
    })
    .catch(() => null);

  if (cached) {
    networkPromise; // 后台刷新，不阻塞
    return cached;
  }

  const net = await networkPromise;
  if (net) return net;

  // 离线且未命中：导航请求回退到应用外壳，让 SPA 能离线启动。
  if (req.mode === 'navigate') {
    const shell = (await cache.match('/index.html')) || (await cache.match('/'));
    if (shell) return shell;
  }
  return new Response('offline', { status: 503, statusText: 'offline' });
}
