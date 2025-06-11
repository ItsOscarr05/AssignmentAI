import React, { createContext, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { User } from '../types';

// Mock user for development
const MOCK_USER: User = {
  id: '1',
  email: 'dev@example.com',
  fullName: 'Development User',
  role: 'teacher',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  isVerified: true,
};

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, fullName: string) => Promise<void>;
  logout: () => void;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (token: string, newPassword: string) => Promise<void>;
  verifyEmail: (token: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export { AuthContext };

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Rate limiting state
  const [loginAttempts, setLoginAttempts] = useState<{
    [key: string]: { count: number; timestamp: number };
  }>({});
  const MAX_ATTEMPTS = 5;
  const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes in milliseconds

  useEffect(() => {
    // In development, automatically set the mock user
    if (import.meta.env.DEV) {
      setUser(MOCK_USER);
      localStorage.setItem('user', JSON.stringify(MOCK_USER));
    } else {
      // Check for stored user data on mount in production
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    }
    setLoading(false);
  }, []);

  const checkRateLimit = (email: string): boolean => {
    const now = Date.now();
    const attempt = loginAttempts[email];

    if (attempt) {
      if (now - attempt.timestamp < LOCKOUT_DURATION) {
        if (attempt.count >= MAX_ATTEMPTS) {
          throw new Error(
            `Too many attempts. Please try again in ${Math.ceil(
              (LOCKOUT_DURATION - (now - attempt.timestamp)) / 60000
            )} minutes.`
          );
        }
      } else {
        // Reset attempts if lockout duration has passed
        setLoginAttempts(prev => ({ ...prev, [email]: { count: 0, timestamp: now } }));
      }
    }

    return true;
  };

  const updateLoginAttempts = (email: string, success: boolean) => {
    const now = Date.now();
    setLoginAttempts(prev => ({
      ...prev,
      [email]: {
        count: success ? 0 : (prev[email]?.count || 0) + 1,
        timestamp: now,
      },
    }));
  };

  const login = async (email: string, password: string) => {
    try {
      checkRateLimit(email);

      if (import.meta.env.DEV) {
        // In development, use mock user
        setUser(MOCK_USER);
        localStorage.setItem('user', JSON.stringify(MOCK_USER));
        updateLoginAttempts(email, true);
        navigate('/dashboard');
        return;
      }

      // TODO: Implement actual API call
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        throw new Error('Invalid email or password');
      }

      const userData = await response.json();
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
      updateLoginAttempts(email, true);
      navigate('/dashboard');
    } catch (error) {
      updateLoginAttempts(email, false);
      throw error;
    }
  };

  const register = async (email: string, password: string, fullName: string) => {
    try {
      // TODO: Implement actual API call
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, fullName }),
      });

      if (!response.ok) {
        throw new Error('Registration failed');
      }

      toast.success('Registration successful! Please check your email to verify your account.');
      navigate('/login');
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    navigate('/login');
  };

  const resetPassword = async (email: string) => {
    try {
      const response = await fetch('/api/v1/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        throw new Error('Failed to send reset email');
      }
    } catch (error) {
      throw error;
    }
  };

  const updatePassword = async (token: string, newPassword: string) => {
    try {
      const response = await fetch('/api/v1/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, new_password: newPassword }),
      });

      if (!response.ok) {
        throw new Error('Failed to update password');
      }

      toast.success('Password updated successfully!');
      navigate('/login');
    } catch (error) {
      throw error;
    }
  };

  const verifyEmail = async (token: string) => {
    try {
      // TODO: Implement actual API call
      const response = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });

      if (!response.ok) {
        throw new Error('Failed to verify email');
      }

      toast.success('Email verified successfully!');
      navigate('/login');
    } catch (error) {
      throw error;
    }
  };

  const value = {
    user,
    loading,
    isLoading: loading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    resetPassword,
    updatePassword,
    verifyEmail,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
