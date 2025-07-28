import { useCallback } from 'react';
import { useTranslation as useI18nTranslation } from 'react-i18next';
import { supportedLanguages } from '../i18n/config';

export const useTranslation = () => {
  const { t, i18n } = useI18nTranslation();

  const changeLanguage = useCallback(
    (language: string) => {
      i18n.changeLanguage(language);
      // Store in localStorage
      localStorage.setItem('i18nextLng', language);
      // Update document language
      document.documentElement.lang = language;
    },
    [i18n]
  );

  const getCurrentLanguage = useCallback(() => {
    return i18n.language;
  }, [i18n.language]);

  const getSupportedLanguages = useCallback(() => {
    return supportedLanguages;
  }, []);

  const isLanguageSupported = useCallback((language: string) => {
    return supportedLanguages.some(lang => lang.code === language);
  }, []);

  return {
    t,
    changeLanguage,
    getCurrentLanguage,
    getSupportedLanguages,
    isLanguageSupported,
    currentLanguage: i18n.language,
    isReady: i18n.isInitialized,
  };
};
