/**
 * GroupsStep Component
 * 
 * Step for managing workout groups and exercise assignments.
 * In mixed mode, also handles per-exercise progression configuration.
 */

import { useState } from 'react';
import { Plus, Trash2, Check } from 'lucide-react';
import { Button, Input, NumberInput, Card, Badge, Modal } from '@/components/ui';
import { EXERCISE_TYPES, EXERCISE_TYPE_LABELS } from '@/types';
import { MixedExerciseConfig } from '../components/MixedExerciseConfig';
import type { GroupsStepProps } from '../types';

export function GroupsStep({
  groups,
  exercises,
  exerciseMap,
  defaults,
  progressionMode,
  onAddGroup,
  onRemoveGroup,
  onUpdateGroupName,
  onAddExercise,
  onRemoveExercise,
  onUpdateConditioningReps,
  onUpdateAssignment
}: GroupsStepProps) {
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [showExercisePicker, setShowExercisePicker] = useState(false);
  const isMixedMode = progressionMode === 'mixed';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          {isMixedMode ? 'Exercises & Progression' : 'Workout Groups'}
        </h2>
        <Button variant="secondary" size="sm" onClick={onAddGroup}>
          <Plus className="w-4 h-4 mr-1" />
          Add Group
        </Button>
      </div>

      <p className="text-sm text-gray-500 dark:text-gray-400">
        {isMixedMode
          ? 'Create groups and configure RFEM or simple progression for each exercise.'
          : 'Create groups of exercises that will be performed together on the same day.'
        }
      </p>

      <div className="space-y-3">
        {groups.map(group => (
          <Card key={group.id} className="p-3">
            <div className="flex items-center gap-2 mb-2">
              <Input
                value={group.name}
                onChange={e => onUpdateGroupName(group.id, e.target.value)}
                className="flex-1 font-medium"
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedGroup(group.id);
                  setShowExercisePicker(true);
                }}
              >
                <Plus className="w-4 h-4" />
              </Button>
              {groups.length > 1 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onRemoveGroup(group.id)}
                  className="text-red-500 hover:text-red-600"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>

            {group.exerciseAssignments.length === 0 ? (
              <p className="text-sm text-gray-400 dark:text-gray-500 py-2">
                No exercises yet. Tap + to add exercises.
              </p>
            ) : (
              <div className="space-y-2">
                {group.exerciseAssignments.map(assignment => {
                  const exercise = exerciseMap.get(assignment.exerciseId);
                  if (!exercise) return null;

                  // In mixed mode, show inline configuration
                  if (isMixedMode) {
                    return (
                      <MixedExerciseConfig
                        key={assignment.exerciseId}
                        exercise={exercise}
                        assignment={assignment}
                        defaults={defaults}
                        onUpdate={(updates) => onUpdateAssignment(group.id, assignment.exerciseId, updates)}
                        onRemove={() => onRemoveExercise(group.id, assignment.exerciseId)}
                      />
                    );
                  }

                  // Standard display for RFEM/Simple modes
                  return (
                    <div
                      key={assignment.exerciseId}
                      className="flex items-start gap-2 py-1.5 px-2 bg-gray-50 dark:bg-gray-800/50 rounded"
                    >
                      <Badge variant={exercise.type} className="text-2xs flex-shrink-0 mt-0.5">
                        {EXERCISE_TYPE_LABELS[exercise.type]}
                      </Badge>
                      <span className="flex-1 text-sm min-w-0 break-words">{exercise.name}</span>

                      {exercise.mode === 'conditioning' && (
                        <NumberInput
                          value={assignment.conditioningBaseReps || defaults.defaultConditioningReps}
                          onChange={v => onUpdateConditioningReps(
                            group.id,
                            assignment.exerciseId,
                            v
                          )}
                          min={1}
                          className="w-16 text-xs py-1 flex-shrink-0"
                        />
                      )}

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onRemoveExercise(group.id, assignment.exerciseId)}
                        className="p-1 text-gray-400 hover:text-red-500 flex-shrink-0"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        ))}
      </div>

      {/* Exercise Picker Modal */}
      <Modal
        isOpen={showExercisePicker}
        onClose={() => setShowExercisePicker(false)}
        title="Add/Remove Exercises"
        size="lg"
      >
        <div className="space-y-4">
          {EXERCISE_TYPES.map(type => {
            const typeExercises = exercises
              .filter(ex => ex.type === type)
              .sort((a, b) => a.name.localeCompare(b.name));

            if (typeExercises.length === 0) return null;

            return (
              <div key={type}>
                <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                  {EXERCISE_TYPE_LABELS[type]}
                </h3>
                <div className="space-y-2">
                  {typeExercises.map(exercise => {
                    const group = groups.find(g => g.id === selectedGroup);
                    const isAdded = group?.exerciseAssignments.some(a => a.exerciseId === exercise.id);

                    return (
                      <button
                        key={exercise.id}
                        onClick={() => {
                          if (selectedGroup) {
                            if (isAdded) {
                              onRemoveExercise(selectedGroup, exercise.id);
                            } else {
                              onAddExercise(selectedGroup, exercise.id);
                            }
                          }
                        }}
                        className={`
                          w-full flex items-center gap-2 p-3 rounded-lg text-left transition-colors
                          ${isAdded
                            ? 'bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800'
                            : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                          }
                        `}
                      >
                        <Badge variant={exercise.type}>
                          {EXERCISE_TYPE_LABELS[exercise.type]}
                        </Badge>
                        <span className="flex-1">{exercise.name}</span>
                        {exercise.mode === 'conditioning' && (
                          <span className="text-xs text-gray-500 dark:text-gray-400">conditioning</span>
                        )}
                        {isAdded && <Check className="w-4 h-4 text-primary-500" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}

          <Button
            className="w-full mt-4"
            onClick={() => setShowExercisePicker(false)}
          >
            Done
          </Button>
        </div>
      </Modal>
    </div>
  );
}
