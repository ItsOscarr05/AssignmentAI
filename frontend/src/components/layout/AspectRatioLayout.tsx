import { Box, BoxProps, useTheme } from '@mui/material';
import React from 'react';
import { useAspectRatio } from '../../hooks/useAspectRatio';
import { aspectRatioStyles, getAspectRatioStyle } from '../../styles/aspectRatioBreakpoints';

interface AspectRatioLayoutProps extends Omit<BoxProps, 'maxWidth'> {
  children: React.ReactNode;
  maxWidth?: 'ultra-wide' | 'wide' | 'standard' | 'square' | 'tall' | false;
  centered?: boolean;
  spacing?: number | { [key: string]: number };
  padding?: number | { [key: string]: number };
  columns?: number | { [key: string]: number };
  gap?: number | { [key: string]: number };
  className?: string;
}

const AspectRatioLayout: React.FC<AspectRatioLayoutProps> = ({
  children,
  maxWidth = 'wide',
  centered = true,
  spacing = 3,
  padding,
  columns,
  gap,
  className,
  ...props
}) => {
  const theme = useTheme();
  const { breakpoint } = useAspectRatio();

  const getMaxWidth = () => {
    if (!maxWidth) return 'none';
    return getAspectRatioStyle(aspectRatioStyles.container.maxWidth, breakpoint, '100%');
  };

  const getSpacing = () => {
    if (typeof spacing === 'number') {
      return theme.spacing(spacing);
    }
    return theme.spacing(getAspectRatioStyle(spacing, breakpoint, 3));
  };

  const getPadding = () => {
    if (typeof padding === 'number') {
      return theme.spacing(padding);
    }
    if (padding) {
      return theme.spacing(getAspectRatioStyle(padding, breakpoint, 3));
    }
    return theme.spacing(getAspectRatioStyle(aspectRatioStyles.container.padding, breakpoint, 3));
  };

  const getColumns = () => {
    if (typeof columns === 'number') {
      return columns;
    }
    if (columns) {
      return getAspectRatioStyle(columns, breakpoint, 1);
    }
    return getAspectRatioStyle(aspectRatioStyles.grid.columns, breakpoint, 1);
  };

  const getGap = () => {
    if (typeof gap === 'number') {
      return theme.spacing(gap);
    }
    if (gap) {
      return theme.spacing(getAspectRatioStyle(gap, breakpoint, 2));
    }
    return theme.spacing(getAspectRatioStyle(aspectRatioStyles.grid.gap, breakpoint, 2));
  };

  const currentColumns = getColumns();
  const currentGap = getGap();

  return (
    <Box
      className={className}
      sx={{
        width: '100%',
        maxWidth: getMaxWidth(),
        mx: centered ? 'auto' : 0,
        px: getPadding(),
        py: getSpacing(),
        display: 'grid',
        gridTemplateColumns: `repeat(${currentColumns}, 1fr)`,
        gap: currentGap,
        ...props.sx,
      }}
      {...props}
    >
      {children}
    </Box>
  );
};

export default AspectRatioLayout;
