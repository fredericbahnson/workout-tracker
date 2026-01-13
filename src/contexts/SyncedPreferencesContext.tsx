/**
 * Synced Preferences Context
 *
 * Provides training preferences that sync across devices.
 * These preferences affect workout cycle creation and are important
 * to maintain consistency across devices.
 *
 * UI preferences (theme, font size, etc.) remain in the local appStore.
 */

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { UserPreferencesRepo } from '@/data/repositories';
import { useSyncItem, useSync } from './SyncContext';
import { createScopedLogger } from '@/utils/logger';
import type { UserPreferences, TimerSettings, ExerciseType, AppMode } from '@/types';
import { DEFAULT_USER_PREFERENCES } from '@/types';

const log = createScopedLogger('SyncedPrefs');

interface SyncedPreferencesContextType {
  /** Current preferences (always has a value, uses defaults if not loaded) */
  preferences: UserPreferences;

  /** Whether preferences are currently loading */
  isLoading: boolean;

  /** Update app mode (standard or advanced) */
  setAppMode: (mode: AppMode) => Promise<void>;

  /** Update default max reps */
  setDefaultMaxReps: (value: number) => Promise<void>;

  /** Update default conditioning reps */
  setDefaultConditioningReps: (value: number) => Promise<void>;

  /** Update conditioning weekly increment */
  setConditioningWeeklyIncrement: (value: number) => Promise<void>;

  /** Update a single weekly set goal */
  setWeeklySetGoal: (type: ExerciseType, value: number) => Promise<void>;

  /** Update rest timer settings */
  setRestTimer: (settings: Partial<TimerSettings>) => Promise<void>;

  /** Update max test rest timer settings */
  setMaxTestRestTimer: (settings: Partial<TimerSettings>) => Promise<void>;
}

const SyncedPreferencesContext = createContext<SyncedPreferencesContextType | undefined>(undefined);

// Default preferences object for initial state
const defaultPrefs: UserPreferences = {
  id: '',
  ...DEFAULT_USER_PREFERENCES,
  createdAt: new Date(),
  updatedAt: new Date(),
};

export function SyncedPreferencesProvider({ children }: { children: ReactNode }) {
  const { syncItem } = useSyncItem();
  const { lastSyncTime } = useSync();
  const [isLoading, setIsLoading] = useState(true);

  // Use live query to reactively get preferences from IndexedDB
  const dbPreferences = useLiveQuery(
    async () => {
      try {
        return await UserPreferencesRepo.get();
      } catch (error) {
        log.error(error as Error, { context: 'loadPreferences' });
        return null;
      }
    },
    [lastSyncTime] // Re-query when sync completes
  );

  // Set loading state based on query result
  useEffect(() => {
    if (dbPreferences !== undefined) {
      setIsLoading(false);
    }
  }, [dbPreferences]);

  // Current preferences with fallback to defaults
  const preferences = dbPreferences ?? defaultPrefs;

  // Helper to save and sync
  const saveAndSync = useCallback(
    async (updated: UserPreferences) => {
      try {
        await syncItem('user_preferences', updated);
      } catch (error) {
        log.error(error as Error, { context: 'syncPreferences' });
      }
    },
    [syncItem]
  );

  // Setters
  const setAppMode = useCallback(
    async (mode: AppMode) => {
      const updated = await UserPreferencesRepo.setAppMode(mode);
      await saveAndSync(updated);
    },
    [saveAndSync]
  );

  const setDefaultMaxReps = useCallback(
    async (value: number) => {
      const updated = await UserPreferencesRepo.setDefaultMaxReps(value);
      await saveAndSync(updated);
    },
    [saveAndSync]
  );

  const setDefaultConditioningReps = useCallback(
    async (value: number) => {
      const updated = await UserPreferencesRepo.setDefaultConditioningReps(value);
      await saveAndSync(updated);
    },
    [saveAndSync]
  );

  const setConditioningWeeklyIncrement = useCallback(
    async (value: number) => {
      const updated = await UserPreferencesRepo.setConditioningWeeklyIncrement(value);
      await saveAndSync(updated);
    },
    [saveAndSync]
  );

  const setWeeklySetGoal = useCallback(
    async (type: ExerciseType, value: number) => {
      const updated = await UserPreferencesRepo.setWeeklySetGoal(type, value);
      await saveAndSync(updated);
    },
    [saveAndSync]
  );

  const setRestTimer = useCallback(
    async (settings: Partial<TimerSettings>) => {
      const updated = await UserPreferencesRepo.setRestTimer(settings);
      await saveAndSync(updated);
    },
    [saveAndSync]
  );

  const setMaxTestRestTimer = useCallback(
    async (settings: Partial<TimerSettings>) => {
      const updated = await UserPreferencesRepo.setMaxTestRestTimer(settings);
      await saveAndSync(updated);
    },
    [saveAndSync]
  );

  return (
    <SyncedPreferencesContext.Provider
      value={{
        preferences,
        isLoading,
        setAppMode,
        setDefaultMaxReps,
        setDefaultConditioningReps,
        setConditioningWeeklyIncrement,
        setWeeklySetGoal,
        setRestTimer,
        setMaxTestRestTimer,
      }}
    >
      {children}
    </SyncedPreferencesContext.Provider>
  );
}

export function useSyncedPreferences() {
  const context = useContext(SyncedPreferencesContext);
  if (context === undefined) {
    throw new Error('useSyncedPreferences must be used within a SyncedPreferencesProvider');
  }
  return context;
}
