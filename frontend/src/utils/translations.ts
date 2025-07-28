import enTranslations from '../i18n/locales/en.json';
import esTranslations from '../i18n/locales/es.json';
import frTranslations from '../i18n/locales/fr.json';

const translations = {
  en: enTranslations,
  fr: frTranslations,
  es: esTranslations,
};

export const getTranslation = (language: string, key: string): string => {
  const lang = language as keyof typeof translations;
  const keys = key.split('.');

  let current: any = translations[lang] || translations.en;

  for (const k of keys) {
    if (current && typeof current === 'object' && k in current) {
      current = current[k];
    } else {
      // Fallback to English
      current = translations.en;
      for (const fallbackKey of keys) {
        if (current && typeof current === 'object' && fallbackKey in current) {
          current = current[fallbackKey];
        } else {
          return key; // Return the key if translation not found
        }
      }
      break;
    }
  }

  return typeof current === 'string' ? current : key;
};

export default getTranslation;
