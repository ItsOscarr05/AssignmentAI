import { AnimatePresence } from 'framer-motion';
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { ErrorBoundary } from './components/ErrorBoundary';
import { SecurityProvider } from './components/security/SecurityProvider';
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
                <AnimatePresence mode="wait">
                  <AppRouter />
                </AnimatePresence>
              </ToastProvider>
            </AuthProvider>
          </ThemeProvider>
        </BrowserRouter>
      </SecurityProvider>
    </ErrorBoundary>
  );
};

export default App;
