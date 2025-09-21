import { useEffect, useMemo, useState } from 'react';
import { api } from '../services/api';

interface Subscription {
  token_limit?: number;
  current_period_end?: string;
  plan_id?: string;
}

interface TokenUsageData {
  total_tokens: number;
  period: string;
  start_date: string;
  end_date: string;
  feature_usage: {
    [feature: string]: {
      tokens_used: number;
      requests_made: number;
    };
  };
}

export function useTokenUsage(subscription?: Subscription | null) {
  const [tokenUsageData, setTokenUsageData] = useState<TokenUsageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch token usage data from API
  useEffect(() => {
    const fetchTokenUsage = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await api.get('/usage/tokens', {
          params: { period: 'monthly' },
        });
        setTokenUsageData(response.data);
      } catch (err) {
        console.error('Failed to fetch token usage:', err);
        setError('Failed to load token usage data');
        // Fallback to empty data
        setTokenUsageData({
          total_tokens: 0,
          period: 'monthly',
          start_date: new Date().toISOString(),
          end_date: new Date().toISOString(),
          feature_usage: {},
        });
      } finally {
        setLoading(false);
      }
    };

    fetchTokenUsage();
  }, []);

  const inferTokenLimit = (): number => {
    const pid = subscription?.plan_id;

    // Always prefer explicit mapping for test plan ids to override fallback
    if (pid === 'price_test_plus') return 200000;
    if (pid === 'price_test_pro') return 400000;
    if (pid === 'price_test_max') return 800000;
    if (pid === 'price_test_free') return 100000;

    // Otherwise, if backend provides a positive token_limit, use it
    if (subscription?.token_limit && subscription.token_limit > 0) {
      return subscription.token_limit;
    }

    // Map canonical and env price ids
    const envPlus = (import.meta as any).env?.VITE_STRIPE_PRICE_PLUS;
    const envPro = (import.meta as any).env?.VITE_STRIPE_PRICE_PRO;
    const envMax = (import.meta as any).env?.VITE_STRIPE_PRICE_MAX;
    const envFree = (import.meta as any).env?.VITE_STRIPE_PRICE_FREE;

    const is = (ids: Array<string | undefined>) => ids.filter(Boolean).includes(pid as string);

    if (is([envFree])) return 100000;
    if (is([envPlus])) return 200000;
    if (is([envPro])) return 400000;
    if (is([envMax])) return 800000;

    return 100000;
  };

  const totalTokens = inferTokenLimit();
  const usedTokens = tokenUsageData?.total_tokens || 0;
  const remainingTokens = totalTokens - usedTokens;
  const percentUsed = Math.round((usedTokens / totalTokens) * 100);

  // Create assignments-like data for compatibility
  const assignmentsInCycle = useMemo(() => {
    if (!tokenUsageData) return [];

    return Object.entries(tokenUsageData.feature_usage).map(([feature, usage], index) => ({
      id: `usage-${index}`,
      title: feature.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      createdAt: tokenUsageData.start_date,
      tokensUsed: usage.tokens_used,
      type: 'ai_usage',
    }));
  }, [tokenUsageData]);

  return {
    totalTokens,
    usedTokens,
    remainingTokens,
    percentUsed,
    assignmentsInCycle,
    loading,
    error,
    tokenUsageData,
  };
}
