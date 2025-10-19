import { CloseOutlined } from '@mui/icons-material';
import { Box, Dialog, DialogContent, IconButton, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import React, { useEffect } from 'react';

// Type declaration for Google AdSense
declare global {
  interface Window {
    adsbygoogle: any[];
  }
}

interface AdSensePopupProps {
  open: boolean;
  onClose: () => void;
  adClient?: string; // Your AdSense publisher ID (e.g., 'ca-pub-1234567890123456')
  adSlot?: string; // Your ad unit ID
}

const AdSensePopup: React.FC<AdSensePopupProps> = ({
  open,
  onClose,
  adClient = 'ca-pub-7776520245096503', // Your actual publisher ID
  adSlot = '0000000000', // Replace with your actual ad slot ID
}) => {
  const theme = useTheme();

  useEffect(() => {
    if (open) {
      try {
        // Push ad to AdSense queue when popup opens
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch (error) {
        console.error('[AdSensePopup] Error loading ad:', error);
      }
    }
  }, [open]);

  const handleRemindLater = () => {
    // Set a flag to remind later (30 minutes)
    localStorage.setItem('adsense_remind_later', Date.now().toString());
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          backgroundColor: theme.palette.background.paper,
          borderRadius: 3,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
          overflow: 'hidden',
          position: 'relative',
        },
      }}
    >
      {/* Close Button */}
      <IconButton
        onClick={onClose}
        sx={{
          position: 'absolute',
          top: 8,
          right: 8,
          zIndex: 1,
          color: theme.palette.text.secondary,
          backgroundColor: theme.palette.background.default,
          '&:hover': {
            backgroundColor: theme.palette.action.hover,
          },
        }}
      >
        <CloseOutlined />
      </IconButton>

      <DialogContent
        sx={{
          pt: 4,
          pb: 3,
          px: 3,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          minHeight: 300,
        }}
      >
        {/* Small header text */}
        <Typography
          variant="caption"
          sx={{
            color: theme.palette.text.secondary,
            mb: 2,
            fontSize: '0.75rem',
          }}
        >
          Advertisement
        </Typography>

        {/* AdSense Ad Container */}
        <Box
          sx={{
            width: '100%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: 250,
          }}
        >
          <ins
            className="adsbygoogle"
            style={{
              display: 'block',
              minHeight: '250px',
              width: '100%',
            }}
            data-ad-client={adClient}
            data-ad-slot={adSlot}
            data-ad-format="auto"
            data-full-width-responsive="true"
          />
        </Box>

        {/* Remind Later Link */}
        <Typography
          variant="caption"
          onClick={handleRemindLater}
          sx={{
            color: theme.palette.text.secondary,
            mt: 2,
            cursor: 'pointer',
            textDecoration: 'underline',
            '&:hover': {
              color: theme.palette.text.primary,
            },
          }}
        >
          Remind me later
        </Typography>

        {/* Support Message */}
        <Typography
          variant="caption"
          sx={{
            color: theme.palette.text.disabled,
            mt: 1,
            fontSize: '0.7rem',
            textAlign: 'center',
          }}
        >
          Ads help us keep AssignmentAI free
        </Typography>
      </DialogContent>
    </Dialog>
  );
};

export default AdSensePopup;
