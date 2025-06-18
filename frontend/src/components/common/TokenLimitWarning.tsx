import { Error as ErrorIcon, Warning as WarningIcon } from '@mui/icons-material';
import { Alert, AlertTitle, Box, Button, Chip, LinearProgress, Typography } from '@mui/material';
import React from 'react';
import { useTokenLimitContext } from '../../contexts/TokenLimitContext';

interface TokenLimitWarningProps {
  tokensNeeded: number;
  showUpgradeButton?: boolean;
  variant?: 'warning' | 'error' | 'info';
  onUpgrade?: () => void;
}

export const TokenLimitWarning: React.FC<TokenLimitWarningProps> = ({
  tokensNeeded,
  showUpgradeButton = true,
  variant = 'warning',
  onUpgrade,
}) => {
  const { tokenUsage, checkTokenLimit, loading } = useTokenLimitContext();

  if (loading || !tokenUsage) {
    return null;
  }

  const tokenCheck = checkTokenLimit(tokensNeeded);
  const { hasEnoughTokens, remainingTokens } = tokenCheck;

  // Don't show warning if user has enough tokens
  if (hasEnoughTokens) {
    return null;
  }

  const isCritical = remainingTokens <= 0;
  const isLow = remainingTokens < tokensNeeded * 2; // Less than 2x the needed tokens

  const getVariant = () => {
    if (isCritical) return 'error';
    if (isLow) return 'warning';
    return variant;
  };

  const getIcon = () => {
    if (isCritical) return <ErrorIcon />;
    return <WarningIcon />;
  };

  const getTitle = () => {
    if (isCritical) return 'Token Limit Exceeded';
    if (isLow) return 'Low Token Balance';
    return 'Token Usage Warning';
  };

  const getMessage = () => {
    if (isCritical) {
      return `You have exceeded your monthly token limit. This operation requires ${tokensNeeded.toLocaleString()} tokens, but you only have ${remainingTokens.toLocaleString()} remaining.`;
    }
    if (isLow) {
      return `This operation requires ${tokensNeeded.toLocaleString()} tokens. You have ${remainingTokens.toLocaleString()} remaining. Consider upgrading your plan for more tokens.`;
    }
    return `This operation requires ${tokensNeeded.toLocaleString()} tokens. You have ${remainingTokens.toLocaleString()} remaining.`;
  };

  const handleUpgrade = () => {
    if (onUpgrade) {
      onUpgrade();
    } else {
      // Default upgrade action
      window.location.href = '/dashboard/price-plan';
    }
  };

  return (
    <Alert
      severity={getVariant()}
      icon={getIcon()}
      sx={{ mb: 2 }}
      action={
        showUpgradeButton && (
          <Button color="inherit" size="small" onClick={handleUpgrade} sx={{ ml: 1 }}>
            Upgrade Plan
          </Button>
        )
      }
    >
      <AlertTitle>{getTitle()}</AlertTitle>
      <Typography variant="body2" sx={{ mb: 1 }}>
        {getMessage()}
      </Typography>

      <Box sx={{ mt: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="caption" color="text.secondary">
            Token Usage
          </Typography>
          <Chip
            label={`${remainingTokens.toLocaleString()} / ${tokenUsage.total.toLocaleString()}`}
            size="small"
            color={isCritical ? 'error' : isLow ? 'warning' : 'default'}
            variant="outlined"
          />
        </Box>
        <LinearProgress
          variant="determinate"
          value={tokenUsage.percentUsed}
          color={isCritical ? 'error' : isLow ? 'warning' : 'primary'}
          sx={{ height: 6, borderRadius: 3 }}
        />
      </Box>
    </Alert>
  );
};
