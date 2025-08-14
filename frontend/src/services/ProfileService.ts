import { create } from 'zustand';
import { getAuthContextUpdateUser } from '../utils/authBridge';
import { api } from './api';

interface ProfilePreferences {
  notifications: {
    email: boolean;
    push: boolean;
  };
  theme: 'light' | 'dark';
  language: string;
}

interface Profile {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  avatar?: string; // Add this for backend compatibility
  bio?: string;
  location?: string;
  website?: string;
  preferences: ProfilePreferences;
}

interface ProfileState {
  profile: Profile | null;
  isLoading: boolean;
  error: string | null;
  fetchProfile: () => Promise<void>;
  updateProfile: (profile: Partial<Profile>) => Promise<Profile>;
  updatePreferences: (preferences: Partial<ProfilePreferences>) => Promise<Profile>;
  resetState: () => void;
}

export const useProfileStore = create<ProfileState>(set => ({
  profile: null,
  isLoading: false,
  error: null,

  fetchProfile: async () => {
    try {
      set({ isLoading: true, error: null });

      // Check if we're in mock user mode
      const isMockUser = localStorage.getItem('isMockUser') === 'true';
      const endpoint = isMockUser ? '/users/profile/test' : '/users/profile';

      const response = await api.get<Profile>(endpoint);
      set({ profile: response.data, isLoading: false });

      // Update the user object in AuthContext with profile data
      const updateUser = getAuthContextUpdateUser();
      if (updateUser && response.data) {
        const profileData = response.data;
        // Extract first and last name from profile.name
        const nameParts = profileData.name.split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';

        await updateUser({
          name: profileData.name,
          firstName: firstName,
          lastName: lastName,
        });
      }
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch profile',
        isLoading: false,
      });
    }
  },

  updateProfile: async (profile: Partial<Profile>) => {
    try {
      set({ isLoading: true, error: null });
      const response = await api.put<Profile>('/users/profile', profile);
      set({ profile: response.data, isLoading: false });
      return response.data;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to update profile',
        isLoading: false,
      });
      throw error;
    }
  },

  updatePreferences: async (preferences: Partial<ProfilePreferences>) => {
    try {
      set({ isLoading: true, error: null });
      const response = await api.put<Profile>('/profile/preferences', preferences);
      set({ profile: response.data, isLoading: false });
      return response.data;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to update preferences',
        isLoading: false,
      });
      throw error;
    }
  },

  resetState: () => {
    set({
      profile: null,
      isLoading: false,
      error: null,
    });
  },
}));
