import { fireEvent, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from '../../../test/test-utils';
import { TwoFactorSetup } from '../TwoFactorSetup';
import { TwoFactorVerify } from '../TwoFactorVerify';

// Mock auth service - must be before any imports that use it
vi.mock('../../../services/api', () => ({
  auth: {
    setup2FA: vi.fn(),
    confirm2FA: vi.fn(),
    verify2FA: vi.fn(),
    verifyBackupCode: vi.fn(),
  },
}));

// Import auth after mocking
import { auth } from '../../../services/api';

describe('2FA Browser Security', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Setup Process', () => {
    it('shows setup form and handles verification', async () => {
      // Mock initial setup
      vi.mocked(auth.setup2FA).mockResolvedValueOnce({
        qr_code: 'test-qr-code',
        secret: 'test-secret',
      });

      // Start setup
      render(<TwoFactorSetup />);

      // Verify initial state
      await waitFor(() => {
        expect(screen.getByText('Setup Two-Factor Authentication')).toBeInTheDocument();
        expect(screen.getByAltText('2FA QR Code')).toHaveAttribute('src', 'test-qr-code');
        expect(screen.getByText('test-secret')).toBeInTheDocument();
      });

      // Mock verification
      vi.mocked(auth.confirm2FA).mockResolvedValueOnce({
        backup_codes: ['code1', 'code2'],
      });

      // Enter verification code
      const codeInput = screen.getByTestId('text-field');
      fireEvent.change(codeInput, { target: { value: '123456' } });
      fireEvent.click(screen.getByRole('button', { name: /verify/i }));

      // Verify backup codes are shown
      await waitFor(() => {
        expect(screen.getByText('Backup Codes')).toBeInTheDocument();
        expect(screen.getByText('code1')).toBeInTheDocument();
        expect(screen.getByText('code2')).toBeInTheDocument();
      });
    });

    it('handles setup errors', async () => {
      // Mock setup error
      vi.mocked(auth.setup2FA).mockRejectedValueOnce({
        response: {
          data: {
            detail: 'Setup failed',
          },
        },
      });

      // Start setup
      render(<TwoFactorSetup />);

      // Verify error is shown
      await waitFor(() => {
        expect(screen.getByText('Setup failed')).toBeInTheDocument();
      });
    });
  });

  describe('Verification Process', () => {
    it('handles verification errors', async () => {
      // Mock verification error
      vi.mocked(auth.verify2FA).mockRejectedValueOnce({
        response: {
          data: {
            detail: 'Invalid code',
          },
        },
      });

      // Start verification
      render(<TwoFactorVerify onSuccess={() => {}} />);

      // Enter verification code
      const codeInput = screen.getByTestId('text-field');
      fireEvent.change(codeInput, { target: { value: '123456' } });
      fireEvent.click(screen.getByRole('button', { name: /verify/i }));

      // Verify error is shown
      await waitFor(() => {
        expect(screen.getByText('Invalid code')).toBeInTheDocument();
      });
    });

    it('handles successful verification', async () => {
      // Mock successful verification
      vi.mocked(auth.verify2FA).mockResolvedValueOnce();
      const onSuccess = vi.fn();

      // Start verification
      render(<TwoFactorVerify onSuccess={onSuccess} />);

      // Enter verification code
      const codeInput = screen.getByTestId('text-field');
      fireEvent.change(codeInput, { target: { value: '123456' } });
      fireEvent.click(screen.getByRole('button', { name: /verify/i }));

      // Verify success callback is called
      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalled();
      });
    });
  });
});
