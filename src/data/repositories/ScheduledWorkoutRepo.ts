import { db, generateId } from '../db';
import type { ScheduledWorkout } from '../../types';

export const ScheduledWorkoutRepo = {
  async getAll(): Promise<ScheduledWorkout[]> {
    return db.scheduledWorkouts.toArray();
  },

  async getById(id: string): Promise<ScheduledWorkout | undefined> {
    return db.scheduledWorkouts.get(id);
  },

  async getByCycleId(cycleId: string): Promise<ScheduledWorkout[]> {
    const workouts = await db.scheduledWorkouts
      .where('cycleId')
      .equals(cycleId)
      .toArray();
    return workouts.sort((a, b) => a.sequenceNumber - b.sequenceNumber);
  },

  async getNextPending(cycleId: string): Promise<ScheduledWorkout | undefined> {
    const workouts = await this.getByCycleId(cycleId);
    // Return first workout that's pending OR partial (in progress)
    return workouts.find(w => w.status === 'pending' || w.status === 'partial');
  },

  async getPendingWorkouts(cycleId: string): Promise<ScheduledWorkout[]> {
    const workouts = await this.getByCycleId(cycleId);
    return workouts.filter(w => w.status === 'pending');
  },

  async getCompletedWorkouts(cycleId: string): Promise<ScheduledWorkout[]> {
    const workouts = await this.getByCycleId(cycleId);
    return workouts.filter(w => w.status === 'completed' || w.status === 'partial');
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
    const existing = await db.scheduledWorkouts.get(id);
    if (existing) {
      const updates: Partial<ScheduledWorkout> = { status };
      if (status === 'completed') {
        updates.completedAt = new Date();
      }
      await db.scheduledWorkouts.put({ ...existing, ...updates });
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
    const completed = workouts.filter(w => w.status === 'completed').length;
    const skipped = workouts.filter(w => w.status === 'skipped').length;
    return { completed, skipped, passed: completed + skipped, total: workouts.length };
  }
};
