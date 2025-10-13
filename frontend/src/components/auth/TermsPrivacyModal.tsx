import { SecurityOutlined } from '@mui/icons-material';
import {
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Link,
  Typography,
} from '@mui/material';
import React, { ChangeEvent, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';

interface TermsPrivacyModalProps {
  open: boolean;
  onAccept: () => void;
  onDecline: () => void;
}

const TermsPrivacyModal: React.FC<TermsPrivacyModalProps> = ({ open, onAccept, onDecline }) => {
  const [termsChecked, setTermsChecked] = useState(false);
  const [privacyChecked, setPrivacyChecked] = useState(false);

  const handleAccept = () => {
    if (termsChecked && privacyChecked) {
      onAccept();
    }
  };

  return (
    <Dialog
      open={open}
      maxWidth="sm"
      fullWidth
      sx={{
        '& .MuiDialog-paper': {
          borderRadius: 3,
          padding: 2,
          border: '2.5px solid #D32F2F',
        },
      }}
    >
      <DialogTitle sx={{ textAlign: 'center', pb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
          <SecurityOutlined sx={{ fontSize: '1.8rem', color: '#D32F2F' }} />
          <Typography
            variant="h5"
            sx={{
              fontWeight: 600,
              color: '#D32F2F',
              fontFamily: "'Inter', sans-serif",
            }}
          >
            Terms & Privacy Agreement
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ pb: 3 }}>
        <Typography
          variant="body1"
          sx={{
            color: '#333333',
            fontFamily: "'Inter', sans-serif",
            fontSize: '1rem',
            lineHeight: 1.6,
            textAlign: 'center',
            mb: 2,
          }}
        >
          By registering with AssignmentAI, you acknowledge that you have read, understood, and
          agree to be bound by our:
        </Typography>

        <Box sx={{ mb: 3 }}>
          <FormControlLabel
            control={
              <Checkbox
                checked={termsChecked}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setTermsChecked(e.target.checked)}
                sx={{
                  color: '#D32F2F',
                  '&.Mui-checked': {
                    color: '#D32F2F',
                  },
                }}
              />
            }
            label={
              <Link
                component={RouterLink}
                to="/terms"
                target="_blank"
                sx={{
                  color: '#D32F2F',
                  textDecoration: 'underline',
                  fontWeight: 500,
                  fontSize: '1rem',
                  fontFamily: "'Inter', sans-serif",
                  '&:hover': {
                    color: '#B71C1C',
                  },
                }}
              >
                Terms of Service
              </Link>
            }
            sx={{ display: 'block', mb: 2, justifyContent: 'center' }}
          />

          <FormControlLabel
            control={
              <Checkbox
                checked={privacyChecked}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setPrivacyChecked(e.target.checked)}
                sx={{
                  color: '#D32F2F',
                  '&.Mui-checked': {
                    color: '#D32F2F',
                  },
                }}
              />
            }
            label={
              <Link
                component={RouterLink}
                to="/privacy"
                target="_blank"
                sx={{
                  color: '#D32F2F',
                  textDecoration: 'underline',
                  fontWeight: 500,
                  fontSize: '1rem',
                  fontFamily: "'Inter', sans-serif",
                  '&:hover': {
                    color: '#B71C1C',
                  },
                }}
              >
                Privacy Policy
              </Link>
            }
            sx={{ display: 'block', justifyContent: 'center' }}
          />
        </Box>

        <Typography
          variant="body2"
          sx={{
            color: '#666666',
            fontFamily: "'Inter', sans-serif",
            fontSize: '0.9rem',
            lineHeight: 1.5,
            textAlign: 'center',
            fontStyle: 'italic',
          }}
        >
          Please review these documents carefully before proceeding with your registration.
        </Typography>
      </DialogContent>

      <DialogActions sx={{ justifyContent: 'center', gap: 2, px: 3, pb: 3 }}>
        <Button
          onClick={onDecline}
          variant="outlined"
          sx={{
            fontFamily: "'Inter', sans-serif",
            fontWeight: 500,
            borderColor: '#D32F2F',
            color: '#D32F2F',
            px: 4,
            py: 1,
            '&:hover': {
              borderColor: '#B71C1C',
              color: '#B71C1C',
              backgroundColor: 'rgba(211, 47, 47, 0.04)',
            },
          }}
        >
          Decline
        </Button>
        <Button
          onClick={handleAccept}
          variant="contained"
          disabled={!termsChecked || !privacyChecked}
          sx={{
            fontFamily: "'Inter', sans-serif",
            fontWeight: 500,
            backgroundColor: '#D32F2F',
            px: 4,
            py: 1,
            '&:hover': {
              backgroundColor: '#B71C1C',
            },
            '&:disabled': {
              backgroundColor: '#e0e0e0',
              color: '#666666',
            },
          }}
        >
          Accept & Continue
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TermsPrivacyModal;
