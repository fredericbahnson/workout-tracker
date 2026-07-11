/**
 * Today Page Live Data
 *
 * All the reactive IndexedDB queries the Today page needs: the active cycle,
 * its workouts (last completed, next pending, in-progress ad-hoc), cycle
 * progress, today's sets, exercises, and max records.
 */

import { useLiveQuery } from 'dexie-react-hooks';
import {
  CompletedSetRepo,
  ExerciseRepo,
  CycleRepo,
  ScheduledWorkoutRepo,
  MaxRecordRepo,
} from '@/data/repositories';

interface UseTodayLiveDataOptions {
  /** Workout dismissed via "Continue to Next Workout" - excluded from nextPendingWorkout */
  dismissedWorkoutId: string | null;
}

export function useTodayLiveData({ dismissedWorkoutId }: UseTodayLiveDataOptions) {
  const activeCycle = useLiveQuery(() => CycleRepo.getActive(), []);

  // All workouts for scheduled workout status (overdue/rest day detection)
  const allCycleWorkouts = useLiveQuery(async () => {
    if (!activeCycle) return undefined;
    return ScheduledWorkoutRepo.getByCycleId(activeCycle.id);
  }, [activeCycle?.id]);

  const lastCompletedWorkout = useLiveQuery(async () => {
    if (!activeCycle) return null;
    const workouts = await ScheduledWorkoutRepo.getByCycleId(activeCycle.id);
    const completed = workouts
      .filter(w => w.status === 'completed' && w.completedAt)
      .sort((a, b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime());
    return completed[0] || null;
  }, [activeCycle?.id]);

  const nextPendingWorkout = useLiveQuery(async () => {
    if (!activeCycle) return null;
    const workouts = await ScheduledWorkoutRepo.getByCycleId(activeCycle.id);
    const pending = workouts.find(
      w =>
        (w.status === 'pending' || w.status === 'partial') &&
        !w.isAdHoc &&
        w.id !== dismissedWorkoutId
    );
    return pending || null;
  }, [activeCycle?.id, dismissedWorkoutId]);

  const inProgressAdHocWorkout = useLiveQuery(async () => {
    if (!activeCycle) return null;
    return ScheduledWorkoutRepo.getInProgressAdHoc(activeCycle.id);
  }, [activeCycle?.id]);

  const cycleProgress = useLiveQuery(async () => {
    if (!activeCycle) return null;
    return ScheduledWorkoutRepo.getCycleProgress(activeCycle.id);
  }, [activeCycle?.id]);

  const todaysSets = useLiveQuery(() => CompletedSetRepo.getForToday(), []);
  const exercises = useLiveQuery(() => ExerciseRepo.getAll(), []);
  const maxRecords = useLiveQuery(() => MaxRecordRepo.getLatestForAllExercises(), []);

  return {
    activeCycle,
    allCycleWorkouts,
    lastCompletedWorkout,
    nextPendingWorkout,
    inProgressAdHocWorkout,
    cycleProgress,
    todaysSets,
    exercises,
    maxRecords,
  };
}
