import { supabase, isSupabaseConfigured } from '@/data/supabase';
import { db, generateId } from '@/data/db';
import type {
  Exercise,
  MaxRecord,
  CompletedSet,
  Cycle,
  ScheduledWorkout,
  ScheduledSet,
  UserPreferences,
} from '@/types';
import { now, toISOString, isAfter } from '@/utils/dateUtils';
import { createScopedLogger } from '@/utils/logger';
import { MAX_RETRY_COUNT, calculateRetryDelay } from '@/constants';
import type {
  RemoteExercise,
  RemoteMaxRecord,
  RemoteCompletedSet,
  RemoteCycle,
  RemoteScheduledWorkout,
  RemoteUserPreferences,
  SyncTableName,
} from './sync/types';
import {
  remoteToLocalExercise,
  remoteToLocalMaxRecord,
  remoteToLocalCompletedSet,
  remoteToLocalCycle,
  remoteToLocalScheduledWorkout,
  remoteToLocalUserPreferences,
  localToRemoteExercise,
  localToRemoteMaxRecord,
  localToRemoteCompletedSet,
  localToRemoteCycle,
  localToRemoteScheduledWorkout,
  localToRemoteUserPreferences,
} from './sync/transformers';

const log = createScopedLogger('SyncService');

// Transform local item to remote format based on table type
function transformLocalToRemote(table: SyncTableName, item: unknown, userId: string) {
  switch (table) {
    case 'exercises':
      return localToRemoteExercise(item as Exercise, userId);
    case 'max_records':
      return localToRemoteMaxRecord(item as MaxRecord, userId);
    case 'completed_sets':
      return localToRemoteCompletedSet(item as CompletedSet, userId);
    case 'cycles':
      return localToRemoteCycle(item as Cycle, userId);
    case 'scheduled_workouts':
      return localToRemoteScheduledWorkout(item as ScheduledWorkout, userId);
    case 'user_preferences':
      return localToRemoteUserPreferences(item as UserPreferences, userId);
  }
}

// Track sync status
export type SyncStatus = 'idle' | 'syncing' | 'error' | 'offline';

let currentSyncStatus: SyncStatus = 'idle';
let lastSyncTime: Date | null = null;
let syncListeners: ((status: SyncStatus) => void)[] = [];

