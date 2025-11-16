import { Box, Paper, Typography } from '@mui/material';
import React from 'react';

interface SectionContainerProps {
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  variant?: 'default' | 'outlined' | 'elevated' | 'interactive';
  children: React.ReactNode;
}

export const SectionContainer: React.FC<SectionContainerProps> = ({
  title,
  subtitle,
  actions,
  variant = 'default',
  children,
}) => {
  const baseStyle = {
    padding: '24px',
    marginBottom: '24px',
    backgroundColor: 'var(--mui-palette-background-paper)',
    borderRadius: 'var(--mui-shape-borderRadius)',
  };

  const variantStyles =
    variant === 'outlined'
      ? { border: '1px solid', borderColor: 'var(--mui-palette-divider)' }
      : variant === 'elevated'
      ? { boxShadow: 'var(--mui-elevation-1)' }
      : variant === 'interactive'
      ? { cursor: 'pointer', transition: 'background-color 0.2s' }
      : {};

  const titleStyle = {
    margin: '0',
    color: 'var(--mui-palette-text-primary)',
    fontWeight: 'bold',
  };

  const subtitleStyle = {
    marginTop: '8px',
    color: 'var(--mui-palette-text-secondary)',
  };

  return (
    <Paper
      data-testid="section-container"
      sx={{
        p: 3,
        mb: 3,
        backgroundColor: 'background.paper',
        borderRadius: 1,
        ...(variant === 'outlined' && { border: '1px solid', borderColor: 'divider' }),
        ...(variant === 'elevated' && { boxShadow: 1 }),
        ...(variant === 'interactive' && {
          cursor: 'pointer',
          transition: 'background-color 0.2s',
          '&:hover': {
            backgroundColor: 'action.hover',
          },
        }),
        '&:last-child': {
          mb: 0,
        },
      }}
      style={{ ...baseStyle, ...variantStyles }}
    >
      {(title || subtitle || actions) && (
        <Box
          data-testid="section-header"
          sx={{
            mb: 2,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Box>
            {title && (
              <Typography
                variant="h5"
                component="h2"
                sx={{
                  m: 0,
                  color: 'text.primary',
                  fontWeight: 'bold',
                }}
                style={titleStyle}
              >
                {title}
              </Typography>
            )}
            {subtitle && (
              <Typography
                variant="subtitle1"
                sx={{
                  mt: 1,
                  color: 'text.secondary',
                }}
                style={subtitleStyle}
              >
                {subtitle}
              </Typography>
            )}
          </Box>
          {actions}
        </Box>
      )}
      <Box data-testid="section-content">{children}</Box>
    </Paper>
  );
};
