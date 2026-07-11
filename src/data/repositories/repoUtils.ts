import { normalizeDates } from '@/utils/dateUtils';

/**
 * Minimal structural interface for a Dexie table keyed by string id.
 * Lets the shared helpers work with any of the app's EntityTables.
 */
interface RepoTable<T> {
  get(id: string): Promise<T | undefined>;
  delete(id: string): Promise<void>;
}

/**
 * Fetches a record by id and normalizes its date fields.
 * Shared implementation of the getById pattern used across repositories.
 */
export async function getNormalized<T>(
  table: RepoTable<T>,
  id: string,
  dateFields: (keyof T)[]
): Promise<T | undefined> {
  const record = await table.get(id);
  return record ? normalizeDates(record, dateFields) : undefined;
}

/**
 * Deletes a record by id, returning whether it existed.
 * Shared implementation of the delete pattern used across repositories.
 */
export async function deleteIfExists<T>(table: RepoTable<T>, id: string): Promise<boolean> {
  const existing = await table.get(id);
  if (!existing) return false;

  await table.delete(id);
  return true;
}
