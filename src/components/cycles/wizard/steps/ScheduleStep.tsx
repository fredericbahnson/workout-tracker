/**
 * ScheduleStep Component
 *
 * Combined step for cycle name and workout scheduling configuration.
 * Shows different UI based on scheduling mode selected in previous step:
 * - Fixed Days: Day selector + week spinner
 * - Flexible: Two spinners for workouts/week and weeks
 */

import { useMemo } from 'react';
import { Input, WheelPicker } from '@/components/ui';
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

// Generate week options (1-12 weeks)
const WEEK_OPTIONS = Array.from({ length: 12 }, (_, i) => ({
  value: i + 1,
  label: `${i + 1}`,
}));

// Generate days per week options (1-7 days)
const DAYS_PER_WEEK_OPTIONS = Array.from({ length: 7 }, (_, i) => ({
  value: i + 1,
  label: `${i + 1}`,
}));

export function ScheduleStep({
  name,
  setName,
  schedulingMode,
  selectedDays,
  setSelectedDays,
  workoutDaysPerWeek,
  setWorkoutDaysPerWeek,
  numberOfWeeks,
  setNumberOfWeeks,
  startDate,
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

      {/* Cycle Name */}
      <Input
        label="Cycle Name"
        value={name}
        onChange={e => setName(e.target.value)}
        placeholder="e.g., Winter 2026 Block 1"
      />

      {isDateMode ? (
        /* Fixed Days Mode UI */
        <>
          {/* Day Selector */}
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
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-medium transition-all ${
                      isSelected
                        ? 'bg-primary-100 dark:bg-primary-900/30 border-2 border-primary-500 dark:border-primary-400 text-primary-700 dark:text-primary-300'
                        : 'bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-400 dark:text-gray-500'
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
                : `${selectedDays.length} day${selectedDays.length !== 1 ? 's' : ''} per week`}
            </p>
          </div>

          {/* Week Spinner */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 text-center">
              Number of Weeks
            </label>
            <div className="flex justify-center">
              <div className="w-24 bg-gray-50 dark:bg-gray-800/50 rounded-xl overflow-hidden">
                <WheelPicker
                  options={WEEK_OPTIONS}
                  value={numberOfWeeks}
                  onChange={setNumberOfWeeks}
                  height={44}
                  visibleItems={3}
                />
              </div>
            </div>
          </div>

          {/* Schedule Preview */}
          {previewDates.length > 0 && (
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
                      <span className="text-xs text-gray-400 dark:text-gray-500 w-4">
                        {index + 1}.
                      </span>
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
        </>
      ) : (
        /* Flexible Mode UI */
        <>
          <div className="grid grid-cols-2 gap-6">
            {/* Workouts per Week Spinner */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 text-center">
                Workouts per Week
              </label>
              <div className="flex justify-center">
                <div className="w-24 bg-gray-50 dark:bg-gray-800/50 rounded-xl overflow-hidden">
                  <WheelPicker
                    options={DAYS_PER_WEEK_OPTIONS}
                    value={workoutDaysPerWeek}
                    onChange={setWorkoutDaysPerWeek}
                    height={44}
                    visibleItems={3}
                  />
                </div>
              </div>
            </div>

            {/* Number of Weeks Spinner */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 text-center">
                Weeks
              </label>
              <div className="flex justify-center">
                <div className="w-24 bg-gray-50 dark:bg-gray-800/50 rounded-xl overflow-hidden">
                  <WheelPicker
                    options={WEEK_OPTIONS}
                    value={numberOfWeeks}
                    onChange={setNumberOfWeeks}
                    height={44}
                    visibleItems={3}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {workoutDaysPerWeek * numberOfWeeks} total workouts
              </span>
              <span className="mx-2">·</span>
              {workoutDaysPerWeek} per week for {numberOfWeeks} weeks
            </p>
          </div>
        </>
      )}
    </div>
  );
}
