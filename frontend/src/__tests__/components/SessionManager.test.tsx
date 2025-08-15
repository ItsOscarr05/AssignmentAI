import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthService } from '../../services/auth/AuthService';
import SessionManager from '../SessionManager';

// Mock Material-UI icons
vi.mock('@mui/icons-material', () => ({
  Computer: () => <span>Computer</span>,
  Smartphone: () => <span>Smartphone</span>,
  Tablet: () => <span>Tablet</span>,
  Delete: () => <span>Delete</span>,
}));

// Mock Material-UI components
vi.mock('@mui/material', () => ({
  Alert: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  Box: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  Button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  Card: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  CardContent: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  Chip: ({ children, ...props }: any) => <span {...props}>{children}</span>,
  CircularProgress: (props: any) => (
    <div role="progressbar" {...props}>
      Loading...
    </div>
  ),
  Dialog: ({ children, open, ...props }: any) => (open ? <div {...props}>{children}</div> : null),
  DialogActions: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  DialogContent: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  DialogTitle: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  Divider: () => <hr />,
  Grid: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  IconButton: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  List: ({ children, ...props }: any) => <ul {...props}>{children}</ul>,
  ListItem: ({ children, ...props }: any) => <li {...props}>{children}</li>,
  ListItemSecondaryAction: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  ListItemText: ({ primary, secondary, ...props }: any) => (
    <div {...props}>
      <div>{primary}</div>
      {secondary && <div>{secondary}</div>}
    </div>
  ),
  Paper: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  Stack: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  Typography: ({ children, ...props }: any) => <p {...props}>{children}</p>,
}));

// Mock AuthService
vi.mock('../../services/auth/AuthService', () => ({
  AuthService: {
    getSessions: vi.fn(),
    getSessionAnalytics: vi.fn(),
    revokeSession: vi.fn(),
    logoutAll: vi.fn(),
  },
}));

const mockSessions = [
  {
    id: 'session-1',
    device_info: {
      browser: 'Chrome',
      os: 'Windows',
      device: 'Desktop',
      ip_address: '192.168.1.1',
    },
    created_at: '2024-01-01T00:00:00Z',
    last_accessed: '2024-01-01T12:00:00Z',
    expires_at: '2024-01-08T00:00:00Z',
    is_current: true,
  },
  {
    id: 'session-2',
    device_info: {
      browser: 'Safari',
      os: 'iOS',
      device: 'Mobile',
      ip_address: '192.168.1.2',
    },
    created_at: '2024-01-02T00:00:00Z',
    last_accessed: '2024-01-02T10:00:00Z',
    expires_at: '2024-01-09T00:00:00Z',
    is_current: false,
  },
];

const mockAnalytics = {
  user_id: 1,
  total_sessions: 2,
  active_sessions: 2,
  session_analytics: [],
  summary: {
    total_duration: 7200,
    average_session_duration: 3600,
    most_active_device: 'Chrome on Windows',
  },
};

