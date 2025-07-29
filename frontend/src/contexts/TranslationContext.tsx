import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { LibreTranslateService } from '../utils/translationService';

interface TranslationPreferences {
  autoTranslate: boolean;
  showOriginalText: boolean;
  targetLanguage: string;
}

interface TranslationContextType {
  // State
  preferences: TranslationPreferences;
  isTranslating: boolean;
  translationCache: Map<string, string>;

  // Actions
  setAutoTranslate: (enabled: boolean) => void;
  setShowOriginalText: (show: boolean) => void;
  setTargetLanguage: (language: string) => void;

  // Translation functions
  translateText: (text: string, sourceLanguage?: string) => Promise<string>;
  getTranslatedText: (text: string, sourceLanguage?: string) => string;
  clearCache: () => void;

  // Utility functions
  shouldTranslate: (text: string) => boolean;
  isTranslatable: (text: string) => boolean;
}

const TranslationContext = createContext<TranslationContextType | undefined>(undefined);

interface TranslationProviderProps {
  children: ReactNode;
  initialPreferences?: Partial<TranslationPreferences>;
}

export const TranslationProvider: React.FC<TranslationProviderProps> = ({
  children,
  initialPreferences,
}) => {
  const [preferences, setPreferences] = useState<TranslationPreferences>({
    autoTranslate: initialPreferences?.autoTranslate ?? false,
    showOriginalText: initialPreferences?.showOriginalText ?? true,
    targetLanguage: initialPreferences?.targetLanguage ?? 'en',
  });

  const [isTranslating, setIsTranslating] = useState(false);
  const [translationCache, setTranslationCache] = useState<Map<string, string>>(new Map());

  // Initialize translation service lazily to avoid issues
  const [translationService] = useState(() => {
    try {
      return new LibreTranslateService();
    } catch (error) {
      console.warn('Failed to initialize translation service:', error);
      return null;
    }
  });

  // Load preferences from localStorage on mount
  useEffect(() => {
    const savedAutoTranslate = localStorage.getItem('autoTranslate');
    const savedShowOriginal = localStorage.getItem('showOriginalText');
    const savedTargetLang = localStorage.getItem('translationTargetLanguage');

    if (savedAutoTranslate !== null) {
      setPreferences(prev => ({ ...prev, autoTranslate: savedAutoTranslate === 'true' }));
    }
    if (savedShowOriginal !== null) {
      setPreferences(prev => ({ ...prev, showOriginalText: savedShowOriginal === 'true' }));
    }
    if (savedTargetLang) {
      setPreferences(prev => ({ ...prev, targetLanguage: savedTargetLang }));
    }
  }, []);

  // Save preferences to localStorage when they change
  useEffect(() => {
    localStorage.setItem('autoTranslate', preferences.autoTranslate.toString());
    localStorage.setItem('showOriginalText', preferences.showOriginalText.toString());
    localStorage.setItem('translationTargetLanguage', preferences.targetLanguage);
  }, [preferences]);

  const setAutoTranslate = (enabled: boolean) => {
    setPreferences(prev => ({ ...prev, autoTranslate: enabled }));
  };

  const setShowOriginalText = (show: boolean) => {
    setPreferences(prev => ({ ...prev, showOriginalText: show }));
  };

  const setTargetLanguage = (language: string) => {
    setPreferences(prev => ({ ...prev, targetLanguage: language }));
  };

  const shouldTranslate = (text: string): boolean => {
    if (!preferences.autoTranslate) return false;
    if (!text || text.trim() === '') return false;
    if (preferences.targetLanguage === 'en') return false;
    return isTranslatable(text);
  };

  const isTranslatable = (text: string): boolean => {
    // Don't translate if it's already in the target language
    if (preferences.targetLanguage === 'en') return false;

    // Don't translate URLs, emails, or code
    const urlRegex = /https?:\/\/[^\s]+/;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const codeRegex = /```[\s\S]*?```|`[^`]+`/;

    if (urlRegex.test(text) || emailRegex.test(text) || codeRegex.test(text)) {
      return false;
    }

    // Don't translate very short text or numbers
    if (text.length < 3 || /^\d+$/.test(text)) {
      return false;
    }

    return true;
  };

  const translateText = async (text: string, sourceLanguage: string = 'en'): Promise<string> => {
    if (!shouldTranslate(text)) {
      return text;
    }

    // Check cache first
    const cacheKey = `${text}:${sourceLanguage}:${preferences.targetLanguage}`;
    if (translationCache.has(cacheKey)) {
      return translationCache.get(cacheKey)!;
    }

    // If no translation service, return original text
    if (!translationService) {
      return text;
    }

    setIsTranslating(true);
    try {
      const translatedText = await translationService.translateText(
        text,
        preferences.targetLanguage,
        sourceLanguage
      );

      // Cache the result
      setTranslationCache(prev => new Map(prev).set(cacheKey, translatedText));

      return translatedText;
    } catch (error) {
      console.warn('Translation failed:', error);
      return text; // Fallback to original text
    } finally {
      setIsTranslating(false);
    }
  };

  const getTranslatedText = (text: string, sourceLanguage: string = 'en'): string => {
    if (!shouldTranslate(text)) {
      return text;
    }

    const cacheKey = `${text}:${sourceLanguage}:${preferences.targetLanguage}`;
    return translationCache.get(cacheKey) || text;
  };

  const clearCache = () => {
    setTranslationCache(new Map());
  };

  const value: TranslationContextType = {
    preferences,
    isTranslating,
    translationCache,
    setAutoTranslate,
    setShowOriginalText,
    setTargetLanguage,
    translateText,
    getTranslatedText,
    clearCache,
    shouldTranslate,
    isTranslatable,
  };

  return <TranslationContext.Provider value={value}>{children}</TranslationContext.Provider>;
};

export const useTranslationContext = (): TranslationContextType => {
  const context = useContext(TranslationContext);
  if (context === undefined) {
    throw new Error('useTranslationContext must be used within a TranslationProvider');
  }
  return context;
};
