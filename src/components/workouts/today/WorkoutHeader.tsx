import { Pencil } from 'lucide-react';
import type { ScheduledWorkout } from '@/types';

type WorkoutMode = 'active' | 'completed' | 'adHoc';

interface WorkoutHeaderProps {
  /** The workout being displayed */
  workout: ScheduledWorkout;
  /** Name of the workout group (for scheduled workouts) */
  groupName?: string;
  /** Current display mode */
  mode: WorkoutMode;
  /** Number of scheduled sets completed */
  scheduledSetsCompletedCount: number;
  /** Number of ad-hoc sets logged */
  adHocSetsCount: number;
  /** Called when user taps rename button (ad-hoc only) */
  onRename?: () => void;
}

/**
 * Header section of a workout card showing title, progress, and type-based styling.
 * Adapts display based on workout type (scheduled vs ad-hoc) and completion state.
 */
export function WorkoutHeader({
  workout,
  groupName,
  mode,
  scheduledSetsCompletedCount,
  adHocSetsCount,
  onRename,
}: WorkoutHeaderProps) {
  const isCompleted = mode === 'completed';
  const isAdHoc = mode === 'adHoc';
  
  // Background and border colors based on mode
  const containerClasses = isCompleted
    ? 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-dark-border'
    : isAdHoc
      ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-800'
      : 'bg-primary-50 dark:bg-primary-900/20 border-primary-100 dark:border-primary-800';

  // Progress number color based on mode
  const progressColorClasses = isCompleted
    ? 'text-green-600 dark:text-green-400'
    : isAdHoc
      ? 'text-blue-600 dark:text-blue-400'
      : 'text-primary-600 dark:text-primary-400';

  return (
    <div className={`px-4 py-3 border-b ${containerClasses}`}>
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          {isAdHoc ? (
            <>
              <div className="flex items-center gap-2">
                <h2 className="font-semibold text-gray-900 dark:text-gray-100">
                  {workout.customName || 'Ad Hoc Workout'}
                </h2>
                {onRename && (
                  <button
                    onClick={onRename}
                    className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                )}
              </div>
              <p className="text-sm text-blue-600 dark:text-blue-400">
                Log any exercises you want
              </p>
            </>
          ) : (
            <>
              <h2 className="font-semibold text-gray-900 dark:text-gray-100">
                {workout.isAdHoc 
                  ? workout.customName || 'Ad Hoc Workout'
                  : `${groupName || 'Workout'}`
                }
                {!workout.isAdHoc && (
                  <span className="text-sm font-normal text-gray-500 dark:text-gray-400 ml-2">
                    #{workout.sequenceNumber}
                  </span>
                )}
              </h2>
              {!workout.isAdHoc && (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Week {workout.weekNumber} • RFEM -{workout.rfem}
                </p>
              )}
            </>
          )}
        </div>
        <div className="text-right">
          {workout.isAdHoc ? (
            <>
              <p className={`text-gym-xl ${progressColorClasses}`}>
                {adHocSetsCount}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">sets logged</p>
            </>
          ) : (
            <>
              <p className={`text-gym-xl ${progressColorClasses}`}>
                {scheduledSetsCompletedCount}/{workout.scheduledSets.length}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">sets done</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
