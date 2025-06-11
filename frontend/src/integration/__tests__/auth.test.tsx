import { ThemeProvider } from '@mui/material/styles';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ActiveSessions from '../../components/auth/ActiveSessions';
import LoginForm from '../../components/auth/LoginForm';
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

  const renderWithProviders = (component: React.ReactNode) => {
    return render(
      <BrowserRouter>
        <ThemeProvider theme={theme}>
          <AuthProvider>{component}</AuthProvider>
        </ThemeProvider>
      </BrowserRouter>
    );
  };

  describe('Login Flow', () => {
    it('should handle successful login with 2FA', async () => {
      // Mock successful login that requires 2FA
      mockLogin.mockResolvedValueOnce({ requires2FA: true });

      renderWithProviders(<LoginForm />);

      // Fill in login form
      fireEvent.change(screen.getByLabelText(/email/i), {
        target: { value: 'test@example.com' },
      });
      fireEvent.change(screen.getByLabelText(/password/i), {
        target: { value: 'password123' },
      });

      // Submit form
      fireEvent.click(screen.getByRole('button', { name: /login/i }));

      // Wait for 2FA verification screen
      await waitFor(() => {
        expect(screen.getByText(/two-factor authentication/i)).toBeInTheDocument();
      });

      // Enter 2FA code
      fireEvent.change(screen.getByLabelText(/verification code/i), {
        target: { value: '123456' },
      });

      // Submit 2FA code
      fireEvent.click(screen.getByRole('button', { name: /verify/i }));

      // Verify successful authentication
      await waitFor(() => {
        expect(mockVerify2FA).toHaveBeenCalledWith('123456');
      });
    });

    it('should handle failed login attempts', async () => {
      // Mock failed login
      mockLogin.mockRejectedValueOnce(new Error('Invalid credentials'));

      renderWithProviders(<LoginForm />);

      // Fill in login form with invalid credentials
      fireEvent.change(screen.getByLabelText(/email/i), {
        target: { value: 'wrong@example.com' },
      });
      fireEvent.change(screen.getByLabelText(/password/i), {
        target: { value: 'wrongpassword' },
      });

      // Submit form
      fireEvent.click(screen.getByRole('button', { name: /login/i }));

      // Verify error message
      await waitFor(() => {
        expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
      });
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
      renderWithProviders(<ActiveSessions sessions={mockSessions} />);

      // Click revoke button for a session
      fireEvent.click(screen.getByRole('button', { name: /revoke/i }));

      // Verify confirmation dialog
      expect(screen.getByText(/are you sure/i)).toBeInTheDocument();

      // Confirm revocation
      fireEvent.click(screen.getByRole('button', { name: /confirm/i }));

      // Verify session was revoked
      await waitFor(() => {
        expect(mockRevokeSession).toHaveBeenCalledWith(mockSessions[0].id);
      });
    });

    it('should handle revoking all sessions', async () => {
      renderWithProviders(<ActiveSessions sessions={mockSessions} />);

      // Click revoke all button
      fireEvent.click(screen.getByRole('button', { name: /revoke all/i }));

      // Verify confirmation dialog
      expect(screen.getByText(/are you sure/i)).toBeInTheDocument();

      // Confirm revocation
      fireEvent.click(screen.getByRole('button', { name: /confirm/i }));

      // Verify all sessions were revoked
      await waitFor(() => {
        expect(mockRevokeAllSessions).toHaveBeenCalled();
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors during login', async () => {
      // Mock network error
      mockLogin.mockRejectedValueOnce(new Error('Network error'));

      renderWithProviders(<LoginForm />);

      // Fill in login form
      fireEvent.change(screen.getByLabelText(/email/i), {
        target: { value: 'test@example.com' },
      });
      fireEvent.change(screen.getByLabelText(/password/i), {
        target: { value: 'password123' },
      });

      // Submit form
      fireEvent.click(screen.getByRole('button', { name: /login/i }));

      // Verify error message
      await waitFor(() => {
        expect(screen.getByText(/network error/i)).toBeInTheDocument();
      });
    });

    it('should handle invalid 2FA codes', async () => {
      // Mock successful login that requires 2FA
      mockLogin.mockResolvedValueOnce({ requires2FA: true });
      // Mock failed 2FA verification
      mockVerify2FA.mockRejectedValueOnce(new Error('Invalid code'));

      renderWithProviders(<LoginForm />);

      // Fill in login form
      fireEvent.change(screen.getByLabelText(/email/i), {
        target: { value: 'test@example.com' },
      });
      fireEvent.change(screen.getByLabelText(/password/i), {
        target: { value: 'password123' },
      });

      // Submit form
      fireEvent.click(screen.getByRole('button', { name: /login/i }));

      // Wait for 2FA verification screen
      await waitFor(() => {
        expect(screen.getByText(/two-factor authentication/i)).toBeInTheDocument();
      });

      // Enter invalid 2FA code
      fireEvent.change(screen.getByLabelText(/verification code/i), {
        target: { value: '000000' },
      });

      // Submit 2FA code
      fireEvent.click(screen.getByRole('button', { name: /verify/i }));

      // Verify error message
      await waitFor(() => {
        expect(screen.getByText(/invalid code/i)).toBeInTheDocument();
      });
    });
  });
});
