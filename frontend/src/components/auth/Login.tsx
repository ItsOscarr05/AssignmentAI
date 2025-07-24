import { Box, Button, Container, Typography } from '@mui/material';
import React, { useState } from 'react';
import { AuthManager } from '../../services/authManager';

export const Login: React.FC = () => {
  const authService = AuthManager.getInstance();
  const [isLoading, setIsLoading] = useState(false);

  const handleOAuthLogin = async (provider: string) => {
    if (isLoading) return; // Prevent multiple requests

    setIsLoading(true);
    try {
      const response = await authService.getOAuthUrl(provider);
      console.log('OAuth response:', response); // Debug log
      if (response && response.url) {
        window.location.href = response.url;
      } else {
        console.error('Invalid OAuth response:', response);
        setIsLoading(false);
      }
    } catch (error) {
      console.error('OAuth login failed:', error);
      setIsLoading(false);
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
            disabled={isLoading}
            sx={{ mb: 2 }}
          >
            {isLoading ? 'Redirecting...' : 'Sign in with Google'}
          </Button>
          <Button
            fullWidth
            variant="contained"
            color="primary"
            onClick={() => handleOAuthLogin('github')}
            disabled={isLoading}
          >
            {isLoading ? 'Redirecting...' : 'Sign in with GitHub'}
          </Button>
        </Box>
      </Box>
    </Container>
  );
};
