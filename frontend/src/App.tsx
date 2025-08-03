import { Box, CssBaseline } from '@mui/material';
import { SnackbarProvider } from 'notistack';
import React from 'react';
import { useLocation } from 'react-router-dom';
import { Toaster } from 'sonner';
import AdComponent from './components/ads/AdComponent';
import { ErrorBoundary } from './components/ErrorBoundary';
import Navbar from './components/Navbar';
import { SecurityProvider } from './components/security/SecurityProvider';
import { AdProvider } from './contexts/AdContext';
import { AIFeaturesProvider } from './contexts/AIFeaturesContext';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import { TokenLimitProvider } from './contexts/TokenLimitContext';
import './i18n/config'; // Initialize i18n
import { AppRouter } from './routes';

// Pages that should be excluded from theme changes
const EXCLUDED_PATHS = [
  '/',
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/auth/callback',
];

const AppContent: React.FC = () => {
  const location = useLocation();
  const isExcludedPath = EXCLUDED_PATHS.includes(location.pathname);

  if (isExcludedPath) {
    // Render without theme for landing/auth pages
    return (
      <ErrorBoundary>
        <SecurityProvider>
          <AuthProvider>
            <ToastProvider>
              <AdProvider>
                <TokenLimitProvider>
                  <AIFeaturesProvider
                    initialFeatures={{
                      autoComplete: true,
                      codeSnippets: true,
                      aiSuggestions: true,
                      realTimeAnalysis: false,
                    }}
                  >
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
                  </AIFeaturesProvider>
                </TokenLimitProvider>
              </AdProvider>
            </ToastProvider>
          </AuthProvider>
        </SecurityProvider>
      </ErrorBoundary>
    );
  }

  // Render with theme for dashboard pages
  return (
    <ErrorBoundary>
      <SecurityProvider>
        <ToastProvider>
          <AdProvider>
            <TokenLimitProvider>
              <AIFeaturesProvider
                initialFeatures={{
                  autoComplete: true,
                  codeSnippets: true,
                  aiSuggestions: true,
                  realTimeAnalysis: false,
                }}
              >
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
              </AIFeaturesProvider>
            </TokenLimitProvider>
          </AdProvider>
        </ToastProvider>
      </SecurityProvider>
    </ErrorBoundary>
  );
};

const App: React.FC = () => {
  return <AppContent />;
};

export default App;
