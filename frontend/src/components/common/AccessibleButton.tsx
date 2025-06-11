import { Button, ButtonProps } from '@mui/material';
import React from 'react';
import { ROLES } from '../../utils/accessibility';

interface AccessibleButtonProps extends ButtonProps {
  ariaLabel?: string;
  ariaDescribedBy?: string;
  role?: string;
  onKeyPress?: (event: React.KeyboardEvent) => void;
}

const AccessibleButton: React.FC<AccessibleButtonProps> = ({
  children,
  ariaLabel,
  ariaDescribedBy,
  role = ROLES.BUTTON,
  onKeyPress,
  onClick,
  ...props
}) => {
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onClick?.(event as any);
    }
    onKeyPress?.(event);
  };

  return (
    <Button
      role={role}
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedBy}
      onKeyDown={handleKeyDown}
      onClick={onClick}
      {...props}
    >
      {children}
    </Button>
  );
};

export default AccessibleButton;
