import React, { createContext, ReactNode, useContext } from 'react';
import { useTokenLimit } from '../hooks/useTokenLimit';

interface TokenLimitContextType {
  subscription: any;
  tokenUsage: any;
  loading: boolean;
  error: string | null;
  checkTokenLimit: (tokensNeeded: number) => {
    hasEnoughTokens: boolean;
    remainingTokens: number;
    tokensNeeded: number;
    error?: string;
  };
  refreshTokenData: () => Promise<void>;
  hasEnoughTokens: (tokensNeeded: number) => boolean;
}

const TokenLimitContext = createContext<TokenLimitContextType | undefined>(undefined);

interface TokenLimitProviderProps {
  children: ReactNode;
}

export const TokenLimitProvider: React.FC<TokenLimitProviderProps> = ({ children }) => {
  const tokenLimitData = useTokenLimit();

  return <TokenLimitContext.Provider value={tokenLimitData}>{children}</TokenLimitContext.Provider>;
};

export const useTokenLimitContext = () => {
  const context = useContext(TokenLimitContext);
  if (context === undefined) {
    throw new Error('useTokenLimitContext must be used within a TokenLimitProvider');
  }
  return context;
};
