import { useCallback, useEffect, useRef } from 'react';
import { usePerformanceMonitoring } from '../utils/performance';
import { useErrorTracking } from './useErrorTracking';

interface CacheOptions {
  maxAge?: number;
  maxSize?: number;
  staleTime?: number;
  cacheTime?: number;
  retryCount?: number;
  retryDelay?: number;
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  lastAccessed: number;
  isStale: boolean;
}

interface CacheStats {
  hits: number;
  misses: number;
  errors: number;
  size: number;
}

export const useDataCache = <T>(options: CacheOptions = {}) => {
  const {
    staleTime = 300000, // 5 minutes
    cacheTime = 1800000,
  } = options;

  const { trackError } = useErrorTracking();
  usePerformanceMonitoring('DataCache');

  // Cache storage
  const cache = useRef<Map<string, CacheEntry<T>>>(new Map());
  const prefetchQueue = useRef<Set<string>>(new Set());
  const stats = useRef<CacheStats>({
    hits: 0,
    misses: 0,
    errors: 0,
    size: 0,
  });

  // Cleanup expired entries
  const cleanup = useCallback(() => {
    const now = Date.now();
    for (const [key, entry] of cache.current.entries()) {
      if (now - entry.timestamp > cacheTime) {
        cache.current.delete(key);
        stats.current.size--;
      }
    }
  }, [cacheTime]);

  // Periodic cleanup
  useEffect(() => {
    const interval = setInterval(cleanup, 60000); // Cleanup every minute
    return () => clearInterval(interval);
  }, [cleanup]);

  // Fetch data with retry logic

  // Get data from cache or fetch
  const getData = useCallback(
    async (key: string, fetchFn: () => Promise<T>): Promise<T> => {
      const now = Date.now();
      const entry = cache.current.get(key);

      if (entry) {
        // Check if entry is stale
        if (now - entry.lastAccessed > staleTime) {
          entry.isStale = true;
        }

        // Return cached data if not stale
        if (!entry.isStale) {
          entry.lastAccessed = now;
          stats.current.hits++;
          return entry.data;
        }

        // Return stale data while fetching fresh data
        stats.current.hits++;
        prefetchData(key, fetchFn);
        return entry.data;
      }

      // Cache miss, fetch fresh data
      stats.current.misses++;
      try {
        const data = await fetchFn();
        cache.current.set(key, {
          data,
          timestamp: now,
          lastAccessed: now,
          isStale: false,
        });
        stats.current.size++;
        return data;
      } catch (error) {
        stats.current.errors++;
        trackError(
          {
            message: 'Failed to fetch data from cache',
            error: error as Error,
          },
          'useDataCache'
        );
        throw error;
      }
    },
    [staleTime, trackError]
  );

  // Prefetch data
  const prefetchData = useCallback(
    async (key: string, fetchFn: () => Promise<T>) => {
      if (prefetchQueue.current.has(key)) return;
      prefetchQueue.current.add(key);

      try {
        const data = await fetchFn();
        const now = Date.now();
        cache.current.set(key, {
          data,
          timestamp: now,
          lastAccessed: now,
          isStale: false,
        });
      } catch (error) {
        trackError(
          {
            message: 'Failed to prefetch data',
            error: error as Error,
          },
          'useDataCache'
        );
      } finally {
        prefetchQueue.current.delete(key);
      }
    },
    [trackError]
  );

  // Invalidate cache entry
  const invalidate = useCallback((key: string) => {
    if (cache.current.delete(key)) {
      stats.current.size--;
    }
  }, []);

  // Clear entire cache
  const clearCache = useCallback(() => {
    cache.current.clear();
    prefetchQueue.current.clear();
    stats.current = {
      hits: 0,
      misses: 0,
      errors: 0,
      size: 0,
    };
  }, []);

  // Get cache statistics
  const getStats = useCallback(() => {
    return {
      ...stats.current,
      hitRate: stats.current.hits / (stats.current.hits + stats.current.misses) || 0,
    };
  }, []);

  // Check if data is cached
  const isCached = useCallback((key: string): boolean => {
    return cache.current.has(key);
  }, []);

  // Get cached data without fetching
  const getCachedData = useCallback((key: string): T | null => {
    const entry = cache.current.get(key);
    if (entry) {
      entry.lastAccessed = Date.now();
      return entry.data;
    }
    return null;
  }, []);

  return {
    getData,
    prefetchData,
    invalidate,
    clearCache,
    getStats,
    isCached,
    getCachedData,
  };
};

// Example usage:
/*
const AssignmentList: React.FC = () => {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const {
    getData,
    prefetchData,
    invalidate,
    getStats,
  } = useDataCache<Assignment[]>({
    maxAge: 3600000, // 1 hour
    maxSize: 100,
    staleTime: 300000, // 5 minutes
    cacheTime: 1800000, // 30 minutes
    retryCount: 3,
    retryDelay: 1000,
  });

  // Fetch assignments
  const fetchAssignments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getData('assignments', () =>
        fetch('/api/assignments').then(res => res.json())
      );
      setAssignments(data);
    } catch (error) {
      setError(error as Error);
    } finally {
      setLoading(false);
    }
  }, [getData]);

  // Prefetch assignment details
  const prefetchAssignment = useCallback(
    (id: string) => {
      prefetchData(`assignment-${id}`, () =>
        fetch(`/api/assignments/${id}`).then(res => res.json())
      );
    },
    [prefetchData]
  );

  // Handle assignment update
  const handleUpdateAssignment = useCallback(
    async (id: string, updates: Partial<Assignment>) => {
      try {
        await fetch(`/api/assignments/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates),
        });
        invalidate('assignments');
        invalidate(`assignment-${id}`);
        fetchAssignments();
      } catch (error) {
        setError(error as Error);
      }
    },
    [invalidate, fetchAssignments]
  );

  // Initial load
  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);

  // Display cache stats
  const stats = getStats();

  return (
    <div>
      <div className="cache-stats">
        <div>Cache Size: {stats.size}</div>
        <div>Hit Rate: {(stats.hitRate * 100).toFixed(1)}%</div>
        <div>Hits: {stats.hits}</div>
        <div>Misses: {stats.misses}</div>
      </div>

      {loading && <div>Loading assignments...</div>}
      {error && <div className="error">Error: {error.message}</div>}

      <div className="assignments-list">
        {assignments.map(assignment => (
          <AssignmentItem
            key={assignment.id}
            assignment={assignment}
            onUpdate={handleUpdateAssignment}
            onMouseEnter={() => prefetchAssignment(assignment.id)}
          />
        ))}
      </div>
    </div>
  );
};
*/
