import React from "react";
import { Box, Typography, Button } from "@mui/material";

class ErrorBoundary extends React.Component {
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

    // Log error to your error reporting service
    console.error("Error caught by boundary:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <Box
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          minHeight="400px"
          p={3}
          textAlign="center"
        >
          <Typography variant="h4" gutterBottom color="error">
            Oops! Something went wrong
          </Typography>
          <Typography variant="body1" color="textSecondary" paragraph>
            We're sorry for the inconvenience. Please try again or contact
            support if the problem persists.
          </Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={this.handleReset}
            sx={{ mt: 2 }}
          >
            Try Again
          </Button>
          {process.env.NODE_ENV === "development" && this.state.error && (
            <Box mt={4} textAlign="left" width="100%" maxWidth="800px">
              <Typography variant="h6" gutterBottom>
                Error Details:
              </Typography>
              <pre
                style={{
                  overflow: "auto",
                  padding: "1rem",
                  backgroundColor: "#f5f5f5",
                  borderRadius: "4px",
                }}
              >
                {this.state.error.toString()}
                {this.state.errorInfo.componentStack}
              </pre>
            </Box>
          )}
        </Box>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
