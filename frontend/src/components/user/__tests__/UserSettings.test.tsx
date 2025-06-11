import { ThemeProvider } from '@mui/material/styles';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ThemeContext } from '../../../contexts/ThemeContext';
import { theme } from '../../../theme';
import UserSettings from '../UserSettings';

// Mock Material-UI components
vi.mock('@mui/material', () => ({
  Card: ({ children }: { children: React.ReactNode }) => <div data-testid="card">{children}</div>,
  CardContent: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="card-content">{children}</div>
  ),
  FormControl: ({ children, sx }: { children: React.ReactNode; sx?: any }) => (
    <div data-testid="form-control" sx={sx}>
      {children}
    </div>
  ),
  FormControlLabel: ({ label, control, ...props }: any) => (
    <div data-testid="form-control-label">
      {control}
      <span>{label}</span>
    </div>
  ),
  InputLabel: ({ children, id }: { children: React.ReactNode; id: string }) => (
    <label data-testid="input-label" id={id}>
      {children}
    </label>
  ),
  MenuItem: ({ children, value }: { children: React.ReactNode; value: string }) => (
    <option data-testid="menu-item" value={value}>
      {children}
    </option>
  ),
  Select: ({ children, value, onChange, label, labelId }: any) => (
    <select
      data-testid="theme-select"
      value={value}
      onChange={onChange}
      label={label}
      labelId={labelId}
    >
      {children}
    </select>
  ),
  Switch: ({ checked, onChange, inputProps }: any) => (
    <input
      type="checkbox"
      checked={checked}
      onChange={onChange}
      role="switch"
      aria-label={inputProps['aria-label']}
      data-testid={`switch-${inputProps['aria-label'].toLowerCase().replace(/\s+/g, '-')}`}
    />
  ),
  Typography: ({ children, variant }: { children: React.ReactNode; variant?: string }) => (
    <div data-testid="typography" variant={variant}>
      {children}
    </div>
  ),
}));

const mockToggleTheme = vi.fn();

const renderComponent = () => {
  return render(
    <ThemeContext.Provider value={{ theme: 'light', toggleTheme: mockToggleTheme }}>
      <ThemeProvider theme={theme}>
        <UserSettings />
      </ThemeProvider>
    </ThemeContext.Provider>
  );
};

describe('UserSettings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders user settings correctly', () => {
    renderComponent();

    expect(screen.getByText('User Settings')).toBeInTheDocument();
    expect(screen.getByText('Theme')).toBeInTheDocument();
    expect(screen.getByText('Notifications')).toBeInTheDocument();
    expect(screen.getByText('Email Notifications')).toBeInTheDocument();
    expect(screen.getByText('Push Notifications')).toBeInTheDocument();
    expect(screen.getByText('SMS Notifications')).toBeInTheDocument();
  });

  it('handles theme changes', () => {
    renderComponent();

    const themeSelect = screen.getByTestId('theme-select');
    fireEvent.change(themeSelect, { target: { value: 'dark' } });

    expect(mockToggleTheme).toHaveBeenCalled();
  });

  it('handles notification preference updates', () => {
    renderComponent();

    const emailSwitch = screen.getByTestId('switch-email-notifications');
    const pushSwitch = screen.getByTestId('switch-push-notifications');
    const smsSwitch = screen.getByTestId('switch-sms-notifications');

    // Toggle email notifications
    fireEvent.click(emailSwitch);
    expect(emailSwitch).not.toBeChecked();

    // Toggle push notifications
    fireEvent.click(pushSwitch);
    expect(pushSwitch).not.toBeChecked();

    // Toggle SMS notifications
    fireEvent.click(smsSwitch);
    expect(smsSwitch).toBeChecked();
  });

  it('maintains state between toggles', () => {
    renderComponent();

    const emailSwitch = screen.getByTestId('switch-email-notifications');
    const pushSwitch = screen.getByTestId('switch-push-notifications');

    // Toggle email notifications
    fireEvent.click(emailSwitch);
    expect(emailSwitch).not.toBeChecked();

    // Toggle push notifications
    fireEvent.click(pushSwitch);
    expect(pushSwitch).not.toBeChecked();

    // Toggle email notifications again
    fireEvent.click(emailSwitch);
    expect(emailSwitch).toBeChecked();
  });
});
