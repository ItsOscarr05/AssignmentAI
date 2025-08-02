import { Box, Button, Stack, TextField, Typography } from '@mui/material';
import { CardElement, useElements, useStripe } from '@stripe/react-stripe-js';
import React, { useState } from 'react';
import { api } from '../../services/api';

interface PaymentFormProps {
  priceId: string;
  planName: string;
  planPrice: number;
  onSuccess: () => void;
  onError: (error: string) => void;
}

const PaymentForm: React.FC<PaymentFormProps> = ({
  priceId,
  planName,
  planPrice,
  onSuccess,
  onError,
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      // Stripe.js has not yet loaded.
      // Make sure to disable form submission until Stripe.js has loaded.
      return;
    }

    setLoading(true);

    const cardElement = elements.getElement(CardElement);

    if (!cardElement) {
      setLoading(false);
      return;
    }

    const { error: stripeError, paymentMethod } = await stripe.createPaymentMethod({
      type: 'card',
      card: cardElement,
      billing_details: {
        name,
      },
    });

    if (stripeError) {
      setError(stripeError.message ?? 'An unexpected error occurred.');
      setLoading(false);
      return;
    }

    try {
      await api.post('/subscriptions/create', {
        plan_id: priceId,
        payment_method_id: paymentMethod.id,
      });
      onSuccess();
    } catch (apiError: any) {
      const errorMessage = apiError.response?.data?.message || 'Failed to process payment';
      onError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
      <Stack spacing={3}>
        <Box sx={{ p: 2, border: '1px solid red', borderRadius: 1 }}>
          <Typography variant="h6" sx={{ color: 'red' }}>
            {planName} Plan - ${planPrice}/month
          </Typography>
        </Box>

        <TextField
          fullWidth
          label="Name on Card"
          value={name}
          onChange={e => setName(e.target.value)}
          required
          sx={{
            '& .MuiOutlinedInput-root': {
              backgroundColor: theme => (theme.palette.mode === 'dark' ? '#000814' : '#fff'),
              '& fieldset': { borderColor: 'red' },
              '&:hover fieldset': { borderColor: 'red' },
              '&.Mui-focused fieldset': { borderColor: 'red' },
            },
            '& .MuiInputLabel-root': {
              color: theme => (theme.palette.mode === 'dark' ? 'white' : 'black'),
              '&.Mui-focused': {
                color: 'red',
              },
            },
          }}
        />

        <Box sx={{ p: 2, border: '1px solid red', borderRadius: 1 }}>
          <CardElement
            options={{
              style: {
                base: {
                  fontSize: '16px',
                  color: '#424770',
                  '::placeholder': {
                    color: '#aab7c4',
                  },
                },
                invalid: {
                  color: '#9e2146',
                },
              },
            }}
          />
        </Box>

        {error && (
          <Typography color="error" variant="body2">
            {error}
          </Typography>
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
          }}
        >
          {loading ? 'Processing...' : 'Subscribe Now'}
        </Button>

        <Typography variant="caption" color="text.secondary" align="center">
          Your payment information is secure and encrypted. We never store your full card details.
        </Typography>
      </Stack>
    </Box>
  );
};

export default PaymentForm;
