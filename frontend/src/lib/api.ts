import axios from 'axios';
import { AuthManager } from '../services/authManager';

// Get API URL with fallback
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const baseURL = `${API_URL}/api/v1`;

console.log('API Configuration:', {
  VITE_API_URL: import.meta.env.VITE_API_URL,
  API_URL,
  baseURL,
});

export const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor for authentication
api.interceptors.request.use(
  config => {
    const fullUrl = `${config.baseURL}${config.url}`;
    console.log('API Request:', {
      method: config.method?.toUpperCase(),
      url: config.url,
      baseURL: config.baseURL,
      fullUrl,
    });
    
    const authService = AuthManager.getInstance();
    const token = authService.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
api.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;

    // Log error details for debugging
    if (error.response) {
      console.log('API Error Response:', {
        status: error.response.status,
        statusText: error.response.statusText,
        url: error.config?.url,
        baseURL: error.config?.baseURL,
        fullUrl: `${error.config?.baseURL}${error.config?.url}`,
        data: error.response.data,
      });
    } else if (error.request) {
      console.log('API Error - No Response:', {
        message: error.message,
        url: error.config?.url,
        baseURL: error.config?.baseURL,
      });
    } else {
      console.log('API Error - Request Setup Failed:', error.message);
    }

    // If the error is 401 and we haven't tried to refresh the token yet
    // Skip refresh attempt for login endpoint to avoid infinite loop
    if (
      error.response?.status === 401 && 
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/login')
    ) {
      originalRequest._retry = true;

      try {
        const authService = AuthManager.getInstance();
        // Try to refresh the token
        await authService.refreshToken();

        // Retry the original request with the new token
        const token = authService.getToken();
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return api(originalRequest);
      } catch (refreshError) {
        // If refresh fails, clear auth and redirect to login
        const authService = AuthManager.getInstance();
        authService.clearAuth();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);
