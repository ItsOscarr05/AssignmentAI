import { api } from './api';

export interface LoginCredentials {
  email: string;
  password: string;
  code?: string;
  remember_me?: boolean;
}

export interface RegisterData {
  email: string;
  password: string;
  confirm_password: string;
}

export interface Token {
  access_token: string;
  token_type: string;
}

export interface Session {
  id: string;
  device: string;
  ip: string;
  last_active: string;
  expires_at: string;
}

class AuthService {
  async login(credentials: LoginCredentials): Promise<Token> {
    const response = await api.post<Token>('/auth/login', credentials);
    if (response.data.access_token) {
      localStorage.setItem('token', response.data.access_token);
      api.defaults.headers.common['Authorization'] = `Bearer ${response.data.access_token}`;
    }
    return response.data;
  }

  async logout(): Promise<void> {
    try {
      await api.post('/auth/logout');
    } finally {
      this.clearAuth();
    }
  }

  async logoutAll(): Promise<void> {
    try {
      await api.post('/auth/logout-all');
    } finally {
      this.clearAuth();
    }
  }

  async getActiveSessions(): Promise<Session[]> {
    const response = await api.get<Session[]>('/auth/sessions');
    return response.data;
  }

  async revokeSession(sessionId: string): Promise<void> {
    await api.delete(`/auth/sessions/${sessionId}`);
  }

  async revokeAllSessions(): Promise<void> {
    await api.post('/auth/logout-all');
  }

  setToken(token: string): void {
    localStorage.setItem('token', token);
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  clearAuth(): void {
    localStorage.removeItem('token');
    delete api.defaults.headers.common['Authorization'];
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  async getOAuthUrl(provider: string): Promise<{ url: string }> {
    const response = await api.get<{ url: string }>(`/auth/oauth/${provider}`);
    return response.data;
  }
}

export const authService = new AuthService();
