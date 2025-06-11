import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Login } from '../components/auth/Login';
import { OAuthCallback } from '../components/auth/OAuthCallback';
import { AuthProvider } from '../contexts/AuthContext';

// Mock the auth service
const mockAuthService = {
  login: vi.fn(),
  handleCallback: vi.fn(),
  logout: vi.fn(),
  isAuthenticated: vi.fn(),
  getToken: vi.fn(),
  refreshToken: vi.fn(),
};

vi.mock('../services/auth', () => ({
  AuthService: {
    getInstance: () => mockAuthService,
  },
}));

describe('OAuth Flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Login Component', () => {
    it('renders login form with OAuth buttons', () => {
      render(
        <AuthProvider>
          <Login />
        </AuthProvider>
      );

      expect(screen.getByText(/Sign in with Google/i)).toBeTruthy();
      expect(screen.getByText(/Sign in with GitHub/i)).toBeTruthy();
      expect(screen.getByText(/Sign in with Microsoft/i)).toBeTruthy();
    });

    it('handles OAuth login click', async () => {
      mockAuthService.login.mockResolvedValueOnce({ success: true });

      render(
        <AuthProvider>
          <Login />
        </AuthProvider>
      );

      const googleButton = screen.getByText(/Sign in with Google/i);
      fireEvent.click(googleButton);

      await waitFor(() => {
        expect(mockAuthService.login).toHaveBeenCalledWith('google');
      });
    });
  });

  describe('OAuth Callback Component', () => {
    it('handles successful OAuth callback', async () => {
      const mockUser = { id: '1', email: 'test@example.com' };
      mockAuthService.handleCallback.mockResolvedValueOnce(mockUser);

      render(
        <AuthProvider>
          <MemoryRouter initialEntries={['/auth/callback?code=123&state=xyz']}>
            <Routes>
              <Route path="/auth/callback" element={<OAuthCallback />} />
            </Routes>
          </MemoryRouter>
        </AuthProvider>
      );

      await waitFor(() => {
        expect(mockAuthService.handleCallback).toHaveBeenCalledWith('123', 'xyz');
      });
    });

    it('handles OAuth callback error', async () => {
      mockAuthService.handleCallback.mockRejectedValueOnce(new Error('Invalid code'));

      render(
        <AuthProvider>
          <MemoryRouter initialEntries={['/auth/callback?error=access_denied']}>
            <Routes>
              <Route path="/auth/callback" element={<OAuthCallback />} />
            </Routes>
          </MemoryRouter>
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByText(/Authentication failed/i)).toBeTruthy();
      });
    });
  });

  describe('Token Refresh', () => {
    it('refreshes token when expired', async () => {
      const mockNewToken = 'new-token-123';
      mockAuthService.getToken.mockReturnValueOnce('expired-token');
      mockAuthService.refreshToken.mockResolvedValueOnce(mockNewToken);

      await mockAuthService.refreshToken();

      expect(mockAuthService.refreshToken).toHaveBeenCalled();
      expect(mockAuthService.getToken()).toBe('expired-token');
    });

    it('handles token refresh failure', async () => {
      mockAuthService.getToken.mockReturnValueOnce('expired-token');
      mockAuthService.refreshToken.mockRejectedValueOnce(new Error('Refresh failed'));

      await expect(mockAuthService.refreshToken()).rejects.toThrow('Refresh failed');
      expect(mockAuthService.refreshToken).toHaveBeenCalled();
    });
  });
});
