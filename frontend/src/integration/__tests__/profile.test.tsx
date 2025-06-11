import { ThemeProvider } from '@mui/material/styles';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TwoFactorSetup } from '../../components/auth/TwoFactorSetup';
import { AuthProvider } from '../../contexts/AuthContext';
import { useAuth } from '../../hooks/useAuth';
import { theme } from '../../theme';

// Mock the auth context
vi.mock('../../hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

// Mock the API calls
vi.mock('../../services/api', () => ({
  setup2FA: vi.fn(),
}));

const mockSetup2FA = vi.fn();

const mockUser = {
  id: '1',
  email: 'test@example.com',
  name: 'Test User',
  role: 'student',
  avatar: null,
  bio: 'Test bio',
};

describe('Profile Management Flow Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useAuth as any).mockReturnValue({
      user: mockUser,
      isAuthenticated: true,
      setup2FA: mockSetup2FA,
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

  describe('2FA Setup Flow', () => {
    it('should handle successful 2FA setup', async () => {
      mockSetup2FA.mockResolvedValueOnce({
        secret: 'test-secret',
        qrCode: 'test-qr-code',
      });

      renderWithProviders(<TwoFactorSetup />);

      // Start 2FA setup
      fireEvent.click(screen.getByRole('button', { name: /setup 2fa/i }));

      // Verify QR code is displayed
      await waitFor(() => {
        expect(screen.getByAltText(/qr code/i)).toBeInTheDocument();
      });

      // Enter verification code
      fireEvent.change(screen.getByLabelText(/verification code/i), {
        target: { value: '123456' },
      });

      // Submit verification
      fireEvent.click(screen.getByRole('button', { name: /verify/i }));

      // Verify 2FA was set up
      await waitFor(() => {
        expect(mockSetup2FA).toHaveBeenCalledWith('123456');
      });
    });

    it('should handle invalid verification code', async () => {
      mockSetup2FA.mockRejectedValueOnce(new Error('Invalid code'));

      renderWithProviders(<TwoFactorSetup />);

      // Start 2FA setup
      fireEvent.click(screen.getByRole('button', { name: /setup 2fa/i }));

      // Enter invalid verification code
      fireEvent.change(screen.getByLabelText(/verification code/i), {
        target: { value: 'invalid' },
      });

      // Submit verification
      fireEvent.click(screen.getByRole('button', { name: /verify/i }));

      // Verify error message
      await waitFor(() => {
        expect(screen.getByText(/invalid code/i)).toBeInTheDocument();
      });
    });
  });
});
