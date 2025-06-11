import { AnalyticsConfig } from './types';

interface AnalyticsEvent {
  eventName: string;
  properties?: Record<string, any>;
  timestamp?: number;
}

export class AnalyticsService {
  private config: AnalyticsConfig;
  private isInitialized = false;
  private events: AnalyticsEvent[] = [];

  constructor(config: AnalyticsConfig) {
    this.config = config;
  }

  initialize(): void {
    if (!this.config.enabled || this.isInitialized) return;

    // Defer analytics setup
    setTimeout(() => {
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('config', this.config.trackingId, {
          send_page_view: true,
          ...this.config.customDimensions,
        });
      }
      this.isInitialized = true;
    }, 0);
  }

  trackEvent(eventName: string, properties?: Record<string, any>): void {
    if (!this.config.enabled) return;

    const event: AnalyticsEvent = {
      eventName,
      properties,
      timestamp: Date.now(),
    };

    this.events.push(event);

    // Defer sending to analytics provider
    setTimeout(() => {
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', eventName, {
          ...properties,
          ...this.config.customDimensions,
        });
      }
      // Clean up old events
      this.cleanupEvents();
    }, 0);
  }

  trackPageView(path: string, title: string): void {
    if (!this.config.enabled) return;

    this.trackEvent('page_view', {
      path,
      title,
    });
  }

  trackError(error: Error, context?: Record<string, any>): void {
    if (!this.config.enabled) return;

    this.trackEvent('error', {
      name: error.name,
      message: error.message,
      stack: error.stack,
      ...context,
    });
  }

  trackPerformance(metric: string, value: number, properties?: Record<string, any>): void {
    if (!this.config.enabled) return;

    this.trackEvent('performance', {
      metric,
      value,
      ...properties,
    });
  }

  trackUserAction(action: string, properties?: Record<string, any>): void {
    if (!this.config.enabled) return;

    this.trackEvent('user_action', {
      action,
      ...properties,
    });
  }

  private cleanupEvents(): void {
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours

    this.events = this.events.filter(event => now - (event.timestamp || 0) < maxAge);
  }

  getEvents(): AnalyticsEvent[] {
    return [...this.events];
  }

  clearEvents(): void {
    this.events = [];
  }
}
