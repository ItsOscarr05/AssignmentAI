import { useEffect } from "react";

interface PerformanceMetrics {
  pageLoadTime: number;
  componentRenderTime: number;
  apiResponseTime: number;
  memoryUsage: number;
  fps: number;
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
      this.observers = this.observers.filter((obs) => obs !== observer);
    };
  }

  private notifyObservers(): void {
    this.observers.forEach((observer) =>
      observer.onMetricsUpdate(this.metrics)
    );
  }

  private initializePerformanceObserver(): void {
    if ("PerformanceObserver" in window) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === "navigation") {
            this.metrics.pageLoadTime =
              entry.loadEventEnd - entry.navigationStart;
            this.notifyObservers();
          }
        }
      });

      observer.observe({ entryTypes: ["navigation"] });
    }
  }

  private startFPSMonitoring(): void {
    let lastTime = performance.now();
    let frames = 0;
    let lastFPSUpdate = performance.now();

    const updateFPS = () => {
      const currentTime = performance.now();
      frames++;

      if (currentTime - lastFPSUpdate >= 1000) {
        this.metrics.fps = Math.round(
          (frames * 1000) / (currentTime - lastFPSUpdate)
        );
        frames = 0;
        lastFPSUpdate = currentTime;
        this.notifyObservers();
      }

      requestAnimationFrame(updateFPS);
    };

    requestAnimationFrame(updateFPS);
  }

  public measureComponentRender(
    componentName: string,
    renderTime: number
  ): void {
    this.metrics.componentRenderTime = renderTime;
    this.notifyObservers();
  }

  public measureApiResponse(endpoint: string, responseTime: number): void {
    this.metrics.apiResponseTime = responseTime;
    this.notifyObservers();
  }

  public async measureMemoryUsage(): Promise<void> {
    if ("memory" in performance) {
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

export const usePerformanceObserver = (
  callback: (metrics: PerformanceMetrics) => void
) => {
  useEffect(() => {
    const monitor = PerformanceMonitor.getInstance();
    const unsubscribe = monitor.subscribe({ onMetricsUpdate: callback });
    return unsubscribe;
  }, [callback]);
};

export default PerformanceMonitor;
