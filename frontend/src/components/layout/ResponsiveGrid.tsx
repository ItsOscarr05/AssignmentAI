import { Grid, useTheme } from '@mui/material';
import React from 'react';

interface ResponsiveGridProps {
  children: React.ReactNode;
  columns?: {
    xs?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
  spacing?: number | { xs?: number; sm?: number; md?: number; lg?: number; xl?: number };
  className?: string;
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
}) => {
  const theme = useTheme();

  const getSpacing = () => {
    if (typeof spacing === 'number') {
      return theme.spacing(spacing);
    }
    return {
      xs: theme.spacing(spacing.xs || 2),
      sm: theme.spacing(spacing.sm || 2),
      md: theme.spacing(spacing.md || 3),
      lg: theme.spacing(spacing.lg || 3),
      xl: theme.spacing(spacing.xl || 3),
    };
  };

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
          xs={12 / (columns.xs || defaultColumns.xs)}
          sm={12 / (columns.sm || defaultColumns.sm)}
          md={12 / (columns.md || defaultColumns.md)}
          lg={12 / (columns.lg || defaultColumns.lg)}
          xl={12 / (columns.xl || defaultColumns.xl)}
        >
          {child}
        </Grid>
      ))}
    </Grid>
  );
};

export default ResponsiveGrid;
