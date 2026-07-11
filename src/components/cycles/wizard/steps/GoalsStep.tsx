/**
 * GoalsStep Component
 *
 * Step for configuring weekly set goals, rotations, and warmup settings.
 * Set goals are shown only for exercise types actually present in the cycle's
 * groups (goals for absent types are ignored by the scheduler); RFEM rotation
 * and the conditioning increment live behind an Advanced disclosure since
 * their defaults suit most cycles.
 */

import { useMemo, useState } from 'react';
import { Plus, Trash2, ChevronDown, ChevronRight } from 'lucide-react';
import { Button, NumberInput, Select, Badge } from '@/components/ui';
import { EXERCISE_TYPES, EXERCISE_TYPE_LABELS, type ExerciseType } from '@/types';
import type { GoalsStepProps } from '../types';

export function GoalsStep({
  progressionMode,
  weeklySetGoals,
  setWeeklySetGoals,
  groups,
  exerciseMap,
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

  const [showAllTypes, setShowAllTypes] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Exercise types actually present in the cycle's groups. Goals for absent
  // types are ignored by the scheduler, so hide them by default.
  const presentTypes = useMemo(() => {
    const types = new Set<ExerciseType>();
    for (const group of groups) {
      for (const assignment of group.exerciseAssignments) {
        const exercise = exerciseMap.get(assignment.exerciseId);
        if (exercise) types.add(exercise.type);
      }
    }
    return types;
  }, [groups, exerciseMap]);

  const goalTypes = EXERCISE_TYPES.filter(t => t !== 'other');
  const visibleGoalTypes =
    showAllTypes || presentTypes.size === 0
      ? goalTypes
      : goalTypes.filter(t => presentTypes.has(t));
  const hiddenTypeCount = goalTypes.length - visibleGoalTypes.length;

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

  const hasAdvancedSection = !isSimpleMode;

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
          {visibleGoalTypes.map(type => (
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

        {hiddenTypeCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="mt-2 text-gray-500"
            onClick={() => setShowAllTypes(true)}
          >
            Show all types ({hiddenTypeCount} more)
          </Button>
        )}
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
                  aria-label="Remove rotation entry"
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
            aria-label="Add rotation entry"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Advanced: RFEM rotation + conditioning increment. Defaults suit most
          cycles, so these stay collapsed unless the user wants to tune them. */}
      {hasAdvancedSection && (
        <div>
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            aria-expanded={showAdvanced}
            className="flex items-center gap-1.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
          >
            {showAdvanced ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
            Advanced
            {!showAdvanced && (
              <span className="text-xs font-normal text-gray-400 dark:text-gray-500">
                RFEM rotation: {rfemRotation.map(v => `-${v}`).join(', ')}
                {!isMixedMode && ` · conditioning +${conditioningWeeklyRepIncrement}/week`}
              </span>
            )}
          </button>

          {showAdvanced && (
            <div className="mt-4 space-y-6">
              {/* RFEM Rotation - for RFEM and mixed modes */}
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
                          aria-label="Remove RFEM value"
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
                    onClick={addRfemValue}
                    aria-label="Add RFEM value"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Conditioning Increment - only for RFEM mode (mixed mode has per-exercise increments) */}
              {!isMixedMode && (
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
          )}
        </div>
      )}
    </div>
  );
}
