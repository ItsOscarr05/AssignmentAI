import { api } from '../lib/api';

export interface UserSecurityInfo {
  password_strength: string;
  last_password_change: string | null;
  last_security_audit: string | null;
  failed_login_attempts: number;
  active_sessions: number;
  security_score: number;
  is_verified: boolean;
  two_factor_enabled: boolean;
  account_locked_until: string | null;
}

class SecurityService {
  /**
   * Get current user's security information
   */
  async getUserSecurityInfo(): Promise<UserSecurityInfo> {
    const response = await api.get('/security/user-info');
    return response.data;
  }

  /**
   * Update password strength (for when user changes password)
   */
  async updatePasswordStrength(password: string): Promise<{ strength: string; score: number }> {
    // This would call a backend endpoint to validate password strength
    // For now, return a simple calculation
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChars = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    const isLongEnough = password.length >= 8;

    let score = 0;
    if (isLongEnough) score += 20;
    if (hasUpperCase) score += 20;
    if (hasLowerCase) score += 20;
    if (hasNumbers) score += 20;
    if (hasSpecialChars) score += 20;

    let strength = 'weak';
    if (score >= 80) strength = 'strong';
    else if (score >= 60) strength = 'medium';

    return { strength, score };
  }

  /**
   * Record a security audit event
   */
  async recordSecurityAudit(): Promise<{ message: string; audit_id: number; timestamp: string }> {
    const response = await api.post('/security/audit');
    return response.data;
  }
}

export const securityService = new SecurityService();
export default securityService;
