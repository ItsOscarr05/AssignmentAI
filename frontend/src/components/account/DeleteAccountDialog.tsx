import { Close, DeleteForeverOutlined, Warning } from '@mui/icons-material';
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
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  TextField,
  Typography,
} from '@mui/material';
import React, { useState } from 'react';

interface DeleteAccountDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (confirmationText: string) => Promise<void>;
  isLoading?: boolean;
  error?: string | null;
}

const DeleteAccountDialog: React.FC<DeleteAccountDialogProps> = ({
  open,
  onClose,
  onSubmit,
  isLoading = false,
  error = null,
}) => {
  const [confirmationText, setConfirmationText] = useState('');
  const [confirmationError, setConfirmationError] = useState('');

  const handleSubmit = async () => {
    if (confirmationText !== 'DELETE') {
      setConfirmationError('Please type DELETE to confirm account deletion');
      return;
    }

    setConfirmationError('');
    await onSubmit(confirmationText);
  };

  const handleClose = () => {
    setConfirmationText('');
    setConfirmationError('');
    onClose();
  };

  const handleConfirmationChange = (value: string) => {
    setConfirmationText(value);
    if (confirmationError && value === 'DELETE') {
      setConfirmationError('');
    }
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
            <DeleteForeverOutlined sx={{ color: 'error.main' }} />
            Delete Account
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
        <Alert
          severity="error"
          sx={{
            mb: 3,
            backgroundColor: theme =>
              theme.palette.mode === 'dark' ? 'rgba(211, 47, 47, 0.08)' : undefined,
            '& .MuiAlert-icon': {
              color: theme => (theme.palette.mode === 'dark' ? 'white' : undefined),
            },
          }}
        >
          <Typography
            variant="body2"
            sx={{
              color: theme => (theme.palette.mode === 'dark' ? 'white' : undefined),
              fontWeight: 600,
            }}
          >
            <strong>Warning:</strong> This action cannot be undone. All your data will be
            permanently deleted.
          </Typography>
        </Alert>

        <Typography
          variant="body2"
          sx={{
            mb: 3,
            color: theme => (theme.palette.mode === 'dark' ? 'white' : 'text.secondary'),
            fontWeight: 500,
          }}
        >
          Before deleting your account, please consider:
        </Typography>

        <List dense sx={{ mb: 3 }}>
          <ListItem sx={{ px: 0 }}>
            <ListItemIcon sx={{ minWidth: 32 }}>
              <Warning fontSize="small" sx={{ color: 'warning.main' }} />
            </ListItemIcon>
            <ListItemText
              primary={
                <Typography
                  sx={{
                    color: theme => (theme.palette.mode === 'dark' ? 'white' : 'text.primary'),
                    fontWeight: 500,
                  }}
                >
                  All assignments and submissions will be lost
                </Typography>
              }
              primaryTypographyProps={{ variant: 'body2' }}
            />
          </ListItem>
          <ListItem sx={{ px: 0 }}>
            <ListItemIcon sx={{ minWidth: 32 }}>
              <Warning fontSize="small" sx={{ color: 'warning.main' }} />
            </ListItemIcon>
            <ListItemText
              primary={
                <Typography
                  sx={{
                    color: theme => (theme.palette.mode === 'dark' ? 'white' : 'text.primary'),
                    fontWeight: 500,
                  }}
                >
                  Your account cannot be recovered
                </Typography>
              }
              primaryTypographyProps={{ variant: 'body2' }}
            />
          </ListItem>
          <ListItem sx={{ px: 0 }}>
            <ListItemIcon sx={{ minWidth: 32 }}>
              <Warning fontSize="small" sx={{ color: 'warning.main' }} />
            </ListItemIcon>
            <ListItemText
              primary={
                <Typography
                  sx={{
                    color: theme => (theme.palette.mode === 'dark' ? 'white' : 'text.primary'),
                    fontWeight: 500,
                  }}
                >
                  Consider downloading your data first
                </Typography>
              }
              primaryTypographyProps={{ variant: 'body2' }}
            />
          </ListItem>
        </List>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Confirmation Text Input */}
        <Box sx={{ mb: 3 }}>
          <Typography
            variant="subtitle2"
            sx={{
              mb: 2,
              color: 'error.main',
              fontWeight: 600,
            }}
          >
            Type DELETE to confirm
          </Typography>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Type DELETE to confirm account deletion"
            value={confirmationText}
            onChange={e => handleConfirmationChange(e.target.value)}
            error={!!confirmationError}
            helperText={confirmationError}
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
                '&.Mui-error fieldset': {
                  borderColor: 'error.main',
                },
              },
              '& .MuiInputLabel-root': {
                color: theme => (theme.palette.mode === 'dark' ? 'white' : 'text.primary'),
              },
              '& .MuiFormHelperText-root': {
                color: 'error.main',
                fontWeight: 500,
              },
            }}
          />
        </Box>

        <Alert
          severity="warning"
          sx={{
            backgroundColor: theme =>
              theme.palette.mode === 'dark' ? 'rgba(255, 152, 0, 0.08)' : undefined,
            color: theme => (theme.palette.mode === 'dark' ? 'white' : undefined),
            '& .MuiAlert-icon': {
              color: theme => (theme.palette.mode === 'dark' ? 'white' : undefined),
            },
          }}
        >
          <Typography variant="caption">
            This action will permanently delete your account and all associated data. Please ensure
            you have backed up any important information before proceeding.
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
          disabled={isLoading || confirmationText !== 'DELETE'}
          startIcon={isLoading ? <CircularProgress size={16} /> : <DeleteForeverOutlined />}
          sx={{
            backgroundColor: 'error.main',
            '&:hover': {
              backgroundColor: 'error.dark',
            },
            '&:disabled': {
              backgroundColor: 'error.light',
              opacity: 0.6,
            },
          }}
        >
          {isLoading ? 'Deleting Account...' : 'Delete Account'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DeleteAccountDialog;
