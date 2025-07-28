import { Grid, useTheme } from '@mui/material';
import React from 'react';
import { useAspectRatio } from '../../hooks/useAspectRatio';
import { aspectRatioStyles, getAspectRatioStyle } from '../../styles/aspectRatioBreakpoints';

interface ResponsiveGridProps {
  children: React.ReactNode;
  columns?:
    | {
        xs?: number;
        sm?: number;
        md?: number;
        lg?: number;
        xl?: number;
      }
    | Record<string, number>;
  spacing?:
    | number
    | { xs?: number; sm?: number; md?: number; lg?: number; xl?: number }
    | Record<string, number>;
  className?: string;
  useAspectRatio?: boolean;
}

const defaultColumns = {
  xs: 1,
  sm: 2,
  md: 3,
  lg: 4,
  xl: 4,
};

const ResponsiveGrid: React.FC<ResponsiveGridProps> = ({
  children,
  columns = defaultColumns,
  spacing = 2,
  className,
  useAspectRatio: useAspectRatioMode = true,
}) => {
  const theme = useTheme();
  const { breakpoint } = useAspectRatio();

  const getSpacing = () => {
    if (typeof spacing === 'number') {
      if (useAspectRatioMode) {
        return getAspectRatioStyle(aspectRatioStyles.grid.gap, breakpoint, spacing);
      }
      return theme.spacing(spacing);
    }

    if (useAspectRatioMode) {
      return getAspectRatioStyle(aspectRatioStyles.grid.gap, breakpoint, 2);
    }

    return {
      xs: theme.spacing(spacing.xs || 2),
      sm: theme.spacing(spacing.sm || 2),
      md: theme.spacing(spacing.md || 3),
      lg: theme.spacing(spacing.lg || 3),
      xl: theme.spacing(spacing.xl || 3),
    };
  };

  const getColumns = () => {
    if (useAspectRatioMode) {
      const aspectRatioColumns = getAspectRatioStyle(aspectRatioStyles.grid.columns, breakpoint, 2);
      return {
        xs: aspectRatioColumns,
        sm: aspectRatioColumns,
        md: aspectRatioColumns,
        lg: aspectRatioColumns,
        xl: aspectRatioColumns,
      };
    }

    return {
      xs: columns.xs || defaultColumns.xs,
      sm: columns.sm || defaultColumns.sm,
      md: columns.md || defaultColumns.md,
      lg: columns.lg || defaultColumns.lg,
      xl: columns.xl || defaultColumns.xl,
    };
  };

  const currentColumns = getColumns();

  return (
    <Grid
      container
      spacing={getSpacing()}
      className={className}
      sx={{
        width: '100%',
        margin: 0,
        '& > .MuiGrid-item': {
          paddingTop: 0,
        },
      }}
    >
      {React.Children.map(children, child => (
        <Grid
          item
          xs={12 / (currentColumns.xs || defaultColumns.xs)}
          sm={12 / (currentColumns.sm || defaultColumns.sm)}
          md={12 / (currentColumns.md || defaultColumns.md)}
          lg={12 / (currentColumns.lg || defaultColumns.lg)}
          xl={12 / (currentColumns.xl || defaultColumns.xl)}
        >
          {child}
        </Grid>
      ))}
    </Grid>
  );
};

export default ResponsiveGrid;
