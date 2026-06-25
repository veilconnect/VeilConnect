import { useState, useEffect, createContext, useContext } from 'react';
import { translations, Translations } from './translations';
import { DEFAULT_LANGUAGE, SUPPORTED_LANGUAGES, geoDefaultLanguage } from './languages';

interface I18nContextType {
  currentLanguage: string;
  t: Translations;
  changeLanguage: (languageCode: string) => void;
  supportedLanguages: typeof SUPPORTED_LANGUAGES;
}

export const I18nContext = createContext<I18nContextType | undefined>(undefined);

// 从右向左书写的语言（按基础语言码匹配）。目前列表中仅阿拉伯语(ar)；
// 后续若加入希伯来语(he)/波斯语(fa)/乌尔都语(ur)只需在此登记。
const RTL_LANGUAGES = new Set(['ar', 'he', 'fa', 'ur']);

export const useTranslation = () => {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useTranslation must be used within an I18nProvider');
  }
  return context;
};

export const useI18n = () => {
  const [currentLanguage, setCurrentLanguage] = useState<string>(() => {
    // 尝试从localStorage获取保存的语言设置
    if (typeof window !== 'undefined') {
      const savedLanguage = localStorage.getItem('veilconnect-language');
      if (savedLanguage && translations[savedLanguage]) {
        return savedLanguage;
      }
      
      // 尝试从浏览器语言检测
      const browserLanguage = navigator.language;
      if (translations[browserLanguage]) {
        return browserLanguage;
      }
      
      // 检查简化的语言代码（如 'en' 而不是 'en-US'）
      const simplifiedLanguage = browserLanguage.split('-')[0];
      const matchingLanguage = SUPPORTED_LANGUAGES.find(lang => 
        lang.code.startsWith(simplifiedLanguage)
      );
      if (matchingLanguage && translations[matchingLanguage.code]) {
        return matchingLanguage.code;
      }

      // 浏览器语言匹配不上 → 用 Cloudflare 边缘注入的地理默认语言兜底（仅托管版有）
      const geo = geoDefaultLanguage();
      if (geo && translations[geo]) {
        return geo;
      }
    }

    return DEFAULT_LANGUAGE;
  });

  const changeLanguage = (languageCode: string) => {
    if (translations[languageCode]) {
      setCurrentLanguage(languageCode);
      if (typeof window !== 'undefined') {
        localStorage.setItem('veilconnect-language', languageCode);
      }
    }
  };

  useEffect(() => {
    // 设置 HTML lang 属性，并按语言切换文字方向（RTL 语言如阿拉伯语需 dir=rtl）
    if (typeof document !== 'undefined') {
      document.documentElement.lang = currentLanguage;
      const base = currentLanguage.split('-')[0];
      document.documentElement.dir = RTL_LANGUAGES.has(base) ? 'rtl' : 'ltr';
    }
  }, [currentLanguage]);

  const t = translations[currentLanguage] || translations[DEFAULT_LANGUAGE];

  // 只暴露真正有翻译表的语言，避免选了之后无效
  const available = SUPPORTED_LANGUAGES.filter(lang => Boolean(translations[lang.code]));

  return {
    currentLanguage,
    t,
    changeLanguage,
    supportedLanguages: available
  };
}; 