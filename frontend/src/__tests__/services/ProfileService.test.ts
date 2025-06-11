import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useProfileStore } from '../../services/ProfileService';
import { api } from '../../services/api';

vi.mock('../../services/api', () => ({
  api: {
    get: vi.fn(),
    put: vi.fn(),
  },
}));

describe('ProfileService', () => {
  const mockProfile = {
    id: '1',
    firstName: 'Test',
    lastName: 'User',
    email: 'test@example.com',
    avatarUrl: 'https://example.com/avatar.jpg',
    bio: 'Test bio',
    preferences: {
      notifications: {
        email: true,
        push: true,
      },
      theme: 'light' as const,
      language: 'en',
    },
  };

  beforeEach(() => {
    useProfileStore.setState({
      profile: null,
      isLoading: false,
      error: null,
    });
    vi.clearAllMocks();
  });

  it('should initialize with default values', () => {
    const state = useProfileStore.getState();
    expect(state.profile).toBeNull();
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
  });

  it('should fetch profile data', async () => {
    vi.mocked(api.get).mockResolvedValueOnce({ data: mockProfile });

    await useProfileStore.getState().fetchProfile();

    const updatedState = useProfileStore.getState();
    expect(updatedState.profile).toEqual(mockProfile);
    expect(updatedState.isLoading).toBe(false);
    expect(updatedState.error).toBeNull();
  });

  it('should handle fetch errors', async () => {
    vi.mocked(api.get).mockRejectedValueOnce(new Error('Failed to fetch profile'));

    await useProfileStore.getState().fetchProfile();

    const updatedState = useProfileStore.getState();
    expect(updatedState.profile).toBeNull();
    expect(updatedState.isLoading).toBe(false);
    expect(updatedState.error).toBe('Failed to fetch profile');
  });

  it('should update profile', async () => {
    const updatedProfile = { ...mockProfile, firstName: 'Updated' };
    vi.mocked(api.put).mockResolvedValueOnce({ data: updatedProfile });

    useProfileStore.setState({ profile: mockProfile });
    const result = await useProfileStore.getState().updateProfile({ firstName: 'Updated' });

    const updatedState = useProfileStore.getState();
    expect(result).toEqual(updatedProfile);
    expect(updatedState.profile).toEqual(updatedProfile);
    expect(updatedState.isLoading).toBe(false);
    expect(updatedState.error).toBeNull();
  });

  it('should update preferences', async () => {
    const updatedPreferences = {
      notifications: {
        email: false,
        push: true,
      },
    };
    const updatedProfile = {
      ...mockProfile,
      preferences: {
        ...mockProfile.preferences,
        ...updatedPreferences,
      },
    };
    vi.mocked(api.put).mockResolvedValueOnce({ data: updatedProfile });

    useProfileStore.setState({ profile: mockProfile });
    const result = await useProfileStore.getState().updatePreferences(updatedPreferences);

    const updatedState = useProfileStore.getState();
    expect(result).toEqual(updatedProfile);
    expect(updatedState.profile).toEqual(updatedProfile);
    expect(updatedState.isLoading).toBe(false);
    expect(updatedState.error).toBeNull();
  });

  it('should handle update errors', async () => {
    vi.mocked(api.put).mockRejectedValueOnce(new Error('Failed to update profile'));

    useProfileStore.setState({ profile: mockProfile });
    await expect(
      useProfileStore.getState().updateProfile({ firstName: 'Updated' })
    ).rejects.toThrow('Failed to update profile');

    const updatedState = useProfileStore.getState();
    expect(updatedState.profile).toEqual(mockProfile);
    expect(updatedState.isLoading).toBe(false);
    expect(updatedState.error).toBe('Failed to update profile');
  });

  it('should reset profile state', () => {
    const mockProfile = {
      id: '1',
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com',
      avatarUrl: 'https://example.com/avatar.jpg',
      bio: 'Test bio',
      preferences: {
        notifications: {
          email: true,
          push: true,
        },
        theme: 'light' as const,
        language: 'en',
      },
    };

    useProfileStore.setState({
      profile: mockProfile,
      isLoading: true,
      error: 'Test error',
    });

    const state = useProfileStore.getState();
    state.resetState();

    const updatedState = useProfileStore.getState();
    expect(updatedState.profile).toBeNull();
    expect(updatedState.isLoading).toBe(false);
    expect(updatedState.error).toBeNull();
  });
});
