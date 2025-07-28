// Translation service using Google Translate API
// Note: You'll need to set up a Google Cloud project and get an API key

interface TranslationResponse {
  data: {
    translations: Array<{
      translatedText: string;
      detectedSourceLanguage?: string;
    }>;
  };
}

export class TranslationService {
  private apiKey: string;
  private baseUrl = 'https://translation.googleapis.com/language/translate/v2';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async translateText(
    text: string,
    targetLanguage: string,
    sourceLanguage: string = 'en'
  ): Promise<string> {
    try {
      const response = await fetch(`${this.baseUrl}?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          q: text,
          target: targetLanguage,
          source: sourceLanguage,
        }),
      });

      if (!response.ok) {
        throw new Error(`Translation failed: ${response.statusText}`);
      }

      const data: TranslationResponse = await response.json();
      return data.data.translations[0].translatedText;
    } catch (error) {
      console.error('Translation error:', error);
      return text; // Fallback to original text
    }
  }

  async translateBatch(
    texts: string[],
    targetLanguage: string,
    sourceLanguage: string = 'en'
  ): Promise<string[]> {
    try {
      const response = await fetch(`${this.baseUrl}?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          q: texts,
          target: targetLanguage,
          source: sourceLanguage,
        }),
      });

      if (!response.ok) {
        throw new Error(`Batch translation failed: ${response.statusText}`);
      }

      const data: TranslationResponse = await response.json();
      return data.data.translations.map(t => t.translatedText);
    } catch (error) {
      console.error('Batch translation error:', error);
      return texts; // Fallback to original texts
    }
  }
}

// Free alternative: LibreTranslate API (no API key required for basic usage)
export class LibreTranslateService {
  private baseUrl = 'https://libretranslate.de/translate';

  async translateText(
    text: string,
    targetLanguage: string,
    sourceLanguage: string = 'en'
  ): Promise<string> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          q: text,
          source: sourceLanguage,
          target: targetLanguage,
        }),
      });

      if (!response.ok) {
        throw new Error(`Translation failed: ${response.statusText}`);
      }

      const data = await response.json();
      return data.translatedText;
    } catch (error) {
      console.error('Translation error:', error);
      return text; // Fallback to original text
    }
  }
}

// Offline dictionary approach using pre-downloaded language packs
export class OfflineTranslationService {
  private dictionaries: Record<string, Record<string, string>> = {};

  async loadDictionary(language: string): Promise<void> {
    try {
      // Load from a pre-downloaded JSON file
      const response = await fetch(`/api/translations/${language}.json`);
      if (response.ok) {
        this.dictionaries[language] = await response.json();
      }
    } catch (error) {
      console.error(`Failed to load dictionary for ${language}:`, error);
    }
  }

  translateText(text: string, targetLanguage: string): string {
    const dictionary = this.dictionaries[targetLanguage];
    if (!dictionary) {
      return text;
    }
    return dictionary[text.toLowerCase()] || text;
  }

  isDictionaryLoaded(language: string): boolean {
    return !!this.dictionaries[language];
  }
}

// Factory function to create the appropriate translation service
export const createTranslationService = (type: 'google' | 'libre' | 'offline', apiKey?: string) => {
  switch (type) {
    case 'google':
      if (!apiKey) {
        throw new Error('Google Translate API key is required');
      }
      return new TranslationService(apiKey);
    case 'libre':
      return new LibreTranslateService();
    case 'offline':
      return new OfflineTranslationService();
    default:
      throw new Error(`Unknown translation service type: ${type}`);
  }
};
