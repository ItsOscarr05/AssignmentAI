import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UserPreferences as UserPreferencesType } from '../../../types/user';
import UserPreferences from '../UserPreferences';

// Mock LoadingSpinner component
vi.mock('../common/LoadingSpinner', () => ({
  default: () => <div data-testid="loading-spinner">Loading...</div>,
}));

// Mock Toast component
vi.mock('../common/Toast', () => ({
  Toast: ({ open, message }: { open: boolean; message: string }) =>
    open ? <div data-testid="toast">{message}</div> : null,
}));

// Mock Material-UI components
vi.mock('@mui/material', () => ({
  CircularProgress: () => <div data-testid="circular-progress" />,
  FormControl: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="form-control">{children}</div>
  ),
  FormControlLabel: ({
    children,
    control,
  }: {
    children: React.ReactNode;
    control: React.ReactNode;
  }) => (
    <div data-testid="form-control-label">
      {control}
      {children}
    </div>
  ),
  FormGroup: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="form-group">{children}</div>
  ),
  Grid: ({ children }: { children: React.ReactNode }) => <div data-testid="grid">{children}</div>,
  InputLabel: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="input-label">{children}</div>
  ),
  MenuItem: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="menu-item">{children}</div>
  ),
  Paper: ({ children }: { children: React.ReactNode }) => <div data-testid="paper">{children}</div>,
  Select: ({
    children,
    value,
    onChange,
    label,
  }: {
    children: React.ReactNode;
    value: string;
    onChange: (event: any) => void;
    label: string;
  }) => (
    <select data-testid="select" value={value} onChange={onChange} aria-label={label}>
      {children}
    </select>
  ),
  Switch: ({ checked, onChange }: { checked: boolean; onChange: (event: any) => void }) => (
    <input
      type="checkbox"
      data-testid="switch"
      checked={checked}
      onChange={onChange}
      role="checkbox"
    />
  ),
  Typography: ({ children, variant }: { children: React.ReactNode; variant?: string }) => (
    <p data-testid="typography" data-variant={variant}>
      {children}
    </p>
  ),
  Box: ({ children, ...props }: { children: React.ReactNode; [key: string]: any }) => (
    <div data-testid="box" {...props}>
      {children}
    </div>
  ),
  Button: ({
    children,
    onClick,
    disabled,
  }: {
    children: React.ReactNode;
    onClick: () => void;
    disabled?: boolean;
  }) => (
    <button data-testid="button" onClick={onClick} disabled={disabled}>
      {children}
    </button>
  ),
}));

// Mock Material-UI icons
vi.mock('@mui/icons-material', () => ({
  Save: () => <span data-testid="save-icon" />,
}));

// Mock the global fetch function
const mockFetch = vi.fn();
global.fetch = mockFetch;

const mockPreferences: UserPreferencesType = {
  theme: 'light',
  language: 'en',
  timezone: 'UTC',
  notifications: {
    email: true,
    push: false,
    assignmentReminders: true,
    gradeUpdates: true,
    feedbackAlerts: false,
  },
  accessibility: {
    highContrast: false,
    largeText: false,
    screenReader: false,
  },
};

