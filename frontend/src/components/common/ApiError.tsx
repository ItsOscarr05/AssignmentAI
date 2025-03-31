import styled from "@emotion/styled";
import React from "react";
import { useToast } from "../../contexts/ToastContext";

const ErrorContainer = styled.div`
  padding: 1rem;
  border-radius: 4px;
  background-color: ${({ theme }) => theme.colors.errorLight};
  border: 1px solid ${({ theme }) => theme.colors.error};
  margin: 1rem 0;
`;

const ErrorTitle = styled.h3`
  color: ${({ theme }) => theme.colors.error};
  margin: 0 0 0.5rem 0;
  font-size: 1rem;
`;

const ErrorMessage = styled.p`
  color: ${({ theme }) => theme.colors.text};
  margin: 0;
  font-size: 0.9rem;
`;

const ErrorList = styled.ul`
  margin: 0.5rem 0 0 0;
  padding-left: 1.5rem;
  color: ${({ theme }) => theme.colors.text};
  font-size: 0.9rem;
`;

interface ApiErrorProps {
  error: any;
  title?: string;
  onRetry?: () => void;
}

const ApiError: React.FC<ApiErrorProps> = ({
  error,
  title = "Error",
  onRetry,
}) => {
  const { showToast } = useToast();

  React.useEffect(() => {
    // Show toast for network errors
    if (
      error?.message?.includes("network") ||
      error?.message?.includes("Network Error")
    ) {
      showToast("Network error. Please check your connection.", "error");
    }
  }, [error, showToast]);

  const getErrorMessage = () => {
    if (typeof error === "string") return error;
    if (error?.response?.data?.message) return error.response.data.message;
    if (error?.message) return error.message;
    return "An unexpected error occurred";
  };

  const getValidationErrors = () => {
    if (error?.response?.data?.errors) {
      return Object.entries(error.response.data.errors).map(
        ([field, messages]) => `${field}: ${(messages as string[]).join(", ")}`
      );
    }
    return null;
  };

  const validationErrors = getValidationErrors();

  return (
    <ErrorContainer>
      <ErrorTitle>{title}</ErrorTitle>
      <ErrorMessage>{getErrorMessage()}</ErrorMessage>
      {validationErrors && (
        <ErrorList>
          {validationErrors.map((error, index) => (
            <li key={index}>{error}</li>
          ))}
        </ErrorList>
      )}
      {onRetry && (
        <button
          onClick={onRetry}
          style={{
            marginTop: "1rem",
            padding: "0.5rem 1rem",
            backgroundColor: "#fff",
            border: "1px solid #dc3545",
            borderRadius: "4px",
            color: "#dc3545",
            cursor: "pointer",
          }}
        >
          Try Again
        </button>
      )}
    </ErrorContainer>
  );
};

export default ApiError;
