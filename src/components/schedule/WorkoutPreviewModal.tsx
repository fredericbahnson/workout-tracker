/**
 * WorkoutPreviewModal Component
 * 
 * Displays a preview of an upcoming workout with its scheduled sets.
 */

import { Trash2 } from 'lucide-react';
import { Modal, Badge, Button } from '@/components/ui';
import { EXERCISE_TYPES, EXERCISE_TYPE_LABELS, formatTime, type ScheduledWorkout, type ScheduledSet, type Exercise, type MaxRecord, type Cycle } from '@/types';
import { calculateTargetReps } from '@/services/scheduler';

interface WorkoutPreviewModalProps {
  workout: ScheduledWorkout | null;
  exerciseMap: Map<string, Exercise>;
  maxRecords: Map<string, MaxRecord> | undefined;
  activeCycle: Cycle | null | undefined;
  groupName?: string;
  isNextWorkout: boolean;
  defaultMaxReps: number;
  onStartWorkout: () => void;
  onDeleteWorkout: () => void;
  onClose: () => void;
}

export function WorkoutPreviewModal({
  workout,
  exerciseMap,
  maxRecords,
  activeCycle,
  groupName,
  isNextWorkout,
  defaultMaxReps,
  onStartWorkout,
  onDeleteWorkout,
  onClose
}: WorkoutPreviewModalProps) {
  if (!workout || !activeCycle) return null;

  // Group sets by type
  const groupedSets = EXERCISE_TYPES.map(type => ({
    type,
    sets: workout.scheduledSets
      .filter(set => set.exerciseType === type)
      .sort((a, b) => {
        const exA = exerciseMap.get(a.exerciseId);
        const exB = exerciseMap.get(b.exerciseId);
        return (exA?.name || '').localeCompare(exB?.name || '');
      })
  })).filter(group => group.sets.length > 0);

  const getTargetReps = (set: ScheduledSet): number | string => {
    const exercise = exerciseMap.get(set.exerciseId);
    if (!exercise) return 0;

    const maxRecord = maxRecords?.get(set.exerciseId);
    const calculated = calculateTargetReps(
      set,
      workout,
      maxRecord,
      activeCycle.conditioningWeeklyRepIncrement,
      activeCycle.conditioningWeeklyTimeIncrement || 5,
      defaultMaxReps
    );

    if (exercise.measurementType === 'time') {
      return formatTime(calculated);
    }
    return calculated;
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={`Workout #${workout.sequenceNumber}`}
      size="lg"
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium text-gray-900 dark:text-gray-100">
              {groupName || 'Workout'}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Week {workout.weekNumber} • RFEM -{workout.rfem}
            </p>
          </div>
          <Badge className="text-sm">
            {workout.scheduledSets.length} sets
          </Badge>
        </div>

        <div className="space-y-4">
          {groupedSets.map(group => (
            <div key={group.type}>
              <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                {EXERCISE_TYPE_LABELS[group.type as keyof typeof EXERCISE_TYPE_LABELS]}
              </h4>
              <div className="space-y-2">
                {group.sets.map(set => {
                  const exercise = exerciseMap.get(set.exerciseId);
                  if (!exercise) return null;
                  const target = getTargetReps(set);
                  const isTimeBased = exercise.measurementType === 'time';

                  return (
                    <div
                      key={set.id}
                      className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50"
                    >
                      <span className="flex-1 text-gray-900 dark:text-gray-100">
                        {exercise.name}
                      </span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {target} {isTimeBased ? '' : 'reps'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-2">
          <div className="flex gap-2">
            {isNextWorkout && (
              <Button className="flex-1" onClick={onStartWorkout}>
                Start Workout
              </Button>
            )}
            <Button
              variant="secondary"
              className={isNextWorkout ? 'flex-1' : 'w-full'}
              onClick={onClose}
            >
              Close
            </Button>
          </div>

          <Button
            variant="secondary"
            className="w-full text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
            onClick={onDeleteWorkout}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete Workout
          </Button>
        </div>
      </div>
    </Modal>
  );
}
