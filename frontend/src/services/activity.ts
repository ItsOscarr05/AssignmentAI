import { api } from '../lib/api';
import { Activity, ActivityFilter } from '../types';

class ActivityService {
  async getActivities(filter: ActivityFilter, skip = 0, limit = 100): Promise<Activity[]> {
    const response = await api.get<Activity[]>('/activities', {
      params: { ...filter, skip, limit },
    });
    return response.data;
  }

  async getActivityStats(startDate?: string, endDate?: string): Promise<any> {
    const response = await api.get('/activities/stats', {
      params: { start_date: startDate, end_date: endDate },
    });
    return response.data;
  }

  async getUserActivities(userId: string, skip = 0, limit = 100): Promise<Activity[]> {
    const response = await api.get<Activity[]>(`/activities/user/${userId}`, {
      params: { skip, limit },
    });
    return response.data;
  }

  async cleanupOldActivities(days: number): Promise<void> {
    await api.delete('/activities/cleanup', {
      params: { days },
    });
  }
}

export const activityService = new ActivityService();
