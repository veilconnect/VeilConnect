import { GATE_TRANSLATIONS, gateStrings, isRtlLang } from '../src/web/gateI18n';
import { SUPPORTED_LANGUAGES } from '../src/renderer/i18n/languages';

/**
 * 口令门禁文案一致性：门禁页独立于主 translations，故单独兜底。
 * 要求所有语言键集与 zh-CN 完全一致、无空串，且 errTooShort 保留 {n} 占位符
 * （否则口令最小长度无法注入，提示会缺数字）。
 */
const REQUIRED_KEYS = [
  'loading', 'promptUnlock', 'promptCreate', 'passphrasePlaceholder', 'confirmPlaceholder',
  'showPassphrase', 'processing', 'unlockBtn', 'createBtn', 'forgotBtn', 'privacyNote',
  'learnMore', 'errTooShort', 'errMismatch', 'errUnlock', 'errReset', 'resetConfirm'
].sort();

describe('gateI18n 门禁文案一致性', () => {
  const locales = Object.keys(GATE_TRANSLATIONS);

  it('覆盖与主 UI 同样的 15 种语言', () => {
    for (const lang of SUPPORTED_LANGUAGES) {
      expect(locales).toContain(lang.code);
    }
    expect(locales.length).toBe(SUPPORTED_LANGUAGES.length);
  });

  it.each(locales)('%s 的 key 集合与基准完全一致', (code) => {
    expect(Object.keys(GATE_TRANSLATIONS[code]).sort()).toEqual(REQUIRED_KEYS);
  });

  it.each(locales)('%s 无空字符串值', (code) => {
    const empties = Object.entries(GATE_TRANSLATIONS[code]).filter(([, v]) => v.trim() === '');
    expect(empties).toEqual([]);
  });

  it.each(locales)('%s 的 errTooShort 保留 {n} 占位符', (code) => {
    expect(GATE_TRANSLATIONS[code].errTooShort).toContain('{n}');
  });

  it('gateStrings 对未知语言回退、对基础码命中', () => {
    expect(gateStrings('xx-YY')).toBe(GATE_TRANSLATIONS['zh-CN']); // 回退默认
    expect(gateStrings('fr')).toBe(GATE_TRANSLATIONS['fr']);
  });

  it('isRtlLang 仅对 RTL 语言为真', () => {
    expect(isRtlLang('ar')).toBe(true);
    expect(isRtlLang('en')).toBe(false);
    expect(isRtlLang('zh-CN')).toBe(false);
  });
});
