import { Error as ErrorIcon } from '@mui/icons-material';
import { Alert, AlertTitle, Box } from '@mui/material';
import React from 'react';

interface ErrorMessageProps {
  message: string;
  title?: string;
  severity?: 'error' | 'warning' | 'info';
  onRetry?: () => void;
  showIcon?: boolean;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({
  message,
  title = 'Error',
  severity = 'error',
  onRetry,
  showIcon = true,
}) => {
  return (
    <Box sx={{ width: '100%', mb: 2 }}>
      <Alert
        severity={severity}
        icon={showIcon ? <ErrorIcon /> : undefined}
        action={
          onRetry && (
            <Box
              component="button"
              onClick={onRetry}
              sx={{
                background: 'none',
                border: 'none',
                color: 'inherit',
                cursor: 'pointer',
                fontSize: 'inherit',
                padding: 0,
                marginLeft: 1,
              }}
            >
              Retry
            </Box>
          )
        }
      >
        <AlertTitle>{title}</AlertTitle>
        {message}
      </Alert>
    </Box>
  );
};

export default ErrorMessage;
