import { Box, CircularProgress } from '@mui/material';
import React, { Suspense, lazy, useEffect, useState } from 'react';
import { performanceConfig } from '../../config/performance';

interface LazyLoadProps {
  component: () => Promise<{ default: React.ComponentType<any> }>;
  fallback?: React.ReactNode;
  timeout?: number;
  onError?: (error: Error) => void;
  onLoad?: () => void;
}

const defaultFallback = (
  <Box
    sx={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: 200,
    }}
  >
    <CircularProgress />
  </Box>
);

const LazyLoad: React.FC<LazyLoadProps> = ({
  component,
  fallback = defaultFallback,
  timeout = performanceConfig.lazyLoading.defaultTimeout,
  onError,
  onLoad,
}) => {
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setTimedOut(true);
    }, timeout);

    return () => clearTimeout(timer);
  }, [timeout]);

  const LazyComponent = lazy(async () => {
    try {
      const module = await component();
      setIsLoading(false);
      onLoad?.();
      return module;
    } catch (err) {
      const error = err as Error;
      setError(error);
      setIsLoading(false);
      onError?.(error);
      throw error;
    }
  });

  if (error) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: 200,
          color: 'error.main',
        }}
      >
        {performanceConfig.lazyLoading.fallback.error}
      </Box>
    );
  }

  if (timedOut && isLoading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: 200,
        }}
      >
        {performanceConfig.lazyLoading.fallback.loading}
      </Box>
    );
  }

  return (
    <Suspense fallback={fallback}>
      <LazyComponent />
    </Suspense>
  );
};

export default LazyLoad;
