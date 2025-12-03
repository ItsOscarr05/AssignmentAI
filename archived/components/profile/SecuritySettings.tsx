import { Box, Button, CircularProgress, TextField, Typography } from '@mui/material';
import React, { useState } from 'react';
import { UserProfile } from '../../types/user';

interface SecuritySettingsProps {
  user: UserProfile;
  onPasswordChange: (data: { current_password: string; new_password: string }) => Promise<void>;
  on2FASetup: () => Promise<void>;
  on2FAVerify: (code: string) => Promise<void>;
}

const SecuritySettings: React.FC<SecuritySettingsProps> = ({
  onPasswordChange,
  on2FASetup,
  on2FAVerify,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });
  const [verificationCode, setVerificationCode] = useState('');

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordData.new_password !== passwordData.confirm_password) {
      setError('New passwords do not match');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await onPasswordChange({
        current_password: passwordData.current_password,
        new_password: passwordData.new_password,
      });
      setSuccess('Password changed successfully');
      setPasswordData({
        current_password: '',
        new_password: '',
        confirm_password: '',
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
  };

  const handle2FASetup = async () => {
    try {
      setLoading(true);
      setError(null);
      await on2FASetup();
      setSuccess('2FA setup initiated');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to setup 2FA');
    } finally {
      setLoading(false);
    }
  };

  const handle2FAVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      await on2FAVerify(verificationCode);
      setSuccess('2FA verified successfully');
      setVerificationCode('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to verify 2FA');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto', p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Security Settings
      </Typography>

      {error && (
        <Typography color="error" sx={{ mb: 2 }}>
          {error}
        </Typography>
      )}

      {success && (
        <Typography color="success.main" sx={{ mb: 2 }}>
          {success}
        </Typography>
      )}

      <Box component="form" onSubmit={handlePasswordChange} sx={{ mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Change Password
        </Typography>

        <TextField
          fullWidth
          label="Current Password"
          name="current_password"
          type="password"
          value={passwordData.current_password}
          onChange={handleInputChange}
          margin="normal"
          required
        />

        <TextField
          fullWidth
          label="New Password"
          name="new_password"
          type="password"
          value={passwordData.new_password}
          onChange={handleInputChange}
          margin="normal"
          required
        />

        <TextField
          fullWidth
          label="Confirm New Password"
          name="confirm_password"
          type="password"
          value={passwordData.confirm_password}
          onChange={handleInputChange}
          margin="normal"
          required
        />

        <Button type="submit" variant="contained" color="primary" disabled={loading} sx={{ mt: 2 }}>
          {loading ? <CircularProgress size={24} /> : 'Change Password'}
        </Button>
      </Box>

      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Two-Factor Authentication
        </Typography>

        <Button
          variant="outlined"
          color="primary"
          onClick={handle2FASetup}
          disabled={loading}
          sx={{ mr: 2 }}
        >
          Setup 2FA
        </Button>

        <Box component="form" onSubmit={handle2FAVerify} sx={{ mt: 2 }}>
          <TextField
            fullWidth
            label="Verification Code"
            value={verificationCode}
            onChange={e => setVerificationCode(e.target.value)}
            margin="normal"
            required
          />

          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={loading}
            sx={{ mt: 2 }}
          >
            {loading ? <CircularProgress size={24} /> : 'Verify 2FA'}
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default SecuritySettings;
