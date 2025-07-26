export interface SecurityEvent {
  id: string;
  type: SecurityEventType;
  severity: SecuritySeverity;
  timestamp: number;
  userAgent: string;
  ipAddress?: string;
  userId?: string;
  sessionId?: string;
  details: Record<string, any>;
  metadata?: Record<string, any>;
}

export type SecurityEventType =
  | 'login_attempt'
  | 'login_success'
  | 'login_failure'
  | 'logout'
  | 'password_change'
  | '2fa_setup'
  | '2fa_verification'
  | '2fa_failure'
  | 'session_created'
  | 'session_revoked'
  | 'suspicious_activity'
  | 'rate_limit_exceeded'
  | 'csrf_violation'
  | 'xss_attempt'
  | 'file_upload'
  | 'api_error'
  | 'permission_denied'
  | 'account_locked'
  | 'account_unlocked'
  | 'password_reset'
  | 'email_change'
  | 'profile_update';

export type SecuritySeverity = 'low' | 'medium' | 'high' | 'critical';

export interface SecurityMetrics {
  totalEvents: number;
  eventsByType: Record<SecurityEventType, number>;
  eventsBySeverity: Record<SecuritySeverity, number>;
  recentEvents: SecurityEvent[];
  suspiciousActivities: number;
  failedLogins: number;
  successfulLogins: number;
  averageEventsPerHour: number;
}

export interface SecurityAlert {
  id: string;
  type: SecurityEventType;
  severity: SecuritySeverity;
  message: string;
  timestamp: number;
  acknowledged: boolean;
  acknowledgedAt?: number;
  acknowledgedBy?: string;
}

class SecurityMonitor {
  private static instance: SecurityMonitor;
  private events: SecurityEvent[] = [];
  private alerts: SecurityAlert[] = [];
  private maxEvents = 1000;
  private maxAlerts = 100;
  private isMonitoring = false;
  private monitoringInterval?: NodeJS.Timeout;

  private constructor() {
    this.startMonitoring();
  }

  public static getInstance(): SecurityMonitor {
    if (!SecurityMonitor.instance) {
      SecurityMonitor.instance = new SecurityMonitor();
    }
    return SecurityMonitor.instance;
  }

  /**
   * Log a security event
   */
  public logEvent(
    type: SecurityEventType,
    severity: SecuritySeverity,
    details: Record<string, any>,
    metadata?: Record<string, any>
  ): void {
    const event: SecurityEvent = {
      id: this.generateId(),
      type,
      severity,
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
      details,
      metadata,
    };

    this.events.push(event);
    this.trimEvents();

    // Check for suspicious patterns
    this.analyzeEvent(event);

    // Send to backend if critical
    if (severity === 'critical') {
      this.sendToBackend(event);
    }

    // Store in localStorage for persistence
    this.persistEvent(event);
  }

  /**
   * Log login attempt
   */
  public logLoginAttempt(
    email: string,
    success: boolean,
    failureReason?: string,
    ipAddress?: string
  ): void {
    const type: SecurityEventType = success ? 'login_success' : 'login_failure';
    const severity: SecuritySeverity = success ? 'low' : 'medium';

    this.logEvent(type, severity, {
      email: this.maskEmail(email),
      success,
      failureReason,
      ipAddress,
    });

    // Check for suspicious login patterns
    this.checkLoginPatterns(email, success);
  }

  /**
   * Log 2FA event
   */
  public log2FAEvent(
    type: '2fa_setup' | '2fa_verification' | '2fa_failure',
    success: boolean,
    userId?: string,
    failureReason?: string
  ): void {
    const severity: SecuritySeverity = success ? 'low' : 'medium';

    this.logEvent(type, severity, {
      success,
      failureReason,
      userId,
    });
  }

  /**
   * Log session event
   */
  public logSessionEvent(
    type: 'session_created' | 'session_revoked',
    sessionId: string,
    userId?: string,
    deviceInfo?: any
  ): void {
    this.logEvent(type, 'low', {
      sessionId,
      userId,
      deviceInfo,
    });
  }

  /**
   * Log suspicious activity
   */
  public logSuspiciousActivity(
    activity: string,
    details: Record<string, any>,
    severity: SecuritySeverity = 'high'
  ): void {
    this.logEvent('suspicious_activity', severity, {
      activity,
      ...details,
    });

    // Create alert for suspicious activity
    this.createAlert('suspicious_activity', severity, `Suspicious activity detected: ${activity}`);
  }

