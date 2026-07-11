import { useEffect, useState, useCallback, useMemo, useRef, type ReactNode } from 'react';
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

  // Reset sync state when user changes (login/logout)
  // This ensures we wait for sync before showing content for new users
  useEffect(() => {
    setLastSyncTime(null);
    setLastError(null);
  }, [user?.id]);

  // Reset sync state immediately when sign-out starts
  // This prevents health disclaimer flash during logout
  useEffect(() => {
    const handleSigningOut = () => {
      setLastSyncTime(null);
      setLastError(null);
    };

    window.addEventListener('auth-signing-out', handleSigningOut);
    return () => window.removeEventListener('auth-signing-out', handleSigningOut);
  }, []);

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

  // Single guarded sync entrypoint used by every trigger (initial sign-in,
  // back-online, periodic interval, manual). The ref guard ensures only one
  // chain runs at a time, no matter how many triggers fire together.
  // Keyed on user.id (not the user object) so token refreshes don't re-sync.
  const userId = user?.id;
  const runSyncChain = useCallback(
    async (opts?: { cleanupOrphans?: boolean }) => {
      if (!userId || !isConfigured || isSyncingRef.current) return;

      isSyncingRef.current = true;
      setIsSyncing(true);
      setLastError(null);
      try {
        if (opts?.cleanupOrphans) {
          // Clean up orphaned queue items from other users first
          await SyncService.cleanupOrphanedQueueItems(userId);
        }
        // Process queued operations, then full sync
        await SyncService.processQueue(userId);
        await SyncService.fullSync(userId);
        setLastSyncTime(SyncService.getLastSyncTime());
      } catch (err: unknown) {
        log.error(err as Error);
        setLastError(err instanceof Error ? err.message : 'Sync failed');
      } finally {
        isSyncingRef.current = false;
        setIsSyncing(false);
        void updateQueueCount();
      }
    },
    [userId, isConfigured, updateQueueCount]
  );

  // Initial sync on sign in (runSyncChain's identity changes when the user
  // signs in or out, so this effect fires once per sign-in)
  useEffect(() => {
    void runSyncChain({ cleanupOrphans: true });
  }, [runSyncChain]);

  // Process queue and sync when coming back online
  useEffect(() => {
    const handleOnline = () => {
      log.debug('Back online - running sync chain...');
      void runSyncChain();
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [runSyncChain]);

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

  // Periodic sync every 5 minutes when online. Depends only on runSyncChain
  // (stable across status changes) so the interval isn't reset by each sync.
  useEffect(() => {
    const interval = setInterval(
      () => {
        if (navigator.onLine) {
          void runSyncChain();
        }
      },
      5 * 60 * 1000
    ); // 5 minutes

    return () => clearInterval(interval);
  }, [runSyncChain]);

  // Manual sync function
  const sync = useCallback(() => runSyncChain(), [runSyncChain]);

  const value = useMemo(
    () => ({ status, lastSyncTime, lastError, sync, isSyncing, queueCount }),
    [status, lastSyncTime, lastError, sync, isSyncing, queueCount]
  );

  return <SyncContext.Provider value={value}>{children}</SyncContext.Provider>;
}
