import { useCallback, useRef, useState } from "react";
import { usePerformanceMonitoring } from "../utils/performance";
import { useErrorTracking } from "./useErrorTracking";

interface DataPersistenceOptions<T> {
  storageKey: string;
  initialData: T;
  validateData?: (data: any) => boolean;
  transformData?: {
    save?: (data: T) => any;
    load?: (data: any) => T;
  };
  onSave?: (data: T) => void;
  onLoad?: (data: T) => void;
  maxHistorySize?: number;
}

interface HistoryEntry<T> {
  data: T;
  timestamp: number;
  action: string;
}

export const useDataPersistence = <T>(options: DataPersistenceOptions<T>) => {
  const {
    storageKey,
    initialData,
    validateData,
    transformData,
    onSave,
    onLoad,
    maxHistorySize = 50,
  } = options;

  const { trackError } = useErrorTracking();
  usePerformanceMonitoring("DataPersistence");

  // State management
  const [data, setData] = useState<T>(() => {
    try {
      const savedData = localStorage.getItem(storageKey);
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        const transformedData = transformData?.load
          ? transformData.load(parsedData)
          : parsedData;

        if (validateData ? validateData(transformedData) : true) {
          onLoad?.(transformedData);
          return transformedData;
        }
      }
    } catch (error) {
      trackError("Failed to load persisted data", {
        error,
        context: "DataPersistence",
        storageKey,
      });
    }
    return initialData;
  });

  // History management
  const history = useRef<HistoryEntry<T>[]>([]);
  const historyIndex = useRef<number>(-1);

  // Save data to storage
  const saveData = useCallback(
    (newData: T, action: string = "update") => {
      try {
        const transformedData = transformData?.save
          ? transformData.save(newData)
          : newData;

        localStorage.setItem(storageKey, JSON.stringify(transformedData));
        onSave?.(newData);

        // Update history
        const historyEntry: HistoryEntry<T> = {
          data: newData,
          timestamp: Date.now(),
          action,
        };

        // Remove any future history entries if we're not at the end
        if (historyIndex.current < history.current.length - 1) {
          history.current = history.current.slice(0, historyIndex.current + 1);
        }

        // Add new entry
        history.current.push(historyEntry);
        historyIndex.current++;

        // Trim history if needed
        if (history.current.length > maxHistorySize) {
          history.current = history.current.slice(-maxHistorySize);
          historyIndex.current = Math.max(0, historyIndex.current - 1);
        }
      } catch (error) {
        trackError("Failed to save data", {
          error,
          context: "DataPersistence",
          storageKey,
        });
        throw error;
      }
    },
    [storageKey, transformData, onSave, maxHistorySize, trackError]
  );

  // Update data with optimistic updates
  const updateData = useCallback(
    (updater: T | ((prevData: T) => T), action: string = "update") => {
      setData((prevData) => {
        const newData =
          typeof updater === "function"
            ? (updater as (prevData: T) => T)(prevData)
            : updater;

        if (validateData ? validateData(newData) : true) {
          saveData(newData, action);
          return newData;
        }
        return prevData;
      });
    },
    [validateData, saveData]
  );

  // Undo last change
  const undo = useCallback(() => {
    if (historyIndex.current > 0) {
      historyIndex.current--;
      const previousEntry = history.current[historyIndex.current];
      setData(previousEntry.data);
      saveData(previousEntry.data, `undo: ${previousEntry.action}`);
    }
  }, [saveData]);

  // Redo last undone change
  const redo = useCallback(() => {
    if (historyIndex.current < history.current.length - 1) {
      historyIndex.current++;
      const nextEntry = history.current[historyIndex.current];
      setData(nextEntry.data);
      saveData(nextEntry.data, `redo: ${nextEntry.action}`);
    }
  }, [saveData]);

  // Reset data to initial state
  const resetData = useCallback(() => {
    setData(initialData);
    saveData(initialData, "reset");
  }, [initialData, saveData]);

  // Clear data and history
  const clearData = useCallback(() => {
    localStorage.removeItem(storageKey);
    setData(initialData);
    history.current = [];
    historyIndex.current = -1;
  }, [storageKey, initialData]);

  // Get history entries
  const getHistory = useCallback(() => {
    return history.current.map((entry, index) => ({
      ...entry,
      isCurrent: index === historyIndex.current,
    }));
  }, []);

  // Check if undo is available
  const canUndo = historyIndex.current > 0;

  // Check if redo is available
  const canRedo = historyIndex.current < history.current.length - 1;

  return {
    data,
    updateData,
    undo,
    redo,
    resetData,
    clearData,
    getHistory,
    canUndo,
    canRedo,
  };
};

// Example usage:
/*
const UserPreferences: React.FC = () => {
  interface Preferences {
    theme: 'light' | 'dark';
    fontSize: number;
    notifications: boolean;
  }

  const initialPreferences: Preferences = {
    theme: 'light',
    fontSize: 16,
    notifications: true,
  };

  const {
    data: preferences,
    updateData,
    undo,
    redo,
    canUndo,
    canRedo,
  } = useDataPersistence<Preferences>({
    storageKey: 'user-preferences',
    initialData: initialPreferences,
    validateData: (data) => {
      return (
        data &&
        typeof data === 'object' &&
        'theme' in data &&
        'fontSize' in data &&
        'notifications' in data
      );
    },
    transformData: {
      save: (data) => ({
        ...data,
        lastUpdated: new Date().toISOString(),
      }),
      load: (data) => {
        const { lastUpdated, ...preferences } = data;
        return preferences;
      },
    },
    onSave: (data) => {
      console.log('Preferences saved:', data);
    },
    onLoad: (data) => {
      console.log('Preferences loaded:', data);
    },
  });

  const handleThemeChange = (theme: 'light' | 'dark') => {
    updateData(
      prev => ({
        ...prev,
        theme,
      }),
      'theme-change'
    );
  };

  const handleFontSizeChange = (fontSize: number) => {
    updateData(
      prev => ({
        ...prev,
        fontSize,
      }),
      'font-size-change'
    );
  };

  const handleNotificationsToggle = () => {
    updateData(
      prev => ({
        ...prev,
        notifications: !prev.notifications,
      }),
      'notifications-toggle'
    );
  };

  return (
    <div>
      <h2>User Preferences</h2>
      
      <div className="history-controls">
        <button onClick={undo} disabled={!canUndo}>
          Undo
        </button>
        <button onClick={redo} disabled={!canRedo}>
          Redo
        </button>
      </div>

      <div className="preferences">
        <div>
          <label>Theme:</label>
          <select
            value={preferences.theme}
            onChange={e => handleThemeChange(e.target.value as 'light' | 'dark')}
          >
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </div>

        <div>
          <label>Font Size:</label>
          <input
            type="range"
            min="12"
            max="24"
            value={preferences.fontSize}
            onChange={e => handleFontSizeChange(Number(e.target.value))}
          />
          <span>{preferences.fontSize}px</span>
        </div>

        <div>
          <label>
            <input
              type="checkbox"
              checked={preferences.notifications}
              onChange={handleNotificationsToggle}
            />
            Enable Notifications
          </label>
        </div>
      </div>
    </div>
  );
};
*/
