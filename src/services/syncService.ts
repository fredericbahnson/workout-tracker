import { supabase, isSupabaseConfigured } from '../data/supabase';
import { db } from '../data/db';
import type { Exercise, MaxRecord, CompletedSet, Cycle, ScheduledWorkout } from '../types';

// Remote data types (from Supabase)
interface RemoteExercise {
  id: string;
  user_id: string;
  name: string;
  type: string;
  mode: string;
  measurement_type: string | null;
  notes: string;
  custom_parameters: unknown;
  default_conditioning_reps: number | null;
  default_conditioning_time: number | null;
  weight_enabled: boolean;
  default_weight: number | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

interface RemoteMaxRecord {
  id: string;
  user_id: string;
  exercise_id: string;
  max_reps: number | null;
  max_time: number | null;
  weight: number | null;
  notes: string;
  recorded_at: string;
  deleted_at: string | null;
}

interface RemoteCompletedSet {
  id: string;
  user_id: string;
  scheduled_set_id: string | null;
  scheduled_workout_id: string | null;
  exercise_id: string;
  target_reps: number;
  actual_reps: number;
  weight: number | null;
  completed_at: string;
  notes: string;
  parameters: unknown;
  deleted_at: string | null;
}

interface RemoteCycle {
  id: string;
  user_id: string;
  name: string;
  cycle_type: string;
  previous_cycle_id: string | null;
  start_date: string;
  number_of_weeks: number;
  workout_days_per_week: number;
  weekly_set_goals: unknown;
  groups: unknown;
  group_rotation: unknown;
  rfem_rotation: unknown;
  conditioning_weekly_rep_increment: number;
  status: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

interface RemoteScheduledWorkout {
  id: string;
  user_id: string;
  cycle_id: string;
  sequence_number: number;
  week_number: number;
  day_in_week: number;
  group_id: string;
  rfem: number;
  scheduled_sets: unknown;
  status: string;
  completed_at: string | null;
  deleted_at: string | null;
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
      await this.pullFromCloud(userId);
      
      // Then push local changes
      await this.pushToCloud(userId);
      
      lastSyncTime = new Date();
      this.setStatus('idle');
      return { success: true };
    } catch (error) {
      console.error('Sync error:', error);
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
      { data: scheduledWorkouts }
    ] = await Promise.all([
      supabase.from('exercises').select('*').eq('user_id', userId).is('deleted_at', null),
      supabase.from('max_records').select('*').eq('user_id', userId).is('deleted_at', null),
      supabase.from('completed_sets').select('*').eq('user_id', userId).is('deleted_at', null),
      supabase.from('cycles').select('*').eq('user_id', userId).is('deleted_at', null),
      supabase.from('scheduled_workouts').select('*').eq('user_id', userId).is('deleted_at', null),
    ]);

    // Merge exercises
    if (exercises) {
      for (const remote of exercises as RemoteExercise[]) {
        const local = await db.exercises.get(remote.id);
        if (!local || new Date(remote.updated_at) > new Date(local.updatedAt)) {
          await db.exercises.put(this.remoteToLocalExercise(remote));
        }
      }
    }

    // Merge max records
    if (maxRecords) {
      for (const remote of maxRecords as RemoteMaxRecord[]) {
        const local = await db.maxRecords.get(remote.id);
        if (!local) {
          await db.maxRecords.put(this.remoteToLocalMaxRecord(remote));
        }
      }
    }

    // Merge completed sets
    if (completedSets) {
      for (const remote of completedSets as RemoteCompletedSet[]) {
        const local = await db.completedSets.get(remote.id);
        if (!local) {
          await db.completedSets.put(this.remoteToLocalCompletedSet(remote));
        }
      }
    }

    // Merge cycles
    if (cycles) {
      for (const remote of cycles as RemoteCycle[]) {
        const local = await db.cycles.get(remote.id);
        if (!local || new Date(remote.updated_at) > new Date(local.updatedAt)) {
          await db.cycles.put(this.remoteToLocalCycle(remote));
        }
      }
    }

    // Merge scheduled workouts
    if (scheduledWorkouts) {
      for (const remote of scheduledWorkouts as RemoteScheduledWorkout[]) {
        const local = await db.scheduledWorkouts.get(remote.id);
        if (!local || (remote.completed_at && (!local.completedAt || new Date(remote.completed_at) > new Date(local.completedAt)))) {
          await db.scheduledWorkouts.put(this.remoteToLocalScheduledWorkout(remote));
        }
      }
    }

