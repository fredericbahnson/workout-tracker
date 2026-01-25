import { Coffee, Dumbbell } from 'lucide-react';
import { Card, Button } from '@/components/ui';
import type { ScheduledWorkout } from '@/types';

interface RestDayCardProps {
  /** Next scheduled workout (for display) */
  nextWorkout: ScheduledWorkout | null;
  /** Name of the workout group for next workout */
  nextGroupName: string | undefined;
  /** Called when user wants to work out anyway */
  onWorkOutAnyway: () => void;
}

/**
 * Card shown on rest days in date-based cycles.
 * Displays a friendly message and the next scheduled workout date.
 */
export function RestDayCard({ nextWorkout, nextGroupName, onWorkOutAnyway }: RestDayCardProps) {
  const formatDate = (date: Date): string => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const tomorrowOnly = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate());

    if (dateOnly.getTime() === tomorrowOnly.getTime()) {
      return 'tomorrow';
    }

    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <Card className="p-6 text-center">
      <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
        <Coffee className="w-7 h-7 text-blue-600 dark:text-blue-400" />
      </div>

      <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Rest Day</h2>

      <p className="text-gray-600 dark:text-gray-400 mb-4">
        No workout scheduled for today. Take it easy and recover!
      </p>

      {nextWorkout && nextWorkout.scheduledDate && (
        <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg mb-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">Next workout</p>
          <p className="font-medium text-gray-900 dark:text-gray-100">
            {nextGroupName || 'Workout'} #{nextWorkout.sequenceNumber}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {formatDate(new Date(nextWorkout.scheduledDate))}
          </p>
        </div>
      )}

      <Button variant="secondary" onClick={onWorkOutAnyway} className="w-full">
        <Dumbbell className="w-4 h-4 mr-2" />
        Work Out Anyway
      </Button>
    </Card>
  );
}
