import { Box, Card, Theme, Typography } from '@mui/material';
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
  // All interactive styles handled via sx; avoid imperative style mutations

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
            boxShadow: (theme: Theme) =>
              theme.shadows[Math.min(elevation + 2, theme.shadows.length - 1)],
            ...(clickable && { transform: 'translateY(-2px)' }),
          },
        }),
        ...(clickable && {
          cursor: 'pointer',
          ...(hover
            ? {}
            : {
                '&:hover': {
                  transform: 'translateY(-2px)',
                },
              }),
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