    // Handle deletions - fetch deleted items and remove locally
    const [
      { data: deletedExercises },
      { data: deletedMaxRecords },
      { data: deletedCompletedSets },
      { data: deletedCycles },
      { data: deletedWorkouts }
    ] = await Promise.all([
      supabase.from('exercises').select('id').eq('user_id', userId).not('deleted_at', 'is', null),
      supabase.from('max_records').select('id').eq('user_id', userId).not('deleted_at', 'is', null),
      supabase.from('completed_sets').select('id').eq('user_id', userId).not('deleted_at', 'is', null),
      supabase.from('cycles').select('id').eq('user_id', userId).not('deleted_at', 'is', null),
      supabase.from('scheduled_workouts').select('id').eq('user_id', userId).not('deleted_at', 'is', null),
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
    const [exercises, maxRecords, completedSets, cycles, scheduledWorkouts] = await Promise.all([
      db.exercises.toArray(),
      db.maxRecords.toArray(),
      db.completedSets.toArray(),
      db.cycles.toArray(),
      db.scheduledWorkouts.toArray(),
    ]);

    // Upsert exercises
    if (exercises.length > 0) {
      const { error } = await supabase.from('exercises').upsert(
        exercises.map(e => this.localToRemoteExercise(e, userId)),
        { onConflict: 'id' }
      );
      if (error) console.error('Error syncing exercises:', error);
    }

    // Upsert max records
    if (maxRecords.length > 0) {
      const { error } = await supabase.from('max_records').upsert(
        maxRecords.map(m => this.localToRemoteMaxRecord(m, userId)),
        { onConflict: 'id' }
      );
      if (error) console.error('Error syncing max records:', error);
    }

    // Upsert completed sets
    if (completedSets.length > 0) {
      const { error } = await supabase.from('completed_sets').upsert(
        completedSets.map(c => this.localToRemoteCompletedSet(c, userId)),
        { onConflict: 'id' }
      );
      if (error) console.error('Error syncing completed sets:', error);
    }

    // Upsert cycles
    if (cycles.length > 0) {
      const { error } = await supabase.from('cycles').upsert(
        cycles.map(c => this.localToRemoteCycle(c, userId)),
        { onConflict: 'id' }
      );
      if (error) console.error('Error syncing cycles:', error);
    }

    // Upsert scheduled workouts
    if (scheduledWorkouts.length > 0) {
      const { error } = await supabase.from('scheduled_workouts').upsert(
        scheduledWorkouts.map(w => this.localToRemoteScheduledWorkout(w, userId)),
        { onConflict: 'id' }
      );
      if (error) console.error('Error syncing scheduled workouts:', error);
    }
  },

  // Sync a single item immediately (called after local writes)
  async syncItem(
    table: 'exercises' | 'max_records' | 'completed_sets' | 'cycles' | 'scheduled_workouts',
    item: unknown,
    userId: string
  ) {
    if (!isSupabaseConfigured() || !this.isOnline()) return;

    try {
      let remoteItem;
      switch (table) {
        case 'exercises':
          remoteItem = this.localToRemoteExercise(item as Exercise, userId);
          break;
        case 'max_records':
          remoteItem = this.localToRemoteMaxRecord(item as MaxRecord, userId);
          break;
        case 'completed_sets':
          remoteItem = this.localToRemoteCompletedSet(item as CompletedSet, userId);
          break;
        case 'cycles':
          remoteItem = this.localToRemoteCycle(item as Cycle, userId);
          break;
        case 'scheduled_workouts':
          remoteItem = this.localToRemoteScheduledWorkout(item as ScheduledWorkout, userId);
          break;
      }

      await supabase.from(table).upsert(remoteItem, { onConflict: 'id' });
    } catch (error) {
      console.error(`Error syncing ${table}:`, error);
    }
  },

  // Soft delete an item in cloud
  async deleteItem(
    table: 'exercises' | 'max_records' | 'completed_sets' | 'cycles' | 'scheduled_workouts',
    id: string,
    userId: string
  ) {
    if (!isSupabaseConfigured() || !this.isOnline()) return;

    try {
      await supabase
        .from(table)
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id)
        .eq('user_id', userId);
    } catch (error) {
      console.error(`Error deleting ${table}:`, error);
    }
  },

  // Conversion helpers: Remote (Supabase) -> Local (Dexie)
  remoteToLocalExercise(remote: RemoteExercise): Exercise {
    return {
      id: remote.id,
      name: remote.name,
      type: remote.type as Exercise['type'],
      mode: remote.mode as Exercise['mode'],
      measurementType: (remote.measurement_type as Exercise['measurementType']) || 'reps',
      notes: remote.notes || '',
      customParameters: (remote.custom_parameters as Exercise['customParameters']) || [],
      defaultConditioningReps: remote.default_conditioning_reps ?? undefined,
      defaultConditioningTime: remote.default_conditioning_time ?? undefined,
      weightEnabled: remote.weight_enabled ?? undefined,
      defaultWeight: remote.default_weight ?? undefined,
      createdAt: new Date(remote.created_at),
      updatedAt: new Date(remote.updated_at),
    };
  },

  remoteToLocalMaxRecord(remote: RemoteMaxRecord): MaxRecord {
    return {
      id: remote.id,
      exerciseId: remote.exercise_id,
      maxReps: remote.max_reps ?? undefined,
      maxTime: remote.max_time ?? undefined,
      weight: remote.weight ?? undefined,
      notes: remote.notes || '',
      recordedAt: new Date(remote.recorded_at),
    };
  },

