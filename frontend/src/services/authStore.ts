import { create } from 'zustand';
import { api } from './api';

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
}

interface AuthState {
  user: AuthResponse['user'] | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  register: (data: RegisterData) => Promise<void>;
  login: (data: LoginData) => Promise<void>;
  logout: () => Promise<void>;
  setAuth: (data: AuthResponse) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>(set => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  register: async data => {
    try {
      set({ isLoading: true, error: null });
      const response = await api.post<AuthResponse>('/auth/register', data);
      set({
        user: response.data.user,
        token: response.data.token,
        isAuthenticated: true,
        isLoading: false,
      });
      localStorage.setItem('token', response.data.token);
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Registration failed',
        isLoading: false,
      });
      throw error;
    }
  },
  login: async data => {
    try {
      set({ isLoading: true, error: null });
      // OAuth2PasswordRequestForm expects username and password
      const response = await api.post<AuthResponse>('/auth/login', {
        username: data.email,
        password: data.password,
      });
      set({
        user: response.data.user,
        token: response.data.token,
        isAuthenticated: true,
        isLoading: false,
      });
      localStorage.setItem('token', response.data.token);
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Login failed',
        isLoading: false,
      });
      throw error;
    }
  },
  logout: async () => {
    try {
      set({ isLoading: true, error: null });
      await api.post('/auth/logout');
      set({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      });
      localStorage.removeItem('token');
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Logout failed',
        isLoading: false,
      });
      throw error;
    }
  },
  setAuth: data => {
    set({
      user: data.user,
      token: data.token,
      isAuthenticated: true,
    });
    localStorage.setItem('token', data.token);
  },
  clearAuth: () => {
    set({
      user: null,
      token: null,
      isAuthenticated: false,
    });
    localStorage.removeItem('token');
  },
}));

export const register = async (data: RegisterData): Promise<AuthResponse> => {
  const response = await api.post<AuthResponse>('/auth/register', data);
  return response.data;
};

export const login = async (data: LoginData): Promise<AuthResponse> => {
  // OAuth2PasswordRequestForm expects username and password
  const response = await api.post<AuthResponse>('/auth/login', {
    username: data.email,
    password: data.password,
  });
  return response.data;
};

export const logout = async (): Promise<void> => {
  await api.post('/auth/logout');
  useAuthStore.getState().clearAuth();
};

export const getCurrentUser = async (): Promise<AuthResponse['user']> => {
  const response = await api.get<AuthResponse>('/auth/me');
  return response.data.user;
};

export const AuthService = {
  register,
  login,
  logout,
  getCurrentUser,
};
