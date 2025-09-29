import {
  Close as CloseIcon,
  DiamondOutlined as DiamondOutlinedIcon,
  LockOutlined as LockIcon,
  Star as StarIcon,
} from '@mui/icons-material';
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  Typography,
  Zoom,
  keyframes,
  useTheme,
} from '@mui/material';
import React, { useState } from 'react';
import { FeatureAccessError } from '../../services/WorkshopService';
import SubscriptionPaymentWrapper from '../payment/SubscriptionPaymentWrapper';

interface SubscriptionUpgradeModalProps {
  open: boolean;
  onClose: () => void;
  error: FeatureAccessError | null;
}

// Custom animations
const pulseGlow = keyframes`
  0%, 100% {
    box-shadow: 0 0 20px rgba(156, 39, 176, 0.3);
  }
  50% {
    box-shadow: 0 0 30px rgba(156, 39, 176, 0.6);
  }
`;

const sparkle = keyframes`
  0%, 100% {
    opacity: 0;
    transform: scale(0.8);
  }
  50% {
    opacity: 1;
    transform: scale(1.2);
  }
`;

const float = keyframes`
  0%, 100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-5px);
  }
`;

const shimmer = keyframes`
  0% {
    background-position: -200px 0;
  }
  100% {
    background-position: calc(200px + 100%) 0;
  }
`;

