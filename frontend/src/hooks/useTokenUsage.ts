import { useEffect, useState } from 'react';

export type PlanType = 'Free' | 'Plus' | 'Pro' | 'Max';

interface TokenUsage {
  plan: PlanType;
  total: number;
  used: number;
  remaining: number;
  percentUsed: number;
  label: string;
}

// Mock data for demonstration; in a real app, fetch from API or context
const PLAN_LIMITS: Record<PlanType, number> = {
  Free: 30000,
  Plus: 50000,
  Pro: 75000,
  Max: 100000,
};

const MOCK_USER = {
  plan: 'Free' as PlanType,
  used: 13589,
};

export function useTokenUsage(): TokenUsage {
  const [tokenUsage] = useState<TokenUsage>(() => {
    const total = PLAN_LIMITS[MOCK_USER.plan];
    const used = MOCK_USER.used;
    const remaining = total - used;
    const percentUsed = Math.round((used / total) * 100);
    const label = `Current Plan: ${MOCK_USER.plan} (${total.toLocaleString()} tokens/mo)`;
    return { plan: MOCK_USER.plan, total, used, remaining, percentUsed, label };
  });

  // In a real app, fetch and update token usage here
  useEffect(() => {
    // Fetch logic here if needed
  }, []);

  return tokenUsage;
}
