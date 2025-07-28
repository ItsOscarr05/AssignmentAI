import { Box, BoxProps, useTheme } from '@mui/material';
import React from 'react';
import { useAspectRatio } from '../../hooks/useAspectRatio';
import { aspectRatioStyles, getAspectRatioStyle } from '../../styles/aspectRatioBreakpoints';

interface ResponsiveLayoutProps extends Omit<BoxProps, 'maxWidth'> {
  children: React.ReactNode;
  maxWidth?:
    | 'xs'
    | 'sm'
    | 'md'
    | 'lg'
    | 'xl'
    | 'ultra-wide'
    | 'wide'
    | 'standard'
    | 'square'
    | 'tall'
    | false;
  centered?: boolean;
  spacing?: number;
  padding?:
    | number
    | { xs?: number; sm?: number; md?: number; lg?: number; xl?: number }
    | Record<string, number>;
  useAspectRatio?: boolean;
}

const ResponsiveLayout: React.FC<ResponsiveLayoutProps> = ({
  children,
  maxWidth = 'lg',
  centered = true,
  spacing = 3,
  padding = { xs: 2, sm: 3, md: 4 },
  useAspectRatio: useAspectRatioMode = true,
  ...props
}) => {
  const theme = useTheme();
  const { breakpoint } = useAspectRatio();

  const getMaxWidth = () => {
    if (!maxWidth) return 'none';

    if (useAspectRatioMode) {
      // Use aspect ratio breakpoints
      const aspectRatioMaxWidths = {
        'ultra-wide': '100%',
        wide: '1400px',
        standard: '1200px',
        square: '1000px',
        tall: '800px',
      };
      return (
        aspectRatioMaxWidths[maxWidth as keyof typeof aspectRatioMaxWidths] ||
        theme.breakpoints.values[maxWidth as keyof typeof theme.breakpoints.values]
      );
    }

    // Fallback to pixel-based breakpoints
    return theme.breakpoints.values[maxWidth as keyof typeof theme.breakpoints.values];
  };

  const getPadding = () => {
    if (typeof padding === 'number') {
      return padding;
    }

    if (useAspectRatioMode) {
      // Use aspect ratio-based padding
      return getAspectRatioStyle(aspectRatioStyles.container.padding, breakpoint, 3);
    }

    // Fallback to pixel-based padding
    return {
      xs: padding.xs || 2,
      sm: padding.sm || 3,
      md: padding.md || 4,
      lg: padding.lg || 4,
      xl: padding.xl || 4,
    };
  };

  const getSpacing = () => {
    if (useAspectRatioMode) {
      return getAspectRatioStyle(aspectRatioStyles.spacing.section.padding, breakpoint, spacing);
    }
    return spacing;
  };

  return (
    <Box
      sx={{
        width: '100%',
        maxWidth: getMaxWidth(),
        mx: centered ? 'auto' : 0,
        px: getPadding(),
        py: getSpacing(),
        ...props.sx,
      }}
      {...props}
    >
      {children}
    </Box>
  );
};

export default ResponsiveLayout;
