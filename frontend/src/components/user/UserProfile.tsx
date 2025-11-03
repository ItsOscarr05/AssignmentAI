import { Box, Button, CircularProgress, TextField, Typography } from '@mui/material';
import React, { useState } from 'react';

interface User {
  id: string;
  email: string;
  full_name: string;
  role: string;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

interface UserProfileProps {
  user: User;
  onUpdate?: (user: Partial<User>) => void;
  onPasswordChange?: (data: { current_password: string; new_password: string }) => void;
  on2FASetup?: () => void;
  on2FAVerify?: (code: string) => void;
  isLoading?: boolean;
  error?: string;
}

const UserProfile: React.FC<UserProfileProps> = ({
  user,
  onUpdate,
  onPasswordChange,
  on2FASetup,
  on2FAVerify,
  isLoading = false,
  error,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<User>>({});
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });
  const [verificationCode, setVerificationCode] = useState('');

  const handleUpdate = () => {
    if (onUpdate) {
      onUpdate(formData);
    }
    setIsEditing(false);
  };

  const handlePasswordChange = () => {
    if (onPasswordChange && passwordData.new_password === passwordData.confirm_password) {
      onPasswordChange({
        current_password: passwordData.current_password,
        new_password: passwordData.new_password,
      });
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      {isLoading && <CircularProgress />}
      {error && <Typography color="error">{error}</Typography>}

      <Typography variant="h5" gutterBottom>
        {user.full_name}
      </Typography>
      <Typography variant="body1" gutterBottom>
        Email: {user.email}
      </Typography>
      <Typography variant="body1" gutterBottom>
        Role: {user.role}
      </Typography>
      <Typography variant="body1" gutterBottom>
        Status: {user.is_verified ? 'Verified' : 'Not Verified'}
      </Typography>

      {!isEditing ? (
        <Button variant="contained" onClick={() => setIsEditing(true)} disabled={isLoading}>
          Edit Profile
        </Button>
      ) : (
        <Box sx={{ mt: 2 }}>
          <TextField
            label="Full Name"
            value={formData.full_name || user.full_name}
            onChange={e => setFormData({ ...formData, full_name: e.target.value })}
            fullWidth
            margin="normal"
          />
          <Button variant="contained" onClick={handleUpdate} disabled={isLoading}>
            Save Changes
          </Button>
          <Button variant="outlined" onClick={() => setIsEditing(false)} sx={{ ml: 1 }}>
            Cancel
          </Button>
        </Box>
      )}

      <Box sx={{ mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          Change Password
        </Typography>
        <TextField
          label="Current Password"
          type="password"
          value={passwordData.current_password}
          onChange={e => setPasswordData({ ...passwordData, current_password: e.target.value })}
          fullWidth
          margin="normal"
        />
        <TextField
          label="New Password"
          type="password"
          value={passwordData.new_password}
          onChange={e => setPasswordData({ ...passwordData, new_password: e.target.value })}
          fullWidth
          margin="normal"
        />
        <TextField
          label="Confirm Password"
          type="password"
          value={passwordData.confirm_password}
          onChange={e => setPasswordData({ ...passwordData, confirm_password: e.target.value })}
          fullWidth
          margin="normal"
        />
        <Button
          variant="contained"
          onClick={handlePasswordChange}
          disabled={isLoading}
          sx={{ mt: 2 }}
        >
          Update Password
        </Button>
      </Box>

      <Box sx={{ mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          Two-Factor Authentication
        </Typography>
        {!user.is_verified ? (
          <Button variant="contained" onClick={on2FASetup} disabled={isLoading}>
            Setup 2FA
          </Button>
        ) : (
          <Box>
            <TextField
              label="Verification Code"
              value={verificationCode}
              onChange={e => setVerificationCode(e.target.value)}
              fullWidth
              margin="normal"
            />
            <Button
              variant="contained"
              onClick={() => on2FAVerify?.(verificationCode)}
              disabled={isLoading}
              sx={{ mt: 2 }}
            >
              Verify 2FA
            </Button>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default UserProfile;
