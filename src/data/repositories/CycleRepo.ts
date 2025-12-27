import { db, generateId } from '../db';
import type { Cycle, Group, ExerciseAssignment } from '../../types';

export type CycleFormData = Omit<Cycle, 'id' | 'createdAt' | 'updatedAt'>;

export const CycleRepo = {
  async getAll(): Promise<Cycle[]> {
    return db.cycles.orderBy('startDate').reverse().toArray();
  },

  async getById(id: string): Promise<Cycle | undefined> {
    return db.cycles.get(id);
  },

  async getActive(): Promise<Cycle | undefined> {
    return db.cycles.where('status').equals('active').first();
  },

  async create(data: CycleFormData): Promise<Cycle> {
    const now = new Date();
    const cycle: Cycle = {
      ...data,
      id: generateId(),
      createdAt: now,
      updatedAt: now
    };
    await db.cycles.add(cycle);
    return cycle;
  },

  async update(id: string, data: Partial<CycleFormData>): Promise<Cycle | undefined> {
    const existing = await db.cycles.get(id);
    if (!existing) return undefined;

    const updated: Cycle = {
      ...existing,
      ...data,
      updatedAt: new Date()
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
