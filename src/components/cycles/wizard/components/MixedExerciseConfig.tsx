/**
 * MixedExerciseConfig Component
 *
 * Inline configuration component for exercises in mixed mode.
 * Allows selecting RFEM or Simple progression mode for each exercise.
 */

import { useEffect } from 'react';
import { Trash2 } from 'lucide-react';
import { Button, NumberInput, Badge } from '@/components/ui';
import { EXERCISE_TYPE_LABELS } from '@/types';
import { SimpleProgressionFields } from './SimpleProgressionFields';
import type { MixedExerciseConfigProps } from '../types';

export function MixedExerciseConfig({
  exercise,
  assignment,
  defaults,
  onUpdate,
  onRemove,
}: MixedExerciseConfigProps) {
  const isConditioning = exercise.mode === 'conditioning';
  const isTimeBased = exercise.measurementType === 'time';
  const isWeighted = exercise.weightEnabled === true;

  // For non-conditioning exercises, track which mode is selected
  const exerciseMode = assignment.progressionMode || 'rfem';

  // Initialize with smart defaults from lastCycleSettings or exercise defaults
  useEffect(() => {
    if (isConditioning) {
      // For conditioning, ensure base value and increment are set
      const updates: Parameters<typeof onUpdate>[0] = {};

      if (isTimeBased) {
        if (assignment.conditioningBaseTime === undefined) {
          updates.conditioningBaseTime =
            exercise.lastCycleSettings?.simpleBaseTime || exercise.defaultConditioningTime || 30;
        }
        if (assignment.conditioningTimeIncrement === undefined) {
          updates.conditioningTimeIncrement =
            exercise.lastCycleSettings?.conditioningTimeIncrement || 5;
        }
      } else {
        if (assignment.conditioningBaseReps === undefined) {
          updates.conditioningBaseReps =
            exercise.lastCycleSettings?.simpleBaseReps ||
            exercise.defaultConditioningReps ||
            defaults.defaultConditioningReps;
        }
        if (assignment.conditioningRepIncrement === undefined) {
          updates.conditioningRepIncrement =
            exercise.lastCycleSettings?.conditioningRepIncrement || 1;
        }
      }

      if (Object.keys(updates).length > 0) {
        onUpdate(updates);
      }
    } else {
      // For standard exercises, initialize from lastCycleSettings if available
      const lastSettings = exercise.lastCycleSettings;
      if (lastSettings && assignment.progressionMode === undefined) {
        const updates: Parameters<typeof onUpdate>[0] = {
          progressionMode: lastSettings.progressionMode,
        };

        // If last mode was simple, copy the simple settings
        if (lastSettings.progressionMode === 'simple') {
          if (isTimeBased) {
            updates.simpleBaseTime = lastSettings.simpleBaseTime;
            updates.simpleTimeProgressionType = lastSettings.simpleTimeProgressionType;
            updates.simpleTimeIncrement = lastSettings.simpleTimeIncrement;
          } else {
            updates.simpleBaseReps = lastSettings.simpleBaseReps;
            updates.simpleRepProgressionType = lastSettings.simpleRepProgressionType;
            updates.simpleRepIncrement = lastSettings.simpleRepIncrement;
          }
          if (isWeighted) {
            updates.simpleBaseWeight = lastSettings.simpleBaseWeight;
            updates.simpleWeightProgressionType = lastSettings.simpleWeightProgressionType;
            updates.simpleWeightIncrement = lastSettings.simpleWeightIncrement;
          }
        }

        onUpdate(updates);
      }
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Conditioning exercise UI
  if (isConditioning) {
    return (
      <div className="border border-gray-300 dark:border-gray-700 rounded-lg p-2 bg-gray-100 dark:bg-gray-800">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-start gap-2">
            <div className="flex flex-col gap-1 flex-shrink-0">
              <Badge variant={exercise.type} className="text-2xs">
                {EXERCISE_TYPE_LABELS[exercise.type]}
              </Badge>
              <Badge variant="other" className="text-2xs">
                Cond
              </Badge>
            </div>
            <span className="font-medium text-sm text-gray-900 dark:text-gray-100 pt-0.5">
              {exercise.name}
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onRemove}
            className="p-1 text-gray-400 hover:text-red-500 flex-shrink-0"
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
              Base {isTimeBased ? 'Time (sec)' : 'Reps'}
            </label>
            <NumberInput
              value={
                isTimeBased
                  ? assignment.conditioningBaseTime || 30
                  : assignment.conditioningBaseReps || defaults.defaultConditioningReps
              }
              onChange={v =>
                onUpdate(isTimeBased ? { conditioningBaseTime: v } : { conditioningBaseReps: v })
              }
              min={1}
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
              Add {isTimeBased ? 'sec' : 'reps'}/week
            </label>
            <NumberInput
              value={
                isTimeBased
                  ? (assignment.conditioningTimeIncrement ?? 5)
                  : (assignment.conditioningRepIncrement ?? 1)
              }
              onChange={v =>
                onUpdate(
                  isTimeBased ? { conditioningTimeIncrement: v } : { conditioningRepIncrement: v }
                )
              }
              min={0}
              className="w-full"
            />
          </div>
        </div>
      </div>
    );
  }

  // Standard exercise UI with RFEM/Simple toggle
  return (
    <div className="border border-gray-300 dark:border-gray-700 rounded-lg p-2 bg-gray-100 dark:bg-gray-800">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-start gap-2">
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
          <span className="font-medium text-sm text-gray-900 dark:text-gray-100 pt-0.5">
            {exercise.name}
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onRemove}
          className="p-1 text-gray-400 hover:text-red-500 flex-shrink-0"
        >
          <Trash2 className="w-3 h-3" />
        </Button>
      </div>

      {/* Mode Toggle */}
      <div className="flex gap-2 mb-3">
        <button
          onClick={() => onUpdate({ progressionMode: 'rfem' })}
          className={`flex-1 py-1.5 px-3 text-xs font-medium rounded-md transition-colors ${
            exerciseMode === 'rfem'
              ? 'bg-primary-500 text-white'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
          }`}
        >
          RFEM
        </button>
        <button
          onClick={() => onUpdate({ progressionMode: 'simple' })}
          className={`flex-1 py-1.5 px-3 text-xs font-medium rounded-md transition-colors ${
            exerciseMode === 'simple'
              ? 'bg-emerald-500 text-white'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
          }`}
        >
          Simple
        </button>
      </div>

      {exerciseMode === 'rfem' ? (
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
          Uses cycle's RFEM rotation for target {isTimeBased ? 'time' : 'reps'}
        </p>
      ) : (
        <SimpleProgressionFields
          exercise={exercise}
          assignment={assignment}
          isTimeBased={isTimeBased}
          isWeighted={isWeighted}
          onUpdate={onUpdate}
        />
      )}
    </div>
  );
}
