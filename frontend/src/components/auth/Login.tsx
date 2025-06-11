import { Box, Button, Container, Typography } from '@mui/material';
import React from 'react';
import { useAuth } from '../../hooks/useAuth';

export const Login: React.FC = () => {
  const { login } = useAuth();

  const handleOAuthLogin = async (provider: string) => {
    try {
      await login(provider);
    } catch (error) {
      console.error('Login failed:', error);
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
            sx={{ mb: 2 }}
          >
            Sign in with GitHub
          </Button>
          <Button
            fullWidth
            variant="contained"
            color="primary"
            onClick={() => handleOAuthLogin('microsoft')}
          >
            Sign in with Microsoft
          </Button>
        </Box>
      </Box>
    </Container>
  );
};
