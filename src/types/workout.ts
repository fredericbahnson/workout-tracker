/**
 * Workout Types
 *
 * Types related to scheduled workouts, sets, and completed tracking.
 */

import type {
  ExerciseType,
  MeasurementType,
  ExerciseProgressionMode,
  ProgressionInterval,
} from './exercise';

/**
 * A single set within a scheduled workout.
 */
export interface ScheduledSet {
  id: string;
  exerciseId: string;
  exerciseType: ExerciseType;
  isConditioning: boolean;
  /** Only for conditioning exercises (reps) */
  conditioningBaseReps?: number;
  /** Only for conditioning exercises (time in seconds) */
  conditioningBaseTime?: number;
  setNumber: number;
  /** For warmup sets and max testing warmups */
  isWarmup?: boolean;
  /** 20 or 40 - intensity percentage for warmup sets */
  warmupPercentage?: number;
  /** For max testing: the actual max attempt */
  isMaxTest?: boolean;
  /** For reference during max testing (reps) */
  previousMaxReps?: number;
  /** For reference during max testing (time in seconds) */
  previousMaxTime?: number;
  /** Cached from exercise for display */
  measurementType?: MeasurementType;

  /**
   * Per-exercise mode (denormalized for mixed cycles).
   * For pure RFEM/simple cycles, this is undefined and cycle's mode is used.
   */
  progressionMode?: ExerciseProgressionMode;

  /**
   * Per-exercise conditioning increments (for mixed mode conditioning exercises).
   * Falls back to cycle-level values if undefined.
   */
  conditioningRepIncrement?: number;
  conditioningTimeIncrement?: number;

  /**
   * Simple mode progression settings (denormalized from ExerciseAssignment).
   * Populated when cycle.progressionMode === 'simple' OR
   * (cycle is 'mixed' AND exercise uses 'simple').
   */
  simpleBaseReps?: number;
  simpleBaseTime?: number;
  simpleBaseWeight?: number;
  simpleRepProgressionType?: ProgressionInterval;
  simpleRepIncrement?: number;
  simpleTimeProgressionType?: ProgressionInterval;
  simpleTimeIncrement?: number;
  simpleWeightProgressionType?: ProgressionInterval;
  simpleWeightIncrement?: number;

  /**
   * Note: target is calculated dynamically based on mode:
   * - RFEM mode: current max × RFEM percentage (using workout's rfemValue from cycle rotation)
   * - Simple mode: base + (increment × progression interval count)
   */
}

/**
 * A scheduled workout within a cycle.
 */
export interface ScheduledWorkout {
  id: string;
  cycleId: string;
  /** 1, 2, 3... within the cycle */
  sequenceNumber: number;
  /** 1-indexed week (for conditioning calculation) */
  weekNumber: number;
  /** 1-indexed day within week (for reference) */
  dayInWeek: number;
  groupId: string;
  rfem: number;
  scheduledSets: ScheduledSet[];
  status: 'pending' | 'completed' | 'partial' | 'skipped';
  /** When the workout was completed */
  completedAt?: Date;
  /** True if this is an ad-hoc workout (not from cycle schedule) */
  isAdHoc?: boolean;
  /** User-editable name for ad-hoc workouts */
  customName?: string;
  /** Target date for this workout (only when cycle.schedulingMode is 'date') */
  scheduledDate?: Date;
  /** User-provided reason when skipping an overdue workout */
  skipReason?: string;
}

/**
 * A completed set record.
 */
export interface CompletedSet {
  id: string;
  scheduledSetId: string | null;
  scheduledWorkoutId: string | null;
  exerciseId: string;
  /** Target reps OR target time in seconds */
  targetReps: number;
  /** Actual reps OR actual time in seconds */
  actualReps: number;
  /** Weight in lbs (undefined = bodyweight) */
  weight?: number;
  completedAt: Date;
  notes: string;
  parameters: Record<string, string | number>;
}
