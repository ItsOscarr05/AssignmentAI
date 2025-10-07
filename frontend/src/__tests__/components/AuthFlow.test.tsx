import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthProvider } from '../../contexts/AuthContext';
import Login from '../../pages/Login';
import Register from '../../pages/Register';

// Ensure we're in development mode for tests
if (process.env.NODE_ENV !== 'development') {
  process.env.NODE_ENV = 'development';
}

// Mock @mui/material
vi.mock('@mui/material', async importOriginal => {
  const actual = await importOriginal<typeof import('@mui/material')>();
  return {
    ...actual,
    useTheme: () => ({
      palette: {
        primary: {
          main: '#1976d2',
          dark: '#1565c0',
        },
        text: {
          primary: '#000000',
          secondary: '#666666',
        },
      },
    }),
  };
});

// Mock @mui/icons-material
vi.mock('@mui/icons-material', async importOriginal => {
  const actual = await importOriginal<typeof import('@mui/icons-material')>();
  return {
    ...actual,
    Google: () => <span data-testid="google-icon">Google</span>,
    GitHub: () => <span data-testid="github-icon">GitHub</span>,
    Visibility: () => <span data-testid="visibility-icon">Visibility</span>,
    VisibilityOff: () => <span data-testid="visibility-off-icon">VisibilityOff</span>,
    ArrowBack: () => <span data-testid="arrow-back-icon">ArrowBack</span>,
  };
});

// Mock the useNavigate hook
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock the auth service
const mockAuthLogin = vi.fn();
const mockAuthRegister = vi.fn();
const mockAuthGetCurrentUser = vi.fn();