describe('SessionManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (AuthService.getSessions as any).mockResolvedValue({
      sessions: mockSessions,
      total_sessions: 2,
      current_session_id: 'session-1',
    });
    (AuthService.getSessionAnalytics as any).mockResolvedValue(mockAnalytics);
  });

  it('renders session manager with sessions', async () => {
    render(<SessionManager />);

    await waitFor(() => {
      // Use getAllByText to handle multiple instances
      const activeSessionsElements = screen.getAllByText('Active Sessions');
      expect(activeSessionsElements.length).toBeGreaterThan(0);
      expect(screen.getByText('Device Sessions (2)')).toBeInTheDocument();
    });
  });

  it('displays session analytics', async () => {
    render(<SessionManager />);

    await waitFor(() => {
      expect(screen.getByText('2')).toBeInTheDocument(); // Active sessions
      expect(screen.getByText('60m')).toBeInTheDocument(); // Avg session duration
      // Use getAllByText to handle multiple instances
      const chromeElements = screen.getAllByText('Chrome on Windows');
      expect(chromeElements.length).toBeGreaterThan(0); // Most active device
    });
  });

  it('displays session information correctly', async () => {
    render(<SessionManager />);

    await waitFor(() => {
      // Use getAllByText to handle multiple instances
      const chromeElements = screen.getAllByText('Chrome on Windows');
      expect(chromeElements.length).toBeGreaterThan(0);
      expect(screen.getByText('Safari on iOS')).toBeInTheDocument();
      expect(screen.getByText('IP: 192.168.1.1')).toBeInTheDocument();
      expect(screen.getByText('IP: 192.168.1.2')).toBeInTheDocument();
    });
  });

  it('shows current session indicator', async () => {
    render(<SessionManager />);

    await waitFor(() => {
      // Use getAllByText to handle multiple instances
      const chromeElements = screen.getAllByText('Chrome on Windows');
      expect(chromeElements.length).toBeGreaterThan(0);
      expect(screen.getByText('Safari on iOS')).toBeInTheDocument();
    });

    // Look for the current session indicator - it's a Chip component with "Current" label
    const currentIndicator = document.querySelector('span[label="Current"]');
    expect(currentIndicator).toBeInTheDocument();
  });

  it('handles session revocation', async () => {
    (AuthService.revokeSession as any).mockResolvedValue(undefined);

    render(<SessionManager />);

    await waitFor(() => {
      expect(screen.getByText('Device Sessions (2)')).toBeInTheDocument();
    });

    // Find and click the delete button for the second session (not current)
    const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
    await userEvent.click(deleteButtons[0]); // First delete button

    await waitFor(() => {
      expect(AuthService.revokeSession).toHaveBeenCalledWith('session-2');
    });
  });

  it('handles logout all devices', async () => {
    (AuthService.logoutAll as any).mockResolvedValue(undefined);

    render(<SessionManager />);

    await waitFor(() => {
      expect(screen.getByText('Logout All Devices')).toBeInTheDocument();
    });

    await userEvent.click(screen.getByText('Logout All Devices'));

    // Dialog should appear
    await waitFor(() => {
      expect(screen.getByText('Logout from All Devices')).toBeInTheDocument();
    });

    // Click confirm
    await userEvent.click(screen.getByText('Logout All'));

    await waitFor(() => {
      expect(AuthService.logoutAll).toHaveBeenCalled();
    });
  });

  it('handles errors gracefully', async () => {
    (AuthService.getSessions as any).mockRejectedValue(new Error('Failed to load sessions'));

    render(<SessionManager />);

    await waitFor(() => {
      expect(screen.getByText('Failed to load sessions')).toBeInTheDocument();
    });
  });

  it('handles session revocation error', async () => {
    (AuthService.revokeSession as any).mockRejectedValue(new Error('Failed to revoke session'));

    render(<SessionManager />);

    await waitFor(() => {
      expect(screen.getByText('Device Sessions (2)')).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
    await userEvent.click(deleteButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('Failed to revoke session')).toBeInTheDocument();
    });
  });

  it('handles logout all error', async () => {
    (AuthService.logoutAll as any).mockRejectedValue(
      new Error('Failed to logout from all devices')
    );

    render(<SessionManager />);

    await waitFor(() => {
      expect(screen.getByText('Logout All Devices')).toBeInTheDocument();
    });

    await userEvent.click(screen.getByText('Logout All Devices'));
    await userEvent.click(screen.getByText('Logout All'));

    await waitFor(() => {
      expect(screen.getByText('Failed to logout from all devices')).toBeInTheDocument();
    });
  });

  it('shows loading state initially', () => {
    render(<SessionManager />);

    // Should show loading initially
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('cancels logout all dialog', async () => {
    render(<SessionManager />);

    await waitFor(() => {
      expect(screen.getByText('Logout All Devices')).toBeInTheDocument();
    });

    await userEvent.click(screen.getByText('Logout All Devices'));
    await userEvent.click(screen.getByText('Cancel'));

    // Dialog should disappear
    await waitFor(() => {
      expect(screen.queryByText('Logout from All Devices')).not.toBeInTheDocument();
    });
  });
});
