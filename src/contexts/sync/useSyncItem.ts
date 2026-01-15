import { useCallback } from 'react';
import { SyncService } from '@/services/syncService';
import { useAuth } from '../auth';

export function useSyncItem() {
  const { user, isConfigured } = useAuth();

  const syncItem = useCallback(
    async (
      table:
        | 'exercises'
        | 'max_records'
        | 'completed_sets'
        | 'cycles'
        | 'scheduled_workouts'
        | 'user_preferences',
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
    ): Promise<boolean> => {
      if (user && isConfigured) {
        return await SyncService.deleteItem(table, id, user.id);
      }
      return false;
    },
    [user, isConfigured]
  );

  const hardDeleteItem = useCallback(
    async (
      table: 'exercises' | 'max_records' | 'completed_sets' | 'cycles' | 'scheduled_workouts',
      id: string
    ): Promise<boolean> => {
      if (user && isConfigured) {
        return await SyncService.hardDeleteItem(table, id, user.id);
      }
      return false;
    },
    [user, isConfigured]
  );

  return { syncItem, deleteItem, hardDeleteItem };
}
