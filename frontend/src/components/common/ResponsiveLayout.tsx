import { Box, BoxProps, useTheme } from '@mui/material';
import React from 'react';

interface ResponsiveLayoutProps extends Omit<BoxProps, 'maxWidth'> {
  children: React.ReactNode;
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | false;
  centered?: boolean;
  spacing?: number;
  padding?: number | { xs?: number; sm?: number; md?: number; lg?: number; xl?: number };
}

const ResponsiveLayout: React.FC<ResponsiveLayoutProps> = ({
  children,
  maxWidth = 'lg',
  centered = true,
  spacing = 3,
  padding = { xs: 2, sm: 3, md: 4 },
  ...props
}) => {
  const theme = useTheme();

  const getMaxWidth = () => {
    if (!maxWidth) return 'none';
    return theme.breakpoints.values[maxWidth];
  };

  const getPadding = () => {
    if (typeof padding === 'number') {
      return padding;
    }
    return {
      xs: padding.xs || 2,
      sm: padding.sm || 3,
      md: padding.md || 4,
      lg: padding.lg || 4,
      xl: padding.xl || 4,
    };
  };

  return (
    <Box
      sx={{
        width: '100%',
        maxWidth: getMaxWidth(),
        mx: centered ? 'auto' : 0,
        px: getPadding(),
        py: spacing,
        ...props.sx,
      }}
      {...props}
    >
      {children}
    </Box>
  );
};

export default ResponsiveLayout;
