import { Box, CircularProgress, Theme, Typography } from '@mui/material';
import React from 'react';

interface LoadingSpinnerProps {
  size?: number;
  color?: 'primary' | 'secondary';
  thickness?: number;
  message?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 40,
  color = 'primary',
  thickness = 3.6,
  message,
}) => {
  return (
    <Box
      data-testid="loading-spinner-container"
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        p: 3,
        m: message ? 3 : 2,
        '@media (max-width: 600px)': {
          p: 2,
        },
      }}
    >
      <CircularProgress
        role="progressbar"
        aria-busy="true"
        size={size}
        color={color}
        thickness={thickness}
        sx={{
          color: (theme: Theme) => theme.palette[color].main,
          animation: 'spin 1s linear infinite',
          '@keyframes spin': {
            '0%': {
              transform: 'rotate(0deg)',
            },
            '100%': {
              transform: 'rotate(360deg)',
            },
          },
        }}
      />
      {message && (
        <Typography
          variant="body1"
          sx={{
            mt: 2,
            color: (theme: Theme) => theme.palette.text.secondary,
            fontSize: (theme: Theme) => theme.typography.body1.fontSize,
            fontWeight: (theme: Theme) => theme.typography.fontWeightRegular,
          }}
        >
          {message}
        </Typography>
      )}
    </Box>
  );
};
