import { ThemeProvider } from '@mui/material/styles';
import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../contexts/AuthContext';
import { theme } from '../theme';

// Create a custom render function that includes all providers
const customRender = (ui: React.ReactElement, options = {}) => {
  return render(ui, {
    wrapper: ({ children }) => (
      <ThemeProvider theme={theme}>
        <BrowserRouter>
          <AuthProvider>{children}</AuthProvider>
        </BrowserRouter>
      </ThemeProvider>
    ),
    ...options,
  });
};

// Export custom render function
export { customRender as render };

// Export test utilities
export * from '@testing-library/react';
