// Material-UI Icons imports
import {
  AccessTimeOutlined,
  AllInclusive,
  AutoFixHighOutlined,
  BarChartOutlined,
  BlockOutlined,
  CheckCircle,
  Close as CloseIcon,
  CreditCard,
  DesignServicesOutlined,
  Diamond,
  EmojiEvents,
  FormatQuoteOutlined,
  GppGoodOutlined,
  HelpOutline,
  LibraryBooksOutlined,
  LocalOffer,
  MilitaryTechOutlined,
  PaletteOutlined,
  SchoolOutlined,
  ScienceOutlined,
  Search,
  Speed,
  Spellcheck,
  Star,
  TextSnippetOutlined,
} from '@mui/icons-material';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  Grid,
  IconButton,
  Stack,
  Switch,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useSnackbar } from 'notistack';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PaymentForm from '../components/payment/PaymentForm';
import { useAspectRatio } from '../hooks/useAspectRatio';
import { api } from '../services/api';
import { aspectRatioStyles, getAspectRatioStyle } from '../styles/aspectRatioBreakpoints';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

interface Feature {
  name: string;
  free: boolean;
  plus: boolean;
  pro: boolean;
  max: boolean;
  description?: string;
}

interface Plan {
  name: string;
  price: number;
  description: string;
  icon: React.ReactNode;
  color: string;
  features: string[];
  popular?: boolean;
  priceId: string;
  bestFor: string;
  tokenBoost?: number;
  isCurrentPlan?: boolean;
}

interface CurrentPlan {
  id: string;
  name: string;
  price: number;
  interval: string;
  features: string[];
}

const features: Feature[] = [
  {
    name: 'Basic Assignment Analysis',
    free: true,
    plus: true,
    pro: true,
    max: true,
    description: 'Get basic feedback on your assignments',
  },
  {
    name: 'Grammar & Spelling Check',
    free: true,
    plus: true,
    pro: true,
    max: true,
    description: 'Check for common grammar and spelling errors',
  },
  {
    name: 'Basic Writing Suggestions',
    free: true,
    plus: true,
    pro: true,
    max: true,
    description: 'Receive basic suggestions to improve your writing',
  },
  {
    name: 'Standard Response Time',
    free: true,
    plus: true,
    pro: true,
    max: true,
    description: 'Get responses within standard timeframes',
  },
  {
    name: 'Basic Templates',
    free: true,
    plus: true,
    pro: true,
    max: true,
    description: 'Access to basic writing templates',
  },
  {
    name: 'Advanced Writing Analysis',
    free: false,
    plus: true,
    pro: true,
    max: true,
    description: 'Deep analysis of writing structure, coherence, and argument strength',
  },
  {
    name: 'Style & Tone Suggestions',
    free: false,
    plus: true,
    pro: true,
    max: true,
    description: 'Get suggestions to improve writing style and tone',
  },
  {
    name: 'Priority Response Time',
    free: false,
    plus: true,
    pro: true,
    max: true,
    description: 'Faster response times for your requests',
  },
  {
    name: 'Extended Templates Library',
    free: false,
    plus: true,
    pro: true,
    max: true,
    description: 'Access to an expanded library of writing templates',
  },
  {
    name: 'Ad-Free Experience',
    free: false,
    plus: true,
    pro: true,
    max: true,
    description: 'Enjoy an ad-free experience',
  },
  {
    name: 'AI-Powered Research Assistance',
    free: false,
    plus: false,
    pro: true,
    max: true,
    description: 'AI helps you find and analyze research materials',
  },
  {
    name: 'Citation & Reference Check',
    free: false,
    plus: false,
    pro: true,
    max: true,
    description: 'Automated checking of citations and references',
  },
  {
    name: 'Plagiarism Detection',
    free: false,
    plus: false,
    pro: true,
    max: true,
    description: 'Comprehensive plagiarism checking across multiple sources',
  },
  {
    name: '24/7 Priority Support',
    free: false,
    plus: false,
    pro: true,
    max: true,
    description: 'Round-the-clock priority customer support',
  },
  {
    name: 'Unlimited Assignment Analysis',
    free: false,
    plus: false,
    pro: false,
    max: true,
    description: 'No limits on the number of assignments you can analyze',
  },
  {
    name: 'Advanced Analytics Dashboard',
    free: false,
    plus: false,
    pro: false,
    max: true,
    description: 'Detailed analytics and insights about your usage and performance',
  },
  {
    name: 'Priority Customer Support',
    free: false,
    plus: false,
    pro: false,
    max: true,
    description: 'Faster response times and dedicated support channel',
  },
  {
    name: 'Custom Assignment Templates',
    free: false,
    plus: false,
    pro: false,
    max: true,
    description: 'Create and save custom templates for repeated use',
  },
];

