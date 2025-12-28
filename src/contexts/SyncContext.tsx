import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { SyncService, type SyncStatus } from '../services/syncService';
import { useAuth } from './AuthContext';

interface SyncContextType {
  status: SyncStatus;
  lastSyncTime: Date | null;
  lastError: string | null;
  sync: () => Promise<void>;
  isSyncing: boolean;
  queueCount: number;
}

const SyncContext = createContext<SyncContextType | undefined>(undefined);

export function SyncProvider({ children }: { children: ReactNode }) {
  const { user, isConfigured } = useAuth();
  const [status, setStatus] = useState<SyncStatus>('idle');
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [queueCount, setQueueCount] = useState(0);

  // Update queue count
  const updateQueueCount = useCallback(async () => {
    const count = await SyncService.getQueueCount();
    setQueueCount(count);
  }, []);

  // Subscribe to sync status changes
  useEffect(() => {
    const unsubscribe = SyncService.onStatusChange((newStatus) => {
      setStatus(newStatus);
    });
    return unsubscribe;
  }, []);

  // Initial sync on sign in
  useEffect(() => {
    if (user && isConfigured) {
      SyncService.fullSync(user.id)
        .then(() => {
          setLastSyncTime(SyncService.getLastSyncTime());
          setLastError(null);
          updateQueueCount();
        })
        .catch((err) => {
          console.error('Initial sync failed:', err);
          setLastError(err.message || 'Sync failed');
        });
    }
  }, [user, isConfigured, updateQueueCount]);

  // Listen for auth sign-in event
  useEffect(() => {
    const handleSignIn = () => {
      if (user) {
        SyncService.fullSync(user.id)
          .then(() => {
            setLastSyncTime(SyncService.getLastSyncTime());
            setLastError(null);
            updateQueueCount();
          })
          .catch((err) => {
            console.error('Sync on sign-in failed:', err);
            setLastError(err.message || 'Sync failed');
          });
      }
    };

    window.addEventListener('auth-signed-in', handleSignIn);
    return () => window.removeEventListener('auth-signed-in', handleSignIn);
  }, [user, updateQueueCount]);

  // Process queue and sync when coming back online
  useEffect(() => {
    if (!user || !isConfigured) return;

    const handleOnline = async () => {
      console.log('Back online - processing sync queue...');
      
      // Process queued operations first
      const { processed, failed } = await SyncService.processQueue(user.id);
      if (processed > 0) {
        console.log(`Processed ${processed} queued operations`);
      }
      if (failed > 0) {
        console.log(`${failed} queued operations failed`);
      }
      
      // Then do a full sync to pull any updates
      await SyncService.fullSync(user.id)
        .then(() => {
          setLastSyncTime(SyncService.getLastSyncTime());
          setLastError(null);
        })
        .catch((err) => {
          console.error('Sync after reconnect failed:', err);
          setLastError(err.message || 'Sync failed');
        });
      
      updateQueueCount();
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [user, isConfigured, updateQueueCount]);

  // Periodic sync every 5 minutes when online
  useEffect(() => {
    if (!user || !isConfigured) return;

    const interval = setInterval(() => {
      if (navigator.onLine && status !== 'syncing') {
        SyncService.fullSync(user.id)
          .then(() => {
            setLastSyncTime(SyncService.getLastSyncTime());
            setLastError(null);
            updateQueueCount();
          })
          .catch((err) => {
            console.error('Periodic sync failed:', err);
            setLastError(err.message || 'Sync failed');
          });
      }
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [user, isConfigured, status, updateQueueCount]);

  // Manual sync function
  const sync = useCallback(async () => {
    if (!user || !isConfigured || isSyncing) return;
    
    setIsSyncing(true);
    setLastError(null);
    try {
      // Process queue first
      await SyncService.processQueue(user.id);
      // Then full sync
      await SyncService.fullSync(user.id);
      setLastSyncTime(SyncService.getLastSyncTime());
      updateQueueCount();
    } catch (err: unknown) {
      console.error('Manual sync failed:', err);
      setLastError(err instanceof Error ? err.message : 'Sync failed');
    } finally {
      setIsSyncing(false);
    }
  }, [user, isConfigured, isSyncing, updateQueueCount]);

  return (
    <SyncContext.Provider value={{ status, lastSyncTime, lastError, sync, isSyncing, queueCount }}>
      {children}
    </SyncContext.Provider>
  );
}

export function useSync() {
  const context = useContext(SyncContext);
  if (context === undefined) {
    throw new Error('useSync must be used within a SyncProvider');
  }
  return context;
}

// Hook to sync individual items after local changes
export function useSyncItem() {
  const { user, isConfigured } = useAuth();

  const syncItem = useCallback(
    async (
      table: 'exercises' | 'max_records' | 'completed_sets' | 'cycles' | 'scheduled_workouts',
      item: unknown
    ) => {
      if (user && isConfigured) {
        await SyncService.syncItem(table, item, user.id);
      }
    },
    [user, isConfigured]
  );

  const deleteItem = useCallback(
    async (
      table: 'exercises' | 'max_records' | 'completed_sets' | 'cycles' | 'scheduled_workouts',
      id: string
    ) => {
      if (user && isConfigured) {
        await SyncService.deleteItem(table, id, user.id);
      }
    },
    [user, isConfigured]
  );

  return { syncItem, deleteItem };
}
