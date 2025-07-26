import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  Link,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Verify2FA: React.FC = () => {
  const [code, setCode] = useState('');
  const [isBackupCode, setIsBackupCode] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { verify2FA } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) {
      setError('Please enter your 2FA code');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await verify2FA(code, isBackupCode);
      // Navigation will be handled by the AuthContext
    } catch (error: any) {
      setError(error.message || '2FA verification failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackupCodeToggle = () => {
    setIsBackupCode(!isBackupCode);
    setCode('');
    setError('');
  };

  const handleGoBack = () => {
    navigate('/login');
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 8 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Box sx={{ mb: 3 }}>
          <Button startIcon={<ArrowBackIcon />} onClick={handleGoBack} sx={{ mb: 2 }}>
            Back to Login
          </Button>

          <Typography variant="h4" component="h1" gutterBottom>
            Two-Factor Authentication
          </Typography>

          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            {isBackupCode
              ? 'Enter your backup code to access your account'
              : 'Enter the 6-digit code from your authenticator app'}
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <Stack spacing={3}>
            <TextField
              label={isBackupCode ? 'Backup Code' : '2FA Code'}
              value={code}
              onChange={e => setCode(e.target.value)}
              fullWidth
              autoFocus
              inputProps={{
                maxLength: isBackupCode ? 8 : 6,
                pattern: isBackupCode ? '[A-Z0-9]{8}' : '[0-9]{6}',
              }}
              placeholder={isBackupCode ? 'Enter 8-digit backup code' : 'Enter 6-digit code'}
            />

            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={isLoading || !code.trim()}
              sx={{
                py: 1.5,
                backgroundColor: '#8B0000',
                '&:hover': {
                  backgroundColor: '#660000',
                },
              }}
            >
              {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Verify'}
            </Button>

            <Box sx={{ textAlign: 'center' }}>
              <Link
                component="button"
                variant="body2"
                onClick={handleBackupCodeToggle}
                sx={{ textDecoration: 'none' }}
              >
                {isBackupCode ? 'Use authenticator app instead' : 'Use backup code instead'}
              </Link>
            </Box>

            <Box sx={{ textAlign: 'center', mt: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Having trouble?{' '}
                <Link href="/recover-2fa" sx={{ textDecoration: 'none' }}>
                  Recover your account
                </Link>
              </Typography>
            </Box>
          </Stack>
        </form>
      </Paper>
    </Container>
  );
};

export default Verify2FA;
