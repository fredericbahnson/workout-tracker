import { db, generateId } from '@/data/db';
import type { Exercise, ExerciseFormData, ExerciseType, ExerciseCycleDefaults } from '@/types';
import { now, normalizeDates, normalizeDatesArray } from '@/utils/dateUtils';

const DATE_FIELDS: (keyof Exercise)[] = ['createdAt', 'updatedAt'];

/**
 * Repository for Exercise CRUD operations.
 * Handles all local database interactions for exercise definitions.
 */
export const ExerciseRepo = {
  /**
   * Retrieves all exercises from the database, sorted by name.
   * @returns Promise resolving to array of all exercises
   */
  async getAll(): Promise<Exercise[]> {
    const records = await db.exercises.orderBy('name').toArray();
    return normalizeDatesArray(records, DATE_FIELDS);
  },

  /**
   * Retrieves a single exercise by ID.
   * @param id - The exercise UUID
   * @returns Promise resolving to the exercise, or undefined if not found
   */
  async getById(id: string): Promise<Exercise | undefined> {
    const record = await db.exercises.get(id);
    return record ? normalizeDates(record, DATE_FIELDS) : undefined;
  },

  /**
   * Retrieves all exercises of a specific type.
   * @param type - The exercise type (push, pull, legs, etc.)
   * @returns Promise resolving to array of matching exercises
   */
  async getByType(type: ExerciseType): Promise<Exercise[]> {
    const records = await db.exercises.where('type').equals(type).toArray();
    return normalizeDatesArray(records, DATE_FIELDS);
  },

  /**
   * Creates a new exercise.
   * @param data - The exercise form data
   * @returns Promise resolving to the created exercise with generated ID and timestamps
   */
  async create(data: ExerciseFormData): Promise<Exercise> {
    const timestamp = now();
    const exercise: Exercise = {
      ...data,
      id: generateId(),
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    await db.exercises.add(exercise);
    return exercise;
  },

  /**
   * Updates an existing exercise.
   * @param id - The exercise UUID to update
   * @param data - Partial exercise data to merge
   * @returns Promise resolving to the updated exercise, or undefined if not found
   */
  async update(id: string, data: Partial<ExerciseFormData>): Promise<Exercise | undefined> {
    const existing = await this.getById(id);
    if (!existing) return undefined;

    const updated: Exercise = {
      ...existing,
      ...data,
      updatedAt: now(),
    };
    await db.exercises.put(updated);
    return updated;
  },

  /**
   * Deletes an exercise by ID.
   * @param id - The exercise UUID to delete
   * @returns Promise resolving to true if deleted, false if not found
   */
  async delete(id: string): Promise<boolean> {
    const existing = await db.exercises.get(id);
    if (!existing) return false;

    await db.exercises.delete(id);
    return true;
  },

  /**
   * Searches exercises by name (case-insensitive partial match).
   * @param query - The search query string
   * @returns Promise resolving to array of matching exercises
   */
  async search(query: string): Promise<Exercise[]> {
    const lowerQuery = query.toLowerCase();
    const records = await db.exercises
      .filter(ex => ex.name.toLowerCase().includes(lowerQuery))
      .toArray();
    return normalizeDatesArray(records, DATE_FIELDS);
  },

  /**
   * Updates the last cycle settings for an exercise.
   * These settings are used as smart defaults when adding the exercise to new cycles.
   * @param exerciseId - The exercise UUID
   * @param settings - The cycle defaults to save
   */
  async updateLastCycleSettings(
    exerciseId: string,
    settings: ExerciseCycleDefaults
  ): Promise<void> {
    const existing = await this.getById(exerciseId);
    if (!existing) return;

    await db.exercises.put({
      ...existing,
      lastCycleSettings: settings,
      updatedAt: now(),
    });
  },
};
