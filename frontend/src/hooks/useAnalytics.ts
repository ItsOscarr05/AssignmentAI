import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import AnalyticsService from '../services/AnalyticsService';
import { PerformanceMetrics } from '../utils/performance';

export const useAnalytics = () => {
  const location = useLocation();
  const analytics = useRef(AnalyticsService.getInstance());
  const previousPath = useRef(location.pathname);

  useEffect(() => {
    if (location.pathname !== previousPath.current) {
      analytics.current.trackPageView(location.pathname, document.title);
      previousPath.current = location.pathname;
    }
  }, [location.pathname]);

  const trackEvent = (name: string, properties?: Record<string, any>) => {
    analytics.current.trackEvent(name, properties);
  };

  const trackError = (error: Error, context?: Record<string, any>) => {
    analytics.current.trackError(error, context);
  };

  const trackPerformance = (metrics: PerformanceMetrics) => {
    // Convert frontend metrics to analytics metrics
    analytics.current.trackPerformance({
      averageResponseTime: metrics.apiResponseTime,
      maxResponseTime: metrics.apiResponseTime,
      minResponseTime: metrics.apiResponseTime,
      successRate: 100,
      errorRate: 0,
    });
  };

  return {
    trackEvent,
    trackError,
    trackPerformance,
  };
};
