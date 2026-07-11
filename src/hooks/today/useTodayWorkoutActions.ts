/**
 * Today Page Workout Actions
 *
 * The event handlers for logging, skipping, editing, and completing sets and
 * workouts on the Today page. Behavior-preserving extraction from Today.tsx.
 */

import { useCallback } from 'react';
import { CompletedSetRepo, ScheduledWorkoutRepo, MaxRecordRepo } from '@/data/repositories';
import type { SyncTableName } from '@/services/sync/types';
import type {
  CompletedSet,
  Exercise,
  ScheduledSet,
  ScheduledWorkout,
  UserPreferences,
} from '@/types';
import type { useTodayModals } from './useTodayModals';

interface UseTodayWorkoutActionsOptions {
  displayWorkout: ScheduledWorkout | null | undefined;
  isShowingCompletedWorkout: boolean;
  nextPendingWorkout: ScheduledWorkout | null | undefined;
  overdueWorkout: ScheduledWorkout | null;
  modals: ReturnType<typeof useTodayModals>;
  syncItem: (table: SyncTableName, item: unknown) => Promise<void>;
  deleteItem: (
    table: 'exercises' | 'max_records' | 'completed_sets' | 'cycles' | 'scheduled_workouts',
    id: string
  ) => Promise<boolean>;
  markWorkoutCompleted: (workoutId: string) => void;
  resetCompletionState: () => void;
  clearDismissedWorkout: () => void;
  setDismissedWorkoutId: (id: string | null) => void;
  setShowOverdueModal: (show: boolean) => void;
  preferences: UserPreferences;
  exerciseMap: Map<string, Exercise>;
  getTargetReps: (set: ScheduledSet, workout: ScheduledWorkout) => number;
  getTargetWeight: (set: ScheduledSet, workout: ScheduledWorkout) => number | undefined;
  /** Count of visible (non-hidden-warmup) scheduled sets for completion checks */
  visibleSetsCount: number;
  scheduledSetsCompletedCount: number;
  workoutCompletedSetsCount: number | undefined;
}

