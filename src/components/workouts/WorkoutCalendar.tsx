import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { isToday } from '@/utils';
import type { ScheduledWorkout } from '@/types';

interface WorkoutCalendarProps {
  workouts: ScheduledWorkout[];
  onSelectDate: (date: Date, workouts: ScheduledWorkout[]) => void;
}

export function WorkoutCalendar({ workouts, onSelectDate }: WorkoutCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  // Build a map of date string -> workouts for that day
  const workoutsByDate = useMemo(() => {
    const map = new Map<string, ScheduledWorkout[]>();
    workouts.forEach(workout => {
      if (workout.completedAt) {
        const date = new Date(workout.completedAt);
        const dateKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
        const existing = map.get(dateKey) || [];
        existing.push(workout);
        map.set(dateKey, existing);
      }
    });
    return map;
  }, [workouts]);

  // Get calendar grid for current month
  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    // First day of the month
    const firstDay = new Date(year, month, 1);
    // Last day of the month
    const lastDay = new Date(year, month + 1, 0);

    // Start from Sunday of the week containing the first day
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - startDate.getDay());

    // End on Saturday of the week containing the last day
    const endDate = new Date(lastDay);
    endDate.setDate(endDate.getDate() + (6 - endDate.getDay()));

    const days: Date[] = [];
    const current = new Date(startDate);
    while (current <= endDate) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }

    return days;
  }, [currentMonth]);

  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const goToToday = () => {
    const now = new Date();
    setCurrentMonth(new Date(now.getFullYear(), now.getMonth(), 1));
  };

  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === currentMonth.getMonth();
  };

  const getWorkoutsForDate = (date: Date): ScheduledWorkout[] => {
    const dateKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
    return workoutsByDate.get(dateKey) || [];
  };

  const handleDateClick = (date: Date) => {
    const dayWorkouts = getWorkoutsForDate(date);
    if (dayWorkouts.length > 0) {
      onSelectDate(date, dayWorkouts);
    }
  };

  const monthYear = currentMonth.toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
  });

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-dark-border overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-dark-border">
        <button
          onClick={goToPreviousMonth}
          className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <button
          onClick={goToToday}
          className="font-medium text-gray-900 dark:text-gray-100 hover:text-primary-600 dark:hover:text-primary-400"
        >
          {monthYear}
        </button>

        <button
          onClick={goToNextMonth}
          className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 border-b border-gray-200 dark:border-dark-border">
        {weekDays.map(day => (
          <div
            key={day}
            className="py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7">
        {calendarDays.map((date, index) => {
          const dayWorkouts = getWorkoutsForDate(date);
          const hasWorkout = dayWorkouts.length > 0;
          const hasMultiple = dayWorkouts.length > 1;
          const inCurrentMonth = isCurrentMonth(date);
          const today = isToday(date);

          // Check if any workout is ad-hoc
          const hasAdHoc = dayWorkouts.some(w => w.isAdHoc);
          const hasRegular = dayWorkouts.some(w => !w.isAdHoc);

          return (
            <button
              key={index}
              onClick={() => handleDateClick(date)}
              disabled={!hasWorkout}
              className={`
                relative aspect-square flex flex-col items-center justify-center
                border-b border-r border-gray-100 dark:border-dark-border
                transition-colors
                ${!inCurrentMonth ? 'text-gray-300 dark:text-gray-600' : 'text-gray-700 dark:text-gray-300'}
                ${hasWorkout ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50' : 'cursor-default'}
                ${today ? 'bg-primary-50 dark:bg-primary-900/20' : ''}
              `}
            >
              <span
                className={`
                text-sm
                ${today ? 'font-bold text-primary-600 dark:text-primary-400' : ''}
              `}
              >
                {date.getDate()}
              </span>

              {/* Workout indicators */}
              {hasWorkout && (
                <div className="flex gap-0.5 mt-0.5">
                  {hasRegular && (
                    <div
                      className={`w-1.5 h-1.5 rounded-full bg-green-500 ${hasMultiple ? '' : ''}`}
                    />
                  )}
                  {hasAdHoc && <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />}
                  {hasMultiple && !hasAdHoc && dayWorkouts.length > 1 && (
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 px-4 py-2 border-t border-gray-200 dark:border-dark-border text-xs text-gray-500 dark:text-gray-400">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-green-500" />
          <span>Workout</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-blue-500" />
          <span>Ad Hoc</span>
        </div>
      </div>
    </div>
  );
}
