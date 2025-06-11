import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { auth } from '../../../services/api';
import { TwoFactorSetup } from '../TwoFactorSetup';

// Mock the auth service
vi.mock('../../../services/api', () => ({
  auth: {
    setup2FA: vi.fn(),
    confirm2FA: vi.fn(),
  },
}));

describe('TwoFactorSetup', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock successful initial setup
    vi.mocked(auth.setup2FA).mockResolvedValue({
      qr_code: 'test-qr-code',
      secret: 'test-secret',
    });
  });

  it('renders initial setup state', async () => {
    render(<TwoFactorSetup />);

    // Wait for the initial setup to complete
    await waitFor(() => {
      expect(screen.getByText('Setup Two-Factor Authentication')).toBeInTheDocument();
      expect(
        screen.getByText(/Scan this QR code with your authenticator app/i)
      ).toBeInTheDocument();
      expect(screen.getByText('Verify')).toBeInTheDocument();
    });
  });

  it('handles setup errors', async () => {
    // Mock setup error
    vi.mocked(auth.setup2FA).mockRejectedValueOnce(new Error('Setup failed'));

    render(<TwoFactorSetup />);

    await waitFor(() => {
      expect(screen.getByText(/Failed to setup 2FA/i)).toBeInTheDocument();
    });
  });

  it('verifies 2FA setup', async () => {
    // Mock verification response
    vi.mocked(auth.confirm2FA).mockResolvedValueOnce({
      backup_codes: ['code1', 'code2', 'code3', 'code4', 'code5'],
    });

    render(<TwoFactorSetup />);

    // Wait for initial setup
    await waitFor(() => {
      expect(screen.getByTestId('text-field')).toBeInTheDocument();
    });

    // Enter verification code
    const codeInput = screen.getByTestId('text-field');
    fireEvent.change(codeInput, { target: { value: '123456' } });
    fireEvent.click(screen.getByText('Verify'));

    await waitFor(() => {
      expect(screen.getByText('Backup Codes')).toBeInTheDocument();
      expect(screen.getByText('code1')).toBeInTheDocument();
      expect(screen.getByText('code2')).toBeInTheDocument();
      expect(screen.getByText('code3')).toBeInTheDocument();
      expect(screen.getByText('code4')).toBeInTheDocument();
      expect(screen.getByText('code5')).toBeInTheDocument();
    });
  });

  it('handles verification errors', async () => {
    // Mock verification error
    vi.mocked(auth.confirm2FA).mockRejectedValueOnce(new Error('Invalid code'));

    render(<TwoFactorSetup />);

    // Wait for initial setup
    await waitFor(() => {
      expect(screen.getByTestId('text-field')).toBeInTheDocument();
    });

    // Enter invalid code
    const codeInput = screen.getByTestId('text-field');
    fireEvent.change(codeInput, { target: { value: '000000' } });
    fireEvent.click(screen.getByText('Verify'));

    await waitFor(() => {
      expect(screen.getByText(/Invalid verification code/i)).toBeInTheDocument();
    });
  });

  it('completes setup after successful verification', async () => {
    // Mock verification response
    vi.mocked(auth.confirm2FA).mockResolvedValueOnce({
      backup_codes: ['code1', 'code2', 'code3', 'code4', 'code5'],
    });

    render(<TwoFactorSetup />);

    // Wait for initial setup
    await waitFor(() => {
      expect(screen.getByTestId('text-field')).toBeInTheDocument();
    });

    // Enter verification code
    const codeInput = screen.getByTestId('text-field');
    fireEvent.change(codeInput, { target: { value: '123456' } });
    fireEvent.click(screen.getByText('Verify'));

    await waitFor(() => {
      expect(screen.getByText('Backup Codes')).toBeInTheDocument();
    });

    // Complete setup
    fireEvent.click(screen.getByText('Complete Setup'));
  });

  it('validates verification code format', async () => {
    render(<TwoFactorSetup />);

    // Wait for initial setup
    await waitFor(() => {
      expect(screen.getByTestId('text-field')).toBeInTheDocument();
    });

    // Enter invalid code format
    const codeInput = screen.getByTestId('text-field');
    fireEvent.change(codeInput, { target: { value: '123' } });

    // Verify button should be disabled
    expect(screen.getByText('Verify')).toBeDisabled();
  });
});