export const SyncService = {
  // Subscribe to sync status changes
  onStatusChange(callback: (status: SyncStatus) => void) {
    syncListeners.push(callback);
    return () => {
      syncListeners = syncListeners.filter(cb => cb !== callback);
    };
  },

  getStatus() {
    return currentSyncStatus;
  },

  getLastSyncTime() {
    return lastSyncTime;
  },

  setStatus(status: SyncStatus) {
    currentSyncStatus = status;
    syncListeners.forEach(cb => cb(status));
  },

  // Check if online
  isOnline() {
    return navigator.onLine;
  },

  // Full sync - pull from cloud and push local changes
  async fullSync(userId: string): Promise<{ success: boolean; error?: string }> {
    if (!isSupabaseConfigured()) {
      return { success: false, error: 'Supabase not configured' };
    }

    if (!this.isOnline()) {
      this.setStatus('offline');
      return { success: false, error: 'Offline' };
    }

    this.setStatus('syncing');

    try {
      // Pull from cloud first
      const { failedTables } = await this.pullFromCloud(userId);

      if (failedTables.length >= 6) {
        throw new Error('Sync pull failed for all tables');
      }

      // Then push local changes, skipping tables whose pull failed so we
      // don't overwrite the cloud with potentially stale local data
      await this.pushToCloud(userId, failedTables);

      lastSyncTime = now();
      this.setStatus('idle');
      return { success: true };
    } catch (error) {
      log.error(error as Error);
      this.setStatus('error');
      return { success: false, error: String(error) };
    }
  },

  // Pull data from Supabase and merge with local
  // Returns the tables whose pull failed so pushToCloud can skip them
  async pullFromCloud(userId: string): Promise<{ failedTables: SyncTableName[] }> {
    // Fetch all user data from Supabase
    const [
      exercisesResult,
      maxRecordsResult,
      completedSetsResult,
      cyclesResult,
      scheduledWorkoutsResult,
      userPreferencesResult,
    ] = await Promise.all([
      supabase.from('exercises').select('*').eq('user_id', userId).is('deleted_at', null),
      supabase.from('max_records').select('*').eq('user_id', userId).is('deleted_at', null),
      supabase.from('completed_sets').select('*').eq('user_id', userId).is('deleted_at', null),
      supabase.from('cycles').select('*').eq('user_id', userId).is('deleted_at', null),
      supabase.from('scheduled_workouts').select('*').eq('user_id', userId).is('deleted_at', null),
      supabase.from('user_preferences').select('*').eq('user_id', userId),
    ]);

    // Log errors so we can debug if pull fails, and track failed tables so
    // the subsequent push doesn't overwrite the cloud with stale local data
    const failedTables: SyncTableName[] = [];
    const pullResults: Array<{ table: SyncTableName; error: { message: string } | null }> = [
      { table: 'exercises', error: exercisesResult.error },
      { table: 'max_records', error: maxRecordsResult.error },
      { table: 'completed_sets', error: completedSetsResult.error },
      { table: 'cycles', error: cyclesResult.error },
      { table: 'scheduled_workouts', error: scheduledWorkoutsResult.error },
      { table: 'user_preferences', error: userPreferencesResult.error },
    ];
    for (const { table, error } of pullResults) {
      if (error) {
        log.error(new Error(error.message), { table, operation: 'pull' });
        failedTables.push(table);
      }
    }

    const exercises = exercisesResult.data;
    const maxRecords = maxRecordsResult.data;
    const completedSets = completedSetsResult.data;
    const cycles = cyclesResult.data;
    const scheduledWorkouts = scheduledWorkoutsResult.data;
    const userPreferences = userPreferencesResult.data;

    // Merge exercises (last-write-wins on updatedAt)
    if (exercises) {
      const remotes = exercises as RemoteExercise[];
      const locals = await db.exercises.bulkGet(remotes.map(r => r.id));
      const toWrite = remotes
        .filter((remote, i) => {
          const local = locals[i];
          return !local || isAfter(remote.updated_at, local.updatedAt);
        })
        .map(remoteToLocalExercise);
      if (toWrite.length > 0) await db.exercises.bulkPut(toWrite);
    }

    // Merge max records (last-write-wins on updatedAt)
    // Null guards: remote updated_at is null until Supabase migration 017 runs;
    // a null remote timestamp never overwrites an existing local record
    if (maxRecords) {
      const remotes = maxRecords as RemoteMaxRecord[];
      const locals = await db.maxRecords.bulkGet(remotes.map(r => r.id));
      const toWrite = remotes
        .filter((remote, i) => {
          const local = locals[i];
          if (!local) return true;
          return Boolean(
            remote.updated_at && (!local.updatedAt || isAfter(remote.updated_at, local.updatedAt))
          );
        })
        .map(remoteToLocalMaxRecord);
      if (toWrite.length > 0) await db.maxRecords.bulkPut(toWrite);
    }

    // Merge completed sets (last-write-wins on updatedAt, same null guards)
    if (completedSets) {
      const remotes = completedSets as RemoteCompletedSet[];
      const locals = await db.completedSets.bulkGet(remotes.map(r => r.id));
      const toWrite = remotes
        .filter((remote, i) => {
          const local = locals[i];
          if (!local) return true;
          return Boolean(
            remote.updated_at && (!local.updatedAt || isAfter(remote.updated_at, local.updatedAt))
          );
        })
        .map(remoteToLocalCompletedSet);
      if (toWrite.length > 0) await db.completedSets.bulkPut(toWrite);
    }

    // Merge cycles (last-write-wins on updatedAt)
    if (cycles) {
      const remotes = cycles as RemoteCycle[];
      const locals = await db.cycles.bulkGet(remotes.map(r => r.id));
      const toWrite = remotes
        .filter((remote, i) => {
          const local = locals[i];
          return !local || isAfter(remote.updated_at, local.updatedAt);
        })
        .map(remoteToLocalCycle);
      if (toWrite.length > 0) await db.cycles.bulkPut(toWrite);
    }

    // Merge scheduled workouts
    if (scheduledWorkouts) {
      // Build a map of existing cycleId:sequenceNumber combinations to prevent duplicates
      // Map stores the local workout ID for each key, so we can compare
      const localWorkouts = await db.scheduledWorkouts.toArray();
      const localWorkoutsById = new Map<string, ScheduledWorkout>(
        localWorkouts.map(w => [w.id, w])
      );
      const existingWorkoutsByKey = new Map<string, ScheduledWorkout>();

      for (const w of localWorkouts) {
        // Skip ad-hoc workouts - they don't have sequence conflicts
        if (w.isAdHoc) continue;
        // Skip workouts without a valid sequence number
        if (w.sequenceNumber === undefined || w.sequenceNumber === null) continue;

        const key = `${w.cycleId}:${w.sequenceNumber}`;
        existingWorkoutsByKey.set(key, w);
      }

      for (const remote of scheduledWorkouts as RemoteScheduledWorkout[]) {
        const local = localWorkoutsById.get(remote.id);

        // Skip if remote has no sequence number (shouldn't happen but be defensive)
        if (remote.sequence_number === undefined || remote.sequence_number === null) {
          continue;
        }

        // Check if this would create a duplicate (same cycle + sequence but different ID)
        const remoteKey = `${remote.cycle_id}:${remote.sequence_number}`;
        const existingLocal = existingWorkoutsByKey.get(remoteKey);
        const wouldCreateDuplicate = !local && existingLocal !== undefined;

        if (wouldCreateDuplicate && existingLocal) {
          // We have a local workout with the same cycle/sequence but different ID
          // Compare and decide which to keep
          const localHasWarmups = existingLocal.scheduledSets.some(s => s.isWarmup);
          const remoteHasWarmups =
            (remote.scheduled_sets as ScheduledSet[])?.some(s => s.isWarmup) ?? false;

          if (localHasWarmups && !remoteHasWarmups) {
            // Local has warmups, remote doesn't - skip remote, keep local
            log.debug(
              `Skipping remote workout ${remote.id} - local ${existingLocal.id} has warmups`
            );
            continue;
          } else if (!localHasWarmups && remoteHasWarmups) {
            // Remote has warmups, local doesn't - replace local with remote
            log.debug(
              `Replacing local workout ${existingLocal.id} with remote ${remote.id} - remote has warmups`
            );
            await db.scheduledWorkouts.delete(existingLocal.id);
            const converted = remoteToLocalScheduledWorkout(remote);
            await db.scheduledWorkouts.put(converted);
            existingWorkoutsByKey.set(remoteKey, converted);
            localWorkoutsById.delete(existingLocal.id);
            localWorkoutsById.set(converted.id, converted);
            continue;
          } else {
            // Both have same warmup status - prefer local (don't overwrite with cloud version)
            log.debug(`Skipping remote workout ${remote.id} - keeping local ${existingLocal.id}`);
            continue;
          }
        }

        // Use updatedAt for last-write-wins conflict resolution (like cycles)
        // If local has no updatedAt, treat remote as newer
        if (!local || !local.updatedAt || isAfter(remote.updated_at, local.updatedAt)) {
          const converted = remoteToLocalScheduledWorkout(remote);
          await db.scheduledWorkouts.put(converted);
          // Track this workout
          existingWorkoutsByKey.set(remoteKey, converted);
          localWorkoutsById.set(converted.id, converted);
        }
      }
    }

    // Merge user preferences (singleton - take the most recent)
    if (userPreferences && userPreferences.length > 0) {
      const remote = userPreferences[0] as RemoteUserPreferences;
      const localPrefs = await db.userPreferences.toArray();
      const local = localPrefs.length > 0 ? localPrefs[0] : null;

      if (!local || isAfter(remote.updated_at, local.updatedAt)) {
        // Clear existing preferences and put the cloud version
        await db.userPreferences.clear();
        await db.userPreferences.put(remoteToLocalUserPreferences(remote));
        // Update the local ID reference
        localStorage.setItem('ascend-preferences-id', remote.id);
      }
    }

    // Handle deletions - fetch deleted items and remove locally
    const [
      { data: deletedExercises },
      { data: deletedMaxRecords },
      { data: deletedCompletedSets },
      { data: deletedCycles },
      { data: deletedWorkouts },
    ] = await Promise.all([
      supabase.from('exercises').select('id').eq('user_id', userId).not('deleted_at', 'is', null),
      supabase.from('max_records').select('id').eq('user_id', userId).not('deleted_at', 'is', null),
      supabase
        .from('completed_sets')
        .select('id')
        .eq('user_id', userId)
        .not('deleted_at', 'is', null),
      supabase.from('cycles').select('id').eq('user_id', userId).not('deleted_at', 'is', null),
      supabase
        .from('scheduled_workouts')
        .select('id')
        .eq('user_id', userId)
        .not('deleted_at', 'is', null),
    ]);

    if (deletedExercises) {
      await db.exercises.bulkDelete((deletedExercises as { id: string }[]).map(item => item.id));
    }
    if (deletedMaxRecords) {
      await db.maxRecords.bulkDelete((deletedMaxRecords as { id: string }[]).map(item => item.id));
    }
    if (deletedCompletedSets) {
      await db.completedSets.bulkDelete(
        (deletedCompletedSets as { id: string }[]).map(item => item.id)
      );
    }
    if (deletedCycles) {
      await db.cycles.bulkDelete((deletedCycles as { id: string }[]).map(item => item.id));
    }
    if (deletedWorkouts) {
      await db.scheduledWorkouts.bulkDelete(
        (deletedWorkouts as { id: string }[]).map(item => item.id)
      );
    }

    return { failedTables };
  },

  // Push local data to Supabase
  // skipTables: tables whose pull failed this cycle - skipped so stale local
  // data doesn't overwrite the cloud
  async pushToCloud(userId: string, skipTables: SyncTableName[] = []) {
    const skip = new Set<SyncTableName>(skipTables);
    const [exercises, maxRecords, completedSets, cycles, scheduledWorkouts, userPreferences] =
      await Promise.all([
        db.exercises.toArray(),
        db.maxRecords.toArray(),
        db.completedSets.toArray(),
        db.cycles.toArray(),
        db.scheduledWorkouts.toArray(),
        db.userPreferences.toArray(),
      ]);

    // Upsert exercises
    if (exercises.length > 0 && !skip.has('exercises')) {
      const { error } = await supabase.from('exercises').upsert(
        exercises.map(e => localToRemoteExercise(e, userId)),
        { onConflict: 'id' }
      );
      if (error)
        log.error(new Error(error.message), {
          table: 'exercises',
          operation: 'push',
          code: error.code,
        });
    }

    // Upsert max records
    if (maxRecords.length > 0 && !skip.has('max_records')) {
      const { error } = await supabase.from('max_records').upsert(
        maxRecords.map(m => localToRemoteMaxRecord(m, userId)),
        { onConflict: 'id' }
      );
      if (error)
        log.error(new Error(error.message), {
          table: 'max_records',
          operation: 'push',
          code: error.code,
        });
    }

    // Upsert completed sets
    if (completedSets.length > 0 && !skip.has('completed_sets')) {
      const { error } = await supabase.from('completed_sets').upsert(
        completedSets.map(c => localToRemoteCompletedSet(c, userId)),
        { onConflict: 'id' }
      );
      if (error)
        log.error(new Error(error.message), {
          table: 'completed_sets',
          operation: 'push',
          code: error.code,
        });
    }

    // Upsert cycles
    if (cycles.length > 0 && !skip.has('cycles')) {
      const { error } = await supabase.from('cycles').upsert(
        cycles.map(c => localToRemoteCycle(c, userId)),
        { onConflict: 'id' }
      );
      if (error)
        log.error(new Error(error.message), {
          table: 'cycles',
          operation: 'push',
          code: error.code,
        });
    }

    // Upsert scheduled workouts
    if (scheduledWorkouts.length > 0 && !skip.has('scheduled_workouts')) {
      const { error } = await supabase.from('scheduled_workouts').upsert(
        scheduledWorkouts.map(w => localToRemoteScheduledWorkout(w, userId)),
        { onConflict: 'id' }
      );
      if (error)
        log.error(new Error(error.message), {
          table: 'scheduled_workouts',
          operation: 'push',
          code: error.code,
        });
    }

    // Upsert user preferences (singleton record)
    if (userPreferences.length > 0 && !skip.has('user_preferences')) {
      const { error } = await supabase
        .from('user_preferences')
        .upsert(localToRemoteUserPreferences(userPreferences[0], userId), { onConflict: 'id' });
      if (error)
        log.error(new Error(error.message), {
          table: 'user_preferences',
          operation: 'push',
          code: error.code,
        });
    }
  },

  // Sync a single item immediately (called after local writes)
  // If offline, queues the operation for later
  async syncItem(table: SyncTableName, item: unknown, userId: string) {
    if (!isSupabaseConfigured()) return;

    // If offline, queue for later with userId for cross-logout preservation
    if (!this.isOnline()) {
      await this.queueOperation(table, 'upsert', item, userId);
      return;
    }

    try {
      const remoteItem = transformLocalToRemote(table, item, userId);
      const { error } = await supabase.from(table).upsert(remoteItem, { onConflict: 'id' });

      // CRITICAL: Supabase doesn't throw on DB errors - check response!
      // If there's an error, queue for retry so data isn't lost
      if (error) {
        log.error(new Error(error.message), { operation: 'sync', table, code: error.code });
        await this.queueOperation(table, 'upsert', item, userId);
      }
    } catch (error) {
      log.error(error as Error, { operation: 'sync', table });
      // Queue for retry on any error - the queue's retry cap and backoff bound
      // the cost, and dropping the write here would silently lose the change
      await this.queueOperation(table, 'upsert', item, userId);
    }
  },

  // Soft delete an item in cloud
  async deleteItem(
    table: 'exercises' | 'max_records' | 'completed_sets' | 'cycles' | 'scheduled_workouts',
    id: string,
    userId: string
  ): Promise<boolean> {
    if (!isSupabaseConfigured()) return false;

    // If offline, queue for later with userId for cross-logout preservation
    if (!this.isOnline()) {
      await this.queueOperation(table, 'delete', { id }, userId);
      return true; // Queued successfully
    }

    try {
      const { error, data } = await supabase
        .from(table)
        .update({ deleted_at: toISOString(now()) })
        .eq('id', id)
        .eq('user_id', userId)
        .select('id');

      if (error) {
        log.error(error as unknown as Error, { operation: 'delete', table, id });
        return false;
      }

      // Log if no rows were updated (item might not exist in cloud)
      if (!data || data.length === 0) {
        log.debug(`No rows updated for delete ${table}:${id} - item may not exist in cloud`);
      }

      return true;
    } catch (error) {
      log.error(error as Error, { operation: 'delete', table, id });
      // Queue for retry on network errors with userId
      if (this.isNetworkError(error)) {
        await this.queueOperation(table, 'delete', { id }, userId);
        return true; // Queued for retry
      }
      return false;
    }
  },

  // Hard delete an item from cloud (permanent, use for cleanup)
  async hardDeleteItem(
    table: 'exercises' | 'max_records' | 'completed_sets' | 'cycles' | 'scheduled_workouts',
    id: string,
    userId: string
  ): Promise<boolean> {
    if (!isSupabaseConfigured()) return false;

    if (!this.isOnline()) {
      // Queue the hard delete for when we're back online
      await this.queueOperation(table, 'hardDelete', { id }, userId);
      return true;
    }

    try {
      const { error } = await supabase.from(table).delete().eq('id', id).eq('user_id', userId);

      if (error) {
        log.error(error as unknown as Error, { operation: 'hardDelete', table, id });
        return false;
      }

      return true;
    } catch (error) {
      log.error(error as Error, { operation: 'hardDelete', table, id });
      return false;
    }
  },

  // Check if error is a network error
  isNetworkError(error: unknown): boolean {
    if (error instanceof Error) {
      return (
        error.message.includes('fetch') ||
        error.message.includes('network') ||
        error.message.includes('Failed to fetch') ||
        error.name === 'TypeError'
      );
    }
    return false;
  },

  // Queue an operation for later sync
  // userId is stored to enable cross-logout data preservation
  async queueOperation(
    table: SyncTableName,
    operation: 'upsert' | 'delete' | 'hardDelete',
    item: unknown,
    userId?: string
  ) {
    const itemId = (item as { id: string }).id;

    // Check if already queued - update existing instead of duplicating
    const existing = await db.syncQueue.where(['table', 'itemId']).equals([table, itemId]).first();

    if (existing) {
      // Update existing queue item with latest data
      await db.syncQueue.update(existing.id, {
        data: item,
        operation,
        createdAt: now(),
        userId: userId ?? existing.userId, // Preserve userId if not provided
      });
    } else {
      // Add new queue item with userId for cross-logout preservation
      await db.syncQueue.add({
        id: generateId(),
        table,
        operation,
        itemId,
        data: item,
        createdAt: now(),
        retryCount: 0,
        userId: userId ?? null,
      });
    }

    log.debug(
      `Queued ${operation} for ${table}:${itemId}${userId ? ` (user: ${userId.substring(0, 8)}...)` : ''}`
    );
  },

  // Process queued operations (call when back online)
  // Only processes items belonging to the specified userId
  async processQueue(
    userId: string
  ): Promise<{ processed: number; failed: number; skipped: number }> {
    if (!isSupabaseConfigured() || !this.isOnline()) {
      return { processed: 0, failed: 0, skipped: 0 };
    }

    const allQueuedItems = await db.syncQueue.orderBy('createdAt').toArray();
    // Filter to only process items belonging to this user (or items with no userId for backwards compat)
    const queuedItems = allQueuedItems.filter(
      item => item.userId === userId || item.userId === null || item.userId === undefined
    );

    let processed = 0;
    let failed = 0;
    let skipped = 0;
    const currentTime = now();

    for (const queueItem of queuedItems) {
      // Skip items that haven't reached their retry time yet (exponential backoff)
      if (queueItem.nextRetryAt && queueItem.nextRetryAt > currentTime) {
        skipped++;
        continue;
      }

      try {
        if (queueItem.operation === 'upsert' && queueItem.data) {
          const remoteItem = transformLocalToRemote(queueItem.table, queueItem.data, userId);
          const { error } = await supabase
            .from(queueItem.table)
            .upsert(remoteItem, { onConflict: 'id' });
          // Check for Supabase errors - they don't throw!
          if (error) {
            throw new Error(error.message);
          }
        } else if (queueItem.operation === 'delete') {
          const { error } = await supabase
            .from(queueItem.table)
            .update({ deleted_at: toISOString(now()) })
            .eq('id', queueItem.itemId)
            .eq('user_id', userId);
          if (error) {
            throw new Error(error.message);
          }
        } else if (queueItem.operation === 'hardDelete') {
          const { error } = await supabase
            .from(queueItem.table)
            .delete()
            .eq('id', queueItem.itemId)
            .eq('user_id', userId);
          if (error) {
            throw new Error(error.message);
          }
        }

        // Successfully processed - remove from queue
        await db.syncQueue.delete(queueItem.id);
        processed++;
      } catch (error) {
        log.error(error as Error, { queueItemId: queueItem.id });

        // Increment retry count and calculate exponential backoff
        const newRetryCount = queueItem.retryCount + 1;
        if (newRetryCount >= MAX_RETRY_COUNT) {
          // Give up after max retries
          await db.syncQueue.delete(queueItem.id);
          log.warn(`Giving up on queue item ${queueItem.id} after ${newRetryCount} retries`);
        } else {
          // Exponential backoff with configured delays
          const delayMs = calculateRetryDelay(newRetryCount);
          const nextRetryAt = new Date(currentTime.getTime() + delayMs);
          await db.syncQueue.update(queueItem.id, {
            retryCount: newRetryCount,
            nextRetryAt,
          });
          log.debug(
            `Queue item ${queueItem.id} will retry in ${delayMs / 1000}s (attempt ${newRetryCount}/${MAX_RETRY_COUNT})`
          );
        }
        failed++;
      }
    }

    if (processed > 0 || failed > 0) {
      log.debug(
        `Queue processed: ${processed} successful, ${failed} failed, ${skipped} waiting for retry`
      );
    }
    return { processed, failed, skipped };
  },

  // Clean up orphaned queue items from other users
  // Called on login to remove items that can't be synced (belong to a different user)
  async cleanupOrphanedQueueItems(currentUserId: string): Promise<number> {
    const allItems = await db.syncQueue.toArray();
    const orphanedItems = allItems.filter(
      item => item.userId !== null && item.userId !== undefined && item.userId !== currentUserId
    );

    if (orphanedItems.length > 0) {
      log.debug(`Cleaning up ${orphanedItems.length} orphaned queue items from other users`);
      for (const item of orphanedItems) {
        await db.syncQueue.delete(item.id);
      }
    }

    return orphanedItems.length;
  },

  // Get queue count (for UI display)
  async getQueueCount(): Promise<number> {
    return db.syncQueue.count();
  },
};

// Set up online/offline listeners
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    SyncService.setStatus('idle');
  });

  window.addEventListener('offline', () => {
    SyncService.setStatus('offline');
  });
}
