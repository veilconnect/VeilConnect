/**
 * 加密 Web Worker —— 浏览器版的「主进程」。
 *
 * 所有加密能力（CryptoManager / RatchetManager / IdentityManager / MessageHistory /
 * Presence / Database）在本 Worker 内实例化并运行，私钥只存在于 Worker 上下文，
 * 不出现在 UI 线程 / DOM / postMessage 载荷里（toRendererIdentity 剥离 secretKey）。
 * 这是桌面端「私钥不出主进程」在浏览器里的等价物（软隔离）。
 *
 * 协议：
 *   主线程 → Worker：
 *     { type:'is-initialized', id }                          // 查询是否已创建 keyring
 *     { type:'unlock', id, passphrase }                      // 解锁/首次创建 + bootstrap
 *     { type:'invoke', id, channel, args }                   // 调用某能力（channel 同桌面端 IPC）
 *   Worker → 主线程：
 *     { id, ok:true, result } | { id, ok:false, error }
 *     { type:'event', event, payload }                       // 如 presence:changed
 *
 * 各 Manager 与桌面端**完全复用**（src/main/...），仅靠 webpack alias 把 electron-store / crypto
 * 换成浏览器 shim。bootstrap 逻辑移植自 src/main/main.ts。
 */
import { hydrateStores } from '../shims/electron-store-shim';
import { BrowserKeyStore } from '../security/BrowserKeyStore';
import { CryptoManager } from '../../main/crypto/CryptoManager';
import { RatchetManager } from '../../main/crypto/RatchetManager';
import { IdentityManager } from '../../main/identity/IdentityManager';
import { MessageHistoryManager } from '../../main/storage/MessageHistoryManager';
import { PresenceManager } from '../../main/presence/PresenceManager';
import { SimpleDatabaseManager } from '../../main/database/SimpleDatabaseManager';

const ctx: Worker = self as any;

let cryptoManager: CryptoManager | null = null;
let identityManager: IdentityManager | null = null;
let dbManager: SimpleDatabaseManager | null = null;
let messageHistoryManager: MessageHistoryManager | null = null;
let presenceManager: PresenceManager | null = null;
const ratchetManager = new RatchetManager();
let booted = false;

/** 发给主线程的身份对象一律剥离 secretKey（移植自 main.ts:toRendererIdentity）。 */
function toRendererIdentity<T extends { secretKey?: string } | null>(identity: T): T {
  if (!identity) return identity;
  const { secretKey: _secretKey, ...safe } = identity as any;
  return safe as T;
}

function getIdentity(): IdentityManager {
  if (!identityManager) throw new Error('Identity manager not initialized');
  return identityManager;
}
function getCrypto(): CryptoManager {
  if (!cryptoManager) throw new Error('Crypto manager not initialized');
  return cryptoManager;
}
function getDb(): SimpleDatabaseManager {
  if (!dbManager) throw new Error('Database manager not initialized');
  return dbManager;
}
function getHistory(): MessageHistoryManager {
  if (!messageHistoryManager) throw new Error('Message history manager not initialized');
  return messageHistoryManager;
}
function getPresence(): PresenceManager {
  if (!presenceManager) throw new Error('Presence manager not initialized');
  return presenceManager;
}

/** 确保当前身份已绑定本机 X25519 加密公钥（移植自 main.ts:bindCurrentBoxKeyToIdentity）。 */
function bindCurrentBoxKeyToIdentity(): void {
  try {
    const boxPub = getCrypto().getPublicKey();
    const id = getIdentity();
    const current = id.getCurrentIdentity();
    if (!current) return;
    const alreadyBound =
      current.boxPublicKey === boxPub &&
      !!current.keyBindingSignature &&
      id.verifyKeyBinding({
        publicKey: current.publicKey,
        boxPublicKey: current.boxPublicKey!,
        keyBindingSignature: current.keyBindingSignature!
      });
    if (!alreadyBound) {
      id.attachBoxPublicKey(boxPub);
    }
  } catch (err) {
    console.warn('[identity] failed to bind box public key', err);
  }
}

