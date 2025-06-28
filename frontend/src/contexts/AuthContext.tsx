import React, { createContext, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { AuthService } from '../services/auth';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (provider: string) => Promise<void>;
  handleCallback: (code: string, state: string) => Promise<void>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  mockLogin: () => void;
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
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const authService = AuthService.getInstance();

  useEffect(() => {
    // Remove the checkAuth() call to prevent overriding the stored user
    // checkAuth();
  }, []);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
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
    } catch (error) {
      console.error('Callback handling failed:', error);
      throw error;
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    navigate('/login');
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
      id: '1',
      email: 'test@example.com',
      name: 'Test User',
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
    localStorage.setItem('user', JSON.stringify(mockUser));
    console.log('Mock user set:', mockUser);
    navigate('/dashboard');
  };

  const resetPassword = async (email: string) => {
    const response = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    if (!response.ok) {
      throw new Error('Failed to send reset email');
    }
  };

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    handleCallback,
    logout,
    updateUser,
    register,
    mockLogin,
    resetPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
