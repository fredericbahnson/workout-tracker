import { db, generateId } from '../db';
import type { Exercise, ExerciseFormData, ExerciseType } from '../../types';

export const ExerciseRepo = {
  async getAll(): Promise<Exercise[]> {
    return db.exercises.orderBy('name').toArray();
  },

  async getById(id: string): Promise<Exercise | undefined> {
    return db.exercises.get(id);
  },

  async getByType(type: ExerciseType): Promise<Exercise[]> {
    return db.exercises.where('type').equals(type).toArray();
  },

  async create(data: ExerciseFormData): Promise<Exercise> {
    const now = new Date();
    const exercise: Exercise = {
      ...data,
      id: generateId(),
      createdAt: now,
      updatedAt: now
    };
    await db.exercises.add(exercise);
    return exercise;
  },

  async update(id: string, data: Partial<ExerciseFormData>): Promise<Exercise | undefined> {
    const existing = await db.exercises.get(id);
    if (!existing) return undefined;

    const updated: Exercise = {
      ...existing,
      ...data,
      updatedAt: new Date()
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
    return db.exercises
      .filter(ex => ex.name.toLowerCase().includes(lowerQuery))
      .toArray();
  }
};
