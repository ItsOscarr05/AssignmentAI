import { api } from './api';

export class SecurityService {
  private static instance: SecurityService;
  private encryptionKey: string | null = null;

  private constructor() {}

  public static getInstance(): SecurityService {
    if (!SecurityService.instance) {
      SecurityService.instance = new SecurityService();
    }
    return SecurityService.instance;
  }

  // Initialize encryption key
  public async initializeEncryption(): Promise<void> {
    try {
      const response = await api.get('/api/security/encryption-key');
      this.encryptionKey = response.data.key;
    } catch (error) {
      console.error('Failed to initialize encryption:', error);
      throw new Error('Failed to initialize encryption');
    }
  }

  // Encrypt sensitive data
  public async encryptData(data: string): Promise<string> {
    if (!this.encryptionKey) {
      await this.initializeEncryption();
    }
    try {
      const response = await api.post('/api/security/encrypt', {
        data,
        key: this.encryptionKey,
      });
      return response.data.encryptedData;
    } catch (error) {
      console.error('Failed to encrypt data:', error);
      throw new Error('Failed to encrypt data');
    }
  }

  // Decrypt sensitive data
  public async decryptData(encryptedData: string): Promise<string> {
    if (!this.encryptionKey) {
      await this.initializeEncryption();
    }
    try {
      const response = await api.post('/api/security/decrypt', {
        encryptedData,
        key: this.encryptionKey,
      });
      return response.data.decryptedData;
    } catch (error) {
      console.error('Failed to decrypt data:', error);
      throw new Error('Failed to decrypt data');
    }
  }

  // Log security events
  public async logSecurityEvent(event: {
    type: string;
    description: string;
    userId?: string;
    metadata?: Record<string, any>;
  }): Promise<void> {
    try {
      await api.post('/api/security/audit-log', event);
    } catch (error) {
      console.error('Failed to log security event:', error);
      // Don't throw error here to prevent disrupting the main flow
    }
  }

  // Get audit logs
  public async getAuditLogs(params: {
    startDate?: string;
    endDate?: string;
    type?: string;
    userId?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    logs: Array<{
      id: string;
      type: string;
      description: string;
      userId?: string;
      metadata?: Record<string, any>;
      timestamp: string;
    }>;
    total: number;
  }> {
    try {
      const response = await api.get('/api/security/audit-logs', { params });
      return response.data;
    } catch (error) {
      console.error('Failed to get audit logs:', error);
      throw new Error('Failed to get audit logs');
    }
  }
}
