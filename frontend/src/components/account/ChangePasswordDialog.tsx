import { Close, Visibility, VisibilityOff, VpnKeyOutlined } from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  InputAdornment,
  TextField,
  Typography,
} from '@mui/material';
import React, { useState } from 'react';

interface ChangePasswordDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (passwordData: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  }) => Promise<void>;
  isLoading?: boolean;
  error?: string | null;
}

const ChangePasswordDialog: React.FC<ChangePasswordDialogProps> = ({
  open,
  onClose,
  onSubmit,
  isLoading = false,
  error = null,
}) => {
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [confirmPasswordError, setConfirmPasswordError] = useState('');

  // Password requirements validation
  const passwordRequirements = {
    minLength: passwordForm.newPassword.length >= 8,
    hasUpperCase: /[A-Z]/.test(passwordForm.newPassword),
    hasLowerCase: /[a-z]/.test(passwordForm.newPassword),
    hasNumber: /\d/.test(passwordForm.newPassword),
    hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(passwordForm.newPassword),
  };

  const validateConfirmPassword = (confirmPassword: string) => {
    if (confirmPassword && confirmPassword !== passwordForm.newPassword) {
      setConfirmPasswordError('Passwords do not match');
    } else {
      setConfirmPasswordError('');
    }
  };

  const handleSubmit = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setConfirmPasswordError('Passwords do not match');
      return;
    }

    if (Object.values(passwordRequirements).some(req => !req)) {
      return;
    }

    await onSubmit(passwordForm);
  };

  const handleClose = () => {
    setPasswordForm({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
    setConfirmPasswordError('');
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          backgroundColor: theme =>
            theme.palette.mode === 'dark' ? theme.palette.background.default : '#fff',
          border: 2,
          borderColor: 'error.main',
          borderRadius: 2,
        },
      }}
    >
      <DialogTitle
        sx={{
          color: theme => (theme.palette.mode === 'dark' ? 'white' : 'black'),
          position: 'sticky',
          top: 0,
          backgroundColor: theme =>
            theme.palette.mode === 'dark' ? theme.palette.background.default : '#fff',
          zIndex: 2,
          pb: 2,
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <VpnKeyOutlined />
            Change Password
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <IconButton
              onClick={handleClose}
              size="small"
              sx={{
                color: 'error.main',
                '&:hover': { backgroundColor: 'error.light', color: 'white' },
              }}
            >
              <Close />
            </IconButton>
          </Box>
        </Box>
      </DialogTitle>
      <DialogContent
        sx={{
          backgroundColor: theme =>
            theme.palette.mode === 'dark' ? theme.palette.background.default : '#fff',
        }}
      >
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            mb: 3,
            color: theme => (theme.palette.mode === 'dark' ? 'white' : 'text.secondary'),
          }}
        >
          Enter your current password and choose a new password to update your account security.
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            label="Current Password"
            type={showCurrentPassword ? 'text' : 'password'}
            fullWidth
            variant="outlined"
            placeholder="Enter your current password"
            value={passwordForm.currentPassword}
            onChange={e =>
              setPasswordForm({
                ...passwordForm,
                currentPassword: e.target.value,
              })
            }
            disabled={isLoading}
            sx={{
              '& .MuiOutlinedInput-root': {
                backgroundColor: theme =>
                  theme.palette.mode === 'dark' ? theme.palette.background.paper : '#fff',
                '& fieldset': {
                  borderColor: theme =>
                    theme.palette.mode === 'dark'
                      ? 'rgba(255, 255, 255, 0.23)'
                      : 'rgba(0, 0, 0, 0.23)',
                },
                '&:hover fieldset': {
                  borderColor: 'error.main',
                },
                '&.Mui-focused fieldset': {
                  borderColor: 'error.main',
                },
              },
              '& .MuiInputLabel-root': {
                color: theme => (theme.palette.mode === 'dark' ? 'white' : 'text.primary'),
              },
            }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    edge="end"
                    disabled={isLoading}
                    sx={{
                      color: theme => (theme.palette.mode === 'dark' ? 'white' : 'text.primary'),
                    }}
                  >
                    {showCurrentPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          <TextField
            label="New Password"
            type={showNewPassword ? 'text' : 'password'}
            fullWidth
            variant="outlined"
            placeholder="Enter your new password"
            value={passwordForm.newPassword}
            onChange={e => {
              const newPasswordValue = e.target.value;
              setPasswordForm({
                ...passwordForm,
                newPassword: newPasswordValue,
              });
              // Re-validate confirm password when new password changes
              if (passwordForm.confirmPassword) {
                if (passwordForm.confirmPassword !== newPasswordValue) {
                  setConfirmPasswordError('Passwords do not match');
                } else {
                  setConfirmPasswordError('');
                }
              }
            }}
            disabled={isLoading}
            sx={{
              '& .MuiOutlinedInput-root': {
                backgroundColor: theme =>
                  theme.palette.mode === 'dark' ? theme.palette.background.paper : '#fff',
                '& fieldset': {
                  borderColor: theme =>
                    theme.palette.mode === 'dark'
                      ? 'rgba(255, 255, 255, 0.23)'
                      : 'rgba(0, 0, 0, 0.23)',
                },
                '&:hover fieldset': {
                  borderColor: 'error.main',
                },
                '&.Mui-focused fieldset': {
                  borderColor: 'error.main',
                },
              },
              '& .MuiInputLabel-root': {
                color: theme => (theme.palette.mode === 'dark' ? 'white' : 'text.primary'),
              },
            }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    edge="end"
                    disabled={isLoading}
                    sx={{
                      color: theme => (theme.palette.mode === 'dark' ? 'white' : 'text.primary'),
                    }}
                  >
                    {showNewPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          {/* Password Requirements Display */}
          {passwordForm.newPassword && (
            <Box
              sx={{
                mt: 2,
                mb: 2,
                p: 2,
                backgroundColor: theme =>
                  theme.palette.mode === 'dark'
                    ? 'rgba(255, 255, 255, 0.05)'
                    : 'rgba(0, 0, 0, 0.02)',
                borderRadius: 1,
                border: '1px solid',
                borderColor: theme =>
                  theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
              }}
            >
              <Typography
                variant="body2"
                sx={{
                  color: theme => (theme.palette.mode === 'dark' ? 'white' : 'text.primary'),
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  mb: 1.5,
                }}
              >
                Password Requirements:
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.8 }}>
                <Typography
                  variant="body2"
                  sx={{
                    color: passwordRequirements.minLength ? 'success.main' : 'error.main',
                    fontWeight: 500,
                    fontSize: '0.8rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5,
                  }}
                >
                  {passwordRequirements.minLength ? '✓' : '✗'} At least 8 characters
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: passwordRequirements.hasUpperCase ? 'success.main' : 'error.main',
                    fontWeight: 500,
                    fontSize: '0.8rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5,
                  }}
                >
                  {passwordRequirements.hasUpperCase ? '✓' : '✗'} One uppercase letter
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: passwordRequirements.hasLowerCase ? 'success.main' : 'error.main',
                    fontWeight: 500,
                    fontSize: '0.8rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5,
                  }}
                >
                  {passwordRequirements.hasLowerCase ? '✓' : '✗'} One lowercase letter
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: passwordRequirements.hasNumber ? 'success.main' : 'error.main',
                    fontWeight: 500,
                    fontSize: '0.8rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5,
                  }}
                >
                  {passwordRequirements.hasNumber ? '✓' : '✗'} One number
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: passwordRequirements.hasSpecialChar ? 'success.main' : 'error.main',
                    fontWeight: 500,
                    fontSize: '0.8rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5,
                  }}
                >
                  {passwordRequirements.hasSpecialChar ? '✓' : '✗'} One special character
                </Typography>
              </Box>
            </Box>
          )}

          <TextField
            label="Confirm New Password"
            type={showConfirmPassword ? 'text' : 'password'}
            fullWidth
            variant="outlined"
            placeholder="Confirm your new password"
            value={passwordForm.confirmPassword}
            onChange={e => {
              setPasswordForm({
                ...passwordForm,
                confirmPassword: e.target.value,
              });
              validateConfirmPassword(e.target.value);
            }}
            onBlur={e => validateConfirmPassword(e.target.value)}
            error={!!confirmPasswordError}
            helperText={confirmPasswordError}
            disabled={isLoading}
            sx={{
              '& .MuiOutlinedInput-root': {
                backgroundColor: theme =>
                  theme.palette.mode === 'dark' ? theme.palette.background.paper : '#fff',
                '& fieldset': {
                  borderColor: theme =>
                    theme.palette.mode === 'dark'
                      ? 'rgba(255, 255, 255, 0.23)'
                      : 'rgba(0, 0, 0, 0.23)',
                },
                '&:hover fieldset': {
                  borderColor: 'error.main',
                },
                '&.Mui-focused fieldset': {
                  borderColor: 'error.main',
                },
              },
              '& .MuiInputLabel-root': {
                color: theme => (theme.palette.mode === 'dark' ? 'white' : 'text.primary'),
              },
            }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    edge="end"
                    disabled={isLoading}
                    sx={{
                      color: theme => (theme.palette.mode === 'dark' ? 'white' : 'text.primary'),
                    }}
                  >
                    {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
        </Box>

        <Alert
          severity="info"
          sx={{
            mt: 2,
            backgroundColor: theme =>
              theme.palette.mode === 'dark' ? 'rgba(25, 118, 210, 0.08)' : undefined,
            color: theme => (theme.palette.mode === 'dark' ? 'white' : undefined),
          }}
        >
          <Typography variant="caption">
            Your password will be updated immediately. You'll need to use your new password for
            future logins.
          </Typography>
        </Alert>
      </DialogContent>
      <DialogActions
        sx={{
          backgroundColor: theme =>
            theme.palette.mode === 'dark' ? theme.palette.background.default : '#fff',
          p: 2,
        }}
      >
        <Button
          onClick={handleClose}
          disabled={isLoading}
          sx={{
            color: theme => (theme.palette.mode === 'dark' ? 'white' : 'text.primary'),
            '&:hover': {
              backgroundColor: theme =>
                theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
            },
          }}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={isLoading}
          startIcon={isLoading ? <CircularProgress size={16} /> : null}
          sx={{
            backgroundColor: 'error.main',
            '&:hover': {
              backgroundColor: 'error.dark',
            },
            '&:disabled': {
              backgroundColor: 'error.light',
            },
          }}
        >
          {isLoading ? 'Changing Password...' : 'Change Password'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ChangePasswordDialog;
