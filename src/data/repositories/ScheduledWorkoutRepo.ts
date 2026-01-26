import { db, generateId } from '@/data/db';
import type { ScheduledWorkout } from '@/types';
import { now, normalizeDates, compareDates } from '@/utils/dateUtils';

// ScheduledWorkout has optional completedAt and scheduledDate
const DATE_FIELDS: (keyof ScheduledWorkout)[] = ['completedAt', 'scheduledDate'];

function normalizeWorkout(workout: ScheduledWorkout): ScheduledWorkout {
  // Normalize date fields if they exist
  if (workout.completedAt || workout.scheduledDate) {
    return normalizeDates(workout, DATE_FIELDS);
  }
  return workout;
}

function normalizeWorkouts(workouts: ScheduledWorkout[]): ScheduledWorkout[] {
  return workouts.map(normalizeWorkout);
}

/**
 * Repository for ScheduledWorkout CRUD operations.
 * Handles workout plans within training cycles, including ad-hoc workouts.
 */
export const ScheduledWorkoutRepo = {
  /**
   * Retrieves all scheduled workouts.
   * @returns Promise resolving to array of all scheduled workouts
   */
  async getAll(): Promise<ScheduledWorkout[]> {
    const records = await db.scheduledWorkouts.toArray();
    return normalizeWorkouts(records);
  },

  /**
   * Retrieves a scheduled workout by ID.
   * @param id - The workout UUID
   * @returns Promise resolving to the workout, or undefined if not found
   */
  async getById(id: string): Promise<ScheduledWorkout | undefined> {
    const record = await db.scheduledWorkouts.get(id);
    return record ? normalizeWorkout(record) : undefined;
  },

  /**
   * Retrieves all workouts for a cycle, sorted by sequence number.
   * @param cycleId - The cycle UUID
   * @returns Promise resolving to array of workouts in order
   */
  async getByCycleId(cycleId: string): Promise<ScheduledWorkout[]> {
    const workouts = await db.scheduledWorkouts.where('cycleId').equals(cycleId).toArray();
    const normalized = normalizeWorkouts(workouts);
    return normalized.sort((a, b) => a.sequenceNumber - b.sequenceNumber);
  },

  /**
   * Retrieves the next pending (or partial) non-ad-hoc workout in a cycle.
   * @param cycleId - The cycle UUID
   * @returns Promise resolving to the next workout, or undefined if all complete
   */
  async getNextPending(cycleId: string): Promise<ScheduledWorkout | undefined> {
    const workouts = await this.getByCycleId(cycleId);
    // Return first workout that's pending OR partial (in progress)
    // Exclude ad-hoc workouts from "next pending" - they're user-initiated
    const pending = workouts.find(
      w => (w.status === 'pending' || w.status === 'partial') && !w.isAdHoc
    );
    return pending;
  },

  /**
   * Retrieves an in-progress ad-hoc workout for a cycle.
   * @param cycleId - The cycle UUID
   * @returns Promise resolving to the ad-hoc workout, or undefined if none in progress
   */
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
      updatedAt: now(),
    };
    await db.scheduledWorkouts.add(scheduledWorkout);
    return scheduledWorkout;
  },

  async bulkCreate(workouts: Omit<ScheduledWorkout, 'id'>[]): Promise<ScheduledWorkout[]> {
    const timestamp = now();
    const scheduledWorkouts: ScheduledWorkout[] = workouts.map(w => ({
      ...w,
      id: generateId(),
      updatedAt: timestamp,
    }));
    await db.scheduledWorkouts.bulkAdd(scheduledWorkouts);
    return scheduledWorkouts;
  },

  async updateStatus(
    id: string,
    status: ScheduledWorkout['status']
  ): Promise<ScheduledWorkout | undefined> {
    const existing = await this.getById(id);
    if (existing) {
      const updates: Partial<ScheduledWorkout> = { status, updatedAt: now() };
      if (status === 'completed') {
        updates.completedAt = now();
      }
      const updated = { ...existing, ...updates };
      await db.scheduledWorkouts.put(updated);
      return updated;
    }
    return undefined;
  },

  async updateName(id: string, customName: string): Promise<ScheduledWorkout | undefined> {
    const existing = await this.getById(id);
    if (existing) {
      const updated = { ...existing, customName, updatedAt: now() };
      await db.scheduledWorkouts.put(updated);
      return updated;
    }
    return undefined;
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
   * Retrieves pending workouts scheduled for a specific date.
   * @param cycleId - The cycle UUID
   * @param date - The target date
   * @returns Promise resolving to array of workouts scheduled for that date
   */
  async getByScheduledDate(cycleId: string, date: Date): Promise<ScheduledWorkout[]> {
    const workouts = await this.getByCycleId(cycleId);
    // Compare date portion only (ignore time)
    const targetDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    return workouts.filter(w => {
      if (!w.scheduledDate) return false;
      const schedDate = new Date(
        w.scheduledDate.getFullYear(),
        w.scheduledDate.getMonth(),
        w.scheduledDate.getDate()
      );
      return schedDate.getTime() === targetDate.getTime();
    });
  },

  /**
   * Retrieves overdue workouts (pending with scheduledDate before today).
   * Returns workouts sorted by scheduledDate ascending (oldest first).
   * @param cycleId - The cycle UUID
   * @returns Promise resolving to array of overdue workouts
   */
  async getOverdue(cycleId: string): Promise<ScheduledWorkout[]> {
    const workouts = await this.getByCycleId(cycleId);
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    const overdue = workouts.filter(w => {
      if (!w.scheduledDate || w.status !== 'pending') return false;
      const schedDate = new Date(
        w.scheduledDate.getFullYear(),
        w.scheduledDate.getMonth(),
        w.scheduledDate.getDate()
      );
      return schedDate.getTime() < todayStart.getTime();
    });

    // Sort by scheduledDate ascending (oldest first)
    return overdue.sort((a, b) => {
      if (!a.scheduledDate || !b.scheduledDate) return 0;
      return a.scheduledDate.getTime() - b.scheduledDate.getTime();
    });
  },

  /**
   * Updates a workout's skip reason and marks it as skipped.
   * @param id - The workout UUID
   * @param reason - The reason for skipping (optional)
   */
  async updateSkipReason(id: string, reason?: string): Promise<void> {
    const existing = await this.getById(id);
    if (existing) {
      await db.scheduledWorkouts.put({
        ...existing,
        status: 'skipped',
        skipReason: reason,
      });
    }
  },
};
