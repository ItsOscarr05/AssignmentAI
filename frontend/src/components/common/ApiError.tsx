import styled from '@emotion/styled';
import ErrorIcon from '@mui/icons-material/Error';
import WarningIcon from '@mui/icons-material/Warning';
import React from 'react';
import { useToast } from '../../contexts/ToastContext';

interface ApiErrorProps {
  error: any;
  title?: string;
  onRetry?: () => void;
  className?: string;
  style?: React.CSSProperties;
  'aria-label'?: string;
  'aria-describedby'?: string;
  role?: string;
  tabIndex?: number;
  'data-testid'?: string;
  icon?: 'error' | 'warning';
  severity?: 'error' | 'warning';
  code?: string;
  details?: Record<string, string[]>;
  actionText?: string;
  containerClassName?: string;
  containerStyle?: React.CSSProperties;
  iconClassName?: string;
  iconStyle?: React.CSSProperties;
  messageClassName?: string;
  messageStyle?: React.CSSProperties;
  actionClassName?: string;
  actionStyle?: React.CSSProperties;
}

const ErrorContainer = styled.div<{ severity?: string }>`
  padding: 1rem;
  border-radius: 4px;
  background-color: ${({ severity }) =>
    severity === 'warning' ? 'rgba(255, 244, 229)' : '#ffebee'};
  border: 1px solid ${({ severity }) => (severity === 'warning' ? 'rgb(255, 152, 0)' : '#f44336')};
  margin: 1rem 0;
`;

const ErrorTitle = styled.h3`
  color: #f44336;
  margin: 0 0 0.5rem 0;
  font-size: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const ErrorMessage = styled.p`
  color: rgba(0, 0, 0, 0.87);
  margin: 0;
  font-size: 0.9rem;
`;

const ErrorList = styled.ul`
  margin: 0.5rem 0 0 0;
  padding-left: 1.5rem;
  color: rgba(0, 0, 0, 0.87);
  font-size: 0.9rem;
`;

const RetryButton = styled.button`
  margin-top: 1rem;
  padding: 0.5rem 1rem;
  background-color: #fff;
  border: 1px solid #f44336;
  border-radius: 4px;
  color: #f44336;
  cursor: pointer;
  &:hover {
    background-color: #ffebee;
  }
`;

export const ApiError: React.FC<ApiErrorProps> = ({
  error,
  title = 'Error',
  onRetry,
  className,
  style,
  'aria-label': ariaLabel,
  'aria-describedby': ariaDescribedby,
  role = 'alert',
  tabIndex,
  'data-testid': dataTestId,
  icon = 'error',
  severity = 'error',
  code,
  details,
  actionText = 'Retry',
  containerClassName,
  containerStyle,
  iconClassName,
  iconStyle,
  messageClassName,
  messageStyle,
  actionClassName,
  actionStyle,
}) => {
  const { showToast } = useToast();
  const messageId = React.useId();
  const detailsId = React.useId();

  React.useEffect(() => {
    if (error?.message?.includes('network') || error?.message?.includes('Network Error')) {
      showToast('Network error. Please check your connection.', 'error');
    }
  }, [error, showToast]);

  const getErrorMessage = () => {
    if (typeof error === 'string') return error;
    if (error?.response?.data?.message) return error.response.data.message;
    if (error?.message) return error.message;
    return 'An unexpected error occurred';
  };

  const getValidationErrors = () => {
    if (details) {
      return Object.entries(details).map(([field, messages]) => ({
        field,
        message: Array.isArray(messages) ? messages.join(', ') : messages,
      }));
    }
    if (error?.response?.data?.errors) {
      return Object.entries(error.response.data.errors).map(([field, messages]) => ({
        field,
        message: Array.isArray(messages) ? messages.join(', ') : messages,
      }));
    }
    return null;
  };

  const validationErrors = getValidationErrors();
  const describedBy = [messageId, validationErrors ? detailsId : '', ariaDescribedby]
    .filter(Boolean)
    .join(' ');

  const IconComponent = icon === 'warning' ? WarningIcon : ErrorIcon;

  return (
    <div className={containerClassName} style={containerStyle}>
      <ErrorContainer
        severity={severity}
        role={role}
        className={className}
        style={style}
        aria-label={ariaLabel}
        aria-describedby={describedBy}
        tabIndex={tabIndex}
        data-testid={dataTestId || 'api-error-alert'}
      >
        <ErrorTitle>
          <IconComponent
            className={iconClassName}
            style={iconStyle}
            data-testid={`${icon.charAt(0).toUpperCase() + icon.slice(1)}Icon`}
          />
          {code ? `${code}: ${title}` : title}
        </ErrorTitle>
        <ErrorMessage id={messageId} className={messageClassName} style={messageStyle}>
          {getErrorMessage()}
        </ErrorMessage>
        {validationErrors && (
          <ErrorList id={detailsId}>
            {validationErrors.map(({ field, message }, index) => (
              <li key={index}>{`${field}: ${message}`}</li>
            ))}
          </ErrorList>
        )}
        {onRetry && (
          <RetryButton onClick={onRetry} className={actionClassName} style={actionStyle}>
            {actionText}
          </RetryButton>
        )}
      </ErrorContainer>
    </div>
  );
};
