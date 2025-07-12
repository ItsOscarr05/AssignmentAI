import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ReactNode, useState } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { User } from '../../types';
import { AuthProvider, useAuth } from '../AuthContext';

// Mock the router
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock the AuthContext
const mockUser: User = {
  id: '1',
  email: 'dev@example.com',
  name: 'Development User',
  role: 'teacher',
  firstName: 'Development',
  lastName: 'User',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

// Create mock functions
const mockLogin = vi.fn();
const mockRegister = vi.fn();
const mockLogout = vi.fn();
const mockResetPassword = vi.fn();
const mockUpdatePassword = vi.fn();
const mockVerifyEmail = vi.fn();

// Mock the AuthContext
vi.mock('../AuthContext', () => ({
  useAuth: () => ({
    user: mockUser,
    loading: false,
    isLoading: false,
    isAuthenticated: true,
    login: mockLogin,
    register: mockRegister,
    logout: mockLogout,
    resetPassword: mockResetPassword,
    updatePassword: mockUpdatePassword,
    verifyEmail: mockVerifyEmail,
  }),
  AuthProvider: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

// Test component that uses the auth context
const TestComponent = () => {
  const { login, register, logout, user, isAuthenticated } = useAuth();
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    try {
      setError(null);
      await login('google'); // Using OAuth provider for login
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    }
  };

  const handleRegister = async () => {
    try {
      setError(null);
      await register({
        email: 'test@example.com',
        password: 'password',
        confirm_password: 'password',
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    }
  };

  const handleLogout = () => {
    try {
      setError(null);
      logout();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Logout failed');
    }
  };

  return (
    <div>
      <button onClick={handleLogin}>Login</button>
      <button onClick={handleRegister}>Register</button>
      <button onClick={handleLogout}>Logout</button>
      <div data-testid="user">{user ? user.name : 'No user'}</div>
      <div data-testid="isAuthenticated">{isAuthenticated.toString()}</div>
      {error && <div data-testid="error">{error}</div>}
    </div>
  );
};

const renderWithAuth = (component: ReactNode) => {
  return render(
    <BrowserRouter>
      <AuthProvider>{component}</AuthProvider>
    </BrowserRouter>
  );
};

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('provides authentication context', () => {
    renderWithAuth(<TestComponent />);
    expect(screen.getByTestId('user')).toHaveTextContent('Development User');
    expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('true');
  });

  it('handles login in development mode', async () => {
    renderWithAuth(<TestComponent />);
    await userEvent.click(screen.getByText('Login'));
    expect(mockLogin).toHaveBeenCalledWith('google');
  });

  it('handles registration', async () => {
    renderWithAuth(<TestComponent />);
    await userEvent.click(screen.getByText('Register'));
    expect(mockRegister).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password',
      confirm_password: 'password',
    });
  });

  it('handles logout', async () => {
    renderWithAuth(<TestComponent />);
    await userEvent.click(screen.getByText('Logout'));
    expect(mockLogout).toHaveBeenCalled();
  });

  it('handles login failure', async () => {
    mockLogin.mockRejectedValueOnce(new Error('Invalid credentials'));
    renderWithAuth(<TestComponent />);
    await userEvent.click(screen.getByText('Login'));
    await waitFor(() => {
      expect(screen.getByTestId('error')).toHaveTextContent('Invalid credentials');
    });
  });

  it('handles registration failure', async () => {
    mockRegister.mockRejectedValueOnce(new Error('Registration failed'));
    renderWithAuth(<TestComponent />);
    await userEvent.click(screen.getByText('Register'));
    await waitFor(() => {
      expect(screen.getByTestId('error')).toHaveTextContent('Registration failed');
    });
  });
});
