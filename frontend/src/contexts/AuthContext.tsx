import React, { createContext, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { auth } from '../config/api';
import { AuthService } from '../services/auth/AuthService';
import { RegisterData } from '../services/authManager';
import { AuthContextType, User } from '../types';

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
  const [error] = useState<string | null>(null);
  const navigate = useNavigate();

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
      // For now, we'll use the auth object from api.ts
      // This will be updated when we implement OAuth providers
      console.log('Login with provider:', provider);
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const handleCallback = async (code: string, state: string) => {
    try {
      // This will be implemented when we add OAuth providers
      console.log('Handle callback:', code, state);
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

  const register = async (userData: RegisterData) => {
    const { email, password, confirm_password } = userData;
    if (password !== confirm_password) {
      throw new Error('Passwords do not match');
    }
    const name = userData.email.split('@')[0]; // Use email prefix as name
    const [firstName, ...rest] = name.split('.');
    const lastName = rest.join('.');
    await AuthService.register({
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
      firstName: 'Mock',
      lastName: 'User',
      bio: 'Student at Example University',
      location: 'New York, USA',
      avatar: 'https://via.placeholder.com/150',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
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
        bio: 'Real user from backend',
        location: 'Real Location',
        avatar: 'https://via.placeholder.com/150',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
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

  const updatePassword = async (token: string, newPassword: string) => {
    try {
      await auth.resetPassword(token, newPassword);
    } catch (error) {
      console.error('Update password failed:', error);
      throw error;
    }
  };

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    error,
    isMockUser,
    login,
    handleCallback,
    logout,
    updateUser,
    register,
    mockLogin,
    testLogin,
    resetPassword,
    updatePassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
