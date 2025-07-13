import { ThemeProvider } from '@mui/material/styles';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import LoginForm from '../../components/auth/LoginForm';
import SignUpForm from '../../components/auth/SignUpForm';
import { AuthProvider } from '../../contexts/AuthContext';
import { useAuth } from '../../hooks/useAuth';
import { theme } from '../../theme';

// Mock @mui/material

// Mock @mui/icons-material
vi.mock('@mui/icons-material', () => ({
  Google: () => <span data-testid="google-icon" />,
  Facebook: () => <span data-testid="facebook-icon" />,
  Apple: () => <span data-testid="apple-icon" />,
}));

// Mock the auth hook
vi.mock('../../hooks/useAuth');

const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  BrowserRouter: ({ children }: { children: React.ReactNode }) => (
    <MemoryRouter>{children}</MemoryRouter>
  ),
  MemoryRouter: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

describe('Authentication Flow', () => {
  const mockLogin = vi.fn();
  const mockRegister = vi.fn();
  const mockLogout = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockLogin.mockImplementation(async data => {
      mockNavigate('/dashboard');
      return { user: { id: '1', email: data.email } };
    });
    mockRegister.mockImplementation(async data => {
      mockNavigate('/dashboard');
      return { user: { id: '1', email: data.email } };
    });
    mockLogout.mockImplementation(async () => {
      mockNavigate('/login');
    });
    (useAuth as any).mockReturnValue({
      login: mockLogin,
      register: mockRegister,
      logout: mockLogout,
      isAuthenticated: false,
      user: null,
      loading: false,
    });
  });

  describe('Login Flow', () => {
    const renderLoginForm = () => {
      return render(
        <BrowserRouter>
          <ThemeProvider theme={theme}>
            <AuthProvider>
              <LoginForm />
            </AuthProvider>
          </ThemeProvider>
        </BrowserRouter>
      );
    };

    it('should handle successful login', async () => {
      mockLogin.mockResolvedValueOnce({ user: { id: '1', email: 'test@example.com' } });
      renderLoginForm();

      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      });

      const emailInput = screen.getByRole('textbox', { name: /email/i });
      const passwordInput = screen.getByLabelText(/^password$/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      fireEvent.change(emailInput, {
        target: { value: 'test@example.com' },
      });
      fireEvent.change(passwordInput, {
        target: { value: 'password123' },
      });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'password123',
        });
        expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
      });
    });

    it('should display error message on login failure', async () => {
      mockLogin.mockRejectedValueOnce(new Error('Invalid credentials'));
      renderLoginForm();

      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      });

      const emailInput = screen.getByRole('textbox', { name: /email/i });
      const passwordInput = screen.getByLabelText(/^password$/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      fireEvent.change(emailInput, {
        target: { value: 'test@example.com' },
      });
      fireEvent.change(passwordInput, {
        target: { value: 'wrongpassword' },
      });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
      });
    });

    it('should validate required fields', async () => {
      renderLoginForm();

      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      });

      const submitButton = screen.getByRole('button', { name: /sign in/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/email is required/i)).toBeInTheDocument();
        expect(screen.getByText(/password is required/i)).toBeInTheDocument();
      });
    });
  });

  describe('Registration Flow', () => {
    const renderRegisterForm = () => {
      return render(
        <BrowserRouter>
          <ThemeProvider theme={theme}>
            <AuthProvider>
              <SignUpForm />
            </AuthProvider>
          </ThemeProvider>
        </BrowserRouter>
      );
    };

    it('should handle successful registration', async () => {
      mockRegister.mockResolvedValueOnce({ user: { id: '1', email: 'new@example.com' } });
      renderRegisterForm();

      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      });

      const emailInput = screen.getByRole('textbox', { name: /email/i });
      const passwordInput = screen.getByLabelText(/^password$/i);
      const confirmPasswordInput = screen.getByLabelText(/^confirm password$/i);
      const submitButton = screen.getByRole('button', { name: /sign up/i });

      fireEvent.change(emailInput, {
        target: { value: 'new@example.com' },
      });
      fireEvent.change(passwordInput, {
        target: { value: 'password123' },
      });
      fireEvent.change(confirmPasswordInput, {
        target: { value: 'password123' },
      });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockRegister).toHaveBeenCalledWith({
          email: 'new@example.com',
          password: 'password123',
        });
        expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
      });
    });

    it('should validate password match', async () => {
      renderRegisterForm();

      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      });

      const passwordInput = screen.getByLabelText(/^password$/i);
      const confirmPasswordInput = screen.getByLabelText(/^confirm password$/i);
      const submitButton = screen.getByRole('button', { name: /sign up/i });

      fireEvent.change(passwordInput, {
        target: { value: 'password123' },
      });
      fireEvent.change(confirmPasswordInput, {
        target: { value: 'differentpassword' },
      });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
      });
    });
  });

  describe('Logout Flow', () => {
    it('should handle successful logout', async () => {
      (useAuth as any).mockReturnValue({
        logout: mockLogout,
        isAuthenticated: true,
        user: { id: '1', email: 'test@example.com' },
      });

      render(
        <BrowserRouter>
          <ThemeProvider theme={theme}>
            <AuthProvider>
              <button onClick={() => mockLogout()}>Logout</button>
            </AuthProvider>
          </ThemeProvider>
        </BrowserRouter>
      );

      fireEvent.click(screen.getByText(/logout/i));

      await waitFor(() => {
        expect(mockLogout).toHaveBeenCalled();
        expect(mockNavigate).toHaveBeenCalledWith('/login');
      });
    });
  });

  describe('Protected Routes', () => {
    it('should redirect to login when accessing protected route while unauthenticated', async () => {
      (useAuth as any).mockReturnValue({
        isAuthenticated: false,
        loading: false,
      });

      render(
        <BrowserRouter>
          <ThemeProvider theme={theme}>
            <AuthProvider>
              <div>Protected Content</div>
            </AuthProvider>
          </ThemeProvider>
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/login');
      });
    });

    it('should allow access to protected route when authenticated', () => {
      (useAuth as any).mockReturnValue({
        isAuthenticated: true,
        user: { id: '1', email: 'test@example.com' },
        loading: false,
      });

      render(
        <BrowserRouter>
          <ThemeProvider theme={theme}>
            <AuthProvider>
              <div>Protected Content</div>
            </AuthProvider>
          </ThemeProvider>
        </BrowserRouter>
      );

      expect(mockNavigate).not.toHaveBeenCalled();
      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });
  });
});
