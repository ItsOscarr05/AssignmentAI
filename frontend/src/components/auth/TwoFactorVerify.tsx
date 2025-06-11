import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  Paper,
  TextField,
  Typography,
} from '@mui/material';
import React, { useState } from 'react';
import { auth } from '../../services/api';

interface TwoFactorVerifyProps {
  onSuccess: () => void;
}

export const TwoFactorVerify: React.FC<TwoFactorVerifyProps> = ({ onSuccess }) => {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [useBackupCode, setUseBackupCode] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      if (useBackupCode) {
        await auth.verifyBackupCode(code);
      } else {
        await auth.verify2FA(code);
      }
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Invalid verification code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 8 }}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <Typography component="h1" variant="h5" align="center" gutterBottom>
            Two-Factor Authentication
          </Typography>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <form onSubmit={handleSubmit}>
            <TextField
              margin="normal"
              required
              fullWidth
              label={useBackupCode ? 'Backup Code' : 'Verification Code'}
              value={code}
              onChange={e => setCode(e.target.value)}
              inputProps={{ maxLength: useBackupCode ? 8 : 6 }}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={loading || code.length !== (useBackupCode ? 8 : 6)}
            >
              {loading ? <CircularProgress size={24} /> : 'Verify'}
            </Button>
            <Box sx={{ textAlign: 'center' }}>
              <Button
                onClick={() => setUseBackupCode(!useBackupCode)}
                sx={{ textTransform: 'none' }}
              >
                {useBackupCode ? 'Use authenticator app instead' : 'Use backup code instead'}
              </Button>
            </Box>
          </form>
        </Paper>
      </Box>
    </Container>
  );
};
