import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React, { Suspense, lazy } from 'react';
import ReactDOM from 'react-dom/client';
import { AppRouter } from './routes';
import './styles/global.css';
import { lightTheme } from './theme';

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

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <Suspense fallback={<div>Loading...</div>}>
        <ThemeProvider theme={lightTheme}>
          <CssBaseline />
          <AppRouter />
        </ThemeProvider>
      </Suspense>
    </QueryClientProvider>
  </React.StrictMode>
);
