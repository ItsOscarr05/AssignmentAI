import { Box, Container, Theme, Typography, useTheme } from '@mui/material';
import React, { ReactNode } from 'react';

interface AuthLayoutProps {
  children: ReactNode;
  title?: string;
}

const AuthLayout: React.FC<AuthLayoutProps> = ({ children, title = 'AssignmentAI' }) => {
  const theme = useTheme();

  const containerStyle = {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.palette.background.default,
    padding: theme.spacing(2),
  };

  const contentStyle = {
    backgroundColor: theme.palette.background.paper,
    borderRadius: `${theme.shape.borderRadius}px`,
    boxShadow: theme.shadows[3],
    padding: theme.spacing(4),
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: theme.spacing(3),
    width: '100%',
  };

  const headerStyle = {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: theme.spacing(2),
    width: '100%',
  };

  return (
    <Box
      data-testid="auth-layout-container"
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.palette.background.default,
        padding: theme.spacing(2),
      }}
      style={containerStyle}
    >
      <Container maxWidth="sm">
        <Box
          data-testid="auth-layout-content"
          sx={{
            backgroundColor: theme.palette.background.paper,
            borderRadius: theme.shape.borderRadius,
            boxShadow: theme.shadows[3],
            padding: theme.spacing(4),
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: theme.spacing(3),
            [theme.breakpoints.down('sm')]: {
              margin: theme.spacing(2),
            },
          }}
          style={contentStyle}
        >
          <Box
            data-testid="auth-layout-header"
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: theme.spacing(2),
              width: '100%',
            }}
            style={headerStyle}
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
