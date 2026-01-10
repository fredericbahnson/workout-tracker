/**
 * Type Definitions
 * 
 * Re-exports all types from focused modules.
 * Import from '@/types' for convenience.
 */

// Exercise types
export type {
  ExerciseType,
  ExerciseMode,
  MeasurementType,
  CustomParameter,
  ExerciseProgressionMode,
  ProgressionInterval,
  ExerciseCycleDefaults,
  Exercise,
  MaxRecord,
} from './exercise';

// Cycle types
export type {
  CycleType,
  ProgressionMode,
  ExerciseAssignment,
  Group,
  Cycle,
} from './cycle';

// Workout types
export type {
  ScheduledSet,
  ScheduledWorkout,
  CompletedSet,
} from './workout';

// Form types
export type {
  ExerciseFormData,
  QuickLogData,
} from './forms';

// Constants
export {
  EXERCISE_TYPES,
  EXERCISE_TYPE_LABELS,
  PROGRESSION_MODE_LABELS,
  PROGRESSION_INTERVAL_LABELS,
} from './constants';

// Re-export time utilities for backwards compatibility
// These were previously in types but are now in utils
export { formatTime, parseTimeInput, formatDuration } from '@/utils/time';

// Re-export progression utilities for backwards compatibility
// These were previously in types but are now in utils
export {
  getProgressionMode,
  isSimpleProgressionCycle,
  isMixedProgressionCycle,
  getExerciseProgressionMode,
  getSetProgressionMode,
} from '@/utils/progression';
