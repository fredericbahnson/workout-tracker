import { Calendar } from 'lucide-react';
import { Card, Button } from '@/components/ui';
import type { Cycle } from '@/types';

interface CycleProgress {
  completed: number;
  skipped: number;
  passed: number;
  total: number;
}

interface CycleProgressHeaderProps {
  /** The active cycle, if any */
  activeCycle: Cycle | null | undefined;
  /** Progress data for the cycle */
  cycleProgress: CycleProgress | null | undefined;
  /** Whether there's an active (in-progress) workout being displayed */
  hasActiveWorkout: boolean;
  /** Called when user wants to create a new cycle */
  onCreateCycle: () => void;
}

/**
 * Displays cycle status at the top of the Today page.
 * Shows one of three states:
 * - No Active Cycle prompt
 * - Cycle Complete celebration
 * - Compact progress indicator (when workout active)
 */
export function CycleProgressHeader({
  activeCycle,
  cycleProgress,
  hasActiveWorkout,
  onCreateCycle,
}: CycleProgressHeaderProps) {
  // No Active Cycle
  if (!activeCycle) {
    return (
      <Card className="p-4 border-primary-200 dark:border-primary-800 bg-primary-50 dark:bg-primary-900/20">
        <div className="flex items-start gap-3">
          <Calendar className="w-5 h-5 text-primary-600 dark:text-primary-400 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-medium text-gray-900 dark:text-gray-100">
              No Active Cycle
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Create a training cycle to get scheduled workouts with RFEM-based rep targets.
            </p>
            <Button 
              size="sm" 
              className="mt-3"
              onClick={onCreateCycle}
            >
              Create Cycle
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  // Need cycle progress data to show progress states
  if (!cycleProgress) {
    return null;
  }

  const isCycleComplete = cycleProgress.passed === cycleProgress.total && cycleProgress.total > 0;

  // Cycle Complete
  if (isCycleComplete) {
    return (
      <Card className="p-4 text-center">
        <p className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
          🎉 Cycle Complete!
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          You've completed {activeCycle.name}
          {cycleProgress.skipped > 0 
            ? ` (${cycleProgress.completed} completed, ${cycleProgress.skipped} skipped)`
            : ` — all ${cycleProgress.total} workouts done!`
          }
        </p>
        <Button onClick={onCreateCycle}>
          Start New Cycle
        </Button>
      </Card>
    );
  }

  // Compact Cycle Progress - show when there's an active workout
  if (hasActiveWorkout) {
    return (
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-600 dark:text-gray-400">
          {activeCycle.name}
        </span>
        <span className="text-gray-500 dark:text-gray-400">
          Workout {cycleProgress.passed + 1} of {cycleProgress.total}
        </span>
      </div>
    );
  }

  return null;
}
