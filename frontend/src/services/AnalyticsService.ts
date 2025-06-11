import { create } from 'zustand';
import { api } from './api';

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

export interface AnalyticsEvent {
  name: string;
  category: string;
  action: string;
  label?: string;
  value?: number;
  properties?: Record<string, any>;
  timestamp?: number;
}

export interface AnalyticsConfig {
  enabled: boolean;
  debug: boolean;
  sampleRate: number;
  endpoint: string;
  batchSize: number;
  flushInterval: number;
}

export class AnalyticsService {
  private static instance: AnalyticsService;
  private queue: AnalyticsEvent[] = [];
  private config: AnalyticsConfig = {
    enabled: true,
    debug: false,
    sampleRate: 1.0,
    endpoint: '/api/v1/analytics',
    batchSize: 10,
    flushInterval: 5000,
  };
  private flushTimer: NodeJS.Timeout | null = null;
  private isProcessing = false;

  private constructor() {
    this.initialize();
  }

  public static getInstance(): AnalyticsService {
    if (!AnalyticsService.instance) {
      AnalyticsService.instance = new AnalyticsService();
    }
    return AnalyticsService.instance;
  }

  private initialize(): void {
    if (typeof window !== 'undefined') {
      // Start periodic flush
      this.startPeriodicFlush();

      // Track page views
      this.trackPageView();

      // Add event listeners for automatic tracking
      this.setupAutomaticTracking();
    }
  }

  public configure(config: Partial<AnalyticsConfig>): void {
    this.config = { ...this.config, ...config };
  }

  public trackEvent(event: AnalyticsEvent): void {
    if (!this.config.enabled) return;

    // Add timestamp if not provided
    if (!event.timestamp) {
      event.timestamp = Date.now();
    }

    this.queue.push(event);

    // Flush if queue reaches batch size
    if (this.queue.length >= this.config.batchSize) {
      this.flush();
    }
  }

  public trackPageView(path?: string): void {
    const currentPath = path || window.location.pathname;
    this.trackEvent({
      name: 'page_view',
      category: 'Page',
      action: 'View',
      label: currentPath,
      properties: {
        path: currentPath,
        referrer: document.referrer,
        title: document.title,
      },
    });
  }

  public trackError(error: Error, context?: Record<string, any>): void {
    this.trackEvent({
      name: 'error',
      category: 'Error',
      action: 'Occurred',
      label: error.message,
      properties: {
        stack: error.stack,
        ...context,
      },
    });
  }

  public trackUserAction(action: string, properties?: Record<string, any>): void {
    this.trackEvent({
      name: 'user_action',
      category: 'User',
      action,
      properties,
    });
  }

  public trackPerformance(metric: string, value: number): void {
    this.trackEvent({
      name: 'performance',
      category: 'Performance',
      action: 'Measure',
      label: metric,
      value,
    });
  }

  private setupAutomaticTracking(): void {
    // Track clicks on important elements
    document.addEventListener('click', event => {
      const target = event.target as HTMLElement;
      if (target.matches('button, a, [role="button"]')) {
        this.trackUserAction('click', {
          element: target.tagName.toLowerCase(),
          text: target.textContent?.trim(),
          id: target.id,
          className: target.className,
        });
      }
    });

    // Track form submissions
    document.addEventListener('submit', event => {
      const form = event.target as HTMLFormElement;
      this.trackUserAction('form_submit', {
        formId: form.id,
        formAction: form.action,
      });
    });

    // Track performance metrics
    if ('performance' in window) {
      window.addEventListener('load', () => {
        const timing = performance.timing;
        this.trackPerformance('load_time', timing.loadEventEnd - timing.navigationStart);
        this.trackPerformance(
          'dom_ready',
          timing.domContentLoadedEventEnd - timing.navigationStart
        );
      });
    }
  }

  private startPeriodicFlush(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    this.flushTimer = setInterval(() => this.flush(), this.config.flushInterval);
  }

  private async flush(): Promise<void> {
    if (this.isProcessing || this.queue.length === 0) return;

    this.isProcessing = true;
    const events = [...this.queue];
    this.queue = [];

    try {
      await api.post(this.config.endpoint, { events });
      if (this.config.debug) {
        console.log('Analytics events flushed:', events);
      }
    } catch (error) {
      console.error('Failed to flush analytics events:', error);
      // Put events back in queue
      this.queue = [...events, ...this.queue];
    } finally {
      this.isProcessing = false;
    }
  }

  public async flushEvents(): Promise<void> {
    await this.flush();
  }

  public clearQueue(): void {
    this.queue = [];
  }

  public getQueueSize(): number {
    return this.queue.length;
  }

  public isEnabled(): boolean {
    return this.config.enabled;
  }

  public enable(): void {
    this.config.enabled = true;
  }

  public disable(): void {
    this.config.enabled = false;
    this.clearQueue();
  }
}

export default AnalyticsService;
