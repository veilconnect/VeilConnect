import { useState, useEffect, createContext, useContext } from 'react';
import { translations, Translations } from './translations';
import { DEFAULT_LANGUAGE, SUPPORTED_LANGUAGES } from './languages';

interface I18nContextType {
  currentLanguage: string;
  t: Translations;
  changeLanguage: (languageCode: string) => void;
  supportedLanguages: typeof SUPPORTED_LANGUAGES;
}

export const I18nContext = createContext<I18nContextType | undefined>(undefined);

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
    // 设置HTML lang属性
    if (typeof document !== 'undefined') {
      document.documentElement.lang = currentLanguage;
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