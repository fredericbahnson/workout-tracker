/**
 * User Preferences Repository
 *
 * Manages user training preferences that sync across devices.
 * This is a singleton record per user (one preferences record per local database).
 */

import { db, generateId } from '@/data/db';
import type {
  UserPreferences,
  WeeklySetGoals,
  TimerSettings,
  ExerciseType,
  AppMode,
} from '@/types';
import { DEFAULT_USER_PREFERENCES } from '@/types';
import { now, normalizeDates } from '@/utils/dateUtils';

const DATE_FIELDS: (keyof UserPreferences)[] = ['createdAt', 'updatedAt'];

// Local storage key for preferences ID (so we maintain the same ID across sessions)
const PREFS_ID_KEY = 'ascend-preferences-id';

/**
 * Get or create the preferences ID.
 * This ensures we always use the same ID for the local preferences record.
 */
function getOrCreatePreferencesId(): string {
  let id = localStorage.getItem(PREFS_ID_KEY);
  if (!id) {
    id = generateId();
    localStorage.setItem(PREFS_ID_KEY, id);
  }
  return id;
}

export const UserPreferencesRepo = {
  /**
   * Get the current user preferences.
   * Returns default values if no preferences exist yet.
   */
  async get(): Promise<UserPreferences> {
    const records = await db.userPreferences.toArray();

    if (records.length > 0) {
      return normalizeDates(records[0], DATE_FIELDS);
    }

    // Return defaults with a generated ID
    const timestamp = now();
    return {
      id: getOrCreatePreferencesId(),
      ...DEFAULT_USER_PREFERENCES,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
  },

  /**
   * Get preferences by ID (used during sync).
   */
  async getById(id: string): Promise<UserPreferences | undefined> {
    const record = await db.userPreferences.get(id);
    return record ? normalizeDates(record, DATE_FIELDS) : undefined;
  },

  /**
   * Save user preferences.
   * Creates if not exists, updates if exists.
   */
  async save(prefs: Partial<UserPreferences>): Promise<UserPreferences> {
    const existing = await this.get();
    const timestamp = now();

    const updated: UserPreferences = {
      ...existing,
      ...prefs,
      id: existing.id, // Always keep the same ID
      updatedAt: timestamp,
    };

    await db.userPreferences.put(updated);
    return updated;
  },

  /**
   * Update default max reps.
   */
  async setDefaultMaxReps(value: number): Promise<UserPreferences> {
    return this.save({ defaultMaxReps: value });
  },

  /**
   * Update default conditioning reps.
   */
  async setDefaultConditioningReps(value: number): Promise<UserPreferences> {
    return this.save({ defaultConditioningReps: value });
  },

  /**
   * Update conditioning weekly increment.
   */
  async setConditioningWeeklyIncrement(value: number): Promise<UserPreferences> {
    return this.save({ conditioningWeeklyIncrement: value });
  },

  /**
   * Update a single weekly set goal.
   */
  async setWeeklySetGoal(type: ExerciseType, value: number): Promise<UserPreferences> {
    const current = await this.get();
    return this.save({
      weeklySetGoals: {
        ...current.weeklySetGoals,
        [type]: value,
      },
    });
  },

  /**
   * Update all weekly set goals.
   */
  async setWeeklySetGoals(goals: WeeklySetGoals): Promise<UserPreferences> {
    return this.save({ weeklySetGoals: goals });
  },

  /**
   * Update rest timer settings.
   */
  async setRestTimer(settings: Partial<TimerSettings>): Promise<UserPreferences> {
    const current = await this.get();
    return this.save({
      restTimer: {
        ...current.restTimer,
        ...settings,
      },
    });
  },

  /**
   * Update max test rest timer settings.
   */
  async setMaxTestRestTimer(settings: Partial<TimerSettings>): Promise<UserPreferences> {
    const current = await this.get();
    return this.save({
      maxTestRestTimer: {
        ...current.maxTestRestTimer,
        ...settings,
      },
    });
  },

  /**
   * Update app mode (standard or advanced).
   */
  async setAppMode(mode: AppMode): Promise<UserPreferences> {
    return this.save({ appMode: mode });
  },

  /**
   * Reset preferences to defaults.
   */
  async reset(): Promise<UserPreferences> {
    const timestamp = now();
    const id = getOrCreatePreferencesId();

    const defaults: UserPreferences = {
      id,
      ...DEFAULT_USER_PREFERENCES,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    await db.userPreferences.put(defaults);
    return defaults;
  },

  /**
   * Clear all preferences (used during data clear).
   */
  async clear(): Promise<void> {
    await db.userPreferences.clear();
    localStorage.removeItem(PREFS_ID_KEY);
  },

  /**
   * Put a preferences record directly (used during sync).
   */
  async put(prefs: UserPreferences): Promise<void> {
    await db.userPreferences.put(prefs);
    // Update the local ID reference if this is from cloud sync
    localStorage.setItem(PREFS_ID_KEY, prefs.id);
  },
};
