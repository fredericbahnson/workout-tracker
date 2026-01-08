import { Plus, Edit2 } from 'lucide-react';
import { EXERCISE_TYPE_LABELS, formatTime, type Exercise, type CompletedSet, type ExerciseType } from '@/types';

interface SetGroup {
  type: ExerciseType;
  sets: CompletedSet[];
}

interface AdHocCompletedSetsListProps {
  /** Grouped ad-hoc completed sets by exercise type */
  groupedSets: SetGroup[];
  /** Map of exercise ID to exercise data */
  exerciseMap: Map<string, Exercise>;
  /** Whether this is an ad-hoc workout (affects label text) */
  isAdHocWorkout: boolean;
  /** Whether to show border at top */
  showTopBorder: boolean;
  /** Called when user taps a set to edit */
  onEditSet: (completedSet: CompletedSet) => void;
}

/**
 * Displays ad-hoc completed sets (logged via "+ Log" button, not from scheduled sets).
 * Sets are grouped by exercise type and tappable to edit.
 */
export function AdHocCompletedSetsList({
  groupedSets,
  exerciseMap,
  isAdHocWorkout,
  showTopBorder,
  onEditSet,
}: AdHocCompletedSetsListProps) {
  // Check if there are any sets to display
  const hasSets = groupedSets.some(group => group.sets.length > 0);
  
  if (!hasSets) {
    return null;
  }

  return (
    <div className={`p-3 ${showTopBorder ? 'border-t border-gray-100 dark:border-gray-800' : ''}`}>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
        {isAdHocWorkout ? 'Logged Sets (tap to edit)' : 'Additional Sets (tap to edit)'}
      </p>
      <div className="space-y-4">
        {groupedSets.map(group => {
          if (group.sets.length === 0) return null;
          
          return (
            <div key={group.type}>
              <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                {EXERCISE_TYPE_LABELS[group.type]}
              </h4>
              <div className="space-y-2">
                {group.sets.map(completedSet => {
                  const exercise = exerciseMap.get(completedSet.exerciseId);
                  if (!exercise) return null;
                  
                  const hasWeight = completedSet.weight !== undefined && completedSet.weight > 0;
                  const isTimeBased = exercise.measurementType === 'time';

                  return (
                    <button
                      key={completedSet.id}
                      onClick={() => onEditSet(completedSet)}
                      className="w-full flex items-center gap-4 p-3 rounded-lg transition-colors text-left bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30"
                    >
                      <Plus className="w-5 h-5 flex-shrink-0 text-blue-500" />
                      <span className="text-base text-gray-700 dark:text-gray-300 flex-1">
                        {exercise.name}
                      </span>
                      <div className="flex items-baseline gap-1">
                        <span className="text-gym-xl text-blue-600 dark:text-blue-400">
                          {isTimeBased ? formatTime(completedSet.actualReps) : completedSet.actualReps}
                        </span>
                        {hasWeight && (
                          <span className="text-sm text-purple-600 dark:text-purple-400">
                            +{completedSet.weight}
                          </span>
                        )}
                      </div>
                      <Edit2 className="w-3 h-3 text-gray-400" />
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
