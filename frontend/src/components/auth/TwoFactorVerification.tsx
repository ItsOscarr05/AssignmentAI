import { ExpandLess as ExpandLessIcon, ExpandMore as ExpandMoreIcon } from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Collapse,
  Paper,
  TextField,
  Typography,
} from '@mui/material';
import React, { useState } from 'react';
import { auth } from '../../services/api';

interface TwoFactorVerificationProps {
  onSuccess: () => void;
}

export const TwoFactorVerification: React.FC<TwoFactorVerificationProps> = ({ onSuccess }) => {
  const [code, setCode] = useState('');
  const [backupCode, setBackupCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showBackupCode, setShowBackupCode] = useState(false);

  const handleVerify = async () => {
    try {
      setIsLoading(true);
      setError(null);
      await auth.verify2FA(code);
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Invalid verification code');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackupCode = async () => {
    try {
      setIsLoading(true);
      setError(null);
      await auth.verifyBackupCode(backupCode);
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Invalid backup code');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Paper sx={{ p: 3, mt: 2 }}>
      <Typography variant="h6" gutterBottom>
        Two-Factor Authentication
      </Typography>

      <Typography variant="body1" gutterBottom>
        Please enter the 6-digit code from your authenticator app:
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <TextField
        fullWidth
        label="Verification Code"
        value={code}
        onChange={e => setCode(e.target.value)}
        margin="normal"
        inputProps={{ maxLength: 6 }}
      />

      <Button
        variant="contained"
        onClick={handleVerify}
        disabled={isLoading || code.length !== 6}
        sx={{ mt: 2 }}
      >
        Verify
      </Button>

      <Box sx={{ mt: 2 }}>
        <Button
          startIcon={showBackupCode ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          onClick={() => setShowBackupCode(!showBackupCode)}
          color="primary"
        >
          Use Backup Code
        </Button>

        <Collapse in={showBackupCode}>
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Enter your backup code if you can't access your authenticator app:
            </Typography>

            <TextField
              fullWidth
              label="Backup Code"
              value={backupCode}
              onChange={e => setBackupCode(e.target.value)}
              margin="normal"
              inputProps={{ maxLength: 8 }}
            />

            <Button
              variant="outlined"
              onClick={handleBackupCode}
              disabled={isLoading || backupCode.length !== 8}
              sx={{ mt: 2 }}
            >
              Use Backup Code
            </Button>
          </Box>
        </Collapse>
      </Box>
    </Paper>
  );
};
