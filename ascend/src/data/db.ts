import Dexie, { type EntityTable } from 'dexie';
import type { Exercise, MaxRecord, CompletedSet, Cycle, ScheduledWorkout } from '@/types';

// Sync queue item for offline operations
export interface SyncQueueItem {
  id: string;
  table: 'exercises' | 'max_records' | 'completed_sets' | 'cycles' | 'scheduled_workouts';
  operation: 'upsert' | 'delete';
  itemId: string;
  data?: unknown;
  createdAt: Date;
  retryCount: number;
  nextRetryAt?: Date; // For exponential backoff
}

// Database class
class AscendDatabase extends Dexie {
  exercises!: EntityTable<Exercise, 'id'>;
  maxRecords!: EntityTable<MaxRecord, 'id'>;
  completedSets!: EntityTable<CompletedSet, 'id'>;
  cycles!: EntityTable<Cycle, 'id'>;
  scheduledWorkouts!: EntityTable<ScheduledWorkout, 'id'>;
  syncQueue!: EntityTable<SyncQueueItem, 'id'>;

  constructor() {
    super('Ascend');
    
    // Version 1: Initial schema for Ascend
    this.version(1).stores({
      exercises: 'id, type, mode, name, createdAt',
      maxRecords: 'id, exerciseId, recordedAt',
      completedSets: 'id, exerciseId, scheduledWorkoutId, completedAt',
      cycles: 'id, status, startDate',
      scheduledWorkouts: 'id, cycleId, sequenceNumber, status'
    });

    // Version 2: Add sync queue for offline support
    this.version(2).stores({
      exercises: 'id, type, mode, name, createdAt',
      maxRecords: 'id, exerciseId, recordedAt',
      completedSets: 'id, exerciseId, scheduledWorkoutId, completedAt',
      cycles: 'id, status, startDate',
      scheduledWorkouts: 'id, cycleId, sequenceNumber, status',
      syncQueue: 'id, table, itemId, createdAt'
    });
  }
}

export const db = new AscendDatabase();

// Helper to generate UUIDs (with fallback for non-secure contexts like HTTP)
export function generateId(): string {
  // crypto.randomUUID() requires secure context (HTTPS)
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  
  // Fallback for HTTP contexts (local dev on mobile)
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// Export/Import helpers for backup
export async function exportData(): Promise<string> {
  const data = {
    exercises: await db.exercises.toArray(),
    maxRecords: await db.maxRecords.toArray(),
    completedSets: await db.completedSets.toArray(),
    cycles: await db.cycles.toArray(),
    scheduledWorkouts: await db.scheduledWorkouts.toArray(),
    exportedAt: new Date().toISOString(),
    version: 1
  };
  return JSON.stringify(data, null, 2);
}

export async function importData(jsonString: string): Promise<{ success: boolean; error?: string }> {
  try {
    const data = JSON.parse(jsonString);
    
    // Basic validation
    if (!data.version || !data.exercises) {
      return { success: false, error: 'Invalid backup file format' };
    }

    // Clear existing data and import
    await db.transaction('rw', [db.exercises, db.maxRecords, db.completedSets, db.cycles, db.scheduledWorkouts], async () => {
      await db.exercises.clear();
      await db.maxRecords.clear();
      await db.completedSets.clear();
      await db.cycles.clear();
      await db.scheduledWorkouts.clear();

      if (data.exercises?.length) await db.exercises.bulkAdd(data.exercises);
      if (data.maxRecords?.length) await db.maxRecords.bulkAdd(data.maxRecords);
      if (data.completedSets?.length) await db.completedSets.bulkAdd(data.completedSets);
      if (data.cycles?.length) await db.cycles.bulkAdd(data.cycles);
      if (data.scheduledWorkouts?.length) await db.scheduledWorkouts.bulkAdd(data.scheduledWorkouts);
    });

    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'Unknown error' };
  }
}
