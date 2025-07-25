import { Box, CircularProgress, Container, Typography } from '@mui/material';
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

export const OAuthCallback: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleOAuthCallback = async () => {
      const code = searchParams.get('code');
      const state = searchParams.get('state');
      const error = searchParams.get('error');
      const token = searchParams.get('token');

      if (error) {
        setError('Authentication failed');
        return;
      }

      // If we have a token, the backend has already processed the OAuth flow
      if (token) {
        localStorage.setItem('token', token);
        navigate('/dashboard');
        return;
      }

      // If we have code and state but no token, something went wrong
      if (code && state) {
        setError('OAuth flow incomplete - no token received');
        return;
      }

      // If we have no parameters at all, this might be a direct visit
      if (!code && !state && !token) {
        setError('Invalid OAuth parameters');
        return;
      }
    };

    handleOAuthCallback();
  }, [searchParams, navigate]);

  if (error) {
    return (
      <Container maxWidth="sm">
        <Box sx={{ mt: 8, textAlign: 'center' }}>
          <Typography color="error" variant="h6">
            {error}
          </Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Completing authentication...
        </Typography>
      </Box>
    </Container>
  );
};
