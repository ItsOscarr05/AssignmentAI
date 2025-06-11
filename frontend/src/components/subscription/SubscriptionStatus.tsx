import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Typography,
  useTheme,
} from '@mui/material';
import { useSnackbar } from 'notistack';
import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import PaymentForm from '../payment/PaymentForm';

interface Subscription {
  id: string;
  status: 'active' | 'canceled' | 'past_due' | 'trialing';
  plan_id: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
}

interface Plan {
  id: string;
  name: string;
  price: number;
  interval: 'month' | 'year';
  features: string[];
  priceId: string;
}

const SubscriptionStatus: React.FC = () => {
  const theme = useTheme();
  const { enqueueSnackbar } = useSnackbar();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [availablePlans, setAvailablePlans] = useState<Plan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [isUpgradeDialogOpen, setIsUpgradeDialogOpen] = useState(false);

  useEffect(() => {
    fetchSubscriptionData();
  }, []);

  const fetchSubscriptionData = async () => {
    setLoading(true);
    try {
      const [subResponse, planResponse, plansResponse] = await Promise.all([
        api.get<Subscription>('/subscriptions/current'),
        api.get<Plan>('/plans/current'),
        api.get<Plan[]>('/plans'),
      ]);
      setSubscription(subResponse.data);
      setPlan(planResponse.data);
      setAvailablePlans(plansResponse.data);
    } catch (error) {
      enqueueSnackbar('Failed to fetch subscription data', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!subscription) return;

    if (window.confirm('Are you sure you want to cancel your subscription?')) {
      try {
        await api.post('/subscriptions/cancel');
        enqueueSnackbar('Subscription will be canceled at the end of the billing period', {
          variant: 'success',
        });
        fetchSubscriptionData();
      } catch (error) {
        enqueueSnackbar('Failed to cancel subscription', { variant: 'error' });
      }
    }
  };

  const handleUpgrade = () => {
    const currentPlanIndex = availablePlans.findIndex(p => p.id === plan?.id);
    if (currentPlanIndex < availablePlans.length - 1) {
      setSelectedPlanId(availablePlans[currentPlanIndex + 1].priceId);
    }
    setIsUpgradeDialogOpen(true);
  };

  const handleUpgradeSuccess = () => {
    setIsUpgradeDialogOpen(false);
    fetchSubscriptionData();
    enqueueSnackbar('Subscription upgraded successfully', { variant: 'success' });
  };

  const handleUpgradeError = (error: string) => {
    enqueueSnackbar(`Failed to upgrade subscription: ${error}`, { variant: 'error' });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'canceled':
        return 'error';
      case 'past_due':
        return 'warning';
      case 'trialing':
        return 'info';
      default:
        return 'default';
    }
  };

  if (loading) {
    return <Typography>Loading subscription information...</Typography>;
  }

  return (
    <Box>
      <Card>
        <CardContent>
          <Stack spacing={3}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="h5">Subscription Status</Typography>
              {subscription && (
                <Chip
                  label={subscription.status.toUpperCase()}
                  color={getStatusColor(subscription.status) as any}
                />
              )}
            </Stack>

            {plan && (
              <Box>
                <Typography variant="h6" gutterBottom>
                  Current Plan: {plan.name}
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  ${plan.price}/{plan.interval}
                </Typography>
              </Box>
            )}

            {subscription && (
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Next billing date: {formatDate(subscription.current_period_end)}
                </Typography>
                {subscription.cancel_at_period_end && (
                  <Typography variant="body2" color="error">
                    Subscription will end on {formatDate(subscription.current_period_end)}
                  </Typography>
                )}
              </Box>
            )}

            <Stack direction="row" spacing={2}>
              {subscription?.status === 'active' && !subscription.cancel_at_period_end && (
                <Button variant="outlined" color="error" onClick={handleCancelSubscription}>
                  Cancel Subscription
                </Button>
              )}
              <Button
                variant="contained"
                onClick={handleUpgrade}
                sx={{
                  background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
                  '&:hover': {
                    background: `linear-gradient(45deg, ${theme.palette.primary.dark}, ${theme.palette.primary.main})`,
                  },
                }}
              >
                Upgrade Plan
              </Button>
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      <Dialog
        open={isUpgradeDialogOpen}
        onClose={() => setIsUpgradeDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Upgrade Subscription</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Select Plan</InputLabel>
              <Select
                value={selectedPlanId}
                label="Select Plan"
                onChange={e => setSelectedPlanId(e.target.value)}
              >
                {availablePlans
                  .filter(p => !plan || p.price > plan.price)
                  .map(p => (
                    <MenuItem key={p.id} value={p.priceId}>
                      {p.name} - ${p.price}/{p.interval}
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>
            {selectedPlanId && (
              <PaymentForm
                priceId={selectedPlanId}
                onSuccess={handleUpgradeSuccess}
                onError={handleUpgradeError}
              />
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsUpgradeDialogOpen(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SubscriptionStatus;
