// Core domain types

export type ExerciseType = 'push' | 'pull' | 'legs' | 'core' | 'balance' | 'mobility' | 'other';
export type ExerciseMode = 'standard' | 'conditioning';
export type MeasurementType = 'reps' | 'time';  // reps = count, time = seconds
export type CycleType = 'training' | 'max_testing';

// Progression mode for training cycles
export type ProgressionMode = 'rfem' | 'simple' | 'mixed';

// Per-exercise progression mode (for mixed cycles)
// In mixed mode, each exercise can independently use RFEM or simple progression
export type ExerciseProgressionMode = 'rfem' | 'simple';

// Progression interval type (for simple mode per-exercise settings)
export type ProgressionInterval = 'constant' | 'per_workout' | 'per_week';

export interface CustomParameter {
  name: string;
  type: 'text' | 'number' | 'select';
  options?: string[];
  defaultValue?: string | number;
}

/**
 * Stores the last-used cycle settings for an exercise.
 * Used to provide smart defaults when adding exercises to new cycles (especially mixed mode).
 */
export interface ExerciseCycleDefaults {
  // Which mode was last used for this exercise
  progressionMode: ExerciseProgressionMode;
  
  // Conditioning increments (for conditioning exercises in mixed mode)
  conditioningRepIncrement?: number;   // Reps to add per week
  conditioningTimeIncrement?: number;  // Seconds to add per week
  
  // Simple progression settings
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

export interface Exercise {
  id: string;
  name: string;
  type: ExerciseType;
  mode: ExerciseMode;
  measurementType: MeasurementType;           // 'reps' or 'time' (seconds)
  notes: string;
  customParameters: CustomParameter[];
  defaultConditioningReps?: number;           // Default starting reps for conditioning exercises
  defaultConditioningTime?: number;           // Default starting time in seconds for time-based conditioning
  weightEnabled?: boolean;                    // Whether this exercise tracks added weight
  defaultWeight?: number;                     // Default weight in lbs (optional convenience)
  lastCycleSettings?: ExerciseCycleDefaults;  // Last used cycle settings for smart defaults
  createdAt: Date;
  updatedAt: Date;
}

export interface MaxRecord {
  id: string;
  exerciseId: string;
  maxReps?: number;           // Max reps (for rep-based exercises)
  maxTime?: number;           // Max time in seconds (for time-based exercises)
  weight?: number;            // Weight in lbs (undefined = bodyweight)
  recordedAt: Date;
  notes: string;
}

// Cycle-related types

export interface ExerciseAssignment {
  exerciseId: string;
  
  // Per-exercise progression mode (for mixed cycles only)
  // undefined = defaults to 'rfem' in mixed mode, or follows cycle mode otherwise
  progressionMode?: ExerciseProgressionMode;
  
  // Per-exercise warmup toggle (for mixed cycles only)
  // In pure RFEM/simple modes, global cycle value is used
  includeWarmup?: boolean;
  
  // Conditioning settings (used in all modes)
  conditioningBaseReps?: number;     // For rep-based conditioning
  conditioningBaseTime?: number;     // For time-based conditioning (seconds)
  
  // Per-exercise conditioning increments (for mixed mode)
  // In pure RFEM/simple modes, global cycle values are used
  conditioningRepIncrement?: number;   // Reps to add per week
  conditioningTimeIncrement?: number;  // Seconds to add per week
  
  // Simple mode - base values
  simpleBaseReps?: number;           // Starting reps for simple mode
  simpleBaseTime?: number;           // Starting time in seconds for time-based
  simpleBaseWeight?: number;         // Starting weight in lbs (for weighted exercises)
  
  // Simple mode - rep/time progression
  simpleRepProgressionType?: ProgressionInterval;   // How reps progress
  simpleRepIncrement?: number;                       // Reps to add each interval
  simpleTimeProgressionType?: ProgressionInterval;  // How time progresses
  simpleTimeIncrement?: number;                      // Seconds to add each interval
  
