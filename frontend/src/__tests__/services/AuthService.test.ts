vi.mock('../../lib/api', () => ({
  api: {
    post: vi.fn(),
    get: vi.fn(),
    delete: vi.fn(),
    defaults: {
      baseURL: 'http://localhost:8000/api/v1',
    },
  },
}));

import type { AxiosInstance } from 'axios';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LoginRequest, TokenWith2FA, TwoFactorSetup } from '../../types';

let api: AxiosInstance;
let AuthService: any;

beforeEach(async () => {
  vi.resetModules();
  vi.clearAllMocks();
  const apiModule = await import('../../lib/api');
  const authModule = await import('../../services/auth/AuthService');
  api = apiModule.api;
  AuthService = authModule.AuthService;
});

describe('AuthService', () => {
  describe('Login', () => {
    it('should call login endpoint with credentials', async () => {
      const mockResponse: TokenWith2FA = {
        access_token: 'mock-token',
        token_type: 'bearer',
        expires_in: 3600,
        requires_2fa: false,
        user: {
          id: '1',
          email: 'test@example.com',
          name: 'Test User',
          is_verified: true,
          is_active: true,
        },
      };
      (api.post as any).mockResolvedValue({ data: mockResponse });

      const credentials: LoginRequest = {
        email: 'test@example.com',
        password: 'password',
      };

      const result = await AuthService.login(credentials);
      expect(api.post).toHaveBeenCalledWith('/auth/login', credentials);
      expect(result).toEqual(mockResponse);
    });

    it('should handle login with 2FA requirement', async () => {
      const mockResponse: TokenWith2FA = {
        access_token: 'temp-token',
        token_type: 'bearer',
        expires_in: 300,
        requires_2fa: true,
      };
      (api.post as any).mockResolvedValue({ data: mockResponse });

      const credentials: LoginRequest = {
        email: 'test@example.com',
        password: 'password',
      };

      const result = await AuthService.login(credentials);
      expect(result.requires_2fa).toBe(true);
      expect(result.access_token).toBe('temp-token');
    });
  });

  describe('2FA', () => {
    it('should setup 2FA', async () => {
      const mockResponse: TwoFactorSetup = {
        message: '2FA setup initiated',
        qr_code: 'data:image/png;base64,mock-qr-code',
        secret: 'JBSWY3DPEHPK3PXP',
        manual_entry:
          'otpauth://totp/AssignmentAI:test@example.com?secret=JBSWY3DPEHPK3PXP&issuer=AssignmentAI',
      };
      (api.post as any).mockResolvedValue({ data: mockResponse });

      const result = await AuthService.setup2FA();
      expect(api.post).toHaveBeenCalledWith('/auth/2fa/setup');
      expect(result).toEqual(mockResponse);
    });

    it('should verify 2FA setup', async () => {
      const mockResponse = {
        backup_codes: ['ABC12345', 'DEF67890', 'GHI11111', 'JKL22222', 'MNO33333'],
      };
      (api.post as any).mockResolvedValue({ data: mockResponse });

      const result = await AuthService.verify2FASetup('123456');
      expect(api.post).toHaveBeenCalledWith('/auth/2fa/verify', { code: '123456' });
      expect(result).toEqual(mockResponse);
    });

    it('should verify 2FA code', async () => {
      const mockResponse: TokenWith2FA = {
        access_token: 'final-token',
        token_type: 'bearer',
        expires_in: 3600,
        requires_2fa: false,
        refresh_token: 'refresh-token',
      };
      (api.post as any).mockResolvedValue({ data: mockResponse });

      const result = await AuthService.verify2FA('123456', false);
      expect(api.post).toHaveBeenCalledWith('/auth/verify-2fa', {
        code: '123456',
        is_backup_code: false,
      });
      expect(result).toEqual(mockResponse);
    });

    it('should verify backup code', async () => {
      const mockResponse: TokenWith2FA = {
        access_token: 'final-token',
        token_type: 'bearer',
        expires_in: 3600,
        requires_2fa: false,
        refresh_token: 'refresh-token',
      };
      (api.post as any).mockResolvedValue({ data: mockResponse });

      const result = await AuthService.verify2FA('ABC12345', true);
      expect(api.post).toHaveBeenCalledWith('/auth/verify-2fa', {
        code: 'ABC12345',
        is_backup_code: true,
      });
      expect(result).toEqual(mockResponse);
    });

    it('should get 2FA status', async () => {
      const mockResponse = {
        enabled: true,
        has_backup_codes: true,
        backup_codes_remaining: 5,
      };
      (api.get as any).mockResolvedValue({ data: mockResponse });

      const result = await AuthService.get2FAStatus();
      expect(api.get).toHaveBeenCalledWith('/auth/2fa/status');
      expect(result).toEqual(mockResponse);
    });

    it('should disable 2FA', async () => {
      (api.post as any).mockResolvedValue({ data: { message: '2FA disabled' } });

      await AuthService.disable2FA('password');
      expect(api.post).toHaveBeenCalledWith('/auth/2fa/disable', { password: 'password' });
    });

    it('should regenerate backup codes', async () => {
      const mockResponse = {
        backup_codes: ['NEW12345', 'NEW67890', 'NEW11111', 'NEW22222', 'NEW33333'],
      };
      (api.post as any).mockResolvedValue({ data: mockResponse });

      const result = await AuthService.regenerateBackupCodes();
      expect(api.post).toHaveBeenCalledWith('/auth/2fa/regenerate-backup-codes');
      expect(result).toEqual(mockResponse);
    });

    it('should recover 2FA with backup code', async () => {
      const mockResponse: TwoFactorSetup = {
        message: '2FA recovered',
        qr_code: 'data:image/png;base64,new-qr-code',
        secret: 'NEWSECRET123',
        manual_entry:
          'otpauth://totp/AssignmentAI:test@example.com?secret=NEWSECRET123&issuer=AssignmentAI',
      };
      (api.post as any).mockResolvedValue({ data: mockResponse });

      const result = await AuthService.recover2FA('ABC12345');
      expect(api.post).toHaveBeenCalledWith('/auth/2fa/recover', { backup_code: 'ABC12345' });
      expect(result).toEqual(mockResponse);
    });

    it('should recover 2FA without backup code', async () => {
      const mockResponse: TwoFactorSetup = {
        message: 'New 2FA setup initiated',
        qr_code: 'data:image/png;base64,new-qr-code',
        secret: 'NEWSECRET123',
        manual_entry:
          'otpauth://totp/AssignmentAI:test@example.com?secret=NEWSECRET123&issuer=AssignmentAI',
      };
      (api.post as any).mockResolvedValue({ data: mockResponse });

      const result = await AuthService.recover2FA();
      expect(api.post).toHaveBeenCalledWith('/auth/2fa/recover', {});
      expect(result).toEqual(mockResponse);
    });
  });

  describe('Session Management', () => {
    it('should get user sessions', async () => {
      const mockResponse = {
        sessions: [
          {
            id: 'session-1',
            device_info: { browser: 'Chrome', os: 'Windows', ip_address: '192.168.1.1' },
            created_at: '2024-01-01T00:00:00Z',
            last_accessed: '2024-01-01T12:00:00Z',
            expires_at: '2024-01-08T00:00:00Z',
            is_current: true,
          },
        ],
        total_sessions: 1,
        current_session_id: 'session-1',
      };
      (api.get as any).mockResolvedValue({ data: mockResponse });

      const result = await AuthService.getSessions();
      expect(api.get).toHaveBeenCalledWith('/auth/sessions');
      expect(result).toEqual(mockResponse);
    });

    it('should revoke session', async () => {
      (api.delete as any).mockResolvedValue({ data: { message: 'Session revoked' } });

      await AuthService.revokeSession('session-1');
      expect(api.delete).toHaveBeenCalledWith('/auth/sessions/session-1');
    });

    it('should logout all devices', async () => {
      (api.post as any).mockResolvedValue({ data: { message: 'Logged out from all devices' } });

      await AuthService.logoutAll();
      expect(api.post).toHaveBeenCalledWith('/auth/logout-all');
    });

    it('should get session analytics', async () => {
      const mockResponse = {
        user_id: 1,
        total_sessions: 5,
        active_sessions: 2,
        session_analytics: [],
        summary: {
          total_duration: 3600,
          average_session_duration: 1800,
          most_active_device: 'Chrome on Windows',
        },
      };
      (api.get as any).mockResolvedValue({ data: mockResponse });

      const result = await AuthService.getSessionAnalytics();
      expect(api.get).toHaveBeenCalledWith('/auth/sessions/analytics');
      expect(result).toEqual(mockResponse);
    });

    it('should get session status', async () => {
      const mockResponse = {
        user_id: 1,
        session_stats: {
          total_sessions: 5,
          active_sessions: 2,
          expired_sessions: 3,
        },
        analytics_summary: {
          total_duration: 3600,
          average_session_duration: 1800,
          most_active_device: 'Chrome on Windows',
        },
        last_activity: '2024-01-01T12:00:00Z',
      };
      (api.get as any).mockResolvedValue({ data: mockResponse });

      const result = await AuthService.getSessionStatus();
      expect(api.get).toHaveBeenCalledWith('/auth/sessions/status');
      expect(result).toEqual(mockResponse);
    });

    it('should track session activity', async () => {
      (api.post as any).mockResolvedValue({ data: { message: 'Activity tracked' } });

      await AuthService.trackSessionActivity('session-1', 'page_view', { page: '/dashboard' });
      expect(api.post).toHaveBeenCalledWith('/auth/sessions/session-1/activity', {
        activity_type: 'page_view',
        details: { page: '/dashboard' },
      });
    });

    it('should cleanup expired sessions', async () => {
      const mockResponse = { sessions_cleaned: 3 };
      (api.post as any).mockResolvedValue({ data: mockResponse });

      const result = await AuthService.cleanupExpiredSessions();
      expect(api.post).toHaveBeenCalledWith('/auth/sessions/cleanup');
      expect(result).toEqual(mockResponse);
    });
  });

  describe('Registration', () => {
    it('should call register endpoint with user data', async () => {
      const mockResponse = {
        data: {
          user: {
            id: '1',
            email: 'test@example.com',
            fullName: 'Test User',
            role: 'student',
          },
          token: 'mock-token',
        },
      };
      (api.post as any).mockResolvedValue(mockResponse);

      const userData = {
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        password: 'password',
      };

      const result = await AuthService.register(userData);
      expect(api.post).toHaveBeenCalledWith('/auth/register', {
        email: 'test@example.com',
        password: 'password',
        full_name: 'Test User',
      });
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('Logout', () => {
    it('should call logout endpoint', async () => {
      await AuthService.logout();
      expect(api.post).toHaveBeenCalledWith('/auth/logout');
    });
  });

  describe('User Management', () => {
    it('should fetch current user data', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        fullName: 'Test User',
        role: 'student',
      };
      (api.get as any).mockResolvedValue({ data: mockUser });

      const result = await AuthService.getCurrentUser();
      expect(api.get).toHaveBeenCalledWith('/auth/me');
      expect(result).toEqual(mockUser);
    });

    it('should refresh token', async () => {
      const mockResponse = {
        access_token: 'new-token',
        refresh_token: 'new-refresh-token',
        token_type: 'bearer',
        expires_in: 3600,
      };
      (api.post as any).mockResolvedValue({ data: mockResponse });

      const result = await AuthService.refreshToken();
      expect(api.post).toHaveBeenCalledWith('/auth/refresh-token');
      expect(result).toEqual(mockResponse);
    });

    it('should handle forgot password', async () => {
      (api.post as any).mockResolvedValue({ data: { message: 'Password reset email sent' } });

      await AuthService.forgotPassword('test@example.com');
      expect(api.post).toHaveBeenCalledWith('/auth/forgot-password', { email: 'test@example.com' });
    });

    it('should handle reset password', async () => {
      (api.post as any).mockResolvedValue({ data: { message: 'Password reset successfully' } });

      await AuthService.resetPassword('reset-token', 'new-password');
      expect(api.post).toHaveBeenCalledWith('/auth/reset-password', {
        token: 'reset-token',
        new_password: 'new-password',
      });
    });
  });
});
