import { AuthResponse, User } from '../../types';
import { api } from '../api';

export class AuthService {
  static async login(email: string, password: string): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/api/v1/auth/login', { email, password });
    return response.data;
  }

  static async register(userData: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
  }): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/api/v1/auth/register', userData);
    return response.data;
  }

  static async logout(): Promise<void> {
    await api.post('/api/v1/auth/logout');
  }

  static async getCurrentUser(): Promise<User> {
    const response = await api.get<User>('/api/v1/auth/me');
    return response.data;
  }

  static async refreshToken(): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/api/v1/auth/refresh-token');
    return response.data;
  }

  static async forgotPassword(email: string): Promise<void> {
    await api.post('/api/v1/auth/forgot-password', { email });
  }

  static async resetPassword(token: string, password: string): Promise<void> {
    await api.post('/api/v1/auth/reset-password', { token, password });
  }
}
