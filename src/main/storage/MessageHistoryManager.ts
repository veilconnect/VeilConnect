import Store from 'electron-store';
import { CryptoManager } from '../crypto/CryptoManager';

export type MessageStatus = 'pending' | 'sent' | 'delivered' | 'read' | 'failed';

export interface HistoryMessage {
  id: string;
  sessionId: string;
  peerId: string;
  direction: 'incoming' | 'outgoing';
  content: string;
  contentType: 'text' | 'image' | 'file' | 'system';
  timestamp: number;
  status: MessageStatus;
  expiresAt?: number;
  meta?: Record<string, unknown>;
}

export interface HistoryFilter {
  sessionId?: string;
  peerId?: string;
  since?: number;
  until?: number;
  limit?: number;
}

interface StoreShape {
  messages: HistoryMessage[];
}

export class MessageHistoryManager {
  private store: Store<StoreShape>;
  private cryptoManager: CryptoManager;
  private expiryTimer: NodeJS.Timeout;

  constructor(encryptionKey: string, cryptoManager: CryptoManager) {
    this.store = new Store<StoreShape>({
      name: 'message-history',
      encryptionKey,
      defaults: { messages: [] }
    });
    this.cryptoManager = cryptoManager;
    this.expiryTimer = setInterval(() => this.pruneExpired(), 60_000);
  }

  private getAll(): HistoryMessage[] {
    return this.store.get('messages', []) as HistoryMessage[];
  }

  private writeAll(messages: HistoryMessage[]): void {
    this.store.set('messages', messages);
  }

  private pruneExpired(): void {
    const now = Date.now();
    const kept = this.getAll().filter(m => !m.expiresAt || m.expiresAt > now);
    if (kept.length !== this.getAll().length) {
      this.writeAll(kept);
    }
  }

  saveMessage(message: HistoryMessage): HistoryMessage {
    const messages = this.getAll();
    const existing = messages.findIndex(m => m.id === message.id);
    if (existing >= 0) {
      messages[existing] = message;
    } else {
      messages.push(message);
    }
    this.writeAll(messages);
    return message;
  }

  getMessages(filter: HistoryFilter = {}): HistoryMessage[] {
    const now = Date.now();
    let result = this.getAll().filter(m => !m.expiresAt || m.expiresAt > now);

    if (filter.sessionId) result = result.filter(m => m.sessionId === filter.sessionId);
    if (filter.peerId) result = result.filter(m => m.peerId === filter.peerId);
    if (filter.since != null) result = result.filter(m => m.timestamp >= filter.since!);
    if (filter.until != null) result = result.filter(m => m.timestamp <= filter.until!);

    result.sort((a, b) => a.timestamp - b.timestamp);
    if (filter.limit && result.length > filter.limit) {
      result = result.slice(result.length - filter.limit);
    }
    return result;
  }

  updateMessageStatus(messageId: string, status: MessageStatus): boolean {
    const messages = this.getAll();
    const idx = messages.findIndex(m => m.id === messageId);
    if (idx < 0) return false;
    messages[idx] = { ...messages[idx], status };
    this.writeAll(messages);
    return true;
  }

  deleteMessage(messageId: string): boolean {
    const messages = this.getAll();
    const remaining = messages.filter(m => m.id !== messageId);
    if (remaining.length === messages.length) return false;
    this.writeAll(remaining);
    return true;
  }

  clearSessionMessages(sessionId: string): number {
    const messages = this.getAll();
    const remaining = messages.filter(m => m.sessionId !== sessionId);
    const removed = messages.length - remaining.length;
    this.writeAll(remaining);
    return removed;
  }

  setMessageExpiry(messageId: string, expiresInMs: number): boolean {
    const messages = this.getAll();
    const idx = messages.findIndex(m => m.id === messageId);
    if (idx < 0) return false;
    messages[idx] = { ...messages[idx], expiresAt: Date.now() + expiresInMs };
    this.writeAll(messages);
    return true;
  }

  searchMessages(keyword: string, sessionId?: string): HistoryMessage[] {
    const lower = keyword.toLowerCase();
    return this.getMessages({ sessionId }).filter(m =>
      m.content.toLowerCase().includes(lower)
    );
  }

  exportMessages(sessionId?: string, format: 'json' | 'txt' = 'json'): string {
    const data = this.getMessages({ sessionId });
    if (format === 'txt') {
      return data
        .map(m => `[${new Date(m.timestamp).toISOString()}] ${m.direction} ${m.peerId}: ${m.content}`)
        .join('\n');
    }
    return JSON.stringify(data, null, 2);
  }

  getStatistics(): { total: number; bySession: Record<string, number>; byStatus: Record<MessageStatus, number> } {
    const messages = this.getAll();
    const bySession: Record<string, number> = {};
    const byStatus: Record<MessageStatus, number> = {
      pending: 0, sent: 0, delivered: 0, read: 0, failed: 0
    };
    for (const m of messages) {
      bySession[m.sessionId] = (bySession[m.sessionId] || 0) + 1;
      byStatus[m.status] = (byStatus[m.status] || 0) + 1;
    }
    return { total: messages.length, bySession, byStatus };
  }

  destroy(): void {
    clearInterval(this.expiryTimer);
  }
}
