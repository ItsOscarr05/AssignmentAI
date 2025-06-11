import { Box, Button, Card, Theme, Typography } from '@mui/material';
import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <Box
          data-testid="error-boundary-container"
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            p: 3,
            '@media (max-width: 600px)': {
              p: 2,
            },
          }}
        >
          <Card
            data-testid="error-boundary-card"
            sx={{
              p: 4,
              maxWidth: 600,
              width: '100%',
              borderRadius: (theme: Theme) => theme.shape.borderRadius,
              boxShadow: (theme: Theme) => theme.shadows[3],
            }}
          >
            <Typography
              variant="h4"
              component="h1"
              sx={{
                color: (theme: Theme) => theme.palette.error.main,
                mb: 2,
                fontSize: (theme: Theme) => theme.typography.h4.fontSize,
                fontWeight: (theme: Theme) => theme.typography.fontWeightBold,
              }}
            >
              Something went wrong
            </Typography>

            <Typography
              variant="body1"
              sx={{
                color: (theme: Theme) => theme.palette.text.secondary,
                mb: 3,
              }}
            >
              {this.state.error?.message || 'An unexpected error occurred'}
            </Typography>

            <Button
              variant="contained"
              onClick={this.handleRetry}
              sx={{
                backgroundColor: (theme: Theme) => theme.palette.primary.main,
                color: (theme: Theme) => theme.palette.primary.contrastText,
                mt: 2,
              }}
            >
              Try Again
            </Button>
          </Card>
        </Box>
      );
    }

    return this.props.children;
  }
}