vi.mock('../../config/api', () => ({
  auth: {
    login: mockAuthLogin,
    register: mockAuthRegister,
    getCurrentUser: mockAuthGetCurrentUser,
  },
}));

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('Authentication Flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();
  });

  const renderWithAuth = (component: React.ReactElement) => {
    return render(
      <BrowserRouter>
        <AuthProvider>{component}</AuthProvider>
      </BrowserRouter>
    );
  };

  describe('Registration Flow', () => {
    it('renders registration form with all required fields', () => {
      renderWithAuth(<Register />);

      expect(screen.getByText('Create Account')).toBeTruthy();
      expect(screen.getByLabelText('First Name')).toBeTruthy();
      expect(screen.getByLabelText('Last Name')).toBeTruthy();
      expect(screen.getByLabelText('Email')).toBeTruthy();
      expect(screen.getByLabelText('Password')).toBeTruthy();
      expect(screen.getByLabelText('Confirm Password')).toBeTruthy();
      expect(screen.getByRole('button', { name: 'Register' })).toBeTruthy();
    });

    it('validates required fields', async () => {
      renderWithAuth(<Register />);

      const submitButton = screen.getByRole('button', { name: 'Register' });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('All fields are required')).toBeTruthy();
      });
    });

    it('validates email format', async () => {
      renderWithAuth(<Register />);

      const emailInput = screen.getByLabelText('Email');
      fireEvent.change(emailInput, { target: { value: 'invalid-email' } });

      const submitButton = screen.getByRole('button', { name: 'Register' });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Invalid email format')).toBeTruthy();
      });
    });

    it('validates password match', async () => {
      renderWithAuth(<Register />);

      // Fill out form with mismatched passwords
      fireEvent.change(screen.getByLabelText('First Name'), { target: { value: 'John' } });
      fireEvent.change(screen.getByLabelText('Last Name'), { target: { value: 'Doe' } });
      fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'john@example.com' } });
      fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password123' } });
      fireEvent.change(screen.getByLabelText('Confirm Password'), {
        target: { value: 'different123' },
      });

      const submitButton = screen.getByRole('button', { name: 'Register' });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Passwords do not match')).toBeTruthy();
      });
    });

    it('handles successful registration', async () => {
      mockAuthRegister.mockResolvedValueOnce({ message: 'User registered successfully' });

      renderWithAuth(<Register />);

      // Fill out form
      fireEvent.change(screen.getByLabelText('First Name'), { target: { value: 'John' } });
      fireEvent.change(screen.getByLabelText('Last Name'), { target: { value: 'Doe' } });
      fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'john@example.com' } });
      fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password123' } });
      fireEvent.change(screen.getByLabelText('Confirm Password'), {
        target: { value: 'password123' },
      });

      const submitButton = screen.getByRole('button', { name: 'Register' });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockAuthRegister).toHaveBeenCalledWith({
          email: 'john@example.com',
          password: 'password123',
          confirm_password: 'password123',
        });
      });

      await waitFor(() => {
        expect(
          screen.getByText('Registration successful! Please log in with your credentials.')
        ).toBeTruthy();
      });

      // Should redirect to login after 2 seconds
      await waitFor(
        () => {
          expect(mockNavigate).toHaveBeenCalledWith('/login');
        },
        { timeout: 3000 }
      );
    });

    it('handles registration error', async () => {
      const errorMessage = 'Email already registered';
      mockAuthRegister.mockRejectedValueOnce(new Error(errorMessage));

      renderWithAuth(<Register />);

      // Fill out form
      fireEvent.change(screen.getByLabelText('First Name'), { target: { value: 'John' } });
      fireEvent.change(screen.getByLabelText('Last Name'), { target: { value: 'Doe' } });
      fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'john@example.com' } });
      fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password123' } });
      fireEvent.change(screen.getByLabelText('Confirm Password'), {
        target: { value: 'password123' },
      });

      const submitButton = screen.getByRole('button', { name: 'Register' });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeTruthy();
      });
    });

    it('OAuth buttons redirect to correct endpoints', () => {
      renderWithAuth(<Register />);

      const googleButton = screen.getByRole('button', { name: 'Google' });
      const githubButton = screen.getByRole('button', { name: 'GitHub' });

      expect(googleButton).toBeTruthy();
      expect(githubButton).toBeTruthy();

      // Mock window.location.href
      const mockLocation = { href: '' };
      Object.defineProperty(window, 'location', {
        value: mockLocation,
        writable: true,
      });

      fireEvent.click(googleButton);
      expect(mockLocation.href).toContain('/api/auth/google/login');

      fireEvent.click(githubButton);
      expect(mockLocation.href).toContain('/api/auth/github/login');
    });
  });

  describe('Login Flow', () => {
    it('renders login form with all required elements', () => {
      renderWithAuth(<Login />);

      expect(screen.getByLabelText(/email address/i)).toBeTruthy();
      expect(screen.getByLabelText(/password/i)).toBeTruthy();
      expect(screen.getByRole('button', { name: /sign in/i })).toBeTruthy();
    });

    it('validates email format', async () => {
      renderWithAuth(<Login />);

      const emailInput = screen.getByLabelText(/email address/i);
      fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
      fireEvent.blur(emailInput);

      await waitFor(() => {
        expect(screen.getByText(/invalid email address/i)).toBeTruthy();
      });
    });

    it('validates password length', async () => {
      renderWithAuth(<Login />);

      const passwordInput = screen.getByLabelText(/password/i);
      fireEvent.change(passwordInput, { target: { value: '12345' } });
      fireEvent.blur(passwordInput);

      await waitFor(() => {
        expect(screen.getByText(/password must be at least 6 characters/i)).toBeTruthy();
      });
    });

    it('handles successful login', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
        firstName: 'Test',
        lastName: 'User',
        role: 'student',
        bio: '',
        location: '',
        avatar: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      mockAuthLogin.mockResolvedValueOnce({ access_token: 'mock-token' });
      mockAuthGetCurrentUser.mockResolvedValueOnce(mockUser);

      renderWithAuth(<Login />);

      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockAuthLogin).toHaveBeenCalledWith('test@example.com', 'password123');
      });

      await waitFor(() => {
        expect(mockAuthGetCurrentUser).toHaveBeenCalled();
      });

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
      });
    });

    it('handles login error', async () => {
      const errorMessage = 'Invalid credentials';
      mockAuthLogin.mockRejectedValueOnce(new Error(errorMessage));

      renderWithAuth(<Login />);

      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Invalid credentials')).toBeTruthy();
      });
    });

    it('shows loading state during login', async () => {
      mockAuthLogin.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

      renderWithAuth(<Login />);

      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(submitButton);

      expect(submitButton.hasAttribute('disabled')).toBe(true);

      await waitFor(() => {
        expect(submitButton.hasAttribute('disabled')).toBe(false);
      });
    });
  });

  describe('AuthContext Integration', () => {
    it('stores user data in localStorage after successful login', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
        firstName: 'Test',
        lastName: 'User',
        role: 'student',
        bio: '',
        location: '',
        avatar: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      mockAuthLogin.mockResolvedValueOnce({ access_token: 'mock-token' });
      mockAuthGetCurrentUser.mockResolvedValueOnce(mockUser);

      renderWithAuth(<Login />);

      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(localStorageMock.setItem).toHaveBeenCalledWith('token', 'mock-token');
        expect(localStorageMock.setItem).toHaveBeenCalledWith('user', JSON.stringify(mockUser));
        expect(localStorageMock.setItem).toHaveBeenCalledWith('isMockUser', 'false');
      });
    });
  });
});
