/**
 * BasicsStep Component
 *
 * Step for configuring basic cycle parameters:
 * name, start date, duration, and workout frequency.
 */

import { Input, NumberInput } from '@/components/ui';
import type { BasicsStepProps } from '../types';

export function BasicsStep({
  name,
  setName,
  startDate,
  setStartDate,
  numberOfWeeks,
  setNumberOfWeeks,
  workoutDaysPerWeek,
  setWorkoutDaysPerWeek,
}: BasicsStepProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Cycle Basics</h2>

      <Input
        label="Cycle Name"
        value={name}
        onChange={e => setName(e.target.value)}
        placeholder="e.g., Winter 2025 Block 1"
      />

      <Input
        label="Start Date"
        type="date"
        value={startDate}
        onChange={e => setStartDate(e.target.value)}
        className="w-full [&::-webkit-calendar-picker-indicator]:ml-auto"
      />

      <div className="grid grid-cols-2 gap-4">
        <NumberInput
          label="Number of Weeks"
          value={numberOfWeeks}
          onChange={setNumberOfWeeks}
          min={1}
          max={12}
        />

        <NumberInput
          label="Workout Days per Week"
          value={workoutDaysPerWeek}
          onChange={setWorkoutDaysPerWeek}
          min={1}
          max={7}
        />
      </div>
    </div>
  );
}
