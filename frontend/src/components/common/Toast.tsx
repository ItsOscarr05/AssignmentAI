import { Alert, AlertColor, Snackbar } from '@mui/material';
import React from 'react';

interface ToastProps {
  open: boolean;
  message: string;
  severity: AlertColor;
  onClose: () => void;
  duration?: number;
  'data-testid'?: string;
  'data-severity'?: string;
}

export const Toast: React.FC<ToastProps> = ({
  open,
  message,
  severity,
  onClose,
  duration = 6000,
  'data-testid': dataTestId,
  'data-severity': dataSeverity,
}) => {
  return (
    <Snackbar
      open={open}
      autoHideDuration={duration}
      onClose={onClose}
      anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      {...(dataTestId ? { 'data-testid': dataTestId } : {})}
      {...(dataSeverity ? { 'data-severity': dataSeverity } : {})}
    >
      <Alert onClose={onClose} severity={severity} sx={{ width: '100%' }} role="alert">
        {message}
      </Alert>
    </Snackbar>
  );
};
