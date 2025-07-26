import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthService } from '../../services/auth/AuthService';
import TwoFactorSetup from '../TwoFactorSetup';

// Mock Material-UI icons
vi.mock('@mui/icons-material', () => ({
  CheckCircle: () => <span>CheckCircle</span>,
  QrCode: () => <span>QrCode</span>,
  Security: () => <span>Security</span>,
  Save: () => <span>Save</span>,
  ArrowBack: () => <span>ArrowBack</span>,
  ArrowForward: () => <span>ArrowForward</span>,
}));

// Mock AuthService
vi.mock('../../services/auth/AuthService', () => ({
  AuthService: {
    setup2FA: vi.fn(),
    verify2FASetup: vi.fn(),
  },
}));

const mockSetupData = {
  message: '2FA setup initiated',
  qr_code: 'data:image/png;base64,mock-qr-code',
  secret: 'JBSWY3DPEHPK3PXP',
  manual_entry:
    'otpauth://totp/AssignmentAI:test@example.com?secret=JBSWY3DPEHPK3PXP&issuer=AssignmentAI',
};

const mockBackupCodes = ['ABC12345', 'DEF67890', 'GHI11111', 'JKL22222', 'MNO33333'];

describe('TwoFactorSetup', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (AuthService.setup2FA as any).mockResolvedValue(mockSetupData);
  });

  it('renders 2FA setup component', async () => {
    render(<TwoFactorSetup />);

    // Wait for loading to complete and component to render
    await waitFor(
      () => {
        expect(screen.getByText(/Two-Factor Authentication Setup/)).toBeInTheDocument();
      },
      { timeout: 5000 }
    );

    expect(screen.getByText('Generate QR Code')).toBeInTheDocument();
    expect(screen.getByText('Verify Setup')).toBeInTheDocument();
    expect(screen.getByText('Save Backup Codes')).toBeInTheDocument();
  });

  it('initializes 2FA setup on mount', async () => {
    render(<TwoFactorSetup />);

    await waitFor(() => {
      expect(AuthService.setup2FA).toHaveBeenCalled();
    });
  });

  it('displays QR code and secret in step 1', async () => {
    render(<TwoFactorSetup />);

    await waitFor(
      () => {
        expect(screen.getByText('Step 1: Scan QR Code')).toBeInTheDocument();
        expect(
          screen.getByText(/Scan this QR code with your authenticator app/)
        ).toBeInTheDocument();
        expect(screen.getByDisplayValue('JBSWY3DPEHPK3PXP')).toBeInTheDocument();
      },
      { timeout: 5000 }
    );
  });

  it('shows QR code image', async () => {
    render(<TwoFactorSetup />);

    await waitFor(() => {
      const qrImage = screen.getByAltText('2FA QR Code');
      expect(qrImage).toBeInTheDocument();
      expect(qrImage).toHaveAttribute('src', 'data:image/png;base64,mock-qr-code');
    });
  });

  it('proceeds to step 2 when Next is clicked', async () => {
    render(<TwoFactorSetup />);

    await waitFor(() => {
      expect(screen.getByText('Next')).toBeInTheDocument();
    });

    await userEvent.click(screen.getByText('Next'));

    await waitFor(() => {
      expect(screen.getByText('Step 2: Verify Setup')).toBeInTheDocument();
      expect(
        screen.getByText(/Enter the 6-digit code from your authenticator app/)
      ).toBeInTheDocument();
    });
  });

  it('verifies 2FA code in step 2', async () => {
    (AuthService.verify2FASetup as any).mockResolvedValue({ backup_codes: mockBackupCodes });

    render(<TwoFactorSetup />);

    // Go to step 2
    await waitFor(() => {
      expect(screen.getByText('Next')).toBeInTheDocument();
    });
    await userEvent.click(screen.getByText('Next'));

    // Enter verification code
    const codeInput = screen.getByPlaceholderText('Enter 6-digit code');
    await userEvent.type(codeInput, '123456');

    // Click Next to verify
    await userEvent.click(screen.getByText('Next'));

    await waitFor(() => {
      expect(AuthService.verify2FASetup).toHaveBeenCalledWith('123456');
    });
  });

  it('proceeds to step 3 after successful verification', async () => {
    (AuthService.verify2FASetup as any).mockResolvedValue({ backup_codes: mockBackupCodes });

    render(<TwoFactorSetup />);

    // Go to step 2
    await waitFor(() => {
      expect(screen.getByText('Next')).toBeInTheDocument();
    });
    await userEvent.click(screen.getByText('Next'));

    // Enter verification code and verify
    const codeInput = screen.getByPlaceholderText('Enter 6-digit code');
    await userEvent.type(codeInput, '123456');
    await userEvent.click(screen.getByText('Next'));

    await waitFor(() => {
      expect(screen.getByText('Step 3: Backup Codes')).toBeInTheDocument();
      expect(screen.getByText(/Save these backup codes in a secure location/)).toBeInTheDocument();
    });
  });

  it('shows backup codes dialog', async () => {
    (AuthService.verify2FASetup as any).mockResolvedValue({ backup_codes: mockBackupCodes });

    render(<TwoFactorSetup />);

    // Go through steps to reach step 3
    await waitFor(() => {
      expect(screen.getByText('Next')).toBeInTheDocument();
    });
    await userEvent.click(screen.getByText('Next'));

    const codeInput = screen.getByPlaceholderText('Enter 6-digit code');
    await userEvent.type(codeInput, '123456');
    await userEvent.click(screen.getByText('Next'));

    // Click to view backup codes
    await waitFor(() => {
      expect(screen.getByText('View Backup Codes')).toBeInTheDocument();
    });
    await userEvent.click(screen.getByText('View Backup Codes'));

    // Dialog should appear
    await waitFor(() => {
      expect(screen.getByText('Backup Codes')).toBeInTheDocument();
      expect(screen.getByText('ABC12345')).toBeInTheDocument();
      expect(screen.getByText('DEF67890')).toBeInTheDocument();
      expect(screen.getByText('GHI11111')).toBeInTheDocument();
      expect(screen.getByText('JKL22222')).toBeInTheDocument();
      expect(screen.getByText('MNO33333')).toBeInTheDocument();
    });
  });

  it('calls onSetupComplete when backup codes are saved', async () => {
    const mockOnSetupComplete = vi.fn();
    (AuthService.verify2FASetup as any).mockResolvedValue({ backup_codes: mockBackupCodes });

    render(<TwoFactorSetup onSetupComplete={mockOnSetupComplete} />);

    // Go through steps to reach step 3
    await waitFor(() => {
      expect(screen.getByText('Next')).toBeInTheDocument();
    });
    await userEvent.click(screen.getByText('Next'));

    const codeInput = screen.getByPlaceholderText('Enter 6-digit code');
    await userEvent.type(codeInput, '123456');
    await userEvent.click(screen.getByText('Next'));

    // View and save backup codes
    await waitFor(() => {
      expect(screen.getByText('View Backup Codes')).toBeInTheDocument();
    });
    await userEvent.click(screen.getByText('View Backup Codes'));

    await waitFor(() => {
      expect(screen.getByText("I've Saved My Codes")).toBeInTheDocument();
    });
    await userEvent.click(screen.getByText("I've Saved My Codes"));

    expect(mockOnSetupComplete).toHaveBeenCalled();
  });

  it('handles verification error', async () => {
    (AuthService.verify2FASetup as any).mockRejectedValue(new Error('Invalid verification code'));

    render(<TwoFactorSetup />);

    // Go to step 2
    await waitFor(() => {
      expect(screen.getByText('Next')).toBeInTheDocument();
    });
    await userEvent.click(screen.getByText('Next'));

    // Enter verification code and verify
    const codeInput = screen.getByPlaceholderText('Enter 6-digit code');
    await userEvent.type(codeInput, '123456');
    await userEvent.click(screen.getByText('Next'));

    await waitFor(() => {
      expect(screen.getByText('Invalid verification code')).toBeInTheDocument();
    });
  });

  it('handles setup initialization error', async () => {
    (AuthService.setup2FA as any).mockRejectedValue(new Error('Failed to initialize 2FA setup'));

    render(<TwoFactorSetup />);

    await waitFor(() => {
      expect(screen.getByText('Failed to initialize 2FA setup')).toBeInTheDocument();
    });
  });

  it('allows going back to previous steps', async () => {
    render(<TwoFactorSetup />);

    // Go to step 2
    await waitFor(() => {
      expect(screen.getByText('Next')).toBeInTheDocument();
    });
    await userEvent.click(screen.getByText('Next'));

    // Go back to step 1
    await userEvent.click(screen.getByText('Back'));

    await waitFor(() => {
      expect(screen.getByText('Step 1: Scan QR Code')).toBeInTheDocument();
    });
  });

  it('disables Next button when verification code is empty', async () => {
    render(<TwoFactorSetup />);

    // Go to step 2
    await waitFor(() => {
      expect(screen.getByText('Next')).toBeInTheDocument();
    });
    await userEvent.click(screen.getByText('Next'));

    // Next button should be disabled
    const nextButton = screen.getByText('Next');
    expect(nextButton).toBeDisabled();
  });

  it('shows loading state during verification', async () => {
    (AuthService.verify2FASetup as any).mockImplementation(
      () => new Promise(resolve => setTimeout(resolve, 100))
    );

    render(<TwoFactorSetup />);

    // Go to step 2
    await waitFor(() => {
      expect(screen.getByText('Next')).toBeInTheDocument();
    });
    await userEvent.click(screen.getByText('Next'));

    // Enter code and click verify
    const codeInput = screen.getByPlaceholderText('Enter 6-digit code');
    await userEvent.type(codeInput, '123456');
    await userEvent.click(screen.getByText('Next'));

    // Should show loading
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('shows loading state during initial setup', () => {
    (AuthService.setup2FA as any).mockImplementation(
      () => new Promise(resolve => setTimeout(resolve, 100))
    );

    render(<TwoFactorSetup />);

    // Should show loading initially
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });
});
