import { api } from '../lib/api';

export interface UserSession {
  id: string;
  device_info: Record<string, any>;
  created_at: string;
  last_accessed: string | null;
  expires_at: string;
  is_current: boolean;
}

export interface SessionAnalytics {
  total_sessions: number;
  active_sessions: number;
  recent_sessions: number;
  device_types: Record<string, number>;
}

export interface SessionsResponse {
  sessions: UserSession[];
  total_count: number;
}

export interface SessionCountResponse {
  active_sessions: number;
}

class SessionService {
  /**
   * Get all active sessions for the current user
   */
  async getUserSessions(): Promise<SessionsResponse> {
    const response = await api.get('/api/v1/security/sessions');
    return response.data;
  }

  /**
   * Get the count of active sessions for the current user
   */
  async getActiveSessionCount(): Promise<SessionCountResponse> {
    const response = await api.get('/api/v1/security/sessions/count');
    return response.data;
  }

  /**
   * Revoke a specific session
   */
  async revokeSession(sessionId: string): Promise<{ message: string }> {
    const response = await api.delete(`/api/v1/security/sessions/${sessionId}`);
    return response.data;
  }

  /**
   * Revoke all sessions except the current one
   */
  async revokeAllSessions(): Promise<{ message: string }> {
    const response = await api.delete('/api/v1/security/sessions');
    return response.data;
  }

  /**
   * Get session analytics for the current user
   */
  async getSessionAnalytics(): Promise<SessionAnalytics> {
    const response = await api.get('/api/v1/security/sessions/analytics');
    return response.data;
  }

  /**
   * Format session date for display
   */
  formatSessionDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  /**
   * Get device type from session info
   */
  getDeviceType(session: UserSession): string {
    return session.device_info?.type || 'Unknown Device';
  }

  /**
   * Get browser info from session
   */
  getBrowserInfo(session: UserSession): string {
    return session.device_info?.browser || 'Unknown Browser';
  }

  /**
   * Get location info from session
   */
  getLocationInfo(session: UserSession): string {
    return session.device_info?.location || 'Unknown Location';
  }

  /**
   * Check if session is expired
   */
  isSessionExpired(session: UserSession): boolean {
    return new Date(session.expires_at) < new Date();
  }

  /**
   * Check if session is current (most recent)
   */
  isCurrentSession(session: UserSession, allSessions: UserSession[]): boolean {
    if (allSessions.length === 0) return false;

    // Sort by creation date and mark the most recent as current
    const sortedSessions = [...allSessions].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    return session.id === sortedSessions[0].id;
  }
}

export const sessionService = new SessionService();
export default sessionService;