  // Simple mode - weight progression
  simpleWeightProgressionType?: ProgressionInterval; // How weight progresses
  simpleWeightIncrement?: number;                     // Weight (lbs) to add each interval
}

export interface Group {
  id: string;
  name: string;
  exerciseAssignments: ExerciseAssignment[];
}

export interface Cycle {
  id: string;
  name: string;
  cycleType: CycleType;                // 'training' or 'max_testing'
  progressionMode?: ProgressionMode;   // 'rfem' (default), 'simple', or 'mixed' - only for training cycles
  previousCycleId?: string;            // Reference to the cycle this max testing follows
  startDate: Date;
  numberOfWeeks: number;
  workoutDaysPerWeek: number;
  weeklySetGoals: Record<ExerciseType, number>;
  groups: Group[];
  groupRotation: string[];
  rfemRotation: number[];              // Used for RFEM and mixed modes (applies to all RFEM exercises)
  conditioningWeeklyRepIncrement: number;   // Global fallback; mixed mode uses per-exercise increments
  conditioningWeeklyTimeIncrement?: number; // Global fallback; mixed mode uses per-exercise increments
  includeWarmupSets?: boolean;         // Whether to generate warmup sets for exercises
  includeTimedWarmups?: boolean;       // Include warmups for time-based exercises (when warmups enabled)
  status: 'planning' | 'active' | 'completed';
  createdAt: Date;
  updatedAt: Date;
}

export interface ScheduledSet {
  id: string;
  exerciseId: string;
  exerciseType: ExerciseType;
  isConditioning: boolean;
  conditioningBaseReps?: number;     // Only for conditioning exercises (reps)
  conditioningBaseTime?: number;     // Only for conditioning exercises (time in seconds)
  setNumber: number;
  isWarmup?: boolean;                // For warmup sets and max testing warmups
  warmupPercentage?: number;         // 20 or 40 - intensity percentage for warmup sets
  isMaxTest?: boolean;               // For max testing: the actual max attempt
  previousMaxReps?: number;          // For reference during max testing (reps)
  previousMaxTime?: number;          // For reference during max testing (time in seconds)
  measurementType?: MeasurementType; // Cached from exercise for display
  
  // Per-exercise mode (denormalized for mixed cycles)
  // For pure RFEM/simple cycles, this is undefined and cycle's mode is used
  progressionMode?: ExerciseProgressionMode;
  
  // Per-exercise conditioning increments (for mixed mode conditioning exercises)
  // Falls back to cycle-level values if undefined
  conditioningRepIncrement?: number;
  conditioningTimeIncrement?: number;
  
  // Simple mode progression settings (denormalized from ExerciseAssignment)
  // Populated when cycle.progressionMode === 'simple' OR (cycle is 'mixed' AND exercise uses 'simple')
  simpleBaseReps?: number;
  simpleBaseTime?: number;
  simpleBaseWeight?: number;
  simpleRepProgressionType?: ProgressionInterval;
  simpleRepIncrement?: number;
  simpleTimeProgressionType?: ProgressionInterval;
  simpleTimeIncrement?: number;
  simpleWeightProgressionType?: ProgressionInterval;
  simpleWeightIncrement?: number;
  
