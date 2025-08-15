import { ThemeProvider } from '@mui/material/styles';
// Note: Testing library not available, using basic DOM testing
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Register from '../../pages/Register';
import { useAuthStore } from '../../services/auth/authStore';
import { theme } from '../../theme';

// Simple render function since testing library is not available
const render = (_ui: React.ReactElement) => {
  // This is a placeholder - in a real setup you'd use @testing-library/react
  console.warn('Testing library not available - render function is a placeholder');
  return null;
};

// Simple screen utilities since testing library is not available
const screen = {
  getByText: (text: string) =>
    document.querySelector(`[data-testid*="${text}"]`) ||
    document.querySelector(`*:contains("${text}")`),
  getByLabelText: (label: string) =>
    document.querySelector(`label:contains("${label}") input`) ||
    document.querySelector(`input[aria-label="${label}"]`),
  getByRole: (role: string, options?: { name?: string }) => {
    if (options?.name) {
      return (
        document.querySelector(`[role="${role}"]:contains("${options.name}")`) ||
        document.querySelector(`[role="${role}"]`)
      );
    }
    return document.querySelector(`[role="${role}"]`);
  },
  getByTestId: (testId: string) => document.querySelector(`[data-testid="${testId}"]`),
};

// Simple fireEvent since testing library is not available
const fireEvent = {
  change: (element: Element, event: any) => {
    if (element instanceof HTMLInputElement) {
      element.value = event.target.value;
      element.dispatchEvent(new Event('change', { bubbles: true }));
    }
  },
  click: (element: Element) => {
    element.dispatchEvent(new Event('click', { bubbles: true }));
  },
  submit: (element: Element) => {
    element.dispatchEvent(new Event('submit', { bubbles: true }));
  },
};

// Simple waitFor since testing library is not available
const waitFor = async (callback: () => void) => {
  // Simple implementation - just call the callback
  await new Promise(resolve => setTimeout(resolve, 0));
  callback();
};

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

    expect(screen.getByText('Create Account')).toBeTruthy();
    expect(screen.getByLabelText('First Name')).toBeTruthy();
    expect(screen.getByLabelText('Last Name')).toBeTruthy();
    expect(screen.getByLabelText('Email')).toBeTruthy();
    expect(screen.getByLabelText('Password')).toBeTruthy();
    expect(screen.getByLabelText('Confirm Password')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Register' })).toBeTruthy();
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

    expect(screen.getByRole('progressbar')).toBeTruthy();
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

    expect(screen.getByRole('alert')).toHaveProperty('textContent', 'Email already exists');
  });

  it('handles form submission', async () => {
    render(
      <ThemeProvider theme={theme}>
        <Register />
      </ThemeProvider>
    );

    const firstNameInput = screen.getByLabelText('First Name');
    const lastNameInput = screen.getByLabelText('Last Name');
    const emailInput = screen.getByLabelText('Email');
    const passwordInput = screen.getByLabelText('Password');
    const confirmPasswordInput = screen.getByLabelText('Confirm Password');
    const registerButton = screen.getByRole('button', { name: 'Register' });

    expect(firstNameInput).toBeTruthy();
    expect(lastNameInput).toBeTruthy();
    expect(emailInput).toBeTruthy();
    expect(passwordInput).toBeTruthy();
    expect(confirmPasswordInput).toBeTruthy();
    expect(registerButton).toBeTruthy();

    if (
      !firstNameInput ||
      !lastNameInput ||
      !emailInput ||
      !passwordInput ||
      !confirmPasswordInput ||
      !registerButton
    )
      return;

    fireEvent.change(firstNameInput, {
      target: { value: 'John' },
    });
    fireEvent.change(lastNameInput, {
      target: { value: 'Doe' },
    });
    fireEvent.change(emailInput, {
      target: { value: 'john@example.com' },
    });
    fireEvent.change(passwordInput, {
      target: { value: 'password123' },
    });
    fireEvent.change(confirmPasswordInput, {
      target: { value: 'password123' },
    });

    fireEvent.click(registerButton);

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
    expect(submitButton).toBeTruthy();
    if (!submitButton) return;

    const form = submitButton.closest('form');
    expect(form).toBeTruthy();
    if (!form) return;

    // Submit the form
    fireEvent.submit(form);

    // Wait for the validation error to appear
    await waitFor(() => {
      expect(screen.getByText('All fields are required')).toBeTruthy();
    });
  });

  it('validates password match', async () => {
    render(
      <ThemeProvider theme={theme}>
        <Register />
      </ThemeProvider>
    );

    const firstNameInput = screen.getByLabelText('First Name');
    const lastNameInput = screen.getByLabelText('Last Name');
    const emailInput = screen.getByLabelText('Email');
    const passwordInput = screen.getByLabelText('Password');
    const confirmPasswordInput = screen.getByLabelText('Confirm Password');
    const registerButton = screen.getByRole('button', { name: 'Register' });

    expect(firstNameInput).toBeTruthy();
    expect(lastNameInput).toBeTruthy();
    expect(emailInput).toBeTruthy();
    expect(passwordInput).toBeTruthy();
    expect(confirmPasswordInput).toBeTruthy();
    expect(registerButton).toBeTruthy();

    if (
      !firstNameInput ||
      !lastNameInput ||
      !emailInput ||
      !passwordInput ||
      !confirmPasswordInput ||
      !registerButton
    )
      return;

    fireEvent.change(firstNameInput, {
      target: { value: 'John' },
    });
    fireEvent.change(lastNameInput, {
      target: { value: 'Doe' },
    });
    fireEvent.change(emailInput, {
      target: { value: 'john@example.com' },
    });
    fireEvent.change(passwordInput, {
      target: { value: 'password123' },
    });
    fireEvent.change(confirmPasswordInput, {
      target: { value: 'different123' },
    });

    fireEvent.click(registerButton);

    await waitFor(() => {
      const errorAlert = screen.getByRole('alert');
      expect(errorAlert).toHaveProperty('textContent', 'Passwords do not match');
    });
  });
});
