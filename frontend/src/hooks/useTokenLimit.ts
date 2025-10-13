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
  const fetchSubscriptionData = useCallback(async (retryCount = 0) => {
    try {
      setLoading(true);
      setError(null);

      // Check if we're in mock user mode
      // Test endpoints are disabled since test users are removed
      const endpoint = '/payments/subscriptions/current';

      try {
        const response = await api.get<Subscription>(endpoint);
        console.log('useTokenLimit: Raw subscription response:', response.data);
        setSubscription(response.data);
        console.log('useTokenLimit: Subscription set successfully:', response.data);
      } catch (err) {
        console.error(`useTokenLimit: subscription fetch failed (attempt ${retryCount + 1}):`, err);

        // Retry once after a short delay for network issues
        if (retryCount === 0) {
          console.log('useTokenLimit: Retrying subscription fetch...');
          await new Promise(resolve => setTimeout(resolve, 1000));
          return fetchSubscriptionData(1);
        }

        // Don't try the same endpoint again - this was causing issues
        // Just rethrow the error to be handled by the outer catch
        throw err;
      }
    } catch (err) {
      console.error('Failed to fetch subscription data:', err);
      setError('Failed to load subscription data');

      // Don't automatically reset to null on API errors
      // This prevents losing valid subscription data due to temporary network issues
      // Only set to null if this is the initial load (subscription is already null)
      setSubscription(prev => {
        if (prev === null) {
          console.log('useTokenLimit: No existing subscription, setting to null due to API error');
          return null;
        } else {
          console.log('useTokenLimit: Keeping existing subscription due to API error:', prev);
          return prev;
        }
      });
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch token usage data
  const fetchTokenUsage = useCallback(
    async (currentSubscription?: Subscription | null) => {
      const mapPlanToLimit = (planId?: string): number => {
        if (planId === 'price_test_plus') return 250000;
        if (planId === 'price_test_pro') return 500000;
        if (planId === 'price_test_max') return 1000000;
        if (planId === 'price_test_free') return 100000;

        const envPlus = (import.meta as any).env?.VITE_STRIPE_PRICE_PLUS;
        const envPro = (import.meta as any).env?.VITE_STRIPE_PRICE_PRO;
        const envMax = (import.meta as any).env?.VITE_STRIPE_PRICE_MAX;
        const envFree = (import.meta as any).env?.VITE_STRIPE_PRICE_FREE;

        const is = (ids: Array<string | undefined>) =>
          ids.filter(Boolean).includes(planId as string);

        if (is([envFree])) return 100000;
        if (is([envPlus])) return 250000;
        if (is([envPro])) return 500000;
        if (is([envMax])) return 1000000;

        return 100000;
      };

      const mapPlanToName = (planId?: string, tokenLimit?: number): string => {
        console.log('mapPlanToName called with:', { planId, tokenLimit });

        // Test plan IDs
        if (planId === 'price_test_plus') return 'Plus';
        if (planId === 'price_test_pro') return 'Pro';
        if (planId === 'price_test_max') return 'Max';
        if (planId === 'price_test_free') return 'Free';

        // Environment variable plan IDs
        const envPlus = (import.meta as any).env?.VITE_STRIPE_PRICE_PLUS;
        const envPro = (import.meta as any).env?.VITE_STRIPE_PRICE_PRO;
        const envMax = (import.meta as any).env?.VITE_STRIPE_PRICE_MAX;
        const envFree = (import.meta as any).env?.VITE_STRIPE_PRICE_FREE;

        const is = (ids: Array<string | undefined>) =>
          ids.filter(Boolean).includes(planId as string);

        if (is([envFree])) return 'Free';
        if (is([envPlus])) return 'Plus';
        if (is([envPro])) return 'Pro';
        if (is([envMax])) return 'Max';

        // Handle real Stripe plan IDs by checking token limits
        // Use the passed tokenLimit parameter instead of subscription from outer scope
        if (tokenLimit) {
          console.log('Using token limit to determine plan:', tokenLimit);
          if (tokenLimit >= 1000000) return 'Max';
          if (tokenLimit >= 500000) return 'Pro';
          if (tokenLimit >= 250000) return 'Plus';
          if (tokenLimit >= 100000) return 'Free';
        }

        // Default to Free if we can't determine the plan
        console.log('Defaulting to Free plan');
        return 'Free';
      };
      try {
        const response = await api.get('/usage/tokens', {
          params: { period: 'monthly' },
        });

        // Use the passed subscription parameter or fall back to the state
        const activeSubscription = currentSubscription || subscription;
        console.log(
          'useTokenLimit: Active subscription for token calculation:',
          activeSubscription
        );
        console.log('useTokenLimit: Current subscription state:', subscription);
        console.log('useTokenLimit: Passed subscription parameter:', currentSubscription);

        const total =
          activeSubscription?.token_limit && activeSubscription.token_limit > 0
            ? activeSubscription.token_limit
            : mapPlanToLimit(activeSubscription?.plan_id);
        const used = response.data.total_tokens || 0;
        const remaining = total - used;

        const planName = mapPlanToName(
          activeSubscription?.plan_id,
          activeSubscription?.token_limit
        );
        const label = activeSubscription
          ? `${planName} Plan (${total.toLocaleString()} tokens/month)`
          : 'Free Plan (100,000 tokens/month)';

        console.log('useTokenLimit: Calculated plan name:', planName);
        console.log('useTokenLimit: Final label:', label);

        setTokenUsage({
          total,
          used,
          remaining,
          percentUsed: Math.round((used / total) * 100),
          label,
        });
      } catch (err) {
        console.error('Failed to fetch token usage:', err);
        // Fallback to mock data if API fails
        const activeSubscription = currentSubscription || subscription;

        const total =
          activeSubscription?.token_limit && activeSubscription.token_limit > 0
            ? activeSubscription.token_limit
            : mapPlanToLimit(activeSubscription?.plan_id);
        setTokenUsage({
          total,
          used: 0,
          remaining: total,
          percentUsed: 0,
          label: activeSubscription
            ? `${mapPlanToName(
                activeSubscription.plan_id,
                activeSubscription.token_limit
              )} Plan (${total.toLocaleString()} tokens/month)`
            : 'Free Plan (100,000 tokens/month)',
        });
      }
    },
    [subscription]
  );

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
    await fetchTokenUsage(subscription);
  }, [fetchSubscriptionData, fetchTokenUsage, subscription]);

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
      fetchTokenUsage(subscription);
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
