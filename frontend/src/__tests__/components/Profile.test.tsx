import { ThemeProvider } from '@mui/material';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAuth } from '../../hooks/useAuth';
import Profile from '../../pages/dashboard/Profile';
import { useProfileStore } from '../../services/ProfileService';
import { theme } from '../../theme';

// Mock @mui/material
vi.mock('@mui/material', async importOriginal => {
  const actual = await importOriginal<typeof import('@mui/material')>();
  return {
    ...actual,
    ThemeProvider: ({ children }: { children: React.ReactNode }) => children,
  };
});

vi.mock('../../services/ProfileService', () => ({
  useProfileStore: vi.fn(),
}));

vi.mock('../../hooks/useAuth');

describe('Profile Component', () => {
  const mockLogout = vi.fn();
  const mockUpdateProfile = vi.fn();
  const mockUpdatePreferences = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useAuth as any).mockReturnValue({ logout: mockLogout });
    (useProfileStore as any).mockReturnValue({
      profile: {
        name: 'Test User',
        email: 'test@example.com',
        institution: 'Test University',
        isVerified: true,
        statistics: {
          totalAssignments: 10,
          completedAssignments: 5,
          averageScore: 85,
          activeDays: 30,
        },
        preferences: {
          darkMode: false,
          notifications: true,
        },
      },
      isLoading: false,
      error: null,
      updateProfile: mockUpdateProfile,
      updatePreferences: mockUpdatePreferences,
    });
  });

  it('renders profile information', () => {
    render(
      <ThemeProvider theme={theme}>
        <Profile />
      </ThemeProvider>
    );

    expect(screen.getByText(/Test User/)).toBeInTheDocument();
    expect(screen.getByText(/test@example.com/)).toBeInTheDocument();
    expect(screen.getByText(/Test University/)).toBeInTheDocument();
  });

  it('shows loading state', () => {
    (useProfileStore as any).mockReturnValue({
      profile: null,
      isLoading: true,
      error: null,
      updateProfile: mockUpdateProfile,
      updatePreferences: mockUpdatePreferences,
    });

    render(
      <ThemeProvider theme={theme}>
        <Profile />
      </ThemeProvider>
    );

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('shows error message', () => {
    (useProfileStore as any).mockReturnValue({
      profile: null,
      isLoading: false,
      error: 'Failed to load profile',
      updateProfile: mockUpdateProfile,
      updatePreferences: mockUpdatePreferences,
    });

    render(
      <ThemeProvider theme={theme}>
        <Profile />
      </ThemeProvider>
    );

    expect(screen.getByText('Failed to load profile')).toBeInTheDocument();
  });

  it('handles profile update', async () => {
    render(
      <ThemeProvider theme={theme}>
        <Profile />
      </ThemeProvider>
    );

    fireEvent.click(screen.getByText('Edit Profile'));

    const nameInput = screen.getByLabelText('Name');
    const phoneInput = screen.getByLabelText('Phone');
    const institutionInput = screen.getByLabelText('Institution');

    fireEvent.change(nameInput, { target: { value: 'New Name' } });
    fireEvent.change(phoneInput, { target: { value: '1234567890' } });
    fireEvent.change(institutionInput, { target: { value: 'New University' } });

    fireEvent.click(screen.getByText('Save Changes'));

    await waitFor(() => {
      expect(mockUpdateProfile).toHaveBeenCalledWith({
        name: 'New Name',
        phone: '1234567890',
        institution: 'New University',
      });
    });
  });

  it('handles preferences update', async () => {
    render(
      <ThemeProvider theme={theme}>
        <Profile />
      </ThemeProvider>
    );

    fireEvent.click(screen.getByText('Edit Preferences'));

    fireEvent.click(screen.getByText('Save Preferences'));

    await waitFor(() => {
      expect(mockUpdatePreferences).toHaveBeenCalledWith({
        darkMode: true,
        notifications: false,
      });
    });
  });

  it('displays statistics correctly', () => {
    render(
      <ThemeProvider theme={theme}>
        <Profile />
      </ThemeProvider>
    );

    expect(screen.getByText(/Total Assignments: 10/)).toBeInTheDocument();
    expect(screen.getByText(/Completed: 5/)).toBeInTheDocument();
    expect(screen.getByText(/Average Score: 85%/)).toBeInTheDocument();
    expect(screen.getByText(/Active Days: 30/)).toBeInTheDocument();
  });

  it('handles verification status', () => {
    render(
      <ThemeProvider theme={theme}>
        <Profile />
      </ThemeProvider>
    );

    expect(screen.getByText(/Verification Status: Verified/)).toBeInTheDocument();
  });
});
