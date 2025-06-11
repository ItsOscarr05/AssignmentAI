import { ThemeProvider } from '@mui/material/styles';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import { render as rtlRender, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { AuthProvider, useAuth } from '../../contexts/AuthContext';
import { theme } from '../../theme';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

function render(ui: React.ReactElement, { route = '/' } = {}) {
  window.history.pushState({}, 'Test page', route);

  return rtlRender(ui, {
    wrapper: ({ children }) => (
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <ThemeProvider theme={theme}>
            <AuthProvider>{children}</AuthProvider>
          </ThemeProvider>
        </BrowserRouter>
      </QueryClientProvider>
    ),
  });
}

// Re-export everything
export * from '@testing-library/react';

// Override render method
export { render };

export * from '../../test/test-utils';

// Test suites
describe('Test Utils', () => {
  describe('render function', () => {
    it('renders component with default route', () => {
      const TestComponent = () => <div>Test Component</div>;
      render(<TestComponent />);
      expect(screen.getByText('Test Component')).toBeInTheDocument();
      expect(window.location.pathname).toBe('/');
    });

    it('renders component with custom route', () => {
      const TestComponent = () => <div>Test Component</div>;
      render(<TestComponent />, { route: '/test' });
      expect(screen.getByText('Test Component')).toBeInTheDocument();
      expect(window.location.pathname).toBe('/test');
    });

    it('renders component with theme provider', () => {
      const TestComponent = () => (
        <div style={{ color: theme.palette.primary.main }}>Themed Component</div>
      );
      render(<TestComponent />);
      const element = screen.getByText('Themed Component');
      expect(element).toBeInTheDocument();
      expect(element).toHaveStyle({ color: theme.palette.primary.main });
    });

    it('renders component with auth provider', () => {
      const TestComponent = () => {
        const { isAuthenticated } = useAuth();
        return <div>{isAuthenticated ? 'Authenticated' : 'Not Authenticated'}</div>;
      };
      render(<TestComponent />);
      expect(screen.getByText('Authenticated')).toBeInTheDocument();
    });

    it('renders component with query client provider', async () => {
      const TestComponent = () => {
        const { data } = useQuery({
          queryKey: ['test'],
          queryFn: () => Promise.resolve('test data'),
        });
        return <div>{data || 'Loading...'}</div>;
      };
      render(<TestComponent />);
      expect(screen.getByText('Loading...')).toBeInTheDocument();
      await screen.findByText('test data');
    });
  });
});
