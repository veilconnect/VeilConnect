import { geoDefaultLanguage } from '../src/renderer/i18n/languages';

/**
 * geoDefaultLanguage 读取 Cloudflare 边缘中间件注入的 <meta name="vc-geo-lang">。
 * 该值作为「浏览器语言之下」的兜底；自部署版无 meta → null → 回退默认。
 * 用 mock document 覆盖各分支（jest 为 node 环境，默认无 document）。
 */
describe('geoDefaultLanguage（地理兜底 meta 读取）', () => {
  const realDoc = (global as { document?: unknown }).document;
  afterEach(() => { (global as { document?: unknown }).document = realDoc; });

  it('无 document（自部署/SSR）→ null', () => {
    delete (global as { document?: unknown }).document;
    expect(geoDefaultLanguage()).toBeNull();
  });

  it('存在 vc-geo-lang meta → 返回其语言码', () => {
    (global as { document?: unknown }).document = {
      querySelector: (s: string) => (s.includes('vc-geo-lang') ? { getAttribute: () => 'fr' } : null)
    };
    expect(geoDefaultLanguage()).toBe('fr');
  });

  it('无该 meta → null', () => {
    (global as { document?: unknown }).document = { querySelector: () => null };
    expect(geoDefaultLanguage()).toBeNull();
  });

  it('meta 内容为空白 → null', () => {
    (global as { document?: unknown }).document = { querySelector: () => ({ getAttribute: () => '   ' }) };
    expect(geoDefaultLanguage()).toBeNull();
  });
});
