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
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Verify2FA: React.FC = () => {
  const { t } = useTranslation();
  const [code, setCode] = useState('');
  const [isBackupCode, setIsBackupCode] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { verify2FA } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) {
      setError(t('pages.verify2FA.pleaseEnter2FACode'));
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await verify2FA(code, isBackupCode);
      // Navigation will be handled by the AuthContext
    } catch (error: any) {
      setError(error.message || t('pages.verify2FA.verificationFailed'));
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
            {t('pages.verify2FA.backToLogin')}
          </Button>

          <Typography variant="h4" component="h1" gutterBottom>
            {t('pages.verify2FA.title')}
          </Typography>

          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            {isBackupCode
              ? t('pages.verify2FA.enterBackupCode')
              : t('pages.verify2FA.enterAuthenticatorCode')}
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
              label={isBackupCode ? t('pages.verify2FA.backupCode') : t('pages.verify2FA.twoFACode')}
              value={code}
              onChange={e => setCode(e.target.value)}
              fullWidth
              autoFocus
              inputProps={{
                maxLength: isBackupCode ? 8 : 6,
                pattern: isBackupCode ? '[A-Z0-9]{8}' : '[0-9]{6}',
              }}
              placeholder={isBackupCode ? t('pages.verify2FA.enter8DigitBackupCode') : t('pages.verify2FA.enter6DigitCode')}
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
              {isLoading ? <CircularProgress size={24} color="inherit" /> : t('pages.verify2FA.verify')}
            </Button>

            <Box sx={{ textAlign: 'center' }}>
              <Link
                component="button"
                variant="body2"
                onClick={handleBackupCodeToggle}
                sx={{ textDecoration: 'none' }}
              >
                {isBackupCode ? t('pages.verify2FA.useAuthenticatorApp') : t('pages.verify2FA.useBackupCode')}
              </Link>
            </Box>

            <Box sx={{ textAlign: 'center', mt: 2 }}>
              <Typography variant="body2" color="text.secondary">
                {t('pages.verify2FA.havingTrouble')}{' '}
                <Link href="/recover-2fa" sx={{ textDecoration: 'none' }}>
                  {t('pages.verify2FA.recoverAccount')}
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
