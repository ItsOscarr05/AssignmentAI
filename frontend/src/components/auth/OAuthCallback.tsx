import { Box, CircularProgress, Container, Typography } from '@mui/material';
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

export const OAuthCallback: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { handleCallback } = useAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleOAuthCallback = async () => {
      const code = searchParams.get('code');
      const state = searchParams.get('state');
      const error = searchParams.get('error');
      const provider = searchParams.get('provider') || 'google'; // Default to google

      if (error) {
        setError('Authentication failed');
        return;
      }

      if (!code || !state) {
        setError('Invalid OAuth parameters');
        return;
      }

      try {
        // Add provider to the URL so handleCallback can access it
        const currentUrl = new URL(window.location.href);
        currentUrl.searchParams.set('provider', provider);
        window.history.replaceState({}, '', currentUrl.toString());

        await handleCallback(code, state);
        navigate('/dashboard');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Authentication failed');
      }
    };

    handleOAuthCallback();
  }, [searchParams, handleCallback, navigate]);

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
