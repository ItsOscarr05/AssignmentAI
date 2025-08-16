import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Grid,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Typography,
  useTheme,
} from '@mui/material';
import { useSnackbar } from 'notistack';
import React, { useEffect, useState } from 'react';
import { paymentService, PlanWithStatus } from '../../services/paymentService';
import PaymentForm from '../payment/PaymentForm';

const PlanComparison: React.FC = () => {
  const theme = useTheme();
  const { enqueueSnackbar } = useSnackbar();
  const [plans, setPlans] = useState<PlanWithStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<PlanWithStatus | null>(null);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [currentSubscription, setCurrentSubscription] = useState<any>(null);

  useEffect(() => {
    fetchPlans();
    fetchCurrentSubscription();
  }, []);

  const fetchPlans = async () => {
    try {
      // Use the new endpoint that includes current plan status
      const availablePlans = await paymentService.getPlansWithStatus();

      // Add color property to each plan based on plan ID
      const plansWithColors = availablePlans.map(plan => ({
        ...plan,
        color:
          plan.id === 'free'
            ? '#2196f3'
            : plan.id === 'plus'
            ? '#4caf50'
            : plan.id === 'pro'
            ? '#9c27b0'
            : '#ff9800', // max plan
      }));

      setPlans(plansWithColors as PlanWithStatus[]);
    } catch (error) {
      console.error('Failed to fetch plans with status:', error);
      // Fallback to regular plans endpoint
      try {
        const fallbackPlans = await paymentService.getPlans();
        // Add default status and color for fallback
        const plansWithDefaultStatus: PlanWithStatus[] = fallbackPlans.map(plan => ({
          ...plan,
          isCurrentPlan: false,
          status: 'available' as const,
          color:
            plan.id === 'free'
              ? '#2196f3'
              : plan.id === 'plus'
              ? '#4caf50'
              : plan.id === 'pro'
              ? '#9c27b0'
              : '#ff9800', // max plan
        }));
        setPlans(plansWithDefaultStatus);
      } catch (fallbackError) {
        enqueueSnackbar('Failed to fetch available plans', { variant: 'error' });
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchCurrentSubscription = async () => {
    try {
      const subscription = await paymentService.getCurrentSubscription();
      setCurrentSubscription(subscription);
    } catch (error) {
      // User might not have a subscription, which is fine
      setCurrentSubscription(null);
    }
  };

  const handlePlanSelect = (plan: PlanWithStatus) => {
    // Don't allow selecting the current plan
    if (plan.isCurrentPlan) {
      enqueueSnackbar('This is already your current plan', { variant: 'info' });
      return;
    }
    setSelectedPlan(plan);
    setShowPaymentForm(true);
  };

  const handlePaymentSuccess = () => {
    setShowPaymentForm(false);
    setSelectedPlan(null);
    // Refresh both plans and subscription data
    fetchPlans();
    fetchCurrentSubscription();
    enqueueSnackbar('Subscription activated successfully!', { variant: 'success' });
  };

  const handlePaymentError = (error: string) => {
    enqueueSnackbar(`Failed to process payment: ${error}`, { variant: 'error' });
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

  if (loading) {
    return <Typography>Loading available plans...</Typography>;
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom align="center">
        Choose Your Plan
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" align="center" gutterBottom>
        Select the plan that best fits your needs
      </Typography>

      <Grid container spacing={3} sx={{ mt: 2 }}>
        {plans.map(plan => (
          <Grid item xs={12} md={4} key={plan.id}>
            <Card
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                transition: 'all 0.3s ease',
                border: '2px solid',
                borderColor: plan.color,
                boxShadow: `0 0 15px ${plan.color}30`,
                '&:hover': {
                  transform: plan.isCurrentPlan ? 'none' : 'translateY(-4px)',
                  boxShadow: `0 0 20px ${plan.color}50`,
                },
                // Enhanced glow effect for current plan
                ...(plan.isCurrentPlan && {
                  borderWidth: '3px',
                  animation: 'currentPlanGlow 2s ease-in-out infinite alternate',
                  '@keyframes currentPlanGlow': {
                    '0%': {
                      boxShadow: `0 0 25px ${plan.color}60`,
                      borderColor: plan.color,
                    },
                    '100%': {
                      boxShadow: `0 0 40px ${plan.color}90`,
                      borderColor: plan.color,
                    },
                  },
                }),
              }}
            >
              <CardHeader
                title={plan.name}
                subheader={`$${plan.price}/${plan.interval}`}
                titleTypographyProps={{ align: 'center' }}
                subheaderTypographyProps={{ align: 'center' }}
              />
              <CardContent sx={{ flexGrow: 1 }}>
                <List>
                  {plan.features.map((feature, index) => (
                    <ListItem key={index}>
                      <ListItemIcon>
                        <CheckCircleIcon color="primary" />
                      </ListItemIcon>
                      <ListItemText primary={feature} />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
              <Box sx={{ p: 2 }}>
                <Button
                  fullWidth
                  variant={plan.isCurrentPlan ? 'outlined' : 'contained'}
                  onClick={() => handlePlanSelect(plan)}
                  disabled={plan.isCurrentPlan}
                  sx={{
                    background: plan.isCurrentPlan
                      ? 'transparent'
                      : `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
                    color: plan.isCurrentPlan ? plan.color : 'white',
                    border: plan.isCurrentPlan ? `2px solid ${plan.color}` : 'none',
                    '&:hover': {
                      background: plan.isCurrentPlan
                        ? 'transparent'
                        : `linear-gradient(45deg, ${theme.palette.primary.dark}, ${theme.palette.primary.main})`,
                    },
                    '&:disabled': {
                      color: plan.color,
                      borderColor: plan.color,
                      opacity: 0.8,
                    },
                  }}
                >
                  {plan.isCurrentPlan ? 'Current Plan' : 'Select Plan'}
                </Button>
              </Box>
            </Card>
          </Grid>
        ))}
      </Grid>

      {showPaymentForm && selectedPlan && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            bgcolor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
        >
          <Card sx={{ maxWidth: 500, width: '100%', mx: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Complete Your Subscription
              </Typography>
              <PaymentForm
                priceId={selectedPlan.priceId}
                planName={selectedPlan.name}
                planPrice={selectedPlan.price}
                onSuccess={handlePaymentSuccess}
                onError={handlePaymentError}
                isUpgrade={isUpgrade()}
              />
            </CardContent>
          </Card>
        </Box>
      )}
    </Box>
  );
};

export default PlanComparison;