const plans: Plan[] = [
  {
    name: 'Free',
    price: 0,
    description: 'Perfect starting tool with basic assistance',
    icon: <LocalOffer />,
    color: '#2196f3',
    features: [
      'Basic Assignment Analysis',
      'Grammar & Spelling Check',
      'Basic Writing Suggestions',
      'Standard Response Time',
      'Basic Templates',
    ],
    priceId: 'price_free',
    bestFor: 'Perfect starting tool with basic writing assistance',
    tokenBoost: 30000,
    isCurrentPlan: false,
  },
  {
    name: 'Plus',
    price: 4.99,
    description: 'Enhanced features for more serious students',
    icon: <Star />,
    color: '#4caf50',
    features: [
      'Advanced Writing Analysis',
      'Style & Tone Suggestions',
      'Priority Response Time',
      'Extended Templates Library',
      'Ad-Free Experience',
    ],
    popular: true,
    priceId: 'price_plus',
    bestFor: 'Enhanced features for more serious students',
    tokenBoost: 50000,
    isCurrentPlan: false,
  },
  {
    name: 'Pro',
    price: 9.99,
    description: 'Advanced features for professional students',
    icon: <Diamond />,
    color: '#9c27b0',
    features: [
      'AI-Powered Research Assistance',
      'Citation & Reference Check',
      'Plagiarism Detection',
      '24/7 Priority Support',
      'Ad-Free Experience',
    ],
    priceId: 'price_pro',
    bestFor: 'Advanced features for professional students',
    tokenBoost: 75000,
    isCurrentPlan: false,
  },
  {
    name: 'Max',
    price: 14.99,
    description: 'Ultimate package for power users',
    icon: <EmojiEvents />,
    color: '#ff9800',
    features: [
      'Unlimited Assignment Analysis',
      'Advanced Analytics Dashboard',
      'Priority Customer Support',
      'Custom Assignment Templates',
      'Ad-Free Experience',
    ],
    priceId: 'price_max',
    bestFor: 'Ultimate package for power users',
    tokenBoost: 100000,
    isCurrentPlan: false,
  },
];

const getFeatureIcon = (featureName: string, color: string) => {
  switch (featureName) {
    case 'Basic Assignment Analysis':
      return <SchoolOutlined sx={{ color }} />;
    case 'Grammar & Spelling Check':
      return <Spellcheck sx={{ color }} />;
    case 'Basic Writing Suggestions':
      return <AutoFixHighOutlined sx={{ color }} />;
    case 'Standard Response Time':
      return <Speed sx={{ color }} />;
    case 'Basic Templates':
      return <TextSnippetOutlined sx={{ color }} />;
    case 'Advanced Writing Analysis':
      return <ScienceOutlined sx={{ color }} />;
    case 'Style & Tone Suggestions':
      return <PaletteOutlined sx={{ color }} />;
    case 'Priority Response Time':
      return <Speed sx={{ color }} />;
    case 'Extended Templates Library':
      return <LibraryBooksOutlined sx={{ color }} />;
    case 'AI-Powered Research Assistance':
      return <Search sx={{ color }} />;
    case 'Citation & Reference Check':
      return <FormatQuoteOutlined sx={{ color }} />;
    case 'Plagiarism Detection':
      return <GppGoodOutlined sx={{ color }} />;
    case '24/7 Priority Support':
      return <AccessTimeOutlined sx={{ color }} />;
    case 'Unlimited Assignment Analysis':
      return <AllInclusive sx={{ color }} />;
    case 'Advanced Analytics Dashboard':
      return <BarChartOutlined sx={{ color }} />;
    case 'Priority Customer Support':
      return <MilitaryTechOutlined sx={{ color }} />;
    case 'Custom Assignment Templates':
      return <DesignServicesOutlined sx={{ color }} />;
    case 'Ad-Free Experience':
      return <BlockOutlined sx={{ color }} />;
    default:
      return <CheckCircle sx={{ color }} />;
  }
};

