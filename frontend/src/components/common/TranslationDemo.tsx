import { Box, Divider, Paper, Typography } from '@mui/material';
import React from 'react';
import TranslatedText from './TranslatedText';

interface TranslationDemoProps {
  title?: string;
  showExamples?: boolean;
}

export const TranslationDemo: React.FC<TranslationDemoProps> = ({
  title = 'Translation Demo',
  showExamples = true,
}) => {
  const exampleTexts = [
    'Welcome to AssignmentAI - Your AI-powered assignment assistant',
    'Please review my research paper and provide detailed feedback',
    'The deadline for this project is next Friday at 5:00 PM',
    'I need help with my mathematics assignment on calculus',
    'Thank you for your assistance with my academic work',
  ];

  return (
    <Paper sx={{ p: 3, bgcolor: 'background.default' }}>
      <Typography variant="h6" gutterBottom>
        {title}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        This demonstrates how content translation works with your current settings.
      </Typography>

      {showExamples && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {exampleTexts.map((text, index) => (
            <Box key={index}>
              <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                Example {index + 1}:
              </Typography>
              <TranslatedText
                text={text}
                sourceLanguage="en"
                variant="body2"
                showTranslationIndicator={true}
                showOriginalOnHover={true}
              />
              {index < exampleTexts.length - 1 && <Divider sx={{ mt: 2 }} />}
            </Box>
          ))}
        </Box>
      )}
    </Paper>
  );
};

export default TranslationDemo;
