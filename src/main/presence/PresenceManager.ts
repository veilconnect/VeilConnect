import { EventEmitter } from 'events';

export type PresenceStatus = 'online' | 'away' | 'busy' | 'offline' | 'custom';

export interface Presence {
  userId: string;
  status: PresenceStatus;
  customStatus?: string;
  lastSeen: number;
}

export interface PresenceConfig {
  interval: number;
  timeout: number;
}

const LOCAL_ID = '__local__';

export class PresenceManager extends EventEmitter {
  private presences: Map<string, Presence> = new Map();
  private config: PresenceConfig;
  private sweepTimer: NodeJS.Timeout;

  constructor(config: PresenceConfig) {
    super();
    this.config = config;
    this.presences.set(LOCAL_ID, {
      userId: LOCAL_ID,
      status: 'online',
      lastSeen: Date.now()
    });
    this.sweepTimer = setInterval(() => this.sweepStale(), config.interval);
  }

  private sweepStale(): void {
    const now = Date.now();
    for (const [id, p] of this.presences) {
      if (id === LOCAL_ID) continue;
      if (p.status !== 'offline' && now - p.lastSeen > this.config.timeout) {
        const updated = { ...p, status: 'offline' as PresenceStatus };
        this.presences.set(id, updated);
        this.emit('presenceChange', updated);
      }
    }
  }

  setLocalStatus(status: PresenceStatus, customStatus?: string): void {
    const local: Presence = {
      userId: LOCAL_ID,
      status,
      customStatus,
      lastSeen: Date.now()
    };
    this.presences.set(LOCAL_ID, local);
    this.emit('presenceChange', local);
  }

  getLocalStatus(): Presence {
    return this.presences.get(LOCAL_ID)!;
  }

  updatePresence(userId: string, status: PresenceStatus, customStatus?: string): void {
    const presence: Presence = {
      userId,
      status,
      customStatus,
      lastSeen: Date.now()
    };
    this.presences.set(userId, presence);
    this.emit('presenceChange', presence);
  }

  getPresence(userId: string): Presence | null {
    return this.presences.get(userId) || null;
  }

  getOnlineUsers(): Presence[] {
    return Array.from(this.presences.values()).filter(
      p => p.userId !== LOCAL_ID && p.status === 'online'
    );
  }

  getBatchPresence(userIds: string[]): Map<string, Presence> {
    const result = new Map<string, Presence>();
    for (const id of userIds) {
      const p = this.presences.get(id);
      if (p) result.set(id, p);
    }
    return result;
  }

  removePresence(userId: string): void {
    if (userId === LOCAL_ID) return;
    if (this.presences.delete(userId)) {
      this.emit('presenceRemoved', userId);
    }
  }

  getStatistics(): { total: number; online: number; away: number; busy: number; offline: number } {
    const stats = { total: 0, online: 0, away: 0, busy: 0, offline: 0 };
    for (const [id, p] of this.presences) {
      if (id === LOCAL_ID) continue;
      stats.total++;
      if (p.status in stats) {
        (stats as any)[p.status]++;
      }
    }
    return stats;
  }

  getConfig(): PresenceConfig {
    return { ...this.config };
  }

  updateConfig(config: Partial<PresenceConfig>): void {
    this.config = { ...this.config, ...config };
    clearInterval(this.sweepTimer);
    this.sweepTimer = setInterval(() => this.sweepStale(), this.config.interval);
  }

  destroy(): void {
    clearInterval(this.sweepTimer);
    this.removeAllListeners();
  }
}
