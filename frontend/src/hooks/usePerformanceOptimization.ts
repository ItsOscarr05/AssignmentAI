import { useCallback, useEffect, useRef, useState } from 'react';

interface UseVirtualScrollOptions {
  itemHeight: number;
  containerHeight: number;
  items: any[];
  overscan?: number;
}

export const useVirtualScroll = ({
  itemHeight,
  containerHeight,
  items,
  overscan = 5,
}: UseVirtualScrollOptions) => {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const visibleCount = Math.ceil(containerHeight / itemHeight);
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(items.length - 1, startIndex + visibleCount + overscan * 2);

  const visibleItems = items.slice(startIndex, endIndex + 1).map((item, index) => ({
    ...item,
    index: startIndex + index,
  }));

  const totalHeight = items.length * itemHeight;
  const offsetY = startIndex * itemHeight;

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  return {
    containerRef,
    visibleItems,
    totalHeight,
    offsetY,
    handleScroll,
  };
};

export const useLazyLoading = <T>(loadFunction: () => Promise<T[]>, dependencies: any[] = []) => {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);

  const loadData = useCallback(async () => {
    if (loading || !hasMore) return;

    setLoading(true);
    setError(null);

    try {
      const newData = await loadFunction();
      setData(prev => [...prev, ...newData]);
      setHasMore(newData.length > 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [loadFunction, loading, hasMore]);

  useEffect(() => {
    loadData();
  }, dependencies);

  return {
    data,
    loading,
    error,
    hasMore,
    loadMore: loadData,
    reset: () => {
      setData([]);
      setHasMore(true);
      setError(null);
    },
  };
};

export const useOptimisticUpdate = <T>(
  initialData: T[],
  updateFunction: (item: T) => Promise<T>,
  deleteFunction: (id: string) => Promise<void>
) => {
  const [data, setData] = useState<T[]>(initialData);
  const [optimisticUpdates, setOptimisticUpdates] = useState<Map<string, T>>(new Map());

  const optimisticUpdate = useCallback(
    async (item: T, id: string) => {
      // Optimistically update UI
      setOptimisticUpdates(prev => new Map(prev.set(id, item)));
      setData(prev =>
        prev.map(existingItem => ((existingItem as any).id === id ? item : existingItem))
      );

      try {
        // Perform actual update
        const updatedItem = await updateFunction(item);
        setData(prev =>
          prev.map(existingItem => ((existingItem as any).id === id ? updatedItem : existingItem))
        );
      } catch (error) {
        // Revert on error
        setData(prev =>
          prev.map(existingItem =>
            (existingItem as any).id === id
              ? optimisticUpdates.get(id) || existingItem
              : existingItem
          )
        );
        throw error;
      } finally {
        setOptimisticUpdates(prev => {
          const newMap = new Map(prev);
          newMap.delete(id);
          return newMap;
        });
      }
    },
    [updateFunction, optimisticUpdates]
  );

  const optimisticDelete = useCallback(
    async (id: string) => {
      const originalItem = data.find(item => (item as any).id === id);
      if (!originalItem) return;

      // Optimistically remove from UI
      setData(prev => prev.filter(item => (item as any).id !== id));

      try {
        // Perform actual deletion
        await deleteFunction(id);
      } catch (error) {
        // Revert on error
        setData(prev => [...prev, originalItem]);
        throw error;
      }
    },
    [data, deleteFunction]
  );

  return {
    data,
    optimisticUpdate,
    optimisticDelete,
  };
};

export const useDebounce = <T>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

export const useThrottle = <T extends (...args: any[]) => any>(callback: T, delay: number): T => {
  const lastRun = useRef(Date.now());

  return useCallback(
    ((...args) => {
      if (Date.now() - lastRun.current >= delay) {
        callback(...args);
        lastRun.current = Date.now();
      }
    }) as T,
    [callback, delay]
  );
};

export const useIntersectionObserver = (
  callback: () => void,
  options: IntersectionObserverInit = {}
) => {
  const targetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const target = targetRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) {
        callback();
      }
    }, options);

    observer.observe(target);

    return () => {
      observer.unobserve(target);
    };
  }, [callback, options]);

  return targetRef;
};

export default {
  useVirtualScroll,
  useLazyLoading,
  useOptimisticUpdate,
  useDebounce,
  useThrottle,
  useIntersectionObserver,
};
