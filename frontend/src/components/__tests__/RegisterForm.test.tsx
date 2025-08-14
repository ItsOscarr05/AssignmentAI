import { ThemeProvider } from '@mui/material/styles';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthProvider } from '../../contexts/AuthContext';
import Register from '../../pages/Register';
import { useAuthStore } from '../../services/auth/authStore';
import { theme } from '../../theme';

// Mock the auth store
vi.mock('../../services/auth/authStore', () => ({
  useAuthStore: vi.fn(),
}));

// Mock the auth context
const mockRegister = vi.fn();
const mockAuth = {
  register: mockRegister,
  isLoading: false,
  user: null,
  isAuthenticated: false,
  error: null as string | null,
};

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => mockAuth,
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Mock the router
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock Material-UI components
vi.mock('@mui/material', async () => {
  const actual = await vi.importActual('@mui/material');
  return {
    ...actual,
    Box: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    Paper: ({ children, elevation, ...props }: any) => (
      <div elevation={elevation} {...props}>
        {children}
      </div>
    ),
    Typography: ({ children, variant, align, component, ...props }: any) => {
      const Tag = component || 'p';
      return (
        <Tag align={align} {...props}>
          {children}
        </Tag>
      );
    },
    TextField: ({
      label,
      name,
      type,
      value,
      onChange,
      error,
      helperText,
      required,
      ...props
    }: any) => (
      <div>
        <label htmlFor={name}>{label}</label>
        <input
          data-testid="text-field"
          id={name}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          required={required}
          aria-invalid={error}
          aria-describedby={error ? `${name}-error` : undefined}
          {...props}
        />
        {error && (
          <p id={`${name}-error`} data-testid="form-helper-text">
            {helperText}
          </p>
        )}
      </div>
    ),
    FormControl: ({ children, error, ...props }: any) => (
      <div data-testid="form-control" {...props}>
        {children}
      </div>
    ),
    InputLabel: ({ children, htmlFor, ...props }: any) => (
      <label data-testid="input-label" htmlFor={htmlFor} {...props}>
        {children}
      </label>
    ),
    OutlinedInput: ({ id, type, value, onChange, endAdornment, label, ...props }: any) => (
      <div>
        <input
          data-testid="outlined-input"
          id={id}
          type={type}
          value={value}
          onChange={onChange}
          endadornment={endAdornment}
          label={label}
          {...props}
        />
        {endAdornment}
      </div>
    ),
    InputAdornment: ({ children, position, ...props }: any) => (
      <div data-testid="input-adornment" data-position={position} {...props}>
        {children}
      </div>
    ),
    IconButton: ({ onClick, children, 'aria-label': ariaLabel, ...props }: any) => (
      <button onClick={onClick} aria-label={ariaLabel} {...props}>
        {children}
      </button>
    ),
    FormHelperText: ({ children, error, ...props }: any) => (
      <p data-testid="form-helper-text" {...props}>
        {children}
      </p>
    ),
    Button: ({ children, type, variant, color, disabled, ...props }: any) => (
      <button type={type} disabled={disabled} {...props}>
        {children}
      </button>
    ),
    CircularProgress: ({ size, ...props }: any) => (
      <div data-testid="circular-progress" role="progressbar" size={size} {...props} />
    ),
    Alert: ({ children, severity, ...props }: any) => (
      <div role="alert" data-severity={severity} {...props}>
        {children}
      </div>
    ),
  };
});

// Mock icons
vi.mock('@mui/icons-material', () => ({
  Visibility: () => <span data-testid="visibility-icon">👁️</span>,
  VisibilityOff: () => <span data-testid="visibility-off-icon">👁️‍🗨️</span>,
}));

