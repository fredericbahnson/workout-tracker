import { db, generateId } from '@/data/db';
import type { CompletedSet, QuickLogData } from '@/types';
import { 
  now, 
  normalizeDates, 
  normalizeDatesArray, 
  startOfDay, 
  addDays,
  toDateRequired,
  compareDates,
  type DateLike
} from '@/utils/dateUtils';

const DATE_FIELDS: (keyof CompletedSet)[] = ['completedAt'];

export const CompletedSetRepo = {
  async getAll(): Promise<CompletedSet[]> {
    const records = await db.completedSets.orderBy('completedAt').reverse().toArray();
    return normalizeDatesArray(records, DATE_FIELDS);
  },

  async getForExercise(exerciseId: string): Promise<CompletedSet[]> {
    const records = await db.completedSets
      .where('exerciseId')
      .equals(exerciseId)
      .toArray();
    const normalized = normalizeDatesArray(records, DATE_FIELDS);
    // Sort descending by completedAt
    return normalized.sort((a, b) => compareDates(b.completedAt, a.completedAt));
  },

  async getForDateRange(start: DateLike, end: DateLike): Promise<CompletedSet[]> {
    const startDate = toDateRequired(start);
    const endDate = toDateRequired(end);
    const records = await db.completedSets
      .where('completedAt')
      .between(startDate, endDate)
      .toArray();
    return normalizeDatesArray(records, DATE_FIELDS);
  },

  async getForToday(): Promise<CompletedSet[]> {
    const today = startOfDay(now());
    const tomorrow = addDays(today, 1);
    return this.getForDateRange(today, tomorrow);
  },

  async getRecent(limit: number = 50): Promise<CompletedSet[]> {
    const records = await db.completedSets
      .orderBy('completedAt')
      .reverse()
      .limit(limit)
      .toArray();
    return normalizeDatesArray(records, DATE_FIELDS);
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
      completedAt: now(),
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
      completedAt: now(),
      notes,
      parameters
    };
    await db.completedSets.add(completedSet);
    return completedSet;
  },

  async getForScheduledWorkout(workoutId: string): Promise<CompletedSet[]> {
    const records = await db.completedSets
      .where('scheduledWorkoutId')
      .equals(workoutId)
      .toArray();
    return normalizeDatesArray(records, DATE_FIELDS);
  },

  async update(id: string, data: Partial<Omit<CompletedSet, 'id' | 'completedAt'>>): Promise<CompletedSet | undefined> {
    const existing = await db.completedSets.get(id);
    if (!existing) return undefined;

    const updated: CompletedSet = { 
      ...normalizeDates(existing, DATE_FIELDS), 
      ...data 
    };
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
    start: DateLike, 
    end: DateLike
  ): Promise<{ totalSets: number; totalReps: number }> {
    const startDate = toDateRequired(start);
    const endDate = toDateRequired(end);
    const allSets = await this.getForExercise(exerciseId);
    const filteredSets = allSets.filter(s => {
      // Sets are already normalized, so completedAt is a Date
      return s.completedAt >= startDate && s.completedAt < endDate;
    });
    const totalSets = filteredSets.length;
    const totalReps = filteredSets.reduce((sum, s) => sum + s.actualReps, 0);
    
    return { totalSets, totalReps };
  },

  async getStatsForCycle(
    exerciseId: string, 
    cycleStartDate: DateLike
  ): Promise<{ totalSets: number; totalReps: number }> {
    const startDate = toDateRequired(cycleStartDate);
    const allSets = await this.getForExercise(exerciseId);
    const filteredSets = allSets.filter(s => {
      // Sets are already normalized, so completedAt is a Date
      return s.completedAt >= startDate;
    });
    const totalSets = filteredSets.length;
    const totalReps = filteredSets.reduce((sum, s) => sum + s.actualReps, 0);
    
    return { totalSets, totalReps };
  }
};
