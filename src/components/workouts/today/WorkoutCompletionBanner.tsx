import { PartyPopper } from 'lucide-react';

interface WorkoutCompletionBannerProps {
  workoutName: string;
}

/**
 * Celebration banner shown at the top of a completed workout card.
 * Displays congratulatory message with the workout name.
 */
export function WorkoutCompletionBanner({ workoutName }: WorkoutCompletionBannerProps) {
  return (
    <div className="px-4 py-4 bg-green-50 dark:bg-green-900/20 border-b border-green-100 dark:border-green-800 text-center">
      <div className="flex items-center justify-center gap-2 mb-1">
        <PartyPopper className="w-5 h-5 text-green-600 dark:text-green-400" />
        <h2 className="font-semibold text-green-700 dark:text-green-300">
          Workout Complete!
        </h2>
        <PartyPopper className="w-5 h-5 text-green-600 dark:text-green-400" />
      </div>
      <p className="text-sm text-green-600 dark:text-green-400">
        Great job finishing {workoutName}
      </p>
    </div>
  );
}
