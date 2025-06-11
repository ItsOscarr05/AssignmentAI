import { Box, Container, Theme, Typography, useTheme } from '@mui/material';
import React, { ReactNode } from 'react';

interface AuthLayoutProps {
  children: ReactNode;
  title?: string;
}

const AuthLayout: React.FC<AuthLayoutProps> = ({ children, title = 'AssignmentAI' }) => {
  const theme = useTheme();

  return (
    <Box
      data-testid="auth-layout-container"
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: (theme: Theme) => theme.palette.background.default,
        padding: (theme: Theme) => theme.spacing(2),
      }}
    >
      <Container maxWidth="sm">
        <Box
          data-testid="auth-layout-content"
          sx={{
            backgroundColor: (theme: Theme) => theme.palette.background.paper,
            borderRadius: (theme: Theme) => theme.shape.borderRadius,
            boxShadow: (theme: Theme) => theme.shadows[3],
            padding: (theme: Theme) => theme.spacing(4),
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: (theme: Theme) => theme.spacing(3),
            [theme.breakpoints.down('sm')]: {
              margin: theme.spacing(2),
            },
          }}
        >
          <Box
            data-testid="auth-layout-header"
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: (theme: Theme) => theme.spacing(2),
              width: '100%',
            }}
          >
            <Typography
              variant="h4"
              component="h1"
              sx={{
                color: (theme: Theme) => theme.palette.text.primary,
                fontWeight: (theme: Theme) => theme.typography.fontWeightBold,
                marginBottom: (theme: Theme) => theme.spacing(4),
                textAlign: 'center',
              }}
            >
              {title}
            </Typography>
          </Box>
          <Box sx={{ width: '100%' }}>{children}</Box>
        </Box>
      </Container>
    </Box>
  );
};

export default AuthLayout;
