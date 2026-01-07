import { Circle, CheckCircle, Edit2 } from 'lucide-react';
import { SwipeableSetCard } from '../SwipeableSetCard';
import { EXERCISE_TYPE_LABELS, formatTime, type Exercise, type ScheduledSet, type CompletedSet, type ExerciseType } from '../../../types';

interface SetGroup {
  type: ExerciseType;
  sets: ScheduledSet[];
}

interface ScheduledSetsListProps {
  /** Grouped remaining sets to display */
  groupedSetsRemaining: SetGroup[];
  /** Grouped completed sets to display */
  groupedSetsCompleted: SetGroup[];
  /** Map of exercise ID to exercise data */
  exerciseMap: Map<string, Exercise>;
  /** Completed set records for lookup */
  workoutCompletedSets: CompletedSet[];
  /** Whether viewing a completed workout (affects styling) */
  isShowingCompletedWorkout: boolean;
  /** Whether this is the first set (show swipe hint) */
  showSwipeHint: boolean;
  /** Get target reps for a scheduled set */
  getTargetReps: (set: ScheduledSet) => number;
  /** Called when user swipes right to quick-complete a set */
  onQuickComplete: (set: ScheduledSet) => void;
  /** Called when user swipes left to skip a set */
  onSkipSet: (set: ScheduledSet) => void;
  /** Called when user taps a set for details */
  onSelectSet: (set: ScheduledSet) => void;
  /** Called when user taps a completed set to edit */
  onEditCompletedSet: (completedSet: CompletedSet) => void;
}

/**
 * Displays the list of scheduled sets for a workout, split into remaining and completed sections.
 * Remaining sets are swipeable (right to complete, left to skip).
 * Completed sets are tappable to edit.
 */
export function ScheduledSetsList({
  groupedSetsRemaining,
  groupedSetsCompleted,
  exerciseMap,
  workoutCompletedSets,
  isShowingCompletedWorkout,
  showSwipeHint,
  getTargetReps,
  onQuickComplete,
  onSkipSet,
  onSelectSet,
  onEditCompletedSet,
}: ScheduledSetsListProps) {
  return (
    <>
      {/* Remaining sets */}
      {groupedSetsRemaining.length > 0 && (
        <div className="p-3 space-y-4">
          {/* Swipe hint - only show once */}
          {showSwipeHint && (
            <p className="text-xs text-gray-400 dark:text-gray-500 text-center mb-1">
              Swipe right to complete • Swipe left to skip • Tap for details
            </p>
          )}
          {groupedSetsRemaining.map(group => (
            <div key={group.type}>
              <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                {EXERCISE_TYPE_LABELS[group.type]}
              </h4>
              <div className="space-y-2">
                {group.sets.map(set => {
                  const exercise = exerciseMap.get(set.exerciseId);
                  if (!exercise) return null;
                  const targetReps = getTargetReps(set);
                  const isMaxTestSet = set.isMaxTest;
                  const isWarmupSet = set.isWarmup;

                  return (
                    <SwipeableSetCard
                      key={set.id}
                      onSwipeRight={() => onQuickComplete(set)}
                      onSwipeLeft={() => onSkipSet(set)}
                      onTap={() => onSelectSet(set)}
                    >
                      <div className="flex items-center gap-4 p-4 text-left">
                        <Circle className="w-6 h-6 text-gray-300 dark:text-gray-600 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-lg font-medium text-gray-900 dark:text-gray-100">
                            {exercise.name}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            {isWarmupSet && (
                              <span className="text-xs px-1.5 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded">
                                Warmup
                              </span>
                            )}
                            {isMaxTestSet && (
                              <span className="text-xs px-1.5 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded">
                                Max Test
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col items-end">
                          <span className={`text-gym-2xl ${isMaxTestSet ? 'text-purple-600 dark:text-purple-400' : 'text-primary-600 dark:text-primary-400'}`}>
                            {isMaxTestSet ? 'MAX' : exercise.measurementType === 'time' ? formatTime(targetReps) : targetReps}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {isMaxTestSet ? 'go all out' : isWarmupSet ? 'warmup' : set.isConditioning ? 'cond' : exercise.measurementType === 'time' ? 'hold' : 'reps'}
                          </span>
                        </div>
                      </div>
                    </SwipeableSetCard>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Completed sets */}
      {groupedSetsCompleted.length > 0 && (
        <div className={`p-3 ${!isShowingCompletedWorkout && 'border-t border-gray-100 dark:border-gray-800'}`}>
          {!isShowingCompletedWorkout && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Completed (tap to edit)</p>
          )}
          <div className="space-y-4">
            {groupedSetsCompleted.map(group => (
              <div key={group.type}>
                <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                  {EXERCISE_TYPE_LABELS[group.type]}
                </h4>
                <div className="space-y-2">
                  {group.sets.map(set => {
                    const exercise = exerciseMap.get(set.exerciseId);
                    const completedSet = workoutCompletedSets.find(s => s.scheduledSetId === set.id);
                    if (!exercise || !completedSet) return null;
                    
                    const wasSkipped = completedSet.actualReps === 0 && completedSet.notes === 'Skipped';
                    const hasWeight = completedSet.weight !== undefined && completedSet.weight > 0;
                    const isTimeBased = exercise.measurementType === 'time';

                    return (
                      <button
                        key={set.id}
                        onClick={() => onEditCompletedSet(completedSet)}
                        className={`w-full flex items-center gap-4 p-3 rounded-lg transition-colors text-left ${
                          wasSkipped 
                            ? 'bg-orange-50 dark:bg-orange-900/20 hover:bg-orange-100 dark:hover:bg-orange-900/30'
                            : 'bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30'
                        }`}
                      >
                        <CheckCircle className={`w-5 h-5 flex-shrink-0 ${
                          wasSkipped ? 'text-orange-500' : 'text-green-500'
                        }`} />
                        <span className="text-base text-gray-700 dark:text-gray-300 flex-1">
                          {exercise.name}
                        </span>
                        <div className="flex items-baseline gap-1">
                          <span className={`text-gym-xl ${
                            wasSkipped 
                              ? 'text-orange-600 dark:text-orange-400'
                              : 'text-green-600 dark:text-green-400'
                          }`}>
                            {wasSkipped ? '—' : isTimeBased ? formatTime(completedSet.actualReps) : completedSet.actualReps}
                          </span>
                          {hasWeight && !wasSkipped && (
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
            ))}
          </div>
        </div>
      )}
    </>
  );
}
