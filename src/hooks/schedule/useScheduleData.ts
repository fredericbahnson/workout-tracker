/**
 * useScheduleData Hook
 * 
 * Manages data fetching and computed values for the Schedule page.
 * Extracts live queries and helper functions from Schedule.tsx.
 */

import { useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { CycleRepo, ScheduledWorkoutRepo, ExerciseRepo, MaxRecordRepo } from '@/data/repositories';
import { calculateTargetReps } from '@/services/scheduler';
import { useAppStore } from '@/stores/appStore';
import type { Exercise, ScheduledWorkout, ScheduledSet } from '@/types';

export function useScheduleData() {
  const { defaults } = useAppStore();

  // Live queries
  const activeCycle = useLiveQuery(() => CycleRepo.getActive(), []);
  
  const allWorkouts = useLiveQuery(async () => {
    if (!activeCycle) return [];
    return ScheduledWorkoutRepo.getByCycleId(activeCycle.id);
  }, [activeCycle?.id]);

  // All-time completed workouts for calendar view
  const allCompletedWorkouts = useLiveQuery(() => 
    ScheduledWorkoutRepo.getAllCompleted()
  , []);

  // All cycles for looking up group names from past cycles
  const allCycles = useLiveQuery(() => CycleRepo.getAll(), []);

  const exercises = useLiveQuery(() => ExerciseRepo.getAll(), []);
  const maxRecords = useLiveQuery(() => MaxRecordRepo.getLatestForAllExercises(), []);

  // Exercise map for quick lookups
  const exerciseMap = useMemo(() => {
    const map = new Map<string, Exercise>();
    exercises?.forEach(ex => map.set(ex.id, ex));
    return map;
  }, [exercises]);

  // Workout categorization
  const workoutCategories = useMemo(() => {
    const pending = allWorkouts?.filter(w => w.status === 'pending' || w.status === 'partial') || [];
    const done = allWorkouts?.filter(w => w.status === 'completed') || [];
    const skipped = allWorkouts?.filter(w => w.status === 'skipped') || [];
    const passed = allWorkouts?.filter(w => w.status === 'completed' || w.status === 'skipped') || [];
    
    return { pending, done, skipped, passed };
  }, [allWorkouts]);

  // Helper to get group name from any cycle
  const getGroupName = (workout: ScheduledWorkout): string | undefined => {
    if (workout.isAdHoc) return undefined;
    // Try active cycle first
    const activeGroup = activeCycle?.groups.find(g => g.id === workout.groupId);
    if (activeGroup) return activeGroup.name;
    // Search all cycles
    for (const cycle of allCycles || []) {
      const group = cycle.groups.find(g => g.id === workout.groupId);
      if (group) return group.name;
    }
    return undefined;
  };

  // Get sets summary by type for a workout
  const getSetsSummary = (workout: ScheduledWorkout): Record<string, number> => {
    const summary: Record<string, number> = {};
    workout.scheduledSets.forEach(set => {
      summary[set.exerciseType] = (summary[set.exerciseType] || 0) + 1;
    });
    return summary;
  };

  // Get target reps/time for a set
  const getTargetReps = (set: ScheduledSet, workout: ScheduledWorkout): number => {
    if (!activeCycle) return 0;
    const maxRecord = maxRecords?.get(set.exerciseId);
    return calculateTargetReps(
      set, 
      workout, 
      maxRecord, 
      activeCycle.conditioningWeeklyRepIncrement,
      activeCycle.conditioningWeeklyTimeIncrement || 5,
      defaults.defaultMaxReps
    );
  };

  // Get status icon config
  const getStatusConfig = (status: ScheduledWorkout['status']) => {
    switch (status) {
      case 'completed':
        return { color: 'text-green-500', bgColor: 'bg-green-500' };
      case 'partial':
        return { color: 'text-yellow-500', bgColor: 'bg-yellow-500' };
      case 'skipped':
        return { color: 'text-gray-400', bgColor: 'bg-gray-400' };
      default:
        return { color: 'text-gray-300 dark:text-gray-600', bgColor: 'bg-gray-300' };
    }
  };

  return {
    // Raw data
    activeCycle,
    allWorkouts: allWorkouts || [],
    allCompletedWorkouts: allCompletedWorkouts || [],
    allCycles: allCycles || [],
    exercises: exercises || [],
    maxRecords,
    exerciseMap,

    // Categorized workouts
    pendingWorkouts: workoutCategories.pending,
    doneWorkouts: workoutCategories.done,
    skippedWorkouts: workoutCategories.skipped,
    passedWorkouts: workoutCategories.passed,

    // Helper functions
    getGroupName,
    getSetsSummary,
    getTargetReps,
    getStatusConfig,

    // Loading state
    isLoading: activeCycle === undefined,
  };
}
