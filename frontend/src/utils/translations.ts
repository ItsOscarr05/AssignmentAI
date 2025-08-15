import enTranslations from '../../public/locales/en/translation.json';

const translations = {
  en: enTranslations,
};

export const getTranslation = (key: string): string => {
  // For now, only English is supported
  const keys = key.split('.');
  let current: any = translations.en;

  for (const k of keys) {
    if (current && typeof current === 'object' && k in current) {
      current = current[k];
    } else {
      return key; // Return the key if translation not found
    }
  }

  return typeof current === 'string' ? current : key;
};

export default getTranslation;
