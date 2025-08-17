import { api } from '../lib/api';

export interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatarUrl?: string;
  bio?: string;
  preferences: {
    theme: 'light' | 'dark';
    language: string;
  };
}

export interface DashboardStats {
  totalAssignments: number;
  completedAssignments: number;
  pendingAssignments: number;
  totalFiles: number;
  storageUsed: number;
  storageLimit: number;
  monthlyUsage: number;
  monthlyLimit: number;
}

export interface UsageAnalytics {
  period: string;
  start_date: string;
  end_date: string;
  total_assignments: number;
  daily_stats: Array<{
    date: string;
    assignments: number;
    completed: number;
    pending: number;
  }>;
}

export class UserService {
  static async getCurrentUser(): Promise<{
    id: string;
    email: string;
    full_name: string;
    role: string;
    is_active: boolean;
    is_verified: boolean;
    created_at: string;
  }> {
    const response = await api.get('/users/me');
    return response.data;
  }

  static async getUserProfile(): Promise<UserProfile> {
    const response = await api.get('/users/profile');
    return response.data;
  }

  static async getDashboardStats(): Promise<DashboardStats> {
    const response = await api.get('/dashboard/stats');
    return response.data;
  }

  static async getUsageAnalytics(period: string = 'month'): Promise<UsageAnalytics> {
    const response = await api.get(`/dashboard/usage/analytics?period=${period}`);
    return response.data;
  }

  static async getSessionAnalytics(): Promise<any> {
    const response = await api.get('/auth/sessions/analytics');
    return response.data;
  }
}

export default UserService;
