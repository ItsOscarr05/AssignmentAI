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
  const getVariantStyles = () => {
    switch (variant) {
      case 'outlined':
        return {
          border: '1px solid',
          borderColor: 'divider',
        };
      case 'elevated':
        return {
          boxShadow: 1,
        };
      case 'interactive':
        return {
          cursor: 'pointer',
          transition: 'background-color 0.2s',
          '&:hover': {
            backgroundColor: 'action.hover',
          },
        };
      default:
        return {};
    }
  };

  return (
    <Paper
      data-testid="section-container"
      sx={{
        p: 3,
        mb: 3,
        backgroundColor: 'background.paper',
        borderRadius: 1,
        ...getVariantStyles(),
        '&:last-child': {
          mb: 0,
        },
      }}
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
