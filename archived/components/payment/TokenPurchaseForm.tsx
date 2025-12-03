import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import { Alert, Box, Button, Stack, Typography } from '@mui/material';
import { PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import React, { useState } from 'react';

interface TokenPurchaseFormProps {
  tokenAmount: number;
  onSuccess: () => void;
  onError: (error: string) => void;
}

// Function to map Stripe error codes to user-friendly messages
const getStripeErrorMessage = (stripeError: any): string => {
  const errorCode = stripeError.code;
  const declineCode = stripeError.decline_code;
  const errorMessage = stripeError.message;

  // Check if the error message contains specific keywords
  if (errorMessage && errorMessage.toLowerCase().includes('expired')) {
    return 'Your card has expired. Please use a different card.';
  }

  if (errorMessage && errorMessage.toLowerCase().includes('insufficient')) {
    return 'Your card has insufficient funds. Please use a different card.';
  }

  // Handle specific error codes
  switch (errorCode) {
    case 'card_declined':
      // Check for specific decline reasons
      if (declineCode) {
        switch (declineCode) {
          case 'expired_card':
            return 'Your card has expired. Please use a different card.';
          case 'insufficient_funds':
            return 'Your card has insufficient funds. Please use a different card.';
          case 'lost_card':
            return 'Your card was declined. Please contact your bank.';
          case 'stolen_card':
            return 'Your card was declined. Please contact your bank.';
          case 'incorrect_cvc':
            return "Your card's security code is incorrect. Please check and try again.";
          case 'processing_error':
            return 'There was an error processing your card. Please try again.';
          default:
            return 'Your card was declined. Please try a different card.';
        }
      }
      return 'Your card was declined. Please try a different card.';

    case 'expired_card':
      return 'Your card has expired. Please use a different card.';

    case 'incorrect_cvc':
      return "Your card's security code is incorrect. Please check and try again.";

    case 'incorrect_number':
      return 'Your card number is incorrect. Please check and try again.';

    case 'invalid_expiry_month':
    case 'invalid_expiry_year':
      return "Your card's expiration date is invalid. Please check and try again.";

    case 'invalid_cvc':
      return "Your card's security code is invalid. Please check and try again.";

    case 'authentication_required':
      return 'Your card requires additional authentication. Please try again.';

    default:
      // Fall back to Stripe's message or a generic error
      return errorMessage || 'Payment failed. Please try again.';
  }
};

const TokenPurchaseForm: React.FC<TokenPurchaseFormProps> = ({
  tokenAmount,
  onSuccess,
  onError,
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Calculate cost using the new formula: (tokens/1000) - 0.01
  const calculateCost = (tokens: number) => tokens / 1000 - 0.01;
  const totalCost = calculateCost(tokenAmount);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      setError('Stripe has not loaded yet. Please try again.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Confirm payment with Stripe (payment intent already created by parent)
      const { error: stripeError } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: window.location.origin + '/ai-tokens',
        },
        redirect: 'if_required',
      });

      if (stripeError) {
        // Map Stripe error codes to user-friendly messages
        const errorMessage = getStripeErrorMessage(stripeError);
        throw new Error(errorMessage);
      }

      // Broadcast token purchase success
      window.dispatchEvent(new Event('subscription-updated'));
      window.dispatchEvent(new Event('payment-success'));

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
    <Box
      component="form"
      onSubmit={handleSubmit}
      sx={{
        mt: 2,
        p: 3,
        backgroundColor: theme =>
          theme.palette.mode === 'dark' ? theme.palette.background.paper : '#fff',
      }}
    >
      <Stack spacing={3}>
        {/* Token Purchase Summary */}
        <Box
          sx={{
            p: 2,
            backgroundColor: 'rgba(255, 0, 0, 0.05)',
            borderRadius: 1,
          }}
        >
          <Typography variant="h6" sx={{ color: 'red', fontWeight: 'bold' }}>
            Purchase {tokenAmount.toLocaleString()} Tokens - ${totalCost.toFixed(2)}
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 1 }}>
            You'll be charged ${totalCost.toFixed(2)} for {tokenAmount.toLocaleString()} additional
            tokens.
          </Typography>
        </Box>

        {/* Stripe Payment Element */}
        <Box
          sx={{
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
          }}
        >
          <Typography
            variant="body2"
            sx={{ color: '#9c27b0', display: 'flex', alignItems: 'center', gap: 1 }}
          >
            <LockOutlinedIcon sx={{ color: '#ffc107', fontSize: '1.2rem' }} />
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
          {loading
            ? 'Processing Payment...'
            : `Purchase ${tokenAmount.toLocaleString()} Tokens - $${totalCost.toFixed(2)}`}
        </Button>

        <Typography variant="caption" color="text.secondary" align="center">
          Your payment information is secure and encrypted. We never store your full card details.
        </Typography>
      </Stack>
    </Box>
  );
};

export default TokenPurchaseForm;
