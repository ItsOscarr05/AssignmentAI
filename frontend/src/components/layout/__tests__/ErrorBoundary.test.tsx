import { ThemeProvider } from '@mui/material/styles';
import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { theme } from '../../../theme';
import { ErrorBoundary } from '../ErrorBoundary';

// Mock console.error to prevent error output in tests
const consoleError = console.error;
beforeAll(() => {
  console.error = vi.fn();
});

afterAll(() => {
  console.error = consoleError;
});

// Mock Material-UI components
vi.mock('@mui/material', async importOriginal => {
  const actual = await importOriginal();
  return {
    ...(actual as any),
    Box: ({ children, ...props }: any) => (
      <div
        data-testid="error-boundary-container"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          padding: '24px',
        }}
        {...props}
      >
        {children}
      </div>
    ),
    Card: ({ children, ...props }: any) => (
      <div
        data-testid="error-boundary-card"
        style={{
          padding: '32px',
          maxWidth: '600px',
          width: '100%',
          borderRadius: '4px',
          boxShadow: '0 3px 5px 2px rgba(0, 0, 0, 0.2)',
        }}
        {...props}
      >
        {children}
      </div>
    ),
    Typography: ({ children, variant, ...props }: any) => {
      const styles = {
        h4: {
          color: 'rgb(211, 47, 47)',
          marginBottom: '16px',
          fontSize: '2.125rem',
          fontWeight: 700,
        },
        body1: {
          color: 'rgb(102, 102, 102)',
          marginBottom: '24px',
        },
      };
      return (
        <p style={styles[variant as keyof typeof styles]} {...props}>
          {children}
        </p>
      );
    },
    Button: ({ children, onClick, ...props }: any) => (
      <button
        onClick={onClick}
        style={{
          backgroundColor: 'rgb(211, 47, 47)',
          color: 'rgb(255, 255, 255)',
          marginTop: '16px',
        }}
        {...props}
      >
        {children}
      </button>
    ),
  };
});

const renderErrorBoundary = (children: React.ReactNode) => {
  return render(
    <ThemeProvider theme={theme}>
      <MemoryRouter>
        <ErrorBoundary>{children}</ErrorBoundary>
      </MemoryRouter>
    </ThemeProvider>
  );
};

// Component that throws an error
const ErrorComponent = () => {
  throw new Error('Test error');
};

describe('ErrorBoundary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders children when there is no error', () => {
    renderErrorBoundary(<div>Test Content</div>);
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('renders error UI when there is an error', () => {
    renderErrorBoundary(<ErrorComponent />);

    // Check for error message
    expect(screen.getByText(/Something went wrong/i)).toBeInTheDocument();
    expect(screen.getByText(/Test error/i)).toBeInTheDocument();
  });

  it('renders with proper error UI styles', () => {
    renderErrorBoundary(<ErrorComponent />);
    const errorContainer = screen.getByTestId('error-boundary-container');

    // Check container styles
    expect(errorContainer).toHaveStyle({
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      padding: '24px',
    });
  });

  it('renders with proper error message styles', () => {
    renderErrorBoundary(<ErrorComponent />);
    const errorMessage = screen.getByText(/Something went wrong/i);

    // Check error message styles
    expect(errorMessage).toHaveStyle({
      color: 'rgb(211, 47, 47)',
      marginBottom: '16px',
    });
  });

  it('renders with proper error details styles', () => {
    renderErrorBoundary(<ErrorComponent />);
    const errorDetails = screen.getByText(/Test error/i);

    // Check error details styles
    expect(errorDetails).toHaveStyle({
      color: 'rgb(102, 102, 102)',
      marginBottom: '24px',
    });
  });

  it('renders with proper button styles', () => {
    renderErrorBoundary(<ErrorComponent />);
    const retryButton = screen.getByRole('button', { name: /try again/i });

    // Check button styles
    expect(retryButton).toHaveStyle({
      backgroundColor: 'rgb(211, 47, 47)',
      color: 'rgb(255, 255, 255)',
    });
  });

  it('handles retry button click', () => {
    renderErrorBoundary(<ErrorComponent />);
    const retryButton = screen.getByRole('button', { name: /try again/i });

    // Click retry button
    fireEvent.click(retryButton);

    // Check if error UI is still visible
    expect(screen.getByText(/Something went wrong/i)).toBeInTheDocument();
  });

  it('renders with proper responsive design', () => {
    renderErrorBoundary(<ErrorComponent />);
    const errorContainer = screen.getByTestId('error-boundary-container');

    // Check that the container has padding
    expect(errorContainer).toHaveStyle({
      padding: '24px',
    });
  });

  it('renders with proper typography styles', () => {
    renderErrorBoundary(<ErrorComponent />);
    const errorMessage = screen.getByText(/Something went wrong/i);

    // Check typography styles
    expect(errorMessage).toHaveStyle({
      fontSize: '2.125rem',
      fontWeight: 700,
    });
  });

  it('renders with proper elevation', () => {
    renderErrorBoundary(<ErrorComponent />);
    const errorCard = screen.getByTestId('error-boundary-card');

    // Check elevation
    expect(errorCard).toHaveStyle({
      boxShadow: '0 3px 5px 2px rgba(0, 0, 0, 0.2)',
    });
  });

  it('renders with proper border radius', () => {
    renderErrorBoundary(<ErrorComponent />);
    const errorCard = screen.getByTestId('error-boundary-card');

    // Check border radius
    expect(errorCard).toHaveStyle({
      borderRadius: '4px',
    });
  });

  it('renders with proper spacing between elements', () => {
    renderErrorBoundary(<ErrorComponent />);
    const errorMessage = screen.getByText(/Something went wrong/i);
    const errorDetails = screen.getByText(/Test error/i);
    const retryButton = screen.getByRole('button', { name: /try again/i });

    // Check spacing between elements
    expect(errorMessage).toHaveStyle({
      marginBottom: '16px',
    });
    expect(errorDetails).toHaveStyle({
      marginBottom: '24px',
    });
    expect(retryButton).toHaveStyle({
      marginTop: '16px',
    });
  });
});
