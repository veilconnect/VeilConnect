/**
 * 桌面端 IPC 处理 —— 与 crypto-worker.ts 的 handlers 映射【逐条一致】（同样的 channel 字符串、
 * 同样的 Manager 调用），区别仅在于：桌面端 Manager 原生运行（真实 electron-store + node crypto），
 * 密钥来自 OS 钥匙串保护的 SecureKeyStore，而非浏览器口令派生。
 *
 * 渲染端通过 preload 暴露的 window.electronAPI 调用，形状与 web 版桥接完全相同，
 * 故三个渲染文件无需改动即可在桌面端复用。
 */
import { CryptoManager } from '../crypto/CryptoManager';
import { RatchetManager } from '../crypto/RatchetManager';
import { IdentityManager } from '../identity/IdentityManager';
import { MessageHistoryManager } from '../storage/MessageHistoryManager';
import { PresenceManager } from '../presence/PresenceManager';
import { SimpleDatabaseManager } from '../database/SimpleDatabaseManager';
import type { SecureKeyStore } from './secureKeyStore';

export interface Managers {
  crypto: CryptoManager;
  identity: IdentityManager;
  ratchet: RatchetManager;
  db: SimpleDatabaseManager;
  history: MessageHistoryManager;
  presence: PresenceManager;
}

/** 发给渲染端的身份对象一律剥离 secretKey（与 worker.toRendererIdentity 一致）。 */
function toRendererIdentity<T extends { secretKey?: string } | null>(identity: T): T {
  if (!identity) return identity;
  const { secretKey, ...safe } = identity as any;
  void secretKey;
  return safe as T;
}

/** 确保当前身份已绑定本机 X25519 加密公钥（与 worker.bindCurrentBoxKeyToIdentity 一致）。 */
function bindCurrentBoxKeyToIdentity(m: Managers): void {
  try {
    const boxPub = m.crypto.getPublicKey();
    const current = m.identity.getCurrentIdentity();
    if (!current) return;
    const alreadyBound =
      current.boxPublicKey === boxPub &&
      !!current.keyBindingSignature &&
      m.identity.verifyKeyBinding({
        publicKey: current.publicKey,
        boxPublicKey: current.boxPublicKey!,
        keyBindingSignature: current.keyBindingSignature!
      });
    if (!alreadyBound) m.identity.attachBoxPublicKey(boxPub);
  } catch (err) {
    console.warn('[identity] failed to bind box public key', err);
  }
}

/** 从 SecureKeyStore 取各库 per-store 密钥并实例化全部 Manager。 */
export function createManagers(keyStore: SecureKeyStore): Managers {
  const crypto = new CryptoManager(keyStore.getKey('crypto-store'));
  const identity = new IdentityManager(keyStore.getKey('identity-store'));
  const db = new SimpleDatabaseManager(keyStore.getKey('database-store'));
  const history = new MessageHistoryManager(keyStore.getKey('message-history-store'), crypto);
  const ratchet = new RatchetManager();
  const presence = new PresenceManager({ interval: 30000, timeout: 60000 });
  const managers: Managers = { crypto, identity, ratchet, db, history, presence };
  bindCurrentBoxKeyToIdentity(managers);
  return managers;
}

