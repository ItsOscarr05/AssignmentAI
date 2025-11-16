import { Box, Card, Theme, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import React, { ReactNode } from 'react';

interface CardContainerProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
  elevation?: number;
  hover?: boolean;
  clickable?: boolean;
  disabled?: boolean;
  selected?: boolean;
}

export const CardContainer: React.FC<CardContainerProps> = ({
  children,
  title,
  subtitle,
  actions,
  elevation = 1,
  hover = false,
  clickable = false,
  disabled = false,
  selected = false,
}) => {
  const theme = useTheme();

  const hoverStyle = hover
    ? {
        boxShadow:
          elevation + 2 < 25 ? `var(--mui-elevation-${elevation + 2})` : `var(--mui-elevation-${elevation})`,
        transform: clickable ? 'translateY(-2px)' : undefined,
      }
    : clickable
    ? { transform: 'translateY(-2px)' }
    : {};

  const baseStyle = {
    backgroundColor: 'var(--mui-palette-background-paper)',
    borderRadius: 'var(--mui-shape-borderRadius)',
    transition: 'box-shadow 300ms cubic-bezier(0.4, 0, 0.2, 1) 0ms,transform 300ms cubic-bezier(0.4, 0, 0.2, 1) 0ms',
    border: selected ? `2px solid ${theme.palette.primary.main}` : 'transparent',
    cursor: clickable ? 'pointer' : undefined,
    opacity: disabled ? 0.5 : undefined,
    pointerEvents: disabled ? 'none' : undefined,
  };

  return (
    <Card
      data-testid="card-container"
      elevation={elevation}
      sx={{
        backgroundColor: (theme: Theme) => theme.palette.background.paper,
        borderRadius: (theme: Theme) => theme.shape.borderRadius,
        transition: (theme: Theme) =>
          theme.transitions.create(['box-shadow', 'transform'], {
            duration: theme.transitions.duration.standard,
          }),
        ...(hover && {
          '&:hover': {
            boxShadow: (theme: Theme) => theme.shadows[elevation + 2],
          },
        }),
        ...(clickable && {
          cursor: 'pointer',
          '&:hover': {
            transform: 'translateY(-2px)',
          },
        }),
        ...(disabled && {
          opacity: 0.5,
          pointerEvents: 'none',
        }),
        ...(selected && {
          border: (theme: Theme) => `2px solid ${theme.palette.primary.main}`,
        }),
        '@media (max-width: 600px)': {
          borderRadius: 0,
        },
      }}
      style={{
        ...baseStyle,
        ...(hover || clickable
          ? {
              transition:
                'box-shadow 300ms cubic-bezier(0.4, 0, 0.2, 1) 0ms,transform 300ms cubic-bezier(0.4, 0, 0.2, 1) 0ms',
            }
          : {}),
      }}
      onMouseEnter={hover || clickable ? e => Object.assign((e.currentTarget as HTMLElement).style, hoverStyle) : undefined}
      onMouseLeave={
        hover || clickable
          ? e => {
              Object.assign((e.currentTarget as HTMLElement).style, { boxShadow: '', transform: '' });
            }
          : undefined
      }
    >
      {(title || subtitle || actions) && (
        <Box
          data-testid="card-header"
          sx={{
            p: 2,
            borderBottom: (theme: Theme) => `1px solid ${theme.palette.divider}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Box>
            {title && (
              <Typography
                variant="h6"
                component="h2"
                sx={{
                  m: 0,
                  color: (theme: Theme) => theme.palette.text.primary,
                  fontWeight: (theme: Theme) => theme.typography.fontWeightBold,
                }}
              >
                {title}
              </Typography>
            )}
            {subtitle && (
              <Typography
                variant="body2"
                sx={{
                  mt: 1,
                  color: (theme: Theme) => theme.palette.text.secondary,
                  fontWeight: (theme: Theme) => theme.typography.fontWeightRegular,
                }}
              >
                {subtitle}
              </Typography>
            )}
          </Box>
          {actions && <Box>{actions}</Box>}
        </Box>
      )}
      <Box
        data-testid="card-content"
        sx={{
          p: 2,
        }}
      >
        {children}
      </Box>
    </Card>
  );
};
