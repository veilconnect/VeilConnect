import { app, BrowserWindow, ipcMain, Notification } from 'electron';
import * as path from 'path';
import { SimpleDatabaseManager } from './database/SimpleDatabaseManager';
import { CryptoManager } from './crypto/CryptoManager';
import { RatchetManager } from './crypto/RatchetManager';
import { IdentityManager } from './identity/IdentityManager';
import { SecureKeyStore } from './security/SecureKeyStore';
import { MessageHistoryManager } from './storage/MessageHistoryManager';
import { PresenceManager } from './presence/PresenceManager';

/**
 * 私钥绝不出主进程：发给渲染进程的身份对象一律剥离 secretKey。
 * 渲染端只需要 publicKey/boxPublicKey/绑定签名等公开字段，签名与解密全部在 main 内完成。
 */
function toRendererIdentity<T extends { secretKey?: string } | null>(identity: T): T {
  if (!identity) return identity;
  const { secretKey, ...safe } = identity as any;
  return safe as T;
}

class VeilConnectApp {
  private mainWindow: BrowserWindow | null = null;
  private dbManager: SimpleDatabaseManager | null = null;
  private cryptoManager: CryptoManager | null = null;
  private ratchetManager: RatchetManager = new RatchetManager();
  private identityManager: IdentityManager | null = null;
  private messageHistoryManager: MessageHistoryManager | null = null;
  private presenceManager: PresenceManager | null = null;

  constructor() {
    this.initializeApp().catch(error => {
      console.error('Failed to initialize VeilConnect', error);
      app.quit();
    });

    app.on('window-all-closed', () => {
      if (process.platform !== 'darwin') {
        app.quit();
      }
    });
  }

