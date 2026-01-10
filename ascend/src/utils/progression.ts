/**
 * Progression Utilities
 * 
 * Helper functions for determining progression modes for cycles, exercises, and sets.
 */

import type { ExerciseProgressionMode } from '@/types/exercise';
import type { Cycle, ProgressionMode, ExerciseAssignment } from '@/types/cycle';
import type { ScheduledSet } from '@/types/workout';

/**
 * Get the effective progression mode for a cycle.
 * Defaults to 'rfem' for backwards compatibility with existing cycles.
 * 
 * @param cycle - The cycle to check
 * @returns The progression mode ('rfem', 'simple', or 'mixed')
 */
export function getProgressionMode(cycle: Cycle): ProgressionMode {
  return cycle.progressionMode ?? 'rfem';
}

/**
 * Check if a cycle uses simple progression mode.
 * 
 * @param cycle - The cycle to check
 * @returns True if the cycle uses simple progression
 */
export function isSimpleProgressionCycle(cycle: Cycle): boolean {
  return getProgressionMode(cycle) === 'simple';
}

/**
 * Check if a cycle uses mixed progression mode.
 * 
 * @param cycle - The cycle to check
 * @returns True if the cycle uses mixed progression
 */
export function isMixedProgressionCycle(cycle: Cycle): boolean {
  return getProgressionMode(cycle) === 'mixed';
}

/**
 * Check if a cycle uses RFEM progression mode.
 * 
 * @param cycle - The cycle to check
 * @returns True if the cycle uses RFEM progression
 */
export function isRfemProgressionCycle(cycle: Cycle): boolean {
  return getProgressionMode(cycle) === 'rfem';
}

/**
 * Get the effective progression mode for a specific exercise within a cycle.
 * 
 * - For 'rfem' cycles: always returns 'rfem'
 * - For 'simple' cycles: always returns 'simple'
 * - For 'mixed' cycles: returns the exercise's assigned mode, defaulting to 'rfem'
 * 
 * @param cycleMode - The cycle's progression mode
 * @param assignment - The exercise assignment to check
 * @returns The exercise's effective progression mode ('rfem' or 'simple')
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
 * 
 * @param cycleMode - The cycle's progression mode
 * @param set - The scheduled set to check
 * @returns The set's effective progression mode ('rfem' or 'simple')
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
