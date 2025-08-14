import { ThemeProvider } from '@mui/material/styles';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Register from '../../pages/Register';
import { useAuthStore } from '../../services/AuthService';
import { theme } from '../../theme';

// Mock @mui/material
vi.mock('@mui/material', async importOriginal => {
  const actual = await importOriginal<typeof import('@mui/material')>();
  return {
    ...actual,
    TextField: ({ label, name, type, value, onChange, required, margin }: any) => (
      <div style={{ margin: margin === 'normal' ? '16px 0' : undefined }}>
        <label htmlFor={name}>
          {label}
          {required && <span aria-hidden="true"> *</span>}
        </label>
        <input
          id={name}
          name={name}
          type={type || 'text'}
          value={value}
          onChange={onChange}
          required={required}
          aria-label={label}
        />
      </div>
    ),
    Alert: ({
      children,
      severity,
      sx,
    }: {
      children: React.ReactNode;
      severity: string;
      sx?: any;
    }) => (
      <div role="alert" data-severity={severity} style={sx}>
        {children}
      </div>
    ),
    Link: ({ children, href }: { children: React.ReactNode; href: string }) => (
      <a href={href}>{children}</a>
    ),
    Button: ({ children, type, disabled }: any) => (
      <button type={type} disabled={disabled}>
        {children}
      </button>
    ),
    CircularProgress: () => <div role="progressbar" />,
    ThemeProvider: ({ children }: { children: React.ReactNode }) => children,
    Box: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    Paper: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    Container: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    Typography: ({ children, component, ...props }: any) => {
      const Tag = component || 'p';
      return <Tag {...props}>{children}</Tag>;
    },
  };
});

const mockNavigate = vi.fn();

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

vi.mock('../../services/AuthService', () => ({
  useAuthStore: vi.fn(),
}));

describe('Register Component', () => {
  const mockRegister = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useAuthStore as any).mockReturnValue({
      register: mockRegister,
      isLoading: false,
      error: null,
    });
  });

  it('renders registration form', () => {
    render(
      <ThemeProvider theme={theme}>
        <Register />
      </ThemeProvider>
    );

    expect(screen.getByText('Create Account')).toBeInTheDocument();
    expect(screen.getByLabelText('First Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Last Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByLabelText('Confirm Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Register' })).toBeInTheDocument();
  });

  it('shows loading state', () => {
    (useAuthStore as any).mockReturnValue({
      register: mockRegister,
      isLoading: true,
      error: null,
    });

    render(
      <ThemeProvider theme={theme}>
        <Register />
      </ThemeProvider>
    );

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('shows error message', () => {
    (useAuthStore as any).mockReturnValue({
      register: mockRegister,
      isLoading: false,
      error: 'Email already exists',
    });

    render(
      <ThemeProvider theme={theme}>
        <Register />
      </ThemeProvider>
    );

    expect(screen.getByRole('alert')).toHaveTextContent('Email already exists');
  });

  it('handles form submission', async () => {
    render(
      <ThemeProvider theme={theme}>
        <Register />
      </ThemeProvider>
    );

    fireEvent.change(screen.getByLabelText('First Name'), {
      target: { value: 'John' },
    });
    fireEvent.change(screen.getByLabelText('Last Name'), {
      target: { value: 'Doe' },
    });
    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'john@example.com' },
    });
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'password123' },
    });
    fireEvent.change(screen.getByLabelText('Confirm Password'), {
      target: { value: 'password123' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Register' }));

    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'password123',
      });
    });
  });

  it('validates form inputs', async () => {
    render(
      <ThemeProvider theme={theme}>
        <Register />
      </ThemeProvider>
    );

    // Get the form element by finding the submit button and getting its parent form
    const submitButton = screen.getByRole('button', { name: 'Register' });
    const form = submitButton.closest('form');

    // Submit the form
    fireEvent.submit(form!);

    // Wait for the validation error to appear
    await waitFor(() => {
      expect(screen.getByText('All fields are required')).toBeInTheDocument();
    });
  });

  it('validates password match', async () => {
    render(
      <ThemeProvider theme={theme}>
        <Register />
      </ThemeProvider>
    );

    fireEvent.change(screen.getByLabelText('First Name'), {
      target: { value: 'John' },
    });
    fireEvent.change(screen.getByLabelText('Last Name'), {
      target: { value: 'Doe' },
    });
    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'john@example.com' },
    });
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'password123' },
    });
    fireEvent.change(screen.getByLabelText('Confirm Password'), {
      target: { value: 'different123' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Register' }));

    await waitFor(() => {
      const errorAlert = screen.getByRole('alert');
      expect(errorAlert).toHaveTextContent('Passwords do not match');
    });
  });
});
