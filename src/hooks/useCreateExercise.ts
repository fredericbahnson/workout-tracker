/**
 * useCreateExercise Hook
 *
 * Shared exercise-creation logic (exercise + optional initial max record),
 * used by the Exercises page and the cycle wizard's inline create shortcut so
 * the two paths can't diverge.
 */

import { useCallback, useState } from 'react';
import { ExerciseRepo, MaxRecordRepo } from '@/data/repositories';
import { createScopedLogger } from '@/utils/logger';
import type { Exercise, ExerciseFormData } from '@/types';

const log = createScopedLogger('CreateExercise');

export function useCreateExercise() {
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => setError(null), []);

  /** Returns the created exercise, or null on failure (error state is set). */
  const createExercise = useCallback(async (data: ExerciseFormData): Promise<Exercise | null> => {
    setIsCreating(true);
    setError(null);
    try {
      log.debug('Creating exercise:', data.name);
      const { initialMax, initialMaxTime, startingReps, startingTime, ...exerciseData } = data;

      // Add default conditioning values based on measurement type
      const exerciseToCreate = {
        ...exerciseData,
        defaultConditioningReps:
          exerciseData.mode === 'conditioning' && exerciseData.measurementType === 'reps'
            ? startingReps
            : undefined,
        defaultConditioningTime:
          exerciseData.mode === 'conditioning' && exerciseData.measurementType === 'time'
            ? startingTime
            : undefined,
      };

      const created = await ExerciseRepo.create(exerciseToCreate);
      log.debug('Exercise created:', created.id);

      // Create initial max record if provided (standard exercises)
      if (exerciseData.measurementType === 'reps' && initialMax && initialMax > 0) {
        await MaxRecordRepo.create(created.id, initialMax, undefined, 'Initial max');
        log.debug('Initial max reps recorded:', initialMax);
      } else if (exerciseData.measurementType === 'time' && initialMaxTime && initialMaxTime > 0) {
        await MaxRecordRepo.create(created.id, undefined, initialMaxTime, 'Initial max');
        log.debug('Initial max time recorded:', initialMaxTime);
      }

      return created;
    } catch (err) {
      log.error(err as Error);
      setError(err instanceof Error ? err.message : 'Failed to create exercise. Please try again.');
      return null;
    } finally {
      setIsCreating(false);
    }
  }, []);

  return { createExercise, isCreating, error, clearError };
}
