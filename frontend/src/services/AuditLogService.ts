import { api } from './api';

export interface AuditLogEvent {
  id: string;
  type: string;
  description: string;
  userId?: string;
  metadata?: Record<string, any>;
  timestamp: string;
  ipAddress?: string;
  userAgent?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export class AuditLogService {
  private static instance: AuditLogService;

  private constructor() {}

  public static getInstance(): AuditLogService {
    if (!AuditLogService.instance) {
      AuditLogService.instance = new AuditLogService();
    }
    return AuditLogService.instance;
  }

  // Log an audit event
  public async logEvent(event: Omit<AuditLogEvent, 'id' | 'timestamp'>): Promise<void> {
    try {
      await api.post('/api/audit-logs', event);
    } catch (error) {
      console.error('Failed to log audit event:', error);
      // Don't throw error here to prevent disrupting the main flow
    }
  }

  // Get audit logs with filtering and pagination
  public async getAuditLogs(params: {
    startDate?: string;
    endDate?: string;
    type?: string;
    userId?: string;
    severity?: 'low' | 'medium' | 'high' | 'critical';
    page?: number;
    limit?: number;
  }): Promise<{
    logs: AuditLogEvent[];
    total: number;
  }> {
    try {
      const response = await api.get('/api/audit-logs', { params });
      return response.data;
    } catch (error) {
      console.error('Failed to get audit logs:', error);
      throw new Error('Failed to get audit logs');
    }
  }

  // Get audit log statistics
  public async getAuditLogStats(params: { startDate?: string; endDate?: string }): Promise<{
    totalEvents: number;
    eventsByType: Record<string, number>;
    eventsBySeverity: Record<string, number>;
    eventsByUser: Record<string, number>;
  }> {
    try {
      const response = await api.get('/api/audit-logs/stats', { params });
      return response.data;
    } catch (error) {
      console.error('Failed to get audit log statistics:', error);
      throw new Error('Failed to get audit log statistics');
    }
  }

  // Export audit logs
  public async exportAuditLogs(params: {
    startDate?: string;
    endDate?: string;
    type?: string;
    userId?: string;
    severity?: 'low' | 'medium' | 'high' | 'critical';
    format: 'csv' | 'json';
  }): Promise<Blob> {
    try {
      const response = await api.get('/api/audit-logs/export', {
        params,
        responseType: 'blob',
      });
      return response.data;
    } catch (error) {
      console.error('Failed to export audit logs:', error);
      throw new Error('Failed to export audit logs');
    }
  }

  // Delete old audit logs
  public async deleteOldAuditLogs(params: { beforeDate: string }): Promise<void> {
    try {
      await api.delete('/api/audit-logs', { params });
    } catch (error) {
      console.error('Failed to delete old audit logs:', error);
      throw new Error('Failed to delete old audit logs');
    }
  }
}
