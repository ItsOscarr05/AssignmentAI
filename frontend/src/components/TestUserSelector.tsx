import { AccountCircle, AdminPanelSettings, School, SwapHoriz } from '@mui/icons-material';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  Typography,
  useTheme,
} from '@mui/material';
import React, { useState } from 'react';
import TestUserService, { TestUserData } from '../services/testUserService';

interface TestUserSelectorProps {
  open: boolean;
  onClose: () => void;
}

const TestUserSelector: React.FC<TestUserSelectorProps> = ({ open, onClose }) => {
  const theme = useTheme();
  const [selectedUser, setSelectedUser] = useState<TestUserData | null>(null);
  const testUserService = TestUserService.getInstance();
  const testUsers = testUserService.getTestUsers();

  const handleUserSelect = (user: TestUserData) => {
    setSelectedUser(user);
  };

  const handleLoginAsUser = () => {
    if (selectedUser) {
      // Use the existing mock login but with the selected user data
      const userData = testUserService.convertToUser(selectedUser);

      // Update localStorage with the selected user
      localStorage.setItem('user', JSON.stringify(userData));

      // Trigger a page reload to update the auth context
      window.location.reload();
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'student':
        return <School />;
      case 'teacher':
        return <AccountCircle />;
      case 'admin':
        return <AdminPanelSettings />;
      default:
        return <AccountCircle />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'student':
        return 'primary';
      case 'teacher':
        return 'secondary';
      case 'admin':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          maxHeight: '80vh',
        },
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <SwapHoriz color="primary" />
          <Typography variant="h5" fontWeight="bold">
            Test User Selector
          </Typography>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Select a test user to login with. This is for development and testing purposes only.
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ pt: 2 }}>
        <Grid container spacing={2}>
          {testUsers.map(user => (
            <Grid item xs={12} sm={6} md={4} key={user.id}>
              <Card
                sx={{
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  border: selectedUser?.id === user.id ? '2px solid' : '1px solid',
                  borderColor: selectedUser?.id === user.id ? 'primary.main' : 'divider',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: theme.shadows[4],
                    borderColor: 'primary.main',
                  },
                }}
                onClick={() => handleUserSelect(user)}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <Box
                      sx={{
                        p: 1,
                        borderRadius: 1,
                        background: theme.palette.primary.main,
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {getRoleIcon(user.role)}
                    </Box>
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="h6" fontWeight="bold">
                        {user.id === '1'
                          ? 'Mock User (Demo Data)'
                          : user.id === 'test-blank'
                          ? 'Test User (Blank Slate)'
                          : user.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {user.email}
                      </Typography>
                    </Box>
                  </Box>

                  <Chip
                    label={user.role}
                    color={getRoleColor(user.role) as any}
                    size="small"
                    sx={{ mb: 2 }}
                  />

                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {user.profile.bio.substring(0, 100)}...
                  </Typography>

                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Typography variant="caption" color="text.secondary">
                      <strong>Location:</strong> {user.profile.location}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      <strong>Education:</strong> {user.profile.education}
                    </Typography>
                    {user.role === 'student' && (
                      <Typography variant="caption" color="text.secondary">
                        <strong>Assignments:</strong> {user.statistics?.totalAssignments || 0}
                      </Typography>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {selectedUser && (
          <Box sx={{ mt: 3, p: 2, bgcolor: 'action.hover', borderRadius: 2 }}>
            <Typography variant="h6" gutterBottom>
              Selected User: {selectedUser.name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Role: {selectedUser.role} | Email: {selectedUser.email}
            </Typography>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 1 }}>
        <Button onClick={onClose} variant="outlined">
          Cancel
        </Button>
        <Button
          onClick={handleLoginAsUser}
          variant="contained"
          disabled={!selectedUser}
          sx={{
            background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
            '&:hover': {
              background: `linear-gradient(45deg, ${theme.palette.primary.dark}, ${theme.palette.primary.main})`,
            },
          }}
        >
          Login as {selectedUser?.name || 'User'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TestUserSelector;
