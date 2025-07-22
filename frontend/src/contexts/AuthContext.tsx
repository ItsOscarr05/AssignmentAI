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

  const login = async (email: string, password: string) => {
    try {
      await auth.login(email, password);

      // After successful login, fetch user data
      const userResponse = await auth.getCurrentUser();
      const user = userResponse || {
        id: 'user-1',
        email,
        name: email.split('@')[0],
        firstName: email.split('@')[0],
        lastName: '',
        role: 'student',
        bio: '',
        location: '',
        avatar: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      setUser(user);
      setIsMockUser(false);
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('isMockUser', 'false');
      navigate('/dashboard');
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const handleCallback = async (code: string, state: string) => {
    try {
      // Determine the provider from the state or URL parameters
      // For now, we'll try to detect it from the current URL or use a default
      const urlParams = new URLSearchParams(window.location.search);
      const provider = urlParams.get('provider') || 'google'; // Default to google

      // Call the backend OAuth callback endpoint
      const response = await api.post(`/auth/oauth/${provider}/callback`, {
        code,
        state,
      });

      if (response.data.access_token) {
        // Store the token
        localStorage.setItem('token', response.data.access_token);
        api.defaults.headers.common['Authorization'] = `Bearer ${response.data.access_token}`;

        // Set the user
        const user = response.data.user || {
          id: response.data.user?.id || 'oauth-user',
          email: response.data.user?.email || 'oauth@example.com',
          name: response.data.user?.name || 'OAuth User',
          firstName: response.data.user?.name?.split(' ')[0] || 'OAuth',
          lastName: response.data.user?.name?.split(' ').slice(1).join(' ') || 'User',
          role: 'student',
          bio: '',
          location: '',
          avatar: '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        setUser(user);
        setIsMockUser(false);
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('isMockUser', 'false');
      }

      return response.data;
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

    try {
      // Clear any plan-related storage before registration (only for new users)
      localStorage.removeItem('selectedPlan');
      localStorage.removeItem('planSelection');
      localStorage.removeItem('pricingPlan');
      sessionStorage.removeItem('selectedPlan');
      sessionStorage.removeItem('planSelection');
      sessionStorage.removeItem('pricingPlan');

      const response = await AuthService.register({
        email,
        password,
        firstName,
        lastName,
      });

      // Ensure new users start with free plan regardless of any previous plan selection
      console.log('New user registered successfully - ensuring free plan assignment');

      // If registration is successful, show success message and redirect to login
      // Note: Most backends don't auto-login after registration for security
      return response;
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    }
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
