import { api } from '../utils/api';

export interface AdminStats {
  total_users: number;
  total_teachers: number;
  total_students: number;
  total_assignments: number;
  total_submissions: number;
  recent_activity: any[];
}

export const getAdminStats = async (): Promise<AdminStats> => {
  const response = await api.get('/api/v1/admin/stats');
  return response.data;
};
