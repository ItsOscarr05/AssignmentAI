import { useCallback, useEffect, useMemo, useRef } from 'react';

export interface PerformanceMetrics {
  pageLoadTime: number;
  componentRenderTime: number;
  apiResponseTime: number;
  memoryUsage: number;
  fps: number;
  // Analytics metrics
  averageResponseTime: number;
  maxResponseTime: number;
  minResponseTime: number;
  successRate: number;
  errorRate: number;
}

interface PerformanceObserver {
  onMetricsUpdate: (metrics: PerformanceMetrics) => void;
}

class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private observers: PerformanceObserver[] = [];
  private metrics: PerformanceMetrics = {
    pageLoadTime: 0,
    componentRenderTime: 0,
    apiResponseTime: 0,
    memoryUsage: 0,
    fps: 0,
    averageResponseTime: 0,
    maxResponseTime: 0,
    minResponseTime: 0,
    successRate: 0,
    errorRate: 0,
  };

  private constructor() {
    this.initializePerformanceObserver();
    this.startFPSMonitoring();
  }

  public static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  public subscribe(observer: PerformanceObserver): () => void {
    this.observers.push(observer);
    return () => {
      this.observers = this.observers.filter(obs => obs !== observer);
    };
  }

  private notifyObservers(): void {
    this.observers.forEach(observer => observer.onMetricsUpdate(this.metrics));
  }

  private initializePerformanceObserver(): void {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver(list => {
        const entries = list.getEntries();
        const navigationEntry = entries.find(
          (entry): entry is PerformanceNavigationTiming => entry.entryType === 'navigation'
        );

        if (navigationEntry) {
          this.metrics.pageLoadTime = performance.now() - navigationEntry.startTime;
          this.notifyObservers();
        }
      });

      observer.observe({ entryTypes: ['navigation'] });
    }
  }

  private startFPSMonitoring(): void {
    let frames = 0;
    let lastFPSUpdate = performance.now();

    const updateFPS = () => {
      const currentTime = performance.now();
      frames++;

      if (currentTime - lastFPSUpdate >= 1000) {
        this.metrics.fps = Math.round((frames * 1000) / (currentTime - lastFPSUpdate));
        frames = 0;
        lastFPSUpdate = currentTime;
        this.notifyObservers();
      }

      requestAnimationFrame(updateFPS);
    };

    requestAnimationFrame(updateFPS);
  }

  public measureComponentRender(_componentName: string, renderTime: number): void {
    this.metrics.componentRenderTime = renderTime;
    this.notifyObservers();
  }

  public measureApiResponse(_endpoint: string, responseTime: number): void {
    this.metrics.apiResponseTime = responseTime;
    this.notifyObservers();
  }

  public async measureMemoryUsage(): Promise<void> {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      this.metrics.memoryUsage = memory.usedJSHeapSize / 1024 / 1024; // Convert to MB
      this.notifyObservers();
    }
  }
}

export const usePerformanceMonitoring = (componentName: string) => {
  useEffect(() => {
    const monitor = PerformanceMonitor.getInstance();
    const startTime = performance.now();

    return () => {
      const renderTime = performance.now() - startTime;
      monitor.measureComponentRender(componentName, renderTime);
    };
  }, [componentName]);
};

export const measureApiPerformance = async <T>(
  endpoint: string,
  apiCall: () => Promise<T>
): Promise<T> => {
  const monitor = PerformanceMonitor.getInstance();
  const startTime = performance.now();

  try {
    const result = await apiCall();
    const responseTime = performance.now() - startTime;
    monitor.measureApiResponse(endpoint, responseTime);
    return result;
  } catch (error) {
    const responseTime = performance.now() - startTime;
    monitor.measureApiResponse(endpoint, responseTime);
    throw error;
  }
};

export const usePerformanceObserver = (callback: (metrics: PerformanceMetrics) => void) => {
  useEffect(() => {
    const monitor = PerformanceMonitor.getInstance();
    const unsubscribe = monitor.subscribe({ onMetricsUpdate: callback });
    return unsubscribe;
  }, [callback]);
};

export default PerformanceMonitor;

export const memoize = <T extends (...args: any[]) => any>(fn: T): T => {
  const cache = new Map<string, ReturnType<T>>();

  return ((...args: Parameters<T>): ReturnType<T> => {
    const key = JSON.stringify(args);
    if (cache.has(key)) {
      return cache.get(key)!;
    }
    const result = fn(...args);
    cache.set(key, result);
    return result;
  }) as T;
};

export const debounce = <T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout;

  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
};

export const throttle = <T extends (...args: any[]) => any>(
  fn: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;
  let lastFn: NodeJS.Timeout;
  let lastTime: number;

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      fn(...args);
      lastTime = Date.now();
      inThrottle = true;
    } else {
      clearTimeout(lastFn);
      lastFn = setTimeout(() => {
        if (Date.now() - lastTime >= limit) {
          fn(...args);
          lastTime = Date.now();
        }
      }, limit - (Date.now() - lastTime));
    }
  };
};

export const useDebouncedCallback = <T extends (...args: any[]) => any>(
  callback: T,
  delay: number,
  deps: any[] = []
) => {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  return useCallback(
    debounce((...args: Parameters<T>) => callbackRef.current(...args), delay),
    [delay, ...deps]
  );
};

export const useThrottledCallback = <T extends (...args: any[]) => any>(
  callback: T,
  limit: number,
  deps: any[] = []
) => {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  return useCallback(
    throttle((...args: Parameters<T>) => callbackRef.current(...args), limit),
    [limit, ...deps]
  );
};

export const useMemoizedValue = <T>(value: T, compareFn?: (prev: T, next: T) => boolean) => {
  const prevValueRef = useRef<T>(value);

  return useMemo(() => {
    if (compareFn?.(prevValueRef.current, value) ?? Object.is(prevValueRef.current, value)) {
      return prevValueRef.current;
    }
    prevValueRef.current = value;
    return value;
  }, [value, compareFn]);
};
