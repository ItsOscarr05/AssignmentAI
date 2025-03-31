import { useCallback, useEffect, useRef, useState } from "react";
import { usePerformanceMonitoring } from "../utils/performance";

interface StatePersistenceOptions<T> {
  key: string;
  initialState: T;
  storage?: Storage;
  debounceTime?: number;
  onSave?: (state: T) => void;
  onLoad?: (state: T) => void;
  validateState?: (state: any) => boolean;
  transformState?: {
    save?: (state: T) => any;
    load?: (data: any) => T;
  };
}

interface CacheOptions {
  maxAge?: number;
  maxSize?: number;
  priority?: "high" | "medium" | "low";
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  priority: "high" | "medium" | "low";
}

export const useStatePersistence = <T>(options: StatePersistenceOptions<T>) => {
  const {
    key,
    initialState,
    storage = localStorage,
    debounceTime = 1000,
    onSave,
    onLoad,
    validateState,
    transformState,
  } = options;

  const [state, setState] = useState<T>(() => {
    try {
      const savedState = storage.getItem(key);
      if (savedState) {
        const parsedState = JSON.parse(savedState);
        const transformedState = transformState?.load
          ? transformState.load(parsedState)
          : parsedState;

        if (validateState ? validateState(transformedState) : true) {
          onLoad?.(transformedState);
          return transformedState;
        }
      }
    } catch (error) {
      console.error("Error loading persisted state:", error);
    }
    return initialState;
  });

  // Performance monitoring
  usePerformanceMonitoring("StatePersistence");

  // Cache management
  const cache = useRef<Map<string, CacheEntry<any>>>(new Map());
  const cacheTimeout = useRef<NodeJS.Timeout>();

  // Save state with debouncing
  const saveState = useCallback(
    (newState: T) => {
      try {
        const transformedState = transformState?.save
          ? transformState.save(newState)
          : newState;

        storage.setItem(key, JSON.stringify(transformedState));
        onSave?.(newState);
      } catch (error) {
        console.error("Error saving state:", error);
      }
    },
    [key, storage, transformState, onSave]
  );

  // Debounced save
  useEffect(() => {
    if (cacheTimeout.current) {
      clearTimeout(cacheTimeout.current);
    }

    cacheTimeout.current = setTimeout(() => {
      saveState(state);
    }, debounceTime);

    return () => {
      if (cacheTimeout.current) {
        clearTimeout(cacheTimeout.current);
      }
    };
  }, [state, debounceTime, saveState]);

  // Cache management functions
  const setCache = useCallback(
    <K extends string, V>(cacheKey: K, data: V, options: CacheOptions = {}) => {
      const { maxAge = 3600000, maxSize = 100, priority = "medium" } = options;

      // Check cache size
      if (cache.current.size >= maxSize) {
        // Remove lowest priority items if needed
        const entries = Array.from(cache.current.entries());
        entries.sort((a, b) => {
          const priorityOrder = { high: 0, medium: 1, low: 2 };
          return priorityOrder[a[1].priority] - priorityOrder[b[1].priority];
        });

        while (cache.current.size >= maxSize) {
          const [key] = entries.shift() || [];
          if (key) {
            cache.current.delete(key);
          }
        }
      }

      // Add new entry
      cache.current.set(cacheKey, {
        data,
        timestamp: Date.now(),
        priority,
      });

      // Set expiration
      setTimeout(() => {
        const entry = cache.current.get(cacheKey);
        if (entry && Date.now() - entry.timestamp >= maxAge) {
          cache.current.delete(cacheKey);
        }
      }, maxAge);
    },
    []
  );

  const getCache = useCallback(<K extends string, V>(cacheKey: K): V | null => {
    const entry = cache.current.get(cacheKey);
    if (entry) {
      return entry.data;
    }
    return null;
  }, []);

  const clearCache = useCallback(() => {
    cache.current.clear();
  }, []);

  const removeFromCache = useCallback((cacheKey: string) => {
    cache.current.delete(cacheKey);
  }, []);

  // State management functions
  const updateState = useCallback(
    (updater: T | ((prevState: T) => T)) => {
      setState((prevState) => {
        const newState =
          typeof updater === "function"
            ? (updater as (prevState: T) => T)(prevState)
            : updater;

        if (validateState ? validateState(newState) : true) {
          return newState;
        }
        return prevState;
      });
    },
    [validateState]
  );

  const resetState = useCallback(() => {
    setState(initialState);
    saveState(initialState);
  }, [initialState, saveState]);

  const clearState = useCallback(() => {
    storage.removeItem(key);
    setState(initialState);
  }, [key, storage, initialState]);

  return {
    state,
    updateState,
    resetState,
    clearState,
    setCache,
    getCache,
    clearCache,
    removeFromCache,
  };
};

// Example usage:
/*
const MyComponent: React.FC = () => {
  interface UserState {
    preferences: {
      theme: 'light' | 'dark';
      fontSize: number;
    };
    recentItems: string[];
  }

  const initialState: UserState = {
    preferences: {
      theme: 'light',
      fontSize: 16,
    },
    recentItems: [],
  };

  const {
    state,
    updateState,
    setCache,
    getCache,
  } = useStatePersistence<UserState>({
    key: 'user-preferences',
    initialState,
    storage: localStorage,
    debounceTime: 2000,
    validateState: (state) => {
      return (
        state &&
        typeof state === 'object' &&
        'preferences' in state &&
        'recentItems' in state
      );
    },
    transformState: {
      save: (state) => ({
        ...state,
        timestamp: Date.now(),
      }),
      load: (data) => {
        const { timestamp, ...state } = data;
        return state;
      },
    },
    onSave: (state) => {
      console.log('State saved:', state);
    },
    onLoad: (state) => {
      console.log('State loaded:', state);
    },
  });

  const handleThemeChange = (theme: 'light' | 'dark') => {
    updateState(prevState => ({
      ...prevState,
      preferences: {
        ...prevState.preferences,
        theme,
      },
    }));
  };

  const handleAddRecentItem = (item: string) => {
    updateState(prevState => ({
      ...prevState,
      recentItems: [
        item,
        ...prevState.recentItems.filter(i => i !== item),
      ].slice(0, 10),
    }));

    // Cache the item data
    setCache(`item-${item}`, {
      title: item,
      lastAccessed: Date.now(),
    }, {
      maxAge: 3600000, // 1 hour
      priority: 'high',
    });
  };

  return (
    <div>
      <div>
        Theme: {state.preferences.theme}
        <button onClick={() => handleThemeChange(
          state.preferences.theme === 'light' ? 'dark' : 'light'
        )}>
          Toggle Theme
        </button>
      </div>
      <div>
        Recent Items:
        <ul>
          {state.recentItems.map(item => (
            <li key={item}>
              {item}
              {getCache(`item-${item}`) && ' (Cached)'}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};
*/
