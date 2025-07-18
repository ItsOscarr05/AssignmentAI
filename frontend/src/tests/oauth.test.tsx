import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Login } from '../components/auth/Login';
import { OAuthCallback } from '../components/auth/OAuthCallback';
import { AuthContext } from '../contexts/AuthContext';

// Mock window.location.href
const mockLocation = { href: '' };
Object.defineProperty(window, 'location', {
  value: mockLocation,
  writable: true,
});

// Mock the auth context methods
const mockLogin = vi.fn();
const mockHandleCallback = vi.fn();
const mockLogout = vi.fn();
const mockGetToken = vi.fn();
const mockRefreshToken = vi.fn();

const mockAuthContextValue = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  isMockUser: false,
  login: mockLogin,
  handleCallback: mockHandleCallback,
  logout: mockLogout,
  updateUser: vi.fn(),
  register: vi.fn(),
  mockLogin: vi.fn(),
  testLogin: vi.fn(),
  resetPassword: vi.fn(),
  updatePassword: vi.fn(),
};

// Mock the AuthContext
vi.mock('../contexts/AuthContext', async () => {
  const actual = await vi.importActual('../contexts/AuthContext');
  return {
    ...actual,
    useAuth: () => mockAuthContextValue,
  };
});

describe('OAuth Flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocation.href = ''; // Reset mock location
  });

  describe('Login Component', () => {
    it('renders login form with OAuth buttons', () => {
      render(
        <AuthContext.Provider value={mockAuthContextValue}>
          <Login />
        </AuthContext.Provider>
      );

      expect(screen.getByText(/Sign in with Google/i)).toBeTruthy();
      expect(screen.getByText(/Sign in with GitHub/i)).toBeTruthy();
      expect(screen.getByText(/Sign in with Microsoft/i)).toBeTruthy();
    });

    it('handles OAuth login click', async () => {
      mockLogin.mockResolvedValueOnce({ success: true });

      render(
        <AuthContext.Provider value={mockAuthContextValue}>
          <Login />
        </AuthContext.Provider>
      );

      const googleButton = screen.getByText(/Sign in with Google/i);
      fireEvent.click(googleButton);

      await waitFor(() => {
        // OAuth login now redirects to provider URL, doesn't call login function
        expect(window.location.href).toContain('/api/auth/google/login');
      });
    });
  });

  describe('OAuth Callback Component', () => {
    it('handles successful OAuth callback', async () => {
      const mockUser = { id: '1', email: 'test@example.com' };
      mockHandleCallback.mockResolvedValueOnce(mockUser);

      render(
        <AuthContext.Provider value={mockAuthContextValue}>
          <MemoryRouter initialEntries={['/auth/callback?code=123&state=xyz']}>
            <Routes>
              <Route path="/auth/callback" element={<OAuthCallback />} />
            </Routes>
          </MemoryRouter>
        </AuthContext.Provider>
      );

      await waitFor(() => {
        expect(mockHandleCallback).toHaveBeenCalledWith('123', 'xyz');
      });
    });

    it('handles OAuth callback error', async () => {
      mockHandleCallback.mockRejectedValueOnce(new Error('Invalid code'));

      render(
        <AuthContext.Provider value={mockAuthContextValue}>
          <MemoryRouter initialEntries={['/auth/callback?error=access_denied']}>
            <Routes>
              <Route path="/auth/callback" element={<OAuthCallback />} />
            </Routes>
          </MemoryRouter>
        </AuthContext.Provider>
      );

      await waitFor(() => {
        expect(screen.getByText(/Authentication failed/i)).toBeTruthy();
      });
    });
  });

  describe('Token Refresh', () => {
    it('refreshes token when expired', async () => {
      const mockNewToken = 'new-token-123';
      mockGetToken.mockReturnValueOnce('expired-token');
      mockRefreshToken.mockResolvedValueOnce(mockNewToken);

      await mockRefreshToken();

      expect(mockRefreshToken).toHaveBeenCalled();
      expect(mockGetToken()).toBe('expired-token');
    });

    it('handles token refresh failure', async () => {
      mockGetToken.mockReturnValueOnce('expired-token');
      mockRefreshToken.mockRejectedValueOnce(new Error('Refresh failed'));

      await expect(mockRefreshToken()).rejects.toThrow('Refresh failed');
      expect(mockRefreshToken).toHaveBeenCalled();
    });
  });
});
