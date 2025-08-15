import { useCallback, useEffect, useState } from 'react';
import { usePerformanceMonitoring } from '../utils/performance';

interface ServiceWorkerState {
  registration: ServiceWorkerRegistration | null;
  waiting: ServiceWorker | null;
  active: ServiceWorker | null;
  error: Error | null;
}

interface ServiceWorkerActions {
  register: () => Promise<ServiceWorkerRegistration>;
  unregister: () => Promise<void>;
  clearCache: () => Promise<void>;
  updateCache: (urls: string[]) => Promise<void>;
}

interface ServiceWorkerOptions {
  scope?: string;
  updateInterval?: number;
  onUpdate?: (registration: ServiceWorkerRegistration) => void;
  onSuccess?: (registration: ServiceWorkerRegistration) => void;
  onError?: (error: Error) => void;
}

export const useServiceWorker = (
  swUrl: string,
  options: ServiceWorkerOptions = {}
): ServiceWorkerState & ServiceWorkerActions => {
  const {
    scope = '/',
    updateInterval = 1000 * 60 * 60, // 1 hour
    onUpdate,
    onSuccess,
    onError,
  } = options;

  const [state, setState] = useState<ServiceWorkerState>({
    registration: null,
    waiting: null,
    active: null,
    error: null,
  });

  // Performance monitoring
  usePerformanceMonitoring('ServiceWorker');

  const register = useCallback(async () => {
    try {
      if (!('serviceWorker' in navigator)) {
        throw new Error('Service Worker is not supported in this browser');
      }

      const registration = await navigator.serviceWorker.register(swUrl, {
        scope,
      });

      setState(prev => ({
        ...prev,
        registration,
        waiting: registration.waiting,
        active: registration.active,
      }));

      onSuccess?.(registration);

      // Check for updates periodically
      setInterval(() => {
        registration.update();
      }, updateInterval);

      return registration;
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to register service worker');
      setState(prev => ({ ...prev, error: err }));
      onError?.(err);
      throw err;
    }
  }, [swUrl, scope, updateInterval, onSuccess, onError]);

  const unregister = useCallback(async () => {
    try {
      const registration = state.registration;
      if (registration) {
        await registration.unregister();
        setState({
          registration: null,
          waiting: null,
          active: null,
          error: null,
        });
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to unregister service worker');
      setState(prev => ({ ...prev, error: err }));
      onError?.(err);
      throw err;
    }
  }, [state.registration, onError]);

  const clearCache = useCallback(async () => {
    try {
      const registration = state.registration;
      if (registration) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(cacheName => caches.delete(cacheName)));
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to clear cache');
      setState(prev => ({ ...prev, error: err }));
      onError?.(err);
      throw err;
    }
  }, [state.registration, onError]);

  const updateCache = useCallback(
    async (urls: string[]) => {
      try {
        const registration = state.registration;
        if (registration) {
          const cache = await caches.open('app-cache');
          await cache.addAll(urls);
        }
      } catch (error) {
        const err = error instanceof Error ? error : new Error('Failed to update cache');
        setState(prev => ({ ...prev, error: err }));
        onError?.(err);
        throw err;
      }
    },
    [state.registration, onError]
  );

  useEffect(() => {
    let mounted = true;

    const handleUpdate = (registration: ServiceWorkerRegistration) => {
      if (!mounted) return;
      setState(prev => ({
        ...prev,
        waiting: registration.waiting,
        active: registration.active,
      }));
      onUpdate?.(registration);
    };

    const handleControllerChange = (registration: ServiceWorkerRegistration) => {
      if (!mounted) return;
      setState(prev => ({
        ...prev,
        active: registration.active,
      }));
    };

    register().then(registration => {
      if (!mounted) return;

      registration.addEventListener('updatefound', () => handleUpdate(registration));
      navigator.serviceWorker.addEventListener('controllerchange', () =>
        handleControllerChange(registration)
      );
    });

    return () => {
      mounted = false;
      unregister();
    };
  }, [register, unregister, onUpdate]);

  return {
    ...state,
    register,
    unregister,
    clearCache,
    updateCache,
  };
};

// Example usage:
/*
const App = () => {
  const {
    registration,
    waiting,
    active,
    error,
    updateCache,
  } = useServiceWorker('/sw.js', {
    scope: '/',
    updateInterval: 1000 * 60 * 60, // 1 hour
    onUpdate: (registration) => {
      console.log('New service worker available');
      // Show update alert to user
    },
    onSuccess: (registration) => {
      console.log('Service worker registered successfully');
      // Pre-cache important assets
      updateCache([
        '/index.html',
        '/styles.css',
        '/app.js',
        '/offline.html',
      ]);
    },
    onError: (error) => {
      console.error('Service worker error:', error);
      // Show error alert to user
    },
  });

  const handleUpdate = () => {
    if (waiting) {
      waiting.postMessage({ type: 'SKIP_WAITING' });
    }
  };

  return {
    waiting,
    error,
    handleUpdate,
  };
};
*/
