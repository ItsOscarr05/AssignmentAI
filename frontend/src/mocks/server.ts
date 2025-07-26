import type { DefaultBodyType, PathParams } from 'msw';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';

// Mock data
const mockUsers = [
  {
    id: '1',
    email: 'test@example.com',
    name: 'Test User',
    role: 'student',
    is_verified: true,
    is_active: true,
    two_factor_enabled: false,
  },
  {
    id: '2',
    email: 'test2fa@example.com',
    name: '2FA User',
    role: 'student',
    is_verified: true,
    is_active: true,
    two_factor_enabled: true,
  },
];

const mockSessions = [
  {
    id: 'session-1',
    device_info: {
      browser: 'Chrome',
      os: 'Windows',
      device: 'Desktop',
      ip_address: '192.168.1.1',
    },
    created_at: '2024-01-01T00:00:00Z',
    last_accessed: '2024-01-01T12:00:00Z',
    expires_at: '2024-01-08T00:00:00Z',
    is_current: true,
  },
  {
    id: 'session-2',
    device_info: {
      browser: 'Safari',
      os: 'iOS',
      device: 'Mobile',
      ip_address: '192.168.1.2',
    },
    created_at: '2024-01-02T00:00:00Z',
    last_accessed: '2024-01-02T10:00:00Z',
    expires_at: '2024-01-09T00:00:00Z',
    is_current: false,
  },
];

