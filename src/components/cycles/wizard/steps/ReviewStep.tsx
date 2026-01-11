/**
 * ReviewStep Component
 * 
 * Final step showing a summary of the cycle configuration
 * with validation errors/warnings.
 */

import { AlertTriangle } from 'lucide-react';
import { Card, Badge } from '@/components/ui';
import { EXERCISE_TYPES, EXERCISE_TYPE_LABELS, PROGRESSION_INTERVAL_LABELS } from '@/types';
import type { ReviewStepProps } from '../types';

export function ReviewStep({
  progressionMode,
  name,
  startDate,
  numberOfWeeks,
  workoutDaysPerWeek,
  groups,
  exerciseMap,
  weeklySetGoals,
  groupRotation,
  rfemRotation,
  includeWarmupSets,
  includeTimedWarmups,
  validation
}: ReviewStepProps) {
  const isSimpleMode = progressionMode === 'simple';
  const isMixedMode = progressionMode === 'mixed';
  const totalExercises = new Set(
    groups.flatMap(g => g.exerciseAssignments.map(a => a.exerciseId))
  ).size;

  const totalWeeklySets = Object.values(weeklySetGoals).reduce((a, b) => a + b, 0);

  // For mixed mode, categorize exercises
  const categorizedExercises = isMixedMode ? (() => {
    const rfemExercises: { exercise: NonNullable<ReturnType<typeof exerciseMap.get>>; group: (typeof groups)[0] }[] = [];
    const simpleExercises: { exercise: NonNullable<ReturnType<typeof exerciseMap.get>>; assignment: (typeof groups)[0]['exerciseAssignments'][0]; group: (typeof groups)[0] }[] = [];
    const conditioningExercises: { exercise: NonNullable<ReturnType<typeof exerciseMap.get>>; assignment: (typeof groups)[0]['exerciseAssignments'][0]; group: (typeof groups)[0] }[] = [];

    groups.forEach(group => {
      group.exerciseAssignments.forEach(assignment => {
        const exercise = exerciseMap.get(assignment.exerciseId);
        if (!exercise) return;

        if (exercise.mode === 'conditioning') {
          conditioningExercises.push({ exercise, assignment, group });
        } else if (assignment.progressionMode === 'simple') {
          simpleExercises.push({ exercise, assignment, group });
        } else {
          rfemExercises.push({ exercise, group });
        }
      });
    });

    return { rfemExercises, simpleExercises, conditioningExercises };
  })() : null;

  // Get badge for mode
  const getModeLabel = () => {
    if (isSimpleMode) return 'Simple';
    if (isMixedMode) return 'Mixed';
    return 'RFEM';
  };

  const getModeBadgeVariant = (): 'push' | 'other' | 'balance' => {
    if (isSimpleMode) return 'other';
    if (isMixedMode) return 'balance';
    return 'push';
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
        Review & Confirm
      </h2>

      {/* Validation Messages */}
      {validation.errors.length > 0 && (
        <Card className="p-3 border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-red-700 dark:text-red-400">Errors</p>
              <ul className="text-sm text-red-600 dark:text-red-400 mt-1 space-y-1">
                {validation.errors.map((err, i) => <li key={i}>• {err}</li>)}
              </ul>
            </div>
          </div>
        </Card>
      )}

      {validation.warnings.length > 0 && (
        <Card className="p-3 border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-yellow-700 dark:text-yellow-400">Warnings</p>
              <ul className="text-sm text-yellow-600 dark:text-yellow-400 mt-1 space-y-1">
                {validation.warnings.map((warn, i) => <li key={i}>• {warn}</li>)}
              </ul>
            </div>
          </div>
        </Card>
      )}

      {/* Summary */}
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <h3 className="font-medium text-gray-900 dark:text-gray-100">{name}</h3>
          <Badge variant={getModeBadgeVariant()} className="text-2xs">
            {getModeLabel()}
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-gray-500 dark:text-gray-400">Start Date</span>
            <p className="font-medium">{new Date(startDate).toLocaleDateString()}</p>
          </div>
          <div>
            <span className="text-gray-500 dark:text-gray-400">Duration</span>
            <p className="font-medium">{numberOfWeeks} weeks</p>
          </div>
          <div>
            <span className="text-gray-500 dark:text-gray-400">Workout Days</span>
            <p className="font-medium">{workoutDaysPerWeek} per week</p>
          </div>
          <div>
            <span className="text-gray-500 dark:text-gray-400">Total Workouts</span>
            <p className="font-medium">{numberOfWeeks * workoutDaysPerWeek}</p>
          </div>
          <div>
            <span className="text-gray-500 dark:text-gray-400">Groups</span>
            <p className="font-medium">{groups.length}</p>
          </div>
          <div>
            <span className="text-gray-500 dark:text-gray-400">Exercises</span>
            <p className="font-medium">{totalExercises}</p>
          </div>
        </div>
      </Card>

      {/* Weekly Goals Summary */}
      <Card className="p-4">
        <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-3">
          Weekly Goals ({totalWeeklySets} total sets)
        </h3>
        <div className="flex flex-wrap gap-2">
          {EXERCISE_TYPES.filter(t => weeklySetGoals[t] > 0).map(type => (
            <Badge key={type} variant={type}>
              {EXERCISE_TYPE_LABELS[type]}: {weeklySetGoals[type]}
            </Badge>
          ))}
        </div>
      </Card>

      {/* Warmup Configuration (for non-mixed modes) */}
      {!isMixedMode && (
        <Card className="p-4">
          <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
            Warmup Sets
          </h3>
          {includeWarmupSets ? (
            <div className="text-sm text-gray-600 dark:text-gray-400">
              <p>✓ Warmup sets enabled (20% and 40% intensity)</p>
              {includeTimedWarmups && <p>✓ Including time-based exercise warmups</p>}
              {!includeTimedWarmups && <p className="text-gray-500">• Time-based warmups disabled</p>}
            </div>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400">No warmup sets</p>
          )}
        </Card>
      )}

      {/* Simple Mode: Exercise Targets Summary */}
      {isSimpleMode && (
        <Card className="p-4">
          <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-3">
            Exercise Targets
          </h3>
          <div className="space-y-3">
            {groups.map(group => (
              <div key={group.id}>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{group.name}</p>
                <div className="space-y-1">
                  {group.exerciseAssignments.map(a => {
                    const exercise = exerciseMap.get(a.exerciseId);
                    if (!exercise) return null;
                    const isTimeBased = exercise.measurementType === 'time';
                    const isWeighted = exercise.weightEnabled === true;
                    const baseValue = isTimeBased ? a.simpleBaseTime : a.simpleBaseReps;
                    const progressionType = isTimeBased ? a.simpleTimeProgressionType : a.simpleRepProgressionType;
                    const increment = isTimeBased ? a.simpleTimeIncrement : a.simpleRepIncrement;
                    const baseWeight = a.simpleBaseWeight;
                    const weightProgressionType = a.simpleWeightProgressionType;
                    const weightIncrement = a.simpleWeightIncrement;

                    return (
                      <div key={a.exerciseId} className="flex flex-wrap items-center gap-x-2 gap-y-0 text-sm pl-2">
                        <span className="text-gray-600 dark:text-gray-400">{exercise.name}:</span>
                        <span className="font-medium">
                          {baseValue || '?'} {isTimeBased ? 'sec' : 'reps'}
                          {isWeighted && baseWeight ? ` @ ${baseWeight} lbs` : ''}
                        </span>
                        {progressionType && progressionType !== 'constant' && increment && (
                          <span className="text-gray-500 dark:text-gray-400">
                            (+{increment} {isTimeBased ? 'sec' : 'reps'} {PROGRESSION_INTERVAL_LABELS[progressionType].toLowerCase()})
                          </span>
                        )}
                        {isWeighted && weightProgressionType && weightProgressionType !== 'constant' && weightIncrement && (
                          <span className="text-gray-500 dark:text-gray-400">
                            (+{weightIncrement} lbs {PROGRESSION_INTERVAL_LABELS[weightProgressionType].toLowerCase()})
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Mixed Mode: Exercise Summary by Mode */}
      {isMixedMode && categorizedExercises && (
        <Card className="p-4">
          <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-3">
            Exercise Configuration
          </h3>
          <div className="space-y-4">
            {/* RFEM Exercises */}
            {categorizedExercises.rfemExercises.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="push" className="text-2xs">RFEM</Badge>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    Rotation: {rfemRotation.map(r => `-${r}`).join(', ')}
                  </span>
                </div>
                <div className="pl-2 space-y-0.5">
                  {categorizedExercises.rfemExercises.map(({ exercise, group }) => (
                    <p key={exercise.id} className="text-sm text-gray-600 dark:text-gray-400">
                      {exercise.name} <span className="text-gray-400">({group.name})</span>
                    </p>
                  ))}
                </div>
              </div>
            )}

            {/* Simple Progression Exercises */}
            {categorizedExercises.simpleExercises.length > 0 && (
              <div>
                <Badge variant="other" className="text-2xs mb-2">Simple Progression</Badge>
                <div className="pl-2 space-y-1">
                  {categorizedExercises.simpleExercises.map(({ exercise, assignment }) => {
                    const isTimeBased = exercise.measurementType === 'time';
                    const isWeighted = exercise.weightEnabled === true;
                    const baseValue = isTimeBased ? assignment.simpleBaseTime : assignment.simpleBaseReps;
                    const progressionType = isTimeBased ? assignment.simpleTimeProgressionType : assignment.simpleRepProgressionType;
                    const increment = isTimeBased ? assignment.simpleTimeIncrement : assignment.simpleRepIncrement;
                    const baseWeight = assignment.simpleBaseWeight;
                    const weightProgressionType = assignment.simpleWeightProgressionType;
                    const weightIncrement = assignment.simpleWeightIncrement;

                    return (
                      <div key={exercise.id} className="flex flex-wrap items-center gap-x-2 gap-y-0 text-sm">
                        <span className="text-gray-600 dark:text-gray-400">{exercise.name}:</span>
                        <span className="font-medium">
                          {baseValue || '?'} {isTimeBased ? 'sec' : 'reps'}
                          {isWeighted && baseWeight ? ` @ ${baseWeight} lbs` : ''}
                        </span>
                        {progressionType && progressionType !== 'constant' && increment && (
                          <span className="text-gray-500 dark:text-gray-400">
                            (+{increment}/{progressionType === 'per_workout' ? 'workout' : 'week'})
                          </span>
                        )}
                        {isWeighted && weightProgressionType && weightProgressionType !== 'constant' && weightIncrement && (
                          <span className="text-gray-500 dark:text-gray-400">
                            (+{weightIncrement} lbs/{weightProgressionType === 'per_workout' ? 'workout' : 'week'})
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Conditioning Exercises */}
            {categorizedExercises.conditioningExercises.length > 0 && (
              <div>
                <Badge variant="core" className="text-2xs mb-2">Conditioning</Badge>
                <div className="pl-2 space-y-1">
                  {categorizedExercises.conditioningExercises.map(({ exercise, assignment }) => {
                    const isTimeBased = exercise.measurementType === 'time';
                    const baseValue = isTimeBased ? assignment.conditioningBaseTime : assignment.conditioningBaseReps;
                    const increment = isTimeBased ? assignment.conditioningTimeIncrement : assignment.conditioningRepIncrement;

                    return (
                      <div key={exercise.id} className="flex items-center gap-2 text-sm">
                        <span className="text-gray-600 dark:text-gray-400">{exercise.name}:</span>
                        <span className="font-medium">
                          {baseValue || '?'} {isTimeBased ? 'sec' : 'reps'}
                        </span>
                        {increment !== undefined && increment > 0 && (
                          <span className="text-gray-500 dark:text-gray-400">
                            (+{increment} {isTimeBased ? 'sec' : 'reps'}/week)
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Rotation Preview */}
      <Card className="p-4">
        <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-3">
          First Week Preview
        </h3>
        <div className="space-y-2">
          {Array.from({ length: workoutDaysPerWeek }, (_, i) => {
            const groupId = groupRotation[i % groupRotation.length];
            const group = groups.find(g => g.id === groupId);
            const rfem = rfemRotation[i % rfemRotation.length];

            return (
              <div key={i} className="flex items-center gap-2 text-sm">
                <span className="text-gray-500 dark:text-gray-400 w-12">Day {i + 1}</span>
                <span className="font-medium">{group?.name || 'Unknown'}</span>
                {!isSimpleMode && (
                  <>
                    <span className="text-gray-400">•</span>
                    <span className="text-gray-500 dark:text-gray-400">RFEM -{rfem}</span>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