  remoteToLocalCompletedSet(remote: RemoteCompletedSet): CompletedSet {
    return {
      id: remote.id,
      scheduledSetId: remote.scheduled_set_id,
      scheduledWorkoutId: remote.scheduled_workout_id,
      exerciseId: remote.exercise_id,
      targetReps: remote.target_reps,
      actualReps: remote.actual_reps,
      weight: remote.weight ?? undefined,
      completedAt: new Date(remote.completed_at),
      notes: remote.notes || '',
      parameters: (remote.parameters as Record<string, string | number>) || {},
    };
  },

  remoteToLocalCycle(remote: RemoteCycle): Cycle {
    return {
      id: remote.id,
      name: remote.name,
      cycleType: (remote.cycle_type as Cycle['cycleType']) || 'training',
      previousCycleId: remote.previous_cycle_id || undefined,
      startDate: new Date(remote.start_date),
      numberOfWeeks: remote.number_of_weeks,
      workoutDaysPerWeek: remote.workout_days_per_week,
      weeklySetGoals: remote.weekly_set_goals as Cycle['weeklySetGoals'],
      groups: remote.groups as Cycle['groups'],
      groupRotation: remote.group_rotation as string[],
      rfemRotation: remote.rfem_rotation as number[],
      conditioningWeeklyRepIncrement: remote.conditioning_weekly_rep_increment,
      status: remote.status as Cycle['status'],
      createdAt: new Date(remote.created_at),
      updatedAt: new Date(remote.updated_at),
    };
  },

  remoteToLocalScheduledWorkout(remote: RemoteScheduledWorkout): ScheduledWorkout {
    return {
      id: remote.id,
      cycleId: remote.cycle_id,
      sequenceNumber: remote.sequence_number,
      weekNumber: remote.week_number,
      dayInWeek: remote.day_in_week,
      groupId: remote.group_id,
      rfem: remote.rfem,
      scheduledSets: remote.scheduled_sets as ScheduledWorkout['scheduledSets'],
      status: remote.status as ScheduledWorkout['status'],
      completedAt: remote.completed_at ? new Date(remote.completed_at) : undefined,
    };
  },

  // Conversion helpers: Local (Dexie) -> Remote (Supabase)
  localToRemoteExercise(local: Exercise, userId: string) {
    return {
      id: local.id,
      user_id: userId,
      name: local.name,
      type: local.type,
      mode: local.mode,
      measurement_type: local.measurementType || 'reps',
      notes: local.notes,
      custom_parameters: local.customParameters,
      default_conditioning_reps: local.defaultConditioningReps || null,
      default_conditioning_time: local.defaultConditioningTime || null,
      weight_enabled: local.weightEnabled || false,
      default_weight: local.defaultWeight || null,
      created_at: local.createdAt.toISOString(),
      updated_at: local.updatedAt.toISOString(),
    };
  },

  localToRemoteMaxRecord(local: MaxRecord, userId: string) {
    return {
      id: local.id,
      user_id: userId,
      exercise_id: local.exerciseId,
      max_reps: local.maxReps || null,
      max_time: local.maxTime || null,
      weight: local.weight || null,
      notes: local.notes,
      recorded_at: local.recordedAt.toISOString(),
    };
  },

  localToRemoteCompletedSet(local: CompletedSet, userId: string) {
    return {
      id: local.id,
      user_id: userId,
      scheduled_set_id: local.scheduledSetId,
      scheduled_workout_id: local.scheduledWorkoutId,
      exercise_id: local.exerciseId,
      target_reps: local.targetReps,
      actual_reps: local.actualReps,
      weight: local.weight || null,
      completed_at: local.completedAt.toISOString(),
      notes: local.notes,
      parameters: local.parameters,
    };
  },

  localToRemoteCycle(local: Cycle, userId: string) {
    return {
      id: local.id,
      user_id: userId,
      name: local.name,
      cycle_type: local.cycleType,
      previous_cycle_id: local.previousCycleId || null,
      start_date: local.startDate.toISOString(),
      number_of_weeks: local.numberOfWeeks,
      workout_days_per_week: local.workoutDaysPerWeek,
      weekly_set_goals: local.weeklySetGoals,
      groups: local.groups,
      group_rotation: local.groupRotation,
      rfem_rotation: local.rfemRotation,
      conditioning_weekly_rep_increment: local.conditioningWeeklyRepIncrement,
      status: local.status,
      created_at: local.createdAt.toISOString(),
      updated_at: local.updatedAt.toISOString(),
    };
  },

  localToRemoteScheduledWorkout(local: ScheduledWorkout, userId: string) {
    return {
      id: local.id,
      user_id: userId,
      cycle_id: local.cycleId,
      sequence_number: local.sequenceNumber,
      week_number: local.weekNumber,
      day_in_week: local.dayInWeek,
      group_id: local.groupId,
      rfem: local.rfem,
      scheduled_sets: local.scheduledSets,
      status: local.status,
      completed_at: local.completedAt?.toISOString() || null,
    };
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
