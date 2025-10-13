import {
  AutoFixHighOutlined,
  BlockOutlined,
  SchoolOutlined,
  Speed,
  Spellcheck,
  TextSnippetOutlined,
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
  Typography,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import React from 'react';
import { useNavigate } from 'react-router-dom';

interface TokenLimitExceededPopupProps {
  open: boolean;
  onClose: () => void;
  currentUsage?: number;
  limit?: number;
}

const TokenLimitExceededPopup: React.FC<TokenLimitExceededPopupProps> = ({ 
  open, 
  onClose, 
  currentUsage = 101651, 
  limit = 100000 
}) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const redColor = '#f44336'; // Use red for token limit exceeded

  const upgradeFeatures = [
    {
      name: 'Higher Token Limits',
      icon: <TrendingUpOutlined sx={{ color: redColor, fontSize: 24 }} />,
      description: 'Get 200K+ tokens per month with paid plans',
    },
    {
      name: 'Advanced AI Analysis',
      icon: <AutoFixHighOutlined sx={{ color: redColor, fontSize: 24 }} />,
      description: 'Access to premium AI models and features',
    },
    {
      name: 'Priority Processing',
      icon: <Speed sx={{ color: redColor, fontSize: 24 }} />,
      description: 'Faster response times for all AI operations',
    },
    {
      name: 'Enhanced File Processing',
      icon: <TextSnippetOutlined sx={{ color: redColor, fontSize: 24 }} />,
      description: 'Process larger files and more complex documents',
    },
    {
      name: 'Advanced Grammar Check',
      icon: <Spellcheck sx={{ color: redColor, fontSize: 24 }} />,
      description: 'Professional-grade writing assistance',
    },
    {
      name: 'Educational Tools',
      icon: <SchoolOutlined sx={{ color: redColor, fontSize: 24 }} />,
      description: 'Specialized features for students and educators',
    },
  ];

  const handleUpgradeClick = () => {
    onClose();
    navigate('/price-plan');
  };

  const overage = currentUsage - limit;
  const percentOver = Math.round((overage / limit) * 100);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          backgroundColor: theme.palette.background.paper,
          border: `3px solid ${redColor}`,
          borderRadius: 4,
          boxShadow: `0 0 30px ${redColor}40, 0 8px 32px rgba(0, 0, 0, 0.3)`,
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
      <DialogContent
        sx={{
          pt: 6,
          pb: 6,
          backgroundColor: theme.palette.background.paper,
          px: 4,
          position: 'relative',
        }}
      >
        {/* Title Section */}
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Box sx={{ mb: 2 }}>
            <BlockOutlined sx={{ fontSize: 48, color: redColor, mb: 1 }} />
          </Box>
          <Typography
            sx={{
              background: `linear-gradient(135deg, ${redColor}, ${redColor}dd)`,
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontWeight: 800,
              fontSize: '1.8rem',
            }}
          >
            Token Limit Hit! (Sorry)
          </Typography>
        </Box>

        {/* Usage Info Box */}
        <Box
          sx={{
            textAlign: 'center',
            mb: 4,
            p: 3,
            borderRadius: 3,
            background: `linear-gradient(135deg, ${theme.palette.background.default} 0%, ${theme.palette.background.paper} 100%)`,
            border: `1px solid ${redColor}30`,
            position: 'relative',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '2px',
              background: `linear-gradient(90deg, transparent, ${redColor}, transparent)`,
            },
          }}
        >
          <Typography
            variant="h6"
            sx={{
              color: redColor,
              mb: 2,
              textAlign: 'center',
              fontWeight: 'bold',
              fontSize: '1.3rem',
            }}
          >
            You've used {currentUsage.toLocaleString()} tokens this month
          </Typography>

          <Typography
            variant="body1"
            sx={{
              mb: 2,
              textAlign: 'center',
              color: theme.palette.text.primary,
              fontSize: '1.1rem',
              lineHeight: 1.6,
            }}
          >
            Your monthly limit is {limit.toLocaleString()} tokens, but you've exceeded it by{' '}
            <strong style={{ color: redColor }}>{overage.toLocaleString()} tokens ({percentOver}% over)</strong>.
          </Typography>

          <Typography
            variant="body2"
            sx={{
              color: theme.palette.text.secondary,
              textAlign: 'center',
              fontSize: '1rem',
            }}
          >
            AI features are temporarily disabled until next month or when you upgrade your plan.
          </Typography>
        </Box>

        {/* Upgrade Features */}
        <Typography
          variant="h6"
          sx={{
            color: redColor,
            mb: 3,
            textAlign: 'center',
            fontWeight: 'bold',
            fontSize: '1.2rem',
          }}
        >
          Upgrade to unlock these premium features:
        </Typography>

        <Grid container spacing={3} sx={{ mb: 4 }}>
          {upgradeFeatures.map((feature, index) => (
            <Grid item xs={12} sm={6} key={index}>
              <Card
                sx={{
                  backgroundColor: theme.palette.background.default,
                  border: `2px solid ${redColor}40`,
                  borderRadius: 3,
                  boxShadow: `0 4px 20px ${redColor}20, 0 2px 8px rgba(0, 0, 0, 0.1)`,
                  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                  position: 'relative',
                  overflow: 'hidden',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '3px',
                    background: `linear-gradient(90deg, ${redColor}, ${redColor}dd)`,
                    transform: 'scaleX(0)',
                    transition: 'transform 0.4s ease',
                  },
                  '&:hover': {
                    boxShadow: `0 8px 32px ${redColor}40, 0 4px 16px rgba(0, 0, 0, 0.15)`,
                    transform: 'translateY(-4px)',
                    borderColor: `${redColor}80`,
                    '&::before': {
                      transform: 'scaleX(1)',
                    },
                  },
                }}
              >
                <CardContent sx={{ p: 3, textAlign: 'center', position: 'relative' }}>
                  <Box
                    sx={{
                      mb: 2,
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      width: '60px',
                      height: '60px',
                      mx: 'auto',
                      borderRadius: '50%',
                      background: `linear-gradient(135deg, ${redColor}20, ${redColor}10)`,
                      border: `2px solid ${redColor}30`,
                    }}
                  >
                    {feature.icon}
                  </Box>
                  <Typography
                    variant="subtitle1"
                    sx={{
                      color: redColor,
                      fontWeight: 'bold',
                      mb: 1.5,
                      fontSize: '1rem',
                      textShadow: `0 0 20px ${redColor}30`,
                    }}
                  >
                    {feature.name}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      color: theme.palette.text.secondary,
                      fontSize: '0.9rem',
                      lineHeight: 1.5,
                      opacity: 0.9,
                    }}
                  >
                    {feature.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Final Message */}
        <Box
          sx={{
            textAlign: 'center',
            mb: 4,
            p: 3,
            borderRadius: 3,
            background: `linear-gradient(135deg, ${redColor}10, ${redColor}05)`,
            border: `1px solid ${redColor}20`,
            position: 'relative',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '100%',
              height: '100%',
              background: `radial-gradient(circle, ${redColor}10 0%, transparent 70%)`,
              opacity: 0.5,
            },
          }}
        >
          <Typography
            variant="body2"
            sx={{
              textAlign: 'center',
              color: theme.palette.text.secondary,
              fontStyle: 'italic',
              fontSize: '1rem',
              lineHeight: 1.6,
              position: 'relative',
              zIndex: 1,
            }}
          >
            Don't worry! Your token usage will reset next month, or you can upgrade now to continue using AI features immediately.
          </Typography>
        </Box>

        {/* Buttons */}
        <Box sx={{ textAlign: 'center', display: 'flex', gap: 2, justifyContent: 'center' }}>
          <Button
            onClick={onClose}
            variant="outlined"
            sx={{
              minWidth: 120,
              py: 2,
              px: 4,
              fontWeight: 'bold',
              fontSize: '1rem',
              borderRadius: 3,
              borderColor: redColor,
              color: redColor,
              textTransform: 'none',
              letterSpacing: '0.5px',
              '&:hover': {
                borderColor: redColor,
                backgroundColor: `${redColor}10`,
                transform: 'translateY(-2px)',
              },
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          >
            Maybe Later
          </Button>
          <Button
            onClick={handleUpgradeClick}
            variant="contained"
            sx={{
              minWidth: 160,
              py: 2,
              px: 4,
              fontWeight: 'bold',
              fontSize: '1.1rem',
              borderRadius: 3,
              background: `linear-gradient(135deg, ${redColor} 0%, ${redColor}dd 100%)`,
              boxShadow: `0 6px 20px ${redColor}40, 0 4px 12px rgba(0, 0, 0, 0.15)`,
              border: `2px solid ${redColor}80`,
              textTransform: 'none',
              letterSpacing: '0.5px',
              '&:hover': {
                background: `linear-gradient(135deg, ${redColor}dd 0%, ${redColor}bb 100%)`,
                boxShadow: `0 8px 25px ${redColor}60, 0 6px 16px rgba(0, 0, 0, 0.2)`,
                transform: 'translateY(-2px)',
                borderColor: `${redColor}`,
              },
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          >
            Upgrade Now
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default TokenLimitExceededPopup;
