import { api } from '../../lib/api';
import { AuthResponse, LoginRequest, TokenWith2FA, TwoFactorSetup, User } from '../../types';

export class AuthService {
  static async login(credentials: LoginRequest): Promise<TokenWith2FA> {
    const response = await api.post<TokenWith2FA>('/auth/login', credentials);
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

  static async logoutAll(): Promise<void> {
    await api.post('/auth/logout-all');
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

  // 2FA Methods
  static async setup2FA(): Promise<TwoFactorSetup> {
    const response = await api.post<TwoFactorSetup>('/auth/2fa/setup');
    return response.data;
  }

  static async verify2FASetup(code: string): Promise<{ backup_codes: string[] }> {
    const response = await api.post('/auth/2fa/verify', { code });
    return response.data;
  }

  static async verify2FA(code: string, isBackupCode: boolean = false): Promise<TokenWith2FA> {
    const response = await api.post<TokenWith2FA>('/auth/verify-2fa', {
      code,
      is_backup_code: isBackupCode,
    });
    return response.data;
  }

  static async get2FAStatus(): Promise<{
    enabled: boolean;
    has_backup_codes: boolean;
    backup_codes_remaining: number;
  }> {
    const response = await api.get('/auth/2fa/status');
    return response.data;
  }

  static async disable2FA(password: string): Promise<void> {
    await api.post('/auth/2fa/disable', { password });
  }

  static async regenerateBackupCodes(): Promise<{ backup_codes: string[] }> {
    const response = await api.post('/auth/2fa/regenerate-backup-codes');
    return response.data;
  }

  static async recover2FA(backupCode?: string): Promise<TwoFactorSetup | { message: string }> {
    const response = await api.post(
      '/auth/2fa/recover',
      backupCode ? { backup_code: backupCode } : {}
    );
    return response.data;
  }

  // Session Management Methods
  static async getSessions(): Promise<{
    sessions: Array<{
      id: string;
      device_info: any;
      created_at: string;
      last_accessed: string;
      expires_at: string;
      is_current: boolean;
    }>;
    total_sessions: number;
    current_session_id: string;
  }> {
    const response = await api.get('/auth/sessions');
    return response.data;
  }

  static async revokeSession(sessionId: string): Promise<void> {
    await api.delete(`/auth/sessions/${sessionId}`);
  }

  static async getSessionAnalytics(): Promise<{
    user_id: number;
    total_sessions: number;
    active_sessions: number;
    session_analytics: any[];
    summary: {
      total_duration: number;
      average_session_duration: number;
      most_active_device: string;
    };
  }> {
    const response = await api.get('/auth/sessions/analytics');
    return response.data;
  }

  static async getSessionStatus(): Promise<{
    user_id: number;
    session_stats: {
      total_sessions: number;
      active_sessions: number;
      expired_sessions: number;
    };
    analytics_summary: {
      total_duration: number;
      average_session_duration: number;
      most_active_device: string;
    };
    last_activity: string;
  }> {
    const response = await api.get('/auth/sessions/status');
    return response.data;
  }

  static async trackSessionActivity(
    sessionId: string,
    activityType: string,
    details?: any
  ): Promise<void> {
    await api.post(`/auth/sessions/${sessionId}/activity`, {
      activity_type: activityType,
      details,
    });
  }

  static async cleanupExpiredSessions(): Promise<{ sessions_cleaned: number }> {
    const response = await api.post('/auth/sessions/cleanup');
    return response.data;
  }
}