async function bootstrap(passphrase: string): Promise<void> {
  if (booted) return;
  await BrowserKeyStore.unlock(passphrase);

  const [identityKey, cryptoKey, dbKey, messageHistoryKey] = await Promise.all([
    BrowserKeyStore.getKey('identity-store'),
    BrowserKeyStore.getKey('crypto-store'),
    BrowserKeyStore.getKey('database-store'),
    BrowserKeyStore.getKey('message-history-store')
  ]);

  // 关键：在构造任何 Manager 之前，先把对应库从 IndexedDB 同步水合到内存
  // （electron-store-shim 的 get/set 才能同步工作）。
  await hydrateStores({
    'user-identity': identityKey,
    'crypto-keys': cryptoKey,
    'conversation-db': dbKey,
    'message-history': messageHistoryKey
  });

  cryptoManager = new CryptoManager(cryptoKey);
  identityManager = new IdentityManager(identityKey);
  dbManager = new SimpleDatabaseManager(dbKey);
  messageHistoryManager = new MessageHistoryManager(messageHistoryKey, cryptoManager);

  bindCurrentBoxKeyToIdentity();

  presenceManager = new PresenceManager({ interval: 30000, timeout: 60000 });
  presenceManager.on('presenceChange', (presence: unknown) => postEvent('presence:changed', presence));

  booted = true;
}

// channel → handler，逐条对应 main.ts 的 ipcMain.handle（仅含渲染端实际调用的能力域）。
const handlers: Record<string, (...args: any[]) => any> = {
  // ---- Identity ----
  'identity:getCurrentIdentity': () => toRendererIdentity(getIdentity().getCurrentIdentity()),
  'identity:createNewIdentity': (nickname?: string) => {
    getIdentity().createNewIdentity(nickname ?? 'Guest User');
    bindCurrentBoxKeyToIdentity();
    return toRendererIdentity(getIdentity().getCurrentIdentity());
  },
  'identity:saveIdentity': (identity: any) => toRendererIdentity(getIdentity().saveIdentity(identity)),
  'identity:updateIdentity': (updates: any) => toRendererIdentity(getIdentity().updateIdentity(updates)),
  'identity:updateUserInfo': (updates: any) => getIdentity().updateUserInfo(updates),
  'identity:exportIdentity': () => getIdentity().exportIdentity(),
  'identity:exportIdentityEncrypted': (password: string) => getIdentity().exportIdentityEncrypted(password),
  'identity:importPeerIdentity': (data: string) => getIdentity().importPeerIdentity(data),
  'identity:importIdentityEncrypted': (payload: string, password: string) => {
    getIdentity().importIdentityEncrypted(payload, password);
    bindCurrentBoxKeyToIdentity();
    return toRendererIdentity(getIdentity().getCurrentIdentity());
  },
  'identity:generateQRCode': () => getIdentity().generateQRCodeData(),
  'identity:parseQRCode': (qrData: string) => getIdentity().parseQRCodeData(qrData),
  'identity:getPeerIdentities': () => getIdentity().getPeerIdentities(),
  'identity:verifyUserId': (userId: string, publicKey: string) => getIdentity().verifyUserId(userId, publicKey),
  'identity:signEphemeralKey': (ephemeralPublicKey: string) => getIdentity().signEphemeralKey(ephemeralPublicKey),
  'identity:verifyEphemeralKey': (peerPublicKey: string, ephemeralPublicKey: string, signature: string) =>
    getIdentity().verifyEphemeralKey(peerPublicKey, ephemeralPublicKey, signature),

  // ---- Crypto ----
  'crypto:generateKeyPair': () => {
    const { publicKey } = getCrypto().generateKeyPair();
    bindCurrentBoxKeyToIdentity();
    return { publicKey };
  },
  'crypto:getPublicKey': () => getCrypto().getPublicKey(),

  // ---- Double Ratchet ----
  'ratchet:localBundle': () => ratchetManager.getLocalBundle(),
  'ratchet:identityKey': () => ratchetManager.getIdentityKey(),
  'ratchet:establish': async (peerId: string, bundle: any) => {
    await ratchetManager.establish(peerId, bundle);
    return true;
  },
  'ratchet:encrypt': (peerId: string, plaintext: string) => ratchetManager.encrypt(peerId, plaintext),
  'ratchet:decrypt': (peerId: string, type: number, body: string) => ratchetManager.decrypt(peerId, type, body),
  'ratchet:close': (peerId: string) => {
    ratchetManager.closeSession(peerId);
    return true;
  },

  // ---- Database ----
  'db:saveMessage': (message: any) => getDb().saveMessage(message),
  'db:getContacts': () => getDb().getContacts(),
  'db:saveContact': (contact: any) => getDb().saveContact(contact),
  'db:removeContact': (contactId: string) => getDb().removeContact(contactId),
  'db:getRecentConversations': (limit?: number) => getDb().getRecentConversations(limit),
  'message:getHistory': (peerId: string) => getDb().getMessageHistory(peerId),

  // ---- Message History ----
  'messageHistory:save': (message: any) => getHistory().saveMessage(message),
  'messageHistory:get': (filter: any) => getHistory().getMessages(filter),
  'messageHistory:updateStatus': (messageId: string, status: string) =>
    getHistory().updateMessageStatus(messageId, status as any),
  'messageHistory:delete': (messageId: string) => getHistory().deleteMessage(messageId),
  'messageHistory:clearSession': (sessionId: string) => getHistory().clearSessionMessages(sessionId),
  'messageHistory:setExpiry': (messageId: string, expiresInMs: number) =>
    getHistory().setMessageExpiry(messageId, expiresInMs),
  'messageHistory:search': (keyword: string, sessionId?: string) => getHistory().searchMessages(keyword, sessionId),
  'messageHistory:export': (sessionId?: string, format?: 'json' | 'txt') => getHistory().exportMessages(sessionId, format),
  'messageHistory:getStatistics': () => getHistory().getStatistics(),

  // ---- Presence ----
  'presence:setLocal': (status: string, customStatus?: string) => {
    getPresence().setLocalStatus(status as any, customStatus);
    return true;
  },
  'presence:getLocal': () => getPresence().getLocalStatus(),
  'presence:update': (userId: string, status: string, customStatus?: string) => {
    getPresence().updatePresence(userId, status as any, customStatus);
    return true;
  },
  'presence:get': (userId: string) => getPresence().getPresence(userId),
  'presence:getOnline': () => getPresence().getOnlineUsers(),
  'presence:getBatch': (userIds: string[]) => Array.from(getPresence().getBatchPresence(userIds).entries()),
  'presence:remove': (userId: string) => {
    getPresence().removePresence(userId);
    return true;
  },
  'presence:getStatistics': () => getPresence().getStatistics(),
  'presence:getConfig': () => getPresence().getConfig(),
  'presence:updateConfig': (config: any) => {
    getPresence().updateConfig(config);
    return true;
  }
};

