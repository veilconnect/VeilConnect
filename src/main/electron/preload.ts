/**
 * 桌面端 preload —— 经 contextBridge 暴露 `window.electronAPI`，**形状与 web 桥接
 * (src/web/bridge/electronAPI.ts) 完全一致**，故三个渲染文件无需改动即可复用。
 *
 * 渲染端运行在 sandbox + contextIsolation 下，没有 Node 能力；所有能力都经 ipcRenderer.invoke
 * 转给主进程（私钥/解密只在主进程 Manager 内）。这是桌面端「私钥不出主进程」的实处。
 */
import { contextBridge, ipcRenderer } from 'electron';

function invoke<T = unknown>(channel: string, ...args: unknown[]): Promise<T> {
  return ipcRenderer.invoke(channel, ...args) as Promise<T>;
}

const presenceHandlers = new Set<(p: unknown) => void>();
ipcRenderer.on('event:presence:changed', (_e, payload) => {
  presenceHandlers.forEach(h => h(payload));
});

const electronAPI = {
  identity: {
    getCurrentIdentity: () => invoke('identity:getCurrentIdentity'),
    createNewIdentity: (nickname?: string) => invoke('identity:createNewIdentity', nickname),
    saveIdentity: (identity: unknown) => invoke('identity:saveIdentity', identity),
    updateIdentity: (updates: unknown) => invoke('identity:updateIdentity', updates),
    updateUserInfo: (updates: unknown) => invoke('identity:updateUserInfo', updates),
    exportIdentity: () => invoke<string>('identity:exportIdentity'),
    exportIdentityEncrypted: (password: string) => invoke<string>('identity:exportIdentityEncrypted', password),
    importPeerIdentity: (data: string) => invoke('identity:importPeerIdentity', data),
    signEphemeralKey: (ephemeralPublicKey: string) => invoke<string>('identity:signEphemeralKey', ephemeralPublicKey),
    verifyEphemeralKey: (peerPublicKey: string, ephemeralPublicKey: string, signature: string) =>
      invoke<boolean>('identity:verifyEphemeralKey', peerPublicKey, ephemeralPublicKey, signature),
    importIdentityEncrypted: (data: string, password: string) =>
      invoke('identity:importIdentityEncrypted', data, password),
    generateQRCode: () => invoke<string>('identity:generateQRCode'),
    parseQRCode: (data: string) => invoke('identity:parseQRCode', data),
    getPeerIdentities: () => invoke('identity:getPeerIdentities'),
    verifyUserId: (userId: string, publicKey: string) => invoke<boolean>('identity:verifyUserId', userId, publicKey)
  },
  crypto: {
    generateKeyPair: () => invoke('crypto:generateKeyPair'),
    getPublicKey: () => invoke<string>('crypto:getPublicKey')
  },
  ratchet: {
    localBundle: () => invoke('ratchet:localBundle'),
    identityKey: () => invoke<string>('ratchet:identityKey'),
    establish: (peerId: string, bundle: unknown) => invoke<boolean>('ratchet:establish', peerId, bundle),
    encrypt: (peerId: string, plaintext: string) =>
      invoke<{ type: number; body: string }>('ratchet:encrypt', peerId, plaintext),
    decrypt: (peerId: string, type: number, body: string) => invoke<string>('ratchet:decrypt', peerId, type, body),
    close: (peerId: string) => invoke('ratchet:close', peerId)
  },
  db: {
    saveMessage: (message: unknown) => invoke('db:saveMessage', message),
    getContacts: () => invoke('db:getContacts'),
    saveContact: (contact: unknown) => invoke('db:saveContact', contact),
    removeContact: (contactId: string) => invoke('db:removeContact', contactId),
    getRecentConversations: (limit?: number) => invoke('db:getRecentConversations', limit),
    getMessageHistory: (peerId: string) => invoke('message:getHistory', peerId)
  },
  messageHistory: {
    save: (message: unknown) => invoke('messageHistory:save', message),
    get: (filter: unknown) => invoke('messageHistory:get', filter),
    updateStatus: (messageId: string, status: string) => invoke('messageHistory:updateStatus', messageId, status),
    delete: (messageId: string) => invoke('messageHistory:delete', messageId),
    clearSession: (sessionId: string) => invoke('messageHistory:clearSession', sessionId),
    setExpiry: (messageId: string, expiresInMs: number) => invoke('messageHistory:setExpiry', messageId, expiresInMs),
    search: (keyword: string, sessionId?: string) => invoke('messageHistory:search', keyword, sessionId),
    export: (sessionId?: string, format?: 'json' | 'txt') => invoke('messageHistory:export', sessionId, format),
    getStatistics: () => invoke('messageHistory:getStatistics')
  },
  presence: {
    setLocal: (status: string, customStatus?: string) => invoke('presence:setLocal', status, customStatus),
    getLocal: () => invoke('presence:getLocal'),
    update: (userId: string, status: string, customStatus?: string) =>
      invoke('presence:update', userId, status, customStatus),
    get: (userId: string) => invoke('presence:get', userId),
    getOnline: () => invoke('presence:getOnline'),
    getBatch: (userIds: string[]) => invoke('presence:getBatch', userIds),
    remove: (userId: string) => invoke('presence:remove', userId),
    getStatistics: () => invoke('presence:getStatistics'),
    getConfig: () => invoke('presence:getConfig'),
    updateConfig: (config: unknown) => invoke('presence:updateConfig', config),
    onChange: (handler: (presence: unknown) => void) => {
      presenceHandlers.add(handler);
      return () => presenceHandlers.delete(handler);
    }
  },
  app: {
    getVersion: () => invoke<string>('app:getVersion'),
    getPlatform: () => Promise.resolve(process.platform),
    quit: () => invoke('app:quit')
  },
  window: {
    minimize: () => invoke('window:minimize'),
    maximize: () => invoke('window:maximize'),
    close: () => invoke('window:close')
  },
  notification: {
    show: (title: string, body: string) => invoke('notification:show', title, body)
  },
  // 桌面端：钥匙串自动解锁（无口令门禁）；清本机数据 = 重置 keyring。
  system: {
    clearLocalData: () => invoke('keystore:reset')
  },
  keystore: {
    isInitialized: () => invoke<boolean>('keystore:isInitialized'),
    reset: () => invoke<boolean>('keystore:reset')
  }
};

contextBridge.exposeInMainWorld('electronAPI', electronAPI);
