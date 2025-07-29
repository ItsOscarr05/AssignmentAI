import { Close, Language, Refresh, Settings, Translate } from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  FormGroup,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Switch,
  Typography,
} from '@mui/material';
import React, { useState } from 'react';
import { useTranslationContext } from '../../contexts/TranslationContext';
import TranslatedText from './TranslatedText';

interface TranslationPreferencesProps {
  showAdvanced?: boolean;
  showPreview?: boolean;
  showTestSection?: boolean;
}

export const TranslationPreferences: React.FC<TranslationPreferencesProps> = ({
  showAdvanced = true,
  showPreview = true,
  showTestSection = true,
}) => {
  // Local state for when context is not available
  const [localAutoTranslate, setLocalAutoTranslate] = useState(false);
  const [localShowOriginalText, setLocalShowOriginalText] = useState(true);
  const [localTargetLanguage, setLocalTargetLanguage] = useState('en');

  // Safely use translation context with fallback
  let translationContext = null;
  try {
    translationContext = useTranslationContext();
  } catch (error) {
    console.warn('TranslationContext not available:', error);
  }

  const {
    preferences,
    setAutoTranslate,
    setShowOriginalText,
    setTargetLanguage,
    clearCache,
    isTranslating,
  } = translationContext || {
    preferences: {
      autoTranslate: localAutoTranslate,
      showOriginalText: localShowOriginalText,
      targetLanguage: localTargetLanguage,
    },
    setAutoTranslate: setLocalAutoTranslate,
    setShowOriginalText: setLocalShowOriginalText,
    setTargetLanguage: setLocalTargetLanguage,
    clearCache: () => {},
    isTranslating: false,
  };

  // Use local state if context is not available
  const effectivePreferences = translationContext
    ? preferences
    : {
        autoTranslate: localAutoTranslate,
        showOriginalText: localShowOriginalText,
        targetLanguage: localTargetLanguage,
      };

  const effectiveSetAutoTranslate = translationContext ? setAutoTranslate : setLocalAutoTranslate;
  const effectiveSetShowOriginalText = translationContext
    ? setShowOriginalText
    : setLocalShowOriginalText;
  const effectiveSetTargetLanguage = translationContext
    ? setTargetLanguage
    : setLocalTargetLanguage;

  const [testText, setTestText] = useState('Hello, this is a test message for translation.');
  const [showTestResult, setShowTestResult] = useState(false);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);

  const supportedLanguages = [
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Español' },
    { code: 'fr', name: 'Français' },
    { code: 'de', name: 'Deutsch' },
    { code: 'it', name: 'Italiano' },
    { code: 'pt', name: 'Português' },
    { code: 'ru', name: 'Русский' },
    { code: 'zh', name: '中文' },
    { code: 'ja', name: '日本語' },
    { code: 'ko', name: '한국어' },
  ];

  const handleTestTranslation = () => {
    setShowTestResult(true);
  };

  const handleClearCache = () => {
    clearCache();
  };

  const handleAutoTranslateToggle = (enabled: boolean) => {
    if (enabled) {
      setShowSettingsDialog(true);
    } else {
      effectiveSetAutoTranslate(false);
    }
  };

  const handleSaveSettings = () => {
    effectiveSetAutoTranslate(true);
    setShowSettingsDialog(false);
  };

  const handleCancelSettings = () => {
    setShowSettingsDialog(false);
  };

  const handleUpdateSettings = () => {
    setShowSettingsDialog(false);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Basic Settings */}
      <FormGroup>
        <FormControlLabel
          control={
            <Switch
              checked={effectivePreferences.autoTranslate}
              onChange={e => handleAutoTranslateToggle(e.target.checked)}
            />
          }
          label={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Translate fontSize="small" />
              <Typography>Auto-translate content</Typography>
            </Box>
          }
        />
      </FormGroup>

      {/* Status Information */}
      {effectivePreferences.autoTranslate && (
        <Alert
          severity="info"
          sx={{ mt: 1 }}
          action={
            <Button
              size="small"
              variant="outlined"
              onClick={() => setShowSettingsDialog(true)}
              sx={{ ml: 1 }}
            >
              Edit Settings
            </Button>
          }
        >
          <Typography variant="body2">
            Translation is currently enabled. Content will be automatically translated to{' '}
            <Chip
              label={
                supportedLanguages.find(l => l.code === effectivePreferences.targetLanguage)
                  ?.name || effectivePreferences.targetLanguage
              }
              size="small"
              variant="outlined"
            />
            {effectivePreferences.showOriginalText &&
              ' with original text shown alongside translations.'}
          </Typography>
        </Alert>
      )}

      {/* Settings Dialog */}
      <Dialog
        open={showSettingsDialog}
        onClose={handleCancelSettings}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            minHeight: '60vh',
          },
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Translate color="primary" />
              <Typography variant="h6">Translation Settings</Typography>
            </Box>
            <IconButton onClick={handleCancelSettings} size="small">
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ pt: 2 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Show Original Text Toggle */}
            <FormGroup>
              <FormControlLabel
                control={
                  <Switch
                    checked={effectivePreferences.showOriginalText}
                    onChange={e => effectiveSetShowOriginalText(e.target.checked)}
                  />
                }
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Language fontSize="small" />
                    <Typography>Show original text alongside translation</Typography>
                  </Box>
                }
              />
            </FormGroup>

            {/* Target Language Selection */}
            <FormControl fullWidth>
              <InputLabel>Target Language</InputLabel>
              <Select
                value={effectivePreferences.targetLanguage}
                onChange={e => effectiveSetTargetLanguage(e.target.value)}
              >
                {supportedLanguages.map(lang => (
                  <MenuItem key={lang.code} value={lang.code}>
                    {lang.name} ({lang.code.toUpperCase()})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Advanced Settings */}
            {showAdvanced && (
              <Paper sx={{ p: 2, bgcolor: 'background.default' }}>
                <Typography
                  variant="subtitle2"
                  gutterBottom
                  sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                >
                  <Settings fontSize="small" />
                  Advanced Settings
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<Refresh />}
                    onClick={handleClearCache}
                    disabled={isTranslating}
                  >
                    Clear Translation Cache
                  </Button>
                  <Typography variant="caption" color="text.secondary">
                    Clears all cached translations to force fresh translations
                  </Typography>
                </Box>
              </Paper>
            )}

            {/* Preview Section */}
            {showPreview && (
              <Paper sx={{ p: 2, bgcolor: 'background.default' }}>
                <Typography variant="subtitle2" gutterBottom>
                  Translation Preview
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Typography variant="caption" color="text.secondary">
                    Original: "Welcome to AssignmentAI - Your AI-powered assignment assistant"
                  </Typography>
                  <TranslatedText
                    text="Welcome to AssignmentAI - Your AI-powered assignment assistant"
                    sourceLanguage="en"
                    variant="body2"
                    showTranslationIndicator={effectivePreferences.showOriginalText}
                    showOriginalOnHover={effectivePreferences.showOriginalText}
                  />
                </Box>
              </Paper>
            )}

            {/* Test Section */}
            {showTestSection && (
              <Paper sx={{ p: 2, bgcolor: 'background.default' }}>
                <Typography variant="subtitle2" gutterBottom>
                  Test Translation
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <FormControl fullWidth>
                    <InputLabel>Test Text</InputLabel>
                    <Select value={testText} onChange={e => setTestText(e.target.value)}>
                      <MenuItem value="Hello, this is a test message for translation.">
                        Hello, this is a test message for translation.
                      </MenuItem>
                      <MenuItem value="Please review my assignment and provide feedback.">
                        Please review my assignment and provide feedback.
                      </MenuItem>
                      <MenuItem value="The deadline for this project is next Friday.">
                        The deadline for this project is next Friday.
                      </MenuItem>
                      <MenuItem value="I need help with my research paper on artificial intelligence.">
                        I need help with my research paper on artificial intelligence.
                      </MenuItem>
                    </Select>
                  </FormControl>

                  <Button
                    variant="contained"
                    size="small"
                    onClick={handleTestTranslation}
                    disabled={isTranslating}
                    sx={{ alignSelf: 'flex-start' }}
                  >
                    Test Translation
                  </Button>

                  {showTestResult && (
                    <Box sx={{ mt: 2 }}>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        display="block"
                        gutterBottom
                      >
                        Original:
                      </Typography>
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        {testText}
                      </Typography>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        display="block"
                        gutterBottom
                      >
                        Translated:
                      </Typography>
                      <TranslatedText
                        text={testText}
                        sourceLanguage="en"
                        variant="body2"
                        showTranslationIndicator={effectivePreferences.showOriginalText}
                        showOriginalOnHover={effectivePreferences.showOriginalText}
                      />
                    </Box>
                  )}
                </Box>
              </Paper>
            )}
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={handleCancelSettings} variant="outlined">
            Cancel
          </Button>
          {effectivePreferences.autoTranslate ? (
            <Button onClick={handleUpdateSettings} variant="contained" color="primary">
              Update Settings
            </Button>
          ) : (
            <Button onClick={handleSaveSettings} variant="contained" color="primary">
              Enable Translation
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TranslationPreferences;
