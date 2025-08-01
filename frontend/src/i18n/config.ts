import { match } from '@formatjs/intl-localematcher';
import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import Negotiator from 'negotiator';
import { initReactI18next } from 'react-i18next';

// Import our translation files
import deTranslations from './locales/de.json';
import enTranslations from './locales/en.json';
import esTranslations from './locales/es.json';
import frTranslations from './locales/fr.json';

// Supported languages
export const supportedLanguages = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
];

// Language detection function
export function getLanguageFromHeaders(headers: Headers): string {
  const languages = new Negotiator({ headers: Object.fromEntries(headers) }).languages();
  const locales = supportedLanguages.map(lang => lang.code);
  const defaultLocale = 'en';

  return match(languages, locales, defaultLocale);
}

// Initialize i18n
i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        translation: enTranslations,
      },
      es: {
        translation: esTranslations,
      },
      fr: {
        translation: frTranslations,
      },
      de: {
        translation: deTranslations,
      },
    },
    fallbackLng: 'en',
    debug: process.env.NODE_ENV === 'development',

    interpolation: {
      escapeValue: false, // React already escapes values
    },

    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
      lookupLocalStorage: 'i18nextLng',
    },

    react: {
      useSuspense: false, // Disable Suspense for better error handling
    },
  });

export default i18n;
