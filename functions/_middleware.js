/**
 * Cloudflare Pages 中间件 —— 仅托管版（veilconnect.org）生效。
 *
 * 作用：根据 Cloudflare 边缘解析出的访客国家（CF-IPCountry / request.cf.country），
 * 把「该国家的默认语言」注入 HTML <head> 的 <meta name="vc-geo-lang">，供前端在
 * 【浏览器语言匹配不上时】作为兜底语言信号（见 languages.ts geoDefaultLanguage）。
 *
 * 隐私：不调用任何第三方、不额外暴露 IP —— Cloudflare 作为 CDN 本就终止连接、已知 IP，
 * 这里只用它已有的国家码，绝不把 IP 发往别处。自部署版没有此中间件 → 无 meta →
 * 前端按 navigator.language → 默认语言回退，行为完全不变。
 *
 * 注意：国家 ≠ 语言（多语言国家、侨民、旅客都可能不准），故仅作「浏览器语言之下」的兜底，
 * 永不覆盖用户已存偏好或浏览器语言。映射值取自固定表，无用户输入，无注入风险。
 */

// 国家码（ISO 3166-1 alpha-2，大写）→ 站点支持的语言码。仅列母语明确占主导的国家；
// 未列入的国家不注入 meta，前端照常回退默认语言。
const COUNTRY_LANG = {
  // 中文
  CN: 'zh-CN',
  TW: 'zh-TW', HK: 'zh-TW', MO: 'zh-TW',
  // 日 / 韩
  JP: 'ja',
  KR: 'ko', KP: 'ko',
  // 西班牙语（西班牙 + 拉美）
  ES: 'es', MX: 'es', AR: 'es', CO: 'es', PE: 'es', VE: 'es', CL: 'es', EC: 'es',
  GT: 'es', CU: 'es', BO: 'es', DO: 'es', HN: 'es', PY: 'es', SV: 'es', NI: 'es',
  CR: 'es', PA: 'es', UY: 'es', PR: 'es',
  // 法语（法国 + 法语非洲 + 摩纳哥）
  FR: 'fr', MC: 'fr', CI: 'fr', SN: 'fr', ML: 'fr', BF: 'fr', NE: 'fr', TG: 'fr',
  BJ: 'fr', GN: 'fr', CD: 'fr', CG: 'fr', GA: 'fr', MG: 'fr', CF: 'fr', TD: 'fr', DJ: 'fr',
  // 德语
  DE: 'de', AT: 'de', LI: 'de', CH: 'de',
  // 俄语
  RU: 'ru', BY: 'ru', KG: 'ru', KZ: 'ru',
  // 阿拉伯语
  SA: 'ar', AE: 'ar', EG: 'ar', DZ: 'ar', IQ: 'ar', MA: 'ar', SD: 'ar', SY: 'ar',
  TN: 'ar', JO: 'ar', LY: 'ar', LB: 'ar', OM: 'ar', KW: 'ar', QA: 'ar', BH: 'ar',
  YE: 'ar', PS: 'ar', MR: 'ar',
  // 葡萄牙语
  PT: 'pt', BR: 'pt', AO: 'pt', MZ: 'pt', CV: 'pt',
  // 意大利语
  IT: 'it', SM: 'it', VA: 'it',
  // 印地语 / 泰语 / 越南语
  IN: 'hi',
  TH: 'th',
  VN: 'vi',
  // 英语（英语国家 + 作为通用兜底的一批）
  US: 'en', GB: 'en', AU: 'en', CA: 'en', IE: 'en', NZ: 'en', ZA: 'en',
  SG: 'en', PH: 'en', NG: 'en', KE: 'en', GH: 'en'
};

export async function onRequest(context) {
  const res = await context.next();
  const ct = res.headers.get('content-type') || '';
  if (!ct.includes('text/html')) return res; // 仅处理 HTML 文档

  const req = context.request;
  const country = (req.headers.get('cf-ipcountry') || (req.cf && req.cf.country) || '').toUpperCase();
  const lang = COUNTRY_LANG[country];
  if (!lang) return res; // 未知/未映射国家 → 不注入，前端回退默认

  return new HTMLRewriter()
    .on('head', {
      element(el) {
        el.append(`<meta name="vc-geo-lang" content="${lang}">`, { html: true });
      }
    })
    .transform(res);
}
