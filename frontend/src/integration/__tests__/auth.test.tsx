import { ThemeProvider } from '@mui/material/styles';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ActiveSessions from '../../components/auth/ActiveSessions';
// import LoginForm from '../../components/auth/LoginForm';
import { AuthProvider } from '../../contexts/AuthContext';
import { useAuth } from '../../hooks/useAuth';
import { theme } from '../../theme';

// Mock the auth context
vi.mock('../../hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

// Mock the API calls
vi.mock('../../services/api', () => ({
  login: vi.fn(),
  verify2FA: vi.fn(),
  revokeSession: vi.fn(),
  revokeAllSessions: vi.fn(),
}));

const mockLogin = vi.fn();
const mockVerify2FA = vi.fn();
const mockRevokeSession = vi.fn();
const mockRevokeAllSessions = vi.fn();

const mockUser = {
  id: '1',
  email: 'test@example.com',
  name: 'Test User',
  role: 'student',
};

const mockSessions = [
  {
    id: '1',
    deviceName: 'Test Device',
    ipAddress: '127.0.0.1',
    location: 'Test Location',
    lastActive: new Date().toISOString(),
    isCurrent: true,
  },
];

describe('Authentication Flow Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useAuth as any).mockReturnValue({
      login: mockLogin,
      verify2FA: mockVerify2FA,
      revokeSession: mockRevokeSession,
      revokeAllSessions: mockRevokeAllSessions,
      user: null,
      isAuthenticated: false,
    });
  });

  describe('Session Management Flow', () => {
    beforeEach(() => {
      (useAuth as any).mockReturnValue({
        user: mockUser,
        isAuthenticated: true,
        revokeSession: mockRevokeSession,
        revokeAllSessions: mockRevokeAllSessions,
      });
    });

    it('should handle revoking a single session', async () => {
      render(
        <BrowserRouter>
          <ThemeProvider theme={theme}>
            <AuthProvider>
              <ActiveSessions sessions={mockSessions} />
            </AuthProvider>
          </ThemeProvider>
        </BrowserRouter>
      );

      // Click revoke button for a session
      fireEvent.click(screen.getByRole('button', { name: /revoke/i }));

      // Verify confirmation dialog
      expect(screen.getByText(/are you sure/i)).toBeTruthy();

      // Confirm revocation
      fireEvent.click(screen.getByRole('button', { name: /confirm/i }));

      // Verify session was revoked
      await waitFor(() => {
        expect(mockRevokeSession).toHaveBeenCalledWith(mockSessions[0].id);
      });
    });

    it('should handle revoking all sessions', async () => {
      render(
        <BrowserRouter>
          <ThemeProvider theme={theme}>
            <AuthProvider>
              <ActiveSessions sessions={mockSessions} />
            </AuthProvider>
          </ThemeProvider>
        </BrowserRouter>
      );

      // Click revoke all button
      fireEvent.click(screen.getByRole('button', { name: /revoke all/i }));

      // Verify confirmation dialog
      expect(screen.getByText(/are you sure/i)).toBeTruthy();

      // Confirm revocation
      fireEvent.click(screen.getByRole('button', { name: /confirm/i }));

      // Verify all sessions were revoked
      await waitFor(() => {
        expect(mockRevokeAllSessions).toHaveBeenCalled();
      });
    });
  });
});
