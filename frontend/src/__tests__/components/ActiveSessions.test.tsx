import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ToastProvider } from '../../contexts/ToastContext';
import { api } from '../../lib/api';
import { ActiveSessions } from '../ActiveSessions';

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
    device: 'Chrome on Windows',
    ip: '192.168.1.1',
    lastActive: '2024-01-01T07:00:00Z',
    expiresAt: '2024-01-08T07:00:00Z',
  },
  {
    id: '2',
    device: 'Firefox on MacOS',
    ip: '192.168.1.2',
    lastActive: '2024-01-01T06:00:00Z',
    expiresAt: '2024-01-08T06:00:00Z',
  },
];

const mockOnSessionRevoked = vi.fn();

const renderActiveSessions = () => {
  return render(
    <ToastProvider>
      <ActiveSessions onSessionRevoked={mockOnSessionRevoked} />
    </ToastProvider>
  );
};

describe('ActiveSessions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(api, 'get').mockResolvedValue({ data: mockSessions });
    vi.spyOn(api, 'delete').mockResolvedValue({ data: {} });
    vi.spyOn(api, 'post').mockResolvedValue({});
  });

  describe('Basic Rendering', () => {
    it('renders session list', async () => {
      renderActiveSessions();
      await waitFor(() => {
        expect(screen.getByText(/active sessions/i)).toBeInTheDocument();
        mockSessions.forEach(session => {
          expect(screen.getByText(session.device)).toBeInTheDocument();
          expect(screen.getByText(new RegExp(session.ip))).toBeInTheDocument();
        });
      });
    });

    it('renders revoke buttons', async () => {
      renderActiveSessions();
      await waitFor(() => {
        const revokeButtons = screen.getAllByRole('button', { name: /revoke/i });
        expect(revokeButtons).toHaveLength(mockSessions.length + 1); // +1 for "Revoke All" button
        expect(screen.getByRole('button', { name: /revoke all sessions/i })).toBeInTheDocument();
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

      expect(api.delete).toHaveBeenCalledWith(`/auth/sessions/${mockSessions[0].id}`);
      expect(mockOnSessionRevoked).toHaveBeenCalled();
    });

    it('handles revoke all sessions', async () => {
      renderActiveSessions();
      await waitFor(() => {
        const revokeAllButton = screen.getByRole('button', { name: /revoke all sessions/i });
        fireEvent.click(revokeAllButton);
      });

      expect(api.delete).toHaveBeenCalledWith('/auth/sessions');
      expect(mockOnSessionRevoked).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('handles fetch error', async () => {
      vi.spyOn(api, 'get').mockRejectedValue(new Error('Failed to fetch'));
      renderActiveSessions();
      await waitFor(() => {
        expect(screen.getByText(/no active sessions/i)).toBeInTheDocument();
      });
    });

    it('handles revoke error', async () => {
      vi.spyOn(api, 'delete').mockRejectedValue(new Error('Failed to revoke'));
      renderActiveSessions();
      await waitFor(() => {
        const revokeButtons = screen.getAllByRole('button', { name: /^revoke$/i });
        fireEvent.click(revokeButtons[0]);
      });
      // The component doesn't remove sessions on error, so we expect them to still be there
      await waitFor(() => {
        expect(screen.getByText('Chrome on Windows')).toBeInTheDocument();
      });
    });

    it('handles revoke all error', async () => {
      vi.spyOn(api, 'delete').mockRejectedValue(new Error('Failed to revoke all'));
      renderActiveSessions();
      await waitFor(() => {
        const revokeAllButton = screen.getByRole('button', { name: /revoke all sessions/i });
        fireEvent.click(revokeAllButton);
      });
      // The component doesn't remove sessions on error, so we expect them to still be there
      await waitFor(() => {
        expect(screen.getByText('Chrome on Windows')).toBeInTheDocument();
      });
    });
  });

  describe('Loading State', () => {
    it('shows no sessions when loading fails', async () => {
      vi.spyOn(api, 'get').mockRejectedValue(new Error('Failed to fetch'));
      renderActiveSessions();
      await waitFor(() => {
        expect(screen.getByText(/no active sessions/i)).toBeInTheDocument();
      });
    });
  });
});