  // Note: target is calculated dynamically based on mode:
  // - RFEM mode: current max × RFEM percentage (using workout's rfemValue from cycle rotation)
  // - Simple mode: base + (increment × progression interval count)
}

export interface ScheduledWorkout {
  id: string;
  cycleId: string;
  sequenceNumber: number;           // 1, 2, 3... within the cycle
  weekNumber: number;               // 1-indexed week (for conditioning calculation)
  dayInWeek: number;                // 1-indexed day within week (for reference)
  groupId: string;
  rfem: number;
  scheduledSets: ScheduledSet[];
  status: 'pending' | 'completed' | 'partial' | 'skipped';
  completedAt?: Date;               // When the workout was completed
  isAdHoc?: boolean;                // True if this is an ad-hoc workout (not from cycle schedule)
  customName?: string;              // User-editable name for ad-hoc workouts
}

// Tracking types

export interface CompletedSet {
  id: string;
  scheduledSetId: string | null;
  scheduledWorkoutId: string | null;
  exerciseId: string;
  targetReps: number;              // Target reps OR target time in seconds
  actualReps: number;              // Actual reps OR actual time in seconds
  weight?: number;                 // Weight in lbs (undefined = bodyweight)
  completedAt: Date;
  notes: string;
  parameters: Record<string, string | number>;
}

// UI/Form types

export type ExerciseFormData = Omit<Exercise, 'id' | 'createdAt' | 'updatedAt'> & {
  initialMax?: number;       // Optional initial max reps to record at creation (standard exercises)
  initialMaxTime?: number;   // Optional initial max time in seconds (time-based standard exercises)
  startingReps?: number;     // Optional starting reps for conditioning exercises
  startingTime?: number;     // Optional starting time in seconds for time-based conditioning
};

export interface QuickLogData {
  exerciseId: string;
  reps: number;              // Reps OR time in seconds
  weight?: number;           // Weight in lbs (undefined = bodyweight)
  notes: string;
  parameters: Record<string, string | number>;
}

// Utility types

export const EXERCISE_TYPES: ExerciseType[] = ['legs', 'push', 'pull', 'core', 'balance', 'mobility', 'other'];

export const EXERCISE_TYPE_LABELS: Record<ExerciseType, string> = {
  push: 'Push',
  pull: 'Pull',
  legs: 'Legs',
  core: 'Core',
  balance: 'Balance',
  mobility: 'Mobility',
  other: 'Other'
};

// Progression mode labels
export const PROGRESSION_MODE_LABELS: Record<ProgressionMode, string> = {
  rfem: 'RFEM Training',
  simple: 'Simple Progression',
  mixed: 'Mixed (Per-Exercise)'
};

// Progression interval labels
export const PROGRESSION_INTERVAL_LABELS: Record<ProgressionInterval, string> = {
  constant: 'Constant (no change)',
  per_workout: 'Each workout',
  per_week: 'Each week'
};

// Helper function to format time in seconds to display string
export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Helper to parse time input (supports "30", "30s", "1m", "1m30s", "1:30")
export function parseTimeInput(input: string): number | null {
  const trimmed = input.trim().toLowerCase();
  
  // Try pure number (treat as seconds)
  const pureNum = parseInt(trimmed, 10);
  if (!isNaN(pureNum) && trimmed === String(pureNum)) {
    return pureNum;
  }
  
  // Try "Xs" format
  const secMatch = trimmed.match(/^(\d+)s$/);
  if (secMatch) {
    return parseInt(secMatch[1], 10);
  }
  
  // Try "Xm" format
  const minMatch = trimmed.match(/^(\d+)m$/);
  if (minMatch) {
    return parseInt(minMatch[1], 10) * 60;
  }
  
  // Try "XmYs" format
  const minSecMatch = trimmed.match(/^(\d+)m\s*(\d+)s?$/);
  if (minSecMatch) {
    return parseInt(minSecMatch[1], 10) * 60 + parseInt(minSecMatch[2], 10);
  }
  
  // Try "X:YY" format
  const colonMatch = trimmed.match(/^(\d+):(\d{1,2})$/);
  if (colonMatch) {
    return parseInt(colonMatch[1], 10) * 60 + parseInt(colonMatch[2], 10);
  }
  
  return null;
}

// Helper function to format duration in comprehensive format (e.g., "2d 3h 45m 30s")
export function formatDuration(totalSeconds: number): string {
  if (totalSeconds === 0) return '0s';
  
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  
  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (seconds > 0 || parts.length === 0) parts.push(`${seconds}s`);
  
  return parts.join(' ');
}

/**
 * Get the effective progression mode for a cycle.
 * Defaults to 'rfem' for backwards compatibility with existing cycles.
 */
export function getProgressionMode(cycle: Cycle): ProgressionMode {
  return cycle.progressionMode ?? 'rfem';
}

/**
 * Check if a cycle uses simple progression mode.
 */
export function isSimpleProgressionCycle(cycle: Cycle): boolean {
  return getProgressionMode(cycle) === 'simple';
}

/**
 * Check if a cycle uses mixed progression mode.
 */
export function isMixedProgressionCycle(cycle: Cycle): boolean {
  return getProgressionMode(cycle) === 'mixed';
}

/**
 * Get the effective progression mode for a specific exercise within a cycle.
 * - For 'rfem' cycles: always returns 'rfem'
 * - For 'simple' cycles: always returns 'simple'
 * - For 'mixed' cycles: returns the exercise's assigned mode, defaulting to 'rfem'
 */
export function getExerciseProgressionMode(
  cycleMode: ProgressionMode,
  assignment: ExerciseAssignment
): ExerciseProgressionMode {
  if (cycleMode === 'mixed') {
    return assignment.progressionMode ?? 'rfem';
  }
  return cycleMode === 'simple' ? 'simple' : 'rfem';
}

/**
 * Get the effective progression mode for a scheduled set within a workout.
 * Uses the denormalized progressionMode on the set for mixed cycles.
 */
export function getSetProgressionMode(
  cycleMode: ProgressionMode,
  set: ScheduledSet
): ExerciseProgressionMode {
  if (cycleMode === 'mixed') {
    return set.progressionMode ?? 'rfem';
  }
  return cycleMode === 'simple' ? 'simple' : 'rfem';
}
