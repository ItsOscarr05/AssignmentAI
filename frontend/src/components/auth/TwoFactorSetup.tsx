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
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../../services/api';

interface TwoFactorSetupProps {
  onComplete?: () => void;
}

export const TwoFactorSetup: React.FC<TwoFactorSetupProps> = ({ onComplete }) => {
  const navigate = useNavigate();
  const [qrCode, setQrCode] = useState<string>('');
  const [secret, setSecret] = useState<string>('');
  const [verificationCode, setVerificationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [step, setStep] = useState<'setup' | 'verify' | 'backup'>('setup');

  useEffect(() => {
    const setup2FA = async () => {
      try {
        setLoading(true);
        const response = await auth.setup2FA();
        setQrCode(response.qr_code);
        setSecret(response.secret);
      } catch (err: any) {
        setError(err.response?.data?.detail || 'Failed to setup 2FA');
      } finally {
        setLoading(false);
      }
    };

    setup2FA();
  }, []);

  const handleVerify = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await auth.confirm2FA(verificationCode);
      setBackupCodes(response.backup_codes);
      setStep('backup');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Invalid verification code');
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = () => {
    if (onComplete) {
      onComplete();
    }
    navigate('/settings');
  };

  if (loading && step === 'setup') {
    return (
      <Container maxWidth="sm">
        <Box sx={{ mt: 8, display: 'flex', justifyContent: 'center' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="sm">
        <Box sx={{ mt: 8 }}>
          <Paper elevation={3} sx={{ p: 4 }}>
            <Alert severity="error">{error}</Alert>
            <Box sx={{ mt: 2, textAlign: 'center' }}>
              <Button variant="contained" onClick={() => navigate('/settings')}>
                Back to Settings
              </Button>
            </Box>
          </Paper>
        </Box>
      </Container>
    );
  }

  if (step === 'setup') {
    return (
      <Container maxWidth="sm">
        <Box sx={{ mt: 8 }}>
          <Paper elevation={3} sx={{ p: 4 }}>
            <Typography component="h1" variant="h5" align="center" gutterBottom>
              Setup Two-Factor Authentication
            </Typography>
            <Typography variant="body1" paragraph>
              1. Scan this QR code with your authenticator app:
            </Typography>
            <Box sx={{ textAlign: 'center', mb: 3 }}>
              <img src={qrCode} alt="2FA QR Code" style={{ maxWidth: '200px' }} />
            </Box>
            <Typography variant="body1" paragraph>
              2. Or enter this secret key manually:
            </Typography>
            <Typography
              variant="body2"
              sx={{
                fontFamily: 'monospace',
                textAlign: 'center',
                mb: 3,
                p: 2,
                bgcolor: 'grey.100',
              }}
            >
              {secret}
            </Typography>
            <Typography variant="body1" paragraph>
              3. Enter the verification code from your authenticator app:
            </Typography>
            <TextField
              margin="normal"
              required
              fullWidth
              label="Verification Code"
              value={verificationCode}
              onChange={e => setVerificationCode(e.target.value)}
            />
            <Button
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              onClick={handleVerify}
              disabled={loading || verificationCode.length !== 6}
            >
              {loading ? <CircularProgress size={24} /> : 'Verify'}
            </Button>
          </Paper>
        </Box>
      </Container>
    );
  }

  if (step === 'backup') {
    return (
      <Container maxWidth="sm">
        <Box sx={{ mt: 8 }}>
          <Paper elevation={3} sx={{ p: 4 }}>
            <Typography component="h1" variant="h5" align="center" gutterBottom>
              Backup Codes
            </Typography>
            <Alert severity="warning" sx={{ mb: 3 }}>
              Save these backup codes in a secure place. You can use them to access your account if
              you lose your authenticator app.
            </Alert>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: 2,
                mb: 3,
              }}
            >
              {backupCodes.map((code, index) => (
                <Typography
                  key={index}
                  variant="body2"
                  sx={{
                    fontFamily: 'monospace',
                    textAlign: 'center',
                    p: 1,
                    bgcolor: 'grey.100',
                  }}
                >
                  {code}
                </Typography>
              ))}
            </Box>
            <Button fullWidth variant="contained" onClick={handleComplete}>
              Complete Setup
            </Button>
          </Paper>
        </Box>
      </Container>
    );
  }

  return null;
};
