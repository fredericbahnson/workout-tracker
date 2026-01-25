import { useMemo } from 'react';
import type { Cycle, ScheduledWorkout } from '@/types';

interface UseScheduledWorkoutStatusParams {
  /** Active training cycle */
  cycle: Cycle | null | undefined;
  /** All workouts for the cycle, sorted by sequence number */
  workouts: ScheduledWorkout[] | undefined;
}

interface ScheduledWorkoutStatus {
  /** Whether the cycle uses date-based scheduling */
  isDateBased: boolean;
  /** Workout scheduled for today (if any) */
  todaysWorkout: ScheduledWorkout | null;
  /** Pending workouts with scheduledDate before today, oldest first */
  overdueWorkouts: ScheduledWorkout[];
  /** True if today has no workout and no overdue workouts */
  isRestDay: boolean;
  /** The next scheduled workout (for rest day display) */
  nextScheduledWorkout: ScheduledWorkout | null;
}

/**
 * Determines the date-based scheduling status for a cycle.
 * Only active when cycle.schedulingMode === 'date'.
 *
 * Used to show overdue banners, rest day cards, and schedule awareness.
 */
export function useScheduledWorkoutStatus({
  cycle,
  workouts,
}: UseScheduledWorkoutStatusParams): ScheduledWorkoutStatus {
  return useMemo(() => {
    const isDateBased = cycle?.schedulingMode === 'date';

    // Default values for non-date-based cycles
    if (!isDateBased || !workouts) {
      return {
        isDateBased: false,
        todaysWorkout: null,
        overdueWorkouts: [],
        isRestDay: false,
        nextScheduledWorkout: null,
      };
    }

    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

    // Find today's workout
    const todaysWorkout =
      workouts.find(w => {
        if (!w.scheduledDate || w.status === 'completed' || w.status === 'skipped') return false;
        const schedDate = new Date(w.scheduledDate);
        return schedDate >= todayStart && schedDate < todayEnd;
      }) || null;

    // Find overdue workouts (scheduled before today, still pending)
    const overdueWorkouts = workouts
      .filter(w => {
        if (!w.scheduledDate || w.status !== 'pending') return false;
        const schedDate = new Date(w.scheduledDate);
        const schedDateStart = new Date(
          schedDate.getFullYear(),
          schedDate.getMonth(),
          schedDate.getDate()
        );
        return schedDateStart.getTime() < todayStart.getTime();
      })
      .sort((a, b) => {
        // Sort by scheduled date ascending (oldest first)
        const dateA = new Date(a.scheduledDate!).getTime();
        const dateB = new Date(b.scheduledDate!).getTime();
        return dateA - dateB;
      });

    // Find next scheduled workout (for rest day display)
    const nextScheduledWorkout =
      workouts.find(w => {
        if (!w.scheduledDate || w.status === 'completed' || w.status === 'skipped') return false;
        const schedDate = new Date(w.scheduledDate);
        return schedDate >= todayEnd;
      }) || null;

    // Rest day = no today's workout and no overdue workouts
    const isRestDay = !todaysWorkout && overdueWorkouts.length === 0;

    return {
      isDateBased,
      todaysWorkout,
      overdueWorkouts,
      isRestDay,
      nextScheduledWorkout,
    };
  }, [cycle?.schedulingMode, workouts]);
}
