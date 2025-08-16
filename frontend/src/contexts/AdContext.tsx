import React, { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../services/api';

interface Subscription {
  plan_id?: string;
  status?: string;
}

interface AdContextType {
  showAds: boolean;
  isLoading: boolean;
}

const AdContext = createContext<AdContextType>({
  showAds: false,
  isLoading: true,
});

export const useAdContext = () => useContext(AdContext);

export const AdProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [showAds, setShowAds] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkSubscription = async () => {
      try {
        setIsLoading(true);
        // Check if we're in mock user mode
        // Test endpoints are disabled since test users are removed
        const endpoint = '/payments/subscriptions/current';

        const response = await api.get<Subscription>(endpoint);
        const subscription = response.data;

        if (subscription) {
          const envFree = (import.meta as any).env?.VITE_STRIPE_PRICE_FREE;
          setShowAds(subscription.plan_id === envFree);
        } else {
          // Default to showing ads if no subscription (free plan)
          setShowAds(true);
        }
      } catch (error) {
        console.error('Error checking subscription for ads:', error);
        // Default to showing ads on error (free plan)
        setShowAds(true);
      } finally {
        setIsLoading(false);
      }
    };

    checkSubscription();
  }, []);

  return <AdContext.Provider value={{ showAds, isLoading }}>{children}</AdContext.Provider>;
};
