import { api } from '../../lib/api';
import { AuthResponse, User } from '../../types';

export class AuthService {
  static async login(email: string, password: string): Promise<AuthResponse> {
    // OAuth2PasswordRequestForm expects username and password
    const response = await api.post<AuthResponse>('/auth/login', {
      username: email,
      password: password,
    });
    return response.data;
  }

  static async register(userData: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
  }): Promise<AuthResponse> {
    console.log('AuthService.register called with:', userData);
    console.log('API base URL:', api.defaults.baseURL);
    console.log('Full URL will be:', `${api.defaults.baseURL}/auth/register`);

    const response = await api.post<AuthResponse>('/auth/register', {
      email: userData.email,
      password: userData.password,
      full_name: `${userData.firstName} ${userData.lastName}`.trim(),
    });
    return response.data;
  }

  static async logout(): Promise<void> {
    await api.post('/auth/logout');
  }

  static async getCurrentUser(): Promise<User> {
    const response = await api.get<User>('/auth/me');
    return response.data;
  }

  static async refreshToken(): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/refresh-token');
    return response.data;
  }

  static async forgotPassword(email: string): Promise<void> {
    await api.post('/auth/forgot-password', { email });
  }

  static async resetPassword(token: string, password: string): Promise<void> {
    await api.post('/auth/reset-password', { token, new_password: password });
  }
}
