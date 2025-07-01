import React, { createContext, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, auth } from '../config/api';
import { AuthService } from '../services/auth/AuthService';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isMockUser: boolean;
  login: (provider: string) => Promise<void>;
  handleCallback: (code: string, state: string) => Promise<void>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  mockLogin: () => void;
  testLogin: (email: string, password: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMockUser, setIsMockUser] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const authService = AuthService.getInstance();

  useEffect(() => {
    // Remove the checkAuth() call to prevent overriding the stored user
    // checkAuth();
  }, []);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const storedIsMockUser = localStorage.getItem('isMockUser') === 'true';

    if (storedUser) {
      setUser(JSON.parse(storedUser));
      setIsMockUser(storedIsMockUser);
    }
    setIsLoading(false);
  }, []);

  const login = async (provider: string) => {
    try {
      await authService.login(provider);
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const handleCallback = async (code: string, state: string) => {
    try {
      const userData = await authService.handleCallback(code, state);
      setUser(userData);
      setIsMockUser(false);
      localStorage.setItem('isMockUser', 'false');
    } catch (error) {
      console.error('Callback handling failed:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await auth.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setIsMockUser(false);
      localStorage.removeItem('user');
      localStorage.removeItem('isMockUser');
      navigate('/login');
    }
  };

  const updateUser = async (userData: Partial<User>) => {
    try {
      const response = await api.patch('/users/me', userData);
      setUser(response.data);
    } catch (error) {
      console.error('Failed to update user:', error);
      throw error;
    }
  };

  const register = async (email: string, password: string, name: string) => {
    const [firstName, ...rest] = name.split(' ');
    const lastName = rest.join(' ');
    await AuthService.getInstance().register({
      email,
      password,
      firstName,
      lastName,
    });
  };

  const mockLogin = () => {
    console.log('Mock login called');
    const mockUser: User = {
      id: 'mock-1',
      email: 'mock@example.com',
      name: 'Mock User',
      role: 'student',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      preferences: {
        theme: 'light',
        notifications: true,
        language: 'en',
      },
      profile: {
        avatar: 'https://via.placeholder.com/150',
        bio: 'Student at Example University',
        location: 'New York, USA',
        education: 'Bachelor of Science',
        interests: ['Computer Science', 'Mathematics', 'Physics'],
      },
    };
    setUser(mockUser);
    setIsMockUser(true);
    localStorage.setItem('user', JSON.stringify(mockUser));
    localStorage.setItem('isMockUser', 'true');
    console.log('Mock user set:', mockUser);
    navigate('/dashboard');
  };

  const testLogin = async (email: string, password: string) => {
    try {
      const response = await auth.login(email, password);
      const realUser = response.user || {
        id: 'real-1',
        email,
        name: 'Real User',
        firstName: 'Real',
        lastName: 'User',
        role: 'student',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        preferences: {
          theme: 'light',
          notifications: true,
          language: 'en',
        },
        profile: {
          avatar: 'https://via.placeholder.com/150',
          bio: 'Real user from backend',
          location: 'Real Location',
          education: 'Real Education',
          interests: ['Real Interests'],
        },
      };
      setUser(realUser);
      setIsMockUser(false);
      localStorage.setItem('user', JSON.stringify(realUser));
      localStorage.setItem('isMockUser', 'false');
      navigate('/dashboard');
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const resetPassword = async (email: string) => {
    try {
      await auth.forgotPassword(email);
    } catch (error) {
      console.error('Reset password failed:', error);
      throw error;
    }
  };

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    isMockUser,
    login,
    handleCallback,
    logout,
    updateUser,
    register,
    mockLogin,
    testLogin,
    resetPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
