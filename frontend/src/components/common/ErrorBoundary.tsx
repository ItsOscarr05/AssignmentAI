import styled from "@emotion/styled";
import React, { Component, ErrorInfo, ReactNode } from "react";
import { useNavigate } from "react-router-dom";

const ErrorContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 2rem;
  text-align: center;
  background-color: ${({ theme }) => theme.colors.background};
  color: ${({ theme }) => theme.colors.text};
`;

const ErrorTitle = styled.h1`
  font-size: 2rem;
  margin-bottom: 1rem;
  color: ${({ theme }) => theme.colors.error};
`;

const ErrorMessage = styled.p`
  font-size: 1.1rem;
  margin-bottom: 2rem;
  max-width: 600px;
  line-height: 1.5;
`;

const Button = styled.button`
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  background-color: ${({ theme }) => theme.colors.primary};
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: ${({ theme }) => theme.colors.primaryDark};
  }
`;

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <ErrorContainer>
          <ErrorTitle>Oops! Something went wrong</ErrorTitle>
          <ErrorMessage>
            We apologize for the inconvenience. An unexpected error has
            occurred. Please try refreshing the page or contact support if the
            problem persists.
          </ErrorMessage>
          <Button onClick={() => window.location.reload()}>Refresh Page</Button>
        </ErrorContainer>
      );
    }

    return this.props.children;
  }
}

// Wrapper component to use hooks
export const ErrorBoundaryWrapper: React.FC<Props> = ({
  children,
  fallback,
}) => {
  const navigate = useNavigate();

  const handleReset = () => {
    navigate("/");
  };

  return (
    <ErrorBoundary
      fallback={
        <ErrorContainer>
          <ErrorTitle>Oops! Something went wrong</ErrorTitle>
          <ErrorMessage>
            We apologize for the inconvenience. An unexpected error has
            occurred. Please try refreshing the page or contact support if the
            problem persists.
          </ErrorMessage>
          <Button onClick={handleReset}>Return to Home</Button>
        </ErrorContainer>
      }
    >
      {children}
    </ErrorBoundary>
  );
};

export default ErrorBoundaryWrapper;
