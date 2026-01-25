import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui';

interface OverdueBannerProps {
  /** Number of overdue workouts */
  count: number;
  /** Oldest overdue date */
  oldestDate: Date;
  /** Called when user clicks to review overdue workouts */
  onReview: () => void;
}

/**
 * Banner shown when there are overdue workouts in a date-based cycle.
 * Displays count and oldest missed date with a review button.
 */
export function OverdueBanner({ count, oldestDate, onReview }: OverdueBannerProps) {
  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h3 className="font-medium text-amber-800 dark:text-amber-200">
            {count === 1 ? '1 Missed Workout' : `${count} Missed Workouts`}
          </h3>
          <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
            {count === 1
              ? `Scheduled for ${formatDate(oldestDate)}`
              : `Oldest from ${formatDate(oldestDate)}`}
          </p>
        </div>
        <Button size="sm" onClick={onReview}>
          Review
        </Button>
      </div>
    </div>
  );
}
