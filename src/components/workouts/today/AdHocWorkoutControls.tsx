import { Plus, CheckCircle, X } from 'lucide-react';
import { Button } from '../../ui';

interface AdHocWorkoutControlsProps {
  /** Whether any sets have been logged (enables Complete button) */
  hasCompletedSets: boolean;
  /** Called when user taps "Log a Set" */
  onLogSet: () => void;
  /** Called when user taps "Complete Workout" */
  onComplete: () => void;
  /** Called when user taps "Cancel Workout" */
  onCancel: () => void;
}

/**
 * Action buttons for an in-progress ad-hoc workout.
 * Shows Log a Set, Complete Workout (if sets logged), and Cancel Workout.
 */
export function AdHocWorkoutControls({
  hasCompletedSets,
  onLogSet,
  onComplete,
  onCancel,
}: AdHocWorkoutControlsProps) {
  return (
    <div className="p-4 border-t border-gray-100 dark:border-gray-800 space-y-2">
      <Button
        variant="secondary"
        className="w-full"
        onClick={onLogSet}
      >
        <Plus className="w-4 h-4 mr-1" />
        Log a Set
      </Button>
      {hasCompletedSets && (
        <Button
          className="w-full"
          onClick={onComplete}
        >
          <CheckCircle className="w-4 h-4 mr-1" />
          Complete Workout
        </Button>
      )}
      <Button
        variant="ghost"
        size="sm"
        className="w-full text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
        onClick={onCancel}
      >
        <X className="w-4 h-4 mr-1" />
        Cancel Workout
      </Button>
    </div>
  );
}