  /**
   * Log rate limit exceeded
   */
  public logRateLimitExceeded(endpoint: string, ipAddress?: string, userId?: string): void {
    this.logEvent('rate_limit_exceeded', 'medium', {
      endpoint,
      ipAddress,
      userId,
    });

    this.createAlert('rate_limit_exceeded', 'medium', `Rate limit exceeded for ${endpoint}`);
  }

  /**
   * Log CSRF violation
   */
  public logCSRFViolation(endpoint: string, ipAddress?: string, userId?: string): void {
    this.logEvent('csrf_violation', 'high', {
      endpoint,
      ipAddress,
      userId,
    });

    this.createAlert('csrf_violation', 'high', `CSRF violation detected for ${endpoint}`);
  }

  /**
   * Log XSS attempt
   */
  public logXSSAttempt(input: string, sanitizedInput: string, endpoint?: string): void {
    this.logEvent('xss_attempt', 'high', {
      originalInput: input.substring(0, 100), // Truncate for security
      sanitizedInput: sanitizedInput.substring(0, 100),
      endpoint,
    });

    this.createAlert('xss_attempt', 'high', 'XSS attempt detected');
  }

  /**
   * Log file upload
   */
  public logFileUpload(
    filename: string,
    fileType: string,
    fileSize: number,
    success: boolean,
    failureReason?: string
  ): void {
    const severity: SecuritySeverity = success ? 'low' : 'medium';

    this.logEvent('file_upload', severity, {
      filename,
      fileType,
      fileSize,
      success,
      failureReason,
    });
  }

  /**
   * Get security metrics
   */
  public getMetrics(): SecurityMetrics {
    const now = Date.now();
    const oneHourAgo = now - 60 * 60 * 1000;
    const recentEvents = this.events.filter(event => event.timestamp > oneHourAgo);

    const eventsByType: Record<SecurityEventType, number> = {} as any;
    const eventsBySeverity: Record<SecuritySeverity, number> = {} as any;

    this.events.forEach(event => {
      eventsByType[event.type] = (eventsByType[event.type] || 0) + 1;
      eventsBySeverity[event.severity] = (eventsBySeverity[event.severity] || 0) + 1;
    });

    return {
      totalEvents: this.events.length,
      eventsByType,
      eventsBySeverity,
      recentEvents: recentEvents.slice(-10), // Last 10 events
      suspiciousActivities: eventsByType.suspicious_activity || 0,
      failedLogins: eventsByType.login_failure || 0,
      successfulLogins: eventsByType.login_success || 0,
      averageEventsPerHour: recentEvents.length,
    };
  }

