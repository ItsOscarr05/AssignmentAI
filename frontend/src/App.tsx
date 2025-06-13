import { Box } from '@mui/material';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import { SnackbarProvider } from 'notistack';
import { BrowserRouter } from 'react-router-dom';
import { ErrorBoundary } from './components/ErrorBoundary';
import { SecurityProvider } from './components/security/SecurityProvider';
import { AdProvider } from './contexts/AdContext';
import { AuthProvider } from './contexts/AuthContext';
import { SettingsProvider } from './contexts/SettingsContext';
import { ToastProvider } from './contexts/ToastContext';
import { AppRouter } from './routes';
import { theme } from './theme';

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <SecurityProvider>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <BrowserRouter>
            <AuthProvider>
              <SettingsProvider>
                <ToastProvider>
                  <AdProvider>
                    <SnackbarProvider maxSnack={3}>
                      <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
                        <AppRouter />
                      </Box>
                    </SnackbarProvider>
                  </AdProvider>
                </ToastProvider>
              </SettingsProvider>
            </AuthProvider>
          </BrowserRouter>
        </ThemeProvider>
      </SecurityProvider>
    </ErrorBoundary>
  );
};

export default App;
