/**
 * ScheduleStep Component
 *
 * Step for configuring workout scheduling mode:
 * - Sequence mode: Workouts completed in order at user's own pace
 * - Date mode: Workouts assigned to specific days of the week
 */

import { useMemo } from 'react';
import type { DayOfWeek } from '@/types';
import { calculateWorkoutDates } from '@/services/scheduler';
import type { ScheduleStepProps } from '../types';

const DAY_LABELS: { day: DayOfWeek; short: string; full: string }[] = [
  { day: 0, short: 'S', full: 'Sun' },
  { day: 1, short: 'M', full: 'Mon' },
  { day: 2, short: 'T', full: 'Tue' },
  { day: 3, short: 'W', full: 'Wed' },
  { day: 4, short: 'T', full: 'Thu' },
  { day: 5, short: 'F', full: 'Fri' },
  { day: 6, short: 'S', full: 'Sat' },
];

export function ScheduleStep({
  schedulingMode,
  setSchedulingMode,
  selectedDays,
  setSelectedDays,
  workoutDaysPerWeek,
  setWorkoutDaysPerWeek,
  startDate,
  numberOfWeeks,
}: ScheduleStepProps) {
  const isDateMode = schedulingMode === 'date';

  // Toggle a day selection and update workoutDaysPerWeek when in date mode
  const handleDayToggle = (day: DayOfWeek) => {
    const isSelected = selectedDays.includes(day);
    const newDays = isSelected
      ? selectedDays.filter(d => d !== day)
      : [...selectedDays, day].sort((a, b) => a - b);

    setSelectedDays(newDays);

    // Auto-update workoutDaysPerWeek when in date mode
    if (isDateMode) {
      setWorkoutDaysPerWeek(newDays.length);
    }
  };

  // Calculate preview dates for date mode
  const previewDates = useMemo(() => {
    if (!isDateMode || selectedDays.length === 0) return [];

    const start = new Date(startDate);
    const dates = calculateWorkoutDates(start, Math.min(numberOfWeeks, 2), selectedDays);
    return dates.slice(0, 6); // Show first 6 workouts
  }, [isDateMode, selectedDays, startDate, numberOfWeeks]);

  // Format a date for display
  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Workout Schedule</h2>

      {/* Mode Toggle */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Scheduling Mode
        </label>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setSchedulingMode('sequence')}
            className={`px-4 py-3 rounded-lg border-2 transition-colors ${
              schedulingMode === 'sequence'
                ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300'
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
            }`}
          >
            <div className="font-medium">Flexible</div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Work out at your pace
            </div>
          </button>

          <button
            type="button"
            onClick={() => setSchedulingMode('date')}
            className={`px-4 py-3 rounded-lg border-2 transition-colors ${
              schedulingMode === 'date'
                ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300'
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
            }`}
          >
            <div className="font-medium">Fixed Days</div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Specific days each week
            </div>
          </button>
        </div>
      </div>

      {/* Mode description */}
      <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-sm text-gray-600 dark:text-gray-400">
        {schedulingMode === 'sequence' ? (
          <>
            <strong>Flexible scheduling:</strong> Complete workouts in order at your own pace. The
            app will show your next workout whenever you&apos;re ready.
          </>
        ) : (
          <>
            <strong>Fixed day scheduling:</strong> Workouts are assigned to specific days.
            You&apos;ll see if you&apos;re on track, behind, or ahead of schedule.
          </>
        )}
      </div>

      {/* Day Picker (only for date mode) */}
      {isDateMode && (
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Workout Days
          </label>
          <div className="flex justify-between gap-1">
            {DAY_LABELS.map(({ day, short, full }) => {
              const isSelected = selectedDays.includes(day);
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => handleDayToggle(day)}
                  title={full}
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-medium transition-colors ${
                    isSelected
                      ? 'bg-brand-500 text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  {short}
                </button>
              );
            })}
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {selectedDays.length === 0
              ? 'Select at least one day'
              : `${selectedDays.length} day${selectedDays.length !== 1 ? 's' : ''} per week selected`}
          </p>
        </div>
      )}

      {/* Date Preview (only for date mode with days selected) */}
      {isDateMode && previewDates.length > 0 && (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Schedule Preview
          </label>
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
            <div className="grid grid-cols-2 gap-2 text-sm">
              {previewDates.map((date, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 text-gray-600 dark:text-gray-400"
                >
                  <span className="text-xs text-gray-400 dark:text-gray-500 w-4">{index + 1}.</span>
                  <span>{formatDate(date)}</span>
                </div>
              ))}
            </div>
            {numberOfWeeks > 2 && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                ...and{' '}
                {(numberOfWeeks - 2) * selectedDays.length +
                  (previewDates.length < 6
                    ? 0
                    : selectedDays.length * 2 - previewDates.length)}{' '}
                more workouts
              </p>
            )}
          </div>
        </div>
      )}

      {/* Show current workoutDaysPerWeek for sequence mode */}
      {!isDateMode && (
        <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            <span className="font-medium">{workoutDaysPerWeek} workouts per week</span>
            <span className="text-gray-500"> (set on previous step)</span>
          </div>
        </div>
      )}
    </div>
  );
}
