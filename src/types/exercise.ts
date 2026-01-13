/**
 * Exercise Types
 *
 * Types related to exercise definitions and personal records.
 */

/**
 * Category of exercise for grouping and set distribution.
 */
export type ExerciseType = 'push' | 'pull' | 'legs' | 'core' | 'balance' | 'mobility' | 'other';

/**
 * Exercise mode determining how progression is calculated.
 * - standard: Uses max record for RFEM calculations
 * - conditioning: Uses base value with weekly increments
 */
export type ExerciseMode = 'standard' | 'conditioning';

/**
 * How the exercise is measured.
 * - reps: Count-based (e.g., "10 reps")
 * - time: Duration-based in seconds (e.g., "30 seconds")
 */
export type MeasurementType = 'reps' | 'time';

/**
 * Custom parameter definition for exercise-specific tracking.
 */
export interface CustomParameter {
  name: string;
  type: 'text' | 'number' | 'select';
  options?: string[];
  defaultValue?: string | number;
}

/**
 * Per-exercise progression mode for mixed cycles.
 */
export type ExerciseProgressionMode = 'rfem' | 'simple';

/**
 * How often progression increments are applied.
 */
export type ProgressionInterval = 'constant' | 'per_workout' | 'per_week';

/**
 * Stores the last-used cycle settings for an exercise.
 * Used to provide smart defaults when adding exercises to new cycles (especially mixed mode).
 */
export interface ExerciseCycleDefaults {
  /** Which mode was last used for this exercise */
  progressionMode: ExerciseProgressionMode;

  /** Conditioning increments (for conditioning exercises in mixed mode) */
  conditioningRepIncrement?: number;
  conditioningTimeIncrement?: number;

  /** Simple progression settings */
  simpleBaseReps?: number;
  simpleBaseTime?: number;
  simpleBaseWeight?: number;
  simpleRepProgressionType?: ProgressionInterval;
  simpleRepIncrement?: number;
  simpleTimeProgressionType?: ProgressionInterval;
  simpleTimeIncrement?: number;
  simpleWeightProgressionType?: ProgressionInterval;
  simpleWeightIncrement?: number;
}

/**
 * An exercise definition.
 */
export interface Exercise {
  id: string;
  name: string;
  type: ExerciseType;
  mode: ExerciseMode;
  measurementType: MeasurementType;
  notes: string;
  customParameters: CustomParameter[];
  /** Default starting reps for conditioning exercises */
  defaultConditioningReps?: number;
  /** Default starting time in seconds for time-based conditioning */
  defaultConditioningTime?: number;
  /** Whether this exercise tracks added weight */
  weightEnabled?: boolean;
  /** Default weight in lbs (optional convenience) */
  defaultWeight?: number;
  /** Last used cycle settings for smart defaults */
  lastCycleSettings?: ExerciseCycleDefaults;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * A personal record for an exercise.
 */
export interface MaxRecord {
  id: string;
  exerciseId: string;
  /** Max reps (for rep-based exercises) */
  maxReps?: number;
  /** Max time in seconds (for time-based exercises) */
  maxTime?: number;
  /** Weight in lbs (undefined = bodyweight) */
  weight?: number;
  recordedAt: Date;
  notes: string;
}
