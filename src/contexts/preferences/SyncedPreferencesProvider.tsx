/**
 * Synced Preferences Provider
 *
 * Provides training preferences that sync across devices.
 * These preferences affect workout cycle creation and are important
 * to maintain consistency across devices.
 *
 * UI preferences (theme, font size, etc.) remain in the local appStore.
 */

import { useState, useEffect, useCallback, useMemo, type ReactNode } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { UserPreferencesRepo } from '@/data/repositories';
import { useSyncItem, useSync } from '../sync';
import { useAuth } from '../auth';
import { createScopedLogger } from '@/utils/logger';
import type {
  UserPreferences,
  TimerSettings,
  ExerciseType,
  AppMode,
  SchedulingMode,
} from '@/types';
import { SyncedPreferencesContext } from './SyncedPreferencesContext';
import { defaultPrefs } from './types';

const log = createScopedLogger('SyncedPrefs');

export function SyncedPreferencesProvider({ children }: { children: ReactNode }) {
  const { syncItem } = useSyncItem();
  const { lastSyncTime } = useSync();
  const { user, isConfigured } = useAuth();
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

  // Set loading state based on sync status (not query completion)
  // For authenticated users, wait for initial sync to complete before showing content
  // This prevents the health disclaimer from flashing for returning users
  useEffect(() => {
    if (user && isConfigured) {
      // For authenticated users, wait for sync to complete
      const syncCompleted = lastSyncTime !== null;
      const isOffline = !navigator.onLine;
      if (syncCompleted || isOffline) {
        setIsLoading(false);
      } else {
        // Sync not yet complete - keep loading
        setIsLoading(true);
      }
    } else {
      // No auth or not configured - use local data immediately
      setIsLoading(false);
    }
  }, [lastSyncTime, user, isConfigured]);

  // Current preferences with fallback to defaults
  const preferences = dbPreferences ?? defaultPrefs;

  // Computed: whether user has acknowledged health disclaimer
  const hasAcknowledgedHealthDisclaimer = useMemo(
    () => preferences.healthDisclaimerAcknowledgedAt !== null,
    [preferences.healthDisclaimerAcknowledgedAt]
  );

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

  const setTimerVolume = useCallback(
    async (volume: number) => {
      const updated = await UserPreferencesRepo.setTimerVolume(volume);
      await saveAndSync(updated);
    },
    [saveAndSync]
  );

  const setLastSchedulingMode = useCallback(
    async (mode: SchedulingMode) => {
      const updated = await UserPreferencesRepo.setLastSchedulingMode(mode);
      await saveAndSync(updated);
    },
    [saveAndSync]
  );

  const acknowledgeHealthDisclaimer = useCallback(async () => {
    const updated = await UserPreferencesRepo.acknowledgeHealthDisclaimer();
    await saveAndSync(updated);
  }, [saveAndSync]);

  return (
    <SyncedPreferencesContext.Provider
      value={{
        preferences,
        isLoading,
        hasAcknowledgedHealthDisclaimer,
        acknowledgeHealthDisclaimer,
        setAppMode,
        setDefaultMaxReps,
        setDefaultConditioningReps,
        setConditioningWeeklyIncrement,
        setWeeklySetGoal,
        setRestTimer,
        setMaxTestRestTimer,
        setTimerVolume,
        setLastSchedulingMode,
      }}
    >
      {children}
    </SyncedPreferencesContext.Provider>
  );
}
