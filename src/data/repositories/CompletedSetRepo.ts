import { db, generateId } from '../db';
import type { CompletedSet, QuickLogData } from '../../types';

export const CompletedSetRepo = {
  async getAll(): Promise<CompletedSet[]> {
    return db.completedSets.orderBy('completedAt').reverse().toArray();
  },

  async getForExercise(exerciseId: string): Promise<CompletedSet[]> {
    return db.completedSets
      .where('exerciseId')
      .equals(exerciseId)
      .reverse()
      .sortBy('completedAt');
  },

  async getForDateRange(start: Date, end: Date): Promise<CompletedSet[]> {
    return db.completedSets
      .where('completedAt')
      .between(start, end)
      .toArray();
  },

  async getForToday(): Promise<CompletedSet[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    return this.getForDateRange(today, tomorrow);
  },

  async getRecent(limit: number = 50): Promise<CompletedSet[]> {
    return db.completedSets
      .orderBy('completedAt')
      .reverse()
      .limit(limit)
      .toArray();
  },

  async create(data: QuickLogData, scheduledWorkoutId?: string): Promise<CompletedSet> {
    const completedSet: CompletedSet = {
      id: generateId(),
      scheduledSetId: null,
      scheduledWorkoutId: scheduledWorkoutId || null,
      exerciseId: data.exerciseId,
      targetReps: data.reps,
      actualReps: data.reps,
      weight: data.weight,
      completedAt: new Date(),
      notes: data.notes,
      parameters: data.parameters
    };
    await db.completedSets.add(completedSet);
    return completedSet;
  },

  async createFromScheduled(
    scheduledSetId: string,
    scheduledWorkoutId: string,
    exerciseId: string,
    targetReps: number,
    actualReps: number,
    notes: string = '',
    parameters: Record<string, string | number> = {},
    weight?: number
  ): Promise<CompletedSet> {
    const completedSet: CompletedSet = {
      id: generateId(),
      scheduledSetId,
      scheduledWorkoutId,
      exerciseId,
      targetReps,
      actualReps,
      weight,
      completedAt: new Date(),
      notes,
      parameters
    };
    await db.completedSets.add(completedSet);
    return completedSet;
  },

  async getForScheduledWorkout(workoutId: string): Promise<CompletedSet[]> {
    return db.completedSets
      .where('scheduledWorkoutId')
      .equals(workoutId)
      .toArray();
  },

  async update(id: string, data: Partial<Omit<CompletedSet, 'id' | 'completedAt'>>): Promise<CompletedSet | undefined> {
    const existing = await db.completedSets.get(id);
    if (!existing) return undefined;

    const updated: CompletedSet = { ...existing, ...data };
    await db.completedSets.put(updated);
    return updated;
  },

  async delete(id: string): Promise<boolean> {
    const existing = await db.completedSets.get(id);
    if (!existing) return false;
    
    await db.completedSets.delete(id);
    return true;
  },

  async deleteByScheduledWorkoutId(workoutId: string): Promise<string[]> {
    const sets = await db.completedSets
      .where('scheduledWorkoutId')
      .equals(workoutId)
      .toArray();
    
    const ids = sets.map(s => s.id);
    await db.completedSets.where('scheduledWorkoutId').equals(workoutId).delete();
    return ids;
  },

  async getStats(exerciseId: string): Promise<{ totalSets: number; totalReps: number; avgReps: number }> {
    const sets = await this.getForExercise(exerciseId);
    const totalSets = sets.length;
    const totalReps = sets.reduce((sum, s) => sum + s.actualReps, 0);
    const avgReps = totalSets > 0 ? Math.round(totalReps / totalSets) : 0;
    
    return { totalSets, totalReps, avgReps };
  },

  async getStatsForDateRange(
    exerciseId: string, 
    start: Date, 
    end: Date
  ): Promise<{ totalSets: number; totalReps: number }> {
    const allSets = await this.getForExercise(exerciseId);
    const filteredSets = allSets.filter(s => {
      const completedAt = new Date(s.completedAt);
      return completedAt >= start && completedAt < end;
    });
    const totalSets = filteredSets.length;
    const totalReps = filteredSets.reduce((sum, s) => sum + s.actualReps, 0);
    
    return { totalSets, totalReps };
  },

  async getStatsForCycle(
    exerciseId: string, 
    cycleStartDate: Date
  ): Promise<{ totalSets: number; totalReps: number }> {
    const allSets = await this.getForExercise(exerciseId);
    const filteredSets = allSets.filter(s => {
      const completedAt = new Date(s.completedAt);
      return completedAt >= cycleStartDate;
    });
    const totalSets = filteredSets.length;
    const totalReps = filteredSets.reduce((sum, s) => sum + s.actualReps, 0);
    
    return { totalSets, totalReps };
  }
};
