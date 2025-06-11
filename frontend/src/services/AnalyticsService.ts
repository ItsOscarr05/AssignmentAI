import { create } from 'zustand';

export interface UsageMetrics {
  totalTokens: number;
  monthlyTokens: number;
  dailyTokens: number;
  averageTokensPerRequest: number;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
}

export interface AnalyticsPerformanceMetrics {
  averageResponseTime: number;
  maxResponseTime: number;
  minResponseTime: number;
  successRate: number;
  errorRate: number;
}

export interface UserActivity {
  userId: string;
  lastActive: string;
  totalSessions: number;
  averageSessionDuration: number;
  favoriteModel: string;
  mostUsedTemplate: string;
  totalGenerations: number;
}

export interface AnalyticsState {
  usageMetrics: UsageMetrics;
  performanceMetrics: AnalyticsPerformanceMetrics;
  userActivity: UserActivity;
  isLoading: boolean;
  error: string | null;
  fetchAnalytics: () => Promise<void>;
  resetAnalytics: () => void;
}

const initialState: AnalyticsState = {
  usageMetrics: {
    totalTokens: 0,
    monthlyTokens: 0,
    dailyTokens: 0,
    averageTokensPerRequest: 0,
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
  },
  performanceMetrics: {
    averageResponseTime: 0,
    maxResponseTime: 0,
    minResponseTime: 0,
    successRate: 0,
    errorRate: 0,
  },
  userActivity: {
    userId: '',
    lastActive: '',
    totalSessions: 0,
    averageSessionDuration: 0,
    favoriteModel: '',
    mostUsedTemplate: '',
    totalGenerations: 0,
  },
  isLoading: false,
  error: null,
  fetchAnalytics: async () => {},
  resetAnalytics: () => {},
};

export const useAnalyticsStore = create<AnalyticsState>(set => ({
  ...initialState,
  fetchAnalytics: async () => {
    set({ isLoading: true, error: null });
    try {
      // TODO: Replace with actual API call
      const mockData = {
        usageMetrics: {
          totalTokens: 15000,
          monthlyTokens: 5000,
          dailyTokens: 200,
          averageTokensPerRequest: 150,
          totalRequests: 100,
          successfulRequests: 95,
          failedRequests: 5,
        },
        performanceMetrics: {
          averageResponseTime: 2.5,
          maxResponseTime: 5.0,
          minResponseTime: 1.0,
          successRate: 95,
          errorRate: 5,
        },
        userActivity: {
          userId: 'user123',
          lastActive: new Date().toISOString(),
          totalSessions: 25,
          averageSessionDuration: 30,
          favoriteModel: 'gpt-4',
          mostUsedTemplate: 'analysis',
          totalGenerations: 150,
        },
      };
      set({
        usageMetrics: mockData.usageMetrics,
        performanceMetrics: mockData.performanceMetrics,
        userActivity: mockData.userActivity,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      set({
        usageMetrics: initialState.usageMetrics,
        performanceMetrics: initialState.performanceMetrics,
        userActivity: initialState.userActivity,
        error: 'Failed to fetch analytics data',
        isLoading: false,
      });
      throw error; // Re-throw the error to be caught by the caller
    }
  },
  resetAnalytics: () => set(initialState),
}));

// Custom hook for using the analytics service
export const useAnalytics = () => {
  const {
    usageMetrics,
    performanceMetrics,
    userActivity,
    isLoading,
    error,
    fetchAnalytics,
    resetAnalytics,
  } = useAnalyticsStore();

  const calculateTokenCost = (tokens: number, costPerToken: number) => {
    return (tokens * costPerToken).toFixed(4);
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes} minutes`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  };

  return {
    usageMetrics,
    performanceMetrics,
    userActivity,
    isLoading,
    error,
    fetchAnalytics,
    resetAnalytics,
    calculateTokenCost,
    formatDuration,
  };
};

interface AnalyticsEvent {
  name: string;
  properties?: Record<string, any>;
  timestamp: number;
}

interface PageView {
  path: string;
  title: string;
  timestamp: number;
  duration: number;
}

class AnalyticsService {
  private static instance: AnalyticsService;
  private events: AnalyticsEvent[] = [];
  private pageViews: PageView[] = [];
  private currentPageStartTime: number = 0;

  private constructor() {
    this.initialize();
  }

  public static getInstance(): AnalyticsService {
    if (!AnalyticsService.instance) {
      AnalyticsService.instance = new AnalyticsService();
    }
    return AnalyticsService.instance;
  }

  private initialize() {
    // Initialize any third-party analytics services here
    this.currentPageStartTime = Date.now();
  }

  public trackEvent(name: string, properties?: Record<string, any>) {
    const event: AnalyticsEvent = {
      name,
      properties,
      timestamp: Date.now(),
    };
    this.events.push(event);
    this.sendEvent(event);
  }

  public trackPageView(path: string, title: string) {
    const now = Date.now();
    const duration = now - this.currentPageStartTime;

    const pageView: PageView = {
      path,
      title,
      timestamp: now,
      duration,
    };

    this.pageViews.push(pageView);
    this.currentPageStartTime = now;
    this.sendPageView(pageView);
  }

  public trackError(error: Error, context?: Record<string, any>) {
    console.error('Error tracked:', error, context);
  }

  public trackPerformance(metrics: {
    averageResponseTime: number;
    maxResponseTime: number;
    minResponseTime: number;
    successRate: number;
    errorRate: number;
  }) {
    console.log('Performance metrics tracked:', metrics);
  }

  private sendEvent(event: AnalyticsEvent) {
    // TODO: Implement actual analytics service integration
    console.log('Analytics Event:', event);
  }

  private sendPageView(pageView: PageView) {
    // TODO: Implement actual analytics service integration
    console.log('Page View:', pageView);
  }

  public getEvents(): AnalyticsEvent[] {
    return [...this.events];
  }

  public getPageViews(): PageView[] {
    return [...this.pageViews];
  }

  public clearEvents() {
    this.events = [];
  }

  public clearPageViews() {
    this.pageViews = [];
  }
}

export default AnalyticsService;
