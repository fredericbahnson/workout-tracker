/**
 * ProgressionStep Component
 * 
 * Step for configuring exercise progression targets in Simple mode.
 * Shows base values and increment settings for each exercise.
 */

import { useLiveQuery } from 'dexie-react-hooks';
import { Card } from '@/components/ui';
import { CompletedSetRepo } from '@/data/repositories';
import { ExerciseProgressionEditor } from '../components/ExerciseProgressionEditor';
import type { ProgressionStepProps } from '../types';

export function ProgressionStep({
  groups,
  exerciseMap,
  onUpdateProgression
}: ProgressionStepProps) {
  // Get all unique exercise IDs from groups
  const exerciseIds = Array.from(new Set(
    groups.flatMap(g => g.exerciseAssignments.map(a => a.exerciseId))
  ));

  // Load last completed sets for all exercises
  const lastCompletedSets = useLiveQuery(async () => {
    const results = new Map<string, Awaited<ReturnType<typeof CompletedSetRepo.getLastForExercise>>>();
    for (const exerciseId of exerciseIds) {
      const lastSet = await CompletedSetRepo.getLastForExercise(exerciseId);
      results.set(exerciseId, lastSet);
    }
    return results;
  }, [exerciseIds.join(',')]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
          Set Exercise Targets
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Set base reps/time and optional progression for each exercise
        </p>
      </div>

      {groups.map(group => (
        <Card key={group.id} className="p-4">
          <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-4">{group.name}</h3>

          {group.exerciseAssignments.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400 italic">
              No exercises in this group
            </p>
          ) : (
            <div className="space-y-4">
              {group.exerciseAssignments.map(assignment => {
                const exercise = exerciseMap.get(assignment.exerciseId);
                if (!exercise) return null;

                const isTimeBased = exercise.measurementType === 'time';
                const lastSet = lastCompletedSets?.get(assignment.exerciseId) || null;

                return (
                  <ExerciseProgressionEditor
                    key={assignment.exerciseId}
                    exercise={exercise}
                    assignment={assignment}
                    isTimeBased={isTimeBased}
                    lastCompletedSet={lastSet}
                    onUpdate={(updates) => onUpdateProgression(group.id, assignment.exerciseId, updates)}
                  />
                );
              })}
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}
