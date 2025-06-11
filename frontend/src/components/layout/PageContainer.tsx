import { Box, Container, Paper, Typography, useTheme } from '@mui/material';
import { ReactNode } from 'react';

interface PageContainerProps {
  title?: string;
  subtitle?: string;
  children: ReactNode;
  actions?: ReactNode;
}

export function PageContainer({ title, subtitle, children, actions }: PageContainerProps) {
  const theme = useTheme();

  return (
    <Container
      data-testid="page-container"
      sx={{
        padding: theme.spacing(3),
        maxWidth: theme.breakpoints.values.lg,
        margin: '0 auto',
        backgroundColor: theme.palette.background.default,
        [theme.breakpoints.down('sm')]: {
          padding: theme.spacing(2),
        },
      }}
    >
      {(title || subtitle || actions) && (
        <Box
          data-testid="page-header"
          sx={{
            marginBottom: theme.spacing(3),
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: theme.spacing(2),
          }}
        >
          <Box>
            {title && (
              <Typography
                data-testid="page-title"
                variant="h4"
                component="h1"
                sx={{
                  color: theme.palette.text.primary,
                  margin: 0,
                  fontSize: theme.typography.h4.fontSize,
                  fontWeight: theme.typography.fontWeightBold,
                }}
              >
                {title}
              </Typography>
            )}
            {subtitle && (
              <Typography
                data-testid="page-subtitle"
                variant="subtitle1"
                color="text.secondary"
                sx={{
                  marginTop: theme.spacing(1),
                  fontSize: theme.typography.subtitle1.fontSize,
                  fontWeight: theme.typography.fontWeightRegular,
                }}
              >
                {subtitle}
              </Typography>
            )}
          </Box>
          {actions && (
            <Box data-testid="page-actions" sx={{ display: 'flex', gap: theme.spacing(1) }}>
              {actions}
            </Box>
          )}
        </Box>
      )}
      <Paper
        data-testid="page-content"
        elevation={1}
        sx={{
          padding: theme.spacing(3),
          backgroundColor: theme.palette.background.paper,
          borderRadius: theme.shape.borderRadius,
          boxShadow: theme.shadows[1],
        }}
      >
        {children}
      </Paper>
    </Container>
  );
}
