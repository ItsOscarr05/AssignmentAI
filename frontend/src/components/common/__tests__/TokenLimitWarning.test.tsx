import { render, screen } from '@testing-library/react';
import React from 'react';
import { TokenLimitProvider } from '../../../contexts/TokenLimitContext';
import { TokenLimitWarning } from '../TokenLimitWarning';

// Mock the useTokenLimit hook
jest.mock('../../../hooks/useTokenLimit', () => ({
  useTokenLimit: () => ({
    subscription: { token_limit: 30000 },
    tokenUsage: {
      total: 30000,
      used: 25000,
      remaining: 5000,
      percentUsed: 83,
      label: 'Free Plan (30,000 tokens/month)',
    },
    loading: false,
    error: null,
    checkTokenLimit: (tokensNeeded: number) => ({
      hasEnoughTokens: tokensNeeded <= 5000,
      remainingTokens: 5000,
      tokensNeeded,
      error: tokensNeeded > 5000 ? 'Insufficient tokens' : undefined,
    }),
    refreshTokenData: jest.fn(),
    hasEnoughTokens: (tokensNeeded: number) => tokensNeeded <= 5000,
  }),
}));

const renderWithProvider = (component: React.ReactElement) => {
  return render(<TokenLimitProvider>{component}</TokenLimitProvider>);
};

describe('TokenLimitWarning', () => {
  it('renders nothing when user has enough tokens', () => {
    renderWithProvider(<TokenLimitWarning tokensNeeded={1000} />);

    // Should not show warning for 1000 tokens when user has 5000 remaining
    expect(screen.queryByText('Token Usage Warning')).not.toBeInTheDocument();
  });

  it('renders warning when user has insufficient tokens', () => {
    renderWithProvider(<TokenLimitWarning tokensNeeded={10000} />);

    expect(screen.getByText('Low Token Balance')).toBeInTheDocument();
    expect(screen.getByText(/This operation requires 10,000 tokens/)).toBeInTheDocument();
    expect(screen.getByText(/You have 5,000 remaining/)).toBeInTheDocument();
  });

  it('renders error when user has no tokens remaining', () => {
    renderWithProvider(<TokenLimitWarning tokensNeeded={1000} />);

    // Mock the hook to return 0 remaining tokens
    jest.doMock('../../../hooks/useTokenLimit', () => ({
      useTokenLimit: () => ({
        subscription: { token_limit: 30000 },
        tokenUsage: {
          total: 30000,
          used: 30000,
          remaining: 0,
          percentUsed: 100,
          label: 'Free Plan (30,000 tokens/month)',
        },
        loading: false,
        error: null,
        checkTokenLimit: (tokensNeeded: number) => ({
          hasEnoughTokens: false,
          remainingTokens: 0,
          tokensNeeded,
          error: 'Insufficient tokens',
        }),
        refreshTokenData: jest.fn(),
        hasEnoughTokens: () => false,
      }),
    }));

    renderWithProvider(<TokenLimitWarning tokensNeeded={1000} />);

    expect(screen.getByText('Token Limit Exceeded')).toBeInTheDocument();
    expect(screen.getByText(/You have exceeded your monthly token limit/)).toBeInTheDocument();
  });

  it('shows upgrade button when showUpgradeButton is true', () => {
    renderWithProvider(<TokenLimitWarning tokensNeeded={10000} showUpgradeButton={true} />);

    expect(screen.getByText('Upgrade Plan')).toBeInTheDocument();
  });

  it('hides upgrade button when showUpgradeButton is false', () => {
    renderWithProvider(<TokenLimitWarning tokensNeeded={10000} showUpgradeButton={false} />);

    expect(screen.queryByText('Upgrade Plan')).not.toBeInTheDocument();
  });

  it('calls custom upgrade handler when provided', () => {
    const mockUpgradeHandler = jest.fn();
    renderWithProvider(<TokenLimitWarning tokensNeeded={10000} onUpgrade={mockUpgradeHandler} />);

    const upgradeButton = screen.getByText('Upgrade Plan');
    upgradeButton.click();

    expect(mockUpgradeHandler).toHaveBeenCalled();
  });

  it('shows token usage progress bar', () => {
    renderWithProvider(<TokenLimitWarning tokensNeeded={10000} />);

    expect(screen.getByText('Token Usage')).toBeInTheDocument();
    expect(screen.getByText('5,000 / 30,000')).toBeInTheDocument();
  });
});
