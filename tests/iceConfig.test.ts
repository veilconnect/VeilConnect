import { hasTurnServer, readRelayOnly, readStaticTurn } from '../src/web/webrtc/iceConfig';

function fakeStorage(map: Record<string, string>): Pick<Storage, 'getItem'> {
  return { getItem: (k: string) => (k in map ? map[k] : null) };
}

describe('iceConfig', () => {
  describe('hasTurnServer', () => {
    it('识别 turn: / turns: 候选', () => {
      expect(hasTurnServer([{ urls: 'stun:stun.example:3478' }])).toBe(false);
      expect(hasTurnServer([{ urls: 'turn:turn.example:3478' }])).toBe(true);
      expect(hasTurnServer([{ urls: ['stun:a:1', 'turns:b:5349?transport=tcp'] }])).toBe(true);
      expect(hasTurnServer([])).toBe(false);
    });
  });

  describe('readRelayOnly', () => {
    it('默认开启（无配置时为 true）', () => {
      expect(readRelayOnly(fakeStorage({}))).toBe(true);
    });
    it('仅当显式 "0" 才关闭', () => {
      expect(readRelayOnly(fakeStorage({ 'vc.relayOnly': '0' }))).toBe(false);
      expect(readRelayOnly(fakeStorage({ 'vc.relayOnly': '1' }))).toBe(true);
      expect(readRelayOnly(fakeStorage({ 'vc.relayOnly': 'false' }))).toBe(true);
    });
  });

  describe('readStaticTurn', () => {
    it('解析合法 vc.turn', () => {
      const turn = readStaticTurn(fakeStorage({ 'vc.turn': JSON.stringify({ urls: 'turn:h:3478', username: 'u', credential: 'p' }) }));
      expect(turn?.urls).toBe('turn:h:3478');
    });
    it('无配置 / 坏 JSON / 缺 urls → null（不抛错）', () => {
      expect(readStaticTurn(fakeStorage({}))).toBeNull();
      expect(readStaticTurn(fakeStorage({ 'vc.turn': '{not json' }))).toBeNull();
      expect(readStaticTurn(fakeStorage({ 'vc.turn': JSON.stringify({ username: 'u' }) }))).toBeNull();
    });
  });
});
