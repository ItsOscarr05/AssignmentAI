import {
  CheckCircle,
  Diamond,
  EmojiEvents,
  LocalOffer,
  Star,
  WorkspacePremium,
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
  Grid,
  Stack,
  Typography,
  useTheme,
} from '@mui/material';
import { useSnackbar } from 'notistack';
import React, { useState } from 'react';
import PaymentForm from '../components/payment/PaymentForm';

interface Feature {
  name: string;
  free: boolean;
  plus: boolean;
  pro: boolean;
  max: boolean;
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
}

const features: Feature[] = [
  { name: 'Basic Assignment Analysis', free: true, plus: true, pro: true, max: true },
  { name: 'Grammar & Spelling Check', free: true, plus: true, pro: true, max: true },
  { name: 'Basic Writing Suggestions', free: true, plus: true, pro: true, max: true },
  { name: 'Standard Response Time', free: true, plus: true, pro: true, max: true },
  { name: 'Basic Templates', free: true, plus: true, pro: true, max: true },
  { name: 'Advanced Writing Analysis', free: false, plus: true, pro: true, max: true },
  { name: 'Style & Tone Suggestions', free: false, plus: true, pro: true, max: true },
  { name: 'Priority Response Time', free: false, plus: true, pro: true, max: true },
  { name: 'Extended Templates Library', free: false, plus: true, pro: true, max: true },
  { name: 'AI-Powered Research Assistance', free: false, plus: false, pro: true, max: true },
  { name: 'Citation & Reference Check', free: false, plus: false, pro: true, max: true },
  { name: 'Custom Writing Style Guide', free: false, plus: false, pro: true, max: true },
  { name: 'Advanced Plagiarism Detection', free: false, plus: false, pro: true, max: true },
  { name: '24/7 Priority Support', free: false, plus: false, pro: true, max: true },
  { name: 'Unlimited Assignment Analysis', free: false, plus: false, pro: false, max: true },
  { name: 'Custom AI Model Training', free: false, plus: false, pro: false, max: true },
  { name: 'API Access', free: false, plus: false, pro: false, max: true },
  { name: 'Dedicated Account Manager', free: false, plus: false, pro: false, max: true },
];

const plans: Plan[] = [
  {
    name: 'Free',
    price: 0,
    description: 'Perfect for getting started with basic writing assistance',
    icon: <LocalOffer />,
    color: '#2196f3',
    features: features.filter(f => f.free).map(f => f.name),
    priceId: 'price_free',
  },
  {
    name: 'Plus',
    price: 4.99,
    description: 'Enhanced features for more serious students',
    icon: <Star />,
    color: '#4caf50',
    features: features.filter(f => f.plus).map(f => f.name),
    popular: true,
    priceId: 'price_plus',
  },
  {
    name: 'Pro',
    price: 9.99,
    description: 'Advanced features for professional students',
    icon: <Diamond />,
    color: '#9c27b0',
    features: features.filter(f => f.pro).map(f => f.name),
    priceId: 'price_pro',
  },
  {
    name: 'Max',
    price: 14.99,
    description: 'Ultimate package for power users',
    icon: <EmojiEvents />,
    color: '#ff9800',
    features: features.filter(f => f.max).map(f => f.name),
    priceId: 'price_max',
  },
];

const PricePlan: React.FC = () => {
  const theme = useTheme();
  const { enqueueSnackbar } = useSnackbar();
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);

  const handlePlanSelect = (plan: Plan) => {
    if (plan.price === 0) {
      // Handle free plan selection
      enqueueSnackbar('Free plan activated!', { variant: 'success' });
      return;
    }
    setSelectedPlan(plan);
    setPaymentDialogOpen(true);
  };

  const handlePaymentSuccess = () => {
    setPaymentDialogOpen(false);
    enqueueSnackbar('Subscription successful!', { variant: 'success' });
  };

  const handlePaymentError = (error: string) => {
    enqueueSnackbar(`Payment failed: ${error}`, { variant: 'error' });
  };

  return (
    <Box sx={{ width: '100%', position: 'relative', px: 2, pb: 4 }}>
      <Box
        sx={{
          mb: 5,
          display: 'flex',
          alignItems: 'center',
          gap: 3,
          position: 'sticky',
          top: 0,
          zIndex: 10,
          pt: 2,
          pb: 2,
          background:
            theme.palette.mode === 'dark'
              ? 'linear-gradient(180deg, rgba(18,18,18,0.95) 0%, rgba(18,18,18,0.95) 100%)'
              : 'linear-gradient(180deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.95) 100%)',
          backdropFilter: 'blur(10px)',
        }}
      >
        <Typography variant="h4" fontWeight="normal" className="page-title">
          Pricing Plans
        </Typography>
      </Box>

      <Container>
        <Stack spacing={6}>
          <Grid container spacing={3}>
            {plans.map(plan => (
              <Grid item xs={12} md={6} lg={3} key={plan.name}>
                <Card
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'relative',
                    transition: 'all 0.3s ease',
                    border: '1px solid',
                    borderColor: plan.popular
                      ? theme.palette.primary.main
                      : theme.palette.mode === 'dark'
                      ? 'rgba(255,255,255,0.1)'
                      : 'rgba(0,0,0,0.06)',
                    '&:hover': {
                      transform: 'translateY(-8px)',
                      boxShadow: theme.shadows[8],
                    },
                    minWidth: '280px',
                  }}
                >
                  {plan.popular && (
                    <Chip
                      icon={<WorkspacePremium />}
                      label="Most Popular"
                      color="primary"
                      sx={{
                        position: 'absolute',
                        top: 16,
                        right: 16,
                        borderRadius: 2,
                        mt: 2,
                      }}
                    />
                  )}
                  <CardContent sx={{ flexGrow: 1, p: 3 }}>
                    <Stack spacing={3}>
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 2,
                          color: plan.color,
                        }}
                      >
                        {plan.icon}
                        <Typography variant="h5" fontWeight="bold">
                          {plan.name}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="h3" fontWeight="bold" gutterBottom>
                          ${plan.price}
                          <Typography component="span" variant="subtitle1" color="text.secondary">
                            /month
                          </Typography>
                        </Typography>
                        <Typography color="text.secondary">{plan.description}</Typography>
                      </Box>
                      <Divider />
                      <Stack spacing={2}>
                        {plan.features.map(feature => (
                          <Stack key={feature} direction="row" spacing={1} alignItems="center">
                            <CheckCircle sx={{ color: plan.color }} />
                            <Typography>{feature}</Typography>
                          </Stack>
                        ))}
                      </Stack>
                      <Button
                        variant={plan.popular ? 'contained' : 'outlined'}
                        fullWidth
                        onClick={() => handlePlanSelect(plan)}
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
                        }}
                      >
                        {plan.price === 0 ? 'Get Started Free' : 'Choose Plan'}
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
      >
        <DialogTitle>Subscribe to {selectedPlan?.name} Plan</DialogTitle>
        <DialogContent>
          {selectedPlan && (
            <PaymentForm
              priceId={selectedPlan.priceId}
              onSuccess={handlePaymentSuccess}
              onError={handlePaymentError}
            />
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default PricePlan;
