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
  type DateLike,
} from '@/utils/dateUtils';

const DATE_FIELDS: (keyof CompletedSet)[] = ['completedAt'];

/**
 * Repository for CompletedSet CRUD operations.
 * Handles logging and tracking of completed workout sets.
 */
export const CompletedSetRepo = {
  /**
   * Retrieves all completed sets, sorted by completion date descending.
   * @returns Promise resolving to array of all completed sets (newest first)
   */
  async getAll(): Promise<CompletedSet[]> {
    const records = await db.completedSets.orderBy('completedAt').reverse().toArray();
    return normalizeDatesArray(records, DATE_FIELDS);
  },

  /**
   * Retrieves all completed sets for a specific exercise.
   * @param exerciseId - The exercise UUID
   * @returns Promise resolving to array of completed sets (newest first)
   */
  async getForExercise(exerciseId: string): Promise<CompletedSet[]> {
    const records = await db.completedSets.where('exerciseId').equals(exerciseId).toArray();
    const normalized = normalizeDatesArray(records, DATE_FIELDS);
    // Sort descending by completedAt
    return normalized.sort((a, b) => compareDates(b.completedAt, a.completedAt));
  },

  /**
   * Retrieves completed sets within a date range.
   * @param start - Start date (inclusive)
   * @param end - End date (exclusive)
   * @returns Promise resolving to array of matching completed sets
   */
  async getForDateRange(start: DateLike, end: DateLike): Promise<CompletedSet[]> {
    const startDate = toDateRequired(start);
    const endDate = toDateRequired(end);
    const records = await db.completedSets
      .where('completedAt')
      .between(startDate, endDate)
      .toArray();
    return normalizeDatesArray(records, DATE_FIELDS);
  },

  /**
   * Retrieves all completed sets from today.
   * @returns Promise resolving to array of today's completed sets
   */
  async getForToday(): Promise<CompletedSet[]> {
    const today = startOfDay(now());
    const tomorrow = addDays(today, 1);
    return this.getForDateRange(today, tomorrow);
  },

  /**
   * Retrieves the most recent completed sets.
   * @param limit - Maximum number of sets to return (default: 50)
   * @returns Promise resolving to array of recent completed sets
   */
  async getRecent(limit: number = 50): Promise<CompletedSet[]> {
    const records = await db.completedSets.orderBy('completedAt').reverse().limit(limit).toArray();
    return normalizeDatesArray(records, DATE_FIELDS);
  },

  /**
   * Creates a completed set from quick log data.
   * @param data - Quick log form data
   * @param scheduledWorkoutId - Optional associated workout ID
   * @returns Promise resolving to the created completed set
   */
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
      parameters: data.parameters,
    };
    await db.completedSets.add(completedSet);
    return completedSet;
  },

  /**
   * Creates a completed set from a scheduled set.
   * @param scheduledSetId - The scheduled set UUID
   * @param scheduledWorkoutId - The scheduled workout UUID
   * @param exerciseId - The exercise UUID
   * @param targetReps - Target reps/time from schedule
   * @param actualReps - Actual reps/time achieved
   * @param notes - Optional notes
   * @param parameters - Custom parameter values
   * @param weight - Weight in lbs (optional)
   * @returns Promise resolving to the created completed set
   */
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
      parameters,
    };
    await db.completedSets.add(completedSet);
    return completedSet;
  },

  /**
   * Retrieves all completed sets for a scheduled workout.
   * @param workoutId - The scheduled workout UUID
   * @returns Promise resolving to array of completed sets for the workout
   */
  async getForScheduledWorkout(workoutId: string): Promise<CompletedSet[]> {
    const records = await db.completedSets.where('scheduledWorkoutId').equals(workoutId).toArray();
    return normalizeDatesArray(records, DATE_FIELDS);
  },

  /**
   * Updates a completed set.
   * @param id - The completed set UUID
   * @param data - Partial data to merge (excludes id and completedAt)
   * @returns Promise resolving to updated set, or undefined if not found
   */
  async update(
    id: string,
    data: Partial<Omit<CompletedSet, 'id' | 'completedAt'>>
  ): Promise<CompletedSet | undefined> {
    const existing = await db.completedSets.get(id);
    if (!existing) return undefined;

    const updated: CompletedSet = {
      ...normalizeDates(existing, DATE_FIELDS),
      ...data,
    };
    await db.completedSets.put(updated);
    return updated;
  },

  /**
   * Deletes a completed set by ID.
   * @param id - The completed set UUID
   * @returns Promise resolving to true if deleted, false if not found
   */
  async delete(id: string): Promise<boolean> {
    const existing = await db.completedSets.get(id);
    if (!existing) return false;

    await db.completedSets.delete(id);
    return true;
  },

  /**
   * Deletes all completed sets for a scheduled workout.
   * Used when canceling an ad-hoc workout.
   * @param workoutId - The scheduled workout UUID
   * @returns Promise resolving to array of deleted set IDs
   */
  async deleteByScheduledWorkoutId(workoutId: string): Promise<string[]> {
    const sets = await db.completedSets.where('scheduledWorkoutId').equals(workoutId).toArray();

    const ids = sets.map(s => s.id);
    await db.completedSets.where('scheduledWorkoutId').equals(workoutId).delete();
    return ids;
  },

  /**
   * Calculates aggregate statistics for an exercise.
   * @param exerciseId - The exercise UUID
   * @returns Promise resolving to stats object with totalSets, totalReps, avgReps
   */
  async getStats(
    exerciseId: string
  ): Promise<{ totalSets: number; totalReps: number; avgReps: number }> {
    const sets = await this.getForExercise(exerciseId);
    const totalSets = sets.length;
    const totalReps = sets.reduce((sum, s) => sum + s.actualReps, 0);
    const avgReps = totalSets > 0 ? Math.round(totalReps / totalSets) : 0;

    return { totalSets, totalReps, avgReps };
  },

  /**
   * Calculates statistics for an exercise within a date range.
   * @param exerciseId - The exercise UUID
   * @param start - Start date (inclusive)
   * @param end - End date (exclusive)
   * @returns Promise resolving to stats object with totalSets and totalReps
   */
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

  /**
   * Calculates statistics for an exercise since a cycle start date.
   * @param exerciseId - The exercise UUID
   * @param cycleStartDate - The cycle start date
   * @returns Promise resolving to stats object with totalSets and totalReps
   */
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
  },

  /**
   * Gets the most recent completed set for an exercise.
   * Useful for defaulting to last used weight/reps.
   * @param exerciseId - The exercise UUID
   * @returns Promise resolving to the most recent set, or null if none exist
   */
  async getLastForExercise(exerciseId: string): Promise<CompletedSet | null> {
    const sets = await this.getForExercise(exerciseId);
    return sets.length > 0 ? sets[0] : null; // Already sorted descending by completedAt
  },

  /**
   * Gets the most recent completed set with weight for an exercise.
   * @param exerciseId - The exercise UUID
   * @returns Promise resolving to the most recent weighted set, or null if none exist
   */
  async getLastWeightedForExercise(exerciseId: string): Promise<CompletedSet | null> {
    const sets = await this.getForExercise(exerciseId);
    const weightedSet = sets.find(s => s.weight !== undefined && s.weight > 0);
    return weightedSet || null;
  },

  /**
   * Gets working set history for an exercise, excluding warmup sets.
   * Groups sets by workout session (same calendar day).
   * @param exerciseId - The exercise UUID
   * @returns Promise resolving to array of session groups, newest first
   */
  async getWorkingSetHistory(exerciseId: string): Promise<
    Array<{
      date: Date;
      workoutId: string | null;
      sets: Array<{
        actualReps: number;
        weight?: number;
        notes?: string;
      }>;
    }>
  > {
    // Get all completed sets for this exercise
    const allSets = await this.getForExercise(exerciseId);

    if (allSets.length === 0) {
      return [];
    }

    // Build a set of warmup scheduledSetIds by checking all scheduled workouts
    const warmupSetIds = new Set<string>();
    const allWorkouts = await db.scheduledWorkouts.toArray();

    for (const workout of allWorkouts) {
      for (const scheduledSet of workout.scheduledSets) {
        if (scheduledSet.isWarmup) {
          warmupSetIds.add(scheduledSet.id);
        }
      }
    }

    // Filter out warmup sets
    // Ad-hoc sets (scheduledSetId === null) are never warmups
    const workingSets = allSets.filter(
      cs => cs.scheduledSetId === null || !warmupSetIds.has(cs.scheduledSetId)
    );

    // Group by date (same calendar day = same session)
    const sessionMap = new Map<
      string,
      {
        date: Date;
        workoutId: string | null;
        sets: Array<{
          actualReps: number;
          weight?: number;
          notes?: string;
        }>;
      }
    >();

    for (const set of workingSets) {
      const dayStart = startOfDay(set.completedAt);
      const dateKey = dayStart.toISOString();

      if (!sessionMap.has(dateKey)) {
        sessionMap.set(dateKey, {
          date: dayStart,
          workoutId: set.scheduledWorkoutId,
          sets: [],
        });
      }

      sessionMap.get(dateKey)!.sets.push({
        actualReps: set.actualReps,
        weight: set.weight,
        notes: set.notes || undefined,
      });
    }

    // Convert to array and sort by date descending (newest first)
    return Array.from(sessionMap.values()).sort((a, b) => b.date.getTime() - a.date.getTime());
  },
};
