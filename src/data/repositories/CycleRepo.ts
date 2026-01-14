import { db, generateId } from '@/data/db';
import type { Cycle, Group, ExerciseAssignment } from '@/types';
import { now, normalizeDates, normalizeDatesArray, compareDates } from '@/utils/dateUtils';

export type CycleFormData = Omit<Cycle, 'id' | 'createdAt' | 'updatedAt'>;

const DATE_FIELDS: (keyof Cycle)[] = ['startDate', 'createdAt', 'updatedAt'];

/**
 * Repository for Cycle CRUD operations.
 * Handles training cycle configuration and lifecycle management.
 */
export const CycleRepo = {
  /**
   * Retrieves all cycles, sorted by start date descending.
   * @returns Promise resolving to array of all cycles (newest first)
   */
  async getAll(): Promise<Cycle[]> {
    const records = await db.cycles.toArray();
    const normalized = normalizeDatesArray(records, DATE_FIELDS);
    // Sort descending by startDate
    return normalized.sort((a, b) => compareDates(b.startDate, a.startDate));
  },

  /**
   * Retrieves a cycle by ID.
   * @param id - The cycle UUID
   * @returns Promise resolving to the cycle, or undefined if not found
   */
  async getById(id: string): Promise<Cycle | undefined> {
    const record = await db.cycles.get(id);
    return record ? normalizeDates(record, DATE_FIELDS) : undefined;
  },

  /**
   * Retrieves the currently active cycle (status = 'active').
   * @returns Promise resolving to the active cycle, or undefined if none
   */
  async getActive(): Promise<Cycle | undefined> {
    const record = await db.cycles.where('status').equals('active').first();
    return record ? normalizeDates(record, DATE_FIELDS) : undefined;
  },

  /**
   * Creates a new cycle.
   * @param data - Cycle configuration data
   * @returns Promise resolving to the created cycle
   */
  async create(data: CycleFormData): Promise<Cycle> {
    const timestamp = now();
    const cycle: Cycle = {
      ...data,
      id: generateId(),
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    await db.cycles.add(cycle);
    return cycle;
  },

  /**
   * Updates an existing cycle.
   * @param id - The cycle UUID
   * @param data - Partial cycle data to merge
   * @returns Promise resolving to updated cycle, or undefined if not found
   */
  async update(id: string, data: Partial<CycleFormData>): Promise<Cycle | undefined> {
    const existing = await this.getById(id);
    if (!existing) return undefined;

    const updated: Cycle = {
      ...existing,
      ...data,
      updatedAt: now(),
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
      exerciseAssignments,
    };
  },
};
