import type { SyncStatus } from '@/services/syncService';

export interface SyncContextType {
  status: SyncStatus;
  lastSyncTime: Date | null;
  lastError: string | null;
  sync: () => Promise<void>;
  isSyncing: boolean;
  queueCount: number;
}