  /**
   * Get recent events
   */
  public getRecentEvents(limit: number = 50): SecurityEvent[] {
    return this.events.slice(-limit).sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * Get events by type
   */
  public getEventsByType(type: SecurityEventType): SecurityEvent[] {
    return this.events
      .filter(event => event.type === type)
      .sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * Get events by severity
   */
  public getEventsBySeverity(severity: SecuritySeverity): SecurityEvent[] {
    return this.events
      .filter(event => event.severity === severity)
      .sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * Get active alerts
   */
  public getActiveAlerts(): SecurityAlert[] {
    return this.alerts
      .filter(alert => !alert.acknowledged)
      .sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * Acknowledge alert
   */
  public acknowledgeAlert(alertId: string, acknowledgedBy?: string): void {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.acknowledged = true;
      alert.acknowledgedAt = Date.now();
      alert.acknowledgedBy = acknowledgedBy;
      this.persistAlerts();
    }
  }

  /**
   * Clear old events
   */
  public clearOldEvents(olderThanDays: number = 30): void {
    const cutoffTime = Date.now() - olderThanDays * 24 * 60 * 60 * 1000;
    this.events = this.events.filter(event => event.timestamp > cutoffTime);
    this.persistEvents();
  }

  /**
   * Export events for analysis
   */
  public exportEvents(): string {
    return JSON.stringify(
      {
        events: this.events,
        metrics: this.getMetrics(),
        exportTime: new Date().toISOString(),
      },
      null,
      2
    );
  }

  /**
   * Start monitoring
   */
  private startMonitoring(): void {
    if (this.isMonitoring) return;

    this.isMonitoring = true;
    this.monitoringInterval = setInterval(() => {
      this.performSecurityChecks();
    }, 60000); // Check every minute
  }

  /**
   * Stop monitoring
   */
  public stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = undefined;
    }
    this.isMonitoring = false;
  }

  /**
   * Perform security checks
   */
  private performSecurityChecks(): void {
    const metrics = this.getMetrics();

    // Check for high event volume
    if (metrics.averageEventsPerHour > 100) {
      this.createAlert('suspicious_activity', 'medium', 'High event volume detected');
    }

    // Check for multiple failed logins
    if (metrics.failedLogins > 10) {
      this.createAlert('login_failure', 'high', 'Multiple failed login attempts detected');
    }

    // Check for suspicious activities
    if (metrics.suspiciousActivities > 5) {
      this.createAlert('suspicious_activity', 'high', 'Multiple suspicious activities detected');
    }
  }

  /**
   * Analyze event for suspicious patterns
   */
  private analyzeEvent(event: SecurityEvent): void {
    // Check for rapid successive events
    const recentEvents = this.events.filter(
      e =>
        e.timestamp > event.timestamp - 60000 && // Last minute
        e.type === event.type
    );

    if (recentEvents.length > 5) {
      this.logSuspiciousActivity(`Rapid ${event.type} events`, {
        count: recentEvents.length,
        timeWindow: '1 minute',
      });
    }

    // Check for unusual user agent patterns
    if (this.isUnusualUserAgent(event.userAgent)) {
      this.logSuspiciousActivity('Unusual user agent detected', { userAgent: event.userAgent });
    }
  }

  /**
   * Check login patterns
   */
  private checkLoginPatterns(email: string, _success: boolean): void {
    const recentLogins = this.events.filter(
      e =>
        e.type === 'login_attempt' &&
        e.timestamp > Date.now() - 15 * 60 * 1000 && // Last 15 minutes
        e.details.email === email
    );

    const failedLogins = recentLogins.filter(e => !e.details.success);

    if (failedLogins.length > 3) {
      this.logSuspiciousActivity('Multiple failed login attempts', {
        email: this.maskEmail(email),
        failedAttempts: failedLogins.length,
      });
    }
  }

  /**
   * Create security alert
   */
  private createAlert(type: SecurityEventType, severity: SecuritySeverity, message: string): void {
    const alert: SecurityAlert = {
      id: this.generateId(),
      type,
      severity,
      message,
      timestamp: Date.now(),
      acknowledged: false,
    };

    this.alerts.push(alert);
    this.trimAlerts();
    this.persistAlerts();

    // Log alert creation
    this.logEvent('suspicious_activity', severity, {
      alertType: type,
      message,
    });
  }

  /**
   * Check if user agent is unusual
   */
  private isUnusualUserAgent(userAgent: string): boolean {
    const unusualPatterns = [
      /bot/i,
      /crawler/i,
      /spider/i,
      /scraper/i,
      /curl/i,
      /wget/i,
      /python/i,
      /java/i,
      /perl/i,
    ];

    return unusualPatterns.some(pattern => pattern.test(userAgent));
  }

  /**
   * Mask email for privacy
   */
  private maskEmail(email: string): string {
    const [local, domain] = email.split('@');
    if (local.length <= 2) return email;

    const maskedLocal =
      local.charAt(0) + '*'.repeat(local.length - 2) + local.charAt(local.length - 1);
    return `${maskedLocal}@${domain}`;
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  /**
   * Trim events to max size
   */
  private trimEvents(): void {
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(-this.maxEvents);
    }
  }

  /**
   * Trim alerts to max size
   */
  private trimAlerts(): void {
    if (this.alerts.length > this.maxAlerts) {
      this.alerts = this.alerts.slice(-this.maxAlerts);
    }
  }

  /**
   * Persist events to localStorage
   */
  private persistEvent(event: SecurityEvent): void {
    try {
      const stored = localStorage.getItem('security_events');
      const events = stored ? JSON.parse(stored) : [];
      events.push(event);

      // Keep only last 100 events in localStorage
      if (events.length > 100) {
        events.splice(0, events.length - 100);
      }

      localStorage.setItem('security_events', JSON.stringify(events));
    } catch (error) {
      console.error('Failed to persist security event:', error);
    }
  }

  /**
   * Persist events to localStorage
   */
  private persistEvents(): void {
    try {
      localStorage.setItem('security_events', JSON.stringify(this.events));
    } catch (error) {
      console.error('Failed to persist security events:', error);
    }
  }

  /**
   * Persist alerts to localStorage
   */
  private persistAlerts(): void {
    try {
      localStorage.setItem('security_alerts', JSON.stringify(this.alerts));
    } catch (error) {
      console.error('Failed to persist security alerts:', error);
    }
  }

  /**
   * Send critical event to backend
   */
  private async sendToBackend(event: SecurityEvent): Promise<void> {
    try {
      // This would typically send to your backend security monitoring endpoint
      console.log('Sending critical security event to backend:', event);

      // Example implementation:
      // await fetch('/api/security/events', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(event)
      // });
    } catch (error) {
      console.error('Failed to send security event to backend:', error);
    }
  }
}

export const securityMonitor = SecurityMonitor.getInstance();
export default SecurityMonitor;
