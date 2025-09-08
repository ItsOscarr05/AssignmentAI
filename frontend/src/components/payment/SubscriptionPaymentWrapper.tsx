import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import SimplePaymentForm from './SimplePaymentForm';

const stripePromise = loadStripe(
  import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY ||
    'pk_test_51RYem5BGydvd9sZlgu1k8rVc5y13Y0uVJ1sTjdDe3Ao2CLwgcSiG03GYxtYBLrz1tjN15d1PK38QAqnkf9YMy3HZ00hap3ZOqt'
);

interface SubscriptionPaymentWrapperProps {
  priceId: string;
  planName: string;
  planPrice: number;
  onSuccess: () => void;
  onError: (error: string) => void;
  isUpgrade?: boolean;
}

const SubscriptionPaymentWrapper: React.FC<SubscriptionPaymentWrapperProps> = ({
  priceId,
  planName,
  planPrice,
  onSuccess,
  onError,
  isUpgrade = false,
}) => {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const createPaymentIntent = async () => {
      try {
        const { data } = await api.post('/payments/create-subscription-payment-intent', {
          price_id: priceId,
          is_upgrade: isUpgrade,
        });
        setClientSecret(data.client_secret);
      } catch (err: any) {
        const errorMessage = err.response?.data?.message || err.message || 'Failed to initialize payment';
        setError(errorMessage);
        onError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    createPaymentIntent();
  }, [priceId, isUpgrade, onError]);

  if (loading) {
    return <div>Loading payment form...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (!clientSecret) {
    return <div>Failed to initialize payment</div>;
  }

  return (
    <Elements stripe={stripePromise} options={{ clientSecret }}>
      <SimplePaymentForm
        planName={planName}
        planPrice={planPrice}
        priceId={priceId}
        onSuccess={onSuccess}
        onError={onError}
      />
    </Elements>
  );
};

export default SubscriptionPaymentWrapper;
