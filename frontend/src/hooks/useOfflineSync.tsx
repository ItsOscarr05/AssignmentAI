import { useCallback, useEffect, useState } from 'react';
import { usePerformanceMonitoring } from '../utils/performance';

interface SyncState {
  isOnline: boolean;
  isSyncing: boolean;
  lastSync: Date | null;
  pendingChanges: number;
  error: Error | null;
}

interface SyncOptions {
  syncInterval?: number;
  onSyncStart?: () => void;
  onSyncComplete?: () => void;
  onSyncError?: (error: Error) => void;
  onConnectionChange?: (isOnline: boolean) => void;
}

interface PendingChange {
  id: string;
  type: 'create' | 'update' | 'delete';
  entity: string;
  data: any;
  timestamp: number;
}

export const useOfflineSync = (options: SyncOptions = {}) => {
  const {
    syncInterval = 30000, // 30 seconds
    onSyncStart,
    onSyncComplete,
    onSyncError,
    onConnectionChange,
  } = options;

  const [state, setState] = useState<SyncState>({
    isOnline: navigator.onLine,
    isSyncing: false,
    lastSync: null,
    pendingChanges: 0,
    error: null,
  });

  // Performance monitoring
  usePerformanceMonitoring('OfflineSync');

  // Track pending changes
  const [pendingChanges, setPendingChanges] = useState<PendingChange[]>([]);

  // Handle online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setState(prev => ({ ...prev, isOnline: true }));
      onConnectionChange?.(true);
    };

    const handleOffline = () => {
      setState(prev => ({ ...prev, isOnline: false }));
      onConnectionChange?.(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [onConnectionChange]);

  // Sync function
  const sync = useCallback(async () => {
    if (!state.isOnline || state.isSyncing || pendingChanges.length === 0) {
      return;
    }

    setState(prev => ({ ...prev, isSyncing: true, error: null }));
    onSyncStart?.();

    try {
      // Group changes by entity type
      const changesByEntity = pendingChanges.reduce((acc, change) => {
        if (!acc[change.entity]) {
          acc[change.entity] = [];
        }
        acc[change.entity].push(change);
        return acc;
      }, {} as Record<string, PendingChange[]>);

      // Process each entity type
      for (const [entity, changes] of Object.entries(changesByEntity)) {
        // Sort changes by timestamp
        changes.sort((a, b) => a.timestamp - b.timestamp);

        // Process changes in order
        for (const change of changes) {
          switch (change.type) {
            case 'create':
              await fetch(`/api/${entity}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(change.data),
              });
              break;

            case 'update':
              await fetch(`/api/${entity}/${change.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(change.data),
              });
              break;

            case 'delete':
              await fetch(`/api/${entity}/${change.id}`, {
                method: 'DELETE',
              });
              break;
          }
        }
      }

      // Clear processed changes
      setPendingChanges([]);
      setState(prev => ({
        ...prev,
        isSyncing: false,
        lastSync: new Date(),
        pendingChanges: 0,
      }));
      onSyncComplete?.();
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Sync failed');
      setState(prev => ({
        ...prev,
        isSyncing: false,
        error: err,
      }));
      onSyncError?.(err);
    }
  }, [state.isOnline, state.isSyncing, pendingChanges, onSyncStart, onSyncComplete, onSyncError]);

  // Periodic sync
  useEffect(() => {
    if (!state.isOnline) return;

    const interval = setInterval(sync, syncInterval);
    return () => clearInterval(interval);
  }, [state.isOnline, sync, syncInterval]);

  // Queue change for sync
  const queueChange = useCallback((change: Omit<PendingChange, 'timestamp'>) => {
    const newChange: PendingChange = {
      ...change,
      timestamp: Date.now(),
    };

    setPendingChanges(prev => [...prev, newChange]);
    setState(prev => ({
      ...prev,
      pendingChanges: prev.pendingChanges + 1,
    }));
  }, []);

  // Force sync
  const forceSync = useCallback(async () => {
    await sync();
  }, [sync]);

  // Clear pending changes
  const clearPendingChanges = useCallback(() => {
    setPendingChanges([]);
    setState(prev => ({
      ...prev,
      pendingChanges: 0,
    }));
  }, []);

  return {
    ...state,
    queueChange,
    forceSync,
    clearPendingChanges,
  };
};

// Example usage:
/*
const MyComponent = () => {
  const {
    isOnline,
    isSyncing,
    lastSync,
    pendingChanges,
    error,
    queueChange,
    forceSync,
  } = useOfflineSync({
    syncInterval: 60000, // 1 minute
    onSyncStart: () => {
      console.log('Starting sync...');
    },
    onSyncComplete: () => {
      console.log('Sync completed successfully');
    },
    onSyncError: (error) => {
      console.error('Sync failed:', error);
    },
    onConnectionChange: (isOnline) => {
      console.log('Connection status changed:', isOnline);
    },
  });

  const handleSubmit = async (data: any) => {
    // Queue the change for sync
    queueChange({
      id: data.id,
      type: 'create',
      entity: 'assignments',
      data,
    });

    // Show success message to user
    // The change will be synced when online
  };

  return {
    isOnline,
    isSyncing,
    lastSync,
    pendingChanges,
    error,
    handleSubmit,
    forceSync,
  };
};
*/
