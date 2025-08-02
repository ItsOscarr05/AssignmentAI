import { Box, Container, Grid, Paper, Typography } from '@mui/material';
import React from 'react';
import { TranslateText } from '../components/common/TranslateText';

const TranslationDemo: React.FC = () => {
  const sampleTexts = [
    'Welcome to AssignmentAI - Your AI-powered assignment companion!',
    'Create, manage, and complete your assignments with intelligent assistance.',
    'Our AI helps you break down complex tasks into manageable steps.',
    'Get instant feedback and suggestions to improve your work.',
    'Track your progress and stay organized with our comprehensive dashboard.',
  ];

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h3" gutterBottom align="center" color="primary">
        🌐 Translation Demo
      </Typography>

      <Typography variant="h6" align="center" color="text.secondary" sx={{ mb: 4 }}>
        Try our real-time translation feature below
      </Typography>

      <Grid container spacing={3}>
        {sampleTexts.map((text, index) => (
          <Grid item xs={12} md={6} key={index}>
            <Paper sx={{ p: 3, height: '100%' }}>
              <TranslateText
                text={text}
                defaultLanguage="es"
                showOriginal={true}
                variant="body1"
                sx={{
                  backgroundColor: '#f8f9fa',
                  p: 2,
                  borderRadius: 1,
                  border: '1px solid #e9ecef',
                }}
              />
            </Paper>
          </Grid>
        ))}
      </Grid>

      <Box sx={{ mt: 4, p: 3, backgroundColor: '#e3f2fd', borderRadius: 2 }}>
        <Typography variant="h6" gutterBottom>
          💡 How to Use:
        </Typography>
        <Typography variant="body1" paragraph>
          1. Select your target language from the dropdown
        </Typography>
        <Typography variant="body1" paragraph>
          2. Click the "Translate" button
        </Typography>
        <Typography variant="body1" paragraph>
          3. The translated text will appear below the original
        </Typography>
        <Typography variant="body1">
          4. You can change languages anytime and re-translate
        </Typography>
      </Box>
    </Container>
  );
};

export default TranslationDemo;
