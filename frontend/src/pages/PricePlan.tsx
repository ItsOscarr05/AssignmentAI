// Material-UI Icons imports
import {
  AccessTimeOutlined,
  AllInclusive,
  AutoFixHighOutlined,
  BarChartOutlined,
  BlockOutlined,
  CheckCircle,
  Close as CloseIcon,
  CompareArrows,
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
import { toast } from 'sonner';
import PaymentForm from '../components/payment/PaymentForm';
import SuccessPopup from '../components/payment/SuccessPopup';
import { useAspectRatio } from '../hooks/useAspectRatio';
import { api } from '../services/api';
import { aspectRatioStyles, getAspectRatioStyle } from '../styles/aspectRatioBreakpoints';

const stripePromise = loadStripe(
  import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY ||
    'pk_test_51RYem5BGydvd9sZlgu1k8rVc5y13Y0uVJ1sTjdDe3Ao2CLwgcSiG03GYxtYBLrz1tjN15d1PK38QAqnkf9YMy3HZ00hap3ZOqt'
);

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
    priceId: '', // Will be populated from backend
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
    priceId: '', // Will be populated from backend
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
    priceId: '', // Will be populated from backend
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
    priceId: '', // Will be populated from backend
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
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [, setCurrentPlan] = useState<CurrentPlan | null>(null);
  const [plansWithCurrentPlan, setPlansWithCurrentPlan] = useState<Plan[]>(plans);
  const [currentSubscription, setCurrentSubscription] = useState<any>(null);

  useEffect(() => {
    fetchCurrentPlan();
    fetchPlansWithPrices();
    fetchCurrentSubscription();
  }, []);

  const fetchPlansWithPrices = async () => {
    console.log('fetchPlansWithPrices called');
    try {
      console.log('Making API call to /payments/plans');
      const response = await api.get('/payments/plans');
      console.log('API response received:', response);
      const backendPlans = response.data;
      console.log('Backend plans:', backendPlans);

      // Map backend plans to frontend plans by name
      const updatedPlans = plans.map(plan => {
        console.log(`\n--- Mapping plan: ${plan.name} ---`);
        console.log('Frontend plan name:', plan.name);
        console.log(
          'Backend plans available:',
          backendPlans.map((bp: any) => ({ name: bp.name, priceId: bp.priceId }))
        );

        const backendPlan = backendPlans.find(
          (bp: any) => bp.name.toLowerCase() === plan.name.toLowerCase()
        );

        console.log('Backend plan found:', backendPlan);
        console.log('Backend plan name:', backendPlan?.name);
        console.log('Backend plan priceId:', backendPlan?.priceId);
        console.log('Original plan priceId:', plan.priceId);

        const updatedPlan = {
          ...plan,
          priceId: backendPlan?.priceId || plan.priceId,
        };

        console.log('Updated plan priceId:', updatedPlan.priceId);
        console.log('--- End mapping ---\n');

        return updatedPlan;
      });

      console.log('Final updated plans:', updatedPlans);
      setPlansWithCurrentPlan(updatedPlans);
    } catch (error) {
      console.error('Failed to fetch plans with prices:', error);
      // Keep original plans if fetch fails
    }
  };

  const fetchCurrentPlan = async () => {
    try {
      const response = await api.get<CurrentPlan>('/payments/plans/current/public');
      setCurrentPlan(response.data);

      // Update plans to mark current plan, but preserve existing price IDs
      setPlansWithCurrentPlan(prevPlans =>
        prevPlans.map(plan => ({
          ...plan,
          isCurrentPlan: plan.name.toLowerCase() === (response.data.name || '').toLowerCase(),
        }))
      );
    } catch (error) {
      console.error('Failed to fetch current plan:', error);
      // If no current plan, all plans are available, but preserve existing price IDs
      setPlansWithCurrentPlan(prevPlans =>
        prevPlans.map(plan => ({ ...plan, isCurrentPlan: false }))
      );
    }
  };

  const fetchCurrentSubscription = async () => {
    try {
      const response = await api.get('/payments/subscriptions/current/test');
      setCurrentSubscription(response.data);
    } catch (error) {
      console.error('Failed to fetch current subscription:', error);
      setCurrentSubscription(null);
    }
  };

  const handlePlanSelect = (plan: Plan) => {
    console.log('\n=== PLAN SELECTION ===');
    console.log('Plan selected:', plan);
    console.log('Plan priceId:', plan.priceId);
    console.log('Plan price:', plan.price);

    if (plan.price === 0) {
      console.log('Free plan selected, redirecting to dashboard');
      enqueueSnackbar('Free plan activated successfully!', { variant: 'success' });
      navigate('/dashboard');
      return;
    }

    // Find the plan with the updated price ID from plansWithCurrentPlan
    const updatedPlan = plansWithCurrentPlan.find(p => p.name === plan.name);
    console.log('Updated plan found:', updatedPlan);
    console.log('Updated plan priceId:', updatedPlan?.priceId);
    console.log(
      'All plans with current plan:',
      plansWithCurrentPlan.map(p => ({ name: p.name, priceId: p.priceId }))
    );

    // Debug: Show the full plansWithCurrentPlan array
    console.log('Full plansWithCurrentPlan array:', JSON.stringify(plansWithCurrentPlan, null, 2));
    console.log('Looking for plan with name:', plan.name);
    console.log(
      'Available plan names:',
      plansWithCurrentPlan.map(p => p.name)
    );

    if (!updatedPlan) {
      console.error('Could not find updated plan for:', plan.name);
      enqueueSnackbar('Error: Could not find plan details. Please try again.', {
        variant: 'error',
      });
      return;
    }

    const finalPlan = updatedPlan || plan;
    console.log('Final plan to be used:', finalPlan);
    console.log('Final plan priceId:', finalPlan.priceId);
    console.log('=== END PLAN SELECTION ===\n');

    setSelectedPlan(finalPlan);
    setPaymentDialogOpen(true);
  };

  const handlePaymentSuccess = () => {
    console.log('handlePaymentSuccess called!');
    setPaymentDialogOpen(false);
    setShowSuccessMessage(true);
    console.log('Payment dialog closed');
    console.log('Showing success messages...');

    // Show success message with action button
    enqueueSnackbar('Subscription successful! Welcome to AssignmentAI Pro.', {
      variant: 'success',
      autoHideDuration: 10000,
      action: () => (
        <Button
          color="inherit"
          size="small"
          onClick={() => {
            navigate('/dashboard');
          }}
          sx={{ color: 'white' }}
        >
          Go to Dashboard
        </Button>
      ),
    });

    // Also show a simple toast notification
    toast.success('🎉 Subscription successful! Welcome to AssignmentAI Pro!', {
      duration: 8000,
      position: 'top-center',
    });

    console.log('Success messages shown');
  };

  const handlePaymentError = (error: string) => {
    enqueueSnackbar(`Payment failed: ${error}`, { variant: 'error' });
  };

  // Determine if this is an upgrade based on current subscription and selected plan
  const isUpgrade = (): boolean => {
    if (!currentSubscription || !selectedPlan) return false;

    // If user has an active subscription, this is likely an upgrade
    if (currentSubscription.status === 'active') {
      return true;
    }

    // You could also compare plan prices here if needed
    return false;
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
            backgroundColor: theme =>
              theme.palette.mode === 'dark' ? theme.palette.background.paper : '#fff',
          },
        }}
      >
        {/* Remove DialogTitle so there is no header or X button */}
        <DialogContent sx={{ p: { xs: 2, md: 3 }, position: 'relative' }}>
          <IconButton
            onClick={() => setShowDetailedComparison(false)}
            size="small"
            sx={{
              position: 'absolute',
              top: 8,
              left: 8,
              color: 'red',
              zIndex: 2,
            }}
            aria-label="Close"
          >
            <CloseIcon fontSize="small" />
          </IconButton>
          <Box sx={{ mt: { xs: 1, md: 2 } }}>
            {/* Replace the feature comparison rows with a grid layout for perfect alignment */}
            <Box sx={{ width: '100%', overflowX: 'auto', mt: 2 }}>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns:
                    'minmax(220px, 1.5fr) repeat(' + plansWithCurrentPlan.length + ', 1fr)',
                  alignItems: 'center',
                  fontWeight: 700,
                  mb: 2,
                  px: 2,
                  py: 1,
                  borderBottom: '2px solid #eee',
                  background: '#fff',
                }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    fontSize: { xs: '1.1rem', md: '1.2rem' },
                    color: 'red',
                    fontWeight: 700,
                  }}
                >
                  Detailed Feature Comparison
                  <CompareArrows sx={{ ml: 1, color: 'red', fontSize: { xs: 22, md: 26 } }} />
                </Box>
                {plansWithCurrentPlan.map(plan => (
                  <Box
                    key={plan.name}
                    sx={{
                      textAlign: 'center',
                      color: plan.color,
                      fontWeight: 700,
                      fontSize: { xs: '1.1rem', md: '1.2rem' },
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 1,
                    }}
                  >
                    {plan.icon}
                    {plan.name}
                  </Box>
                ))}
              </Box>
              {features.map(feature => (
                <Box
                  key={feature.name}
                  sx={{
                    display: 'grid',
                    gridTemplateColumns:
                      'minmax(220px, 1.5fr) repeat(' + plansWithCurrentPlan.length + ', 1fr)',
                    alignItems: 'center',
                    minHeight: 40,
                    px: 2,
                    py: 1,
                    background: '#fff', // Always white background
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', minHeight: 32 }}>
                    <Typography
                      sx={{
                        fontWeight: 600,
                        fontSize: { xs: '1.1rem', md: '1.2rem' },
                        color: 'text.primary',
                      }}
                    >
                      {feature.name}
                    </Typography>
                    <Box
                      sx={{
                        width: 28,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        ml: 0.5,
                      }}
                    >
                      {feature.description ? (
                        <Tooltip title={feature.description} arrow>
                          <IconButton size="small" sx={{ p: 0 }}>
                            <HelpOutline
                              fontSize="small"
                              sx={{ color: 'error.main', fontSize: { xs: 16, md: 20 } }}
                            />
                          </IconButton>
                        </Tooltip>
                      ) : (
                        <IconButton size="small" sx={{ p: 0, opacity: 0, pointerEvents: 'none' }}>
                          <HelpOutline fontSize="small" />
                        </IconButton>
                      )}
                    </Box>
                  </Box>
                  {plansWithCurrentPlan.map(plan => {
                    const isIncluded = plansWithCurrentPlan
                      .slice(0, plansWithCurrentPlan.indexOf(plan) + 1)
                      .some(p => p.features.includes(feature.name));
                    return (
                      <Box
                        key={plan.name}
                        sx={{
                          textAlign: 'center',
                          display: 'flex',
                          justifyContent: 'center',
                          alignItems: 'center',
                          minHeight: 32,
                        }}
                      >
                        {isIncluded ? (
                          <CheckCircle sx={{ color: plan.color, fontSize: 28 }} />
                        ) : (
                          <Typography sx={{ color: '#aaa', fontSize: 28, fontWeight: 700 }}>
                            —
                          </Typography>
                        )}
                      </Box>
                    );
                  })}
                </Box>
              ))}
            </Box>
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
          pt: 2,
          pb: 2,
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
          <Grid container spacing={4} justifyContent="center">
            {plansWithCurrentPlan.map(plan => (
              <Grid item xs={12} sm={6} md={6} lg={3} xl={3} key={plan.name}>
                <Card
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'relative',
                    border: '2.25px solid #D32F2F',
                    borderColor: plan.color,
                    borderRadius: 3.5,
                    boxShadow: 3,
                    backgroundColor: theme =>
                      theme.palette.mode === 'dark' ? theme.palette.background.paper : 'white',
                    zIndex: 1,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-8px)',
                      boxShadow: `0 8px 24px ${plan.color}40`,
                      borderColor: plan.color,
                    },
                    minWidth: '240px',
                    overflow: 'visible',
                  }}
                >
                  {plan.popular && (
                    <Chip
                      icon={<Star />}
                      label="Most Popular"
                      color="primary"
                      sx={{
                        position: 'absolute',
                        top: -18,
                        left: 0,
                        right: 0,
                        mx: 'auto',
                        width: 'fit-content',
                        borderRadius: 2,
                        zIndex: 2,
                        fontSize: '1.05rem',
                        boxShadow: 2,
                        bgcolor: '#D32F2F',
                        color: 'white',
                      }}
                    />
                  )}
                  <CardContent sx={{ flexGrow: 1, p: 3 }}>
                    <Stack spacing={2}>
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 2,
                          color: plan.color,
                        }}
                      >
                        {plan.icon}
                        <Typography variant="h4" fontWeight="bold">
                          {plan.name}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography
                          variant="h2"
                          fontWeight="bold"
                          gutterBottom
                          sx={{
                            fontFamily: '"Mike Sans", "Audiowide", Arial, sans-serif',
                            fontSize: { xs: '2.0rem', md: '2.5rem' },
                            color: theme => (theme.palette.mode === 'dark' ? '#ffffff' : '#000000'),
                          }}
                        >
                          {plan.price === 0 ? 'Free' : `$${plan.price}`}
                          {plan.price !== 0 && (
                            <Typography
                              component="span"
                              variant="h5"
                              sx={{
                                color: theme =>
                                  theme.palette.mode === 'dark' ? '#ffffff' : '#000000',
                                fontFamily: '"Mike Sans", "Audiowide", Arial, sans-serif',
                                fontSize: { xs: '1.0rem', md: '1.25rem' },
                              }}
                            >
                              /mo
                            </Typography>
                          )}
                        </Typography>
                        <Typography
                          sx={{
                            color: theme => (theme.palette.mode === 'dark' ? '#cccccc' : '#666666'),
                            fontSize: { xs: '1.0rem', md: '1.15rem' },
                          }}
                        >
                          {plan.description}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, mt: -1 }}>
                        {plan.name === 'Free' && (
                          <Chip
                            icon={<LocalOffer />}
                            label="GPT-4.1 Nano"
                            size="small"
                            sx={{
                              backgroundColor: '#e3f2fd',
                              color: '#1976d2',
                              border: '1.25px solid #90caf9',
                              fontSize: '0.85rem',
                              px: 0.5,
                              height: 24,
                              minHeight: 20,
                              '& .MuiChip-icon': { color: '#1976d2', fontSize: 18 },
                            }}
                          />
                        )}
                        {plan.name === 'Plus' && (
                          <Chip
                            icon={<Star />}
                            label="GPT-3.5 Turbo"
                            size="small"
                            sx={{
                              backgroundColor: '#e8f5e9',
                              color: '#388e3c',
                              border: '1.25px solid #81c784',
                              fontSize: '0.85rem',
                              px: 0.5,
                              height: 24,
                              minHeight: 20,
                              '& .MuiChip-icon': { color: '#388e3c', fontSize: 18 },
                            }}
                          />
                        )}
                        {plan.name === 'Pro' && (
                          <Chip
                            icon={<Diamond />}
                            label="GPT-4 Turbo"
                            size="small"
                            sx={{
                              backgroundColor: '#f3e5f5',
                              color: '#8e24aa',
                              border: '1.25px solid #ce93d8',
                              fontSize: '0.85rem',
                              px: 0.5,
                              height: 24,
                              minHeight: 20,
                              '& .MuiChip-icon': { color: '#8e24aa', fontSize: 18 },
                            }}
                          />
                        )}
                        {plan.name === 'Max' && (
                          <Chip
                            icon={<EmojiEvents />}
                            label="GPT-4"
                            size="small"
                            sx={{
                              backgroundColor: '#fff3e0',
                              color: '#f57c00',
                              border: '1.25px solid #ffb74d',
                              fontSize: '0.85rem',
                              px: 0.5,
                              height: 24,
                              minHeight: 20,
                              '& .MuiChip-icon': { color: '#f57c00', fontSize: 18 },
                            }}
                          />
                        )}
                      </Box>
                      {plan.name === 'Free' && (
                        <Typography
                          variant="tokenLimit"
                          color="error.main"
                          sx={{
                            mt: 0.5,
                            mb: 0,
                          }}
                        >
                          30,000 tokens/month
                        </Typography>
                      )}
                      {plan.name === 'Plus' && (
                        <Typography
                          variant="tokenLimit"
                          color="error.main"
                          sx={{
                            mt: 0.5,
                            mb: 0,
                          }}
                        >
                          50,000 tokens/month
                        </Typography>
                      )}
                      {plan.name === 'Pro' && (
                        <Typography
                          variant="tokenLimit"
                          color="error.main"
                          sx={{
                            mt: 0.5,
                            mb: 0,
                          }}
                        >
                          75,000 tokens/month
                        </Typography>
                      )}
                      {plan.name === 'Max' && (
                        <Typography
                          variant="tokenLimit"
                          color="error.main"
                          sx={{
                            mt: 0.5,
                            mb: 0,
                          }}
                        >
                          100,000 tokens/month
                        </Typography>
                      )}
                      <Divider />
                      <Stack spacing={1.5}>
                        {plan.name === 'Free' && (
                          <Typography
                            variant="caption"
                            sx={{
                              color: theme =>
                                theme.palette.mode === 'dark' ? '#ffffff' : '#000000',
                              fontSize: { xs: '0.95rem', md: '1.05rem' },
                              pl: 0.5,
                            }}
                          >
                            Free Features
                          </Typography>
                        )}
                        {plan.features.map(feature =>
                          feature.startsWith('Everything in') ? (
                            <Typography
                              key={feature}
                              variant="caption"
                              sx={{
                                color: theme =>
                                  theme.palette.mode === 'dark' ? '#ffffff' : '#000000',
                                fontSize: { xs: '0.95rem', md: '1.05rem' },
                                fontWeight: 500,
                                pl: 0.5,
                              }}
                            >
                              {feature}
                            </Typography>
                          ) : (
                            <Stack key={feature} direction="row" spacing={1} alignItems="center">
                              {getFeatureIcon(feature, plan.color)}
                              <Typography
                                variant="body2"
                                sx={{
                                  fontSize: { xs: '1.0rem', md: '1.1rem' },
                                  color: theme =>
                                    theme.palette.mode === 'dark' ? '#ffffff' : '#000000',
                                }}
                              >
                                {feature}
                              </Typography>
                            </Stack>
                          )
                        )}
                      </Stack>
                      <Button
                        variant={plan.popular ? 'contained' : 'outlined'}
                        color="primary"
                        size="large"
                        onClick={() => handlePlanSelect(plan)}
                        disabled={plan.isCurrentPlan}
                        sx={{
                          px: 3.5,
                          py: 1.8,
                          fontWeight: 700,
                          fontSize: '1.0rem',
                          borderRadius: 2,
                          ...(plan.popular
                            ? {
                                bgcolor: '#D32F2F',
                                color: 'white',
                                '&:hover': { bgcolor: '#B71C1C' },
                              }
                            : {
                                borderColor: '#D32F2F',
                                color: '#D32F2F',
                                '&:hover': {
                                  borderColor: '#B71C1C',
                                  bgcolor: 'rgba(211, 47, 47, 0.04)',
                                },
                              }),
                          textTransform: 'none',
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
                    </Stack>
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
            backgroundColor: theme =>
              theme.palette.mode === 'dark' ? theme.palette.background.paper : '#fff',
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
                isUpgrade={isUpgrade()}
              />
            </Elements>
          )}
        </DialogContent>
      </Dialog>

      {renderDetailedComparison()}

      {/* Success Popup Dialog */}
      <SuccessPopup
        open={showSuccessMessage}
        onClose={() => setShowSuccessMessage(false)}
        planName={selectedPlan?.name}
      />
    </Box>
  );
};

export default PricePlan;
