import React, { Suspense, lazy } from 'react';
import ReactDOM from 'react-dom/client';
import { AppRouter } from './routes';
import './styles/global.css';
import { lightTheme } from './theme';

// Lazy load theme provider and CssBaseline
const ThemeProvider = lazy(() =>
  import('@mui/material/styles').then(module => ({ default: module.ThemeProvider }))
);
const CssBaseline = lazy(() =>
  import('@mui/material/CssBaseline').then(module => ({ default: module.default }))
);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Suspense fallback={<div>Loading...</div>}>
      <ThemeProvider theme={lightTheme}>
        <CssBaseline />
        <AppRouter />
      </ThemeProvider>
    </Suspense>
  </React.StrictMode>
);
