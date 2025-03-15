import React from "react";
import * as Sentry from "@sentry/react";
import { Box, Typography, Button, Alert } from "@mui/material";
import { useQueryClient } from "@tanstack/react-query";

class AssignmentErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo,
    });

    // Report error to Sentry
    Sentry.captureException(error, {
      extra: {
        componentStack: errorInfo.componentStack,
        ...this.props.extraErrorData,
      },
      tags: {
        feature: "assignments",
      },
    });
  }

  handleRetry = () => {
    const queryClient = this.props.queryClient;
    // Reset error boundary state
    this.setState({ hasError: false, error: null, errorInfo: null });
    // Invalidate relevant queries
    queryClient.invalidateQueries({ queryKey: ["assignments"] });
  };

  handleReset = () => {
    const queryClient = this.props.queryClient;
    // Reset error boundary state
    this.setState({ hasError: false, error: null, errorInfo: null });
    // Reset cache for assignments
    queryClient.resetQueries({ queryKey: ["assignments"] });
  };

  render() {
    if (this.state.hasError) {
      return (
        <Box
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          p={3}
          gap={2}
        >
          <Alert severity="error" sx={{ width: "100%", maxWidth: 600 }}>
            <Typography variant="h6" gutterBottom>
              Something went wrong with assignments
            </Typography>
            <Typography variant="body2">
              We're having trouble loading or processing your assignments.
              Please try again or contact support if the problem persists.
            </Typography>
          </Alert>

          <Box display="flex" gap={2}>
            <Button
              variant="contained"
              color="primary"
              onClick={this.handleRetry}
            >
              Retry
            </Button>
            <Button
              variant="outlined"
              color="secondary"
              onClick={this.handleReset}
            >
              Reset
            </Button>
          </Box>

          {process.env.NODE_ENV === "development" && (
            <Box mt={4} width="100%" maxWidth={600}>
              <Typography variant="subtitle2" color="error" gutterBottom>
                Error Details (Development Only):
              </Typography>
              <pre
                style={{
                  whiteSpace: "pre-wrap",
                  wordWrap: "break-word",
                  backgroundColor: "#f5f5f5",
                  padding: "1rem",
                  borderRadius: "4px",
                  fontSize: "0.875rem",
                }}
              >
                {this.state.error?.toString()}
                {"\n"}
                {this.state.errorInfo?.componentStack}
              </pre>
            </Box>
          )}
        </Box>
      );
    }

    return this.props.children;
  }
}

// Wrapper component to provide React Query client
export default function AssignmentErrorBoundaryWrapper({
  children,
  extraErrorData,
}) {
  const queryClient = useQueryClient();

  return (
    <AssignmentErrorBoundary
      queryClient={queryClient}
      extraErrorData={extraErrorData}
    >
      {children}
    </AssignmentErrorBoundary>
  );
}
