import {
  AutoFixHighOutlined,
  SchoolOutlined,
  Speed,
  Spellcheck,
  TextSnippetOutlined,
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

interface SorryToSeeYouGoPopupProps {
  open: boolean;
  onClose: () => void;
}

const SorryToSeeYouGoPopup: React.FC<SorryToSeeYouGoPopupProps> = ({ open, onClose }) => {
  const theme = useTheme();
  const blueColor = '#2196f3'; // Always use blue for the sorry popup

  const freeFeatures = [
    {
      name: 'Basic Assignment Analysis',
      icon: <SchoolOutlined sx={{ color: blueColor, fontSize: 24 }} />,
      description: 'Get basic feedback on your assignments',
    },
    {
      name: 'Grammar & Spelling Check',
      icon: <Spellcheck sx={{ color: blueColor, fontSize: 24 }} />,
      description: 'Check for common grammar and spelling errors',
    },
    {
      name: 'Basic Writing Suggestions',
      icon: <AutoFixHighOutlined sx={{ color: blueColor, fontSize: 24 }} />,
      description: 'Receive basic suggestions to improve your writing',
    },
    {
      name: 'Standard Response Time',
      icon: <Speed sx={{ color: blueColor, fontSize: 24 }} />,
      description: 'Get responses within standard timeframes',
    },
    {
      name: '30,000 Tokens/Month',
      icon: <TextSnippetOutlined sx={{ color: blueColor, fontSize: 24 }} />,
      description: 'Access to basic AI features with monthly token allocation',
    },
  ];

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          backgroundColor: theme.palette.background.paper,
          border: `3px solid ${blueColor}`,
          borderRadius: 4,
          boxShadow: `0 0 30px ${blueColor}40, 0 8px 32px rgba(0, 0, 0, 0.3)`,
          overflow: 'hidden',
          position: 'relative',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '4px',
            background: `linear-gradient(90deg, ${blueColor}, ${blueColor}dd, ${blueColor})`,
            animation: 'shimmer 2s ease-in-out infinite',
          },
          '@keyframes shimmer': {
            '0%': { opacity: 0.7 },
            '50%': { opacity: 1 },
            '100%': { opacity: 0.7 },
          },
          '@keyframes pulse': {
            '0%': { transform: 'scale(1)', filter: 'drop-shadow(0 0 8px rgba(33, 150, 243, 0.6))' },
            '50%': {
              transform: 'scale(1.05)',
              filter: 'drop-shadow(0 0 12px rgba(33, 150, 243, 0.8))',
            },
            '100%': {
              transform: 'scale(1)',
              filter: 'drop-shadow(0 0 8px rgba(33, 150, 243, 0.6))',
            },
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
          <Typography
            sx={{
              background: `linear-gradient(135deg, ${blueColor}, ${blueColor}dd)`,
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontWeight: 800,
              fontSize: '1.8rem',
            }}
          >
            Sorry to see you go!
          </Typography>
        </Box>

        {/* Info Box */}
        <Box
          sx={{
            textAlign: 'center',
            mb: 4,
            p: 3,
            borderRadius: 3,
            background: `linear-gradient(135deg, ${theme.palette.background.default} 0%, ${theme.palette.background.paper} 100%)`,
            border: `1px solid ${blueColor}30`,
            position: 'relative',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '2px',
              background: `linear-gradient(90deg, transparent, ${blueColor}, transparent)`,
            },
          }}
        >
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
            We're sad to see you leave, but we understand that circumstances change.
          </Typography>

          <Typography
            variant="h6"
            sx={{
              color: blueColor,
              mb: 2,
              textAlign: 'center',
              fontWeight: 'bold',
              fontSize: '1.3rem',
            }}
          >
            You've been successfully reverted to our Free plan
          </Typography>

          <Typography
            variant="body2"
            sx={{
              color: theme.palette.text.secondary,
              textAlign: 'center',
              fontSize: '1rem',
            }}
          >
            Which still gives you access to these features:
          </Typography>
        </Box>

        {/* Feature Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {freeFeatures.map((feature, index) => (
            <Grid item xs={12} sm={6} key={index}>
              <Card
                sx={{
                  backgroundColor: theme.palette.background.default,
                  border: `2px solid ${blueColor}40`,
                  borderRadius: 3,
                  boxShadow: `0 4px 20px ${blueColor}20, 0 2px 8px rgba(0, 0, 0, 0.1)`,
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
                    background: `linear-gradient(90deg, ${blueColor}, ${blueColor}dd)`,
                    transform: 'scaleX(0)',
                    transition: 'transform 0.4s ease',
                  },
                  '&:hover': {
                    boxShadow: `0 8px 32px ${blueColor}40, 0 4px 16px rgba(0, 0, 0, 0.15)`,
                    transform: 'translateY(-4px)',
                    borderColor: `${blueColor}80`,
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
                      background: `linear-gradient(135deg, ${blueColor}20, ${blueColor}10)`,
                      border: `2px solid ${blueColor}30`,
                    }}
                  >
                    {feature.icon}
                  </Box>
                  <Typography
                    variant="subtitle1"
                    sx={{
                      color: blueColor,
                      fontWeight: 'bold',
                      mb: 1.5,
                      fontSize: '1rem',
                      textShadow: `0 0 20px ${blueColor}30`,
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
            background: `linear-gradient(135deg, ${blueColor}10, ${blueColor}05)`,
            border: `1px solid ${blueColor}20`,
            position: 'relative',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '100%',
              height: '100%',
              background: `radial-gradient(circle, ${blueColor}10 0%, transparent 70%)`,
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
            You can always upgrade again anytime when you're ready to unlock more features!
          </Typography>
        </Box>

        {/* Button */}
        <Box sx={{ textAlign: 'center' }}>
          <Button
            onClick={onClose}
            variant="contained"
            sx={{
              minWidth: 160,
              py: 2,
              px: 4,
              fontWeight: 'bold',
              fontSize: '1.1rem',
              borderRadius: 3,
              background: `linear-gradient(135deg, ${blueColor} 0%, ${blueColor}dd 100%)`,
              boxShadow: `0 6px 20px ${blueColor}40, 0 4px 12px rgba(0, 0, 0, 0.15)`,
              border: `2px solid ${blueColor}80`,
              textTransform: 'none',
              letterSpacing: '0.5px',
              '&:hover': {
                background: `linear-gradient(135deg, ${blueColor}dd 0%, ${blueColor}bb 100%)`,
                boxShadow: `0 8px 25px ${blueColor}60, 0 6px 16px rgba(0, 0, 0, 0.2)`,
                transform: 'translateY(-2px)',
                borderColor: `${blueColor}`,
              },
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          >
            Got it
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default SorryToSeeYouGoPopup;
