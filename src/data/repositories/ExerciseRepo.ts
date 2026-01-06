import { db, generateId } from '../db';
import type { Exercise, ExerciseFormData, ExerciseType } from '../../types';
import { now, normalizeDates, normalizeDatesArray } from '../../utils/dateUtils';

const DATE_FIELDS: (keyof Exercise)[] = ['createdAt', 'updatedAt'];

export const ExerciseRepo = {
  async getAll(): Promise<Exercise[]> {
    const records = await db.exercises.orderBy('name').toArray();
    return normalizeDatesArray(records, DATE_FIELDS);
  },

  async getById(id: string): Promise<Exercise | undefined> {
    const record = await db.exercises.get(id);
    return record ? normalizeDates(record, DATE_FIELDS) : undefined;
  },

  async getByType(type: ExerciseType): Promise<Exercise[]> {
    const records = await db.exercises.where('type').equals(type).toArray();
    return normalizeDatesArray(records, DATE_FIELDS);
  },

  async create(data: ExerciseFormData): Promise<Exercise> {
    const timestamp = now();
    const exercise: Exercise = {
      ...data,
      id: generateId(),
      createdAt: timestamp,
      updatedAt: timestamp
    };
    await db.exercises.add(exercise);
    return exercise;
  },

  async update(id: string, data: Partial<ExerciseFormData>): Promise<Exercise | undefined> {
    const existing = await this.getById(id);
    if (!existing) return undefined;

    const updated: Exercise = {
      ...existing,
      ...data,
      updatedAt: now()
    };
    await db.exercises.put(updated);
    return updated;
  },

  async delete(id: string): Promise<boolean> {
    const existing = await db.exercises.get(id);
    if (!existing) return false;
    
    await db.exercises.delete(id);
    return true;
  },

  async search(query: string): Promise<Exercise[]> {
    const lowerQuery = query.toLowerCase();
    const records = await db.exercises
      .filter(ex => ex.name.toLowerCase().includes(lowerQuery))
      .toArray();
    return normalizeDatesArray(records, DATE_FIELDS);
  }
};
