import { db, generateId } from '@/data/db';
import type { ScheduledWorkout } from '@/types';
import { now, normalizeDates, compareDates } from '@/utils/dateUtils';

// ScheduledWorkout has optional completedAt
const DATE_FIELDS: (keyof ScheduledWorkout)[] = ['completedAt'];

function normalizeWorkout(workout: ScheduledWorkout): ScheduledWorkout {
  // Only normalize completedAt if it exists
  if (workout.completedAt) {
    return normalizeDates(workout, DATE_FIELDS);
  }
  return workout;
}

function normalizeWorkouts(workouts: ScheduledWorkout[]): ScheduledWorkout[] {
  return workouts.map(normalizeWorkout);
}

export const ScheduledWorkoutRepo = {
  async getAll(): Promise<ScheduledWorkout[]> {
    const records = await db.scheduledWorkouts.toArray();
    return normalizeWorkouts(records);
  },

  async getById(id: string): Promise<ScheduledWorkout | undefined> {
    const record = await db.scheduledWorkouts.get(id);
    return record ? normalizeWorkout(record) : undefined;
  },

  async getByCycleId(cycleId: string): Promise<ScheduledWorkout[]> {
    const workouts = await db.scheduledWorkouts.where('cycleId').equals(cycleId).toArray();
    const normalized = normalizeWorkouts(workouts);
    return normalized.sort((a, b) => a.sequenceNumber - b.sequenceNumber);
  },

  async getNextPending(cycleId: string): Promise<ScheduledWorkout | undefined> {
    const workouts = await this.getByCycleId(cycleId);
    // Return first workout that's pending OR partial (in progress)
    // Exclude ad-hoc workouts from "next pending" - they're user-initiated
    const pending = workouts.find(
      w => (w.status === 'pending' || w.status === 'partial') && !w.isAdHoc
    );
    return pending;
  },

  async getInProgressAdHoc(cycleId: string): Promise<ScheduledWorkout | undefined> {
    const workouts = await this.getByCycleId(cycleId);
    // Return ad-hoc workout that's in progress (partial status)
    return workouts.find(w => w.isAdHoc && w.status === 'partial');
  },

  async getPendingWorkouts(cycleId: string): Promise<ScheduledWorkout[]> {
    const workouts = await this.getByCycleId(cycleId);
    return workouts.filter(w => w.status === 'pending');
  },

  async getCompletedWorkouts(cycleId: string): Promise<ScheduledWorkout[]> {
    const workouts = await this.getByCycleId(cycleId);
    return workouts.filter(w => w.status === 'completed' || w.status === 'partial');
  },

  async getAllCompleted(): Promise<ScheduledWorkout[]> {
    const allWorkouts = await db.scheduledWorkouts.toArray();
    const normalized = normalizeWorkouts(allWorkouts);
    return normalized
      .filter(w => w.status === 'completed' && w.completedAt)
      .sort((a, b) => compareDates(b.completedAt!, a.completedAt!));
  },

  async countAdHocWorkouts(cycleId: string): Promise<number> {
    const workouts = await this.getByCycleId(cycleId);
    return workouts.filter(w => w.isAdHoc).length;
  },

  async create(workout: Omit<ScheduledWorkout, 'id'>): Promise<ScheduledWorkout> {
    const scheduledWorkout: ScheduledWorkout = {
      ...workout,
      id: generateId(),
    };
    await db.scheduledWorkouts.add(scheduledWorkout);
    return scheduledWorkout;
  },

  async bulkCreate(workouts: Omit<ScheduledWorkout, 'id'>[]): Promise<ScheduledWorkout[]> {
    const scheduledWorkouts: ScheduledWorkout[] = workouts.map(w => ({
      ...w,
      id: generateId(),
    }));
    await db.scheduledWorkouts.bulkAdd(scheduledWorkouts);
    return scheduledWorkouts;
  },

  async updateStatus(id: string, status: ScheduledWorkout['status']): Promise<void> {
    const existing = await this.getById(id);
    if (existing) {
      const updates: Partial<ScheduledWorkout> = { status };
      if (status === 'completed') {
        updates.completedAt = now();
      }
      await db.scheduledWorkouts.put({ ...existing, ...updates });
    }
  },

  async updateName(id: string, customName: string): Promise<void> {
    const existing = await this.getById(id);
    if (existing) {
      await db.scheduledWorkouts.put({ ...existing, customName });
    }
  },

  async delete(id: string): Promise<boolean> {
    const existing = await db.scheduledWorkouts.get(id);
    if (!existing) return false;

    await db.scheduledWorkouts.delete(id);
    return true;
  },

  async deleteByCycleId(cycleId: string): Promise<number> {
    return db.scheduledWorkouts.where('cycleId').equals(cycleId).delete();
  },

  async getCycleProgress(cycleId: string): Promise<{
    completed: number;
    skipped: number;
    passed: number;
    total: number;
  }> {
    const workouts = await this.getByCycleId(cycleId);
    // Only count non-ad-hoc workouts for cycle progress
    const regularWorkouts = workouts.filter(w => !w.isAdHoc);
    const completed = regularWorkouts.filter(w => w.status === 'completed').length;
    const skipped = regularWorkouts.filter(w => w.status === 'skipped').length;
    return { completed, skipped, passed: completed + skipped, total: regularWorkouts.length };
  },

  /**
   * Clean up duplicate workouts that may have been created due to sync issues.
   * For each cycle + sequenceNumber combination, keeps the workout that:
   * 1. Has warmup sets (if any do), OR
   * 2. Was created most recently
   * Returns the IDs of removed duplicates (for cloud sync).
   */
  async cleanupDuplicates(): Promise<string[]> {
    const allWorkouts = await db.scheduledWorkouts.toArray();

    // Group by cycleId + sequenceNumber
    const groups = new Map<string, typeof allWorkouts>();
    for (const workout of allWorkouts) {
      // Skip ad-hoc workouts - they don't have sequence conflicts
      if (workout.isAdHoc) continue;

      const key = `${workout.cycleId}:${workout.sequenceNumber}`;
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(workout);
    }

    // Find and remove duplicates
    const deletedIds: string[] = [];
    for (const workouts of groups.values()) {
      if (workouts.length <= 1) continue;

      // Sort to determine which to keep:
      // 1. Prefer workouts with warmup sets
      // 2. Then prefer completed/partial over pending
      // 3. Finally prefer by ID (newer IDs are typically longer/later)
      workouts.sort((a, b) => {
        const aHasWarmups = a.scheduledSets.some(s => s.isWarmup);
        const bHasWarmups = b.scheduledSets.some(s => s.isWarmup);
        if (aHasWarmups !== bHasWarmups) return bHasWarmups ? 1 : -1;

        const aCompleted = a.status === 'completed' || a.status === 'partial';
        const bCompleted = b.status === 'completed' || b.status === 'partial';
        if (aCompleted !== bCompleted) return bCompleted ? 1 : -1;

        return b.id.localeCompare(a.id); // Newer IDs first
      });

      // Keep the first one (best), delete the rest
      const toDelete = workouts.slice(1);
      for (const workout of toDelete) {
        await db.scheduledWorkouts.delete(workout.id);
        deletedIds.push(workout.id);
      }
    }

    return deletedIds;
  },
};
