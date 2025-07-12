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
      analytics.current.trackPageView(location.pathname);
      previousPath.current = location.pathname;
    }
  }, [location.pathname]);

  const trackEvent = (name: string, properties?: Record<string, any>) => {
    analytics.current.trackEvent({
      name,
      category: 'User',
      action: 'Custom',
      properties,
    });
  };

  const trackError = (error: Error, context?: Record<string, any>) => {
    analytics.current.trackError(error, context);
  };

  const trackPerformance = (metrics: PerformanceMetrics) => {
    // Track individual performance metrics
    analytics.current.trackPerformance('average_response_time', metrics.apiResponseTime);
    analytics.current.trackPerformance('page_load_time', metrics.pageLoadTime);
    analytics.current.trackPerformance('component_render_time', metrics.componentRenderTime);
    analytics.current.trackPerformance('memory_usage', metrics.memoryUsage);
    analytics.current.trackPerformance('fps', metrics.fps);
  };

  return {
    trackEvent,
    trackError,
    trackPerformance,
  };
};
