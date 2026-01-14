/**
 * ExerciseProgressionEditor Component
 *
 * Editor for exercise progression settings in Simple mode.
 * Shows base values, progression type, and increment settings.
 */

import { useEffect } from 'react';
import { NumberInput, Select, Badge } from '@/components/ui';
import { formatWeightAt, getWeightUnitLabel } from '@/constants';
import { EXERCISE_TYPE_LABELS, type ProgressionInterval } from '@/types';
import type { ExerciseProgressionEditorProps } from '../types';

export function ExerciseProgressionEditor({
  exercise,
  assignment,
  isTimeBased,
  lastCompletedSet,
  onUpdate,
}: ExerciseProgressionEditorProps) {
  const isWeighted = exercise.weightEnabled === true;

  // Calculate default values
  const getDefaultReps = () => {
    if (lastCompletedSet?.actualReps) return lastCompletedSet.actualReps;
    if (exercise.defaultConditioningReps) return exercise.defaultConditioningReps;
    return 10;
  };

  const getDefaultTime = () => {
    if (lastCompletedSet?.actualReps) return lastCompletedSet.actualReps; // actualReps holds time for time-based
    if (exercise.defaultConditioningTime) return exercise.defaultConditioningTime;
    return 30;
  };

  const getDefaultWeight = () => {
    if (lastCompletedSet?.weight) return lastCompletedSet.weight;
    if (exercise.defaultWeight) return exercise.defaultWeight;
    return 0;
  };

  // Current values (from assignment or defaults)
  const baseValue = isTimeBased
    ? (assignment.simpleBaseTime ?? getDefaultTime())
    : (assignment.simpleBaseReps ?? getDefaultReps());
  const baseWeight = assignment.simpleBaseWeight ?? getDefaultWeight();

  const progressionType = isTimeBased
    ? assignment.simpleTimeProgressionType || 'constant'
    : assignment.simpleRepProgressionType || 'constant';
  const increment = isTimeBased ? assignment.simpleTimeIncrement : assignment.simpleRepIncrement;

  const weightProgressionType = assignment.simpleWeightProgressionType || 'constant';
  const weightIncrement = assignment.simpleWeightIncrement;

  // Initialize defaults on first render if not set
  useEffect(() => {
    const updates: Parameters<typeof onUpdate>[0] = {};

    if (isTimeBased && assignment.simpleBaseTime === undefined) {
      updates.simpleBaseTime = getDefaultTime();
    } else if (!isTimeBased && assignment.simpleBaseReps === undefined) {
      updates.simpleBaseReps = getDefaultReps();
    }

    if (isWeighted && assignment.simpleBaseWeight === undefined && getDefaultWeight() > 0) {
      updates.simpleBaseWeight = getDefaultWeight();
    }

    if (Object.keys(updates).length > 0) {
      onUpdate(updates);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleBaseChange = (value: number) => {
    if (isTimeBased) {
      onUpdate({ simpleBaseTime: value });
    } else {
      onUpdate({ simpleBaseReps: value });
    }
  };

  const handleProgressionTypeChange = (type: ProgressionInterval) => {
    if (isTimeBased) {
      onUpdate({ simpleTimeProgressionType: type });
    } else {
      onUpdate({ simpleRepProgressionType: type });
    }
  };

  const handleIncrementChange = (value: number) => {
    if (isTimeBased) {
      onUpdate({ simpleTimeIncrement: value });
    } else {
      onUpdate({ simpleRepIncrement: value });
    }
  };

  const handleWeightChange = (value: number) => {
    onUpdate({ simpleBaseWeight: value });
  };

  const handleWeightProgressionTypeChange = (type: ProgressionInterval) => {
    onUpdate({ simpleWeightProgressionType: type });
  };

  const handleWeightIncrementChange = (value: number) => {
    onUpdate({ simpleWeightIncrement: value });
  };

  return (
    <div className="border border-gray-300 dark:border-gray-700 rounded-lg p-3 bg-gray-100 dark:bg-gray-800">
      <div className="flex items-start gap-2 mb-3">
        <div className="flex flex-col gap-1 flex-shrink-0">
          <Badge variant={exercise.type} className="text-2xs">
            {EXERCISE_TYPE_LABELS[exercise.type]}
          </Badge>
          {isWeighted && (
            <Badge variant="other" className="text-2xs">
              Wt
            </Badge>
          )}
        </div>
        <span className="font-medium text-gray-900 dark:text-gray-100 pt-0.5">{exercise.name}</span>
      </div>

      {/* Reps/Time Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Base Value */}
        <div>
          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
            Base {isTimeBased ? 'Time (sec)' : 'Reps'}
          </label>
          <NumberInput value={baseValue} onChange={handleBaseChange} min={1} className="w-full" />
        </div>

        {/* Progression Type */}
        <div>
          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
            {isTimeBased ? 'Time' : 'Rep'} Progression
          </label>
          <Select
            value={progressionType}
            onChange={e => handleProgressionTypeChange(e.target.value as ProgressionInterval)}
            options={[
              { value: 'constant', label: 'Constant' },
              { value: 'per_workout', label: 'Each workout' },
              { value: 'per_week', label: 'Each week' },
            ]}
            className="w-full"
          />
        </div>

        {/* Increment */}
        <div>
          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
            Add {isTimeBased ? 'sec' : 'reps'}
          </label>
          <NumberInput
            value={increment || 0}
            onChange={handleIncrementChange}
            min={0}
            disabled={progressionType === 'constant'}
            className="w-full"
          />
        </div>
      </div>

      {/* Weight Row (only for weighted exercises) */}
      {isWeighted && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3 pt-3 border-t border-gray-200/60 dark:border-gray-700/40">
          {/* Base Weight */}
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
              Base Weight ({getWeightUnitLabel()})
            </label>
            <NumberInput
              value={baseWeight}
              onChange={handleWeightChange}
              min={0}
              className="w-full"
            />
          </div>

          {/* Weight Progression Type */}
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
              Weight Progression
            </label>
            <Select
              value={weightProgressionType}
              onChange={e =>
                handleWeightProgressionTypeChange(e.target.value as ProgressionInterval)
              }
              options={[
                { value: 'constant', label: 'Constant' },
                { value: 'per_workout', label: 'Each workout' },
                { value: 'per_week', label: 'Each week' },
              ]}
              className="w-full"
            />
          </div>

          {/* Weight Increment */}
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
              Add {getWeightUnitLabel()}
            </label>
            <NumberInput
              value={weightIncrement || 0}
              onChange={handleWeightIncrementChange}
              min={0}
              disabled={weightProgressionType === 'constant'}
              className="w-full"
            />
          </div>
        </div>
      )}

      {/* Preview */}
      {(progressionType !== 'constant' && increment && increment > 0) ||
      (isWeighted &&
        weightProgressionType !== 'constant' &&
        weightIncrement &&
        weightIncrement > 0) ? (
        <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          Week 1: {baseValue}
          {isTimeBased ? ' sec' : ' reps'}
          {isWeighted && baseWeight > 0 && ` ${formatWeightAt(baseWeight)}`}
          {' → '}
          Week 4:{' '}
          {progressionType !== 'constant' && increment
            ? baseValue + (progressionType === 'per_week' ? 3 : 11) * increment
            : baseValue}
          {isTimeBased ? ' sec' : ' reps'}
          {isWeighted && baseWeight > 0 && weightProgressionType !== 'constant' && weightIncrement
            ? ` ${formatWeightAt(baseWeight + (weightProgressionType === 'per_week' ? 3 : 11) * weightIncrement)}`
            : isWeighted && baseWeight > 0
              ? ` ${formatWeightAt(baseWeight)}`
              : ''}
        </div>
      ) : null}
    </div>
  );
}