const getFeatureDisplayName = (feature: string | undefined): string => {
  if (!feature) return 'Premium Feature';

  const featureNames: Record<string, string> = {
    diagram_generation: 'Diagram Generation',
    image_analysis: 'Image Analysis',
    code_analysis: 'Code Analysis',
    data_analysis: 'Data Analysis',
    advanced_writing_analysis: 'Advanced Writing Analysis',
    style_tone_suggestions: 'Style & Tone Suggestions',
    priority_response_time: 'Priority Response Time',
    extended_templates: 'Extended Templates Library',
    ad_free_experience: 'Ad-Free Experience',
    citation_management: 'Citation Management',
    basic_plagiarism_detection: 'Basic Plagiarism Check',
    advanced_analytics: 'Advanced Analytics Dashboard',
    priority_support: 'Priority Support',
    custom_templates: 'Custom Assignment Templates',
  };

  return featureNames[feature] || feature.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

const getPlanDisplayName = (plan: string | undefined): string => {
  if (!plan) return 'Unknown';

  const planNames: Record<string, string> = {
    free: 'Free',
    plus: 'Plus',
    pro: 'Pro',
    max: 'Max',
  };

  return planNames[plan.toLowerCase()] || plan;
};

const getUpgradeButtonText = (currentPlan: string | undefined, requiredPlan: string): string => {
  if (!currentPlan) return `Upgrade to ${requiredPlan}`;

  const planOrder = ['free', 'plus', 'pro', 'max'];
  const currentIndex = planOrder.indexOf(currentPlan.toLowerCase());
  const requiredIndex = planOrder.indexOf(requiredPlan.toLowerCase());

  if (requiredIndex > currentIndex) {
    return `Upgrade to ${requiredPlan}`;
  } else if (requiredIndex === currentIndex) {
    return 'Contact Support';
  } else {
    return 'Contact Support';
  }
};

const getPlanColor = (plan: string | undefined): string => {
  if (!plan) return '#666';

  const colors: Record<string, string> = {
    free: '#2196f3', // Blue
    plus: '#4caf50', // Green
    pro: '#9c27b0', // Purple
    max: '#ff9800', // Gold
  };

  return colors[plan] || '#666';
};

const getFeatureIcon = (feature: string | undefined, color: string) => {
  const iconStyle = { fontSize: 48, color: color }; // Make the icon bigger and colored
  switch (feature) {
    case 'data_analysis':
      return <DiamondOutlinedIcon sx={iconStyle} />;
    case 'diagram_generation':
      return <StarIcon sx={iconStyle} />;
    default:
      return <DiamondOutlinedIcon sx={iconStyle} />;
  }
};

const getRequiredPlanForFeature = (feature: string | undefined): string => {
  const featurePlanMap: Record<string, string> = {
    data_analysis: 'Pro',
    diagram_generation: 'Plus',
    image_analysis: 'Plus',
    code_analysis: 'Plus',
    advanced_writing_analysis: 'Pro',
    style_tone_suggestions: 'Plus',
    priority_response_time: 'Pro',
    extended_templates: 'Plus',
    ad_free_experience: 'Plus',
    citation_management: 'Pro',
    basic_plagiarism_detection: 'Plus',
    advanced_analytics: 'Pro',
    priority_support: 'Pro',
    custom_templates: 'Pro',
  };

  return featurePlanMap[feature || ''] || 'Plus';
};

export const SubscriptionUpgradeModal: React.FC<SubscriptionUpgradeModalProps> = ({
  open,
  onClose,
  error,
}) => {
  const theme = useTheme();
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);

  // Early return if no error or modal is closed
  if (!open || !error) {
    return null;
  }

  // Extract data from error object (nested under 'detail')
  const errorDetail = (error as any).detail || error;
  const featureName = getFeatureDisplayName(errorDetail.feature);
  const currentPlanName = getPlanDisplayName(errorDetail.current_plan);
  const requiredPlanName = getRequiredPlanForFeature(errorDetail.feature);
  const upgradeText = getUpgradeButtonText(errorDetail.current_plan, requiredPlanName);
  const currentPlanColor = getPlanColor(errorDetail.current_plan);
  const requiredPlanColor = getPlanColor(requiredPlanName.toLowerCase());

  // Get plan details for payment
  const getPlanDetails = (planName: string) => {
    const planMap: Record<string, { price: number; priceId: string }> = {
      Plus: {
        price: 4.99,
        priceId: import.meta.env.VITE_STRIPE_PRICE_PLUS || '',
      },
      Pro: {
        price: 9.99,
        priceId: import.meta.env.VITE_STRIPE_PRICE_PRO || '',
      },
      Max: {
        price: 14.99,
        priceId: import.meta.env.VITE_STRIPE_PRICE_MAX || '',
      },
    };
    return planMap[planName] || planMap['Plus'];
  };

  const planDetails = getPlanDetails(requiredPlanName);

  // Payment handlers
  const handlePaymentSuccess = () => {
    setPaymentDialogOpen(false);
    onClose();
    // You can add additional success handling here (e.g., show success message)
  };

  const handlePaymentError = (error: string) => {
    console.error('Payment error:', error);
    // You can add additional error handling here (e.g., show error message)
  };

  // Debug logging
  console.log('Subscription modal error data:', error);
  console.log('Error keys:', Object.keys(error));
  console.log('Error values:', Object.values(error));
  console.log('Full error object:', JSON.stringify(error, null, 2));
  console.log('Extracted error detail:', errorDetail);
  console.log('Current plan from backend:', errorDetail.current_plan);
  console.log('Current plan display name:', currentPlanName);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      TransitionComponent={Zoom}
      transitionDuration={300}
      PaperProps={{
        sx: {
          borderRadius: 4,
          border: `2px solid ${theme.palette.error.main}`,
          backgroundColor:
            theme.palette.mode === 'dark' ? theme.palette.background.default : '#ffffff',
          boxShadow: `0 20px 60px rgba(244, 67, 54, 0.3), 0 0 40px rgba(244, 67, 54, 0.1)`,
          maxHeight: '90vh',
          overflow: 'hidden',
          position: 'relative',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '2px',
            background: `linear-gradient(90deg, transparent, ${theme.palette.error.main}, transparent)`,
            animation: `${shimmer} 3s infinite`,
          },
        },
      }}
    >
      <DialogTitle
        sx={{
          borderBottom: `1px solid ${theme.palette.error.main}`,
          pb: 2,
          backgroundColor:
            theme.palette.mode === 'dark' ? theme.palette.background.default : '#ffffff',
          px: 3,
          py: 2,
        }}
      >
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center" gap={1}>
            <LockIcon sx={{ color: theme.palette.error.main, fontSize: '1.5rem' }} />
            <Typography
              variant="h6"
              sx={{
                color: theme.palette.error.main,
                fontWeight: 700,
                fontSize: '1.5rem',
              }}
            >
              Plan Upgrade Required
            </Typography>
          </Box>
          <IconButton onClick={onClose} size="small" sx={{ color: theme.palette.error.main }}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent
        sx={{
          px: 3,
          py: 2,
          backgroundColor:
            theme.palette.mode === 'dark' ? theme.palette.background.default : '#ffffff',
        }}
      >
        <Box textAlign="center" mb={3}>
          <Box
            display="inline-flex"
            alignItems="center"
            justifyContent="center"
            width={100}
            height={100}
            borderRadius="50%"
            sx={{
              backgroundColor: 'transparent',
              border: `3px solid ${requiredPlanColor}`,
              animation: `${float} 3s ease-in-out infinite`,
              position: 'relative',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: -5,
                left: -5,
                right: -5,
                bottom: -5,
                borderRadius: '50%',
                border: `2px solid ${requiredPlanColor}`,
                opacity: 0.3,
                animation: `${pulseGlow} 2s ease-in-out infinite`,
              },
              '&::after': {
                content: '""',
                position: 'absolute',
                top: -10,
                left: -10,
                right: -10,
                bottom: -10,
                borderRadius: '50%',
                border: `1px solid ${requiredPlanColor}`,
                opacity: 0.1,
                animation: `${pulseGlow} 2s ease-in-out infinite 0.5s`,
              },
            }}
            mb={2}
          >
            {getFeatureIcon(errorDetail.feature, requiredPlanColor)}

            {/* Sparkle effects */}
            <Box
              sx={{
                position: 'absolute',
                top: 10,
                right: 10,
                width: 8,
                height: 8,
                borderRadius: '50%',
                backgroundColor: requiredPlanColor,
                animation: `${sparkle} 1.5s ease-in-out infinite`,
              }}
            />
            <Box
              sx={{
                position: 'absolute',
                bottom: 15,
                left: 15,
                width: 6,
                height: 6,
                borderRadius: '50%',
                backgroundColor: requiredPlanColor,
                animation: `${sparkle} 1.8s ease-in-out infinite 0.3s`,
              }}
            />
            <Box
              sx={{
                position: 'absolute',
                top: 20,
                left: 5,
                width: 4,
                height: 4,
                borderRadius: '50%',
                backgroundColor: requiredPlanColor,
                animation: `${sparkle} 2s ease-in-out infinite 0.6s`,
              }}
            />
          </Box>

          <Typography
            variant="h6"
            gutterBottom
            sx={{
              color: theme.palette.text.primary,
              fontWeight: 600,
              mb: 2,
            }}
          >
            {featureName} Not Available
          </Typography>

          <Typography
            variant="body1"
            sx={{
              color: theme.palette.text.secondary,
              mb: 3,
              lineHeight: 1.6,
            }}
          >
            {errorDetail.upgrade_message}
          </Typography>
        </Box>

        <Box
          sx={{
            borderRadius: 2,
            p: 2,
            mb: 3,
          }}
        >
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={6}>
              <Box textAlign="center">
                <Chip
                  label={`Current: ${currentPlanName}`}
                  sx={{
                    backgroundColor: 'transparent',
                    border: `2px solid ${currentPlanColor}`,
                    color: currentPlanColor,
                    fontWeight: 'bold',
                    fontSize: '0.95rem',
                    py: 1,
                    transition: 'all 0.3s ease',
                    '& .MuiChip-label': {
                      color: currentPlanColor,
                      fontWeight: 'bold',
                      px: 2,
                    },
                    '&:hover': {
                      backgroundColor: `${currentPlanColor}10`,
                      transform: 'scale(1.05)',
                    },
                  }}
                />
              </Box>
            </Grid>
            <Grid item xs={6}>
              <Box textAlign="center">
                <Chip
                  label={`Required: ${requiredPlanName}`}
                  sx={{
                    backgroundColor: 'transparent',
                    border: `2px solid ${requiredPlanColor}`,
                    color: requiredPlanColor,
                    fontWeight: 'bold',
                    fontSize: '0.95rem',
                    py: 1,
                    transition: 'all 0.3s ease',
                    '& .MuiChip-label': {
                      color: requiredPlanColor,
                      fontWeight: 'bold',
                      px: 2,
                    },
                    '&:hover': {
                      backgroundColor: `${requiredPlanColor}10`,
                      transform: 'scale(1.05)',
                    },
                  }}
                />
              </Box>
            </Grid>
          </Grid>
        </Box>

        <Divider sx={{ my: 2, borderColor: 'white' }} />

        <Box textAlign="center">
          <Typography
            variant="body2"
            sx={{
              color: theme.palette.text.secondary,
              mb: 2,
              lineHeight: 1.5,
            }}
          >
            Unlock premium features and get the most out of AssignmentAI
          </Typography>
        </Box>
      </DialogContent>

      <DialogActions
        sx={{
          px: 3,
          py: 2,
          borderTop: `1px solid ${theme.palette.error.main}`,
          backgroundColor:
            theme.palette.mode === 'dark' ? theme.palette.background.default : '#ffffff',
        }}
      >
        <Box display="flex" gap={2} width="100%" justifyContent="center">
          <Button
            variant="contained"
            size="large"
            onClick={() => {
              setPaymentDialogOpen(true);
            }}
            sx={{
              minWidth: 180,
              fontWeight: 'bold',
              borderRadius: 3,
              backgroundColor: theme.palette.error.main,
              color: theme.palette.error.contrastText,
              fontSize: '1.1rem',
              py: 1.5,
              px: 3,
              position: 'relative',
              overflow: 'hidden',
              transition: 'all 0.3s ease',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: '-100%',
                width: '100%',
                height: '100%',
                background:
                  'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
                transition: 'left 0.5s ease',
              },
              '&:hover': {
                backgroundColor: theme.palette.error.dark,
                transform: 'translateY(-2px)',
                boxShadow: `0 8px 25px ${theme.palette.error.main}40`,
                '&::before': {
                  left: '100%',
                },
              },
              '&:active': {
                transform: 'translateY(0px)',
              },
            }}
          >
            {upgradeText}
          </Button>

          <Button
            variant="outlined"
            size="large"
            onClick={() => {
              window.location.href = '/dashboard/price-plan';
            }}
            sx={{
              minWidth: 140,
              borderRadius: 3,
              borderColor: theme.palette.error.main,
              color: theme.palette.error.main,
              fontSize: '1rem',
              py: 1.5,
              px: 3,
              transition: 'all 0.3s ease',
              '&:hover': {
                borderColor: theme.palette.error.dark,
                backgroundColor: `${theme.palette.error.main}10`,
                transform: 'translateY(-1px)',
                boxShadow: `0 4px 15px ${theme.palette.error.main}20`,
              },
            }}
          >
            View Plans
          </Button>

          <Button
            variant="text"
            size="large"
            onClick={onClose}
            sx={{
              borderRadius: 3,
              color: theme.palette.text.secondary,
              fontSize: '1rem',
              py: 1.5,
              px: 3,
              transition: 'all 0.3s ease',
              '&:hover': {
                backgroundColor: theme.palette.action.hover,
                color: theme.palette.text.primary,
                transform: 'translateY(-1px)',
              },
            }}
          >
            Maybe Later
          </Button>
        </Box>
      </DialogActions>

      {/* Payment Dialog */}
      <Dialog
        open={paymentDialogOpen}
        onClose={() => setPaymentDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor:
              theme.palette.mode === 'dark' ? theme.palette.background.paper : '#fff',
          },
        }}
      >
        <DialogTitle sx={{ color: theme.palette.mode === 'dark' ? 'white' : 'black' }}>
          Subscribe to {requiredPlanName}
          <IconButton
            aria-label="Close"
            onClick={() => setPaymentDialogOpen(false)}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              color: theme.palette.grey[500],
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <SubscriptionPaymentWrapper
            priceId={planDetails.priceId}
            planName={requiredPlanName}
            planPrice={planDetails.price}
            onSuccess={handlePaymentSuccess}
            onError={handlePaymentError}
            isUpgrade={true}
          />
        </DialogContent>
      </Dialog>
    </Dialog>
  );
};
