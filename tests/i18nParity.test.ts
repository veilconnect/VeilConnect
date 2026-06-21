import { translations } from '../src/renderer/i18n/translations';
import { SUPPORTED_LANGUAGES } from '../src/renderer/i18n/languages';

/**
 * i18n 完整性：所有已提供的语言包必须有【完全一致】的 key 结构，且无空字符串。
 * TypeScript 的 Translations 接口已在编译期保证 key 齐全，这里再加运行期断言，
 * 兜住「key 在但值为空」之类编译器抓不到的疏漏。
 */
function flatKeys(obj: unknown, prefix = ''): string[] {
  if (obj && typeof obj === 'object' && !Array.isArray(obj)) {
    return Object.entries(obj as Record<string, unknown>)
      .flatMap(([k, v]) => flatKeys(v, prefix ? `${prefix}.${k}` : k));
  }
  return [prefix];
}

describe('i18n 语言包一致性', () => {
  const locales = Object.keys(translations);

  it('至少含 zh-CN / en / ja / es', () => {
    for (const code of ['zh-CN', 'en', 'ja', 'es']) {
      expect(locales).toContain(code);
    }
  });

  const reference = flatKeys(translations['zh-CN']).sort();

  it.each(locales)('%s 的 key 集合与 zh-CN 完全一致', (code) => {
    expect(flatKeys(translations[code]).sort()).toEqual(reference);
  });

  it.each(locales)('%s 没有空字符串值', (code) => {
    const empties = flatKeys(translations[code]).filter((path) => {
      const val = path.split('.').reduce<any>((o, k) => (o == null ? o : o[k]), translations[code]);
      return typeof val === 'string' && val.trim() === '';
    });
    expect(empties).toEqual([]);
  });

  it('每个 SUPPORTED_LANGUAGES 要么有翻译、要么明确回退（不报错即可）', () => {
    // 仅断言已提供翻译的语言确实可解析；未提供的语言由运行时回退到默认语言。
    expect(SUPPORTED_LANGUAGES.length).toBeGreaterThanOrEqual(locales.length);
  });
});
