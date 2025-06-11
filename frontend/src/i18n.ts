import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

i18n.use(initReactI18next).init({
  resources: {
    en: {
      translation: {
        'language.english': 'English',
        'language.spanish': 'Spanish',
        'language.search': 'Search languages...',
      },
    },
    es: {
      translation: {
        'language.english': 'Inglés',
        'language.spanish': 'Español',
        'language.search': 'Buscar idiomas...',
      },
    },
  },
  lng: 'en',
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
