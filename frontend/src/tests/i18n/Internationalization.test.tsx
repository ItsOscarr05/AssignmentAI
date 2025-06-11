import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import i18n from 'i18next';
import { I18nextProvider, initReactI18next, useTranslation } from 'react-i18next';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Initialize i18n for testing
i18n.use(initReactI18next).init({
  resources: {
    en: {
      translation: {
        greeting: 'Hello',
        welcome: 'Welcome, {{name}}!',
        items: {
          one: '{{count}} item',
          other: '{{count}} items',
        },
        date: '{{date, DD/MM/YYYY}}',
      },
    },
    es: {
      translation: {
        greeting: 'Hola',
        welcome: '¡Bienvenido, {{name}}!',
        items: {
          one: '{{count}} elemento',
          other: '{{count}} elementos',
        },
        date: '{{date, DD/MM/YYYY}}',
      },
    },
  },
  lng: 'en',
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
});

describe('Internationalization', () => {
  beforeEach(() => {
    i18n.changeLanguage('en');
  });

  describe('Language Switching', () => {
    const LanguageSwitcher = () => {
      const { i18n } = useTranslation();
      return (
        <div>
          <button onClick={() => i18n.changeLanguage('en')}>English</button>
          <button onClick={() => i18n.changeLanguage('es')}>Español</button>
          <div>{i18n.language}</div>
        </div>
      );
    };

    it('should switch between languages', async () => {
      render(
        <I18nextProvider i18n={i18n}>
          <LanguageSwitcher />
        </I18nextProvider>
      );

      // Initial language
      expect(screen.getByText('en')).toBeInTheDocument();

      // Switch to Spanish
      fireEvent.click(screen.getByText('Español'));
      await waitFor(() => {
        expect(screen.getByText('es')).toBeInTheDocument();
      });

      // Switch back to English
      fireEvent.click(screen.getByText('English'));
      await waitFor(() => {
        expect(screen.getByText('en')).toBeInTheDocument();
      });
    });
  });

  describe('Translation Loading', () => {
    const TranslatedComponent = () => {
      const { t } = useTranslation();
      return <div>{t('greeting')}</div>;
    };

    it('should load and display translations', async () => {
      render(
        <I18nextProvider i18n={i18n}>
          <TranslatedComponent />
        </I18nextProvider>
      );

      expect(screen.getByText('Hello')).toBeInTheDocument();

      await i18n.changeLanguage('es');
      await waitFor(() => {
        expect(screen.getByText('Hola')).toBeInTheDocument();
      });
    });

    it('should fall back to default language when translation is missing', async () => {
      i18n.addResourceBundle('fr', 'translation', {}, true, true);
      await i18n.changeLanguage('fr');

      render(
        <I18nextProvider i18n={i18n}>
          <TranslatedComponent />
        </I18nextProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Hello')).toBeInTheDocument();
      });
    });
  });

  describe('Translation with Variables', () => {
    const WelcomeComponent = ({ name }: { name: string }) => {
      const { t } = useTranslation();
      return <div>{t('welcome', { name })}</div>;
    };

    it('should interpolate variables in translations', async () => {
      render(
        <I18nextProvider i18n={i18n}>
          <WelcomeComponent name="John" />
        </I18nextProvider>
      );

      expect(screen.getByText('Welcome, John!')).toBeInTheDocument();

      await i18n.changeLanguage('es');
      await waitFor(() => {
        expect(screen.getByText('¡Bienvenido, John!')).toBeInTheDocument();
      });
    });
  });

  describe('Pluralization', () => {
    const ItemCounter = ({ count }: { count: number }) => {
      const { t } = useTranslation();
      return <div>{t('items', { count })}</div>;
    };

    it('should handle plural forms correctly', async () => {
      const { rerender } = render(
        <I18nextProvider i18n={i18n}>
          <ItemCounter count={1} />
        </I18nextProvider>
      );

      expect(screen.getByText('1 item')).toBeInTheDocument();

      rerender(
        <I18nextProvider i18n={i18n}>
          <ItemCounter count={2} />
        </I18nextProvider>
      );

      expect(screen.getByText('2 items')).toBeInTheDocument();

      await i18n.changeLanguage('es');
      await waitFor(() => {
        expect(screen.getByText('2 elementos')).toBeInTheDocument();
      });
    });
  });

  describe('Date and Number Formatting', () => {
    const DateDisplay = ({ date }: { date: Date }) => {
      const { t } = useTranslation();
      return <div>{t('date', { date })}</div>;
    };

    it('should format dates according to locale', async () => {
      const testDate = new Date('2024-04-05');
      render(
        <I18nextProvider i18n={i18n}>
          <DateDisplay date={testDate} />
        </I18nextProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('05/04/2024')).toBeInTheDocument();
      });
    });
  });

  describe('Dynamic Translation Loading', () => {
    const mockLoadTranslations = vi.fn().mockResolvedValue({
      translation: {
        dynamicKey: 'Dynamic Content',
      },
    });

    it('should load translations dynamically', async () => {
      const DynamicComponent = () => {
        const { t, i18n } = useTranslation();
        const loadLanguage = async () => {
          const translations = await mockLoadTranslations();
          i18n.addResourceBundle('en', 'translation', translations.translation, true, true);
        };

        return (
          <div>
            <button onClick={loadLanguage}>Load Translations</button>
            <div>{t('dynamicKey')}</div>
          </div>
        );
      };

      render(
        <I18nextProvider i18n={i18n}>
          <DynamicComponent />
        </I18nextProvider>
      );

      fireEvent.click(screen.getByText('Load Translations'));
      expect(mockLoadTranslations).toHaveBeenCalled();

      await waitFor(() => {
        expect(screen.getByText('Dynamic Content')).toBeInTheDocument();
      });
    });
  });
});
