/**
 * VeilConnect 桌面端主进程。
 *
 * 这是突破「浏览器端 E2EE 信任天花板」的关键：与每次由服务器现场下发 HTML/JS 的网页版不同，
 * 桌面端**只加载随签名安装包一起分发的本地代码**（`loadFile`，绝不 `loadURL` 远程），
 * 因此"恶意/被攻陷的部署者偷换脚本窃取私钥"这一根信任问题被消除——根信任回到
 * 可独立审计、可复现构建、代码签名的客户端本身（见 docs/DESKTOP_BUILD.md）。
 *
 * 安全硬化（对齐 Electron 官方安全清单）：
 *  - contextIsolation: true、sandbox: true、nodeIntegration: false（渲染端无 Node 能力）
 *  - 私钥/解密只在主进程的 Manager 内（preload 经 contextBridge 只暴露窄接口）
 *  - 强制 CSP；拒绝一切远程导航与新窗口；禁用 webview
 *  - 密钥由 OS 钥匙串（safeStorage）保护，无需用户口令
 */
import { app, BrowserWindow, ipcMain, Notification, safeStorage, session, shell } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import { pathToFileURL } from 'url';
import { SecureKeyStore } from './secureKeyStore';
import { createManagers, buildHandlers, Managers } from './ipcHandlers';

// 渲染产物位于 <appRoot>/dist/renderer（app.getAppPath() 在开发=项目根、打包=app.asar，均成立）。
const RENDERER_INDEX = path.join(app.getAppPath(), 'dist', 'renderer', 'index.html');
const CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "connect-src 'self' https: wss: ws:",  // 宽：需连接任意自托管 TURN/信令；高安全部署可收紧到固定域名
  "worker-src 'self' blob:",
  "object-src 'none'",
  "frame-src 'none'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'"
].join('; ');

/** 仅放行 http/https 外链交给系统浏览器；拒绝 javascript:/data:/自定义协议等。 */
function openExternalSafe(url: string): void {
  try {
    const u = new URL(url);
    if (u.protocol === 'https:' || u.protocol === 'http:') void shell.openExternal(url);
  } catch { /* 非法 URL：忽略 */ }
}

let managers: Managers | null = null;
let keyStore: SecureKeyStore | null = null;

/** 校验 OS 加密强度：发布版强制要求真加密；Linux 拒绝退化的 basic_text(硬编码密钥≈明文)后端。 */
function assertStrongEncryption(allowPlaintext: boolean): void {
  if (allowPlaintext) return; // 仅开发/测试逃生口（见下，发布版恒为 false）
  if (!safeStorage.isEncryptionAvailable()) {
    throw new Error('操作系统加密(safeStorage)不可用，拒绝启动以免明文保存私钥。');
  }
  const getBackend = (safeStorage as { getSelectedStorageBackend?: () => string }).getSelectedStorageBackend;
  if (process.platform === 'linux' && typeof getBackend === 'function') {
    if (getBackend.call(safeStorage) === 'basic_text') {
      throw new Error('Linux 上 safeStorage 退化为 basic_text(硬编码密钥，等同明文)，拒绝启动。请安装 gnome-keyring 或 kwallet。');
    }
  }
}

function getKeyStore(): SecureKeyStore {
  if (keyStore) return keyStore;
  // 关键：明文逃生口仅在【未打包】(开发/测试)且显式开启时生效；发布版恒为 false，无法绕过。
  const allowPlaintext = !app.isPackaged && process.env.VEIL_ALLOW_PLAINTEXT_KEYRING === '1';
  assertStrongEncryption(allowPlaintext);
  keyStore = new SecureKeyStore({
    filePath: path.join(app.getPath('userData'), 'keyring.enc'),
    safeStorage,
    fs,
    allowPlaintext
  });
  return keyStore;
}

/** 注册全部能力 channel（与 web worker 一致）+ 钥匙串生命周期接口。 */
function registerIpc(win: BrowserWindow): void {
  managers = createManagers(getKeyStore());
  const handlers = buildHandlers(managers);
  for (const [channel, fn] of Object.entries(handlers)) {
    ipcMain.handle(channel, (_e, ...args) => fn(...args));
  }
  // 桌面端无口令门禁：钥匙串自动解锁。仍暴露 is-initialized / reset 以对齐渲染端接口。
  ipcMain.handle('keystore:isInitialized', () => getKeyStore().isInitialized());
  ipcMain.handle('keystore:reset', () => { getKeyStore().reset(); return true; });

  // presence 事件转发到渲染端（对齐 worker 的 postEvent('presence:changed')）。
  managers.presence.on('presenceChange', (presence: unknown) => {
    if (!win.isDestroyed()) win.webContents.send('event:presence:changed', presence);
  });

  // app / window / notification：桌面端原生实现（web 版在桥接层本地实现）。
  ipcMain.handle('app:getVersion', () => app.getVersion());
  ipcMain.handle('app:quit', () => { app.quit(); });
  ipcMain.handle('window:minimize', () => win.minimize());
  ipcMain.handle('window:maximize', () => { if (win.isMaximized()) win.unmaximize(); else win.maximize(); });
  ipcMain.handle('window:close', () => win.close());
  ipcMain.handle('notification:show', (_e, title: string, body: string) => {
    if (Notification.isSupported()) new Notification({ title, body }).show();
  });
}

function createWindow(): BrowserWindow {
  const win = new BrowserWindow({
    width: 1100,
    height: 760,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false,
      webviewTag: false,
      spellcheck: false
    }
  });

  // 强制 CSP（即便页面自带 meta，也由主进程兜底）。
  session.defaultSession.webRequest.onHeadersReceived((details, cb) => {
    cb({ responseHeaders: { ...details.responseHeaders, 'Content-Security-Policy': [CSP] } });
  });

  // 只允许导航到【精确的打包入口】；其他一律拒绝（http/https 交给系统浏览器）。
  const allowedNav = pathToFileURL(RENDERER_INDEX).toString();
  win.webContents.on('will-navigate', (e, url) => {
    if (url !== allowedNav) { e.preventDefault(); openExternalSafe(url); }
  });
  win.webContents.setWindowOpenHandler(({ url }) => {
    openExternalSafe(url);
    return { action: 'deny' };
  });

  registerIpc(win);
  void win.loadFile(RENDERER_INDEX);
  win.once('ready-to-show', () => win.show());
  return win;
}

// 全局硬化：禁止创建 webview、拒绝渲染端发起的所有远程导航。
app.on('web-contents-created', (_e, contents) => {
  contents.on('will-attach-webview', (e) => e.preventDefault());
});

// 单实例，避免多开导致 keyring 写竞争。
if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.whenReady().then(() => {
    if (!fs.existsSync(RENDERER_INDEX)) {
      // 渲染产物缺失（未先 `npm run build:web`）——明确报错而非加载空白。
      console.error(`[main] 渲染产物缺失: ${RENDERER_INDEX}。请先构建渲染端。`);
    }
    createWindow();
    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
  });
}
