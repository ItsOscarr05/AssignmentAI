import { Alert, Box, Snackbar } from '@mui/material';
import React from 'react';
import { useToast } from '../../hooks/useToast';

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { toasts, removeToast } = useToast();

  return (
    <>
      {children}
      <Box
        sx={{
          position: 'fixed',
          bottom: 16,
          right: 16,
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
        }}
      >
        {toasts.map((toast: any) => (
          <Snackbar
            key={toast.id}
            open={true}
            autoHideDuration={toast.duration}
            onClose={() => removeToast(toast.id)}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          >
            <Alert
              onClose={() => removeToast(toast.id)}
              severity={toast.type}
              sx={{ width: '100%' }}
            >
              {toast.message}
            </Alert>
          </Snackbar>
        ))}
      </Box>
    </>
  );
};
