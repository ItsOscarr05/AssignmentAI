import { create } from 'zustand';
import { User } from '../../types';
import { AuthService } from './AuthService';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  logout: () => void;
  register: (email: string, password: string, full_name: string) => Promise<void>;
  refreshToken: () => Promise<void>;
}

export const useAuthStore = create<AuthState>(set => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  logout: async () => {
    set({ isLoading: true });
    try {
      await AuthService.logout();
      set({ user: null, isAuthenticated: false, isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },
  refreshToken: async () => {
    set({ isLoading: true });
    try {
      const response = await AuthService.refreshToken();
      set({ user: response.user, isAuthenticated: true, isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },
  register: async (email: string, password: string, full_name: string) => {
    set({ isLoading: true, error: null });
    try {
      const [firstName, ...lastNameParts] = full_name.split(' ');
      const lastName = lastNameParts.join(' ');
      const response = await AuthService.register({
        email,
        password,
        firstName,
        lastName,
      });
      set({ user: response.user, isAuthenticated: true, isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },
}));