/** channel → handler。与 crypto-worker.ts 的 handlers 一一对应。 */
export function buildHandlers(m: Managers): Record<string, (...args: any[]) => any> {
  return {
    // ---- Identity ----
    'identity:getCurrentIdentity': () => toRendererIdentity(m.identity.getCurrentIdentity()),
    'identity:createNewIdentity': (nickname?: string) => {
      m.identity.createNewIdentity(nickname ?? 'Guest User');
      bindCurrentBoxKeyToIdentity(m);
      return toRendererIdentity(m.identity.getCurrentIdentity());
    },
    'identity:saveIdentity': (identity: any) => toRendererIdentity(m.identity.saveIdentity(identity)),
    'identity:updateIdentity': (updates: any) => toRendererIdentity(m.identity.updateIdentity(updates)),
    'identity:updateUserInfo': (updates: any) => m.identity.updateUserInfo(updates),
    'identity:exportIdentity': () => m.identity.exportIdentity(),
    'identity:exportIdentityEncrypted': (password: string) => m.identity.exportIdentityEncrypted(password),
    'identity:importPeerIdentity': (data: string) => m.identity.importPeerIdentity(data),
    'identity:importIdentityEncrypted': (payload: string, password: string) => {
      m.identity.importIdentityEncrypted(payload, password);
      bindCurrentBoxKeyToIdentity(m);
      return toRendererIdentity(m.identity.getCurrentIdentity());
    },
    'identity:generateQRCode': () => m.identity.generateQRCodeData(),
    'identity:parseQRCode': (qrData: string) => m.identity.parseQRCodeData(qrData),
    'identity:getPeerIdentities': () => m.identity.getPeerIdentities(),
    'identity:verifyUserId': (userId: string, publicKey: string) => m.identity.verifyUserId(userId, publicKey),
    'identity:signEphemeralKey': (ephemeralPublicKey: string) => m.identity.signEphemeralKey(ephemeralPublicKey),
    'identity:verifyEphemeralKey': (peerPublicKey: string, ephemeralPublicKey: string, signature: string) =>
      m.identity.verifyEphemeralKey(peerPublicKey, ephemeralPublicKey, signature),

    // ---- Crypto ----
    'crypto:generateKeyPair': () => {
      const { publicKey } = m.crypto.generateKeyPair();
      bindCurrentBoxKeyToIdentity(m);
      return { publicKey };
    },
    'crypto:getPublicKey': () => m.crypto.getPublicKey(),

    // ---- Double Ratchet ----
    'ratchet:localBundle': () => m.ratchet.getLocalBundle(),
    'ratchet:identityKey': () => m.ratchet.getIdentityKey(),
    'ratchet:establish': async (peerId: string, bundle: any) => {
      await m.ratchet.establish(peerId, bundle);
      return true;
    },
    'ratchet:encrypt': (peerId: string, plaintext: string) => m.ratchet.encrypt(peerId, plaintext),
    'ratchet:decrypt': (peerId: string, type: number, body: string) => m.ratchet.decrypt(peerId, type, body),
    'ratchet:close': (peerId: string) => {
      m.ratchet.closeSession(peerId);
      return true;
    },

    // ---- Database ----
    'db:saveMessage': (message: any) => m.db.saveMessage(message),
    'db:getContacts': () => m.db.getContacts(),
    'db:saveContact': (contact: any) => m.db.saveContact(contact),
    'db:removeContact': (contactId: string) => m.db.removeContact(contactId),
    'db:getRecentConversations': (limit?: number) => m.db.getRecentConversations(limit),
    'message:getHistory': (peerId: string) => m.db.getMessageHistory(peerId),

    // ---- Message History ----
    'messageHistory:save': (message: any) => m.history.saveMessage(message),
    'messageHistory:get': (filter: any) => m.history.getMessages(filter),
    'messageHistory:updateStatus': (messageId: string, status: string) =>
      m.history.updateMessageStatus(messageId, status as any),
    'messageHistory:delete': (messageId: string) => m.history.deleteMessage(messageId),
    'messageHistory:clearSession': (sessionId: string) => m.history.clearSessionMessages(sessionId),
    'messageHistory:setExpiry': (messageId: string, expiresInMs: number) =>
      m.history.setMessageExpiry(messageId, expiresInMs),
    'messageHistory:search': (keyword: string, sessionId?: string) => m.history.searchMessages(keyword, sessionId),
    'messageHistory:export': (sessionId?: string, format?: 'json' | 'txt') => m.history.exportMessages(sessionId, format),
    'messageHistory:getStatistics': () => m.history.getStatistics(),

    // ---- Presence ----
    'presence:setLocal': (status: string, customStatus?: string) => {
      m.presence.setLocalStatus(status as any, customStatus);
      return true;
    },
    'presence:getLocal': () => m.presence.getLocalStatus(),
    'presence:update': (userId: string, status: string, customStatus?: string) => {
      m.presence.updatePresence(userId, status as any, customStatus);
      return true;
    },
    'presence:get': (userId: string) => m.presence.getPresence(userId),
    'presence:getOnline': () => m.presence.getOnlineUsers(),
    'presence:getBatch': (userIds: string[]) => Array.from(m.presence.getBatchPresence(userIds).entries()),
    'presence:remove': (userId: string) => {
      m.presence.removePresence(userId);
      return true;
    },
    'presence:getStatistics': () => m.presence.getStatistics(),
    'presence:getConfig': () => m.presence.getConfig(),
    'presence:updateConfig': (config: any) => {
      m.presence.updateConfig(config);
      return true;
    }
  };
}
