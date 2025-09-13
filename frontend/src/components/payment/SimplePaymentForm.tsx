import { Alert, Box, Button, Stack, Typography } from '@mui/material';
import { PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import React, { useState } from 'react';
import { api } from '../../services/api';

interface SimplePaymentFormProps {
  priceId: string;
  planName: string;
  planPrice: number;
  onSuccess: () => void;
  onError: (error: string) => void;
  isUpgrade?: boolean;
}

const SimplePaymentForm: React.FC<SimplePaymentFormProps> = ({
  priceId,
  planName,
  planPrice,
  onSuccess,
  onError,
  isUpgrade = false,
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      setError('Stripe has not loaded yet. Please try again.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Submit the payment element first (required by Stripe)
      const { error: submitError } = await elements.submit();
      if (submitError) {
        throw new Error(submitError.message);
      }

      // Confirm payment with Stripe (using the existing payment intent from SubscriptionPaymentWrapper)
      const { error: stripeError } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: window.location.origin + '/pricing',
        },
        redirect: 'if_required',
      });

      if (stripeError) {
        throw new Error(stripeError.message);
      }

      // Call backend to create subscription (fallback for webhook)
      try {
        console.log('Calling fallback endpoint with data:', {
          priceId,
          planName,
          isUpgrade,
        });

        const response = await api.post('/payments/confirm-subscription-payment', {
          status: 'succeeded',
          metadata: {
            user_id: 'current_user', // Will be resolved by backend
            price_id: priceId,
            plan_name: planName,
            is_upgrade: isUpgrade,
          },
        });

        console.log('Fallback endpoint response:', response.data);
        console.log('Subscription created successfully via fallback endpoint');
      } catch (fallbackError) {
        console.error('Fallback subscription creation failed:', fallbackError);
        console.error('Error details:', fallbackError.response?.data);
        console.warn('Relying on webhook for subscription creation');
      }

      // Broadcast subscription change with a small delay to ensure backend processing
      setTimeout(() => {
        window.dispatchEvent(new Event('subscription-updated'));
        window.dispatchEvent(new Event('payment-success'));
      }, 1000);

      onSuccess();
    } catch (apiError: any) {
      const errorMessage =
        apiError.response?.data?.message || apiError.message || 'Failed to process payment';
      setError(errorMessage);
      onError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
      <Stack spacing={3}>
        {/* Plan Summary */}
        <Box
          sx={{
            p: 2,
            border: '1px solid red',
            borderRadius: 1,
            backgroundColor: 'rgba(255, 0, 0, 0.05)',
          }}
        >
          <Typography variant="h6" sx={{ color: 'red', fontWeight: 'bold' }}>
            {planName} Plan - ${planPrice}/month
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 1 }}>
            You'll be charged ${planPrice} monthly. Cancel anytime.
          </Typography>
        </Box>

        {/* Stripe Payment Element */}
        <Box
          sx={{
            border: '1px solid #ccc',
            borderRadius: 1,
            p: 2,
            backgroundColor: theme =>
              theme.palette.mode === 'dark' ? theme.palette.background.paper : '#fff',
          }}
        >
          <PaymentElement
            options={{
              layout: 'tabs',
            }}
          />
        </Box>

        {/* Payment Security Notice */}
        <Box
          sx={{
            p: 2,
            backgroundColor: 'rgba(156, 39, 176, 0.1)',
            borderRadius: 1,
            border: '1px solid #9c27b0',
          }}
        >
          <Typography
            variant="body2"
            sx={{ color: '#9c27b0', display: 'flex', alignItems: 'center', gap: 1 }}
          >
            Secure payment powered by Stripe. Your payment information is encrypted and never stored
            on our servers.
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}

        <Button
          type="submit"
          variant="contained"
          size="large"
          disabled={!stripe || loading}
          sx={{
            mt: 2,
            backgroundColor: 'red',
            '&:hover': {
              backgroundColor: '#d32f2f',
            },
            '&:disabled': {
              backgroundColor: '#ccc',
              cursor: 'not-allowed',
            },
          }}
        >
          {loading ? 'Processing Payment...' : `Subscribe to ${planName} - $${planPrice}/month`}
        </Button>

        <Typography variant="caption" color="text.secondary" align="center">
          Your payment information is secure and encrypted. We never store your full card details.
        </Typography>
      </Stack>
    </Box>
  );
};

export default SimplePaymentForm;
