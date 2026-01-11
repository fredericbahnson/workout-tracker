/**
 * WorkoutHistoryModal Component
 * 
 * Displays completed workout history with grouped sets by exercise type.
 */

import { Modal, Badge } from '@/components/ui';
import { EXERCISE_TYPES, EXERCISE_TYPE_LABELS, formatTime, type ScheduledWorkout, type Exercise, type CompletedSet } from '@/types';

interface WorkoutHistoryModalProps {
  workout: ScheduledWorkout | null;
  completedSets: CompletedSet[];
  exerciseMap: Map<string, Exercise>;
  groupName?: string;
  onClose: () => void;
}

export function WorkoutHistoryModal({
  workout,
  completedSets,
  exerciseMap,
  groupName,
  onClose
}: WorkoutHistoryModalProps) {
  if (!workout) return null;

  const isAdHoc = workout.isAdHoc;
  const completionDate = workout.completedAt
    ? new Date(workout.completedAt).toLocaleDateString(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
      })
    : null;

  // Separate scheduled sets from ad-hoc sets
  const scheduledSets = completedSets.filter(cs => cs.scheduledSetId !== null);
  const adHocSets = completedSets.filter(cs => cs.scheduledSetId === null);

  // Group sets by exercise type
  const groupSetsByType = (sets: CompletedSet[]) =>
    EXERCISE_TYPES.map(type => ({
      type,
      sets: sets
        .filter(cs => exerciseMap.get(cs.exerciseId)?.type === type)
        .sort((a, b) => {
          const exA = exerciseMap.get(a.exerciseId);
          const exB = exerciseMap.get(b.exerciseId);
          return (exA?.name || '').localeCompare(exB?.name || '');
        })
    })).filter(group => group.sets.length > 0);

  const groupedScheduledSets = groupSetsByType(scheduledSets);
  const groupedAdHocSets = groupSetsByType(adHocSets);

  const getStatusBadgeClass = () => {
    if (workout.status === 'skipped') {
      return 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400';
    }
    if (isAdHoc) {
      return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
    }
    return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
  };

  const getStatusLabel = () => {
    if (workout.status === 'skipped') return 'Skipped';
    if (isAdHoc) return 'Ad Hoc';
    return 'Completed';
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={isAdHoc ? (workout.customName || 'Ad Hoc Workout') : `Workout #${workout.sequenceNumber}`}
      size="lg"
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {isAdHoc ? (
              completionDate ? `Completed ${completionDate}` : 'Ad-hoc workout'
            ) : (
              <>
                {groupName || 'Workout'} • Week {workout.weekNumber}
                {completionDate && ` • ${completionDate}`}
              </>
            )}
          </div>
          <Badge className={getStatusBadgeClass()}>
            {getStatusLabel()}
          </Badge>
        </div>

        {workout.status === 'skipped' ? (
          <div className="text-center py-6 text-gray-500 dark:text-gray-400">
            This workout was skipped
          </div>
        ) : (
          <div className="space-y-4">
            {completedSets.length === 0 ? (
              <p className="text-sm text-gray-400 dark:text-gray-500 py-2">
                No set data recorded
              </p>
            ) : (
              <div className="space-y-6">
                {/* Scheduled Sets */}
                {scheduledSets.length > 0 && (
                  <SetGroup
                    title={`Scheduled Sets (${scheduledSets.length})`}
                    groups={groupedScheduledSets}
                    exerciseMap={exerciseMap}
                    variant="scheduled"
                  />
                )}

                {/* Ad-hoc Sets */}
                {adHocSets.length > 0 && (
                  <SetGroup
                    title={`Additional Sets (${adHocSets.length})`}
                    groups={groupedAdHocSets}
                    exerciseMap={exerciseMap}
                    variant="adhoc"
                  />
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}

interface SetGroupProps {
  title: string;
  groups: Array<{ type: string; sets: CompletedSet[] }>;
  exerciseMap: Map<string, Exercise>;
  variant: 'scheduled' | 'adhoc';
}

function SetGroup({ title, groups, exerciseMap, variant }: SetGroupProps) {
  return (
    <div className="space-y-4">
      <h4 className={`text-sm font-medium ${
        variant === 'adhoc' 
          ? 'text-blue-600 dark:text-blue-400' 
          : 'text-gray-500 dark:text-gray-400'
      }`}>
        {title}
      </h4>
      {groups.map(group => (
        <div key={group.type}>
          <h5 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
            {EXERCISE_TYPE_LABELS[group.type as keyof typeof EXERCISE_TYPE_LABELS]}
          </h5>
          <div className="space-y-2">
            {group.sets.map(completedSet => {
              const exercise = exerciseMap.get(completedSet.exerciseId);
              const wasSkipped = completedSet.actualReps === 0 && completedSet.notes === 'Skipped';
              const isTimeBased = exercise?.measurementType === 'time';

              return (
                <div
                  key={completedSet.id}
                  className={`flex items-center justify-between py-2 px-3 rounded-lg ${
                    wasSkipped
                      ? 'bg-orange-50 dark:bg-orange-900/20'
                      : variant === 'adhoc'
                        ? 'bg-blue-50 dark:bg-blue-900/20'
                        : 'bg-gray-50 dark:bg-gray-800/50'
                  }`}
                >
                  <span className="text-sm text-gray-900 dark:text-gray-100">
                    {exercise?.name || 'Unknown Exercise'}
                  </span>
                  <div className="text-sm">
                    {wasSkipped ? (
                      <span className="text-orange-600 dark:text-orange-400">Skipped</span>
                    ) : variant === 'adhoc' ? (
                      <span className="font-medium text-blue-600 dark:text-blue-400">
                        {isTimeBased ? formatTime(completedSet.actualReps) : completedSet.actualReps}
                      </span>
                    ) : (
                      <>
                        <span className="font-medium text-gray-900 dark:text-gray-100">
                          {isTimeBased ? formatTime(completedSet.actualReps) : completedSet.actualReps}
                        </span>
                        <span className="text-gray-500 dark:text-gray-400">
                          {' '}/ {isTimeBased ? formatTime(completedSet.targetReps) : completedSet.targetReps}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
