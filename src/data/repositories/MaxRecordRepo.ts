import { db, generateId } from '@/data/db';
import type { MaxRecord } from '@/types';
import { now, normalizeDates, normalizeDatesArray, compareDates } from '@/utils/dateUtils';

const DATE_FIELDS: (keyof MaxRecord)[] = ['recordedAt'];

export const MaxRecordRepo = {
  async getAllForExercise(exerciseId: string): Promise<MaxRecord[]> {
    const records = await db.maxRecords
      .where('exerciseId')
      .equals(exerciseId)
      .toArray();
    const normalized = normalizeDatesArray(records, DATE_FIELDS);
    // Sort descending by recordedAt
    return normalized.sort((a, b) => compareDates(b.recordedAt, a.recordedAt));
  },

  async getLatestForExercise(exerciseId: string): Promise<MaxRecord | undefined> {
    const records = await this.getAllForExercise(exerciseId);
    return records[0];
  },

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

  async create(exerciseId: string, maxReps?: number, maxTime?: number, notes: string = '', weight?: number): Promise<MaxRecord> {
    const record: MaxRecord = {
      id: generateId(),
      exerciseId,
      maxReps,
      maxTime,
      weight,
      notes,
      recordedAt: now()
    };
    await db.maxRecords.add(record);
    return record;
  },

  async update(id: string, data: Partial<Omit<MaxRecord, 'id' | 'exerciseId' | 'recordedAt'>>): Promise<MaxRecord | undefined> {
    const existing = await db.maxRecords.get(id);
    if (!existing) return undefined;

    const updated: MaxRecord = { 
      ...normalizeDates(existing, DATE_FIELDS), 
      ...data 
    };
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
