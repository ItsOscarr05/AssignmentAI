import { Box, CircularProgress, Container, Typography } from '@mui/material';
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { tokenManager } from '../../services/auth/TokenManager';

export const OAuthCallback: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { updateUser } = useAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleOAuthCallback = async () => {
      const code = searchParams.get('code');
      const state = searchParams.get('state');
      const error = searchParams.get('error');
      const token = searchParams.get('token');

      // User info from URL parameters (sent by backend)
      const userId = searchParams.get('user_id');
      const userEmail = searchParams.get('user_email');
      const userName = searchParams.get('user_name');

      if (error) {
        setError('Authentication failed');
        return;
      }

      // If we have a token, the backend has already processed the OAuth flow
      if (token) {
        try {
          // Store token using token manager
          tokenManager.storeTokens({
            access_token: token,
            refresh_token: undefined,
            expires_in: 3600, // Default 1 hour
            token_type: 'bearer',
          });

          // Also store in localStorage for compatibility
          localStorage.setItem('token', token);

          // Set Authorization header for API calls
          const { default: api } = await import('../../config/api');
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

          // Use user info from URL parameters if available, otherwise fetch from backend
          let user;

          if (userId && userEmail && userName) {
            // Use user info from URL parameters (preferred - no API call needed)
            const decodedName = decodeURIComponent(userName);
            const [firstName, ...rest] = decodedName.split(' ');
            const lastName = rest.join(' ');

            user = {
              id: userId,
              email: userEmail,
              name: decodedName,
              role: 'student' as const,
              firstName: firstName || '',
              lastName: lastName || '',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };

            console.log('Using user info from URL parameters:', user);
          } else {
            // Fallback: Get user info from backend with retry logic
            let retryCount = 0;
            const maxRetries = 3;

            while (retryCount < maxRetries) {
              try {
                const { AuthService } = await import('../../services/auth/AuthService');
                const currentUser = await AuthService.getCurrentUser();

                // Create user object
                const name = typeof currentUser.name === 'string' ? currentUser.name : '';
                const [firstName, ...rest] = name.split(' ');
                const lastName = rest.join(' ');

                user = {
                  id: String(currentUser.id),
                  email: currentUser.email,
                  name: name,
                  role: 'student' as const,
                  firstName: firstName || '',
                  lastName: lastName || '',
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                };

                console.log('Fetched user info from backend:', user);
                break; // Success, exit retry loop
              } catch (userError) {
                retryCount++;
                console.warn(
                  `Failed to get user info (attempt ${retryCount}/${maxRetries}):`,
                  userError
                );

                if (retryCount >= maxRetries) {
                  console.error('Failed to get user info after all retries:', userError);
                  setError('Failed to get user information');
                  return;
                }

                // Wait before retrying
                await new Promise(resolve => setTimeout(resolve, 1000));
              }
            }
          }

          if (user) {
            // Update AuthContext
            updateUser(user);
            localStorage.setItem('user', JSON.stringify(user));
            localStorage.setItem('isMockUser', 'false');

            console.log('OAuth login successful:', user);
            navigate('/dashboard');
            return;
          } else {
            setError('Failed to get user information');
            return;
          }
        } catch (error) {
          console.error('OAuth callback error:', error);
          setError('Authentication failed');
          return;
        }
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
  }, [searchParams, navigate, updateUser]);

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
