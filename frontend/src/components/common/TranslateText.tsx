import { Language } from '@mui/icons-material';
import {
  Box,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  SxProps,
  Theme,
  Typography,
} from '@mui/material';
import React, { useState } from 'react';

interface TranslateTextProps {
  text: string;
  defaultLanguage?: string;
  showOriginal?: boolean;
  variant?: 'body1' | 'body2' | 'h6' | 'h5' | 'h4' | 'h3' | 'h2' | 'h1';
  sx?: SxProps<Theme>;
}

const supportedLanguages = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'it', name: 'Italian' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'ru', name: 'Russian' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ko', name: 'Korean' },
  { code: 'zh', name: 'Chinese' },
];

export const TranslateText: React.FC<TranslateTextProps> = ({
  text,
  defaultLanguage = 'en',
  showOriginal = true,
  variant = 'body1',
  sx = {},
}) => {
  const [targetLanguage, setTargetLanguage] = useState(defaultLanguage);
  const [translatedText, setTranslatedText] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);

  const handleTranslate = async () => {
    if (targetLanguage === 'en') {
      setTranslatedText(text);
      return;
    }

    setIsTranslating(true);

    try {
      // Mock translation - in a real app, this would call a translation API
      // For demo purposes, we'll simulate translation with a delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Simple mock translation logic
      const mockTranslations: Record<string, string> = {
        es: `[Traducido al español] ${text}`,
        fr: `[Traduit en français] ${text}`,
        de: `[Ins Deutsche übersetzt] ${text}`,
        it: `[Tradotto in italiano] ${text}`,
        pt: `[Traduzido para português] ${text}`,
        ru: `[Переведено на русский] ${text}`,
        ja: `[日本語に翻訳] ${text}`,
        ko: `[한국어로 번역] ${text}`,
        zh: `[翻译成中文] ${text}`,
      };

      setTranslatedText(mockTranslations[targetLanguage] || text);
    } catch (error) {
      setTranslatedText('Translation failed. Please try again.');
    } finally {
      setIsTranslating(false);
    }
  };

  return (
    <Box sx={sx}>
      {showOriginal && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
            Original Text (English):
          </Typography>
          <Typography variant={variant} sx={{ fontStyle: 'italic', color: 'text.secondary' }}>
            {text}
          </Typography>
        </Box>
      )}

      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2 }}>
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Language</InputLabel>
          <Select
            value={targetLanguage}
            label="Language"
            onChange={e => setTargetLanguage(e.target.value)}
          >
            {supportedLanguages.map(lang => (
              <MenuItem key={lang.code} value={lang.code}>
                {lang.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Button
          variant="contained"
          onClick={handleTranslate}
          disabled={isTranslating}
          startIcon={<Language />}
          size="small"
        >
          {isTranslating ? 'Translating...' : 'Translate'}
        </Button>
      </Box>

      {translatedText && (
        <Box>
          <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
            Translation ({supportedLanguages.find(l => l.code === targetLanguage)?.name}):
          </Typography>
          <Typography variant={variant} sx={{ fontWeight: 500 }}>
            {translatedText}
          </Typography>
        </Box>
      )}
    </Box>
  );
};
