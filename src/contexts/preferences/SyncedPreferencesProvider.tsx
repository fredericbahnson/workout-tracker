/**
 * Synced Preferences Provider
 *
 * Provides training preferences that sync across devices.
 * These preferences affect workout cycle creation and are important
 * to maintain consistency across devices.
 *
 * UI preferences (theme, font size, etc.) remain in the local appStore.
 */

import { useRef, useEffect, useCallback, useMemo, type ReactNode } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { UserPreferencesRepo } from '@/data/repositories';
import { useSyncItem, useSync } from '../sync';
import { useAuth } from '../auth';
import { createScopedLogger } from '@/utils/logger';
import { HEALTH_DISCLAIMER_STORAGE_KEY } from '@/constants';
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
const HEALTH_DISCLAIMER_KEY = HEALTH_DISCLAIMER_STORAGE_KEY;

export function SyncedPreferencesProvider({ children }: { children: ReactNode }) {
  const { syncItem } = useSyncItem();
  const { lastSyncTime } = useSync();
  const { user, isConfigured } = useAuth();

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

  // Hold the last resolved preferences across live-query re-runs.
  // useLiveQuery returns undefined while (re-)querying — including when the
  // lastSyncTime dep changes after a sync completes. Falling back to defaults
  // during that window made hasAcknowledgedHealthDisclaimer flip false for a
  // frame, flashing the health disclaimer past users who already acknowledged
  // it (and past the hard stop for those who hadn't).
  const lastResolvedRef = useRef<UserPreferences | null>(null);
  if (dbPreferences !== undefined && dbPreferences !== null) {
    lastResolvedRef.current = dbPreferences;
  }
  const hasResolvedOnce = dbPreferences !== undefined || lastResolvedRef.current !== null;

  // Loading is DERIVED (not effect-driven) so there is never a stale frame
  // after `user` flips during sign-in/sign-up. The gate holds until:
  // - the first IndexedDB read resolves, and
  // - for online authenticated users, the initial sync of this session
  //   completes (so a returning user's cloud acknowledgment is present
  //   before the health disclaimer decision is made).
  const awaitingInitialSync = !!user && isConfigured && navigator.onLine && lastSyncTime === null;
  const isLoading = !hasResolvedOnce || awaitingInitialSync;

  // Current preferences: live value, else last known, else defaults
  const preferences = dbPreferences ?? lastResolvedRef.current ?? defaultPrefs;

  // Computed: whether user has acknowledged health disclaimer
  // Checks both localStorage (survives clearLocalDatabase on sign-in) and IndexedDB/cloud
  const hasAcknowledgedHealthDisclaimer = useMemo(
    () =>
      localStorage.getItem(HEALTH_DISCLAIMER_KEY) === 'true' ||
      preferences.healthDisclaimerAcknowledgedAt !== null,
    [preferences.healthDisclaimerAcknowledgedAt]
  );

  // Keep localStorage in sync with cloud/IndexedDB preference.
  // Covers the case where acknowledgment arrives via cloud sync
  // rather than the user clicking "I Understand & Agree" on this device.
  useEffect(() => {
    if (preferences.healthDisclaimerAcknowledgedAt !== null) {
      localStorage.setItem(HEALTH_DISCLAIMER_KEY, 'true');
    }
  }, [preferences.healthDisclaimerAcknowledgedAt]);

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
    localStorage.setItem(HEALTH_DISCLAIMER_KEY, 'true');
    const updated = await UserPreferencesRepo.acknowledgeHealthDisclaimer();
    await saveAndSync(updated);
  }, [saveAndSync]);

  const value = useMemo(
    () => ({
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
    }),
    [
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
    ]
  );

  return (
    <SyncedPreferencesContext.Provider value={value}>{children}</SyncedPreferencesContext.Provider>
  );
}
