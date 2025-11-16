import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  Paper,
  Step,
  StepLabel,
  Stepper,
  TextField,
  Typography,
} from '@mui/material';
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthService } from '../../services/auth/AuthService';

interface TwoFactorSetupProps {
  onComplete?: () => void;
}

type StepKey = 0 | 1 | 2;

export const TwoFactorSetup: React.FC<TwoFactorSetupProps> = ({ onComplete }) => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<StepKey>(0);
  const [initializing, setInitializing] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [manualEntry, setManualEntry] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [showBackupDialog, setShowBackupDialog] = useState(false);

  const steps = useMemo(
    () => [
      { label: 'Generate QR Code', icon: 'QrCode' },
      { label: 'Verify Setup', icon: 'Security' },
      { label: 'Save Backup Codes', icon: 'Save' },
    ],
    []
  );

  useEffect(() => {
    const initialize = async () => {
      try {
        setInitializing(true);
        const response = await AuthService.setup2FA();
        setQrCode(response.qr_code ?? '');
        setSecret(response.secret ?? '');
        setManualEntry(response.manual_entry ?? '');
      } catch (err: any) {
        const message = err?.message || 'Failed to initialize 2FA setup';
        setError(message);
      } finally {
        setInitializing(false);
      }
    };

    initialize();
  }, []);

  const handleNext = async () => {
    if (currentStep === 0) {
      setCurrentStep(1);
      return;
    }

    if (currentStep === 1) {
      try {
        setSubmitting(true);
        setError(null);
        const response = await AuthService.verify2FASetup(verificationCode);
        setBackupCodes(response.backup_codes ?? []);
        setCurrentStep(2);
      } catch (err: any) {
        const message = err?.message || 'Invalid verification code';
        setError(message);
      } finally {
        setSubmitting(false);
      }
      return;
    }

    if (currentStep === 2) {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (currentStep === 0) {
      return;
    }
    if (currentStep === 1) {
      setVerificationCode('');
    }
    setError(null);
    setCurrentStep((prev: StepKey) => (prev > 0 ? ((prev - 1) as StepKey) : prev));
  };

  const handleComplete = () => {
    onComplete?.();
    navigate('/settings');
  };

  const handleViewBackupCodes = () => {
    setShowBackupDialog(true);
  };

  if (initializing) {
    return (
      <Container maxWidth="sm">
        <Box sx={{ mt: 8, display: 'flex', justifyContent: 'center' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error && currentStep === 0 && !qrCode) {
    return (
      <Container maxWidth="sm">
        <Box sx={{ mt: 8 }}>
          <Paper elevation={3} sx={{ p: 4 }}>
            <Alert severity="error">{error}</Alert>
          </Paper>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="md">
      <Box sx={{ mt: 6 }}>
        <Typography variant="h4" align="center" gutterBottom>
          Two-Factor Authentication Setup
        </Typography>
        <Typography variant="body1" align="center" sx={{ mb: 4 }}>
          Follow these steps to secure your AssignmentAI account.
        </Typography>

        <Paper elevation={3} sx={{ p: { xs: 3, md: 5 } }}>
          <Stepper activeStep={currentStep} alternativeLabel>
            {steps.map(step => (
              <Step key={step.label}>
                <StepLabel>{step.label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          <Box sx={{ mt: 4 }}>
            {error && currentStep > 0 && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}

            {currentStep === 0 && (
              <Box>
                <Typography variant="h6" gutterBottom>
                  Step 1: Scan QR Code
                </Typography>
                <Typography sx={{ mb: 3 }}>
                  Scan this QR code with your authenticator app to add AssignmentAI.
                </Typography>
                <Box sx={{ textAlign: 'center', mb: 3 }}>
                  {qrCode ? (
                    <img
                      src={qrCode}
                      alt="2FA QR Code"
                      style={{ maxWidth: 220, borderRadius: 8 }}
                    />
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      QR code not available. Please use manual entry below.
                    </Typography>
                  )}
                </Box>
                <Typography sx={{ mb: 1 }}>Or enter this secret key manually:</Typography>
                <TextField
                  value={secret}
                  fullWidth
                  InputProps={{ readOnly: true }}
                  variant="outlined"
                  margin="dense"
                />
                {manualEntry && (
                  <TextField
                    value={manualEntry}
                    fullWidth
                    InputProps={{ readOnly: true }}
                    variant="outlined"
                    margin="normal"
                    label="Manual Entry URL"
                  />
                )}
                <Alert severity="info" sx={{ mt: 2 }}>
                  Keep this secret key secure. You will need it to access your account.
                </Alert>
              </Box>
            )}

            {currentStep === 1 && (
              <Box>
                <Typography variant="h6" gutterBottom>
                  Step 2: Verify Setup
                </Typography>
                <Typography sx={{ mb: 2 }}>
                  Enter the 6-digit code from your authenticator app to verify the setup.
                </Typography>
                <TextField
                  value={verificationCode}
                  onChange={event => setVerificationCode(event.target.value)}
                  fullWidth
                  placeholder="Enter 6-digit code"
                  margin="normal"
                  inputProps={{ maxLength: 6, inputMode: 'numeric', 'aria-label': 'Verification code' }}
                />
                <Alert severity="info" sx={{ mt: 2 }}>
                  Codes refresh every 30 seconds. Make sure the current code is entered correctly.
                </Alert>
              </Box>
            )}

            {currentStep === 2 && (
              <Box>
                <Typography variant="h6" gutterBottom>
                  Step 3: Backup Codes
                </Typography>
                <Typography sx={{ mb: 2 }}>
                  Save these backup codes in a secure location. Each code can be used once if you lose
                  access to your authenticator app.
                </Typography>
                <Alert severity="info" sx={{ mb: 3 }}>
                  Click the button below to view and securely store your one-time backup codes.
                </Alert>
                <Button sx={{ mt: 3 }} variant="outlined" onClick={handleViewBackupCodes}>
                  View Backup Codes
                </Button>
              </Box>
            )}
          </Box>

          <Box
            sx={{
              mt: 4,
              display: 'flex',
              justifyContent: 'space-between',
              flexDirection: { xs: 'column', sm: 'row' },
              gap: 2,
            }}
          >
            <Button
              variant="outlined"
              onClick={handleBack}
              disabled={currentStep === 0 || submitting}
            >
              Back
            </Button>
            <Button
              variant="contained"
              onClick={handleNext}
              disabled={
                submitting ||
                (currentStep === 1 && verificationCode.trim().length !== 6)
              }
            >
              {submitting ? <CircularProgress size={24} /> : currentStep === 2 ? "I've Saved My Codes" : 'Next'}
            </Button>
          </Box>
        </Paper>
      </Box>

      <Dialog open={showBackupDialog} onClose={() => setShowBackupDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Backup Codes</DialogTitle>
        <DialogContent dividers>
          <Typography sx={{ mb: 2 }}>
            Store these backup codes securely. Each code can be used once for login if your authenticator
            is unavailable.
          </Typography>
          <Grid container spacing={2}>
            {backupCodes.map(code => (
              <Grid key={code} item xs={12} sm={6}>
                <Paper
                  variant="outlined"
                  sx={{ p: 2, textAlign: 'center', fontFamily: 'monospace' }}
                >
                  {code}
                </Paper>
              </Grid>
            ))}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowBackupDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};
