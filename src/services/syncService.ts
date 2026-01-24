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
      await this.pullFromCloud(userId);

      // Then push local changes
      await this.pushToCloud(userId);

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
  async pullFromCloud(userId: string) {
    // Fetch all user data from Supabase
    const [
      { data: exercises },
      { data: maxRecords },
      { data: completedSets },
      { data: cycles },
      { data: scheduledWorkouts },
      { data: userPreferences },
    ] = await Promise.all([
      supabase.from('exercises').select('*').eq('user_id', userId).is('deleted_at', null),
      supabase.from('max_records').select('*').eq('user_id', userId).is('deleted_at', null),
      supabase.from('completed_sets').select('*').eq('user_id', userId).is('deleted_at', null),
      supabase.from('cycles').select('*').eq('user_id', userId).is('deleted_at', null),
      supabase.from('scheduled_workouts').select('*').eq('user_id', userId).is('deleted_at', null),
      supabase.from('user_preferences').select('*').eq('user_id', userId),
    ]);

    // Merge exercises
    if (exercises) {
      for (const remote of exercises as RemoteExercise[]) {
        const local = await db.exercises.get(remote.id);
        if (!local || isAfter(remote.updated_at, local.updatedAt)) {
          await db.exercises.put(remoteToLocalExercise(remote));
        }
      }
    }

    // Merge max records
    if (maxRecords) {
      for (const remote of maxRecords as RemoteMaxRecord[]) {
        const local = await db.maxRecords.get(remote.id);
        if (!local) {
          await db.maxRecords.put(remoteToLocalMaxRecord(remote));
        }
      }
    }

    // Merge completed sets
    if (completedSets) {
      for (const remote of completedSets as RemoteCompletedSet[]) {
        const local = await db.completedSets.get(remote.id);
        if (!local) {
          await db.completedSets.put(remoteToLocalCompletedSet(remote));
        }
      }
    }

    // Merge cycles
    if (cycles) {
      for (const remote of cycles as RemoteCycle[]) {
        const local = await db.cycles.get(remote.id);
        if (!local || isAfter(remote.updated_at, local.updatedAt)) {
          await db.cycles.put(remoteToLocalCycle(remote));
        }
      }
    }

    // Merge scheduled workouts
    if (scheduledWorkouts) {
      // Build a map of existing cycleId:sequenceNumber combinations to prevent duplicates
      // Map stores the local workout ID for each key, so we can compare
      const localWorkouts = await db.scheduledWorkouts.toArray();
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
        const local = await db.scheduledWorkouts.get(remote.id);

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
            await db.scheduledWorkouts.put(remoteToLocalScheduledWorkout(remote));
            existingWorkoutsByKey.set(remoteKey, remoteToLocalScheduledWorkout(remote));
            continue;
          } else {
            // Both have same warmup status - prefer local (don't overwrite with cloud version)
            log.debug(`Skipping remote workout ${remote.id} - keeping local ${existingLocal.id}`);
            continue;
          }
        }

        if (
          !local ||
          (remote.completed_at &&
            (!local.completedAt || isAfter(remote.completed_at, local.completedAt)))
        ) {
          const converted = remoteToLocalScheduledWorkout(remote);
          await db.scheduledWorkouts.put(converted);
          // Track this workout
          existingWorkoutsByKey.set(remoteKey, converted);
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
      for (const item of deletedExercises as { id: string }[]) {
        await db.exercises.delete(item.id);
      }
    }
    if (deletedMaxRecords) {
      for (const item of deletedMaxRecords as { id: string }[]) {
        await db.maxRecords.delete(item.id);
      }
    }
    if (deletedCompletedSets) {
      for (const item of deletedCompletedSets as { id: string }[]) {
        await db.completedSets.delete(item.id);
      }
    }
    if (deletedCycles) {
      for (const item of deletedCycles as { id: string }[]) {
        await db.cycles.delete(item.id);
      }
    }
    if (deletedWorkouts) {
      for (const item of deletedWorkouts as { id: string }[]) {
        await db.scheduledWorkouts.delete(item.id);
      }
    }
  },

  // Push local data to Supabase
  async pushToCloud(userId: string) {
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
    if (exercises.length > 0) {
      const { error } = await supabase.from('exercises').upsert(
        exercises.map(e => localToRemoteExercise(e, userId)),
        { onConflict: 'id' }
      );
      if (error) log.error(error as Error);
    }

    // Upsert max records
    if (maxRecords.length > 0) {
      const { error } = await supabase.from('max_records').upsert(
        maxRecords.map(m => localToRemoteMaxRecord(m, userId)),
        { onConflict: 'id' }
      );
      if (error) log.error(error as Error);
    }

    // Upsert completed sets
    if (completedSets.length > 0) {
      const { error } = await supabase.from('completed_sets').upsert(
        completedSets.map(c => localToRemoteCompletedSet(c, userId)),
        { onConflict: 'id' }
      );
      if (error) log.error(error as Error);
    }

    // Upsert cycles
    if (cycles.length > 0) {
      const { error } = await supabase.from('cycles').upsert(
        cycles.map(c => localToRemoteCycle(c, userId)),
        { onConflict: 'id' }
      );
      if (error) log.error(error as Error);
    }

    // Upsert scheduled workouts
    if (scheduledWorkouts.length > 0) {
      const { error } = await supabase.from('scheduled_workouts').upsert(
        scheduledWorkouts.map(w => localToRemoteScheduledWorkout(w, userId)),
        { onConflict: 'id' }
      );
      if (error) log.error(error as Error);
    }

    // Upsert user preferences (singleton record)
    if (userPreferences.length > 0) {
      const { error } = await supabase
        .from('user_preferences')
        .upsert(localToRemoteUserPreferences(userPreferences[0], userId), { onConflict: 'id' });
      if (error) log.error(error as Error);
    }
  },

  // Sync a single item immediately (called after local writes)
  // If offline, queues the operation for later
  async syncItem(
    table:
      | 'exercises'
      | 'max_records'
      | 'completed_sets'
      | 'cycles'
      | 'scheduled_workouts'
      | 'user_preferences',
    item: unknown,
    userId: string
  ) {
    if (!isSupabaseConfigured()) return;

    // If offline, queue for later
    if (!this.isOnline()) {
      await this.queueOperation(table, 'upsert', item);
      return;
    }

    try {
      let remoteItem;
      switch (table) {
        case 'exercises':
          remoteItem = localToRemoteExercise(item as Exercise, userId);
          break;
        case 'max_records':
          remoteItem = localToRemoteMaxRecord(item as MaxRecord, userId);
          break;
        case 'completed_sets':
          remoteItem = localToRemoteCompletedSet(item as CompletedSet, userId);
          break;
        case 'cycles':
          remoteItem = localToRemoteCycle(item as Cycle, userId);
          break;
        case 'scheduled_workouts':
          remoteItem = localToRemoteScheduledWorkout(item as ScheduledWorkout, userId);
          break;
        case 'user_preferences':
          remoteItem = localToRemoteUserPreferences(item as UserPreferences, userId);
          break;
      }

      await supabase.from(table).upsert(remoteItem, { onConflict: 'id' });
    } catch (error) {
      log.error(error as Error, { operation: 'sync', table });
      // Queue for retry on network errors
      if (this.isNetworkError(error)) {
        await this.queueOperation(table, 'upsert', item);
      }
    }
  },

  // Soft delete an item in cloud
  async deleteItem(
    table: 'exercises' | 'max_records' | 'completed_sets' | 'cycles' | 'scheduled_workouts',
    id: string,
    userId: string
  ): Promise<boolean> {
    if (!isSupabaseConfigured()) return false;

    // If offline, queue for later
    if (!this.isOnline()) {
      await this.queueOperation(table, 'delete', { id });
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
      // Queue for retry on network errors
      if (this.isNetworkError(error)) {
        await this.queueOperation(table, 'delete', { id });
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
      // Can't hard delete while offline - soft delete instead
      await this.queueOperation(table, 'delete', { id });
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
  async queueOperation(
    table:
      | 'exercises'
      | 'max_records'
      | 'completed_sets'
      | 'cycles'
      | 'scheduled_workouts'
      | 'user_preferences',
    operation: 'upsert' | 'delete',
    item: unknown
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
      });
    } else {
      // Add new queue item
      await db.syncQueue.add({
        id: generateId(),
        table,
        operation,
        itemId,
        data: item,
        createdAt: now(),
        retryCount: 0,
      });
    }

    log.debug(`Queued ${operation} for ${table}:${itemId}`);
  },

  // Process queued operations (call when back online)
  async processQueue(
    userId: string
  ): Promise<{ processed: number; failed: number; skipped: number }> {
    if (!isSupabaseConfigured() || !this.isOnline()) {
      return { processed: 0, failed: 0, skipped: 0 };
    }

    const queuedItems = await db.syncQueue.orderBy('createdAt').toArray();
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
          let remoteItem;
          switch (queueItem.table) {
            case 'exercises':
              remoteItem = localToRemoteExercise(queueItem.data as Exercise, userId);
              break;
            case 'max_records':
              remoteItem = localToRemoteMaxRecord(queueItem.data as MaxRecord, userId);
              break;
            case 'completed_sets':
              remoteItem = localToRemoteCompletedSet(queueItem.data as CompletedSet, userId);
              break;
            case 'cycles':
              remoteItem = localToRemoteCycle(queueItem.data as Cycle, userId);
              break;
            case 'scheduled_workouts':
              remoteItem = localToRemoteScheduledWorkout(
                queueItem.data as ScheduledWorkout,
                userId
              );
              break;
            case 'user_preferences':
              remoteItem = localToRemoteUserPreferences(queueItem.data as UserPreferences, userId);
              break;
          }
          await supabase.from(queueItem.table).upsert(remoteItem, { onConflict: 'id' });
        } else if (queueItem.operation === 'delete') {
          await supabase
            .from(queueItem.table)
            .update({ deleted_at: toISOString(now()) })
            .eq('id', queueItem.itemId)
            .eq('user_id', userId);
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