  private async initializeApp(): Promise<void> {
    await app.whenReady();
    await this.bootstrapServices();

    this.createWindow();
    this.setupIpcHandlers();

    if (process.env.VC_SMOKE === '1') {
      const id = this.identityManager?.getCurrentIdentity();
      console.log('[smoke] bootstrap ok, identity=', id?.userId, 'boxPub=', !!id?.boxPublicKey, 'sig=', !!id?.keyBindingSignature);
      this.mainWindow?.webContents.once('did-finish-load', () => {
        console.log('[smoke] renderer loaded');
        setTimeout(() => app.quit(), 500);
      });
    }

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        this.createWindow();
      }
    });
  }

  private async bootstrapServices(): Promise<void> {
    const [identityKey, cryptoKey, dbKey, messageHistoryKey] = await Promise.all([
      SecureKeyStore.getKey('identity-store'),
      SecureKeyStore.getKey('crypto-store'),
      SecureKeyStore.getKey('database-store'),
      SecureKeyStore.getKey('message-history-store')
    ]);

    this.cryptoManager = new CryptoManager(cryptoKey);
    this.identityManager = new IdentityManager(identityKey);
    this.dbManager = new SimpleDatabaseManager(dbKey);
    this.messageHistoryManager = new MessageHistoryManager(messageHistoryKey, this.cryptoManager);

    // 把 X25519 加密公钥绑定进 Ed25519 身份并签名
    try {
      const boxPub = this.cryptoManager.getPublicKey();
      const current = this.identityManager.getCurrentIdentity();
      if (current && current.boxPublicKey !== boxPub) {
        this.identityManager.attachBoxPublicKey(boxPub);
      }
    } catch (err) {
      console.warn('[bootstrap] failed to bind box public key', err);
    }
    this.presenceManager = new PresenceManager({
      interval: 30000, // 30秒心跳间隔
      timeout: 60000 // 60秒超时
    });

    // 监听在线状态变化，通知渲染进程
    this.presenceManager.on('presenceChange', (presence) => {
      this.mainWindow?.webContents.send('presence:changed', presence);
    });
  }

  private getIdentityManager(): IdentityManager {
    if (!this.identityManager) {
      throw new Error('Identity manager not initialized');
    }
    return this.identityManager;
  }

  private getCryptoManager(): CryptoManager {
    if (!this.cryptoManager) {
      throw new Error('Crypto manager not initialized');
    }
    return this.cryptoManager;
  }

  private getDatabaseManager(): SimpleDatabaseManager {
    if (!this.dbManager) {
      throw new Error('Database manager not initialized');
    }
    return this.dbManager;
  }

  private getMessageHistoryManager(): MessageHistoryManager {
    if (!this.messageHistoryManager) {
      throw new Error('Message history manager not initialized');
    }
    return this.messageHistoryManager;
  }

  private getPresenceManager(): PresenceManager {
    if (!this.presenceManager) {
      throw new Error('Presence manager not initialized');
    }
    return this.presenceManager;
  }

  private createWindow(): void {
    this.mainWindow = new BrowserWindow({
      width: 1400,
      height: 900,
      minWidth: 1000,
      minHeight: 700,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        sandbox: true,
        webviewTag: false, // 显式禁用 <webview>，避免被注入加载远程内容
        preload: path.join(__dirname, 'preload.js'),
        webSecurity: true
      },
      titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
      show: false,
      icon: process.platform === 'win32' ? path.join(__dirname, '../assets/icon.ico') : undefined
    });

    const isDev = process.env.NODE_ENV === 'development';

    // 禁止渲染进程导航到外部页面、禁止 window.open 打开新窗口（避免远程内容获得 preload 能力）
    this.mainWindow.webContents.on('will-navigate', (event, url) => {
      const allowed = isDev && url.startsWith('http://localhost:8080');
      if (!allowed) {
        event.preventDefault();
        console.warn('[security] blocked navigation to', url);
      }
    });
    this.mainWindow.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));

    // 一律拒绝渲染进程发起的权限请求（摄像头/麦克风/地理位置/通知弹窗等本应用都不需要）
    this.mainWindow.webContents.session.setPermissionRequestHandler((_wc, _permission, callback) => callback(false));

    // 生产环境强制 CSP：脚本仅限本地，杜绝内联/远程脚本注入（开发环境放行以兼容 webpack HMR）
    if (!isDev) {
      this.mainWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
        callback({
          responseHeaders: {
            ...details.responseHeaders,
            'Content-Security-Policy': [
              "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:; connect-src 'self'"
            ]
          }
        });
      });
    }

    if (isDev) {
      this.mainWindow.loadURL('http://localhost:8080');
      this.mainWindow.webContents.openDevTools({ mode: 'detach' });
    } else {
      this.mainWindow.loadFile(path.join(__dirname, 'renderer/index.html'));
    }

    this.mainWindow.once('ready-to-show', () => {
      this.mainWindow?.show();
      this.mainWindow?.setTitle('VeilConnect - P2P Secure Chat');
    });

    this.mainWindow.on('closed', () => {
      this.mainWindow = null;
    });
  }

  private setupIpcHandlers(): void {
    // Identity
    ipcMain.handle('identity:getCurrentIdentity', async () => {
      return toRendererIdentity(this.getIdentityManager().getCurrentIdentity());
    });

    ipcMain.handle('identity:createNewIdentity', async (_event, nickname?: string) => {
      return toRendererIdentity(this.getIdentityManager().createNewIdentity(nickname ?? 'Guest User'));
    });

    ipcMain.handle('identity:saveIdentity', async (_event, identity) => {
      return toRendererIdentity(this.getIdentityManager().saveIdentity(identity));
    });

    ipcMain.handle('identity:updateIdentity', async (_event, updates) => {
      return toRendererIdentity(this.getIdentityManager().updateIdentity(updates));
    });

    ipcMain.handle('identity:updateUserInfo', async (_event, updates) => {
      return this.getIdentityManager().updateUserInfo(updates);
    });

    ipcMain.handle('identity:exportIdentity', async () => {
      return this.getIdentityManager().exportIdentity();
    });

    ipcMain.handle('identity:exportIdentityEncrypted', async (_event, password: string) => {
      return this.getIdentityManager().exportIdentityEncrypted(password);
    });

    ipcMain.handle('identity:importPeerIdentity', async (_event, identityData: string) => {
      return this.getIdentityManager().importPeerIdentity(identityData);
    });

    ipcMain.handle('identity:importIdentityEncrypted', async (_event, payload: string, password: string) => {
      return toRendererIdentity(this.getIdentityManager().importIdentityEncrypted(payload, password));
    });

    ipcMain.handle('identity:generateQRCode', async () => {
      return this.getIdentityManager().generateQRCodeData();
    });

    ipcMain.handle('identity:parseQRCode', async (_event, qrData: string) => {
      return this.getIdentityManager().parseQRCodeData(qrData);
    });

    ipcMain.handle('identity:getPeerIdentities', async () => {
      return this.getIdentityManager().getPeerIdentities();
    });

    ipcMain.handle('identity:verifyUserId', async (_event, userId: string, publicKey: string) => {
      return this.getIdentityManager().verifyUserId(userId, publicKey);
    });

    // Crypto
    ipcMain.handle('crypto:generateKeyPair', async () => {
      // 只把加密公钥交给渲染端；box 私钥留在主进程，加解密经 crypto:encrypt/decrypt 完成。
      const { publicKey } = this.getCryptoManager().generateKeyPair();
      return { publicKey };
    });

    ipcMain.handle('crypto:getPublicKey', async () => {
      return this.getCryptoManager().getPublicKey();
    });

    // 注：旧的 crypto:encrypt/crypto:decrypt（用长期密钥直接加解密任意数据）已移除——
    // 它对渲染进程构成"加解密预言机"攻击面，且已被下面的棘轮加密取代，无任何调用方。

    // Double Ratchet：每条消息级前向保密（基于 Signal 协议）
    ipcMain.handle('ratchet:localBundle', async () => {
      return this.ratchetManager.getLocalBundle();
    });

    ipcMain.handle('ratchet:identityKey', async () => {
      return this.ratchetManager.getIdentityKey();
    });

    ipcMain.handle('ratchet:establish', async (_event, peerId: string, bundle: any) => {
      await this.ratchetManager.establish(peerId, bundle);
      return true;
    });

    ipcMain.handle('ratchet:encrypt', async (_event, peerId: string, plaintext: string) => {
      return this.ratchetManager.encrypt(peerId, plaintext);
    });

    ipcMain.handle('ratchet:decrypt', async (_event, peerId: string, type: number, body: string) => {
      return this.ratchetManager.decrypt(peerId, type, body);
    });

    ipcMain.handle('ratchet:close', async (_event, peerId: string) => {
      this.ratchetManager.closeSession(peerId);
      return true;
    });

    // 用身份私钥为 ratchet 身份公钥签名 / 验证对端（沿用通用的密钥签名/验签接口）
    ipcMain.handle('identity:signEphemeralKey', async (_event, ephemeralPublicKey: string) => {
      return this.getIdentityManager().signEphemeralKey(ephemeralPublicKey);
    });

    ipcMain.handle('identity:verifyEphemeralKey', async (_event, peerPublicKey: string, ephemeralPublicKey: string, signature: string) => {
      return this.getIdentityManager().verifyEphemeralKey(peerPublicKey, ephemeralPublicKey, signature);
    });

    // Database
    ipcMain.handle('db:saveMessage', async (_event, message) => {
      return this.getDatabaseManager().saveMessage(message);
    });

    ipcMain.handle('db:getContacts', async () => {
      return this.getDatabaseManager().getContacts();
    });

    ipcMain.handle('db:saveContact', async (_event, contact) => {
      return this.getDatabaseManager().saveContact(contact);
    });

    ipcMain.handle('db:removeContact', async (_event, contactId: string) => {
      return this.getDatabaseManager().removeContact(contactId);
    });

    ipcMain.handle('db:getRecentConversations', async (_event, limit?: number) => {
      return this.getDatabaseManager().getRecentConversations(limit);
    });

    ipcMain.handle('message:getHistory', async (_event, peerId: string) => {
      return this.getDatabaseManager().getMessageHistory(peerId);
    });

    // Message History Manager
    ipcMain.handle('messageHistory:save', async (_event, message) => {
      return this.getMessageHistoryManager().saveMessage(message);
    });

    ipcMain.handle('messageHistory:get', async (_event, filter) => {
      return this.getMessageHistoryManager().getMessages(filter);
    });

    ipcMain.handle('messageHistory:updateStatus', async (_event, messageId: string, status: string) => {
      return this.getMessageHistoryManager().updateMessageStatus(messageId, status as any);
    });

    ipcMain.handle('messageHistory:delete', async (_event, messageId: string) => {
      return this.getMessageHistoryManager().deleteMessage(messageId);
    });

    ipcMain.handle('messageHistory:clearSession', async (_event, sessionId: string) => {
      return this.getMessageHistoryManager().clearSessionMessages(sessionId);
    });

    ipcMain.handle('messageHistory:setExpiry', async (_event, messageId: string, expiresInMs: number) => {
      return this.getMessageHistoryManager().setMessageExpiry(messageId, expiresInMs);
    });

    ipcMain.handle('messageHistory:search', async (_event, keyword: string, sessionId?: string) => {
      return this.getMessageHistoryManager().searchMessages(keyword, sessionId);
    });

    ipcMain.handle('messageHistory:export', async (_event, sessionId?: string, format?: 'json' | 'txt') => {
      return this.getMessageHistoryManager().exportMessages(sessionId, format);
    });

    ipcMain.handle('messageHistory:getStatistics', async () => {
      return this.getMessageHistoryManager().getStatistics();
    });

    // Presence Manager
    ipcMain.handle('presence:setLocal', async (_event, status: string, customStatus?: string) => {
      this.getPresenceManager().setLocalStatus(status as any, customStatus);
      return true;
    });

    ipcMain.handle('presence:getLocal', async () => {
      return this.getPresenceManager().getLocalStatus();
    });

    ipcMain.handle('presence:update', async (_event, userId: string, status: string, customStatus?: string) => {
      this.getPresenceManager().updatePresence(userId, status as any, customStatus);
      return true;
    });

    ipcMain.handle('presence:get', async (_event, userId: string) => {
      return this.getPresenceManager().getPresence(userId);
    });

    ipcMain.handle('presence:getOnline', async () => {
      return this.getPresenceManager().getOnlineUsers();
    });

    ipcMain.handle('presence:getBatch', async (_event, userIds: string[]) => {
      const result = this.getPresenceManager().getBatchPresence(userIds);
      return Array.from(result.entries());
    });

    ipcMain.handle('presence:remove', async (_event, userId: string) => {
      this.getPresenceManager().removePresence(userId);
      return true;
    });

    ipcMain.handle('presence:getStatistics', async () => {
      return this.getPresenceManager().getStatistics();
    });

    ipcMain.handle('presence:getConfig', async () => {
      return this.getPresenceManager().getConfig();
    });

    ipcMain.handle('presence:updateConfig', async (_event, config: any) => {
      this.getPresenceManager().updateConfig(config);
      return true;
    });

    // 注：fileTransfer:* 系列 IPC 已移除。
    // 这些处理器直接接受渲染端传入的任意 filePath/targetPath 并执行 fs.open/rename，
    // 等于把"任意文件读 / 任意路径写"原语暴露给渲染进程，而当前 UI 并未使用文件传输。
    // 底层 ResumableFileTransfer 类保留；将来接回时必须改为经 dialog.showOpenDialog/
    // showSaveDialog 由主进程选定路径，绝不接受渲染端任意路径。

    // Application metadata
    ipcMain.handle('app:getVersion', async () => app.getVersion());
    ipcMain.handle('app:getPlatform', async () => process.platform);
    ipcMain.handle('app:quit', async () => app.quit());

    // Window controls
    ipcMain.handle('window:minimize', async () => {
      this.mainWindow?.minimize();
    });

    ipcMain.handle('window:maximize', async () => {
      if (this.mainWindow?.isMaximized()) {
        this.mainWindow.unmaximize();
      } else {
        this.mainWindow?.maximize();
      }
    });

    ipcMain.handle('window:close', async () => {
      this.mainWindow?.close();
    });

    // Notifications
    ipcMain.handle('notification:show', async (_event, title: string, body: string) => {
      if (!Notification.isSupported()) {
        return;
      }
      const notification = new Notification({
        title,
        body,
        icon: process.platform === 'win32' ? path.join(__dirname, '../assets/icon.ico') : undefined
      });
      notification.show();
    });

    console.log('IPC handlers registered');
  }
}

new VeilConnectApp();

