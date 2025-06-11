import { Grid, GridProps } from '@mui/material';
import React from 'react';

interface ResponsiveGridProps extends GridProps {
  children: React.ReactNode;
  columns?: {
    xs?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
  spacing?: number | { xs?: number; sm?: number; md?: number; lg?: number; xl?: number };
  container?: boolean;
}

const ResponsiveGrid: React.FC<ResponsiveGridProps> = ({
  children,
  columns = { xs: 1, sm: 2, md: 3, lg: 4, xl: 4 },
  spacing = 2,
  container = true,
  ...props
}) => {
  const getSpacing = () => {
    if (typeof spacing === 'number') {
      return spacing;
    }
    return {
      xs: spacing.xs || 2,
      sm: spacing.sm || 2,
      md: spacing.md || 2,
      lg: spacing.lg || 2,
      xl: spacing.xl || 2,
    };
  };

  const getColumnWidth = (breakpoint: keyof typeof columns) => {
    const cols = columns[breakpoint];
    if (!cols) return undefined;
    return Math.floor(12 / cols);
  };

  return (
    <Grid
      container={container}
      spacing={getSpacing()}
      sx={{
        width: '100%',
        ...props.sx,
      }}
      {...props}
    >
      {React.Children.map(children, child => {
        if (!React.isValidElement(child)) return null;

        return (
          <Grid
            item
            xs={getColumnWidth('xs')}
            sm={getColumnWidth('sm')}
            md={getColumnWidth('md')}
            lg={getColumnWidth('lg')}
            xl={getColumnWidth('xl')}
          >
            {child}
          </Grid>
        );
      })}
    </Grid>
  );
};

export default ResponsiveGrid;
