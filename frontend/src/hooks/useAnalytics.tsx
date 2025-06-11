import { useCallback, useEffect, useRef } from 'react';
import { usePerformanceMonitoring } from '../utils/performance';

interface AnalyticsEvent {
  category: string;
  action: string;
  label?: string;
  value?: number;
  properties?: Record<string, any>;
}

interface AnalyticsOptions {
  userId?: string;
  sessionId?: string;
  debug?: boolean;
  onEvent?: (event: AnalyticsEvent) => void;
}

interface PageView {
  path: string;
  title: string;
  referrer?: string;
  timestamp: number;
}

export const useAnalytics = (options: AnalyticsOptions = {}) => {
  const { userId, sessionId = generateSessionId(), debug = false, onEvent } = options;

  const pageViews = useRef<PageView[]>([]);
  const lastPageView = useRef<PageView | null>(null);

  // Performance monitoring
  usePerformanceMonitoring('Analytics');

  // Generate a unique session ID
  function generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Track page view
  const trackPageView = useCallback((path: string, title: string) => {
    const pageView: PageView = {
      path,
      title,
      referrer: lastPageView.current?.path,
      timestamp: Date.now(),
    };

    pageViews.current.push(pageView);
    lastPageView.current = pageView;

    const event: AnalyticsEvent = {
      category: 'Page View',
      action: 'View',
      label: path,
      properties: {
        title,
        referrer: pageView.referrer,
        timestamp: pageView.timestamp,
      },
    };

    logEvent(event);
  }, []);

  // Track user event
  const trackEvent = useCallback(
    (
      category: string,
      action: string,
      label?: string,
      value?: number,
      properties?: Record<string, any>
    ) => {
      const event: AnalyticsEvent = {
        category,
        action,
        label,
        value,
        properties: {
          ...properties,
          userId,
          sessionId,
          timestamp: Date.now(),
        },
      };

      logEvent(event);
    },
    [userId, sessionId]
  );

  // Track error
  const trackError = useCallback(
    (error: Error, context?: string, properties?: Record<string, any>) => {
      const event: AnalyticsEvent = {
        category: 'Error',
        action: error.name,
        label: error.message,
        properties: {
          ...properties,
          context,
          stack: error.stack,
          userId,
          sessionId,
          timestamp: Date.now(),
        },
      };

      logEvent(event);
    },
    [userId, sessionId]
  );

  // Track performance metric
  const trackPerformance = useCallback(
    (metric: string, value: number, properties?: Record<string, any>) => {
      const event: AnalyticsEvent = {
        category: 'Performance',
        action: metric,
        value,
        properties: {
          ...properties,
          userId,
          sessionId,
          timestamp: Date.now(),
        },
      };

      logEvent(event);
    },
    [userId, sessionId]
  );

  // Log event to analytics service
  const logEvent = useCallback(
    (event: AnalyticsEvent) => {
      if (debug) {
        console.log('Analytics Event:', event);
      }

      // Defer sending event to analytics service
      setTimeout(() => {
        fetch('/api/analytics', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(event),
        }).catch(error => {
          console.error('Failed to send analytics event:', error);
        });
      }, 0);

      // Call custom event handler if provided
      onEvent?.(event);
    },
    [debug, onEvent]
  );

  // Track initial page view
  useEffect(() => {
    trackPageView(window.location.pathname, document.title);
  }, [trackPageView]);

  // Track route changes
  useEffect(() => {
    const handleRouteChange = () => {
      trackPageView(window.location.pathname, document.title);
    };

    window.addEventListener('popstate', handleRouteChange);
    return () => window.removeEventListener('popstate', handleRouteChange);
  }, [trackPageView]);

  // Track user engagement
  useEffect(() => {
    let lastActivity = Date.now();
    const inactivityThreshold = 5 * 60 * 1000; // 5 minutes

    const handleActivity = () => {
      const now = Date.now();
      const timeSinceLastActivity = now - lastActivity;

      if (timeSinceLastActivity >= inactivityThreshold) {
        trackEvent('User Engagement', 'Resume', undefined, undefined, {
          inactiveTime: timeSinceLastActivity,
        });
      }

      lastActivity = now;
    };

    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('click', handleActivity);
    window.addEventListener('scroll', handleActivity);

    return () => {
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('click', handleActivity);
      window.removeEventListener('scroll', handleActivity);
    };
  }, [trackEvent]);

  return {
    trackPageView,
    trackEvent,
    trackError,
    trackPerformance,
    sessionId,
  };
};

// Example usage:
/*
const MyComponent = () => {
  const {
    trackPageView,
    trackEvent,
    trackError,
    trackPerformance,
  } = useAnalytics({
    userId: 'user123',
    debug: true,
    onEvent: (event) => {
      // Custom event handling
      console.log('Custom event handler:', event);
    },
  });

  const handleSubmit = async (data: any) => {
    try {
      trackEvent('Form', 'Submit', 'Assignment Form');
      // Handle form submission
      await submitData(data);
      trackEvent('Form', 'Success', 'Assignment Form');
    } catch (error) {
      trackError(error as Error, 'Form Submission');
    }
  };

  useEffect(() => {
    // Track component mount performance
    const startTime = performance.now();
    return () => {
      const mountTime = performance.now() - startTime;
      trackPerformance('ComponentMount', mountTime, {
        component: 'MyComponent',
      });
    };
  }, [trackPerformance]);
};
*/
