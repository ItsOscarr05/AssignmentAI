import { Box, Button, Container, Typography } from '@mui/material';
import React from 'react';

export const Login: React.FC = () => {
  const handleOAuthLogin = async (provider: string) => {
    try {
      // Redirect to OAuth provider
      const apiUrl = import.meta.env.VITE_API_URL;
      window.location.href = `${apiUrl}/api/auth/${provider}/login`;
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
