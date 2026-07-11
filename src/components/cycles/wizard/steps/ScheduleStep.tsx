/**
 * ScheduleStep Component
 *
 * Combined step for cycle name and workout scheduling configuration.
 * Shows different UI based on scheduling mode selected in previous step:
 * - Fixed Days: Day selector + week spinner
 * - Flexible: Two spinners for workouts/week and weeks
 */

import { useMemo } from 'react';
import { Input, WheelPicker, SegmentedControl } from '@/components/ui';
import type { DayOfWeek, SchedulingMode } from '@/types';
import { calculateWorkoutDates } from '@/services/scheduler';
import { DayOfWeekPicker } from '../components/DayOfWeekPicker';
import type { ScheduleStepProps } from '../types';

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
  setSchedulingMode,
  selectedDays,
  setSelectedDays,
  workoutDaysPerWeek,
  setWorkoutDaysPerWeek,
  numberOfWeeks,
  setNumberOfWeeks,
  startDate,
}: ScheduleStepProps) {
  const isDateMode = schedulingMode === 'date';

  // Update selected days and keep workoutDaysPerWeek in sync in date mode
  const handleDaysChange = (newDays: DayOfWeek[]) => {
    setSelectedDays(newDays);
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

      {/* Scheduling mode toggle (formerly its own wizard step) */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Scheduling
        </label>
        <SegmentedControl<SchedulingMode>
          aria-label="Scheduling mode"
          fullWidth
          options={[
            { value: 'date', label: 'Fixed Days' },
            { value: 'sequence', label: 'Flexible' },
          ]}
          value={schedulingMode}
          onChange={setSchedulingMode}
        />
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {isDateMode
            ? 'Workouts land on specific days of the week.'
            : 'Do workouts whenever you want - just hit the weekly count.'}
        </p>
      </div>

      {isDateMode ? (
        /* Fixed Days Mode UI */
        <>
          {/* Day Selector */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Workout Days
            </label>
            <DayOfWeekPicker selectedDays={selectedDays} onChange={handleDaysChange} />
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
