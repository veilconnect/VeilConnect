import React from 'react';
import { I18nContext, useI18n } from './useTranslation';

interface I18nProviderProps {
  children: React.ReactNode;
}

export const I18nProvider: React.FC<I18nProviderProps> = ({ children }) => {
  const value = useI18n();
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};
