import {
  AccessTimeOutlined,
  AllInclusive,
  AutoFixHighOutlined,
  BarChartOutlined,
  BlockOutlined,
  Close as CloseIcon,
  DesignServicesOutlined,
  Diamond,
  EmojiEvents,
  FlagOutlined,
  FormatQuoteOutlined,
  GppGoodOutlined,
  LibraryBooksOutlined,
  LocalOffer,
  MilitaryTechOutlined,
  PaletteOutlined,
  SchoolOutlined,
  Search,
  Speed,
  Spellcheck,
  Star,
} from '@mui/icons-material';
import { Box, Button, Dialog, DialogContent, Grid, IconButton, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import React from 'react';
import { useNavigate } from 'react-router-dom';

interface SuccessPopupProps {
  open: boolean;
  onClose: () => void;
  planName?: string;
}

const SuccessPopup: React.FC<SuccessPopupProps> = ({ open, onClose, planName = 'Pro' }) => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';

  // Get plan color based on plan name
  const getPlanColor = (plan: string) => {
    switch (plan.toLowerCase()) {
      case 'free':
        return '#2196f3';
      case 'plus':
        return '#4caf50';
      case 'pro':
        return '#9c27b0';
      case 'max':
        return '#ff9800';
      default:
        return '#9c27b0'; // Default to Pro color
    }
  };

  // Get plan icon based on plan name
  const getPlanIcon = (plan: string) => {
    switch (plan.toLowerCase()) {
      case 'free':
        return (
          <LocalOffer
            sx={{
              fontSize: 64,
              color: planColor,
            }}
          />
        );
      case 'plus':
        return (
          <Star
            sx={{
              fontSize: 64,
              color: planColor,
            }}
          />
        );
      case 'pro':
        return (
          <Diamond
            sx={{
              fontSize: 64,
              color: planColor,
            }}
          />
        );
      case 'max':
        return (
          <EmojiEvents
            sx={{
              fontSize: 64,
              color: planColor,
            }}
          />
        );
      default:
        return (
          <Diamond
            sx={{
              fontSize: 64,
              color: planColor,
            }}
          />
        ); // Default to Pro icon
    }
  };

  // Get plan-specific features
  const getPlanFeatures = (plan: string) => {
    switch (plan.toLowerCase()) {
      case 'free':
        return [
          {
            icon: (
              <SchoolOutlined
                sx={{
                  fontSize: 48,
                  color: planColor,
                  mb: 2,
                }}
              />
            ),
            title: 'Basic Assignment Analysis',
            description: 'Get basic feedback on your assignments with fundamental writing insights',
          },
          {
            icon: (
              <Spellcheck
                sx={{
                  fontSize: 48,
                  color: planColor,
                  mb: 2,
                }}
              />
            ),
            title: 'Grammar & Spelling Check',
            description: 'Check for common grammar and spelling errors in your writing',
          },
          {
            icon: (
              <AutoFixHighOutlined
                sx={{
                  fontSize: 48,
                  color: planColor,
                  mb: 2,
                }}
              />
            ),
            title: 'Basic Writing Suggestions',
            description: 'Receive basic suggestions to improve your writing structure',
          },
          {
            icon: (
              <Speed
                sx={{
                  fontSize: 48,
                  color: planColor,
                  mb: 2,
                }}
              />
            ),
            title: 'Standard Response Time',
            description: 'Get responses within standard timeframes for all your requests',
          },
          {
            icon: (
              <LibraryBooksOutlined
                sx={{
                  fontSize: 48,
                  color: planColor,
                  mb: 2,
                }}
              />
            ),
            title: 'Basic Templates',
            description: 'Access to basic writing templates for common assignment types',
          },
        ];
      case 'plus':
        return [
          {
            icon: (
              <AutoFixHighOutlined
                sx={{
                  fontSize: 48,
                  color: planColor,
                  mb: 2,
                }}
              />
            ),
            title: 'Advanced Writing Analysis',
            description: 'Deep analysis of writing structure, coherence, and argument strength',
          },
          {
            icon: (
              <PaletteOutlined
                sx={{
                  fontSize: 48,
                  color: planColor,
                  mb: 2,
                }}
              />
            ),
            title: 'Style & Tone Suggestions',
            description: 'Get suggestions to improve writing style and tone for better impact',
          },
          {
            icon: (
              <Speed
                sx={{
                  fontSize: 48,
                  color: planColor,
                  mb: 2,
                }}
              />
            ),
            title: 'Priority Response Time',
            description: 'Faster response times for your requests with priority processing',
          },
          {
            icon: (
              <LibraryBooksOutlined
                sx={{
                  fontSize: 48,
                  color: planColor,
                  mb: 2,
                }}
              />
            ),
            title: 'Extended Templates Library',
            description: 'Access to an expanded library of writing templates and formats',
          },
          {
            icon: (
              <BlockOutlined
                sx={{
                  fontSize: 48,
                  color: planColor,
                  mb: 2,
                }}
              />
            ),
            title: 'Ad-Free Experience',
            description:
              'Enjoy a clean, distraction-free writing environment without advertisements',
          },
        ];
      case 'pro':
        return [
          {
            icon: (
              <Search
                sx={{
                  fontSize: 48,
                  color: planColor,
                  mb: 2,
                }}
              />
            ),
            title: 'AI-Powered Research Assistance',
            description: 'AI helps you find and analyze research materials for your assignments',
          },
          {
            icon: (
              <FormatQuoteOutlined
                sx={{
                  fontSize: 48,
                  color: planColor,
                  mb: 2,
                }}
              />
            ),
            title: 'Citation & Reference Check',
            description: 'Automated checking of citations and references for academic integrity',
          },
          {
            icon: (
              <GppGoodOutlined
                sx={{
                  fontSize: 48,
                  color: planColor,
                  mb: 2,
                }}
              />
            ),
            title: 'Plagiarism Detection',
            description: 'Comprehensive plagiarism checking across multiple sources and databases',
          },
          {
            icon: (
              <AccessTimeOutlined
                sx={{
                  fontSize: 48,
                  color: planColor,
                  mb: 2,
                }}
              />
            ),
            title: '24/7 Priority Support',
            description: 'Round-the-clock priority customer support for all your needs',
          },
          {
            icon: (
              <AutoFixHighOutlined
                sx={{
                  fontSize: 48,
                  color: planColor,
                  mb: 2,
                }}
              />
            ),
            title: 'Advanced Writing Analysis',
            description: 'Deep analysis of writing structure, coherence, and argument strength',
          },
          {
            icon: (
              <PaletteOutlined
                sx={{
                  fontSize: 48,
                  color: planColor,
                  mb: 2,
                }}
              />
            ),
            title: 'Style & Tone Suggestions',
            description: 'Get suggestions to improve writing style and tone for better impact',
          },
          {
            icon: (
              <Speed
                sx={{
                  fontSize: 48,
                  color: planColor,
                  mb: 2,
                }}
              />
            ),
            title: 'Priority Response Time',
            description: 'Faster response times for your requests with priority processing',
          },
          {
            icon: (
              <LibraryBooksOutlined
                sx={{
                  fontSize: 48,
                  color: planColor,
                  mb: 2,
                }}
              />
            ),
            title: 'Extended Templates Library',
            description: 'Access to an expanded library of writing templates and formats',
          },
          {
            icon: (
              <BlockOutlined
                sx={{
                  fontSize: 48,
                  color: planColor,
                  mb: 2,
                }}
              />
            ),
            title: 'Ad-Free Experience',
            description:
              'Enjoy a clean, distraction-free writing environment without advertisements',
          },
        ];
      case 'max':
        return [
          {
            icon: (
              <AllInclusive
                sx={{
                  fontSize: 48,
                  color: planColor,
                  mb: 2,
                }}
              />
            ),
            title: 'Unlimited Assignment Analysis',
            description: 'No limits on the number of assignments you can analyze and improve',
          },
          {
            icon: (
              <BarChartOutlined
                sx={{
                  fontSize: 48,
                  color: planColor,
                  mb: 2,
                }}
              />
            ),
            title: 'Advanced Analytics Dashboard',
            description: 'Detailed analytics and insights about your usage and performance trends',
          },
          {
            icon: (
              <MilitaryTechOutlined
                sx={{
                  fontSize: 48,
                  color: planColor,
                  mb: 2,
                }}
              />
            ),
            title: 'Priority Customer Support',
            description: 'Faster response times and dedicated support channel for VIP users',
          },
          {
            icon: (
              <DesignServicesOutlined
                sx={{
                  fontSize: 48,
                  color: planColor,
                  mb: 2,
                }}
              />
            ),
            title: 'Custom Assignment Templates',
            description: 'Create and save custom templates for repeated use in your workflow',
          },
          {
            icon: (
              <Search
                sx={{
                  fontSize: 48,
                  color: planColor,
                  mb: 2,
                }}
              />
            ),
            title: 'AI-Powered Research Assistance',
            description: 'AI helps you find and analyze research materials for your assignments',
          },
          {
            icon: (
              <FormatQuoteOutlined
                sx={{
                  fontSize: 48,
                  color: planColor,
                  mb: 2,
                }}
              />
            ),
            title: 'Citation & Reference Check',
            description: 'Automated checking of citations and references for academic integrity',
          },
          {
            icon: (
              <GppGoodOutlined
                sx={{
                  fontSize: 48,
                  color: planColor,
                  mb: 2,
                }}
              />
            ),
            title: 'Plagiarism Detection',
            description: 'Comprehensive plagiarism checking across multiple sources and databases',
          },
          {
            icon: (
              <AccessTimeOutlined
                sx={{
                  fontSize: 48,
                  color: planColor,
                  mb: 2,
                }}
              />
            ),
            title: '24/7 Priority Support',
            description: 'Round-the-clock priority customer support for all your needs',
          },
          {
            icon: (
              <AutoFixHighOutlined
                sx={{
                  fontSize: 48,
                  color: planColor,
                  mb: 2,
                }}
              />
            ),
            title: 'Advanced Writing Analysis',
            description: 'Deep analysis of writing structure, coherence, and argument strength',
          },
          {
            icon: (
              <PaletteOutlined
                sx={{
                  fontSize: 48,
                  color: planColor,
                  mb: 2,
                }}
              />
            ),
            title: 'Style & Tone Suggestions',
            description: 'Get suggestions to improve writing style and tone for better impact',
          },
          {
            icon: (
              <Speed
                sx={{
                  fontSize: 48,
                  color: planColor,
                  mb: 2,
                }}
              />
            ),
            title: 'Priority Response Time',
            description: 'Faster response times for your requests with priority processing',
          },
          {
            icon: (
              <LibraryBooksOutlined
                sx={{
                  fontSize: 48,
                  color: planColor,
                  mb: 2,
                }}
              />
            ),
            title: 'Extended Templates Library',
            description: 'Access to an expanded library of writing templates and formats',
          },
          {
            icon: (
              <BlockOutlined
                sx={{
                  fontSize: 48,
                  color: planColor,
                  mb: 2,
                }}
              />
            ),
            title: 'Ad-Free Experience',
            description:
              'Enjoy a clean, distraction-free writing environment without advertisements',
          },
        ];
      default:
        return [
          {
            icon: (
              <AutoFixHighOutlined
                sx={{
                  fontSize: 48,
                  color: planColor,
                  mb: 2,
                }}
              />
            ),
            title: 'Enhanced AI Analysis',
            description: 'Advanced writing analysis with detailed feedback and suggestions',
          },
          {
            icon: (
              <Speed
                sx={{
                  fontSize: 48,
                  color: planColor,
                  mb: 2,
                }}
              />
            ),
            title: 'Priority Processing',
            description: 'Faster response times and priority customer support',
          },
          {
            icon: (
              <LibraryBooksOutlined
                sx={{
                  fontSize: 48,
                  color: planColor,
                  mb: 2,
                }}
              />
            ),
            title: 'Extended Templates',
            description: 'Access to our comprehensive library of writing templates',
          },
          {
            icon: (
              <BlockOutlined
                sx={{
                  fontSize: 48,
                  color: planColor,
                  mb: 2,
                }}
              />
            ),
            title: 'Ad-Free Experience',
            description: 'Enjoy a clean, distraction-free writing environment',
          },
        ];
    }
  };

  const planColor = getPlanColor(planName);
  const planIcon = getPlanIcon(planName);
  const planFeatures = getPlanFeatures(planName);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '24px',
          background: isDarkMode
            ? `linear-gradient(135deg, ${theme.palette.background.default} 0%, ${theme.palette.background.paper} 100%)`
            : 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
          color: theme.palette.text.primary,
          overflow: 'visible',
          maxHeight: '90vh',
          boxShadow: `0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 3px ${planColor}40`,
          border: `2px solid ${planColor}`,
        },
      }}
    >
      {/* Close Button */}
      <IconButton
        onClick={onClose}
        sx={{
          position: 'absolute',
          right: 20,
          top: 20,
          color: planColor,
          backgroundColor: isDarkMode
            ? `${theme.palette.background.paper}E6`
            : 'rgba(255,255,255,0.9)',
          border: `2px solid ${planColor}30`,
          width: 40,
          height: 40,
          '&:hover': {
            backgroundColor: planColor,
            color: 'white',
            transform: 'scale(1.05)',
          },
          transition: 'all 0.2s ease',
          zIndex: 2,
        }}
      >
        <CloseIcon sx={{ fontSize: 20 }} />
      </IconButton>

      <DialogContent sx={{ p: 0, overflow: 'visible' }}>
        {/* Success Icon */}
        <Box
          sx={{
            position: 'absolute',
            top: -50,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 100,
            height: 100,
            borderRadius: '50%',
            background: isDarkMode ? theme.palette.background.paper : 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: `0 20px 40px ${planColor}30, 0 0 0 3px ${planColor}20`,
            zIndex: 1,
            border: `3px solid ${planColor}`,
          }}
        >
          {planIcon}
        </Box>

        {/* Content - Now Scrollable */}
        <Box sx={{ pt: 8, pb: 6, px: 6, maxHeight: 'calc(90vh - 140px)', overflow: 'auto' }}>
          {/* Header */}
          <Box sx={{ textAlign: 'center', mb: 6 }}>
            <Typography
              variant="h2"
              sx={{
                fontWeight: 800,
                mb: 3,
                fontSize: { xs: '2rem', md: '2.5rem' },
                color: planColor,
                textShadow: '0 2px 4px rgba(0,0,0,0.1)',
                letterSpacing: '-0.02em',
              }}
            >
              Welcome to AssignmentAI {planName}!
            </Typography>
            <Typography
              variant="h5"
              sx={{
                opacity: 0.8,
                mb: 2,
                fontWeight: 500,
                fontSize: { xs: '1.1rem', md: '1.25rem' },
                color: theme.palette.text.secondary,
              }}
            >
              Your subscription has been successfully activated
            </Typography>
            <Typography
              variant="body1"
              sx={{
                opacity: 0.7,
                fontSize: { xs: '1rem', md: '1.1rem' },
                fontWeight: 400,
                color: theme.palette.text.secondary,
              }}
            >
              You now have access to all {planName} features
            </Typography>
          </Box>

          {/* Features Grid */}
          <Grid container spacing={4} sx={{ mb: 6 }}>
            {planFeatures.map((feature, index) => (
              <Grid
                item
                xs={12}
                sm={6}
                key={index}
                sx={{
                  // Center the last item if it's odd-numbered
                  ...(index === planFeatures.length - 1 &&
                    planFeatures.length % 2 === 1 && {
                      display: 'flex',
                      justifyContent: 'center',
                      '& > *': {
                        maxWidth: '400px',
                        width: '100%',
                      },
                    }),
                }}
              >
                <Box
                  sx={{
                    p: 4,
                    minHeight: '280px',
                    background: isDarkMode
                      ? `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${theme.palette.background.default} 100%)`
                      : 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
                    borderRadius: '16px',
                    border: `2px solid ${planColor}30`,
                    textAlign: 'center',
                    boxShadow: `0 4px 12px ${planColor}15`,
                    transition: 'all 0.3s ease',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: `0 12px 24px ${planColor}25`,
                      border: `2px solid ${planColor}50`,
                    },
                  }}
                >
                  <Box>
                    {feature.icon}
                    <Typography
                      variant="h5"
                      sx={{
                        mb: 2,
                        fontWeight: 700,
                        fontSize: '1.25rem',
                        color: theme.palette.text.primary,
                      }}
                    >
                      {feature.title}
                    </Typography>
                    <Typography
                      variant="body1"
                      sx={{
                        opacity: 0.8,
                        lineHeight: 1.6,
                        color: theme.palette.text.secondary,
                      }}
                    >
                      {feature.description}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            ))}
          </Grid>

          {/* Next Steps */}
          <Box
            sx={{
              p: 4,
              background: isDarkMode
                ? `linear-gradient(135deg, ${planColor}15 0%, ${planColor}25 100%)`
                : `linear-gradient(135deg, ${planColor}08 0%, ${planColor}15 100%)`,
              borderRadius: '20px',
              mb: 5,
              border: `2px solid ${planColor}25`,
              boxShadow: `0 4px 12px ${planColor}10`,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <FlagOutlined
                sx={{
                  fontSize: 32,
                  color: planColor,
                  mr: 2,
                }}
              />
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 700,
                  fontSize: '1.5rem',
                  color: planColor,
                }}
              >
                What's Next?
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
              <Typography
                variant="body1"
                sx={{
                  mr: 2,
                  fontWeight: 700,
                  fontSize: '1.1rem',
                  color: planColor,
                  minWidth: '24px',
                }}
              >
                1.
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  opacity: 0.8,
                  lineHeight: 1.6,
                  fontSize: '1.1rem',
                  color: isDarkMode ? '#cccccc' : '#555555',
                }}
              >
                Explore your dashboard to see your new {planName} features
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
              <Typography
                variant="body1"
                sx={{
                  mr: 2,
                  fontWeight: 700,
                  fontSize: '1.1rem',
                  color: planColor,
                  minWidth: '24px',
                }}
              >
                2.
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  opacity: 0.8,
                  lineHeight: 1.6,
                  fontSize: '1.1rem',
                  color: theme.palette.text.secondary,
                }}
              >
                Upload your first assignment for AI analysis
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
              <Typography
                variant="body1"
                sx={{
                  mr: 2,
                  fontWeight: 700,
                  fontSize: '1.1rem',
                  color: planColor,
                  minWidth: '24px',
                }}
              >
                3.
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  opacity: 0.8,
                  lineHeight: 1.6,
                  fontSize: '1.1rem',
                  color: theme.palette.text.secondary,
                }}
              >
                Check out your {planName} templates and tools
              </Typography>
            </Box>
          </Box>

          {/* Action Buttons */}
          <Box sx={{ display: 'flex', gap: 3, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              size="large"
              onClick={() => navigate('/dashboard')}
              sx={{
                background: `linear-gradient(135deg, ${planColor} 0%, ${planColor}dd 100%)`,
                color: 'white',
                px: 5,
                py: 2,
                fontWeight: 700,
                fontSize: '1.1rem',
                borderRadius: '12px',
                textTransform: 'none',
                boxShadow: `0 8px 25px ${planColor}30`,
                border: `2px solid ${planColor}`,
                '&:hover': {
                  background: `linear-gradient(135deg, ${planColor}dd 0%, ${planColor} 100%)`,
                  transform: 'translateY(-2px)',
                  boxShadow: `0 12px 35px ${planColor}40`,
                },
                transition: 'all 0.3s ease',
                minWidth: '180px',
              }}
            >
              Go to Dashboard
            </Button>
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default SuccessPopup;
