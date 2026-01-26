import type {
  UserPreferences,
  TimerSettings,
  ExerciseType,
  AppMode,
  SchedulingMode,
} from '@/types';
import { DEFAULT_USER_PREFERENCES } from '@/types';

export interface SyncedPreferencesContextType {
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

  /** Update timer volume (0-100) */
  setTimerVolume: (volume: number) => Promise<void>;

  /** Update last scheduling mode for cycle creation */
  setLastSchedulingMode: (mode: SchedulingMode) => Promise<void>;
}

// Default preferences object for initial state
export const defaultPrefs: UserPreferences = {
  id: '',
  ...DEFAULT_USER_PREFERENCES,
  createdAt: new Date(),
  updatedAt: new Date(),
};
