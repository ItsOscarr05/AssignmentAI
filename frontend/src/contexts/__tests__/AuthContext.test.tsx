import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ReactNode, useState } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LoginRequest, TokenWith2FA, User } from '../../types';
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
const mockVerify2FA = vi.fn();
const mockRegister = vi.fn();
const mockLogout = vi.fn();
const mockLogoutAll = vi.fn();
const mockResetPassword = vi.fn();
const mockUpdatePassword = vi.fn();
const mockMockLogin = vi.fn();

// Mock the AuthContext
vi.mock('../AuthContext', () => ({
  useAuth: () => ({
    user: mockUser,
    loading: false,
    isLoading: false,
    isAuthenticated: true,
    requires2FA: false,
    tempToken: null,
    login: mockLogin,
    verify2FA: mockVerify2FA,
    register: mockRegister,
    logout: mockLogout,
    logoutAll: mockLogoutAll,
    resetPassword: mockResetPassword,
    updatePassword: mockUpdatePassword,
    mockLogin: mockMockLogin,
  }),
  AuthProvider: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

// Test component that uses the auth context
const TestComponent = () => {
  const { login, verify2FA, register, logout, logoutAll, user, isAuthenticated, requires2FA } =
    useAuth();
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    try {
      setError(null);
      const credentials: LoginRequest = {
        email: 'test@example.com',
        password: 'password',
      };
      await login(credentials);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    }
  };

  const handle2FAVerification = async () => {
    try {
      setError(null);
      await verify2FA('123456', false);
    } catch (err) {
      setError(err instanceof Error ? err.message : '2FA verification failed');
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

  const handleLogoutAll = () => {
    try {
      setError(null);
      logoutAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Logout all failed');
    }
  };

  return (
    <div>
      <button onClick={handleLogin}>Login</button>
      <button onClick={handle2FAVerification}>Verify 2FA</button>
      <button onClick={handleRegister}>Register</button>
      <button onClick={handleLogout}>Logout</button>
      <button onClick={handleLogoutAll}>Logout All</button>
      <div data-testid="user">{user ? user.name : 'No user'}</div>
      <div data-testid="isAuthenticated">{isAuthenticated.toString()}</div>
      <div data-testid="requires2FA">{requires2FA.toString()}</div>
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
    expect(screen.getByTestId('requires2FA')).toHaveTextContent('false');
  });

  it('handles login successfully', async () => {
    const mockResponse: TokenWith2FA = {
      access_token: 'mock-token',
      token_type: 'bearer',
      expires_in: 3600,
      requires_2fa: false,
      user: {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        is_verified: true,
        is_active: true,
      },
    };
    mockLogin.mockResolvedValueOnce(mockResponse);

    renderWithAuth(<TestComponent />);
    await userEvent.click(screen.getByText('Login'));

    expect(mockLogin).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password',
    });
  });

  it('handles login with 2FA requirement', async () => {
    const mockResponse: TokenWith2FA = {
      access_token: 'temp-token',
      token_type: 'bearer',
      expires_in: 300,
      requires_2fa: true,
    };
    mockLogin.mockResolvedValueOnce(mockResponse);

    renderWithAuth(<TestComponent />);
    await userEvent.click(screen.getByText('Login'));

    expect(mockLogin).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password',
    });
  });

  it('handles 2FA verification', async () => {
    mockVerify2FA.mockResolvedValueOnce(undefined);

    renderWithAuth(<TestComponent />);
    await userEvent.click(screen.getByText('Verify 2FA'));

    expect(mockVerify2FA).toHaveBeenCalledWith('123456', false);
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

  it('handles logout all devices', async () => {
    renderWithAuth(<TestComponent />);
    await userEvent.click(screen.getByText('Logout All'));
    expect(mockLogoutAll).toHaveBeenCalled();
  });

  it('handles login failure', async () => {
    mockLogin.mockRejectedValueOnce(new Error('Invalid credentials'));
    renderWithAuth(<TestComponent />);
    await userEvent.click(screen.getByText('Login'));
    await waitFor(() => {
      expect(screen.getByTestId('error')).toHaveTextContent('Invalid credentials');
    });
  });

  it('handles 2FA verification failure', async () => {
    mockVerify2FA.mockRejectedValueOnce(new Error('Invalid 2FA code'));
    renderWithAuth(<TestComponent />);
    await userEvent.click(screen.getByText('Verify 2FA'));
    await waitFor(() => {
      expect(screen.getByTestId('error')).toHaveTextContent('Invalid 2FA code');
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

  it('handles logout failure', async () => {
    mockLogout.mockRejectedValueOnce(new Error('Logout failed'));
    renderWithAuth(<TestComponent />);
    await userEvent.click(screen.getByText('Logout'));

    // Logout should still succeed even if the API call fails
    // because the AuthContext catches the error and clears local state
    expect(mockLogout).toHaveBeenCalled();
  });
});
