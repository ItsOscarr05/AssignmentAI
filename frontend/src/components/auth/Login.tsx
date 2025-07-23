import { Box, Button, Container, Typography } from '@mui/material';
import React from 'react';
import { AuthManager } from '../../services/authManager';

export const Login: React.FC = () => {
  const authService = AuthManager.getInstance();

  const handleOAuthLogin = async (provider: string) => {
    try {
      const response = await authService.getOAuthUrl(provider);
      console.log('OAuth response:', response); // Debug log
      if (response && response.url) {
        window.location.href = response.url;
      } else {
        console.error('Invalid OAuth response:', response);
      }
    } catch (error) {
      console.error('OAuth login failed:', error);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Typography component="h1" variant="h5" gutterBottom>
          Sign in to your account
        </Typography>
        <Box sx={{ mt: 3, width: '100%' }}>
          <Button
            fullWidth
            variant="contained"
            color="primary"
            onClick={() => handleOAuthLogin('google')}
            sx={{ mb: 2 }}
          >
            Sign in with Google
          </Button>
          <Button
            fullWidth
            variant="contained"
            color="primary"
            onClick={() => handleOAuthLogin('github')}
          >
            Sign in with GitHub
          </Button>
        </Box>
      </Box>
    </Container>
  );
};
