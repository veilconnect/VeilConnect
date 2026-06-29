import {
  isTeamRoomActive,
  publicTeamRoomConfig,
  slugifyTeamRoom
} from '../src/commercial/teamRoom';

describe('commercial team rooms', () => {
  it('creates stable URL-safe room slugs', () => {
    expect(slugifyTeamRoom(' Executive / IR Bridge ')).toBe('executive-ir-bridge');
  });

  it('checks active state with optional expiration', () => {
    const room = {
      id: 'room_1',
      tenantId: 'tenant_1',
      slug: 'ir',
      label: 'IR bridge',
      status: 'active' as const,
      maxParticipants: 2 as const,
      requirePairingCode: true,
      expiresAt: '2026-07-01T00:00:00.000Z'
    };
    expect(isTeamRoomActive(room, new Date('2026-06-26T00:00:00.000Z'))).toBe(true);
    expect(isTeamRoomActive(room, new Date('2026-07-02T00:00:00.000Z'))).toBe(false);
  });

  it('publishes only safe room config', () => {
    expect(publicTeamRoomConfig({
      id: 'room_1',
      tenantId: 'tenant_1',
      slug: 'legal',
      label: 'Legal bridge',
      status: 'active',
      maxParticipants: 2,
      requirePairingCode: true
    })).toEqual({
      slug: 'legal',
      label: 'Legal bridge',
      active: true,
      maxParticipants: 2,
      requirePairingCode: true
    });
  });
});
