import { Box, useTheme } from '@mui/material';
import { styled } from '@mui/material/styles';
import React from 'react';

interface ResponsiveLayoutProps {
  children: React.ReactNode;
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  padding?: number | { xs?: number; sm?: number; md?: number; lg?: number; xl?: number };
  margin?: number | { xs?: number; sm?: number; md?: number; lg?: number; xl?: number };
  className?: string;
}

const StyledBox = styled(Box)(({ theme }) => ({
  width: '100%',
  margin: '0 auto',
  [theme.breakpoints.up('xs')]: {
    maxWidth: theme.breakpoints.values.xs,
  },
  [theme.breakpoints.up('sm')]: {
    maxWidth: theme.breakpoints.values.sm,
  },
  [theme.breakpoints.up('md')]: {
    maxWidth: theme.breakpoints.values.md,
  },
  [theme.breakpoints.up('lg')]: {
    maxWidth: theme.breakpoints.values.lg,
  },
  [theme.breakpoints.up('xl')]: {
    maxWidth: theme.breakpoints.values.xl,
  },
}));

const ResponsiveLayout: React.FC<ResponsiveLayoutProps> = ({
  children,
  maxWidth = 'lg',
  padding = 2,
  margin = 0,
  className,
}) => {
  const theme = useTheme();

  const getPadding = () => {
    if (typeof padding === 'number') {
      return theme.spacing(padding);
    }
    return {
      xs: theme.spacing(padding.xs || 2),
      sm: theme.spacing(padding.sm || 2),
      md: theme.spacing(padding.md || 3),
      lg: theme.spacing(padding.lg || 4),
      xl: theme.spacing(padding.xl || 4),
    };
  };

  const getMargin = () => {
    if (typeof margin === 'number') {
      return theme.spacing(margin);
    }
    return {
      xs: theme.spacing(margin.xs || 0),
      sm: theme.spacing(margin.sm || 0),
      md: theme.spacing(margin.md || 0),
      lg: theme.spacing(margin.lg || 0),
      xl: theme.spacing(margin.xl || 0),
    };
  };

  return (
    <StyledBox
      className={className}
      sx={{
        maxWidth: theme.breakpoints.values[maxWidth],
        padding: getPadding(),
        margin: getMargin(),
        display: 'flex',
        flexDirection: 'column',
        gap: theme.spacing(2),
        '& > *': {
          width: '100%',
        },
      }}
    >
      {children}
    </StyledBox>
  );
};

export default ResponsiveLayout;
