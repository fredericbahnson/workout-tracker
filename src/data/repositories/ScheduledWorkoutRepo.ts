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
    const workouts = await db.scheduledWorkouts
      .where('cycleId')
      .equals(cycleId)
      .toArray();
    const normalized = normalizeWorkouts(workouts);
    return normalized.sort((a, b) => a.sequenceNumber - b.sequenceNumber);
  },

  async getNextPending(cycleId: string): Promise<ScheduledWorkout | undefined> {
    const workouts = await this.getByCycleId(cycleId);
    // Return first workout that's pending OR partial (in progress)
    // Exclude ad-hoc workouts from "next pending" - they're user-initiated
    return workouts.find(w => (w.status === 'pending' || w.status === 'partial') && !w.isAdHoc);
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
      id: generateId()
    };
    await db.scheduledWorkouts.add(scheduledWorkout);
    return scheduledWorkout;
  },

  async bulkCreate(workouts: Omit<ScheduledWorkout, 'id'>[]): Promise<ScheduledWorkout[]> {
    const scheduledWorkouts: ScheduledWorkout[] = workouts.map(w => ({
      ...w,
      id: generateId()
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
    total: number 
  }> {
    const workouts = await this.getByCycleId(cycleId);
    // Only count non-ad-hoc workouts for cycle progress
    const regularWorkouts = workouts.filter(w => !w.isAdHoc);
    const completed = regularWorkouts.filter(w => w.status === 'completed').length;
    const skipped = regularWorkouts.filter(w => w.status === 'skipped').length;
    return { completed, skipped, passed: completed + skipped, total: regularWorkouts.length };
  }
};
