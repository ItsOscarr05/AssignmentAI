import { api } from '../lib/api';
import { Notification, NotificationFilter } from '../types';

class NotificationService {
  async getNotifications(
    filter: NotificationFilter,
    skip = 0,
    limit = 100
  ): Promise<Notification[]> {
    const response = await api.get<Notification[]>('/notifications', {
      params: { ...filter, skip, limit },
    });
    return response.data;
  }

  async getUnreadCount(): Promise<number> {
    const response = await api.get<{ count: number }>('/notifications/unread/count');
    return response.data.count;
  }

  async getNotification(id: string): Promise<Notification> {
    const response = await api.get<Notification>(`/notifications/${id}`);
    return response.data;
  }

  async createNotification(
    notification: Omit<Notification, 'id' | 'created_at' | 'read_at'>
  ): Promise<Notification> {
    const response = await api.post<Notification>('/notifications', notification);
    return response.data;
  }

  async updateNotification(id: string, notification: Partial<Notification>): Promise<Notification> {
    const response = await api.patch<Notification>(`/notifications/${id}`, notification);
    return response.data;
  }

  async deleteNotification(id: string): Promise<void> {
    await api.delete(`/notifications/${id}`);
  }

  async markAllAsRead(): Promise<void> {
    await api.post('/notifications/mark-all-read');
  }

  async archiveReadNotifications(): Promise<void> {
    await api.post('/notifications/archive-read');
  }

  async cleanupNotifications(days: number): Promise<void> {
    await api.delete('/notifications/cleanup', {
      params: { days },
    });
  }
}

export const notificationService = new NotificationService();
