export const i18n = {
  defaultLocale: 'en',
  locales: ['en', 'es', 'fr', 'de', 'zh'],
} as const;

export type Locale = (typeof i18n)['locales'][number];

export function getTranslator(locale: Locale) {
  return {
    t: (key: string, params?: Record<string, string | number>) => {
      return key; // This will be replaced with actual translations
    },
  };
} 