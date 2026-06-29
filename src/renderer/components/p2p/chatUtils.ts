/** 从链接或裸 hash 解析房间参数：支持完整 URL（含 #room=..&t=..）或纯 'room=..&t=..'。 */
export function parseRoomLink(input: string): { roomId: string; token: string; persistent: boolean } | null {
  try {
    const hash = input.includes('#') ? input.slice(input.indexOf('#') + 1) : input;
    const params = new URLSearchParams(hash);
    const roomId = params.get('room');
    const token = params.get('t');
    const mode = params.get('m') || params.get('mode');
    if (roomId && token) return { roomId, token, persistent: mode === 'p' || mode === 'persistent' };
  } catch { /* ignore */ }
  return null;
}

export function displayNickname(nickname: string | undefined | null): string {
  const name = (nickname || '').trim();
  if (!name) return '';
  if (name === 'Guest User' || name === '匿名用户' || name === '未知用户') return '';
  if (/^User_[a-z0-9]+_[a-z0-9]+$/i.test(name)) return '';
  return name;
}

export function formatIdentityLabel(prefix: string, nickname: string | undefined | null, userId: string | undefined | null): string {
  const name = displayNickname(nickname);
  const id = (userId || '').trim();
  if (name && id) return `${prefix}${name} · ${id}`;
  if (name) return `${prefix}${name}`;
  return `${prefix}${id}`;
}

export function randomTransferId(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
}
