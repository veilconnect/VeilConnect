export type TeamRoomStatus = 'draft' | 'active' | 'archived';

export interface TeamRoomRecord {
  id: string;
  tenantId: string;
  slug: string;
  label: string;
  status: TeamRoomStatus;
  maxParticipants: 2;
  requirePairingCode: boolean;
  expiresAt?: string;
}

export function slugifyTeamRoom(input: string): string {
  const slug = input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
  return slug || 'secure-room';
}

export function isTeamRoomActive(room: TeamRoomRecord, now: Date = new Date()): boolean {
  if (room.status !== 'active') return false;
  if (!room.expiresAt) return true;
  return new Date(room.expiresAt).getTime() > now.getTime();
}

export function publicTeamRoomConfig(room: TeamRoomRecord) {
  return {
    slug: room.slug,
    label: room.label,
    active: isTeamRoomActive(room),
    maxParticipants: room.maxParticipants,
    requirePairingCode: room.requirePairingCode
  };
}
