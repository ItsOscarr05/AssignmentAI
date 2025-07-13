import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { auth } from '../../services/api';
import NotificationPreferences from '../settings/NotificationPreferences';

// Mock Material-UI components
vi.mock('@mui/material', () => ({
  Box: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Card: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardHeader: ({ title, subheader }: { title: string; subheader?: string }) => (
    <div data-testid="card-header">
      <div data-testid="card-title">{title}</div>
      {subheader && <div data-testid="card-subheader">{subheader}</div>}
    </div>
  ),
  Typography: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Switch: ({
    checked,
    onChange,
    inputProps,
  }: {
    checked: boolean;
    onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
    inputProps?: { 'aria-label'?: string };
  }) => (
    <input
      type="checkbox"
      checked={checked}
      onChange={onChange}
      aria-label={inputProps?.['aria-label']}
    />
  ),
  FormControlLabel: ({ control, label }: { control: React.ReactNode; label: string }) => (
    <label>
      {control}
      {label}
    </label>
  ),
  Button: ({
    children,
    onClick,
    'aria-label': ariaLabel,
  }: {
    children: React.ReactNode;
    onClick?: () => void;
    'aria-label'?: string;
  }) => (
    <button onClick={onClick} aria-label={ariaLabel}>
      {children}
    </button>
  ),
  Grid: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Divider: () => <hr />,
  Snackbar: ({
    open,
    children,
    'data-testid': testId,
  }: {
    open: boolean;
    children: React.ReactNode;
    'data-testid'?: string;
  }) => (
    <div data-testid={testId} style={{ display: open ? 'block' : 'none' }}>
      {children}
    </div>
  ),
  Alert: ({ children, severity }: { children: React.ReactNode; severity?: string }) => (
    <div
      role="alert"
      data-severity={severity}
      data-testid={severity === 'success' ? 'success-alert' : 'error-alert'}
    >
      {children}
    </div>
  ),
  CircularProgress: () => <div role="progressbar" data-testid="loading-spinner" />,
  Dialog: ({ open, children }: { open: boolean; children: React.ReactNode }) =>
    open ? <div role="dialog">{children}</div> : null,
  DialogTitle: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogActions: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

// Mock Material-UI icons
vi.mock('@mui/icons-material', () => ({
  Email: () => <span data-testid="email-icon" />,
  PushPin: () => <span data-testid="push-icon" />,
  Sms: () => <span data-testid="sms-icon" />,
  Notifications: () => <span data-testid="notifications-icon" />,
}));

// Mock API calls
vi.mock('../../services/api', () => ({
  auth: {
    getProfile: vi.fn(),
    updateProfile: vi.fn(),
  },
}));

describe('NotificationPreferences', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();

    // Default mock implementation
    vi.mocked(auth.getProfile).mockResolvedValue({
      id: '1',
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com',
      preferences: {
        notifications: {
          assignment_updates: {
            email: true,
            push: false,
            sms: true,
            inApp: true,
          },
          feedback_updates: {
            email: true,
            push: true,
            sms: true,
            inApp: true,
          },
          grade_posted: {
            email: true,
            push: true,
            sms: true,
            inApp: true,
          },
          comment_mention: {
            email: true,
            push: true,
            sms: true,
            inApp: true,
          },
          system_updates: {
            email: true,
            push: false,
            sms: false,
            inApp: true,
          },
        },
      },
    });

    vi.mocked(auth.updateProfile).mockResolvedValue({ success: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const flushPromises = async () => {
    await Promise.resolve();
    await Promise.resolve();
  };

  const waitForLoadingToComplete = async () => {
    await vi.runAllTimersAsync();
    await flushPromises();
    await vi.runAllTimersAsync(); // Run timers again to catch any delayed effects
  };

  it('renders all notification preferences', async () => {
    render(<NotificationPreferences />);
    await waitForLoadingToComplete();

    // Check channel headers
    expect(screen.getByTestId('email-icon')).toBeInTheDocument();
    expect(screen.getByTestId('push-icon')).toBeInTheDocument();
    expect(screen.getByTestId('sms-icon')).toBeInTheDocument();
    expect(screen.getByTestId('notifications-icon')).toBeInTheDocument();
  });

  it('renders all notification types', async () => {
    render(<NotificationPreferences />);
    await waitForLoadingToComplete();

    expect(screen.getByText('Assignment Updates')).toBeInTheDocument();
    expect(screen.getByText('Feedback Updates')).toBeInTheDocument();
    expect(screen.getByText('System Updates')).toBeInTheDocument();
  });

  it('loads initial preferences from API', async () => {
    // Use real timers for this test
    vi.useRealTimers();

    // Mock the API call to resolve immediately with complete preferences
    vi.mocked(auth.getProfile).mockResolvedValueOnce({
      id: '1',
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com',
      preferences: {
        notifications: {
          assignment_updates: {
            email: true,
            push: false,
            sms: true,
            inApp: true,
          },
        },
      },
    });

    render(<NotificationPreferences />);

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    });

    // Check that all notification types are rendered
    expect(screen.getByText('Assignment Updates')).toBeInTheDocument();
    expect(screen.getByText('Feedback Updates')).toBeInTheDocument();
    expect(screen.getByText('Grade Posted')).toBeInTheDocument();
    expect(screen.getByText('Comment Mentions')).toBeInTheDocument();
    expect(screen.getByText('System Updates')).toBeInTheDocument();

    // Check that all notification channels are rendered using icons
    expect(screen.getByTestId('email-icon')).toBeInTheDocument();
    expect(screen.getByTestId('push-icon')).toBeInTheDocument();
    expect(screen.getByTestId('sms-icon')).toBeInTheDocument();
    expect(screen.getByTestId('notifications-icon')).toBeInTheDocument();

    // Check that the switches are in the correct state
    const assignmentEmailSwitch = screen.getByLabelText('Assignment Updates - Email Notifications');
    const assignmentPushSwitch = screen.getByLabelText('Assignment Updates - Push Notifications');
    const assignmentSmsSwitch = screen.getByLabelText('Assignment Updates - SMS Notifications');
    const assignmentInAppSwitch = screen.getByLabelText(
      'Assignment Updates - In-App Notifications'
    );

    expect(assignmentEmailSwitch).toBeChecked();
    expect(assignmentPushSwitch).not.toBeChecked();
    expect(assignmentSmsSwitch).toBeChecked();
    expect(assignmentInAppSwitch).toBeChecked();

    // Check that the API was called with the correct parameters
    expect(auth.getProfile).toHaveBeenCalled();

    // Switch back to fake timers
    vi.useFakeTimers();
  });

  it('shows loading state initially', async () => {
    // Mock the API call to never resolve
    vi.mocked(auth.getProfile).mockImplementationOnce(() => new Promise(() => {}));

    render(<NotificationPreferences />);

    // Check for loading spinner immediately
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  it('handles API errors gracefully', async () => {
    // Use real timers for this test
    vi.useRealTimers();

    // Mock the API call to reject immediately
    vi.mocked(auth.getProfile).mockRejectedValueOnce(new Error('Failed to fetch'));

    render(<NotificationPreferences />);

    // Wait for error state to be set
    await waitFor(() => {
      expect(screen.getByTestId('error-snackbar')).toBeVisible();
    });

    // Check error message
    expect(screen.getByTestId('error-alert')).toHaveAttribute('data-severity', 'error');
    expect(screen.getByText('Failed to load notification preferences')).toBeInTheDocument();

    // Switch back to fake timers
    vi.useFakeTimers();
  });

  it('updates preferences when toggled', async () => {
    render(<NotificationPreferences />);
    await waitForLoadingToComplete();

    const assignmentEmailSwitch = screen.getByLabelText('Assignment Updates - Email Notifications');
    fireEvent.click(assignmentEmailSwitch);
    await vi.runAllTimersAsync();
    expect(assignmentEmailSwitch).not.toBeChecked();
  });

  it('saves preferences when save button is clicked', async () => {
    // Use real timers for this test
    vi.useRealTimers();

    render(<NotificationPreferences />);

    // Wait for component to load
    await waitFor(() => {
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    });

    const saveButton = screen.getByRole('button', { name: /save/i });
    fireEvent.click(saveButton);

    // Wait for the success snackbar to appear
    await waitFor(() => {
      expect(screen.getByTestId('success-snackbar')).toBeVisible();
    });

    // Check for success message
    expect(screen.getByTestId('success-alert')).toHaveAttribute('data-severity', 'success');

    // Switch back to fake timers
    vi.useFakeTimers();
  });

  it('updates all switches when bulk update is triggered', async () => {
    render(<NotificationPreferences />);
    await waitForLoadingToComplete();

    const enableAllButton = screen.getByRole('button', { name: /enable all/i });
    fireEvent.click(enableAllButton);
    await vi.runAllTimersAsync();

    // Check Assignment Updates switches
    const assignmentEmailSwitch = screen.getByLabelText('Assignment Updates - Email Notifications');
    const assignmentPushSwitch = screen.getByLabelText('Assignment Updates - Push Notifications');
    const assignmentSmsSwitch = screen.getByLabelText('Assignment Updates - SMS Notifications');
    const assignmentInAppSwitch = screen.getByLabelText(
      'Assignment Updates - In-App Notifications'
    );

    expect(assignmentEmailSwitch).toBeChecked();
    expect(assignmentPushSwitch).toBeChecked();
    expect(assignmentSmsSwitch).toBeChecked();
    expect(assignmentInAppSwitch).toBeChecked();
  });

  it('disables all switches when bulk disable is triggered', async () => {
    render(<NotificationPreferences />);
    await waitForLoadingToComplete();

    const disableAllButton = screen.getByRole('button', { name: /disable all/i });
    fireEvent.click(disableAllButton);
    await vi.runAllTimersAsync();

    // Check Assignment Updates switches
    const assignmentEmailSwitch = screen.getByLabelText('Assignment Updates - Email Notifications');
    const assignmentPushSwitch = screen.getByLabelText('Assignment Updates - Push Notifications');
    const assignmentSmsSwitch = screen.getByLabelText('Assignment Updates - SMS Notifications');
    const assignmentInAppSwitch = screen.getByLabelText(
      'Assignment Updates - In-App Notifications'
    );

    expect(assignmentEmailSwitch).not.toBeChecked();
    expect(assignmentPushSwitch).not.toBeChecked();
    expect(assignmentSmsSwitch).not.toBeChecked();
    expect(assignmentInAppSwitch).not.toBeChecked();
  });

  it('shows confirmation dialog when resetting preferences', async () => {
    render(<NotificationPreferences />);
    await waitForLoadingToComplete();

    const resetButton = screen.getByRole('button', { name: /reset/i });
    fireEvent.click(resetButton);
    await vi.runAllTimersAsync();

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Reset Preferences')).toBeInTheDocument();
  });
});