describe('RegisterForm', () => {
  const mockUseAuthStore = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuthStore.mockReturnValue({
      register: mockRegister,
      isLoading: false,
      user: null,
      isAuthenticated: false,
      login: vi.fn(),
      logout: vi.fn(),
      refreshToken: vi.fn(),
      error: null,
    });
    (useAuthStore as any).mockImplementation(mockUseAuthStore);
  });

  const renderRegisterForm = () => {
    return render(
      <BrowserRouter>
        <AuthProvider>
          <ThemeProvider theme={theme}>
            <Register />
          </ThemeProvider>
        </AuthProvider>
      </BrowserRouter>
    );
  };

  it('renders registration form with all required fields', () => {
    renderRegisterForm();

    expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/last name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /register/i })).toBeInTheDocument();
  });

  it('shows validation errors for empty fields', async () => {
    renderRegisterForm();
    const submitButton = screen.getByRole('button', { name: /register/i });

    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('First name is required')).toBeInTheDocument();
      expect(screen.getByText('Last name is required')).toBeInTheDocument();
      expect(screen.getByText('Email is required')).toBeInTheDocument();
      expect(screen.getByText('Password is required')).toBeInTheDocument();
      expect(screen.getByText('Please confirm your password')).toBeInTheDocument();
    });
  });

  it('prevents form submission with invalid email', async () => {
    renderRegisterForm();

    // Fill in all required fields
    const firstNameInput = screen.getByLabelText(/first name/i);
    const lastNameInput = screen.getByLabelText(/last name/i);
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/^password$/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);

    // Fill in valid data for all fields except email
    fireEvent.change(firstNameInput, { target: { value: 'John' } });
    fireEvent.change(lastNameInput, { target: { value: 'Doe' } });
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
    fireEvent.change(passwordInput, { target: { value: 'Password123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'Password123' } });

    // Submit the form
    const submitButton = screen.getByRole('button', { name: /register/i });
    fireEvent.click(submitButton);

    // Verify that register was not called and error message is shown
    await waitFor(() => {
      expect(mockRegister).not.toHaveBeenCalled();
      expect(screen.getByText('Invalid email address')).toBeInTheDocument();
    });
  });

  it('shows validation error for short password', async () => {
    renderRegisterForm();
    const passwordInput = screen.getByLabelText(/^password$/i);
    const submitButton = screen.getByRole('button', { name: /register/i });

    fireEvent.change(passwordInput, { target: { value: '123' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Password must be at least 8 characters long')).toBeInTheDocument();
    });
  });

  it('shows validation error when passwords do not match', async () => {
    renderRegisterForm();
    const passwordInput = screen.getByLabelText(/^password$/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
    const submitButton = screen.getByRole('button', { name: /register/i });

    fireEvent.change(passwordInput, { target: { value: 'Password123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'Password456' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
    });
  });

  it('submits form with valid credentials', async () => {
    renderRegisterForm();

    fireEvent.change(screen.getByLabelText(/first name/i), {
      target: { value: 'John' },
    });
    fireEvent.change(screen.getByLabelText(/last name/i), {
      target: { value: 'Doe' },
    });
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/^password$/i), {
      target: { value: 'Password123' },
    });
    fireEvent.change(screen.getByLabelText(/confirm password/i), {
      target: { value: 'Password123' },
    });

    fireEvent.click(screen.getByRole('button', { name: /register/i }));

    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith('test@example.com', 'Password123', 'John Doe');
    });
  });

  it('shows loading state during submission', async () => {
    // Mock the loading state
    mockUseAuthStore.mockReturnValue({
      register: mockRegister,
      isLoading: true,
      user: null,
      isAuthenticated: false,
      login: vi.fn(),
      logout: vi.fn(),
      refreshToken: vi.fn(),
      error: null,
    });
    renderRegisterForm();

    fireEvent.change(screen.getByLabelText(/first name/i), {
      target: { value: 'John' },
    });
    fireEvent.change(screen.getByLabelText(/last name/i), {
      target: { value: 'Doe' },
    });
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/^password$/i), {
      target: { value: 'Password123' },
    });
    fireEvent.change(screen.getByLabelText(/confirm password/i), {
      target: { value: 'Password123' },
    });

    const submitButton = screen.getByRole('button', { name: '' });
    fireEvent.click(submitButton);

    expect(submitButton).toHaveProperty('disabled', true);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('shows error message on failed registration', async () => {
    // Mock the error state
    mockUseAuthStore.mockReturnValue({
      register: mockRegister,
      isLoading: false,
      user: null,
      isAuthenticated: false,
      login: vi.fn(),
      logout: vi.fn(),
      refreshToken: vi.fn(),
      error: 'Registration failed',
    });
    renderRegisterForm();

    fireEvent.change(screen.getByLabelText(/first name/i), {
      target: { value: 'John' },
    });
    fireEvent.change(screen.getByLabelText(/last name/i), {
      target: { value: 'Doe' },
    });
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/^password$/i), {
      target: { value: 'Password123' },
    });
    fireEvent.change(screen.getByLabelText(/confirm password/i), {
      target: { value: 'Password123' },
    });

    fireEvent.click(screen.getByRole('button', { name: /register/i }));

    await waitFor(() => {
      expect(screen.getByText('Registration failed')).toBeInTheDocument();
    });
  });

  it('toggles password visibility', () => {
    renderRegisterForm();
    const passwordInput = screen.getByLabelText(/^password$/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
    const toggleButtons = screen.getAllByRole('button', { name: /toggle password visibility/i });

    // Test the first password field (main password)
    expect(passwordInput).toHaveAttribute('type', 'password');
    fireEvent.click(toggleButtons[0]);
    expect(passwordInput).toHaveAttribute('type', 'text');
    fireEvent.click(toggleButtons[0]);
    expect(passwordInput).toHaveAttribute('type', 'password');

    // Test the second password field (confirm password)
    expect(confirmPasswordInput).toHaveAttribute('type', 'password');
    fireEvent.click(toggleButtons[1]);
    expect(confirmPasswordInput).toHaveAttribute('type', 'text');
    fireEvent.click(toggleButtons[1]);
    expect(confirmPasswordInput).toHaveAttribute('type', 'password');
  });
});
