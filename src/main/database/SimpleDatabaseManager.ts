import Store from 'electron-store';

export interface Message {
  id?: number;
  peerId: string;
  content: string;
  type: 'text' | 'image' | 'file';
  timestamp: number;
  isOutgoing: boolean;
  encrypted: boolean;
  fileName?: string;
  fileSize?: number;
}

export interface Contact {
  id?: number;
  peerId: string;
  publicKey: string;
  nickname: string;
  avatar?: string;
  lastSeen: number;
  isOnline: boolean;
}

type StoreShape = Record<string, unknown>;

const DEFAULTS: StoreShape = {
  messages: {},
  contacts: {},
  counters: {
    messageId: 1,
    contactId: 1
  }
};

export class SimpleDatabaseManager {
  private store: Store<StoreShape>;

  constructor(encryptionKey: string) {
    this.store = new Store<StoreShape>({
      name: 'conversation-db',
      encryptionKey,
      defaults: DEFAULTS
    });
  }

  private nextMessageId(): number {
    const counters = this.store.get('counters') as { messageId: number; contactId: number };
    const nextId = counters?.messageId ?? 1;
    this.store.set('counters.messageId', nextId + 1);
    return nextId;
  }

  private nextContactId(): number {
    const counters = this.store.get('counters') as { messageId: number; contactId: number };
    const nextId = counters?.contactId ?? 1;
    this.store.set('counters.contactId', nextId + 1);
    return nextId;
  }

  private messageKey(peerId: string): string {
    return `messages.${peerId}`;
  }

  private contactKey(peerId: string): string {
    return `contacts.${peerId}`;
  }

  public async saveMessage(message: Message): Promise<number> {
    const messageId = message.id ?? this.nextMessageId();
    const key = this.messageKey(message.peerId);
    const messages = this.store.get(key, []) as Message[];
    const messageWithId = { ...message, id: messageId };

    this.store.set(key, [...messages, messageWithId]);
    return messageId;
  }

  public async getMessageHistory(peerId: string, limit = 50, offset = 0): Promise<Message[]> {
    const key = this.messageKey(peerId);
    const messages = [...(this.store.get(key, []) as Message[])];
    const sorted = messages.sort((a, b) => a.timestamp - b.timestamp);
    const start = Math.max(0, sorted.length - limit - offset);
    const end = sorted.length - offset;
    return sorted.slice(start, end);
  }

  public async saveContact(contact: Contact): Promise<number> {
    const contacts = this.store.get('contacts', {}) as Record<string, Contact>;
    const existing = contacts[contact.peerId];
    const contactId = existing?.id ?? this.nextContactId();
    const updated = { ...contact, id: contactId };

    this.store.set(this.contactKey(contact.peerId), updated);
    return contactId;
  }

  public async getContacts(): Promise<Contact[]> {
    const contacts = this.store.get('contacts', {}) as Record<string, Contact>;
    return Object.values(contacts);
  }

  public async updateContactOnlineStatus(peerId: string, isOnline: boolean): Promise<void> {
    const key = this.contactKey(peerId);
    const contact = this.store.get(key) as Contact | undefined;
    if (!contact) {
      return;
    }

    this.store.set(key, {
      ...contact,
      isOnline,
      lastSeen: Date.now()
    });
  }

  public async deleteContact(peerId: string): Promise<void> {
    this.store.delete(this.contactKey(peerId));
    this.store.delete(this.messageKey(peerId));
  }

  public async removeContact(contactId: string): Promise<void> {
    const contacts = this.store.get('contacts', {}) as Record<string, Contact>;
    if (contacts[contactId]) {
      await this.deleteContact(contactId);
      return;
    }

    const targetEntry = Object.entries(contacts).find(([, value]) => String(value.id) === contactId);
    if (targetEntry) {
      await this.deleteContact(targetEntry[0]);
    }
  }

  public async searchMessages(query: string, peerId?: string): Promise<Message[]> {
    const lowerQuery = query.toLowerCase();
    const peers = peerId ? [peerId] : Object.keys(this.store.get('messages', {}) as Record<string, Message[]>);
    const results: Message[] = [];

    peers.forEach(id => {
      const peerMessages = this.store.get(this.messageKey(id), []) as Message[];
      results.push(
        ...peerMessages.filter((msg: Message) => {
          if (msg.content.toLowerCase().includes(lowerQuery)) return true;
          if (msg.fileName && msg.fileName.toLowerCase().includes(lowerQuery)) return true;
          return false;
        })
      );
    });

    return results.sort((a, b) => b.timestamp - a.timestamp);
  }

  public async getRecentConversations(limit = 20): Promise<any[]> {
    const conversations: any[] = [];
    const contacts = this.store.get('contacts', {}) as Record<string, Contact>;
    const messageBuckets = this.store.get('messages', {}) as Record<string, Message[]>;

    Object.entries(messageBuckets).forEach(([peerId, messages]) => {
      if (!messages.length) {
        return;
      }
      const sorted = [...messages].sort((a, b) => b.timestamp - a.timestamp);
      const lastMessage = sorted[0];
      const contact = contacts[peerId];

      conversations.push({
        peerId,
        nickname: contact?.nickname || peerId,
        avatar: contact?.avatar,
        lastMessage: lastMessage.content,
        lastMessageTime: lastMessage.timestamp,
        unreadCount: 0,
        isOnline: contact?.isOnline || false
      });
    });

    return conversations.sort((a, b) => b.lastMessageTime - a.lastMessageTime).slice(0, limit);
  }

  public close(): void {
    // electron-store does not require explicit closing but we keep the method for API parity.
  }

  public getStats(): { messageCount: number; contactCount: number } {
    const messages = this.store.get('messages', {}) as Record<string, Message[]>;
    const contacts = this.store.get('contacts', {}) as Record<string, Contact>;
    const messageCount = Object.values(messages).reduce((acc, bucket) => acc + bucket.length, 0);
    return {
      messageCount,
      contactCount: Object.keys(contacts).length
    };
  }
}