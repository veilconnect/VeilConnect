import { contextBridge, ipcRenderer } from 'electron';

const invoke = <T = unknown>(channel: string, ...args: unknown[]) =>
  ipcRenderer.invoke(channel, ...args) as Promise<T>;

const electronAPI = {
  identity: {
    getCurrentIdentity: () => invoke('identity:getCurrentIdentity'),
    createNewIdentity: (nickname?: string) => invoke('identity:createNewIdentity', nickname),
    saveIdentity: (identity: unknown) => invoke('identity:saveIdentity', identity),
    updateIdentity: (updates: unknown) => invoke('identity:updateIdentity', updates),
    updateUserInfo: (updates: unknown) => invoke('identity:updateUserInfo', updates),
    exportIdentity: () => invoke<string>('identity:exportIdentity'),
    exportIdentityEncrypted: (password: string) =>
      invoke<string>('identity:exportIdentityEncrypted', password),
    importPeerIdentity: (data: string) => invoke('identity:importPeerIdentity', data),
    signEphemeralKey: (ephemeralPublicKey: string) =>
      invoke<string>('identity:signEphemeralKey', ephemeralPublicKey),
    verifyEphemeralKey: (peerPublicKey: string, ephemeralPublicKey: string, signature: string) =>
      invoke<boolean>('identity:verifyEphemeralKey', peerPublicKey, ephemeralPublicKey, signature),
    importIdentityEncrypted: (data: string, password: string) =>
      invoke('identity:importIdentityEncrypted', data, password),
    generateQRCode: () => invoke<string>('identity:generateQRCode'),
    parseQRCode: (data: string) => invoke('identity:parseQRCode', data),
    getPeerIdentities: () => invoke('identity:getPeerIdentities'),
    verifyUserId: (userId: string, publicKey: string) =>
      invoke<boolean>('identity:verifyUserId', userId, publicKey)
  },

  crypto: {
    generateKeyPair: () => invoke('crypto:generateKeyPair'),
    getPublicKey: () => invoke<string>('crypto:getPublicKey')
  },

  // Double Ratchet（每条消息级前向保密）
  ratchet: {
    localBundle: () => invoke('ratchet:localBundle'),
    identityKey: () => invoke<string>('ratchet:identityKey'),
    establish: (peerId: string, bundle: unknown) => invoke<boolean>('ratchet:establish', peerId, bundle),
    encrypt: (peerId: string, plaintext: string) =>
      invoke<{ type: number; body: string }>('ratchet:encrypt', peerId, plaintext),
    decrypt: (peerId: string, type: number, body: string) =>
      invoke<string>('ratchet:decrypt', peerId, type, body),
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
    updateStatus: (messageId: string, status: string) =>
      invoke('messageHistory:updateStatus', messageId, status),
    delete: (messageId: string) => invoke('messageHistory:delete', messageId),
    clearSession: (sessionId: string) => invoke('messageHistory:clearSession', sessionId),
    setExpiry: (messageId: string, expiresInMs: number) =>
      invoke('messageHistory:setExpiry', messageId, expiresInMs),
    search: (keyword: string, sessionId?: string) =>
      invoke('messageHistory:search', keyword, sessionId),
    export: (sessionId?: string, format?: 'json' | 'txt') =>
      invoke('messageHistory:export', sessionId, format),
    getStatistics: () => invoke('messageHistory:getStatistics')
  },

  presence: {
    setLocal: (status: string, customStatus?: string) =>
      invoke('presence:setLocal', status, customStatus),
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
      const listener = (_: unknown, presence: unknown) => handler(presence);
      ipcRenderer.on('presence:changed', listener);
      return () => ipcRenderer.removeListener('presence:changed', listener);
    }
  },

  // fileTransfer 已从 preload 移除：旧实现把任意 filePath/targetPath 直通到主进程的
  // fs 读写，构成任意文件读/写原语，且当前 UI 未使用。重新启用时须改为 dialog 选路径。

  app: {
    getVersion: () => invoke<string>('app:getVersion'),
    getPlatform: () => invoke<string>('app:getPlatform'),
    quit: () => invoke('app:quit')
  },

  window: {
    minimize: () => invoke('window:minimize'),
    maximize: () => invoke('window:maximize'),
    close: () => invoke('window:close')
  },

  notification: {
    show: (title: string, body: string) => invoke('notification:show', title, body)
  }
};

export type ElectronAPI = typeof electronAPI;

contextBridge.exposeInMainWorld('electronAPI', electronAPI);

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