export const server = setupServer(
  // Authentication endpoints
  http.post<PathParams, DefaultBodyType>('/api/auth/login', async ({ request }) => {
    const body = (await request.json()) as { email: string; password: string };

    const user = mockUsers.find(u => u.email === body.email);

    if (!user || body.password !== 'password123') {
      return HttpResponse.json({ detail: 'Invalid credentials' }, { status: 401 });
    }

    if (user.two_factor_enabled) {
      return HttpResponse.json({
        access_token: 'temp-token',
        token_type: 'bearer',
        expires_in: 300,
        requires_2fa: true,
      });
    }

    return HttpResponse.json({
      access_token: 'mock-token',
      token_type: 'bearer',
      expires_in: 3600,
      requires_2fa: false,
      refresh_token: 'refresh-token',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        is_verified: user.is_verified,
        is_active: user.is_active,
      },
    });
  }),

  http.post<PathParams, DefaultBodyType>('/api/auth/verify-2fa', async ({ request }) => {
    const body = (await request.json()) as { code: string; is_backup_code: boolean };

    if (body.is_backup_code) {
      if (body.code === 'ABC12345') {
        return HttpResponse.json({
          access_token: 'final-token',
          token_type: 'bearer',
          expires_in: 3600,
          requires_2fa: false,
          refresh_token: 'refresh-token',
        });
      }
    } else {
      if (body.code === '123456') {
        return HttpResponse.json({
          access_token: 'final-token',
          token_type: 'bearer',
          expires_in: 3600,
          requires_2fa: false,
          refresh_token: 'refresh-token',
        });
      }
    }

    return HttpResponse.json({ detail: 'Invalid 2FA code' }, { status: 401 });
  }),

  http.post<PathParams, DefaultBodyType>('/api/auth/2fa/setup', async () => {
    return HttpResponse.json({
      message: '2FA setup initiated',
      qr_code: 'data:image/png;base64,mock-qr-code',
      secret: 'JBSWY3DPEHPK3PXP',
      manual_entry:
        'otpauth://totp/AssignmentAI:test@example.com?secret=JBSWY3DPEHPK3PXP&issuer=AssignmentAI',
    });
  }),

  http.post<PathParams, DefaultBodyType>('/api/auth/2fa/verify', async ({ request }) => {
    const body = (await request.json()) as { code: string };

    if (body.code === '123456') {
      return HttpResponse.json({
        backup_codes: ['ABC12345', 'DEF67890', 'GHI11111', 'JKL22222', 'MNO33333'],
      });
    }

    return HttpResponse.json({ detail: 'Invalid verification code' }, { status: 400 });
  }),

  http.get<PathParams, DefaultBodyType>('/api/auth/2fa/status', async () => {
    return HttpResponse.json({
      enabled: true,
      has_backup_codes: true,
      backup_codes_remaining: 5,
    });
  }),

  http.post<PathParams, DefaultBodyType>('/api/auth/2fa/disable', async ({ request }) => {
    const body = (await request.json()) as { password: string };

    if (body.password === 'password123') {
      return HttpResponse.json({ message: '2FA disabled successfully' });
    }

    return HttpResponse.json({ detail: 'Invalid password' }, { status: 400 });
  }),

  http.post<PathParams, DefaultBodyType>('/api/auth/2fa/regenerate-backup-codes', async () => {
    return HttpResponse.json({
      backup_codes: ['NEW12345', 'NEW67890', 'NEW11111', 'NEW22222', 'NEW33333'],
    });
  }),

  http.post<PathParams, DefaultBodyType>('/api/auth/2fa/recover', async ({ request }) => {
    const body = (await request.json()) as { backup_code?: string };

    if (body.backup_code === 'ABC12345') {
      return HttpResponse.json({
        message: '2FA recovered successfully',
        qr_code: 'data:image/png;base64,new-qr-code',
        secret: 'NEWSECRET123',
        manual_entry:
          'otpauth://totp/AssignmentAI:test@example.com?secret=NEWSECRET123&issuer=AssignmentAI',
      });
    }

    return HttpResponse.json({
      message: 'New 2FA setup initiated',
      qr_code: 'data:image/png;base64,new-qr-code',
      secret: 'NEWSECRET123',
      manual_entry:
        'otpauth://totp/AssignmentAI:test@example.com?secret=NEWSECRET123&issuer=AssignmentAI',
    });
  }),

  // Session management endpoints
  http.get<PathParams, DefaultBodyType>('/api/auth/sessions', async () => {
    return HttpResponse.json({
      sessions: mockSessions,
      total_sessions: mockSessions.length,
      current_session_id: 'session-1',
    });
  }),

  http.delete<PathParams, DefaultBodyType>('/api/auth/sessions/:sessionId', async ({ params }) => {
    const sessionId = params.sessionId as string;
    const session = mockSessions.find(s => s.id === sessionId);

    if (!session) {
      return HttpResponse.json({ detail: 'Session not found' }, { status: 404 });
    }

    return HttpResponse.json({ message: 'Session revoked successfully' });
  }),

  http.post<PathParams, DefaultBodyType>('/api/auth/logout-all', async () => {
    return HttpResponse.json({ message: 'Logged out from all devices' });
  }),

  http.get<PathParams, DefaultBodyType>('/api/auth/sessions/analytics', async () => {
    return HttpResponse.json({
      user_id: 1,
      total_sessions: mockSessions.length,
      active_sessions: mockSessions.filter(s => s.is_current).length,
      session_analytics: [],
      summary: {
        total_duration: 7200,
        average_session_duration: 3600,
        most_active_device: 'Chrome on Windows',
      },
    });
  }),

  http.get<PathParams, DefaultBodyType>('/api/auth/sessions/status', async () => {
    return HttpResponse.json({
      user_id: 1,
      session_stats: {
        total_sessions: mockSessions.length,
        active_sessions: mockSessions.filter(s => s.is_current).length,
        expired_sessions: 0,
      },
      analytics_summary: {
        total_duration: 7200,
        average_session_duration: 3600,
        most_active_device: 'Chrome on Windows',
      },
      last_activity: '2024-01-01T12:00:00Z',
    });
  }),

  http.post<PathParams, DefaultBodyType>('/api/auth/sessions/:sessionId/activity', async () => {
    return HttpResponse.json({ message: 'Activity tracked successfully' });
  }),

  http.post<PathParams, DefaultBodyType>('/api/auth/sessions/cleanup', async () => {
    return HttpResponse.json({ sessions_cleaned: 3 });
  }),

  // User management endpoints
  http.get<PathParams, DefaultBodyType>('/api/auth/me', async () => {
    return HttpResponse.json({
      id: '1',
      email: 'test@example.com',
      name: 'Test User',
      role: 'student',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    });
  }),

  http.post<PathParams, DefaultBodyType>('/api/auth/logout', async () => {
    return HttpResponse.json({ message: 'Logged out successfully' });
  }),

  http.post<PathParams, DefaultBodyType>('/api/auth/refresh-token', async () => {
    return HttpResponse.json({
      access_token: 'new-token',
      refresh_token: 'new-refresh-token',
      token_type: 'bearer',
      expires_in: 3600,
    });
  }),

  http.post<PathParams, DefaultBodyType>('/api/auth/forgot-password', async ({ request }) => {
    const body = (await request.json()) as { email: string };

    if (mockUsers.find(u => u.email === body.email)) {
      return HttpResponse.json({ message: 'Password reset email sent' });
    }

    return HttpResponse.json({ detail: 'User not found' }, { status: 404 });
  }),

  http.post<PathParams, DefaultBodyType>('/api/auth/reset-password', async ({ request }) => {
    const body = (await request.json()) as { token: string; new_password: string };

    if (body.token === 'valid-token') {
      return HttpResponse.json({ message: 'Password reset successfully' });
    }

    return HttpResponse.json({ detail: 'Invalid or expired token' }, { status: 400 });
  }),

  // Assignment endpoints
  http.get<PathParams, DefaultBodyType>('/api/assignments', async () => {
    return HttpResponse.json([
      {
        id: '1',
        title: 'Test Assignment',
        description: 'Test Description',
        dueDate: '2024-03-01',
        status: 'pending',
      },
    ]);
  }),

  // Analytics endpoints
  http.get<PathParams, DefaultBodyType>('/api/analytics/performance', async () => {
    return HttpResponse.json({
      overallScore: 85,
      completionRate: 90,
      subjectPerformance: [
        { subject: 'Math', score: 90 },
        { subject: 'Science', score: 85 },
      ],
      weeklyProgress: [
        { week: 'Week 1', progress: 80 },
        { week: 'Week 2', progress: 85 },
      ],
    });
  }),

  // Settings endpoints
  http.get<PathParams, DefaultBodyType>('/api/settings', async () => {
    return HttpResponse.json({
      notifications: {
        email: true,
        push: true,
        assignments: true,
        grades: true,
      },
      appearance: {
        theme: 'light',
        fontSize: 'medium',
        density: 'comfortable',
      },
      language: {
        language: 'en',
        timezone: 'UTC',
      },
      privacy: {
        profileVisibility: 'public',
        activityStatus: true,
      },
    });
  })
);
