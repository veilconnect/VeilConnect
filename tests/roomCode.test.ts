import {
  deriveRoomCredentials,
  isValidRoomCode,
  normalizeRoomCode,
  MIN_ROOM_CODE_LENGTH
} from '../src/web/signaling/SignalingClient';

describe('room code (自定义房间号)', () => {
  it('两端用同一房间号派生出相同的 roomId/token', async () => {
    const a = await deriveRoomCredentials('cafe-meetup-42');
    const b = await deriveRoomCredentials('cafe-meetup-42');
    expect(a).toEqual(b);
  });

  it('归一化：大小写/首尾及内部空白不影响结果', async () => {
    const a = await deriveRoomCredentials('  Cafe   Meetup 42 ');
    const b = await deriveRoomCredentials('cafe meetup 42');
    expect(a).toEqual(b);
  });

  it('不同房间号 → 不同 roomId 且 roomId≠token', async () => {
    const a = await deriveRoomCredentials('room-one');
    const b = await deriveRoomCredentials('room-two');
    expect(a.roomId).not.toBe(b.roomId);
    expect(a.roomId).not.toBe(a.token);
  });

  it('token 满足信令服务器长度要求(16-128)，roomId 满足(4-128)', async () => {
    const { roomId, token } = await deriveRoomCredentials('some-room-code');
    expect(token.length).toBeGreaterThanOrEqual(16);
    expect(token.length).toBeLessThanOrEqual(128);
    expect(roomId.length).toBeGreaterThanOrEqual(4);
    expect(roomId.length).toBeLessThanOrEqual(128);
    expect(roomId.startsWith('rc-')).toBe(true);
  });

  it('isValidRoomCode 拒绝短码（< 最小长度）', () => {
    expect(MIN_ROOM_CODE_LENGTH).toBe(8);
    expect(isValidRoomCode('abc')).toBe(false);
    expect(isValidRoomCode('  ab  ')).toBe(false);
    expect(isValidRoomCode('abcdef')).toBe(false);   // 6 < 8
    expect(isValidRoomCode('abcdefgh')).toBe(true);  // 8
    expect(isValidRoomCode('cafe-meetup-42')).toBe(true);
  });

  it('normalizeRoomCode 幂等', () => {
    const once = normalizeRoomCode('  A  B  c ');
    expect(normalizeRoomCode(once)).toBe(once);
    expect(once).toBe('a b c');
  });
});
