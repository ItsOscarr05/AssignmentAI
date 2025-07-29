import { Language, Translate } from '@mui/icons-material';
import { Box, Chip, CircularProgress, Tooltip, Typography } from '@mui/material';
import React, { useEffect, useState } from 'react';
import { useTranslationContext } from '../../contexts/TranslationContext';

interface TranslatedTextProps {
  text: string;
  sourceLanguage?: string;
  variant?: 'body1' | 'body2' | 'caption' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
  component?: React.ElementType;
  showTranslationIndicator?: boolean;
  showOriginalOnHover?: boolean;
  className?: string;
  sx?: any;
}

export const TranslatedText: React.FC<TranslatedTextProps> = ({
  text,
  sourceLanguage = 'en',
  variant = 'body1',
  component = 'span',
  showTranslationIndicator = true,
  showOriginalOnHover = true,
  className,
  sx,
}) => {
  // Safely use translation context with fallback
  let translationContext = null;
  try {
    translationContext = useTranslationContext();
  } catch (error) {
    console.warn('TranslationContext not available:', error);
  }

  const { isTranslating, translateText, getTranslatedText, shouldTranslate, isTranslatable } =
    translationContext || {
      isTranslating: false,
      translateText: async (text: string) => text,
      getTranslatedText: (text: string) => text,
      shouldTranslate: () => false,
      isTranslatable: () => false,
    };

  const [translatedText, setTranslatedText] = useState<string>('');
  const [isTranslated, setIsTranslated] = useState(false);
  const [showOriginal, setShowOriginal] = useState(false);

  // Check if we should translate this text
  const shouldTranslateThis = shouldTranslate(text) && isTranslatable(text);

  useEffect(() => {
    if (!shouldTranslateThis) {
      setTranslatedText(text);
      setIsTranslated(false);
      return;
    }

    // Get cached translation if available
    const cachedTranslation = getTranslatedText(text, sourceLanguage);
    if (cachedTranslation !== text) {
      setTranslatedText(cachedTranslation);
      setIsTranslated(true);
    } else {
      // Perform translation
      const performTranslation = async () => {
        try {
          const result = await translateText(text, sourceLanguage);
          setTranslatedText(result);
          setIsTranslated(result !== text);
        } catch (error) {
          console.warn('Translation failed for text:', text, error);
          setTranslatedText(text);
          setIsTranslated(false);
        }
      };

      performTranslation();
    }
  }, [text, sourceLanguage, shouldTranslateThis, translateText, getTranslatedText]);

  // Don't translate if auto-translate is disabled or text shouldn't be translated
  if (!shouldTranslateThis) {
    return (
      <Typography variant={variant} component={component} className={className} sx={sx}>
        {text}
      </Typography>
    );
  }

  const displayText = showOriginal ? text : translatedText || text;
  const isCurrentlyTranslating = isTranslating && !translatedText;

  return (
    <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
      <Typography variant={variant} component={component} className={className} sx={sx}>
        {displayText}
      </Typography>

      {/* Translation indicator */}
      {showTranslationIndicator && isTranslated && (
        <Tooltip
          title={
            showOriginalOnHover ? 'Click to toggle original/translated text' : 'Translated text'
          }
        >
          <Chip
            icon={<Translate fontSize="small" />}
            label="Translated"
            size="small"
            variant="outlined"
            color="primary"
            onClick={showOriginalOnHover ? () => setShowOriginal(!showOriginal) : undefined}
            sx={{
              height: 'auto',
              fontSize: '0.7rem',
              cursor: showOriginalOnHover ? 'pointer' : 'default',
              '& .MuiChip-label': {
                px: 0.5,
              },
            }}
          />
        </Tooltip>
      )}

      {/* Loading indicator */}
      {isCurrentlyTranslating && (
        <Tooltip title="Translating...">
          <CircularProgress size={16} sx={{ ml: 0.5 }} />
        </Tooltip>
      )}

      {/* Original text on hover */}
      {showOriginalOnHover && isTranslated && !showOriginal && (
        <Tooltip
          title={
            <Box>
              <Typography variant="caption" display="block" fontWeight="bold">
                Original Text:
              </Typography>
              <Typography variant="caption">{text}</Typography>
            </Box>
          }
          arrow
        >
          <Language
            fontSize="small"
            sx={{
              color: 'text.secondary',
              cursor: 'pointer',
              ml: 0.5,
              '&:hover': {
                color: 'primary.main',
              },
            }}
            onClick={() => setShowOriginal(!showOriginal)}
          />
        </Tooltip>
      )}
    </Box>
  );
};

export default TranslatedText;
