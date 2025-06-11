import { ThemeProvider, createTheme } from '@mui/material';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { auth } from '../../services/api';
import { TwoFactorVerify } from '../auth/TwoFactorVerify';

// Mock Material-UI components
vi.mock('@mui/material', async () => {
  const actual = await vi.importActual('@mui/material');
  return {
    ...actual,
    createTheme: () => ({
      palette: {
        primary: { main: '#1976d2' },
        secondary: { main: '#dc004e' },
      },
      spacing: (factor: number) => `${factor * 8}px`,
      typography: {
        fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
        h4: {
          fontSize: '2.125rem',
          fontWeight: 400,
          lineHeight: 1.235,
        },
        body1: {
          fontSize: '1rem',
          fontWeight: 400,
          lineHeight: 1.5,
        },
      },
      shape: {
        borderRadius: 4,
      },
      breakpoints: {
        values: {
          xs: 0,
          sm: 600,
          md: 960,
          lg: 1280,
          xl: 1920,
        },
        up: (key: string) => `@media (min-width:${key}px)`,
        down: (key: string) => `@media (max-width:${key}px)`,
        between: (start: string, end: string) =>
          `@media (min-width:${start}px) and (max-width:${end}px)`,
        only: (key: string) => `@media (min-width:${key}px) and (max-width:${key}px)`,
      },
      components: {
        MuiButton: {
          styleOverrides: {
            root: {
              textTransform: 'none',
            },
          },
        },
      },
    }),
    Box: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    Typography: ({ children, ...props }: any) => <p {...props}>{children}</p>,
    TextField: ({
      label,
      value,
      onChange,
      error,
      helperText,
      inputProps,
      type = 'text',
      ...props
    }: any) => {
      const inputId = `input-${label?.toLowerCase().replace(/\s+/g, '-')}`;
      return (
        <div>
          {label && <label htmlFor={inputId}>{label}</label>}
          <input
            id={inputId}
            type={type}
            value={value}
            onChange={onChange}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={error ? 'error-text' : undefined}
            {...inputProps}
            {...props}
          />
          {error && <p id="error-text">{helperText}</p>}
        </div>
      );
    },
    Button: ({ children, onClick, variant, color, disabled, type = 'button', ...props }: any) => (
      <button
        type={type}
        onClick={onClick}
        disabled={disabled}
        data-variant={variant}
        data-color={color}
        {...props}
      >
        {children}
      </button>
    ),
    Paper: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    Container: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    Alert: ({ children, severity, ...props }: any) => (
      <div role="alert" data-severity={severity} {...props}>
        {children}
      </div>
    ),
    CircularProgress: ({ size, ...props }: any) => (
      <div role="progressbar" data-size={size} {...props} />
    ),
  };
});

// Mock auth service
vi.mock('../../services/api', () => ({
  auth: {
    verify2FA: vi.fn(),
    verifyBackupCode: vi.fn(),
  },
}));

describe('TwoFactorVerify', () => {
  const mockOnSuccess = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderTwoFactorVerify = (props = {}) => {
    return render(
      <ThemeProvider theme={createTheme()}>
        <TwoFactorVerify onSuccess={mockOnSuccess} {...props} />
      </ThemeProvider>
    );
  };

  describe('Basic Rendering', () => {
    it('renders verification form', () => {
      renderTwoFactorVerify();
      expect(screen.getByText(/two-factor authentication/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/verification code/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /verify/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /use backup code/i })).toBeInTheDocument();
    });
  });

  describe('Form Interaction', () => {
    it('handles code input', () => {
      renderTwoFactorVerify();
      const input = screen.getByLabelText(/verification code/i);
      fireEvent.change(input, { target: { value: '123456' } });
      expect(input).toHaveValue('123456');
    });

    it('handles verify button click', async () => {
      renderTwoFactorVerify();
      const input = screen.getByLabelText(/verification code/i);
      fireEvent.change(input, { target: { value: '123456' } });

      // Mock successful verification
      vi.mocked(auth.verify2FA).mockResolvedValueOnce(undefined);

      fireEvent.click(screen.getByRole('button', { name: /verify/i }));

      // Wait for the async operation to complete
      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalled();
      });
    });

    it('handles backup code toggle', () => {
      renderTwoFactorVerify();
      const toggleButton = screen.getByRole('button', { name: /use backup code/i });
      fireEvent.click(toggleButton);
      expect(screen.getByLabelText(/backup code/i)).toBeInTheDocument();
    });
  });

  describe('Validation', () => {
    it('disables verify button for invalid code length', () => {
      renderTwoFactorVerify();
      const input = screen.getByLabelText(/verification code/i);
      fireEvent.change(input, { target: { value: '123' } });
      expect(screen.getByRole('button', { name: /verify/i })).toBeDisabled();
    });

    it('shows error message on verification failure', async () => {
      const errorMessage = 'Invalid verification code';
      vi.mocked(auth.verify2FA).mockRejectedValueOnce(new Error(errorMessage));
      renderTwoFactorVerify();
      const input = screen.getByLabelText(/verification code/i);
      fireEvent.change(input, { target: { value: '123456' } });
      fireEvent.click(screen.getByRole('button', { name: /verify/i }));
      expect(await screen.findByText(errorMessage)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA attributes', () => {
      renderTwoFactorVerify();
      const input = screen.getByLabelText(/verification code/i);
      expect(input).toHaveAttribute('type', 'text');
      expect(input).toHaveAttribute('aria-invalid', 'false');
    });

    it('shows error state with ARIA attributes', async () => {
      const errorMessage = 'Invalid verification code';
      vi.mocked(auth.verify2FA).mockRejectedValueOnce(new Error(errorMessage));
      renderTwoFactorVerify();
      const input = screen.getByLabelText(/verification code/i);
      fireEvent.change(input, { target: { value: '123456' } });
      fireEvent.click(screen.getByRole('button', { name: /verify/i }));

      // Wait for error message to appear in Alert component
      await waitFor(() => {
        const errorAlert = screen.getByRole('alert');
        expect(errorAlert).toHaveAttribute('data-severity', 'error');
        expect(errorAlert).toHaveTextContent(errorMessage);
      });
    });
  });
});
