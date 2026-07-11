/**
 * DayOfWeekPicker - row of toggleable day circles (S M T W T F S).
 *
 * Shared between the cycle wizard's ScheduleStep and the MaxTestingWizard's
 * date-based scheduling.
 */

import type { DayOfWeek } from '@/types';

const DAY_LABELS: { day: DayOfWeek; short: string; full: string }[] = [
  { day: 0, short: 'S', full: 'Sun' },
  { day: 1, short: 'M', full: 'Mon' },
  { day: 2, short: 'T', full: 'Tue' },
  { day: 3, short: 'W', full: 'Wed' },
  { day: 4, short: 'T', full: 'Thu' },
  { day: 5, short: 'F', full: 'Fri' },
  { day: 6, short: 'S', full: 'Sat' },
];

interface DayOfWeekPickerProps {
  selectedDays: DayOfWeek[];
  onChange: (days: DayOfWeek[]) => void;
}

export function DayOfWeekPicker({ selectedDays, onChange }: DayOfWeekPickerProps) {
  const handleDayToggle = (day: DayOfWeek) => {
    const isSelected = selectedDays.includes(day);
    const newDays = isSelected
      ? selectedDays.filter(d => d !== day)
      : [...selectedDays, day].sort((a, b) => a - b);
    onChange(newDays);
  };

  return (
    <div className="flex justify-between gap-1">
      {DAY_LABELS.map(({ day, short, full }) => {
        const isSelected = selectedDays.includes(day);
        return (
          <button
            key={day}
            type="button"
            onClick={() => handleDayToggle(day)}
            title={full}
            aria-label={full}
            aria-pressed={isSelected}
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
  );
}
