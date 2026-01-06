import { db, generateId } from '../db';
import type { Cycle, Group, ExerciseAssignment } from '../../types';
import { now, normalizeDates, normalizeDatesArray, compareDates } from '../../utils/dateUtils';

export type CycleFormData = Omit<Cycle, 'id' | 'createdAt' | 'updatedAt'>;

const DATE_FIELDS: (keyof Cycle)[] = ['startDate', 'createdAt', 'updatedAt'];

export const CycleRepo = {
  async getAll(): Promise<Cycle[]> {
    const records = await db.cycles.toArray();
    const normalized = normalizeDatesArray(records, DATE_FIELDS);
    // Sort descending by startDate
    return normalized.sort((a, b) => compareDates(b.startDate, a.startDate));
  },

  async getById(id: string): Promise<Cycle | undefined> {
    const record = await db.cycles.get(id);
    return record ? normalizeDates(record, DATE_FIELDS) : undefined;
  },

  async getActive(): Promise<Cycle | undefined> {
    const record = await db.cycles.where('status').equals('active').first();
    return record ? normalizeDates(record, DATE_FIELDS) : undefined;
  },

  async create(data: CycleFormData): Promise<Cycle> {
    const timestamp = now();
    const cycle: Cycle = {
      ...data,
      id: generateId(),
      createdAt: timestamp,
      updatedAt: timestamp
    };
    await db.cycles.add(cycle);
    return cycle;
  },

  async update(id: string, data: Partial<CycleFormData>): Promise<Cycle | undefined> {
    const existing = await this.getById(id);
    if (!existing) return undefined;

    const updated: Cycle = {
      ...existing,
      ...data,
      updatedAt: now()
    };
    await db.cycles.put(updated);
    return updated;
  },

  async setActive(id: string): Promise<void> {
    // Deactivate any currently active cycle
    const activeCycle = await this.getActive();
    if (activeCycle && activeCycle.id !== id) {
      await this.update(activeCycle.id, { status: 'completed' });
    }
    // Activate the new cycle
    await this.update(id, { status: 'active' });
  },

  async delete(id: string): Promise<boolean> {
    const existing = await db.cycles.get(id);
    if (!existing) return false;
    
    await db.cycles.delete(id);
    return true;
  },

  // Helper to create a group with generated ID
  createGroup(name: string, exerciseAssignments: ExerciseAssignment[] = []): Group {
    return {
      id: generateId(),
      name,
      exerciseAssignments
    };
  }
};
