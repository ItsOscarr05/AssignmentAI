import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './useAuth';

interface ErrorEvent {
  message: string;
  filename?: string;
  lineno?: number;
  colno?: number;
  error?: Error;
}

interface ErrorContext {
  componentName: string;
  timestamp: string;
  userInfo?: {
    id: string;
    email: string;
    role: string;
  };
  route?: string;
  error: ErrorEvent;
}

interface ErrorTrackingOptions {
  enabled?: boolean;
  maxErrors?: number;
  errorThreshold?: number;
  onError?: (error: ErrorContext) => void;
}

const DEFAULT_OPTIONS: ErrorTrackingOptions = {
  enabled: true,
  maxErrors: 100,
  errorThreshold: 5,
};

export const useErrorTracking = (options: ErrorTrackingOptions = {}) => {
  const { enabled, maxErrors, errorThreshold, onError } = { ...DEFAULT_OPTIONS, ...options };
  const [errors, setErrors] = useState<ErrorContext[]>([]);
  const [isOverThreshold, setIsOverThreshold] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const trackError = useCallback(
    (error: ErrorEvent, componentName: string) => {
      if (!enabled) return;

      const errorContext: ErrorContext = {
        componentName,
        timestamp: new Date().toISOString(),
        userInfo: user
          ? {
              id: user.id,
              email: user.email,
              role: user.role,
            }
          : undefined,
        route: window.location.pathname,
        error,
      };

      setErrors(prev => {
        const newErrors = [...prev, errorContext].slice(-maxErrors!);
        const recentErrors = newErrors.filter(
          e => Date.now() - new Date(e.timestamp).getTime() < 5 * 60 * 1000
        );

        if (recentErrors.length >= errorThreshold!) {
          setIsOverThreshold(true);
          console.error(
            `Too many errors detected (${recentErrors.length} in the last 5 minutes). Please check the console for details.`
          );
        }

        return newErrors;
      });

      if (onError) {
        onError(errorContext);
      }
    },
    [enabled, maxErrors, errorThreshold, user, onError]
  );

  const handleWindowError = useCallback(
    (event: ErrorEvent) => {
      trackError(event, 'window');
    },
    [trackError]
  );

  const handleUnhandledRejection = useCallback(
    (event: PromiseRejectionEvent) => {
      trackError(
        {
          message: event.reason?.message || 'Unhandled promise rejection',
          error: event.reason,
        },
        'unhandledRejection'
      );
    },
    [trackError]
  );

  useEffect(() => {
    if (!enabled) return;

    const errorHandler = (event: ErrorEvent) => handleWindowError(event);
    window.addEventListener('error', errorHandler as unknown as EventListener);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', errorHandler as unknown as EventListener);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, [enabled, handleWindowError, handleUnhandledRejection]);

  useEffect(() => {
    if (isOverThreshold) {
      // Redirect to error page or show error modal
      navigate('/error', { state: { errors } });
    }
  }, [isOverThreshold, errors, navigate]);

  return {
    errors,
    trackError,
    isOverThreshold,
  };
};

// Example usage:
/*
const MyComponent = () => {
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
      /ResizeObserver loop completed with undelivered alerts/,
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
  };

  const handleApiCall = async () => {
    try {
      const response = await fetch('/api/data');
      if (!response.ok) {
        throw new Error(`API call failed with status ${response.status}`);
      }
    } catch (error) {
      trackApiError(
        error as Error,
        '/api/data',
        'GET',
        (error as any).status,
        (error as any).response
      );
    }
  };

  return {
    errorStats: getErrorStats(),
    handleSubmit,
    handleApiCall,
  };
};
*/
