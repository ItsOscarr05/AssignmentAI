import { Box, CssBaseline } from '@mui/material';
import { SnackbarProvider } from 'notistack';
import React from 'react';
import { Toaster } from 'sonner';
import AdComponent from './components/ads/AdComponent';
import { ErrorBoundary } from './components/ErrorBoundary';
import Navbar from './components/Navbar';
import { SecurityProvider } from './components/security/SecurityProvider';
import { AdProvider } from './contexts/AdContext';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import { TokenLimitProvider } from './contexts/TokenLimitContext';
import { TranslationProvider } from './contexts/TranslationContext';
import './i18n/config'; // Initialize i18n
import { AppRouter } from './routes';
import { ThemeProvider } from './theme/ThemeProvider';

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <SecurityProvider>
        <ThemeProvider>
          <AuthProvider>
            <ToastProvider>
              <AdProvider>
                <TokenLimitProvider>
                  <TranslationProvider>
                    <CssBaseline />
                    <SnackbarProvider maxSnack={3}>
                      <Box
                        sx={{
                          display: 'flex',
                          flexDirection: 'column',
                          minHeight: '100vh',
                          overflow: 'hidden',
                        }}
                      >
                        <Navbar />
                        <Box sx={{ display: 'flex', flex: 1 }}>
                          <Box sx={{ flex: 1 }}>
                            <AdComponent position="top" />
                            <AppRouter />
                            <AdComponent position="bottom" />
                          </Box>
                          <Box sx={{ display: { xs: 'none', md: 'block' } }}>
                            <AdComponent position="sidebar" />
                          </Box>
                        </Box>
                      </Box>
                    </SnackbarProvider>
                    <Toaster position="top-right" richColors />
                  </TranslationProvider>
                </TokenLimitProvider>
              </AdProvider>
            </ToastProvider>
          </AuthProvider>
        </ThemeProvider>
      </SecurityProvider>
    </ErrorBoundary>
  );
};

export default App;
