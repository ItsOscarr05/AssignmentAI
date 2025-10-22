import {
  AutoAwesomeOutlined,
  CloseOutlined,
  RocketLaunchOutlined,
  SpeedOutlined,
  StarOutlined,
  TrendingUpOutlined,
} from '@mui/icons-material';
import {
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogContent,
  Grid,
  IconButton,
  Typography,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import React from 'react';
import { useNavigate } from 'react-router-dom';

interface AdPopupProps {
  open: boolean;
  onClose: () => void;
}

const AdPopup: React.FC<AdPopupProps> = ({ open, onClose }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const redColor = theme.palette.mode === 'dark' ? '#d32f2f' : '#d32f2f';

  const upgradeFeatures = [
    {
      name: 'Higher Token Limits',
      icon: <TrendingUpOutlined sx={{ color: redColor, fontSize: 28 }} />,
      description: 'Get up to 1M tokens/month',
      highlight: '10x more',
    },
    {
      name: 'Premium AI Models',
      icon: <AutoAwesomeOutlined sx={{ color: redColor, fontSize: 28 }} />,
      description: 'Access GPT-4, Claude, and more',
      highlight: 'Best quality',
    },
    {
      name: 'Priority Processing',
      icon: <SpeedOutlined sx={{ color: redColor, fontSize: 28 }} />,
      description: 'Lightning-fast responses',
      highlight: '3x faster',
    },
    {
      name: 'Advanced Features',
      icon: <RocketLaunchOutlined sx={{ color: redColor, fontSize: 28 }} />,
      description: 'File analysis, links, and more',
      highlight: 'Pro tools',
    },
  ];

  const handleUpgradeClick = () => {
    onClose();
    navigate('/price-plan');
  };

  const handleRemindLater = () => {
    // Set a flag to remind later (for upgrade popups)
    localStorage.setItem('ad_remind_later', Date.now().toString());
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
          border: `3px solid ${redColor}`,
          borderRadius: 4,
          boxShadow: `0 0 40px ${redColor}50, 0 8px 32px rgba(0, 0, 0, 0.3)`,
          overflow: 'hidden',
          position: 'relative',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '4px',
            background: `linear-gradient(90deg, ${redColor}, ${redColor}dd, ${redColor})`,
            animation: 'shimmer 2s ease-in-out infinite',
          },
          '@keyframes shimmer': {
            '0%': { opacity: 0.7 },
            '50%': { opacity: 1 },
            '100%': { opacity: 0.7 },
          },
        },
      }}
    >
      {/* Close Button */}
      <IconButton
        onClick={onClose}
        sx={{
          position: 'absolute',
          top: 12,
          right: 12,
          zIndex: 1,
          color: theme.palette.text.secondary,
          '&:hover': {
            color: redColor,
            backgroundColor: `${redColor}10`,
          },
        }}
      >
        <CloseOutlined />
      </IconButton>

      <DialogContent
        sx={{
          pt: 5,
          pb: 4,
          backgroundColor: theme.palette.background.paper,
          px: 4,
          position: 'relative',
        }}
      >
        {/* Title Section */}
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Box
            sx={{
              mb: 2,
              display: 'inline-flex',
              p: 2,
              borderRadius: '50%',
              background: `linear-gradient(135deg, ${redColor}20, ${redColor}10)`,
            }}
          >
            <StarOutlined sx={{ fontSize: 48, color: redColor }} />
          </Box>
          <Typography
            sx={{
              background: `linear-gradient(135deg, ${redColor}, ${redColor}dd)`,
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontWeight: 800,
              fontSize: '2rem',
              mb: 1,
            }}
          >
            Unlock Your Full Potential
          </Typography>
          <Typography
            variant="body1"
            sx={{
              color: theme.palette.text.secondary,
              fontSize: '1.1rem',
              lineHeight: 1.6,
            }}
          >
            Upgrade to Plus, Pro, or Max and supercharge your productivity!
          </Typography>
        </Box>

        {/* Upgrade Features */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {upgradeFeatures.map((feature, index) => (
            <Grid item xs={6} key={index}>
              <Card
                sx={{
                  backgroundColor: theme.palette.background.default,
                  border: `2px solid ${redColor}30`,
                  borderRadius: 3,
                  boxShadow: `0 4px 16px ${redColor}15`,
                  transition: 'all 0.3s ease',
                  position: 'relative',
                  overflow: 'hidden',
                  height: '100%',
                  '&:hover': {
                    boxShadow: `0 6px 24px ${redColor}30`,
                    transform: 'translateY(-4px)',
                    borderColor: `${redColor}60`,
                  },
                }}
              >
                <CardContent sx={{ p: 2.5, textAlign: 'center' }}>
                  {/* Highlight Badge */}
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      background: `linear-gradient(135deg, ${redColor}, ${redColor}dd)`,
                      color: 'white',
                      px: 1,
                      py: 0.3,
                      borderRadius: 1,
                      fontSize: '0.7rem',
                      fontWeight: 'bold',
                      textTransform: 'uppercase',
                    }}
                  >
                    {feature.highlight}
                  </Box>

                  <Box
                    sx={{
                      mb: 1.5,
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      width: '48px',
                      height: '48px',
                      mx: 'auto',
                      borderRadius: '50%',
                      background: `linear-gradient(135deg, ${redColor}15, ${redColor}08)`,
                      border: `2px solid ${redColor}30`,
                    }}
                  >
                    {feature.icon}
                  </Box>
                  <Typography
                    variant="subtitle2"
                    sx={{
                      color: redColor,
                      fontWeight: 'bold',
                      mb: 0.8,
                      fontSize: '0.95rem',
                    }}
                  >
                    {feature.name}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      color: theme.palette.text.secondary,
                      fontSize: '0.85rem',
                      lineHeight: 1.4,
                    }}
                  >
                    {feature.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Pricing Highlight */}
        <Box
          sx={{
            textAlign: 'center',
            mb: 3,
            p: 2.5,
            borderRadius: 3,
            background: `linear-gradient(135deg, ${redColor}10, ${redColor}05)`,
            border: `1px solid ${redColor}30`,
          }}
        >
          <Typography
            variant="h6"
            sx={{
              color: redColor,
              fontWeight: 'bold',
              mb: 1,
              fontSize: '1.2rem',
            }}
          >
            Starting at just $5.99/month
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: theme.palette.text.secondary,
              fontSize: '0.95rem',
            }}
          >
            Choose the plan that fits your needs • Cancel anytime
          </Typography>
        </Box>

        {/* Buttons */}
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Button
            onClick={handleRemindLater}
            variant="outlined"
            sx={{
              minWidth: 140,
              py: 1.5,
              px: 3,
              fontWeight: 'bold',
              fontSize: '0.95rem',
              borderRadius: 3,
              borderColor: theme.palette.divider,
              color: theme.palette.text.secondary,
              textTransform: 'none',
              '&:hover': {
                borderColor: theme.palette.text.secondary,
                backgroundColor: theme.palette.action.hover,
              },
            }}
          >
            Remind Me Later
          </Button>
          <Button
            onClick={handleUpgradeClick}
            variant="contained"
            sx={{
              minWidth: 160,
              py: 1.5,
              px: 3,
              fontWeight: 'bold',
              fontSize: '1rem',
              borderRadius: 3,
              background: `linear-gradient(135deg, ${redColor} 0%, ${redColor}dd 100%)`,
              boxShadow: `0 6px 20px ${redColor}40`,
              textTransform: 'none',
              '&:hover': {
                background: `linear-gradient(135deg, ${redColor}dd 0%, ${redColor}bb 100%)`,
                boxShadow: `0 8px 28px ${redColor}60`,
                transform: 'translateY(-2px)',
              },
              transition: 'all 0.3s ease',
            }}
          >
            View Plans
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default AdPopup;
