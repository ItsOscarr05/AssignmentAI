import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { authService } from '../services/auth';
import { OAuthCallback } from '../components/auth/OAuthCallback';
import { Login } from '../components/auth/Login';

// Mock the auth service
vi.mock('../services/auth', () => ({
  authService: {
    getOAuthUrl: vi.fn(),
    handleOAuthCallback: vi.fn(),
    getToken: vi.fn(),
    setToken: vi.fn(),
    refreshToken: vi.fn(),
    clearAuth: vi.fn(),
  },
}));

describe('OAuth Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('OAuth Login', () => {
    it('should render OAuth login buttons', () => {
      render(
        <MemoryRouter>
          <Login />
        </MemoryRouter>
      );

      expect(screen.getByText(/Sign in with Google/i)).toBeInTheDocument();
      expect(screen.getByText(/Sign in with GitHub/i)).toBeInTheDocument();
      expect(screen.getByText(/Sign in with Facebook/i)).toBeInTheDocument();
    });

    it('should handle Google OAuth login', async () => {
      const mockUrl = 'https://accounts.google.com/o/oauth2/v2/auth';
      vi.mocked(authService.getOAuthUrl).mockResolvedValue({ url: mockUrl });

      render(
        <MemoryRouter>
          <Login />
        </MemoryRouter>
      );

      const googleButton = screen.getByText(/Sign in with Google/i);
      fireEvent.click(googleButton);

      await waitFor(() => {
        expect(authService.getOAuthUrl).toHaveBeenCalledWith('google');
        expect(window.location.href).toBe(mockUrl);
      });
    });

    it('should handle GitHub OAuth login', async () => {
      const mockUrl = 'https://github.com/login/oauth/authorize';
      vi.mocked(authService.getOAuthUrl).mockResolvedValue({ url: mockUrl });

      render(
        <MemoryRouter>
          <Login />
        </MemoryRouter>
      );

      const githubButton = screen.getByText(/Sign in with GitHub/i);
      fireEvent.click(githubButton);

      await waitFor(() => {
        expect(authService.getOAuthUrl).toHaveBeenCalledWith('github');
        expect(window.location.href).toBe(mockUrl);
      });
    });
  });

  describe('OAuth Callback', () => {
    const mockToken = {
      access_token: 'mock_access_token',
      refresh_token: 'mock_refresh_token',
      token_type: 'bearer',
      expires_in: 3600,
    };

    it('should handle successful OAuth callback', async () => {
      vi.mocked(authService.handleOAuthCallback).mockResolvedValue(mockToken);

      render(
        <MemoryRouter initialEntries={['/oauth/callback/google?code=test_code&state=test_state']}>
          <Routes>
            <Route path="/oauth/callback/:provider" element={<OAuthCallback />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(authService.handleOAuthCallback).toHaveBeenCalledWith(
          'google',
          'test_code',
          'test_state'
        );
        expect(authService.setToken).toHaveBeenCalledWith(mockToken.access_token);
      });
    });

    it('should handle OAuth callback error', async () => {
      vi.mocked(authService.handleOAuthCallback).mockRejectedValue(new Error('OAuth error'));

      render(
        <MemoryRouter
          initialEntries={['/oauth/callback/google?code=invalid_code&state=test_state']}
        >
          <Routes>
            <Route path="/oauth/callback/:provider" element={<OAuthCallback />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/Authentication failed/i)).toBeInTheDocument();
      });
    });

    it('should handle missing OAuth parameters', async () => {
      render(
        <MemoryRouter initialEntries={['/oauth/callback/google']}>
          <Routes>
            <Route path="/oauth/callback/:provider" element={<OAuthCallback />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/Invalid OAuth parameters/i)).toBeInTheDocument();
      });
    });
  });

  describe('OAuth Token Refresh', () => {
    it('should refresh token before expiration', async () => {
      const mockToken = {
        access_token: 'new_access_token',
        refresh_token: 'new_refresh_token',
        expires_in: 3600,
      };

      vi.mocked(authService.refreshToken).mockResolvedValue(mockToken);

      // Simulate token expiration in 1 minute
      vi.useFakeTimers();
      const expirationTime = Date.now() + 60000;

      // Set up token expiration
      localStorage.setItem('token', 'old_token');
      localStorage.setItem('token_expiration', expirationTime.toString());

      // Wait for refresh timer
      vi.advanceTimersByTime(59000);

      await waitFor(() => {
        expect(authService.refreshToken).toHaveBeenCalled();
        expect(authService.setToken).toHaveBeenCalledWith(mockToken.access_token);
      });

      vi.useRealTimers();
    });

    it('should handle token refresh error', async () => {
      vi.mocked(authService.refreshToken).mockRejectedValue(new Error('Refresh failed'));

      // Simulate token expiration
      vi.useFakeTimers();
      const expirationTime = Date.now() + 60000;
      localStorage.setItem('token', 'old_token');
      localStorage.setItem('token_expiration', expirationTime.toString());

      // Wait for refresh timer
      vi.advanceTimersByTime(59000);

      await waitFor(() => {
        expect(authService.clearAuth).toHaveBeenCalled();
      });

      vi.useRealTimers();
    });
  });
});
