import { GitHub as GitHubIcon, Google as GoogleIcon } from '@mui/icons-material';
import { Box, Button, Divider, Typography } from '@mui/material';
import React from 'react';
import { AuthManager } from '../../services/authManager';

interface SocialLoginProps {
  isLoading?: boolean;
}

export const SocialLogin: React.FC<SocialLoginProps> = ({ isLoading = false }) => {
  const authService = AuthManager.getInstance();

  const handleSocialLogin = async (provider: string) => {
    try {
      const response = await authService.getOAuthUrl(provider);
      window.location.href = response.url;
    } catch (error) {
      console.error(`Failed to initiate ${provider} login:`, error);
    }
  };

  return (
    <Box sx={{ width: '100%', mt: 2 }}>
      <Divider sx={{ my: 2 }}>
        <Typography variant="body2" color="text.secondary">
          Or continue with
        </Typography>
      </Divider>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        <Button
          variant="outlined"
          startIcon={<GoogleIcon />}
          onClick={() => handleSocialLogin('google')}
          disabled={isLoading}
          fullWidth
        >
          Continue with Google
        </Button>
        <Button
          variant="outlined"
          startIcon={<GitHubIcon />}
          onClick={() => handleSocialLogin('github')}
          disabled={isLoading}
          fullWidth
        >
          Continue with GitHub
        </Button>
      </Box>
    </Box>
  );
};
