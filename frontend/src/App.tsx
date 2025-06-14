import { Box, CssBaseline } from '@mui/material';
import { SnackbarProvider } from 'notistack';
import React from 'react';
import { BrowserRouter, Routes } from 'react-router-dom';
import AdComponent from './components/ads/AdComponent';
import { ErrorBoundary } from './components/ErrorBoundary';
import Navbar from './components/Navbar';
import { SecurityProvider } from './components/security/SecurityProvider';
import { AdProvider } from './contexts/AdContext';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import { AppRouter } from './routes';
import { ThemeProvider } from './theme/ThemeProvider';

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <SecurityProvider>
        <BrowserRouter>
          <ThemeProvider>
            <AuthProvider>
              <ToastProvider>
                <AdProvider>
                  <CssBaseline />
                  <SnackbarProvider maxSnack={3}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
                      <Navbar />
                      <Box sx={{ display: 'flex', flex: 1 }}>
                        <Box sx={{ flex: 1 }}>
                          <AdComponent position="top" />
                          <Routes>
                  <AppRouter />
                          </Routes>
                          <AdComponent position="bottom" />
                        </Box>
                        <Box sx={{ display: { xs: 'none', md: 'block' } }}>
                          <AdComponent position="sidebar" />
                        </Box>
                      </Box>
                    </Box>
                  </SnackbarProvider>
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
