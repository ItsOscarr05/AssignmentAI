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
import { paymentService, Plan } from '../../services/paymentService';
import PaymentForm from '../payment/PaymentForm';

const PlanComparison: React.FC = () => {
  const theme = useTheme();
  const { enqueueSnackbar } = useSnackbar();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [currentSubscription, setCurrentSubscription] = useState<any>(null);

  useEffect(() => {
    fetchPlans();
    fetchCurrentSubscription();
  }, []);

  const fetchPlans = async () => {
    try {
      const availablePlans = await paymentService.getPlans();
      setPlans(availablePlans);
    } catch (error) {
      enqueueSnackbar('Failed to fetch available plans', { variant: 'error' });
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

  const handlePlanSelect = (plan: Plan) => {
    setSelectedPlan(plan);
    setShowPaymentForm(true);
  };

  const handlePaymentSuccess = () => {
    setShowPaymentForm(false);
    setSelectedPlan(null);
    fetchCurrentSubscription(); // Refresh subscription data
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
                transition: 'transform 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                },
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
                  variant="contained"
                  onClick={() => handlePlanSelect(plan)}
                  sx={{
                    background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
                    '&:hover': {
                      background: `linear-gradient(45deg, ${theme.palette.primary.dark}, ${theme.palette.primary.main})`,
                    },
                  }}
                >
                  Select Plan
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
