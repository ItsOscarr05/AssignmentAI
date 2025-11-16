import { Alert, Box, Button, CircularProgress, TextField, Typography } from '@mui/material';
import { useState } from 'react';
import { auth } from '../../services/api';

interface TwoFactorVerifyProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  email?: string;
  maxAttempts?: number;
  error?: string;
}

export const TwoFactorVerify = ({
  onSuccess,
  onCancel,
  email = 'test@example.com',
  maxAttempts = 3,
  error: initialError,
}: TwoFactorVerifyProps) => {
  const [code, setCode] = useState('');
  const [error, setError] = useState(initialError || '');
  const [isLoading, setIsLoading] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [useBackup, setUseBackup] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || code.length !== 6) {
      setError('Invalid verification code');
      return;
    }

    setIsLoading(true);
    try {
      if (useBackup) {
        await auth.verifyBackupCode(code);
      } else {
        await auth.verify2FA(code);
      }
      setError('');
      setAttempts(0);
      onSuccess?.();
    } catch (err: any) {
      const apiMessage = err?.response?.data?.detail || 'Invalid verification code';
      setError(apiMessage);
      setAttempts(prev => prev + 1);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      setCode(prev => prev.slice(0, -1));
    } else if (/^\d$/.test(e.key) && code.length < 6) {
      setCode(prev => prev + e.key);
    }
  };

  const isDisabled = isLoading || attempts >= maxAttempts || code.length !== 6;

  return (
    <Box className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <Typography variant="h5" component="h2" className="text-2xl font-bold mb-6">
        Two-Factor Authentication
      </Typography>
      <form onSubmit={handleSubmit} aria-label="Two-Factor Authentication" role="form">
        <Box className="mb-6">
          <Typography className="mb-4">Verify your identity</Typography>
          <Typography className="mb-4">Enter the code sent to your email</Typography>
          <Typography className="mb-4" color="text.secondary">
            {email.replace(/(?<=.{1}).(?=.*@)/g, '...')}
          </Typography>
          <TextField
            fullWidth
            id="verification-code"
            label={useBackup ? 'Backup Code' : 'Verification Code'}
            value={code}
            onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            onKeyDown={handleKeyDown}
            error={!!error}
            helperText={error}
            disabled={isDisabled}
            inputProps={{
              ...{
                'data-testid': 'text-field',
              },
              maxLength: 6,
              'aria-label': useBackup ? 'Backup Code' : 'Verification Code',
              'aria-required': 'true',
              'aria-invalid': !!error,
              'aria-describedby': error ? 'verification-error' : undefined,
            }}
            FormHelperTextProps={{
              role: 'alert',
              id: 'verification-error',
            }}
          />
          {!!error && (
            <Alert severity="error" sx={{ mt: 1 }}>
              {error}
            </Alert>
          )}
          {isLoading && (
            <CircularProgress
              size={24}
              className="mt-4"
              role="progressbar"
              aria-label="Verifying code"
            />
          )}
          {attempts >= maxAttempts && (
            <Typography color="error" role="alert" className="mt-2">
              Too many attempts. Please try again later.
            </Typography>
          )}
          <Box className="flex gap-4 mt-4">
            <Button
              type="submit"
              variant="contained"
              color="primary"
              fullWidth
              disabled={isDisabled}
            >
              Verify
            </Button>
            <Button
              type="button"
              variant="outlined"
              color="secondary"
              fullWidth
              onClick={() => onCancel?.()}
              disabled={isDisabled}
            >
              Cancel
            </Button>
          </Box>
        </Box>
        <Box className="border-t pt-4">
          <Button
            type="button"
            color="primary"
            onClick={() => setUseBackup(prev => !prev)}
            disabled={isDisabled}
          >
            {useBackup ? 'Use Authenticator App Instead' : 'Use Backup Code Instead'}
          </Button>
        </Box>
      </form>
    </Box>
  );
};
