import { useMemo } from 'react';
import { recentAssignments } from '../data/mockData';

interface Subscription {
  token_limit?: number;
  current_period_end?: string;
  plan_id?: string;
}

export function useTokenUsage(subscription?: Subscription | null) {
  // Billing cycle always starts on the 1st of the current month
  const now = new Date();
  const billingStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const billingEnd = now;

  // Filter assignments to only those in the current billing cycle
  const assignmentsInCycle = useMemo(
    () =>
      recentAssignments.filter(a => {
        const created = new Date(a.createdAt);
        return created >= billingStart && created < billingEnd;
      }),
    [billingStart, billingEnd]
  );

  const inferTokenLimit = (): number => {
    const pid = subscription?.plan_id;

    // Always prefer explicit mapping for test plan ids to override fallback 30k
    if (pid === 'price_test_plus') return 50000;
    if (pid === 'price_test_pro') return 75000;
    if (pid === 'price_test_max') return 100000;
    if (pid === 'price_test_free') return 30000;

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

    if (is([envFree])) return 30000;
    if (is([envPlus])) return 50000;
    if (is([envPro])) return 75000;
    if (is([envMax])) return 100000;

    return 30000;
  };

  const totalTokens = inferTokenLimit();
  const usedTokens = assignmentsInCycle.reduce((sum, a) => sum + (a.tokensUsed || 500), 0);
  const remainingTokens = totalTokens - usedTokens;
  const percentUsed = Math.round((usedTokens / totalTokens) * 100);

  return {
    totalTokens,
    usedTokens,
    remainingTokens,
    percentUsed,
    assignmentsInCycle,
  };
}
