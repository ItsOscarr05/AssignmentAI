import { useCallback, useEffect, useRef, useState } from 'react';
import { usePerformanceMonitoring } from '../utils/performance';
import { useErrorTracking } from './useErrorTracking';

interface SyncOptions<T> {
  endpoint: string;
  syncInterval?: number;
  retryAttempts?: number;
  retryDelay?: number;
  conflictResolution?: 'server' | 'client' | 'merge';
  onSyncStart?: () => void;
  onSyncComplete?: (data: T) => void;
  onSyncError?: (error: Error) => void;
  transformData?: {
    toServer?: (data: T) => any;
    fromServer?: (data: any) => T;
  };
}

interface SyncState {
  isSyncing: boolean;
  lastSyncTime: number | null;
  pendingChanges: boolean;
  error: Error | null;
  retryCount: number;
}

export const useDataSync = <T extends { id: string; version?: number }>(
  options: SyncOptions<T>
) => {
  const {
    endpoint,
    syncInterval = 30000, // 30 seconds
    retryAttempts = 3,
    retryDelay = 1000,
    conflictResolution = 'server',
    onSyncStart,
    onSyncComplete,
    onSyncError,
    transformData,
  } = options;

  const [state, setState] = useState<SyncState>({
    isSyncing: false,
    lastSyncTime: null,
    pendingChanges: false,
    error: null,
    retryCount: 0,
  });

  const syncTimeout = useRef<NodeJS.Timeout>();
  const { trackError } = useErrorTracking();
  usePerformanceMonitoring('DataSync');

  // Queue for offline changes
  const offlineQueue = useRef<
    Array<{
      type: 'create' | 'update' | 'delete';
      data: T;
      timestamp: number;
    }>
  >([]);

  // IndexedDB for offline storage
  const db = useRef<IDBDatabase | null>(null);

  // Initialize IndexedDB
  useEffect(() => {
    const request = indexedDB.open('AssignmentAI', 1);

    request.onerror = event => {
      trackError(
        {
          message: 'IndexedDB initialization failed',
          error: event as unknown as Error,
        },
        'useDataSync'
      );
    };

    request.onupgradeneeded = event => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Create stores for different data types
      if (!db.objectStoreNames.contains('assignments')) {
        db.createObjectStore('assignments', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('submissions')) {
        db.createObjectStore('submissions', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('syncQueue')) {
        db.createObjectStore('syncQueue', { keyPath: 'timestamp' });
      }
    };

    request.onsuccess = event => {
      db.current = (event.target as IDBOpenDBRequest).result;
    };

    return () => {
      if (db.current) {
        db.current.close();
      }
    };
  }, [trackError]);

  // Save data to IndexedDB
  const saveToIndexedDB = useCallback(async (storeName: string, data: T) => {
    if (!db.current) return;

    return new Promise<void>((resolve, reject) => {
      const transaction = db.current!.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(data);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }, []);

  // Get data from IndexedDB
  const getFromIndexedDB = useCallback(async (storeName: string, id: string): Promise<T | null> => {
    if (!db.current) return null;

    return new Promise((resolve, reject) => {
      const transaction = db.current!.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }, []);

  // Queue change for sync
  const queueChange = useCallback(
    async (type: 'create' | 'update' | 'delete', data: T) => {
      const change = {
        type,
        data,
        timestamp: Date.now(),
      };

      offlineQueue.current.push(change);
      setState(prev => ({ ...prev, pendingChanges: true }));

      // Save to IndexedDB sync queue
      if (db.current) {
        await saveToIndexedDB('syncQueue', change as any);
      }
    },
    [saveToIndexedDB]
  );

  // Resolve conflicts between local and server data
  const resolveConflict = useCallback(
    (localData: T, serverData: T): T => {
      switch (conflictResolution) {
        case 'server':
          return serverData;
        case 'client':
          return localData;
        case 'merge':
          return {
            ...localData,
            ...serverData,
            version: Math.max(localData.version || 0, serverData.version || 0) + 1,
          };
        default:
          return serverData;
      }
    },
    [conflictResolution]
  );

  // Sync data with server
  const sync = useCallback(async () => {
    if (state.isSyncing) return;

    setState(prev => ({ ...prev, isSyncing: true, error: null }));
    onSyncStart?.();

    try {
      // Process offline queue
      for (const change of offlineQueue.current) {
        const transformedData = transformData?.toServer
          ? transformData.toServer(change.data)
          : change.data;

        try {
          switch (change.type) {
            case 'create':
              await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(transformedData),
              });
              break;
            case 'update':
              await fetch(`${endpoint}/${change.data.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(transformedData),
              });
              break;
            case 'delete':
              await fetch(`${endpoint}/${change.data.id}`, {
                method: 'DELETE',
              });
              break;
          }

          // Remove from queue after successful sync
          offlineQueue.current = offlineQueue.current.filter(c => c.timestamp !== change.timestamp);
        } catch (error) {
          trackError(
            {
              message: 'Failed to sync change',
              error: error as Error,
            },
            'useDataSync'
          );
          throw error;
        }
      }

      // Fetch latest data from server
      const response = await fetch(endpoint);
      if (!response.ok) throw new Error('Failed to fetch data');

      const serverData = await response.json();
      const transformedData = transformData?.fromServer
        ? transformData.fromServer(serverData)
        : serverData;

      // Update local storage
      for (const item of transformedData) {
        const localData = await getFromIndexedDB(endpoint.split('/').pop() || 'data', item.id);

        if (localData) {
          const resolvedData = resolveConflict(localData, item);
          await saveToIndexedDB(endpoint.split('/').pop() || 'data', resolvedData);
        } else {
          await saveToIndexedDB(endpoint.split('/').pop() || 'data', item);
        }
      }

      setState(prev => ({
        ...prev,
        isSyncing: false,
        lastSyncTime: Date.now(),
        pendingChanges: false,
        retryCount: 0,
      }));

      onSyncComplete?.(transformedData);
    } catch (error) {
      const newRetryCount = state.retryCount + 1;
      setState(prev => ({
        ...prev,
        isSyncing: false,
        error: error as Error,
        retryCount: newRetryCount,
      }));

      onSyncError?.(error as Error);

      // Retry if attempts remain
      if (newRetryCount < retryAttempts) {
        setTimeout(sync, retryDelay * newRetryCount);
      }
    }
  }, [
    endpoint,
    state.isSyncing,
    state.retryCount,
    retryAttempts,
    retryDelay,
    transformData,
    resolveConflict,
    saveToIndexedDB,
    getFromIndexedDB,
    onSyncStart,
    onSyncComplete,
    onSyncError,
    trackError,
  ]);

  // Setup periodic sync
  useEffect(() => {
    if (syncTimeout.current) {
      clearTimeout(syncTimeout.current);
    }

    syncTimeout.current = setTimeout(sync, syncInterval);

    return () => {
      if (syncTimeout.current) {
        clearTimeout(syncTimeout.current);
      }
    };
  }, [sync, syncInterval]);

  // Sync on network reconnection
  useEffect(() => {
    const handleOnline = () => {
      if (state.pendingChanges) {
        sync();
      }
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [state.pendingChanges, sync]);

  return {
    ...state,
    sync,
    queueChange,
    isOnline: navigator.onLine,
  };
};

// Example usage:
/*
const AssignmentList: React.FC = () => {
  const [assignments, setAssignments] = useState<Assignment[]>([]);

  const {
    isSyncing,
    lastSyncTime,
    pendingChanges,
    error,
    sync,
    queueChange,
    isOnline,
  } = useDataSync<Assignment>({
    endpoint: '/api/assignments',
    syncInterval: 60000, // 1 minute
    retryAttempts: 3,
    retryDelay: 2000,
    conflictResolution: 'merge',
    transformData: {
      toServer: (data) => ({
        ...data,
        updatedAt: new Date().toISOString(),
      }),
      fromServer: (data) => ({
        ...data,
        dueDate: new Date(data.dueDate),
      }),
    },
    onSyncStart: () => {
      console.log('Starting sync...');
    },
    onSyncComplete: (data) => {
      setAssignments(data);
      console.log('Sync completed:', data);
    },
    onSyncError: (error) => {
      console.error('Sync failed:', error);
    },
  });

  const handleCreateAssignment = async (assignment: Omit<Assignment, 'id'>) => {
    const newAssignment = {
      ...assignment,
      id: generateId(),
      version: 1,
    };

    setAssignments(prev => [...prev, newAssignment]);
    await queueChange('create', newAssignment);
  };

  const handleUpdateAssignment = async (assignment: Assignment) => {
    setAssignments(prev =>
      prev.map(a => (a.id === assignment.id ? assignment : a))
    );
    await queueChange('update', assignment);
  };

  const handleDeleteAssignment = async (id: string) => {
    setAssignments(prev => prev.filter(a => a.id !== id));
    await queueChange('delete', { id, version: 1 } as Assignment);
  };

  return (
    <div>
      <div>
        <h2>Assignments</h2>
        {!isOnline && (
          <div className="offline-warning">
            You are offline. Changes will sync when connection is restored.
          </div>
        )}
        {isSyncing && <div>Syncing...</div>}
        {error && <div className="error">Sync error: {error.message}</div>}
        {lastSyncTime && (
          <div>
            Last synced: {new Date(lastSyncTime).toLocaleString()}
          </div>
        )}
      </div>

      <AssignmentForm onSubmit={handleCreateAssignment} />
      
      <div className="assignments-list">
        {assignments.map(assignment => (
          <AssignmentItem
            key={assignment.id}
            assignment={assignment}
            onUpdate={handleUpdateAssignment}
            onDelete={handleDeleteAssignment}
          />
        ))}
      </div>
    </div>
  );
};
*/
