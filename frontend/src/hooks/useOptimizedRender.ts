import { useCallback, useEffect, useMemo, useRef } from "react";
import { usePerformanceMonitoring } from "../utils/performance";

interface OptimizedRenderOptions {
  componentName: string;
  dependencies?: any[];
  shouldMemoize?: boolean;
  shouldDebounce?: boolean;
  debounceDelay?: number;
}

export const useOptimizedRender = <T extends (...args: any[]) => any>(
  callback: T,
  options: OptimizedRenderOptions
) => {
  const {
    componentName,
    dependencies = [],
    shouldMemoize = true,
    shouldDebounce = false,
    debounceDelay = 300,
  } = options;

  const timeoutRef = useRef<NodeJS.Timeout>();
  const lastCallRef = useRef<number>(0);

  // Performance monitoring
  usePerformanceMonitoring(componentName);

  // Memoized callback
  const memoizedCallback = useMemo(() => {
    if (!shouldMemoize) return callback;

    return (...args: Parameters<T>): ReturnType<T> => {
      const now = Date.now();
      const timeSinceLastCall = now - lastCallRef.current;

      // If debouncing is enabled and the time since last call is less than the delay,
      // clear the previous timeout and set a new one
      if (shouldDebounce && timeSinceLastCall < debounceDelay) {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        timeoutRef.current = setTimeout(() => {
          lastCallRef.current = Date.now();
          return callback(...args);
        }, debounceDelay);
        return undefined as ReturnType<T>;
      }

      lastCallRef.current = now;
      return callback(...args);
    };
  }, [callback, shouldMemoize, shouldDebounce, debounceDelay, ...dependencies]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Optimized event handler wrapper
  const optimizedHandler = useCallback(
    (...args: Parameters<T>) => {
      return memoizedCallback(...args);
    },
    [memoizedCallback]
  );

  return optimizedHandler;
};

// Example usage:
/*
const MyComponent: React.FC = () => {
  const handleInputChange = useOptimizedRender(
    (value: string) => {
      // Handle input change
      console.log(value);
    },
    {
      componentName: 'MyComponent',
      shouldDebounce: true,
      debounceDelay: 500,
    }
  );

  return (
    <input
      onChange={(e) => handleInputChange(e.target.value)}
      placeholder="Type something..."
    />
  );
};
*/
