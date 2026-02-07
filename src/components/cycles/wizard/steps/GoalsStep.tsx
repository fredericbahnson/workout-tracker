/**
 * GoalsStep Component
 *
 * Step for configuring weekly set goals, rotations, and warmup settings.
 */

import { Plus, Trash2 } from 'lucide-react';
import { Button, NumberInput, Select, Badge } from '@/components/ui';
import { EXERCISE_TYPES, EXERCISE_TYPE_LABELS } from '@/types';
import type { GoalsStepProps } from '../types';

export function GoalsStep({
  progressionMode,
  weeklySetGoals,
  setWeeklySetGoals,
  groups,
  groupRotation,
  setGroupRotation,
  rfemRotation,
  setRfemRotation,
  conditioningWeeklyRepIncrement,
  setConditioningWeeklyRepIncrement,
  workoutDaysPerWeek,
}: GoalsStepProps) {
  const isSimpleMode = progressionMode === 'simple';
  const isMixedMode = progressionMode === 'mixed';

  const updateGoal = (type: (typeof EXERCISE_TYPES)[number], value: number) => {
    setWeeklySetGoals({ ...weeklySetGoals, [type]: value });
  };

  const updateRfem = (index: number, value: number) => {
    const newRotation = [...rfemRotation];
    newRotation[index] = value;
    setRfemRotation(newRotation);
  };

  const addRfemValue = () => {
    setRfemRotation([...rfemRotation, 3]);
  };

  const removeRfemValue = (index: number) => {
    if (rfemRotation.length > 1) {
      setRfemRotation(rfemRotation.filter((_, i) => i !== index));
    }
  };

  return (
    <div className="space-y-6">
      {/* Weekly Set Goals */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
          Weekly Set Goals
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
          How many sets of each type per week?
        </p>

        <div className="grid grid-cols-2 gap-3">
          {EXERCISE_TYPES.filter(t => t !== 'other').map(type => (
            <div key={type} className="flex flex-col gap-1">
              <Badge variant={type} className="w-fit">
                {EXERCISE_TYPE_LABELS[type]}
              </Badge>
              <NumberInput
                value={weeklySetGoals[type]}
                onChange={v => updateGoal(type, v)}
                min={0}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Group Rotation */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
          Group Rotation
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
          Order of groups across workout days (repeats if fewer than {workoutDaysPerWeek} days)
        </p>

        <div className="flex flex-wrap gap-2">
          {groupRotation.map((groupId, index) => (
            <div key={index} className="flex items-center gap-1">
              <Select
                value={groupId}
                onChange={e => {
                  const newRotation = [...groupRotation];
                  newRotation[index] = e.target.value;
                  setGroupRotation(newRotation);
                }}
                options={groups.map(g => ({ value: g.id, label: g.name }))}
                className="w-28"
              />
              {groupRotation.length > 1 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setGroupRotation(groupRotation.filter((_, i) => i !== index))}
                  className="p-1 text-gray-400"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              )}
            </div>
          ))}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setGroupRotation([...groupRotation, groups[0]?.id || ''])}
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* RFEM Rotation - for RFEM and mixed modes */}
      {!isSimpleMode && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            RFEM Rotation
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
            {isMixedMode
              ? 'Reps From Established Max: applies to all RFEM-mode exercises'
              : 'Reps From Established Max: subtracted from your max for target reps'}
          </p>

          <div className="flex flex-wrap gap-2">
            {rfemRotation.map((value, index) => (
              <div key={index} className="flex items-center gap-1">
                <NumberInput
                  value={value}
                  onChange={v => updateRfem(index, v)}
                  min={0}
                  max={20}
                  className="w-16"
                />
                {rfemRotation.length > 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeRfemValue(index)}
                    className="p-1 text-gray-400"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                )}
              </div>
            ))}
            <Button variant="ghost" size="sm" onClick={addRfemValue}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Conditioning Increment - only for RFEM mode (mixed mode has per-exercise increments) */}
      {!isSimpleMode && !isMixedMode && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Conditioning Weekly Increment
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
            How many reps to add each week for conditioning exercises
          </p>

          <NumberInput
            value={conditioningWeeklyRepIncrement}
            onChange={setConditioningWeeklyRepIncrement}
            min={0}
            className="w-24"
          />
        </div>
      )}
    </div>
  );
}
