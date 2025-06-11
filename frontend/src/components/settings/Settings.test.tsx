import { fireEvent, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render } from '../../test/test-utils';
import { AppSettings } from '../../types/settings';
import Settings from './Settings';

// Mock Material-UI components
vi.mock('@mui/material', () => ({
  Box: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  Card: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  CardContent: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  CircularProgress: () => <div role="progressbar" data-testid="loading-spinner" />,
  FormControl: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  FormControlLabel: ({ control, label, ...props }: any) => {
    const controlWithLabel = React.cloneElement(control, {
      'aria-label': label,
    });
    return (
      <div {...props}>
        {controlWithLabel}
        <span>{label}</span>
      </div>
    );
  },
  FormGroup: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  Grid: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  InputLabel: ({ children, ...props }: any) => <label {...props}>{children}</label>,
  MenuItem: ({ children, value, ...props }: any) => (
    <option value={value} {...props}>
      {children}
    </option>
  ),
  Select: ({ children, value, onChange, label, ...props }: any) => (
    <select
      value={value}
      onChange={e => {
        if (onChange) {
          onChange({ target: { value: e.target.value } });
        }
      }}
      aria-label={label}
      {...props}
    >
      {children}
    </select>
  ),
  Switch: ({ checked, onChange, inputProps, ...props }: any) => (
    <input
      type="checkbox"
      checked={checked}
      onChange={e => {
        if (onChange) {
          onChange({ target: { checked: e.target.checked } });
        }
      }}
      role="switch"
      aria-label={props['aria-label']}
      {...inputProps}
      {...props}
    />
  ),
  Typography: ({ children, color, ...props }: any) => (
    <div data-color={color} {...props}>
      {children}
    </div>
  ),
}));

// Mock i18n
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: {
      changeLanguage: vi.fn(),
    },
  }),
}));

// Mock settings API
vi.mock('../../services/api/settings', () => ({
  settingsApi: {
    getSettings: vi.fn(),
    updateSettings: vi.fn(),
  },
}));

const mockSettings: AppSettings = {
  notifications: {
    email: true,
    push: false,
    assignments: true,
    grades: true,
  },
  appearance: {
    theme: 'dark',
    fontSize: 'medium',
    density: 'comfortable',
  },
  language: 'en',
  timezone: 'UTC',
  privacy: {
    profileVisibility: 'public',
    activityStatus: true,
  },
};

describe('Settings Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders settings form with initial values', () => {
    render(<Settings initialSettings={mockSettings} />);

    expect(screen.getByRole('switch', { name: 'settings.notifications.email' })).toBeChecked();
    expect(screen.getByRole('switch', { name: 'settings.notifications.push' })).not.toBeChecked();
    expect(screen.getByRole('combobox', { name: 'settings.language.language' })).toHaveValue('en');
    expect(screen.getByRole('combobox', { name: 'settings.language.timezone' })).toHaveValue('UTC');
  });

  it('handles setting updates', async () => {
    const mockOnUpdate = vi.fn();
    const { settingsApi } = await import('../../services/api/settings');
    (settingsApi.updateSettings as any).mockResolvedValueOnce({ data: mockSettings });
    (settingsApi.updateSettings as any).mockResolvedValueOnce({ data: mockSettings });

    render(<Settings initialSettings={mockSettings} onUpdate={mockOnUpdate} />);

    // Toggle email notifications
    const emailSwitch = screen.getByRole('switch', { name: 'settings.notifications.email' });
    fireEvent.click(emailSwitch);

    // Wait for the first update to complete
    await waitFor(() => {
      expect(settingsApi.updateSettings).toHaveBeenCalledWith(
        expect.objectContaining({
          notifications: expect.objectContaining({
            email: false,
          }),
        })
      );
    });

    // Change language
    const languageSelect = screen.getByRole('combobox', { name: 'settings.language.language' });
    fireEvent.change(languageSelect, { target: { value: 'es' } });

    // Wait for the second update to complete and verify both updates
    await waitFor(() => {
      const calls = (settingsApi.updateSettings as any).mock.calls;
      expect(calls.length).toBe(2);

      // First call should have email: false
      expect(calls[0][0]).toEqual(
        expect.objectContaining({
          notifications: expect.objectContaining({
            email: false,
          }),
        })
      );

      // Second call should have language: 'es' and maintain email: false
      const secondCall = calls[1][0];
      expect(secondCall).toEqual(
        expect.objectContaining({
          notifications: expect.objectContaining({
            email: false,
          }),
          language: expect.any(String),
        })
      );
      expect(secondCall.language).toBe('es');
    });

    // Verify the final state through onUpdate
    const lastUpdateCall = mockOnUpdate.mock.calls[mockOnUpdate.mock.calls.length - 1][0];
    expect(lastUpdateCall).toEqual(
      expect.objectContaining({
        notifications: expect.objectContaining({
          email: false,
        }),
        language: expect.any(String),
      })
    );
    expect(lastUpdateCall.language).toBe('es');
  });

  it('handles theme change', async () => {
    const mockOnThemeChange = vi.fn();
    const { settingsApi } = await import('../../services/api/settings');
    (settingsApi.updateSettings as any).mockResolvedValueOnce({ data: mockSettings });

    render(<Settings initialSettings={mockSettings} onThemeChange={mockOnThemeChange} />);

    const themeSelect = screen.getByRole('combobox', { name: 'settings.appearance.theme' });
    fireEvent.change(themeSelect, { target: { value: 'light' } });

    await waitFor(() => {
      expect(settingsApi.updateSettings).toHaveBeenCalledWith(
        expect.objectContaining({
          appearance: expect.objectContaining({
            theme: 'light',
          }),
        })
      );
    });
  });

  it('handles notification settings', async () => {
    const mockOnNotificationUpdate = vi.fn();
    const { settingsApi } = await import('../../services/api/settings');
    (settingsApi.updateSettings as any).mockResolvedValueOnce({ data: mockSettings });

    render(
      <Settings initialSettings={mockSettings} onNotificationUpdate={mockOnNotificationUpdate} />
    );

    const pushSwitch = screen.getByRole('switch', { name: 'settings.notifications.push' });
    fireEvent.click(pushSwitch);

    await waitFor(() => {
      expect(settingsApi.updateSettings).toHaveBeenCalledWith(
        expect.objectContaining({
          notifications: expect.objectContaining({
            push: true,
          }),
        })
      );
    });
  });

  it('shows loading state when fetching settings', async () => {
    const { settingsApi } = await import('../../services/api/settings');
    (settingsApi.getSettings as any).mockImplementationOnce(() => new Promise(() => {}));

    render(<Settings />);
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  it('shows error state when settings fetch fails', async () => {
    const { settingsApi } = await import('../../services/api/settings');
    const errorMessage = 'Failed to fetch settings';
    (settingsApi.getSettings as any).mockRejectedValueOnce(new Error(errorMessage));

    render(<Settings />);

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  it('shows error state when settings update fails', async () => {
    const { settingsApi } = await import('../../services/api/settings');
    const errorMessage = 'Failed to update settings';
    (settingsApi.updateSettings as any).mockRejectedValueOnce(new Error(errorMessage));

    render(<Settings initialSettings={mockSettings} />);

    const emailSwitch = screen.getByRole('switch', { name: 'settings.notifications.email' });
    fireEvent.click(emailSwitch);

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });
});
