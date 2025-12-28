import { db, generateId } from '../db';
import type { MaxRecord } from '../../types';

export const MaxRecordRepo = {
  async getAllForExercise(exerciseId: string): Promise<MaxRecord[]> {
    return db.maxRecords
      .where('exerciseId')
      .equals(exerciseId)
      .reverse()
      .sortBy('recordedAt');
  },

  async getLatestForExercise(exerciseId: string): Promise<MaxRecord | undefined> {
    const records = await db.maxRecords
      .where('exerciseId')
      .equals(exerciseId)
      .reverse()
      .sortBy('recordedAt');
    return records[0];
  },

  async getLatestForAllExercises(): Promise<Map<string, MaxRecord>> {
    const allRecords = await db.maxRecords.toArray();
    const latestByExercise = new Map<string, MaxRecord>();
    
    // Sort by date and keep latest for each exercise
    allRecords.sort((a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime());
    
    for (const record of allRecords) {
      if (!latestByExercise.has(record.exerciseId)) {
        latestByExercise.set(record.exerciseId, record);
      }
    }
    
    return latestByExercise;
  },

  async create(exerciseId: string, maxReps?: number, maxTime?: number, notes: string = '', weight?: number): Promise<MaxRecord> {
    const record: MaxRecord = {
      id: generateId(),
      exerciseId,
      maxReps,
      maxTime,
      weight,
      notes,
      recordedAt: new Date()
    };
    await db.maxRecords.add(record);
    return record;
  },

  async update(id: string, data: Partial<Omit<MaxRecord, 'id' | 'exerciseId' | 'recordedAt'>>): Promise<MaxRecord | undefined> {
    const existing = await db.maxRecords.get(id);
    if (!existing) return undefined;

    const updated: MaxRecord = { ...existing, ...data };
    await db.maxRecords.put(updated);
    return updated;
  },

  async delete(id: string): Promise<boolean> {
    const existing = await db.maxRecords.get(id);
    if (!existing) return false;
    
    await db.maxRecords.delete(id);
    return true;
  },

  async deleteAllForExercise(exerciseId: string): Promise<number> {
    return db.maxRecords.where('exerciseId').equals(exerciseId).delete();
  }
};
