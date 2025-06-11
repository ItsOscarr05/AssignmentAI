import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthProvider } from '../../../contexts/AuthContext';
import { auth } from '../../../services/api';
import { TwoFactorVerify } from '../TwoFactorVerify';

// Mock the auth service
vi.mock('../../../services/api', () => ({
  auth: {
    verify2FA: vi.fn(),
    verifyBackupCode: vi.fn(),
  },
}));

describe('TwoFactorVerify', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderWithProviders = (component: React.ReactNode) => {
    return render(
      <BrowserRouter>
        <AuthProvider>{component}</AuthProvider>
      </BrowserRouter>
    );
  };

  it('renders verification form', () => {
    renderWithProviders(<TwoFactorVerify onSuccess={() => {}} />);
    expect(screen.getByTestId('text-field')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /verify/i })).toBeInTheDocument();
  });

  it('handles successful verification', async () => {
    const onSuccess = vi.fn();
    vi.mocked(auth.verify2FA).mockResolvedValueOnce();

    renderWithProviders(<TwoFactorVerify onSuccess={onSuccess} />);

    const codeInput = screen.getByTestId('text-field');
    fireEvent.change(codeInput, { target: { value: '123456' } });

    const verifyButton = screen.getByRole('button', { name: /verify/i });
    fireEvent.click(verifyButton);

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalled();
    });
  });

  it('handles invalid verification code', async () => {
    vi.mocked(auth.verify2FA).mockRejectedValueOnce({
      response: {
        data: {
          detail: 'Invalid verification code',
        },
      },
    });

    renderWithProviders(<TwoFactorVerify onSuccess={() => {}} />);

    const codeInput = screen.getByTestId('text-field');
    fireEvent.change(codeInput, { target: { value: '123456' } });

    const verifyButton = screen.getByRole('button', { name: /verify/i });
    fireEvent.click(verifyButton);

    await waitFor(() => {
      expect(screen.getByText('Invalid verification code')).toBeInTheDocument();
    });
  });

  it('handles network error', async () => {
    vi.mocked(auth.verify2FA).mockRejectedValueOnce(new Error('Network error'));

    renderWithProviders(<TwoFactorVerify onSuccess={() => {}} />);

    const codeInput = screen.getByTestId('text-field');
    fireEvent.change(codeInput, { target: { value: '123456' } });

    const verifyButton = screen.getByRole('button', { name: /verify/i });
    fireEvent.click(verifyButton);

    await waitFor(() => {
      expect(screen.getByText('Invalid verification code')).toBeInTheDocument();
    });
  });

  it('handles expired verification code', async () => {
    vi.mocked(auth.verify2FA).mockRejectedValueOnce({
      response: {
        data: {
          detail: 'Verification code expired',
        },
      },
    });

    renderWithProviders(<TwoFactorVerify onSuccess={() => {}} />);

    const codeInput = screen.getByTestId('text-field');
    fireEvent.change(codeInput, { target: { value: '123456' } });

    const verifyButton = screen.getByRole('button', { name: /verify/i });
    fireEvent.click(verifyButton);

    await waitFor(() => {
      expect(screen.getByText('Verification code expired')).toBeInTheDocument();
    });
  });

  it('switches between verification code and backup code', async () => {
    renderWithProviders(<TwoFactorVerify onSuccess={() => {}} />);

    // Initially shows verification code input
    const initialInput = screen.getByTestId('text-field');
    expect(initialInput).toBeInTheDocument();
    expect(initialInput).toHaveAttribute('label', 'Verification Code');

    // Click to switch to backup code
    const switchButton = screen.getByRole('button', { name: /use backup code instead/i });
    fireEvent.click(switchButton);

    // Should now show backup code input
    const backupInput = screen.getByTestId('text-field');
    expect(backupInput).toBeInTheDocument();
    expect(backupInput).toHaveAttribute('label', 'Backup Code');
    expect(
      screen.getByRole('button', { name: /use authenticator app instead/i })
    ).toBeInTheDocument();
  });
});
