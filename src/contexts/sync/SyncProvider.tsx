import { useEffect, useState, useCallback, useRef, type ReactNode } from 'react';
import { SyncService, type SyncStatus } from '@/services/syncService';
import { useAuth } from '../auth';
import { createScopedLogger } from '@/utils/logger';
import { SyncContext } from './SyncContext';

const log = createScopedLogger('Sync');

export function SyncProvider({ children }: { children: ReactNode }) {
  const { user, isConfigured } = useAuth();
  const [status, setStatus] = useState<SyncStatus>('idle');
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [queueCount, setQueueCount] = useState(0);

  // Use ref to track syncing state to avoid stale closure in useCallback
  const isSyncingRef = useRef(false);

  // Update queue count
  const updateQueueCount = useCallback(async () => {
    const count = await SyncService.getQueueCount();
    setQueueCount(count);
  }, []);

  // Subscribe to sync status changes
  useEffect(() => {
    const unsubscribe = SyncService.onStatusChange(newStatus => {
      setStatus(newStatus);
    });
    return unsubscribe;
  }, []);

  // Initial sync on sign in
  useEffect(() => {
    if (user && isConfigured) {
      // Process any queued operations first, then full sync
      SyncService.processQueue(user.id)
        .then(() => SyncService.fullSync(user.id))
        .then(() => {
          setLastSyncTime(SyncService.getLastSyncTime());
          setLastError(null);
          updateQueueCount();
        })
        .catch(err => {
          log.error(err as Error);
          setLastError(err.message || 'Sync failed');
        });
    }
  }, [user, isConfigured, updateQueueCount]);

  // Listen for auth sign-in event
  useEffect(() => {
    const handleSignIn = () => {
      if (user) {
        // Process any queued operations first, then full sync
        SyncService.processQueue(user.id)
          .then(() => SyncService.fullSync(user.id))
          .then(() => {
            setLastSyncTime(SyncService.getLastSyncTime());
            setLastError(null);
            updateQueueCount();
          })
          .catch(err => {
            log.error(err as Error);
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
      log.debug('Back online - processing sync queue...');

      // Process queued operations first
      const { processed, failed } = await SyncService.processQueue(user.id);
      if (processed > 0) {
        log.debug(`Processed ${processed} queued operations`);
      }
      if (failed > 0) {
        log.warn(`${failed} queued operations failed`);
      }

      // Then do a full sync to pull any updates
      await SyncService.fullSync(user.id)
        .then(() => {
          setLastSyncTime(SyncService.getLastSyncTime());
          setLastError(null);
        })
        .catch(err => {
          log.error(err as Error);
          setLastError(err.message || 'Sync failed');
        });

      updateQueueCount();
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [user, isConfigured, updateQueueCount]);

  // Sync when app goes to background or closes
  // This ensures data is saved before the user leaves the app
  useEffect(() => {
    if (!user || !isConfigured) return;

    const handleVisibilityChange = () => {
      if (document.hidden && navigator.onLine) {
        log.debug('App going to background - processing sync queue...');
        SyncService.processQueue(user.id).catch(err => {
          log.error(err as Error, { context: 'visibilitychange sync' });
        });
      }
    };

    const handleBeforeUnload = () => {
      if (navigator.onLine) {
        log.debug('Page unloading - processing sync queue...');
        // Use synchronous approach for beforeunload
        // Note: This may not complete if the page closes too quickly,
        // but it gives the best chance of syncing
        SyncService.processQueue(user.id).catch(err => {
          log.error(err as Error, { context: 'beforeunload sync' });
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [user, isConfigured]);

  // Periodic sync every 5 minutes when online
  useEffect(() => {
    if (!user || !isConfigured) return;

    const interval = setInterval(
      () => {
        if (navigator.onLine && status !== 'syncing') {
          SyncService.fullSync(user.id)
            .then(() => {
              setLastSyncTime(SyncService.getLastSyncTime());
              setLastError(null);
              updateQueueCount();
            })
            .catch(err => {
              log.error(err as Error);
              setLastError(err.message || 'Sync failed');
            });
        }
      },
      5 * 60 * 1000
    ); // 5 minutes

    return () => clearInterval(interval);
  }, [user, isConfigured, status, updateQueueCount]);

  // Manual sync function
  const sync = useCallback(async () => {
    if (!user || !isConfigured || isSyncingRef.current) return;

    isSyncingRef.current = true;
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
      log.error(err as Error);
      setLastError(err instanceof Error ? err.message : 'Sync failed');
    } finally {
      isSyncingRef.current = false;
      setIsSyncing(false);
    }
  }, [user, isConfigured, updateQueueCount]);

  return (
    <SyncContext.Provider value={{ status, lastSyncTime, lastError, sync, isSyncing, queueCount }}>
      {children}
    </SyncContext.Provider>
  );
}