describe('UserPreferences', () => {
  const renderComponent = () => {
    return render(<UserPreferences />);
  };

  beforeEach(() => {
    console.log('\n=== Starting new test ===');
    // Reset all mocks before each test
    vi.clearAllMocks();
    // Mock the initial preferences fetch
    mockFetch.mockImplementation((url, options) => {
      console.log('Mock fetch called with:', { url, options });

      if (url === '/api/users/preferences') {
        if (options?.method === 'PUT') {
          console.log('Handling PUT request');
          return Promise.resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve({ success: true }),
          });
        }

        console.log('Handling GET request, returning mock preferences');
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => {
            console.log('Mock json called, returning:', mockPreferences);
            return Promise.resolve({
              data: mockPreferences,
              success: true,
            });
          },
        });
      }

      console.log('Rejecting invalid URL:', url);
      return Promise.reject(new Error('Invalid URL'));
    });
  });

  it('renders user preferences correctly', async () => {
    console.log('\n=== Test: renders user preferences correctly ===');
    console.log('Rendering component...');
    renderComponent();
    console.log('Component rendered, checking initial state');

    // Wait for loading to complete
    console.log('Waiting for loading spinner to disappear...');
    await waitFor(
      () => {
        const spinner = screen.queryByTestId('circular-progress');
        console.log('Loading spinner present:', !!spinner);
        expect(spinner).not.toBeInTheDocument();
      },
      { timeout: 3000 }
    );

    // Wait for the preferences to be loaded and check the main heading
    console.log('Waiting for preferences to load...');
    await waitFor(
      () => {
        console.log('Checking for main heading...');
        const heading = screen.getByText('Application Preferences');
        console.log('Found heading:', heading.textContent);
        expect(heading).toBeInTheDocument();
      },
      { timeout: 3000 }
    );

    // Verify fetch was called with correct URL
    console.log('Verifying fetch calls...');
    expect(mockFetch).toHaveBeenCalledWith('/api/users/preferences');
    console.log('Test completed successfully');
  });

  it('displays loading state while fetching data', () => {
    console.log('\n=== Test: displays loading state while fetching data ===');
    console.log('Rendering component...');
    renderComponent();
    console.log('Checking for loading spinner...');
    const spinner = screen.getByTestId('circular-progress');
    console.log('Loading spinner found:', !!spinner);
    expect(spinner).toBeInTheDocument();
  });

  it('displays error message when API call fails', async () => {
    console.log('\n=== Test: displays error message when API call fails ===');
    // Override the initial mock to simulate an error
    mockFetch.mockImplementationOnce(() => {
      console.log('Mock fetch simulating error');
      return Promise.reject(new Error('Failed to fetch'));
    });

    console.log('Rendering component...');
    renderComponent();

    console.log('Waiting for error message...');
    await waitFor(() => {
      const errorMessage = screen.getByText('Failed to load preferences');
      console.log('Error message found:', errorMessage.textContent);
      expect(errorMessage).toBeInTheDocument();
    });
  });

  it('allows updating theme preference', async () => {
    console.log('\n=== Test: allows updating theme preference ===');
    console.log('Rendering component...');
    renderComponent();

    // Wait for loading to complete
    await waitFor(
      () => {
        const spinner = screen.queryByTestId('loading-spinner');
        expect(spinner).not.toBeInTheDocument();
      },
      { timeout: 3000 }
    );

    // Wait for the preferences to be loaded
    await waitFor(
      () => {
        const heading = screen.getByText('Application Preferences');
        expect(heading).toBeInTheDocument();
      },
      { timeout: 3000 }
    );

    console.log('Finding theme select...');
    const themeSelect = screen.getByLabelText('Theme');
    console.log('Theme select found:', !!themeSelect);
    console.log('Current theme value:', themeSelect.value);

    console.log('Changing theme to dark...');
    fireEvent.change(themeSelect, { target: { value: 'dark' } });
    console.log('New theme value:', themeSelect.value);
    expect(themeSelect).toHaveValue('dark');
  });

  it('allows updating notification preferences', async () => {
    renderComponent();

    // Wait for loading to complete
    await waitFor(
      () => {
        const spinner = screen.queryByTestId('loading-spinner');
        expect(spinner).not.toBeInTheDocument();
      },
      { timeout: 3000 }
    );

    // Wait for the preferences to be loaded
    await waitFor(
      () => {
        const heading = screen.getByText('Application Preferences');
        expect(heading).toBeInTheDocument();
      },
      { timeout: 3000 }
    );

    const emailSwitch = screen.getByRole('checkbox', { name: 'Email Notifications' });
    fireEvent.click(emailSwitch);

    expect(emailSwitch).not.toBeChecked();
  });

  it('allows updating accessibility preferences', async () => {
    renderComponent();

    // Wait for loading to complete
    await waitFor(
      () => {
        const spinner = screen.queryByTestId('loading-spinner');
        expect(spinner).not.toBeInTheDocument();
      },
      { timeout: 3000 }
    );

    // Wait for the preferences to be loaded
    await waitFor(
      () => {
        const heading = screen.getByText('Application Preferences');
        expect(heading).toBeInTheDocument();
      },
      { timeout: 3000 }
    );

    const highContrastSwitch = screen.getByRole('checkbox', { name: 'High Contrast Mode' });
    fireEvent.click(highContrastSwitch);

    expect(highContrastSwitch).toBeChecked();
  });

  it('disables save button during API calls', async () => {
    renderComponent();

    // Wait for loading to complete
    await waitFor(
      () => {
        const spinner = screen.queryByTestId('loading-spinner');
        expect(spinner).not.toBeInTheDocument();
      },
      { timeout: 3000 }
    );

    // Wait for the preferences to be loaded
    await waitFor(
      () => {
        const heading = screen.getByText('Application Preferences');
        expect(heading).toBeInTheDocument();
      },
      { timeout: 3000 }
    );

    const saveButton = screen.getByText('Save Changes');
    fireEvent.click(saveButton);

    expect(saveButton).toBeDisabled();
    expect(screen.getByText('Saving...')).toBeInTheDocument();
  });

  it('shows success message after saving preferences', async () => {
    renderComponent();

    // Wait for loading to complete
    await waitFor(
      () => {
        const spinner = screen.queryByTestId('loading-spinner');
        expect(spinner).not.toBeInTheDocument();
      },
      { timeout: 3000 }
    );

    // Wait for the preferences to be loaded
    await waitFor(
      () => {
        const heading = screen.getByText('Application Preferences');
        expect(heading).toBeInTheDocument();
      },
      { timeout: 3000 }
    );

    const saveButton = screen.getByText('Save Changes');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByTestId('toast')).toHaveTextContent('Preferences saved successfully');
    });
  });

  it('shows error message when saving fails', async () => {
    // Mock successful initial fetch but failed update
    mockFetch.mockReset();
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockPreferences),
    });
    mockFetch.mockRejectedValueOnce(new Error('Failed to update'));

    renderComponent();

    // Wait for loading to complete
    await waitFor(
      () => {
        const spinner = screen.queryByTestId('loading-spinner');
        expect(spinner).not.toBeInTheDocument();
      },
      { timeout: 3000 }
    );

    // Wait for the preferences to be loaded
    await waitFor(
      () => {
        const heading = screen.getByText('Application Preferences');
        expect(heading).toBeInTheDocument();
      },
      { timeout: 3000 }
    );

    const saveButton = screen.getByText('Save Changes');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByTestId('toast')).toHaveTextContent('Failed to save preferences');
    });
  });
});
