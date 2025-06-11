import { api } from './api';

export interface UsageEvent {
  feature: string;
  action: string;
  metadata?: Record<string, any>;
}

export interface UsageLimit {
  id: number;
  plan_id: string;
  feature: string;
  limit_type: string;
  limit_value: number;
  metadata: Record<string, any>;
}

export interface UsageSummary {
  [feature: string]: number;
}

export const usageService = {
  trackUsage: async (event: UsageEvent) => {
    const response = await api.post('/usage/track', event);
    return response.data;
  },

  getUsageHistory: async (params?: { feature?: string; startDate?: Date; endDate?: Date }) => {
    const response = await api.get('/usage/history', { params });
    return response.data;
  },

  getUsageSummary: async (params?: {
    feature?: string;
    period?: 'daily' | 'weekly' | 'monthly';
  }) => {
    const response = await api.get<UsageSummary>('/usage/summary', { params });
    return response.data;
  },

  getUsageLimits: async (params?: { feature?: string }) => {
    const response = await api.get<UsageLimit[]>('/usage/limits', { params });
    return response.data;
  },

  // Helper function to check if a feature is available based on usage limits
  isFeatureAvailable: async (feature: string): Promise<boolean> => {
    try {
      const limits = await usageService.getUsageLimits({ feature });
      const summary = await usageService.getUsageSummary({ feature });

      for (const limit of limits) {
        const usage = summary[feature] || 0;
        if (usage >= limit.limit_value) {
          return false;
        }
      }
      return true;
    } catch (error) {
      console.error('Error checking feature availability:', error);
      return false;
    }
  },

  // Helper function to get remaining usage for a feature
  getRemainingUsage: async (feature: string): Promise<number> => {
    try {
      const limits = await usageService.getUsageLimits({ feature });
      const summary = await usageService.getUsageSummary({ feature });

      const usage = summary[feature] || 0;
      const limit = limits.find(l => l.feature === feature);

      if (!limit) {
        return Infinity;
      }

      return Math.max(0, limit.limit_value - usage);
    } catch (error) {
      console.error('Error getting remaining usage:', error);
      return 0;
    }
  },
};
