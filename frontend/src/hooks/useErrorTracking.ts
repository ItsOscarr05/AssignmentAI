import { useEffect, useCallback, useRef } from 'react';
import { usePerformanceMonitoring } from '../utils/performance';

interface ErrorEvent {
  name: string;
  message: string;
  stack?: string;
  context?: string;
  metadata?: Record<string, any>;
  timestamp: number;
  userId?: string;
  sessionId?: string;
}

interface ErrorTrackingOptions {
  userId?: string;
  sessionId?: string;
  onError?: (error: ErrorEvent) => void;
  maxErrorsPerSession?: number;
  errorSamplingRate?: number;
  ignorePatterns?: RegExp[];
}

export const useErrorTracking = (options: ErrorTrackingOptions = {}) => {
  const {
    userId,
    sessionId,
    onError,
    maxErrorsPerSession = 100,
    errorSamplingRate = 1,
    ignorePatterns = [],
  } = options;

  const errorCount = useRef(0);
  const lastError = useRef<ErrorEvent | null>(null);

  // Performance monitoring
  usePerformanceMonitoring('ErrorTracking');

  // Check if error should be ignored
  const shouldIgnoreError = useCallback((error: Error) => {
    return ignorePatterns.some(pattern => pattern.test(error.message));
  }, [ignorePatterns]);

  // Check if error should be sampled
  const shouldSampleError = useCallback(() => {
    return Math.random() < errorSamplingRate;
  }, [errorSamplingRate]);

  // Format error event
  const formatErrorEvent = useCallback((
    error: Error,
    context?: string,
    metadata?: Record<string, any>
  ): ErrorEvent => {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
      context,
      metadata: {
        ...metadata,
        url: window.location.href,
        userAgent: navigator.userAgent,
        timestamp: Date.now(),
      },
      timestamp: Date.now(),
      userId,
      sessionId,
    };
  }, [userId, sessionId]);

  // Track error
  const trackError = useCallback((
    error: Error,
    context?: string,
    metadata?: Record<string, any>
  ) => {
    if (shouldIgnoreError(error)) {
      return;
    }

    if (!shouldSampleError()) {
      return;
    }

    if (errorCount.current >= maxErrorsPerSession) {
      return;
    }

    const errorEvent = formatErrorEvent(error, context, metadata);
    lastError.current = errorEvent;
    errorCount.current++;

    // Send error to error tracking service
    fetch('/api/error-tracking', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(errorEvent),
    }).catch(console.error);

    // Call custom error handler
    onError?.(errorEvent);
  }, [
    shouldIgnoreError,
    shouldSampleError,
    maxErrorsPerSession,
    formatErrorEvent,
    onError,
  ]);

  // Track unhandled promise rejections
  useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const error = event.reason instanceof Error ? event.reason : new Error(String(event.reason));
      trackError(error, 'Unhandled Promise Rejection');
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    return () => window.removeEventListener('unhandledrejection', handleUnhandledRejection);
  }, [trackError]);

  // Track global errors
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      trackError(event.error, 'Global Error');
    };

    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, [trackError]);

  // Track React errors
  const trackReactError = useCallback((
    error: Error,
    componentStack: string,
    componentName?: string
  ) => {
    trackError(error, 'React Error', {
      componentStack,
      componentName,
    });
  }, [trackError]);

  // Track API errors
  const trackApiError = useCallback((
    error: Error,
    endpoint: string,
    method: string,
    status?: number,
    response?: any
  ) => {
    trackError(error, 'API Error', {
      endpoint,
      method,
      status,
      response,
    });
  }, [trackError]);

  // Track validation errors
  const trackValidationError = useCallback((
    error: Error,
    field: string,
    value: any,
    validation: string
  ) => {
    trackError(error, 'Validation Error', {
      field,
      value,
      validation,
    });
  }, [trackError]);

  // Get error statistics
  const getErrorStats = useCallback(() => {
    return {
      totalErrors: errorCount.current,
      lastError: lastError.current,
      hasReachedMaxErrors: errorCount.current >= maxErrorsPerSession,
    };
  }, [maxErrorsPerSession]);

  // Reset error count
  const resetErrorCount = useCallback(() => {
    errorCount.current = 0;
    lastError.current = null;
  }, []);

  return {
    trackError,
    trackReactError,
    trackApiError,
    trackValidationError,
    getErrorStats,
    resetErrorCount,
  };
};

// Example usage:
/*
const MyComponent: React.FC = () => {
  const {
    trackError,
    trackReactError,
    trackApiError,
    trackValidationError,
    getErrorStats,
  } = useErrorTracking({
    userId: 'user123',
    sessionId: 'session456',
    maxErrorsPerSession: 50,
    errorSamplingRate: 0.5,
    ignorePatterns: [
      /ResizeObserver loop limit exceeded/,
      /ResizeObserver loop completed with undelivered notifications/,
    ],
    onError: (error) => {
      // Custom error handling
      console.error('Error tracked:', error);
    },
  });

  // Error boundary
  useEffect(() => {
    const handleError = (error: Error, componentStack: string) => {
      trackReactError(error, componentStack, 'MyComponent');
    };

    // Set up error boundary
    return () => {
      // Cleanup
    };
  }, [trackReactError]);

  const handleSubmit = async (data: any) => {
    try {
      // Validate data
      if (!data.title) {
        throw new Error('Title is required');
      }
      trackValidationError(
        new Error('Title is required'),
        'title',
        data.title,
        'required'
      );
      return;
    } catch (error) {
      trackError(error as Error, 'Form Submission');
    }

    try {
      const response = await fetch('/api/submit', {
        method: 'POST',
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
    } catch (error) {
      trackApiError(
        error as Error,
        '/api/submit',
        'POST',
        response?.status,
        response?.data
      );
    }
  };

  return (
    <div>
      {/* Component content */}
      {getErrorStats().totalErrors > 0 && (
        <div>
          {getErrorStats().totalErrors} errors occurred in this session
        </div>
      )}
    </div>
  );
};
*/ 