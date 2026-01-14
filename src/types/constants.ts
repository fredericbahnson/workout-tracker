/**
 * Type Constants
 *
 * Constants and labels related to type values.
 */

import type { ExerciseType, ProgressionInterval } from './exercise';
import type { ProgressionMode } from './cycle';

/**
 * All exercise types in display order.
 */
export const EXERCISE_TYPES: ExerciseType[] = [
  'legs',
  'push',
  'pull',
  'core',
  'balance',
  'mobility',
  'other',
];

/**
 * Human-readable labels for exercise types.
 */
export const EXERCISE_TYPE_LABELS: Record<ExerciseType, string> = {
  push: 'Push',
  pull: 'Pull',
  legs: 'Legs',
  core: 'Core',
  balance: 'Balance',
  mobility: 'Mobility',
  other: 'Other',
};

/**
 * Human-readable labels for progression modes.
 */
export const PROGRESSION_MODE_LABELS: Record<ProgressionMode, string> = {
  rfem: 'RFEM Training',
  simple: 'Simple Progression',
  mixed: 'Mixed (Per-Exercise)',
};

/**
 * Human-readable labels for progression intervals.
 */
export const PROGRESSION_INTERVAL_LABELS: Record<ProgressionInterval, string> = {
  constant: 'Constant (no change)',
  per_workout: 'Each workout',
  per_week: 'Each week',
};
