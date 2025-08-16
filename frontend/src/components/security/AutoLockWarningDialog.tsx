import { Close, LockOutlined, ReportProblemOutlined, TimerOutlined } from '@mui/icons-material';
import {
  Box,
  Dialog,
  DialogContent,
  Fade,
  Grow,
  IconButton,
  LinearProgress,
  Typography,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import React, { useEffect, useState } from 'react';

interface AutoLockWarningDialogProps {
  open: boolean;
  countdown: number;
  onClose?: () => void;
}

const AutoLockWarningDialog: React.FC<AutoLockWarningDialogProps> = ({
  open,
  countdown,
  onClose,
}) => {
  const theme = useTheme();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (open) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  }, [open]);

  const getUrgencyLevel = () => {
    if (countdown <= 120) return 'critical';
    if (countdown <= 300) return 'high';
    return 'medium';
  };

  const urgencyLevel = getUrgencyLevel();
  const urgencyColor =
    urgencyLevel === 'critical'
      ? 'error.main'
      : urgencyLevel === 'high'
      ? 'warning.main'
      : 'info.main';

  return (
    <Dialog
      open={open}
      maxWidth="sm"
      fullWidth
      onClose={onClose}
      PaperProps={{
        sx: {
          borderRadius: 3,
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
          border: '3px solid',
          borderColor: 'error.main',
          background:
            theme.palette.mode === 'dark'
              ? 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)'
              : 'linear-gradient(135deg, #fff 0%, #f8f9fa 100%)',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '4px',
            background: `linear-gradient(90deg, ${urgencyColor} 0%, ${urgencyColor} 100%)`,
          },
        },
      }}
    >
      <DialogContent sx={{ p: 4, textAlign: 'center', position: 'relative' }}>
        {/* Close Button */}
        <IconButton
          onClick={onClose}
          sx={{
            position: 'absolute',
            top: 16,
            right: 16,
            color: 'error.main',
            '&:hover': {
              backgroundColor: 'rgba(255, 0, 0, 0.1)',
            },
          }}
        >
          <Close />
        </IconButton>

        {/* Header */}
        <Box sx={{ mb: 3 }}>
          {/* Lock Icon */}
          <Grow in={isVisible} timeout={800}>
            <LockOutlined
              sx={{
                fontSize: 72,
                color: 'error.main',
                mb: 2,
                filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.2))',
              }}
            />
          </Grow>

          <Fade in={isVisible} timeout={1000}>
            <Typography
              variant="h4"
              gutterBottom
              fontWeight={700}
              sx={{ color: 'error.main', mb: 1 }}
            >
              Session Timeout Warning
            </Typography>
          </Fade>

          <Fade in={isVisible} timeout={1200}>
            <Typography
              variant="body1"
              color="text.secondary"
              sx={{ mb: 3, maxWidth: 400, mx: 'auto' }}
            >
              Your session will expire due to inactivity. Any activity will extend your session.
            </Typography>
          </Fade>

          {/* Enhanced Countdown Timer */}
          <Grow in={isVisible} timeout={1400}>
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 1,
                mb: 4,
                p: 3,
                borderRadius: 2,
                background:
                  theme.palette.mode === 'dark' ? 'rgba(255, 0, 0, 0.15)' : 'rgba(255, 0, 0, 0.05)',
                border: '2px solid',
                borderColor: 'error.main',
                position: 'relative',
                overflow: 'hidden',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: `linear-gradient(45deg, transparent 30%, rgba(255,0,0,0.1) 50%, transparent 70%)`,
                  animation: 'shimmer 2s infinite',
                },
                '@keyframes shimmer': {
                  '0%': { transform: 'translateX(-100%)' },
                  '100%': { transform: 'translateX(100%)' },
                },
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <TimerOutlined sx={{ color: 'error.main', fontSize: 24 }} />
                <Typography
                  variant="h3"
                  color="error.main"
                  fontWeight={800}
                  sx={{ fontFamily: 'monospace' }}
                >
                  {Math.floor(countdown / 60)}:{(countdown % 60).toString().padStart(2, '0')}
                </Typography>
              </Box>
              <Typography
                variant="body2"
                color="error.main"
                fontWeight={600}
                sx={{ textTransform: 'uppercase', letterSpacing: 1 }}
              >
                {urgencyLevel === 'critical'
                  ? 'CRITICAL - ACT NOW!'
                  : urgencyLevel === 'high'
                  ? 'HIGH URGENCY'
                  : 'MEDIUM URGENCY'}
              </Typography>
            </Box>
          </Grow>

          {/* Enhanced Progress Bar */}
          <Fade in={isVisible} timeout={1600}>
            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="caption" color="text.primary">
                  Session Time
                </Typography>
                <Typography variant="caption" color="text.primary">
                  {Math.round((countdown / 600) * 100)}% Remaining
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={(countdown / 600) * 100}
                sx={{
                  height: 12,
                  borderRadius: 6,
                  backgroundColor:
                    theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: 'error.main',
                    borderRadius: 6,
                    transition: 'all 0.3s ease',
                    boxShadow: '0 0 10px #d32f2f',
                  },
                }}
              />
            </Box>
          </Fade>
        </Box>

        {/* Enhanced Footer */}
        <Fade in={isVisible} timeout={1800}>
          <Box
            sx={{
              p: 2,
              borderRadius: 2,
              background:
                theme.palette.mode === 'dark' ? 'rgba(255, 0, 0, 0.15)' : 'rgba(255, 0, 0, 0.05)',
              border: '1px solid',
              borderColor: 'error.light',
            }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 1,
                mb: 1,
              }}
            >
              <ReportProblemOutlined sx={{ color: 'error.main', fontSize: 20 }} />
              <Typography variant="body2" color="error.main" fontWeight={600}>
                IMMEDIATE ACTION REQUIRED
              </Typography>
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
              Move your mouse, type, or click anywhere to extend your session
            </Typography>
          </Box>
        </Fade>
      </DialogContent>
    </Dialog>
  );
};

export default AutoLockWarningDialog;
