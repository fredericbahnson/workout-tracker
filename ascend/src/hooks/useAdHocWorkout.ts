import { useState, useCallback } from 'react';
import { CompletedSetRepo, ScheduledWorkoutRepo } from '@/data/repositories';
import { createScopedLogger } from '@/utils/logger';
import type { ScheduledWorkout, Cycle } from '@/types';

const log = createScopedLogger('AdHocWorkout');

type SyncTable = 'exercises' | 'max_records' | 'completed_sets' | 'cycles' | 'scheduled_workouts';

interface UseAdHocWorkoutParams {
  /** The active cycle */
  activeCycle: Cycle | null | undefined;
  /** Current cycle progress (for week number calculation) */
  cycleProgressPassed: number;
  /** The currently displayed workout */
  displayWorkout: ScheduledWorkout | null | undefined;
  /** Sync item function */
  syncItem: (table: SyncTable, item: unknown) => Promise<void>;
  /** Delete item function */
  deleteItem: (table: SyncTable, id: string) => Promise<void>;
  /** Mark workout as completed (shows completion view) */
  markWorkoutCompleted: (workoutId: string) => void;
  /** Dismiss completion view (when starting ad-hoc) */
  dismissCompletionView: () => void;
  /** Reset completion state (when canceling ad-hoc) */
  resetCompletionState: () => void;
}

interface UseAdHocWorkoutResult {
  /** Whether the rename modal is open */
  showRenameModal: boolean;
  /** Whether the cancel confirmation modal is open */
  showCancelAdHocConfirm: boolean;
  /** Whether cancellation is in progress */
  isCancellingAdHoc: boolean;
  /** Open the rename modal */
  openRenameModal: () => void;
  /** Close the rename modal */
  closeRenameModal: () => void;
  /** Open the cancel confirmation modal */
  openCancelConfirm: () => void;
  /** Close the cancel confirmation modal */
  closeCancelConfirm: () => void;
  /** Handler: Start a new ad-hoc workout */
  handleStartAdHocWorkout: () => Promise<void>;
  /** Handler: Complete the current ad-hoc workout */
  handleCompleteAdHocWorkout: () => Promise<void>;
  /** Handler: Rename the current ad-hoc workout */
  handleRenameAdHocWorkout: (name: string) => Promise<void>;
  /** Handler: Cancel/delete the current ad-hoc workout */
  handleCancelAdHocWorkout: () => Promise<void>;
}

/**
 * Manages ad-hoc workout creation, completion, renaming, and cancellation.
 */
export function useAdHocWorkout({
  activeCycle,
  cycleProgressPassed,
  displayWorkout,
  syncItem,
  deleteItem,
  markWorkoutCompleted,
  dismissCompletionView,
  resetCompletionState,
}: UseAdHocWorkoutParams): UseAdHocWorkoutResult {
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [showCancelAdHocConfirm, setShowCancelAdHocConfirm] = useState(false);
  const [isCancellingAdHoc, setIsCancellingAdHoc] = useState(false);

  const openRenameModal = useCallback(() => setShowRenameModal(true), []);
  const closeRenameModal = useCallback(() => setShowRenameModal(false), []);
  const openCancelConfirm = useCallback(() => setShowCancelAdHocConfirm(true), []);
  const closeCancelConfirm = useCallback(() => setShowCancelAdHocConfirm(false), []);

  // Start a new ad-hoc workout
  const handleStartAdHocWorkout = useCallback(async () => {
    if (!activeCycle) return;
    
    // Count existing ad-hoc workouts in this cycle
    const adHocCount = await ScheduledWorkoutRepo.countAdHocWorkouts(activeCycle.id);
    const workoutName = `Ad Hoc Workout ${adHocCount + 1}`;
    
    // Get the max sequence number to place this workout in order
    const allWorkouts = await ScheduledWorkoutRepo.getByCycleId(activeCycle.id);
    const maxSequence = Math.max(...allWorkouts.map(w => w.sequenceNumber), 0);
    
    // Create ad-hoc workout
    const adHocWorkout = await ScheduledWorkoutRepo.create({
      cycleId: activeCycle.id,
      sequenceNumber: maxSequence + 0.5, // Place between existing workouts
      weekNumber: Math.ceil(cycleProgressPassed / activeCycle.workoutDaysPerWeek) || 1,
      dayInWeek: 1,
      groupId: 'ad-hoc',
      rfem: 0,
      scheduledSets: [],
      status: 'partial',
      isAdHoc: true,
      customName: workoutName
    });
    
    // Sync the new workout
    await syncItem('scheduled_workouts', adHocWorkout);
    
    // Reset completion view state so we show the ad-hoc workout
    dismissCompletionView();
  }, [activeCycle, cycleProgressPassed, syncItem, dismissCompletionView]);

  // Complete the current ad-hoc workout
  const handleCompleteAdHocWorkout = useCallback(async () => {
    if (!displayWorkout?.isAdHoc) return;
    
    await ScheduledWorkoutRepo.updateStatus(displayWorkout.id, 'completed');
    
    // Show completion celebration
    markWorkoutCompleted(displayWorkout.id);
  }, [displayWorkout, markWorkoutCompleted]);

  // Rename the current ad-hoc workout
  const handleRenameAdHocWorkout = useCallback(async (name: string) => {
    if (!displayWorkout?.isAdHoc || !name.trim()) return;
    
    await ScheduledWorkoutRepo.updateName(displayWorkout.id, name.trim());
  }, [displayWorkout]);

  // Cancel/delete the current ad-hoc workout
  const handleCancelAdHocWorkout = useCallback(async () => {
    if (!displayWorkout?.isAdHoc) return;
    
    setIsCancellingAdHoc(true);
    try {
      // Delete all completed sets associated with this workout
      const deletedSetIds = await CompletedSetRepo.deleteByScheduledWorkoutId(displayWorkout.id);
      
      // Sync deletions for completed sets
      for (const setId of deletedSetIds) {
        await deleteItem('completed_sets', setId);
      }
      
      // Delete the ad-hoc workout
      await ScheduledWorkoutRepo.delete(displayWorkout.id);
      await deleteItem('scheduled_workouts', displayWorkout.id);
      
      // Reset state to show previous workout state
      setShowCancelAdHocConfirm(false);
      resetCompletionState();
    } catch (error) {
      log.error(error as Error);
    } finally {
      setIsCancellingAdHoc(false);
    }
  }, [displayWorkout, deleteItem, resetCompletionState]);

  return {
    showRenameModal,
    showCancelAdHocConfirm,
    isCancellingAdHoc,
    openRenameModal,
    closeRenameModal,
    openCancelConfirm,
    closeCancelConfirm,
    handleStartAdHocWorkout,
    handleCompleteAdHocWorkout,
    handleRenameAdHocWorkout,
    handleCancelAdHocWorkout,
  };
}
