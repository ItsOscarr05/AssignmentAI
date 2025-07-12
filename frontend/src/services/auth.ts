import { REFRESH_TOKEN_KEY } from '../config/constants';
import { api } from '../lib/api';
import { Session, Token, User } from '../types';

export interface RegisterData {
  email: string;
  password: string;
  confirm_password: string;
}

class AuthService {
  private static instance: AuthService;
  private token: string | null = null;
  private refreshTokenTimeout: NodeJS.Timeout | null = null;

  private constructor() {
    this.token = localStorage.getItem('token');
  }

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  async login(provider: string): Promise<void> {
    const response = await api.get(`/auth/${provider}/login`);
    window.location.href = response.data.url;
  }

  async handleCallback(code: string, state: string): Promise<User> {
    const response = await api.post('/auth/callback', { code, state });
    this.token = response.data.token;
    if (this.token) {
      localStorage.setItem('token', this.token);
    }
    return response.data.user;
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
    if (!token) {
      this.clearAuth();
      return;
    }
    localStorage.setItem('token', token);
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  clearAuth(): void {
    localStorage.removeItem('token');
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    delete api.defaults.headers.common['Authorization'];
    this.stopRefreshTokenTimer();
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  private startRefreshTokenTimer(expiresIn: number): void {
    // Refresh token 1 minute before it expires
    const refreshTime = (expiresIn - 60) * 1000;
    this.refreshTokenTimeout = setTimeout(() => {
      this.refreshToken();
    }, refreshTime);
  }

  private stopRefreshTokenTimer(): void {
    if (this.refreshTokenTimeout) {
      clearTimeout(this.refreshTokenTimeout);
      this.refreshTokenTimeout = null;
    }
  }

  public async refreshToken(): Promise<void> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      this.clearAuth();
      return;
    }

    try {
      const response = await api.post<Token>('/auth/refresh-token', {
        refresh_token: refreshToken,
      });

      const { access_token, refresh_token, expires_in } = response.data;
      if (access_token && refresh_token) {
        this.setToken(access_token);
        localStorage.setItem(REFRESH_TOKEN_KEY, refresh_token);
        this.startRefreshTokenTimer(expires_in);
      } else {
        this.clearAuth();
      }
    } catch (error) {
      this.clearAuth();
      throw error;
    }
  }

  async getOAuthUrl(provider: string): Promise<{ url: string }> {
    const response = await api.get<{ url: string }>(`/auth/oauth/${provider}`);
    return response.data;
  }

  async handleOAuthCallback(provider: string, code: string, state: string): Promise<Token> {
    const response = await api.post<Token>(`/auth/oauth/${provider}/callback`, {
      code,
      state,
    });

    if (response.data.access_token) {
      this.setToken(response.data.access_token);
      if (response.data.refresh_token) {
        localStorage.setItem(REFRESH_TOKEN_KEY, response.data.refresh_token);
        this.startRefreshTokenTimer(response.data.expires_in);
      }
    }

    return response.data;
  }

  async register(data: { email: string; password: string; firstName: string; lastName: string }) {
    const name = `${data.firstName} ${data.lastName}`.trim();
    return api.post('/api/v1/auth/register', {
      email: data.email,
      password: data.password,
      name: name,
    });
  }
}

export { AuthService };
