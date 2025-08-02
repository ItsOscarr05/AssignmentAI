import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React, { Suspense, lazy } from 'react';
import ReactDOM from 'react-dom/client';
import { ThemeProvider as CustomThemeProvider, useTheme } from './contexts/ThemeContext';
import { AppRouter } from './routes';
import './styles/global.css';
import { darkTheme, lightTheme } from './theme';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

// Lazy load theme provider and CssBaseline
const ThemeProvider = lazy(() =>
  import('@mui/material/styles').then(module => ({ default: module.ThemeProvider }))
);
const CssBaseline = lazy(() =>
  import('@mui/material/CssBaseline').then(module => ({ default: module.default }))
);

// Component that switches themes based on context
const AppWithTheme: React.FC = () => {
  const { theme } = useTheme();
  const currentTheme = theme === 'dark' ? darkTheme : lightTheme;

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ThemeProvider theme={currentTheme}>
        <CssBaseline />
        <AppRouter />
      </ThemeProvider>
    </Suspense>
  );
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <Suspense fallback={<div>Loading...</div>}>
        <CustomThemeProvider>
          <AppWithTheme />
        </CustomThemeProvider>
      </Suspense>
    </QueryClientProvider>
  </React.StrictMode>
);
