import { db, generateId } from '@/data/db';
import type { MaxRecord } from '@/types';
import { now, normalizeDates, normalizeDatesArray, compareDates } from '@/utils/dateUtils';

const DATE_FIELDS: (keyof MaxRecord)[] = ['recordedAt'];

/**
 * Repository for MaxRecord (personal record) CRUD operations.
 * Handles tracking of exercise PRs and max attempts.
 */
export const MaxRecordRepo = {
  /**
   * Retrieves all max records for a specific exercise, sorted by date descending.
   * @param exerciseId - The exercise UUID
   * @returns Promise resolving to array of max records (newest first)
   */
  async getAllForExercise(exerciseId: string): Promise<MaxRecord[]> {
    const records = await db.maxRecords.where('exerciseId').equals(exerciseId).toArray();
    const normalized = normalizeDatesArray(records, DATE_FIELDS);
    // Sort descending by recordedAt
    return normalized.sort((a, b) => compareDates(b.recordedAt, a.recordedAt));
  },

  /**
   * Retrieves the most recent max record for an exercise.
   * @param exerciseId - The exercise UUID
   * @returns Promise resolving to the latest max record, or undefined if none exist
   */
  async getLatestForExercise(exerciseId: string): Promise<MaxRecord | undefined> {
    const records = await this.getAllForExercise(exerciseId);
    return records[0];
  },

  /**
   * Retrieves the latest max record for each exercise.
   * Useful for displaying current maxes across all exercises.
   * @returns Promise resolving to Map of exerciseId → latest MaxRecord
   */
  async getLatestForAllExercises(): Promise<Map<string, MaxRecord>> {
    const allRecords = await db.maxRecords.toArray();
    const normalized = normalizeDatesArray(allRecords, DATE_FIELDS);
    const latestByExercise = new Map<string, MaxRecord>();

    // Sort by date descending and keep latest for each exercise
    normalized.sort((a, b) => compareDates(b.recordedAt, a.recordedAt));

    for (const record of normalized) {
      if (!latestByExercise.has(record.exerciseId)) {
        latestByExercise.set(record.exerciseId, record);
      }
    }

    return latestByExercise;
  },

  /**
   * Creates a new max record.
   * @param exerciseId - The exercise UUID
   * @param maxReps - Max reps achieved (for rep-based exercises)
   * @param maxTime - Max time in seconds (for time-based exercises)
   * @param notes - Optional notes about the record
   * @param weight - Weight in lbs (undefined = bodyweight)
   * @returns Promise resolving to the created max record
   */
  async create(
    exerciseId: string,
    maxReps?: number,
    maxTime?: number,
    notes: string = '',
    weight?: number
  ): Promise<MaxRecord> {
    const record: MaxRecord = {
      id: generateId(),
      exerciseId,
      maxReps,
      maxTime,
      weight,
      notes,
      recordedAt: now(),
    };
    await db.maxRecords.add(record);
    return record;
  },

  /**
   * Updates an existing max record.
   * @param id - The max record UUID
   * @param data - Partial data to merge (excludes id, exerciseId, recordedAt)
   * @returns Promise resolving to the updated record, or undefined if not found
   */
  async update(
    id: string,
    data: Partial<Omit<MaxRecord, 'id' | 'exerciseId' | 'recordedAt'>>
  ): Promise<MaxRecord | undefined> {
    const existing = await db.maxRecords.get(id);
    if (!existing) return undefined;

    const updated: MaxRecord = {
      ...normalizeDates(existing, DATE_FIELDS),
      ...data,
    };
    await db.maxRecords.put(updated);
    return updated;
  },

  /**
   * Deletes a max record by ID.
   * @param id - The max record UUID
   * @returns Promise resolving to true if deleted, false if not found
   */
  async delete(id: string): Promise<boolean> {
    const existing = await db.maxRecords.get(id);
    if (!existing) return false;

    await db.maxRecords.delete(id);
    return true;
  },

  /**
   * Deletes all max records for an exercise.
   * Used when deleting an exercise.
   * @param exerciseId - The exercise UUID
   * @returns Promise resolving to the number of records deleted
   */
  async deleteAllForExercise(exerciseId: string): Promise<number> {
    return db.maxRecords.where('exerciseId').equals(exerciseId).delete();
  },
};
