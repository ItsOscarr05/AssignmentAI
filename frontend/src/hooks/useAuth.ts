import { useEffect, useState } from 'react';
import { auth } from '../services/api';
import { User } from '../types';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  logout: () => void;
  register: (email: string, password: string, fullName: string) => Promise<void>;
}

export const useAuth = () => {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    logout: () => {
      localStorage.removeItem('token');
      setState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        logout: state.logout,
        register: state.register,
      });
    },
    register: async (email: string, password: string, fullName: string) => {
      try {
        const [firstName, ...lastNameParts] = fullName.split(' ');
        const lastName = lastNameParts.join(' ');
        const response = await auth.register({
          firstName,
          lastName,
          email,
          password,
        });
        localStorage.setItem('token', response.token);
        setState(prev => ({
          ...prev,
          user: response.user,
          isAuthenticated: true,
          isLoading: false,
        }));
      } catch (error) {
        console.error('Registration failed:', error);
        throw error;
      }
    },
  });

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          const user = await auth.getCurrentUser();
          setState(prev => ({
            ...prev,
            user,
            isAuthenticated: true,
            isLoading: false,
          }));
        } else {
          setState(prev => ({
            ...prev,
            user: null,
            isAuthenticated: false,
            isLoading: false,
          }));
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        setState(prev => ({
          ...prev,
          user: null,
          isAuthenticated: false,
          isLoading: false,
        }));
      }
    };

    checkAuth();
  }, []);

  return state;
};
