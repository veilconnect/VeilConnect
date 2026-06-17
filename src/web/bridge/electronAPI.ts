/**
 * 浏览器版 `window.electronAPI` 桥接层 —— 替代桌面端的 preload.ts。
 *
 * 形状与 preload.ts **完全一致**，因此三个渲染文件（VeilConnectApp / SimpleApp /
 * SimpleP2PChat）无需改动即可工作：每个方法把 { channel, args } 经 postMessage 发给
 * crypto-worker，并以 Promise 等待回复（对应桌面端的 ipcRenderer.invoke）。
 *
 * app / window / notification 三个域是 Electron 专有、且 notification 需主线程 API，
 * 故在本桥接层直接用浏览器等价实现，不走 Worker 往返。
 */

let worker: Worker | null = null;
let seq = 0;
const pending = new Map<number, { resolve: (v: any) => void; reject: (e: any) => void }>();
const presenceHandlers = new Set<(presence: unknown) => void>();

function ensureWorker(): Worker {
  if (worker) return worker;
  worker = new Worker(new URL('../worker/crypto-worker.ts', import.meta.url));
  worker.onmessage = (e: MessageEvent) => {
    const msg = e.data || {};
    if (msg.type === 'event') {
      if (msg.event === 'presence:changed') {
        presenceHandlers.forEach(h => h(msg.payload));
      }
      return;
    }
    const p = pending.get(msg.id);
    if (!p) return;
    pending.delete(msg.id);
    if (msg.ok) p.resolve(msg.result);
    else p.reject(new Error(msg.error || 'worker error'));
  };
  worker.onerror = (err) => {
    console.error('[crypto-worker] error', err);
  };
  return worker;
}

function post(type: string, payload: Record<string, unknown> = {}): Promise<any> {
  const w = ensureWorker();
  const id = ++seq;
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject });
    w.postMessage({ id, type, ...payload });
  });
}

function invoke<T = unknown>(channel: string, ...args: unknown[]): Promise<T> {
  return post('invoke', { channel, args }) as Promise<T>;
}

// ---- 解锁控制（供 index.tsx 的解锁界面调用）----
export function isKeyStoreInitialized(): Promise<boolean> {
  return post('is-initialized');
}
export function unlock(passphrase: string): Promise<boolean> {
  return post('unlock', { passphrase });
}
// 忘记口令：清空本地身份与密钥，重置为未初始化（之后可用新口令重新创建身份）。
export function resetKeyStore(): Promise<boolean> {
  return post('reset');
}

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

  // ---- 以下为浏览器本地实现（无需 Worker 往返）----
  app: {
    getVersion: () => Promise.resolve('1.0.0-web'),
    getPlatform: () => Promise.resolve('web'),
    quit: () => Promise.resolve(undefined) // 网页无法退出进程，空操作
  },

  window: {
    minimize: () => Promise.resolve(undefined),
    maximize: () => Promise.resolve(undefined),
    close: () => Promise.resolve(undefined)
  },

  notification: {
    show: async (title: string, body: string) => {
      try {
        if (typeof Notification === 'undefined') return;
        if (Notification.permission === 'default') {
          await Notification.requestPermission();
        }
        if (Notification.permission === 'granted') {
          new Notification(title, { body });
        }
      } catch {
        /* 通知不可用时静默 */
      }
    }
  }
};

export type ElectronAPI = typeof electronAPI;

/** 把桥接对象挂到 window.electronAPI（渲染端代码与桌面端一致地通过它调用能力）。 */
export function installElectronAPI(): void {
  (window as any).electronAPI = electronAPI;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