const PricePlan: React.FC = () => {
  const theme = useTheme();
  const { enqueueSnackbar } = useSnackbar();
  const navigate = useNavigate();
  const { breakpoint } = useAspectRatio();
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [showDetailedComparison, setShowDetailedComparison] = useState(false);
  const [, setCurrentPlan] = useState<CurrentPlan | null>(null);
  const [plansWithCurrentPlan, setPlansWithCurrentPlan] = useState<Plan[]>(plans);

  useEffect(() => {
    fetchCurrentPlan();
  }, []);

  const fetchCurrentPlan = async () => {
    try {
      const response = await api.get<CurrentPlan>('/plans/current');
      setCurrentPlan(response.data);

      // Update plans to mark current plan
      const updatedPlans = plans.map(plan => ({
        ...plan,
        isCurrentPlan: plan.name.toLowerCase() === (response.data.name || '').toLowerCase(),
      }));
      setPlansWithCurrentPlan(updatedPlans);
    } catch (error) {
      console.error('Failed to fetch current plan:', error);
      // If no current plan, all plans are available
      setPlansWithCurrentPlan(plans.map(plan => ({ ...plan, isCurrentPlan: false })));
    }
  };

  const handlePlanSelect = (plan: Plan) => {
    if (plan.price === 0) {
      enqueueSnackbar('Free plan activated successfully!', { variant: 'success' });
      navigate('/dashboard');
      return;
    }
    setSelectedPlan(plan);
    setPaymentDialogOpen(true);
  };

  const handlePaymentSuccess = () => {
    setPaymentDialogOpen(false);
    enqueueSnackbar('Subscription successful! Welcome to AssignmentAI Pro.', {
      variant: 'success',
    });
    navigate('/dashboard');
  };

  const handlePaymentError = (error: string) => {
    enqueueSnackbar(`Payment failed: ${error}`, { variant: 'error' });
  };

  const renderDetailedComparison = () => {
    return (
      <Dialog
        open={showDetailedComparison}
        onClose={() => setShowDetailedComparison(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            width: { xs: '95vw', md: 'auto' },
            maxWidth: { xs: '95vw', md: 'lg' },
            backgroundColor: theme => (theme.palette.mode === 'dark' ? '#000814' : '#fff'),
          },
        }}
      >
        <DialogTitle
          sx={{
            fontSize: { xs: '1.25rem', md: '1.5rem' },
            p: { xs: 2, md: 3 },
            color: theme => (theme.palette.mode === 'dark' ? 'white' : 'black'),
          }}
        >
          Detailed Feature Comparison
        </DialogTitle>
        <DialogContent sx={{ p: { xs: 2, md: 3 } }}>
          <Box sx={{ mt: { xs: 1, md: 2 } }}>
            <Grid container spacing={{ xs: 1, md: 2 }}>
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', mb: { xs: 2, md: 2 } }}>
                  <Box sx={{ flex: 1 }} /> {/* Empty space for feature names */}
                  {plansWithCurrentPlan.map(plan => (
                    <Box
                      key={plan.name}
                      sx={{ flex: 1, textAlign: 'center', px: { xs: 0.5, md: 1 } }}
                    >
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: { xs: 0.5, md: 1 },
                          mb: { xs: 0.5, md: 0 },
                        }}
                      >
                        <Typography
                          variant="h6"
                          sx={{
                            fontSize: { xs: '1rem', md: '1.25rem' },
                            fontWeight: 'bold',
                            color: plan.color,
                          }}
                        >
                          {plan.name}
                        </Typography>
                        {plan.popular && (
                          <Chip
                            label="Popular"
                            size="small"
                            sx={{
                              backgroundColor: `${plan.color}15`,
                              color: plan.color,
                              border: `1px solid ${plan.color}40`,
                              fontSize: { xs: '0.625rem', md: '0.75rem' },
                            }}
                          />
                        )}
                      </Box>
                    </Box>
                  ))}
                </Box>
              </Grid>
              {features.map(feature => (
                <Grid item xs={12} key={feature.name}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography
                        sx={{
                          fontSize: { xs: '0.875rem', md: '1rem' },
                          fontWeight: 500,
                          color: theme => (theme.palette.mode === 'dark' ? 'white' : 'black'),
                        }}
                      >
                        {feature.name}
                      </Typography>
                      {feature.description && (
                        <Tooltip title={feature.description} arrow>
                          <IconButton size="small" sx={{ ml: { xs: 0.5, md: 0.5 } }}>
                            <HelpOutline
                              fontSize="small"
                              sx={{
                                color: 'error.main',
                                fontSize: { xs: 16, md: 20 },
                              }}
                            />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Box>
                    {plansWithCurrentPlan.map((plan, index) => {
                      // Check if this plan or any previous plan includes this feature
                      const isIncluded = plansWithCurrentPlan
                        .slice(0, index + 1)
                        .some(p => p.features.includes(feature.name));

                      return (
                        <Box key={plan.name} sx={{ flex: 1, textAlign: 'center' }}>
                          {isIncluded ? (
                            <CheckCircle
                              sx={{
                                color: plan.color,
                                fontSize: { xs: 20, md: 24 },
                              }}
                            />
                          ) : (
                            <Typography
                              color="text.disabled"
                              sx={{
                                fontSize: { xs: '0.875rem', md: '1rem' },
                              }}
                            >
                              —
                            </Typography>
                          )}
                        </Box>
                      );
                    })}
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Box>
        </DialogContent>
      </Dialog>
    );
  };

  return (
    <Box
      sx={{
        width: '100%',
        position: 'relative',
        px: getAspectRatioStyle(aspectRatioStyles.container.padding, breakpoint, 2),
        pb: 4,
      }}
    >
      <Box
        sx={{
          mb: 3,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 3,
          position: 'sticky',
          top: 0,
          zIndex: 10,
          pt: 2,
          pb: 2,
          background:
            theme.palette.mode === 'dark'
              ? 'linear-gradient(180deg, rgba(0,8,20,0.95) 0%, rgba(0,8,20,0.95) 100%)'
              : 'linear-gradient(180deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.95) 100%)',
          backdropFilter: 'blur(10px)',
        }}
      >
        <Typography variant="h4" fontWeight="normal" className="page-title" sx={{ ml: 4 }}>
          Price Plan
        </Typography>
        <FormControlLabel
          control={
            <Switch
              checked={showDetailedComparison}
              onChange={e => setShowDetailedComparison(e.target.checked)}
            />
          }
          label="Detailed Comparison View"
        />
      </Box>

      <Container>
        <Stack spacing={6}>
          <Grid container spacing={6}>
            {plansWithCurrentPlan.map(plan => (
              <Grid item xs={11} md={6} lg={3} key={plan.name}>
                <Card
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'relative',
                    overflow: 'visible',
                    borderRadius: 3,
                    boxShadow: theme.shadows[4],
                    border: '2px solid',
                    borderColor: plan.popular ? plan.color : 'transparent',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-8px)',
                      boxShadow: theme.shadows[12],
                    },
                    ...(plan.isCurrentPlan && {
                      borderColor: theme.palette.grey[400],
                      backgroundColor: theme.palette.grey[50],
                    }),
                  }}
                >
                  {plan.popular && (
                    <Box
                      sx={{
                        position: 'absolute',
                        top: -12,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        zIndex: 1,
                      }}
                    >
                      <Chip
                        icon={<Star />}
                        label="Most Popular"
                        sx={{
                          backgroundColor: plan.color,
                          color: theme => (theme.palette.mode === 'dark' ? 'white' : 'white'),
                          fontWeight: 'bold',
                          boxShadow: theme.shadows[4],
                        }}
                      />
                    </Box>
                  )}
                  <CardContent
                    sx={{
                      p: 4,
                      display: 'flex',
                      flexDirection: 'column',
                      height: '100%',
                      position: 'relative',
                    }}
                  >
                    <Stack spacing={3}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 1,
                            mb: 1,
                          }}
                        >
                          <Box
                            sx={{
                              p: 1,
                              borderRadius: 2,
                              backgroundColor: `${plan.color}15`,
                              color: plan.color,
                            }}
                          >
                            {plan.icon}
                          </Box>
                          <Typography variant="h5" fontWeight="bold" color={plan.color}>
                            {plan.name}
                          </Typography>
                        </Box>
                        <Typography variant="h3" fontWeight="bold" sx={{ mb: 1 }}>
                          ${plan.price}
                          <Typography
                            component="span"
                            variant="h6"
                            color="text.secondary"
                            sx={{ ml: 0.5 }}
                          >
                            per month
                          </Typography>
                        </Typography>
                        <Typography color="text.secondary">{plan.description}</Typography>
                        <Typography variant="body2" color="primary" sx={{ mt: 1 }}>
                          {plan.tokenBoost?.toLocaleString()} tokens per month
                        </Typography>
                      </Box>
                      <Divider />
                      <Stack spacing={2} sx={{ mb: 3 }}>
                        <Typography
                          variant="subtitle2"
                          color="text.secondary"
                          sx={{ mt: 1, mb: 1 }}
                        >
                          {plan.name === 'Free'
                            ? 'Free Features'
                            : plan.name === 'Plus'
                            ? 'Everything in Free, plus:'
                            : plan.name === 'Pro'
                            ? 'Everything in Plus, plus:'
                            : 'Everything in Pro, plus:'}
                        </Typography>
                        {plan.features.map(featureName => (
                          <Stack key={featureName} direction="row" spacing={1} alignItems="center">
                            {getFeatureIcon(featureName, plan.color)}
                            <Typography>{featureName}</Typography>
                          </Stack>
                        ))}
                      </Stack>
                    </Stack>
                    <Box flexGrow={1} />
                    <Button
                      variant={plan.popular ? 'contained' : 'outlined'}
                      fullWidth
                      onClick={() => handlePlanSelect(plan)}
                      disabled={plan.isCurrentPlan}
                      sx={{
                        mt: 'auto',
                        py: 1.5,
                        borderRadius: 2,
                        ...(plan.popular && {
                          background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
                          '&:hover': {
                            background: `linear-gradient(45deg, ${theme.palette.primary.dark}, ${theme.palette.primary.main})`,
                          },
                        }),
                        ...(plan.isCurrentPlan && {
                          backgroundColor: theme.palette.grey[300],
                          color: theme.palette.grey[600],
                          borderColor: theme.palette.grey[400],
                          '&:hover': {
                            backgroundColor: theme.palette.grey[300],
                            color: theme.palette.grey[600],
                          },
                        }),
                      }}
                    >
                      {plan.isCurrentPlan
                        ? 'Your Current Plan'
                        : plan.price === 0
                        ? 'Get Started Free'
                        : 'Choose Plan'}
                    </Button>
                    {!plan.isCurrentPlan && plan.price > 0 && (
                      <Stack
                        direction="row"
                        spacing={1}
                        alignItems="center"
                        justifyContent="center"
                      >
                        <CreditCard fontSize="small" color="action" />
                        <Typography variant="caption" color="text.secondary">
                          Secure checkout
                        </Typography>
                      </Stack>
                    )}
                    <Typography variant="caption" color="text.secondary" textAlign="center">
                      No commitment, cancel anytime
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Stack>
      </Container>

      <Dialog
        open={paymentDialogOpen}
        onClose={() => setPaymentDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: theme => (theme.palette.mode === 'dark' ? '#000814' : '#fff'),
          },
        }}
      >
        <DialogTitle sx={{ color: theme => (theme.palette.mode === 'dark' ? 'white' : 'black') }}>
          Subscribe to {selectedPlan?.name}
          <IconButton
            aria-label="Close"
            onClick={() => setPaymentDialogOpen(false)}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              color: theme => theme.palette.grey[500],
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {selectedPlan && (
            <Elements stripe={stripePromise}>
              <PaymentForm
                priceId={selectedPlan.priceId}
                planName={selectedPlan.name}
                planPrice={selectedPlan.price}
                onSuccess={handlePaymentSuccess}
                onError={handlePaymentError}
              />
            </Elements>
          )}
        </DialogContent>
      </Dialog>

      {renderDetailedComparison()}
    </Box>
  );
};

export default PricePlan;
