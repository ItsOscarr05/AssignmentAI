// Note: Using standard vitest assertions instead of jest-dom matchers
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ActiveSessions from '../../components/auth/ActiveSessions';
import { ToastProvider } from '../../contexts/ToastContext';

// Mock react-toastify
vi.mock('react-toastify', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

// Mock react-router-dom
vi.mock('react-router-dom', () => ({
  ...vi.importActual('react-router-dom'),
  useNavigate: () => vi.fn(),
}));

const mockSessions = [
  {
    id: '1',
    deviceName: 'Chrome on Windows',
    ipAddress: '192.168.1.1',
    location: 'New York, US',
    lastActive: '2024-01-01T07:00:00Z',
    isCurrent: false,
  },
  {
    id: '2',
    deviceName: 'Firefox on MacOS',
    ipAddress: '192.168.1.2',
    location: 'San Francisco, US',
    lastActive: '2024-01-01T06:00:00Z',
    isCurrent: true,
  },
];

const mockOnRevokeSession = vi.fn();
const mockOnRevokeAllSessions = vi.fn();

const renderActiveSessions = () => {
  return render(
    <ToastProvider>
      <ActiveSessions
        sessions={mockSessions}
        onRevokeSession={mockOnRevokeSession}
        onRevokeAllSessions={mockOnRevokeAllSessions}
      />
    </ToastProvider>
  );
};

describe('ActiveSessions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('renders session list', async () => {
      renderActiveSessions();
      await waitFor(() => {
        expect(screen.getByText(/active sessions/i)).toBeTruthy();
        mockSessions.forEach(session => {
          expect(screen.getByText(session.deviceName)).toBeTruthy();
          expect(screen.getByText(new RegExp(session.ipAddress))).toBeTruthy();
        });
      });
    });

    it('renders revoke buttons', async () => {
      renderActiveSessions();
      await waitFor(() => {
        const revokeButtons = screen.getAllByRole('button', { name: /revoke/i });
        expect(revokeButtons).toHaveLength(mockSessions.length + 1); // +1 for "Revoke All" button
        expect(screen.getByRole('button', { name: /revoke all sessions/i })).toBeTruthy();
      });
    });
  });

  describe('Session Management', () => {
    it('handles single session revocation', async () => {
      renderActiveSessions();
      await waitFor(() => {
        const revokeButtons = screen.getAllByRole('button', { name: /^revoke$/i });
        fireEvent.click(revokeButtons[0]);
      });

      expect(mockOnRevokeSession).toHaveBeenCalledWith(mockSessions[0].id);
    });

    it('handles revoke all sessions', async () => {
      renderActiveSessions();
      await waitFor(() => {
        const revokeAllButton = screen.getByRole('button', { name: /revoke all sessions/i });
        fireEvent.click(revokeAllButton);
      });

      expect(mockOnRevokeAllSessions).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('handles empty sessions', async () => {
      const EmptySessions = () => (
        <ToastProvider>
          <ActiveSessions
            sessions={[]}
            onRevokeSession={mockOnRevokeSession}
            onRevokeAllSessions={mockOnRevokeAllSessions}
          />
        </ToastProvider>
      );

      render(<EmptySessions />);
      await waitFor(() => {
        expect(screen.getByText(/no active sessions/i)).toBeTruthy();
      });
    });

    it('handles revoke callback error', async () => {
      mockOnRevokeSession.mockRejectedValue(new Error('Failed to revoke'));
      renderActiveSessions();
      await waitFor(() => {
        const revokeButtons = screen.getAllByRole('button', { name: /^revoke$/i });
        fireEvent.click(revokeButtons[0]);
      });
      // The component doesn't remove sessions on error, so we expect them to still be there
      await waitFor(() => {
        expect(screen.getByText('Chrome on Windows')).toBeTruthy();
      });
    });

    it('handles revoke all callback error', async () => {
      mockOnRevokeAllSessions.mockRejectedValue(new Error('Failed to revoke all'));
      renderActiveSessions();
      await waitFor(() => {
        const revokeAllButton = screen.getByRole('button', { name: /revoke all sessions/i });
        fireEvent.click(revokeAllButton);
      });
      // The component doesn't remove sessions on error, so we expect them to still be there
      await waitFor(() => {
        expect(screen.getByText('Chrome on Windows')).toBeTruthy();
      });
    });
  });

  describe('Loading State', () => {
    it('shows no sessions when no sessions provided', async () => {
      const NoSessions = () => (
        <ToastProvider>
          <ActiveSessions
            sessions={[]}
            onRevokeSession={mockOnRevokeSession}
            onRevokeAllSessions={mockOnRevokeAllSessions}
          />
        </ToastProvider>
      );

      render(<NoSessions />);
      await waitFor(() => {
        expect(screen.getByText(/no active sessions/i)).toBeTruthy();
      });
    });
  });
});
