import { useCallback, useEffect, useState } from 'react';
import { api } from '../services/api';

interface Subscription {
  id: string;
  status: 'active' | 'canceled' | 'past_due' | 'trialing';
  plan_id: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  token_limit: number;
}

interface TokenUsage {
  total: number;
  used: number;
  remaining: number;
  percentUsed: number;
  label: string;
}

interface TokenLimitResult {
  hasEnoughTokens: boolean;
  remainingTokens: number;
  tokensNeeded: number;
  error?: string;
}

export const useTokenLimit = () => {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [tokenUsage, setTokenUsage] = useState<TokenUsage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch subscription data
  const fetchSubscriptionData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Check if we're in mock user mode
      const isMockUser = localStorage.getItem('isMockUser') === 'true';
      const endpoint = isMockUser
        ? '/payments/subscriptions/current/test'
        : '/payments/subscriptions/current';

      try {
        const response = await api.get<Subscription>(endpoint);
        setSubscription(response.data);
        console.log('useTokenLimit: subscription response', response.data);
      } catch (err) {
        console.warn('useTokenLimit: primary subscription fetch failed, trying test endpoint');
        const response2 = await api.get<Subscription>('/payments/subscriptions/current/test');
        setSubscription(response2.data);
        console.log('useTokenLimit: fallback subscription response', response2.data);
      }
    } catch (err) {
      console.error('Failed to fetch subscription data:', err);
      setError('Failed to load subscription data');
      // Ensure we default to free plan if subscription fetch fails
      setSubscription(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch token usage data
  const fetchTokenUsage = useCallback(async () => {
    const mapPlanToLimit = (planId?: string): number => {
      if (planId === 'price_test_plus') return 50000;
      if (planId === 'price_test_pro') return 75000;
      if (planId === 'price_test_max') return 100000;
      if (planId === 'price_test_free') return 30000;

      const envPlus = (import.meta as any).env?.VITE_STRIPE_PRICE_PLUS;
      const envPro = (import.meta as any).env?.VITE_STRIPE_PRICE_PRO;
      const envMax = (import.meta as any).env?.VITE_STRIPE_PRICE_MAX;
      const envFree = (import.meta as any).env?.VITE_STRIPE_PRICE_FREE;

      const is = (ids: Array<string | undefined>) => ids.filter(Boolean).includes(planId as string);

      if (is([envFree])) return 30000;
      if (is([envPlus])) return 50000;
      if (is([envPro])) return 75000;
      if (is([envMax])) return 100000;

      return 30000;
    };
    try {
      const response = await api.get('/usage/summary', {
        params: { period: 'monthly' },
      });

      const total =
        subscription?.token_limit && subscription.token_limit > 0
          ? subscription.token_limit
          : mapPlanToLimit(subscription?.plan_id);
      const used = response.data.total_tokens || 0;
      const remaining = total - used;

      setTokenUsage({
        total,
        used,
        remaining,
        percentUsed: Math.round((used / total) * 100),
        label: subscription
          ? `${subscription.plan_id} Plan (${total.toLocaleString()} tokens/month)`
          : 'Free Plan (30,000 tokens/month)',
      });
    } catch (err) {
      console.error('Failed to fetch token usage:', err);
      // Fallback to mock data if API fails
      const total =
        subscription?.token_limit && subscription.token_limit > 0
          ? subscription.token_limit
          : mapPlanToLimit(subscription?.plan_id);
      setTokenUsage({
        total,
        used: 0,
        remaining: total,
        percentUsed: 0,
        label: subscription
          ? `${subscription.plan_id} Plan (${total.toLocaleString()} tokens/month)`
          : 'Free Plan (30,000 tokens/month)',
      });
    }
  }, [subscription]);

  // Check if user has enough tokens for a specific operation
  const checkTokenLimit = useCallback(
    (tokensNeeded: number): TokenLimitResult => {
      if (!tokenUsage) {
        return {
          hasEnoughTokens: false,
          remainingTokens: 0,
          tokensNeeded,
          error: 'Token usage data not available',
        };
      }

      const hasEnoughTokens = tokenUsage.remaining >= tokensNeeded;

      return {
        hasEnoughTokens,
        remainingTokens: tokenUsage.remaining,
        tokensNeeded,
        error: hasEnoughTokens ? undefined : 'Insufficient tokens',
      };
    },
    [tokenUsage]
  );

  // Refresh token data
  const refreshTokenData = useCallback(async () => {
    await fetchSubscriptionData();
    await fetchTokenUsage();
  }, [fetchSubscriptionData, fetchTokenUsage]);

  // Initialize data
  useEffect(() => {
    fetchSubscriptionData();

    // Listen for subscription changes (e.g., after upgrade)
    const handler = () => {
      refreshTokenData();
    };
    window.addEventListener('subscription-updated', handler);
    return () => window.removeEventListener('subscription-updated', handler);
  }, [fetchSubscriptionData]);

  useEffect(() => {
    if (subscription) {
      fetchTokenUsage();
    }
  }, [subscription, fetchTokenUsage]);

  return {
    subscription,
    tokenUsage,
    loading,
    error,
    checkTokenLimit,
    refreshTokenData,
    hasEnoughTokens: (tokensNeeded: number) => checkTokenLimit(tokensNeeded).hasEnoughTokens,
  };
};