export function useTodayWorkoutActions({
  displayWorkout,
  isShowingCompletedWorkout,
  nextPendingWorkout,
  overdueWorkout,
  modals,
  syncItem,
  deleteItem,
  markWorkoutCompleted,
  resetCompletionState,
  clearDismissedWorkout,
  setDismissedWorkoutId,
  setShowOverdueModal,
  preferences,
  exerciseMap,
  getTargetReps,
  getTargetWeight,
  visibleSetsCount,
  scheduledSetsCompletedCount,
  workoutCompletedSetsCount,
}: UseTodayWorkoutActionsOptions) {
  /**
   * Recount completed scheduled sets from the DB (avoids race conditions with
   * React state) and update the workout status accordingly.
   * Returns the resulting status so callers can decide on rest timers.
   */
  const recountAndUpdateStatus = useCallback(
    async (workoutId: string): Promise<'completed' | 'partial' | 'none'> => {
      const actualCompletedCount = await CompletedSetRepo.countCompletedScheduledSets(workoutId);
      if (actualCompletedCount >= visibleSetsCount) {
        const updated = await ScheduledWorkoutRepo.updateStatus(workoutId, 'completed');
        if (updated) await syncItem('scheduled_workouts', updated);
        markWorkoutCompleted(workoutId);
        return 'completed';
      }
      if (actualCompletedCount > 0) {
        const updated = await ScheduledWorkoutRepo.updateStatus(workoutId, 'partial');
        if (updated) await syncItem('scheduled_workouts', updated);
        return 'partial';
      }
      return 'none';
    },
    [visibleSetsCount, syncItem, markWorkoutCompleted]
  );

  const handleSkipWorkout = useCallback(async () => {
    if (!nextPendingWorkout) return;
    const updated = await ScheduledWorkoutRepo.updateStatus(nextPendingWorkout.id, 'skipped');
    if (updated) await syncItem('scheduled_workouts', updated);
    modals.closeSkipWorkoutConfirm();
  }, [nextPendingWorkout, modals, syncItem]);

  const handleEndWorkout = useCallback(async () => {
    if (!displayWorkout || isShowingCompletedWorkout) return;
    const status = scheduledSetsCompletedCount > 0 ? 'partial' : 'skipped';
    const updated = await ScheduledWorkoutRepo.updateStatus(
      displayWorkout.id,
      status === 'partial' ? 'completed' : 'skipped'
    );
    if (updated) await syncItem('scheduled_workouts', updated);
    if (status === 'partial') markWorkoutCompleted(displayWorkout.id);
    modals.closeEndWorkoutConfirm();
  }, [
    displayWorkout,
    isShowingCompletedWorkout,
    scheduledSetsCompletedCount,
    markWorkoutCompleted,
    modals,
    syncItem,
  ]);

  const handleSelectScheduledSet = useCallback(
    (set: ScheduledSet) => {
      if (!displayWorkout || isShowingCompletedWorkout) return;
      const exercise = exerciseMap.get(set.exerciseId);
      if (exercise) {
        const targetReps = set.isMaxTest
          ? set.previousMaxReps || 0
          : getTargetReps(set, displayWorkout);
        const targetWeight = getTargetWeight(set, displayWorkout);
        modals.openScheduledSetModal({ set, workout: displayWorkout, targetReps, targetWeight });
      }
    },
    [displayWorkout, isShowingCompletedWorkout, exerciseMap, getTargetReps, getTargetWeight, modals]
  );

  const handleQuickComplete = useCallback(
    async (set: ScheduledSet) => {
      if (!displayWorkout || isShowingCompletedWorkout) return;
      if (set.isMaxTest) {
        handleSelectScheduledSet(set);
        return;
      }

      const targetReps = getTargetReps(set, displayWorkout);
      const completedSet = await CompletedSetRepo.createFromScheduled(
        set.id,
        displayWorkout.id,
        set.exerciseId,
        targetReps,
        targetReps,
        '',
        {}
      );
      await syncItem('completed_sets', completedSet);

      const status = await recountAndUpdateStatus(displayWorkout.id);
      if (status === 'partial' && preferences.restTimer.enabled) {
        const duration = set.isWarmup
          ? Math.round(preferences.restTimer.durationSeconds * 0.5)
          : preferences.restTimer.durationSeconds;
        modals.openRestTimer(duration);
      }
    },
    [
      displayWorkout,
      isShowingCompletedWorkout,
      getTargetReps,
      handleSelectScheduledSet,
      recountAndUpdateStatus,
      preferences.restTimer,
      modals,
      syncItem,
    ]
  );

  const handleInitiateSkipSet = useCallback(
    (set: ScheduledSet) => {
      if (!displayWorkout || isShowingCompletedWorkout) return;
      const targetReps = getTargetReps(set, displayWorkout);
      modals.openSkipSetConfirm({ set, workout: displayWorkout, targetReps });
    },
    [displayWorkout, isShowingCompletedWorkout, getTargetReps, modals]
  );

  const handleConfirmSkipSet = useCallback(async () => {
    if (!modals.setToSkip || !displayWorkout) return;

    const completedSet = await CompletedSetRepo.createFromScheduled(
      modals.setToSkip.set.id,
      displayWorkout.id,
      modals.setToSkip.set.exerciseId,
      modals.setToSkip.targetReps,
      0,
      'Skipped',
      {}
    );
    await syncItem('completed_sets', completedSet);

    await recountAndUpdateStatus(displayWorkout.id);
    modals.closeSkipSetConfirm();
  }, [modals, displayWorkout, recountAndUpdateStatus, syncItem]);

  const handleEditCompletedSet = useCallback(
    (completedSet: CompletedSet) => {
      const exercise = exerciseMap.get(completedSet.exerciseId);
      if (exercise) modals.openEditCompletedSet({ completedSet, exercise });
    },
    [exerciseMap, modals]
  );

  const handleSaveEditedSet = useCallback(
    async (reps: number, weight: number | undefined, notes: string) => {
      if (!modals.editingCompletedSet) return;
      const updated = await CompletedSetRepo.update(modals.editingCompletedSet.completedSet.id, {
        actualReps: reps,
        weight,
        notes,
      });
      if (updated) await syncItem('completed_sets', updated);
    },
    [modals.editingCompletedSet, syncItem]
  );

  const handleDeleteCompletedSet = useCallback(async () => {
    if (!modals.editingCompletedSet) return;
    const wasCompleted = displayWorkout?.status === 'completed';

    await CompletedSetRepo.delete(modals.editingCompletedSet.completedSet.id);
    await deleteItem('completed_sets', modals.editingCompletedSet.completedSet.id);

    if (displayWorkout) {
      const remainingCompleted = (workoutCompletedSetsCount || 1) - 1;
      if (remainingCompleted === 0) {
        const updated = await ScheduledWorkoutRepo.updateStatus(displayWorkout.id, 'pending');
        if (updated) await syncItem('scheduled_workouts', updated);
      } else if (wasCompleted) {
        const updated = await ScheduledWorkoutRepo.updateStatus(displayWorkout.id, 'partial');
        if (updated) await syncItem('scheduled_workouts', updated);
      }

      // Only tear down the completion view when this undo actually transitioned
      // the workout away from 'completed'. For already-partial/pending workouts
      // the user is mid-logging via nextPendingWorkout; clearing these flags
      // would un-dismiss a prior completion view and bounce the display back
      // to whatever lastCompletedWorkout currently points to.
      if (wasCompleted) {
        resetCompletionState();
        setDismissedWorkoutId(null);
        clearDismissedWorkout();
      }
    }
  }, [
    modals.editingCompletedSet,
    displayWorkout,
    workoutCompletedSetsCount,
    deleteItem,
    syncItem,
    resetCompletionState,
    setDismissedWorkoutId,
    clearDismissedWorkout,
  ]);

  const handleLogSet = useCallback(
    async (
      reps: number,
      notes: string,
      parameters: Record<string, string | number>,
      weight?: number
    ) => {
      modals.setIsLogging(true);
      let shouldShowTimer = false;
      let timerDuration = preferences.restTimer.durationSeconds;

      try {
        if (modals.selectedScheduledSet) {
          const { set, workout, targetReps } = modals.selectedScheduledSet;

          const completedSet = await CompletedSetRepo.createFromScheduled(
            set.id,
            workout.id,
            set.exerciseId,
            targetReps,
            reps,
            notes,
            parameters,
            weight
          );
          await syncItem('completed_sets', completedSet);

          if (set.isMaxTest && reps > 0) {
            const exercise = exerciseMap.get(set.exerciseId);
            const isTimeBased = exercise?.measurementType === 'time';
            const newMaxRecord = await MaxRecordRepo.create(
              set.exerciseId,
              isTimeBased ? undefined : reps,
              isTimeBased ? reps : undefined,
              'Max test result',
              weight
            );
            await syncItem('max_records', newMaxRecord);
          }

          if (displayWorkout) {
            const status = await recountAndUpdateStatus(displayWorkout.id);
            if (status === 'partial') {
              if (set.isMaxTest && preferences.maxTestRestTimer.enabled) {
                shouldShowTimer = true;
                timerDuration = preferences.maxTestRestTimer.durationSeconds;
              } else if (!set.isMaxTest && preferences.restTimer.enabled) {
                shouldShowTimer = true;
                timerDuration = set.isWarmup
                  ? Math.round(preferences.restTimer.durationSeconds * 0.5)
                  : preferences.restTimer.durationSeconds;
              }
            }
          }
          modals.closeScheduledSetModal();
        } else if (modals.selectedExercise) {
          const completedSet = await CompletedSetRepo.create(
            { exerciseId: modals.selectedExercise.id, reps, weight, notes, parameters },
            displayWorkout?.id
          );
          await syncItem('completed_sets', completedSet);
          modals.clearSelectedExercise();
          if (preferences.restTimer.enabled) {
            shouldShowTimer = true;
            timerDuration = preferences.restTimer.durationSeconds;
          }
        }
      } finally {
        modals.setIsLogging(false);
        if (shouldShowTimer) modals.openRestTimer(timerDuration);
      }
    },
    [
      modals,
      preferences.restTimer,
      preferences.maxTestRestTimer,
      exerciseMap,
      syncItem,
      displayWorkout,
      recountAndUpdateStatus,
    ]
  );

  const handleDoOverdueWorkout = useCallback(() => {
    // Close modal - the overdue workout will become the next pending workout
    setShowOverdueModal(false);
  }, [setShowOverdueModal]);

  const handleSkipOverdueWorkout = useCallback(
    async (reason?: string) => {
      if (!overdueWorkout) return;
      const updated = await ScheduledWorkoutRepo.updateSkipReason(overdueWorkout.id, reason);
      if (updated) await syncItem('scheduled_workouts', updated);
      setShowOverdueModal(false);
    },
    [overdueWorkout, syncItem, setShowOverdueModal]
  );

  return {
    handleSkipWorkout,
    handleEndWorkout,
    handleSelectScheduledSet,
    handleQuickComplete,
    handleInitiateSkipSet,
    handleConfirmSkipSet,
    handleEditCompletedSet,
    handleSaveEditedSet,
    handleDeleteCompletedSet,
    handleLogSet,
    handleDoOverdueWorkout,
    handleSkipOverdueWorkout,
  };
}
