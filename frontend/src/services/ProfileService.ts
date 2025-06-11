import { create } from 'zustand';
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
  firstName: string;
  lastName: string;
  email: string;
  avatarUrl?: string;
  bio?: string;
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
      const response = await api.get<Profile>('/profile');
      set({ profile: response.data, isLoading: false });
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
      const response = await api.put<Profile>('/profile', profile);
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
