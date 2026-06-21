import { deriveSafetyCode, groupSafetyCode, SAFETY_CODE_MODULUS } from '../src/web/security/safetyCode';

// Node 20+ 暴露全局 crypto.subtle，deriveSafetyCode 可直接在测试环境跑。
describe('safetyCode (SAS)', () => {
  const A = 'QUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQT0='; // 任意 base64
  const B = 'QkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkI9';

  it('两端排序无关：deriveSafetyCode(a,b) === deriveSafetyCode(b,a)', async () => {
    const ab = await deriveSafetyCode(A, B);
    const ba = await deriveSafetyCode(B, A);
    expect(ab).toBe(ba);
  });

  it('确定性：同输入恒等', async () => {
    expect(await deriveSafetyCode(A, B)).toBe(await deriveSafetyCode(A, B));
  });

  it('不同身份 → 不同安全码（雪崩）', async () => {
    const base = await deriveSafetyCode(A, B);
    const other = await deriveSafetyCode(A, B.slice(0, -2) + 'X='); // 改一字符
    expect(other).not.toBe(base);
  });

  it('格式：20 位数字按 4 位分 5 组', async () => {
    const code = await deriveSafetyCode(A, B);
    expect(code).toMatch(/^\d{4} \d{4} \d{4} \d{4} \d{4}$/);
    expect(code.replace(/ /g, '')).toHaveLength(20);
  });

  it('模数为 10^20（约 2^66.4 熵上界）', () => {
    expect(SAFETY_CODE_MODULUS).toBe(10n ** 20n);
  });

  it('groupSafetyCode 纯函数分组正确', () => {
    expect(groupSafetyCode('12345678901234567890')).toBe('1234 5678 9012 3456 7890');
  });
});
