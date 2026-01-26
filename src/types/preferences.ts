/**
 * User Preferences Types
 *
 * Types for training preferences that sync across devices.
 * UI preferences (theme, font size, etc.) remain in localStorage only.
 */

import type { ExerciseType } from './exercise';
import type { SchedulingMode } from './cycle';
import { TIMER } from '@/constants/training';

/**
 * Weekly set goals per exercise type.
 */
export type WeeklySetGoals = Record<ExerciseType, number>;

/**
 * Timer settings configuration.
 */
export interface TimerSettings {
  enabled: boolean;
  durationSeconds: number;
}

/**
 * Application mode determines available features.
 * - standard: RFEM and Max Testing cycles only (simplified interface)
 * - advanced: All cycle types and features available
 */
export type AppMode = 'standard' | 'advanced';

/**
 * User training preferences that sync across devices.
 *
 * These preferences affect workout cycle creation and are
 * important to maintain consistency across devices.
 */
export interface UserPreferences {
  /** Unique identifier (matches user ID for simplicity) */
  id: string;

  /** Application mode - determines available features */
  appMode: AppMode;

  /** Default max reps for RFEM calculations when no max record exists */
  defaultMaxReps: number;

  /** Default starting reps for conditioning exercises */
  defaultConditioningReps: number;

  /** Weekly rep increase for conditioning exercises */
  conditioningWeeklyIncrement: number;

  /** Target weekly sets per exercise type */
  weeklySetGoals: WeeklySetGoals;

  /** Rest timer settings */
  restTimer: TimerSettings;

  /** Max testing rest timer settings */
  maxTestRestTimer: TimerSettings;

  /** Timer beep volume (0-100, 0 = muted) */
  timerVolume: number;

  /** Last used scheduling mode for cycle creation */
  lastSchedulingMode?: SchedulingMode;

  /** When preferences were created */
  createdAt: Date;

  /** When preferences were last updated */
  updatedAt: Date;

  /**
   * Timestamp when user acknowledged health and safety disclaimer.
   * Required to use the app. Null means not yet acknowledged.
   * Stored as ISO string for serialization compatibility.
   */
  healthDisclaimerAcknowledgedAt: string | null;
}

/**
 * Default values for user preferences.
 * Used when creating new preferences or as fallback.
 */
export const DEFAULT_USER_PREFERENCES: Omit<UserPreferences, 'id' | 'createdAt' | 'updatedAt'> = {
  appMode: 'advanced', // Default to advanced so trial users see all features
  defaultMaxReps: 10,
  defaultConditioningReps: 30,
  conditioningWeeklyIncrement: 10,
  weeklySetGoals: {
    push: 10,
    pull: 10,
    legs: 10,
    core: 10,
    balance: 10,
    mobility: 10,
    other: 10,
  },
  restTimer: {
    enabled: false,
    durationSeconds: TIMER.DEFAULT_REST_SECONDS,
  },
  maxTestRestTimer: {
    enabled: false,
    durationSeconds: TIMER.DEFAULT_MAX_TEST_REST_SECONDS,
  },
  timerVolume: 100, // 0-100 scale, percentage of system volume (100 = full system volume)
  healthDisclaimerAcknowledgedAt: null,
};
