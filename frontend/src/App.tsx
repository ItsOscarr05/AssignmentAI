import { Box, CssBaseline } from '@mui/material';
import { SnackbarProvider } from 'notistack';
import React from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { Toaster } from 'sonner';
import AdComponent from './components/ads/AdComponent';
import { ErrorBoundary } from './components/ErrorBoundary';
import Navbar from './components/Navbar';
import { SecurityProvider } from './components/security/SecurityProvider';
import { AdProvider } from './contexts/AdContext';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import { TokenLimitProvider } from './contexts/TokenLimitContext';
import { AppRouter } from './routes';
import { ThemeProvider } from './theme/ThemeProvider';

// Health check component for production monitoring
const HealthCheck: React.FC = () => {
  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h2>AssignmentAI Frontend Health Check</h2>
      <p>
        <strong>Status:</strong> Healthy
      </p>
      <p>
        <strong>Version:</strong> {process.env.VITE_APP_VERSION || '1.0.0'}
      </p>
      <p>
        <strong>Environment:</strong> {process.env.NODE_ENV || 'development'}
      </p>
      <p>
        <strong>Timestamp:</strong> {new Date().toISOString()}
      </p>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <SecurityProvider>
        <BrowserRouter>
          <ThemeProvider>
            <AuthProvider>
              <ToastProvider>
                <AdProvider>
                  <TokenLimitProvider>
                    <CssBaseline />
                    <SnackbarProvider maxSnack={3}>
                      <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
                        <Navbar />
                        <Box sx={{ display: 'flex', flex: 1 }}>
                          <Box sx={{ flex: 1 }}>
                            <AdComponent position="top" />
                            <Routes>
                              <Route path="/health" element={<HealthCheck />} />
                              <Route path="/*" element={<AppRouter />} />
                            </Routes>
                            <AdComponent position="bottom" />
                          </Box>
                          <Box sx={{ display: { xs: 'none', md: 'block' } }}>
                            <AdComponent position="sidebar" />
                          </Box>
                        </Box>
                      </Box>
                    </SnackbarProvider>
                    <Toaster position="top-right" richColors />
                  </TokenLimitProvider>
                </AdProvider>
              </ToastProvider>
            </AuthProvider>
          </ThemeProvider>
        </BrowserRouter>
      </SecurityProvider>
    </ErrorBoundary>
  );
};

export default App;
