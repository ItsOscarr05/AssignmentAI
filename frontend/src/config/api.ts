import axios from 'axios';
import { toast } from 'react-toastify';
import {
  AnalyticsConfig,
  ApiClientConfig,
  CacheConfig,
  WebSocketConfig,
} from '../services/api/types';

// Use environment variable with fallback - standardize to match backend
const API_URL = import.meta.env.VITE_API_URL;

const api = axios.create({
  baseURL: `${API_URL}/api/v1`,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
  timeout: 10000, // 10 second timeout
});

// Add a request interceptor
api.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Add a response interceptor
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response) {
      // Handle specific error cases
      switch (error.response.status) {
        case 401:
          // Clear invalid token
          localStorage.removeItem('token');
          delete api.defaults.headers.common['Authorization'];
          // Only redirect if not already on login page
          if (!window.location.pathname.includes('/login')) {
            window.location.href = '/login';
          }
          break;
        case 403:
          toast.error('You do not have permission to perform this action');
          break;
        case 404:
          toast.error('Resource not found');
          break;
        case 500:
          toast.error('Server error. Please try again later');
          break;
        default:
          toast.error(error.response.data?.message || 'An error occurred');
      }
    } else if (error.request) {
      // The request was made but no response was received
      if (error.code === 'ECONNABORTED') {
        toast.error('Request timeout. Please check your connection and try again.');
      } else {
        toast.error('Unable to connect to the server. Please check your internet connection.');
      }
    } else {
      // Something happened in setting up the request that triggered an Error
      toast.error('An unexpected error occurred');
    }
    return Promise.reject(error);
  }
);

export const auth = {
  login: async (email: string, password: string) => {
    try {
      // OAuth2PasswordRequestForm expects username and password
      const response = await api.post('/auth/login', { 
        username: email, 
        password: password 
      });
      if (response.data.access_token) {
        localStorage.setItem('token', response.data.access_token);
        api.defaults.headers.common['Authorization'] = `Bearer ${response.data.access_token}`;
      }
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  register: async (userData: any) => {
    try {
      const response = await api.post('/auth/register', userData);
      if (response.data.access_token) {
        localStorage.setItem('token', response.data.access_token);
        api.defaults.headers.common['Authorization'] = `Bearer ${response.data.access_token}`;
      }
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  forgotPassword: async (email: string) => {
    try {
      const response = await api.post('/auth/forgot-password', { email });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  resetPassword: async (token: string, password: string) => {
    try {
      const response = await api.post('/auth/reset-password', { token, new_password: password });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getCurrentUser: async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }
      const response = await api.get('/auth/me');
      return response.data;
    } catch (error) {
      console.error('Get current user error:', error);
      throw error;
    }
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      localStorage.removeItem('token');
      delete api.defaults.headers.common['Authorization'];
    }
  },

  setToken: (token: string) => {
    localStorage.setItem('token', token);
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  },
};

export default api;

export const apiConfig: ApiClientConfig = {
  baseURL: `${API_URL}/api/v1`,
  timeout: 30000,
  maxRetries: 3,
  retryDelay: 1000,
  withCredentials: true,
};

export const cacheConfig: CacheConfig = {
  enabled: true,
  ttl: 5 * 60 * 1000, // 5 minutes
  maxSize: 100, // Maximum number of items to cache
};

export const wsConfig: WebSocketConfig = {
  enabled: true,
  reconnectInterval: 5000,
  maxReconnectAttempts: 5,
};

export const analyticsConfig: AnalyticsConfig = {
  enabled: import.meta.env.PROD,
  trackingId: import.meta.env.VITE_GA_TRACKING_ID || '',
  customDimensions: {
    environment: import.meta.env.MODE,
    version: import.meta.env.VITE_APP_VERSION || '1.0.0',
  },
};
