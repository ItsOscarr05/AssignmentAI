// Utility to calculate token usage stats from assignments

export interface TokenUsage {
  label: string;
  total: number;
  used: number;
  remaining: number;
  percentUsed: number;
}

export function getTokenUsage(assignments: { createdAt: string }[]): TokenUsage {
  const totalTokens = 30000;
  const tokensPerAssignment = 500;
  const usedTokens = assignments.length * tokensPerAssignment;
  const remainingTokens = totalTokens - usedTokens;
  return {
    label: 'Free Plan (30,000 tokens/month)',
    total: totalTokens,
    used: usedTokens,
    remaining: remainingTokens,
    percentUsed: Math.round((usedTokens / totalTokens) * 100),
  };
}
