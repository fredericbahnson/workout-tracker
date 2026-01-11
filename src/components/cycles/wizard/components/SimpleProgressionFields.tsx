/**
 * SimpleProgressionFields Component
 * 
 * Reusable simple progression input fields.
 * Used by both MixedExerciseConfig and ExerciseProgressionEditor.
 */

import { useEffect } from 'react';
import { NumberInput, Select } from '@/components/ui';
import type { ProgressionInterval } from '@/types';
import type { SimpleProgressionFieldsProps } from '../types';

export function SimpleProgressionFields({
  exercise,
  assignment,
  isTimeBased,
  isWeighted,
  onUpdate
}: SimpleProgressionFieldsProps) {
  // Get default values
  const getDefaultValue = () => {
    if (isTimeBased) {
      return exercise.lastCycleSettings?.simpleBaseTime
        || exercise.defaultConditioningTime || 30;
    }
    return exercise.lastCycleSettings?.simpleBaseReps
      || exercise.defaultConditioningReps || 10;
  };

  const baseValue = isTimeBased
    ? (assignment.simpleBaseTime ?? getDefaultValue())
    : (assignment.simpleBaseReps ?? getDefaultValue());

  const progressionType = isTimeBased
    ? (assignment.simpleTimeProgressionType || 'constant')
    : (assignment.simpleRepProgressionType || 'constant');

  const increment = isTimeBased
    ? (assignment.simpleTimeIncrement ?? 0)
    : (assignment.simpleRepIncrement ?? 0);

  const baseWeight = assignment.simpleBaseWeight ?? exercise.defaultWeight ?? 0;
  const weightProgressionType = assignment.simpleWeightProgressionType || 'constant';
  const weightIncrement = assignment.simpleWeightIncrement ?? 0;

  // Initialize defaults on mount if not set
  useEffect(() => {
    const updates: Parameters<typeof onUpdate>[0] = {};

    if (isTimeBased && assignment.simpleBaseTime === undefined) {
      updates.simpleBaseTime = getDefaultValue();
    } else if (!isTimeBased && assignment.simpleBaseReps === undefined) {
      updates.simpleBaseReps = getDefaultValue();
    }

    if (isWeighted && assignment.simpleBaseWeight === undefined && exercise.defaultWeight) {
      updates.simpleBaseWeight = exercise.defaultWeight;
    }

    if (Object.keys(updates).length > 0) {
      onUpdate(updates);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="space-y-3">
      {/* Reps/Time Row */}
      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
            Base {isTimeBased ? '(sec)' : 'Reps'}
          </label>
          <NumberInput
            value={baseValue}
            onChange={v => onUpdate(isTimeBased
              ? { simpleBaseTime: v }
              : { simpleBaseReps: v })}
            min={1}
            className="w-full"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
            Progress
          </label>
          <Select
            value={progressionType}
            onChange={e => onUpdate(isTimeBased
              ? { simpleTimeProgressionType: e.target.value as ProgressionInterval }
              : { simpleRepProgressionType: e.target.value as ProgressionInterval })}
            options={[
              { value: 'constant', label: 'None' },
              { value: 'per_workout', label: '/workout' },
              { value: 'per_week', label: '/week' }
            ]}
            className="w-full text-xs"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
            +{isTimeBased ? 'sec' : 'reps'}
          </label>
          <NumberInput
            value={increment}
            onChange={v => onUpdate(isTimeBased
              ? { simpleTimeIncrement: v }
              : { simpleRepIncrement: v })}
            min={0}
            disabled={progressionType === 'constant'}
            className="w-full"
          />
        </div>
      </div>

      {/* Weight Row (only for weighted exercises) */}
      {isWeighted && (
        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-gray-200 dark:border-dark-border">
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
              Weight (lbs)
            </label>
            <NumberInput
              value={baseWeight}
              onChange={v => onUpdate({ simpleBaseWeight: v })}
              min={0}
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
              Progress
            </label>
            <Select
              value={weightProgressionType}
              onChange={e => onUpdate({ simpleWeightProgressionType: e.target.value as ProgressionInterval })}
              options={[
                { value: 'constant', label: 'None' },
                { value: 'per_workout', label: '/workout' },
                { value: 'per_week', label: '/week' }
              ]}
              className="w-full text-xs"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
              +lbs
            </label>
            <NumberInput
              value={weightIncrement}
              onChange={v => onUpdate({ simpleWeightIncrement: v })}
              min={0}
              disabled={weightProgressionType === 'constant'}
              className="w-full"
            />
          </div>
        </div>
      )}
    </div>
  );
}
