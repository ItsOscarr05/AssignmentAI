import { ThemeProvider, createTheme } from '@mui/material/styles';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { api } from '../../services/api';
import { TwoFactorSetup } from '../TwoFactorSetup';

const theme = createTheme();

// Mock the API module
vi.mock('../../services/api', () => ({
  api: {
    post: vi.fn(),
  },
}));

// Mock react-toastify
vi.mock('react-toastify', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const renderTwoFactorSetup = (props = {}) => {
  return render(
    <ThemeProvider theme={theme}>
      <TwoFactorSetup onComplete={vi.fn()} {...props} />
    </ThemeProvider>
  );
};

describe('TwoFactorSetup', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('renders setup instructions', () => {
      renderTwoFactorSetup();
      expect(screen.getByText(/two-factor authentication setup/i)).toBeInTheDocument();
      expect(screen.getByText(/extra layer of security/i)).toBeInTheDocument();
    });

    it('renders start setup button', () => {
      renderTwoFactorSetup();
      expect(screen.getByRole('button', { name: /start setup/i })).toBeInTheDocument();
    });
  });

  describe('Setup Process', () => {
    it('handles successful setup', async () => {
      const mockResponse = {
        data: {
          secret: 'TEST_SECRET',
          qr_code: 'TEST_QR_CODE',
        },
      };
      (api.post as any).mockResolvedValueOnce(mockResponse);

      renderTwoFactorSetup();

      const startButton = screen.getByRole('button', { name: /start setup/i });
      fireEvent.click(startButton);

      await waitFor(() => {
        // Check for step headings
        expect(
          screen.getByRole('heading', { name: /1\. install an authenticator app/i })
        ).toBeInTheDocument();
        expect(screen.getByRole('heading', { name: /2\. scan the qr code/i })).toBeInTheDocument();
        expect(screen.getByRole('heading', { name: /3\. enter the code/i })).toBeInTheDocument();

        // Check for step descriptions
        expect(
          screen.getByText(
            /install an authenticator app like google authenticator, authy, or microsoft authenticator on your mobile device/i
          )
        ).toBeInTheDocument();
        expect(
          screen.getByText(
            /if you can't scan the qr code, enter this code manually in your authenticator app/i
          )
        ).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/enter 6-digit code/i)).toBeInTheDocument();
      });
    });

    it('handles setup error', async () => {
      (api.post as any).mockRejectedValueOnce(new Error('Setup failed'));

      renderTwoFactorSetup();

      const startButton = screen.getByRole('button', { name: /start setup/i });
      fireEvent.click(startButton);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /start setup/i })).toBeInTheDocument();
      });
    });
  });

  describe('Confirmation Process', () => {
    const setupConfirmState = async () => {
      const mockResponse = {
        data: {
          secret: 'TEST_SECRET',
          qr_code: 'TEST_QR_CODE',
        },
      };
      (api.post as any).mockResolvedValueOnce(mockResponse);

      renderTwoFactorSetup();

      const startButton = screen.getByRole('button', { name: /start setup/i });
      fireEvent.click(startButton);

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/enter 6-digit code/i)).toBeInTheDocument();
      });
    };

    it('validates code format', async () => {
      await setupConfirmState();

      const codeInput = screen.getByPlaceholderText(/enter 6-digit code/i);
      fireEvent.change(codeInput, { target: { value: '12345' } });
      fireEvent.click(screen.getByRole('button', { name: /confirm setup/i }));

      expect(screen.getByRole('button', { name: /confirm setup/i })).toBeDisabled();
    });

    it('handles successful confirmation', async () => {
      const onComplete = vi.fn();
      const mockSetupResponse = {
        data: {
          secret: 'TEST_SECRET',
          qr_code: 'TEST_QR_CODE',
        },
      };
      const mockConfirmResponse = {
        data: {
          backup_codes: ['CODE1', 'CODE2'],
        },
      };

      (api.post as any)
        .mockResolvedValueOnce(mockSetupResponse)
        .mockResolvedValueOnce(mockConfirmResponse);

      renderTwoFactorSetup({ onComplete });

      const startButton = screen.getByRole('button', { name: /start setup/i });
      fireEvent.click(startButton);

      await waitFor(() => {
        const codeInput = screen.getByPlaceholderText(/enter 6-digit code/i);
        fireEvent.change(codeInput, { target: { value: '123456' } });
        fireEvent.click(screen.getByRole('button', { name: /confirm setup/i }));
      });

      await waitFor(() => {
        expect(onComplete).toHaveBeenCalled();
      });
    });
  });
});