function reply(id: number, ok: boolean, result?: unknown, error?: string): void {
  ctx.postMessage({ id, ok, result, error });
}
function postEvent(event: string, payload: unknown): void {
  ctx.postMessage({ type: 'event', event, payload });
}

ctx.onmessage = async (e: MessageEvent) => {
  const msg = e.data || {};
  try {
    if (msg.type === 'is-initialized') {
      return reply(msg.id, true, await BrowserKeyStore.isInitialized());
    }
    if (msg.type === 'unlock') {
      await bootstrap(msg.passphrase);
      return reply(msg.id, true, true);
    }
    if (msg.type === 'reset') {
      // 忘记口令：清空本地 keyring 与各库数据，回到未初始化状态（旧身份不可恢复）。
      cryptoManager = identityManager = dbManager = messageHistoryManager = presenceManager = null;
      booted = false;
      await BrowserKeyStore.reset();
      return reply(msg.id, true, true);
    }
    if (msg.type === 'invoke') {
      if (!booted) return reply(msg.id, false, undefined, 'Worker 未解锁');
      const handler = handlers[msg.channel];
      if (!handler) return reply(msg.id, false, undefined, `未知 channel: ${msg.channel}`);
      const result = await handler(...(msg.args || []));
      return reply(msg.id, true, result);
    }
    reply(msg.id, false, undefined, `未知消息类型: ${msg.type}`);
  } catch (err: any) {
    reply(msg.id, false, undefined, String(err?.message || err));
  }
};
