import React, { createContext, useContext, useEffect, useState } from 'react';
import { paymentService } from '../services/paymentService';

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
        const subscription = await paymentService.getCurrentSubscription();
        setShowAds(subscription.plan_id === 'price_free');
      } catch (error) {
        console.error('Error checking subscription:', error);
        setShowAds(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkSubscription();
  }, []);

  return <AdContext.Provider value={{ showAds, isLoading }}>{children}</AdContext.Provider>;
};
