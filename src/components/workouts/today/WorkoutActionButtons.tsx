import { ChevronRight, SkipForward, StopCircle } from 'lucide-react';
import { Button } from '@/components/ui';

interface WorkoutActionButtonsProps {
  /** Whether viewing a completed workout */
  isShowingCompletedWorkout: boolean;
  /** Whether there's a next pending workout to continue to */
  hasNextWorkout: boolean;
  /** Whether any sets have been completed in current workout */
  hasCompletedSets: boolean;
  /** Called when user wants to continue to next workout */
  onContinue: () => void;
  /** Called when user wants to skip the workout */
  onSkip: () => void;
  /** Called when user wants to end the workout early */
  onEndEarly: () => void;
}

/**
 * Action buttons for scheduled workouts.
 * Shows either "Continue to Next Workout" (when completed) or "Skip/End Early" (when active).
 */
export function WorkoutActionButtons({
  isShowingCompletedWorkout,
  hasNextWorkout,
  hasCompletedSets,
  onContinue,
  onSkip,
  onEndEarly,
}: WorkoutActionButtonsProps) {
  // Continue to next workout button (when showing completed workout)
  if (isShowingCompletedWorkout && hasNextWorkout) {
    return (
      <div className="p-4 border-t border-gray-100 dark:border-gray-800">
        <Button 
          className="w-full"
          onClick={onContinue}
        >
          Continue to Next Workout
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    );
  }

  // Skip / End Workout buttons (only when actively working out)
  if (!isShowingCompletedWorkout) {
    return (
      <div className="p-3 border-t border-gray-100 dark:border-gray-800 flex gap-2">
        <Button
          variant="ghost"
          size="sm"
          className="flex-1 text-gray-500"
          onClick={onSkip}
        >
          <SkipForward className="w-4 h-4 mr-1" />
          Skip Workout
        </Button>
        {hasCompletedSets && (
          <Button
            variant="ghost"
            size="sm"
            className="flex-1 text-gray-500"
            onClick={onEndEarly}
          >
            <StopCircle className="w-4 h-4 mr-1" />
            End Early
          </Button>
        )}
      </div>
    );
  }

  return null;
}
