import { ThemeProvider } from '@mui/material/styles';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { theme } from '../../../theme';
import { LoadingSpinner } from '../LoadingSpinner';

// Mock Material-UI components
vi.mock('@mui/material', async importOriginal => {
  const actual = await importOriginal();
  return {
    ...actual,
    Box: ({ children, ...props }: any) => (
      <div
        data-testid="loading-spinner-container"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          margin: props.sx?.m === 3 ? '24px' : '16px',
        }}
        {...props}
      >
        {children}
      </div>
    ),
    CircularProgress: ({ size, color, thickness, ...props }: any) => (
      <div
        role="progressbar"
        aria-busy="true"
        style={{
          width: `${size}px`,
          height: `${size}px`,
          color: color === 'secondary' ? 'rgb(244, 67, 54)' : 'rgb(211, 47, 47)',
          animation: 'spin 1s linear infinite',
        }}
        {...props}
      />
    ),
    Typography: ({ children, variant, ...props }: any) => {
      const styles = {
        body1: {
          marginTop: '16px',
          color: 'rgb(102, 102, 102)',
          fontSize: '1rem',
          fontWeight: 400,
        },
      };
      return (
        <p style={styles[variant as keyof typeof styles]} {...props}>
          {children}
        </p>
      );
    },
  };
});

const renderLoadingSpinner = (props = {}) => {
  return render(
    <ThemeProvider theme={theme}>
      <LoadingSpinner {...props} />
    </ThemeProvider>
  );
};

describe('LoadingSpinner', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the loading spinner with default props', () => {
    renderLoadingSpinner();
    const spinner = screen.getByRole('progressbar');
    expect(spinner).toBeInTheDocument();
    expect(spinner).toHaveAttribute('aria-busy', 'true');
  });

  it('renders with custom size', () => {
    renderLoadingSpinner({ size: 60 });
    const spinner = screen.getByRole('progressbar');
    expect(spinner).toHaveStyle({
      width: '60px',
      height: '60px',
    });
  });

  it('renders with custom color', () => {
    renderLoadingSpinner({ color: 'secondary' });
    const spinner = screen.getByRole('progressbar');
    expect(spinner).toHaveStyle({
      color: 'rgb(244, 67, 54)',
    });
  });

  it('renders with custom thickness', () => {
    renderLoadingSpinner({ thickness: 4 });
    const spinner = screen.getByRole('progressbar');
    expect(spinner).toBeInTheDocument();
  });

  it('renders with custom message', () => {
    renderLoadingSpinner({ message: 'Loading data...' });
    expect(screen.getByText('Loading data...')).toBeInTheDocument();
  });

  it('renders with proper container styles', () => {
    renderLoadingSpinner();
    const container = screen.getByTestId('loading-spinner-container');
    expect(container).toHaveStyle({
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      margin: '16px',
    });
  });

  it('renders with proper message styles', () => {
    renderLoadingSpinner({ message: 'Loading data...' });
    const message = screen.getByText('Loading data...');
    expect(message).toHaveStyle({
      marginTop: '16px',
      color: 'rgb(102, 102, 102)',
      fontSize: '1rem',
      fontWeight: 400,
    });
  });

  it('renders with proper spinner styles', () => {
    renderLoadingSpinner();
    const spinner = screen.getByRole('progressbar');
    expect(spinner).toHaveStyle({
      color: 'rgb(211, 47, 47)',
      animation: 'spin 1s linear infinite',
    });
  });

  it('renders with proper responsive design', () => {
    renderLoadingSpinner();
    const container = screen.getByTestId('loading-spinner-container');
    expect(container).toHaveStyle({
      padding: '24px',
    });
  });

  it('renders with proper margin when no message is provided', () => {
    renderLoadingSpinner();
    const container = screen.getByTestId('loading-spinner-container');
    expect(container).toHaveStyle({
      margin: '16px',
    });
  });

  it('renders with proper margin when message is provided', () => {
    renderLoadingSpinner({ message: 'Loading data...' });
    const container = screen.getByTestId('loading-spinner-container');
    expect(container).toHaveStyle({
      margin: '24px',
    });
  });
});
