import {
  CheckCircle as CheckCircleIcon,
  QrCode as QrCodeIcon,
  Security as SecurityIcon,
} from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  Step,
  StepLabel,
  Stepper,
  TextField,
  Typography,
} from '@mui/material';
import React, { useEffect, useState } from 'react';
import { AuthService } from '../services/auth/AuthService';

interface TwoFactorSetupProps {
  onSetupComplete?: () => void;
}

const TwoFactorSetup: React.FC<TwoFactorSetupProps> = ({ onSetupComplete }) => {
  const [activeStep, setActiveStep] = useState(0);
  const [setupData, setSetupData] = useState<any>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showBackupCodes, setShowBackupCodes] = useState(false);

  const steps = ['Generate QR Code', 'Verify Setup', 'Save Backup Codes'];

  useEffect(() => {
    if (activeStep === 0) {
      initializeSetup();
    }
  }, [activeStep]);

  const initializeSetup = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await AuthService.setup2FA();
      setSetupData(data);
    } catch (error: any) {
      setError(error.message || 'Failed to initialize 2FA setup');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!verificationCode.trim()) {
      setError('Please enter the verification code');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const response = await AuthService.verify2FASetup(verificationCode);
      setBackupCodes(response.backup_codes);
      setActiveStep(2);
    } catch (error: any) {
      setError(error.message || 'Invalid verification code');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseBackupCodes = () => {
    setShowBackupCodes(false);
    if (onSetupComplete) {
      onSetupComplete();
    }
  };

  const handleNext = () => {
    if (activeStep === 1) {
      handleVerifyCode();
    } else {
      setActiveStep(prevStep => prevStep + 1);
    }
  };

  const handleBack = () => {
    setActiveStep(prevStep => prevStep - 1);
  };

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Step 1: Scan QR Code
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
            </Typography>

            {setupData && (
              <Box sx={{ textAlign: 'center', mb: 3 }}>
                <img
                  src={setupData.qr_code}
                  alt="2FA QR Code"
                  style={{ maxWidth: '200px', height: 'auto' }}
                />
              </Box>
            )}

            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Or enter this code manually in your authenticator app:
            </Typography>
            <TextField
              fullWidth
              value={setupData?.secret || ''}
              InputProps={{ readOnly: true }}
              sx={{ mb: 2 }}
            />

            <Alert severity="info" sx={{ mb: 2 }}>
              Make sure your authenticator app is ready before proceeding to the next step.
            </Alert>
          </Box>
        );

      case 1:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Step 2: Verify Setup
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Enter the 6-digit code from your authenticator app to verify the setup.
            </Typography>

            <TextField
              fullWidth
              label="Verification Code"
              value={verificationCode}
              onChange={e => setVerificationCode(e.target.value)}
              inputProps={{ maxLength: 6, pattern: '[0-9]{6}' }}
              placeholder="Enter 6-digit code"
              sx={{ mb: 2 }}
            />
          </Box>
        );

      case 2:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Step 3: Backup Codes
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Save these backup codes in a secure location. You can use them to access your account
              if you lose your authenticator device.
            </Typography>

            <Alert severity="warning" sx={{ mb: 2 }}>
              <Typography variant="body2">
                <strong>Important:</strong> These backup codes will only be shown once. Make sure to
                save them securely.
              </Typography>
            </Alert>

            <Button
              variant="outlined"
              onClick={() => setShowBackupCodes(true)}
              startIcon={<QrCodeIcon />}
            >
              View Backup Codes
            </Button>
          </Box>
        );

      default:
        return null;
    }
  };

  if (loading && activeStep === 0) {
    return (
      <Box display="flex" justifyContent="center" p={3}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <SecurityIcon sx={{ mr: 1 }} />
          <Typography variant="h5">Two-Factor Authentication Setup</Typography>
        </Box>

        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map(label => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {renderStepContent()}

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
          <Button disabled={activeStep === 0} onClick={handleBack}>
            Back
          </Button>

          <Button
            variant="contained"
            onClick={handleNext}
            disabled={loading || (activeStep === 1 && !verificationCode.trim())}
            sx={{
              backgroundColor: '#8B0000',
              '&:hover': {
                backgroundColor: '#660000',
              },
            }}
          >
            {loading ? (
              <CircularProgress size={20} color="inherit" />
            ) : activeStep === steps.length - 1 ? (
              'Complete Setup'
            ) : (
              'Next'
            )}
          </Button>
        </Box>
      </CardContent>

      {/* Backup Codes Dialog */}
      <Dialog open={showBackupCodes} onClose={handleCloseBackupCodes} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <CheckCircleIcon sx={{ mr: 1, color: 'success.main' }} />
            Backup Codes
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Save these backup codes in a secure location. Each code can only be used once.
          </Typography>

          <Grid container spacing={1}>
            {backupCodes.map((code, index) => (
              <Grid item xs={6} sm={4} key={index}>
                <Chip
                  label={code}
                  variant="outlined"
                  sx={{ fontFamily: 'monospace', fontSize: '0.9rem' }}
                />
              </Grid>
            ))}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseBackupCodes} variant="contained">
            I've Saved My Codes
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
};

export default TwoFactorSetup;
