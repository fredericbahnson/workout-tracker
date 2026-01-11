/**
 * Form Types
 * 
 * Types used for form inputs and data submission.
 */

import type { Exercise } from './exercise';

/**
 * Data shape for creating/editing an exercise.
 * Excludes auto-generated fields (id, timestamps).
 */
export type ExerciseFormData = Omit<Exercise, 'id' | 'createdAt' | 'updatedAt'> & {
  /** Optional initial max reps to record at creation (standard exercises) */
  initialMax?: number;
  /** Optional initial max time in seconds (time-based standard exercises) */
  initialMaxTime?: number;
  /** Optional starting reps for conditioning exercises */
  startingReps?: number;
  /** Optional starting time in seconds for time-based conditioning */
  startingTime?: number;
};

/**
 * Data shape for quick logging a set.
 */
export interface QuickLogData {
  exerciseId: string;
  /** Reps OR time in seconds */
  reps: number;
  /** Weight in lbs (undefined = bodyweight) */
  weight?: number;
  notes: string;
  parameters: Record<string, string | number>;
}
