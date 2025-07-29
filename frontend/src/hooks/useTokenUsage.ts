import { useMemo } from 'react';
import { recentAssignments } from '../data/mockData';

interface Subscription {
  token_limit?: number;
  current_period_end?: string;
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

  const totalTokens = subscription?.token_limit ?? 30000;
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
