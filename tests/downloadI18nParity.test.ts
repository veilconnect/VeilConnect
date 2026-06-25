import { DOWNLOAD_TRANSLATIONS, downloadStrings } from '../src/web/blob/downloadI18n';
import { SUPPORTED_LANGUAGES } from '../src/renderer/i18n/languages';

/**
 * 文件下载落地页文案一致性：该页独立于主 translations，故单独兜底。
 * 要求所有语言键集一致、无空串，且 progress 保留 {pct} 占位符。
 */
const REQUIRED_KEYS = [
  'invalidLink', 'title', 'subtitle', 'decryptedVerified', 'savedToDiskSuffix', 'redownload',
  'passwordPlaceholder', 'errWithPassword', 'errNoPassword', 'progress', 'processing',
  'downloadWithPassword', 'downloadDecrypt', 'keyWarning'
].sort();

describe('downloadI18n 下载页文案一致性', () => {
  const locales = Object.keys(DOWNLOAD_TRANSLATIONS);

  it('覆盖与主 UI 同样的 15 种语言', () => {
    for (const lang of SUPPORTED_LANGUAGES) {
      expect(locales).toContain(lang.code);
    }
    expect(locales.length).toBe(SUPPORTED_LANGUAGES.length);
  });

  it.each(locales)('%s 的 key 集合与基准完全一致', (code) => {
    expect(Object.keys(DOWNLOAD_TRANSLATIONS[code]).sort()).toEqual(REQUIRED_KEYS);
  });

  it.each(locales)('%s 无空字符串值（savedToDiskSuffix 例外，允许前导空格）', (code) => {
    const empties = Object.entries(DOWNLOAD_TRANSLATIONS[code])
      .filter(([k, v]) => k !== 'savedToDiskSuffix' && v.trim() === '');
    expect(empties).toEqual([]);
  });

  it.each(locales)('%s 的 progress 保留 {pct} 占位符', (code) => {
    expect(DOWNLOAD_TRANSLATIONS[code].progress).toContain('{pct}');
  });

  it('downloadStrings 对未知语言回退、对基础码命中', () => {
    expect(downloadStrings('xx-YY')).toBe(DOWNLOAD_TRANSLATIONS['zh-CN']);
    expect(downloadStrings('de')).toBe(DOWNLOAD_TRANSLATIONS['de']);
  });
});
