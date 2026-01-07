import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { Plus, Dumbbell } from 'lucide-react';
import { CompletedSetRepo, ExerciseRepo, CycleRepo, ScheduledWorkoutRepo, MaxRecordRepo } from '../data/repositories';
import { calculateTargetReps } from '../services/scheduler';
import { useAppStore } from '../stores/appStore';
import { useSyncItem } from '../contexts/SyncContext';
import { isToday } from '../utils';
import { PageHeader } from '../components/layout';
import { Button, Modal, EmptyState, Card } from '../components/ui';
import { QuickLogForm, RestTimer } from '../components/workouts';
import { WorkoutCompletionBanner, ScheduledSetsList, WorkoutHeader, AdHocWorkoutControls, EditCompletedSetModal, ScheduledSetModal, TodayStats, AdHocCompletedSetsList, WorkoutActionButtons, CycleProgressHeader, SkipWorkoutConfirmModal, EndWorkoutConfirmModal, SkipSetConfirmModal, CancelAdHocConfirmModal, ExercisePickerModal, RenameWorkoutModal } from '../components/workouts/today';
import { CycleWizard, MaxTestingWizard, CycleCompletionModal, CycleTypeSelector } from '../components/cycles';
import { EXERCISE_TYPES, type Exercise, type ScheduledWorkout, type ScheduledSet, type CompletedSet, type Cycle } from '../types';

// localStorage key for persisting dismissed workout ID across navigation
const DISMISSED_WORKOUT_KEY = 'ascend_dismissed_workout_id';

function getDismissedWorkoutId(): string | null {
  try {
    return localStorage.getItem(DISMISSED_WORKOUT_KEY);
  } catch {
    return null;
  }
}

function setDismissedWorkoutId(workoutId: string | null): void {
  try {
    if (workoutId) {
      localStorage.setItem(DISMISSED_WORKOUT_KEY, workoutId);
    } else {
      localStorage.removeItem(DISMISSED_WORKOUT_KEY);
    }
  } catch {
    // Ignore localStorage errors
  }
}

export function TodayPage() {
  const navigate = useNavigate();
  const { defaults, restTimer, maxTestRestTimer } = useAppStore();
  const { syncItem, deleteItem } = useSyncItem();
  const [showExercisePicker, setShowExercisePicker] = useState(false);
  const [showCycleWizard, setShowCycleWizard] = useState(false);
  const [showCycleTypeSelector, setShowCycleTypeSelector] = useState(false);
  const [showSkipConfirm, setShowSkipConfirm] = useState(false);
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [showRestTimer, setShowRestTimer] = useState(false);
  const [restTimerDuration, setRestTimerDuration] = useState(restTimer.defaultDurationSeconds);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [selectedScheduledSet, setSelectedScheduledSet] = useState<{
    set: ScheduledSet;
    workout: ScheduledWorkout;
    targetReps: number;
  } | null>(null);
  const [isLogging, setIsLogging] = useState(false);
  
  // Cycle completion state
  const [showCycleCompletionModal, setShowCycleCompletionModal] = useState(false);
  const [showMaxTestingWizard, setShowMaxTestingWizard] = useState(false);
  const [showStandaloneMaxTesting, setShowStandaloneMaxTesting] = useState(false);
  const [completedCycleForModal, setCompletedCycleForModal] = useState<Cycle | null>(null);
  
  // Skip individual set confirmation
  const [setToSkip, setSetToSkip] = useState<{
    set: ScheduledSet;
    workout: ScheduledWorkout;
    targetReps: number;
  } | null>(null);
  
  // Edit completed set
  const [editingCompletedSet, setEditingCompletedSet] = useState<{
    completedSet: CompletedSet;
    exercise: Exercise;
  } | null>(null);
  
  // Track just-completed workout in this session
  const [justCompletedWorkoutId, setJustCompletedWorkoutId] = useState<string | null>(null);
  const [showCompletionView, setShowCompletionView] = useState(false);
  const [completionDismissed, setCompletionDismissed] = useState(false);
  
  // Ad-hoc workout state
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [showCancelAdHocConfirm, setShowCancelAdHocConfirm] = useState(false);
  const [isCancellingAdHoc, setIsCancellingAdHoc] = useState(false);

  // Live queries
  const activeCycle = useLiveQuery(() => CycleRepo.getActive(), []);
  
  // Get the most recently completed workout (for showing completion view)
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
    return ScheduledWorkoutRepo.getNextPending(activeCycle.id);
  }, [activeCycle?.id]);

  // Get any in-progress ad-hoc workout
  const inProgressAdHocWorkout = useLiveQuery(async () => {
    if (!activeCycle) return null;
    return ScheduledWorkoutRepo.getInProgressAdHoc(activeCycle.id);
  }, [activeCycle?.id]);

  // Determine which workout to display
  // Show completion view if:
  // 1. User just completed a workout this session (showCompletionView is true), OR
  // 2. Most recent completed workout was today and user hasn't dismissed it
  const shouldShowCompletedWorkout = (): boolean => {
    // If there's an in-progress ad-hoc workout, don't show completed view
    if (inProgressAdHocWorkout) return false;
    
    // If user dismissed the completion view (in this session), don't show it
    if (completionDismissed) return false;
    
    // If user just completed a workout this session
    if (showCompletionView && justCompletedWorkoutId) return true;
    
    // If workout was completed today (on app reopen), check if it was dismissed
    if (lastCompletedWorkout?.completedAt && isToday(new Date(lastCompletedWorkout.completedAt))) {
      // Check if this specific workout was already dismissed (persisted across navigation)
      const dismissedId = getDismissedWorkoutId();
      if (dismissedId === lastCompletedWorkout.id) {
        return false;
      }
      return true;
    }
    
    return false;
  };

  // The workout to display in the UI
  // Priority: in-progress ad-hoc > completed view > next pending
  const displayWorkout = inProgressAdHocWorkout 
    ? inProgressAdHocWorkout 
    : shouldShowCompletedWorkout() 
      ? lastCompletedWorkout 
      : nextPendingWorkout;
  const isShowingCompletedWorkout = !inProgressAdHocWorkout && shouldShowCompletedWorkout();
  const isShowingAdHocWorkout = displayWorkout?.isAdHoc === true;

  const cycleProgress = useLiveQuery(async () => {
    if (!activeCycle) return null;
    return ScheduledWorkoutRepo.getCycleProgress(activeCycle.id);
  }, [activeCycle?.id]);

  // Detect when entire cycle is complete (all workouts done)
  const isCycleComplete = cycleProgress && cycleProgress.completed === cycleProgress.total && cycleProgress.total > 0;
  
  // Show cycle completion modal when cycle finishes
  useEffect(() => {
    if (isCycleComplete && activeCycle && !showCycleCompletionModal && !showMaxTestingWizard && !showCycleWizard) {
      setCompletedCycleForModal(activeCycle);
      setShowCycleCompletionModal(true);
    }
  }, [isCycleComplete, activeCycle?.id]);

  const todaysSets = useLiveQuery(() => CompletedSetRepo.getForToday(), []);
  const exercises = useLiveQuery(() => ExerciseRepo.getAll(), []);
  const maxRecords = useLiveQuery(() => MaxRecordRepo.getLatestForAllExercises(), []);
  
  // Get completed sets for the displayed workout
  const workoutCompletedSets = useLiveQuery(async () => {
    if (!displayWorkout) return [];
    return CompletedSetRepo.getForScheduledWorkout(displayWorkout.id);
  }, [displayWorkout?.id]);

  // Maps
  const exerciseMap = new Map<string, Exercise>();
  exercises?.forEach(ex => exerciseMap.set(ex.id, ex));

  // Calculate which scheduled sets are completed (for current workout)
  const completedScheduledSetIds = new Set(
    workoutCompletedSets?.map(s => s.scheduledSetId) || []
  );

  const scheduledSetsRemaining = displayWorkout?.scheduledSets.filter(
    s => !completedScheduledSetIds.has(s.id)
  ) || [];
  
  const scheduledSetsCompleted = displayWorkout?.scheduledSets.filter(
    s => completedScheduledSetIds.has(s.id)
  ) || [];

  // Helper to get target reps/time for a set
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

  // Helper to group sets by exercise type, sorted alphabetically within each type
  const groupSetsByType = (sets: ScheduledSet[]) => {
    return EXERCISE_TYPES.map(type => ({
      type,
      sets: sets
        .filter(set => set.exerciseType === type)
        .sort((a, b) => {
          const exA = exerciseMap.get(a.exerciseId);
          const exB = exerciseMap.get(b.exerciseId);
          return (exA?.name || '').localeCompare(exB?.name || '');
        })
    })).filter(group => group.sets.length > 0);
  };

  // Grouped sets for display
  const groupedSetsRemaining = groupSetsByType(scheduledSetsRemaining);
  const groupedSetsCompleted = groupSetsByType(scheduledSetsCompleted);

  // Ad-hoc completed sets (logged via "+ Log" button, not from scheduled sets)
  const adHocCompletedSets = workoutCompletedSets?.filter(s => s.scheduledSetId === null) || [];
  
  // Group ad-hoc sets by exercise type
  const groupedAdHocSets = EXERCISE_TYPES.map(type => ({
    type,
    sets: adHocCompletedSets
      .filter(set => {
        const exercise = exerciseMap.get(set.exerciseId);
        return exercise?.type === type;
      })
      .sort((a, b) => {
        const exA = exerciseMap.get(a.exerciseId);
        const exB = exerciseMap.get(b.exerciseId);
        return (exA?.name || '').localeCompare(exB?.name || '');
      })
  })).filter(group => group.sets.length > 0);

  // Handler to proceed to next workout after viewing completion
  const handleProceedToNextWorkout = () => {
    // Save the dismissed workout ID to localStorage so it persists across navigation
    const workoutIdToDismiss = justCompletedWorkoutId || lastCompletedWorkout?.id;
    if (workoutIdToDismiss) {
      setDismissedWorkoutId(workoutIdToDismiss);
    }
    setShowCompletionView(false);
    setJustCompletedWorkoutId(null);
    setCompletionDismissed(true);
  };

  // Handlers for cycle completion modal
  const handleStartMaxTesting = async () => {
    if (completedCycleForModal) {
      // Mark the cycle as completed
      await CycleRepo.update(completedCycleForModal.id, { status: 'completed' });
      setShowCycleCompletionModal(false);
      setShowMaxTestingWizard(true);
    }
  };

  const handleCreateNewCycleFromCompletion = async () => {
    if (completedCycleForModal) {
      // Mark the cycle as completed
      await CycleRepo.update(completedCycleForModal.id, { status: 'completed' });
    }
    setShowCycleCompletionModal(false);
    setCompletedCycleForModal(null);
    setShowCycleWizard(true);
  };

  const handleDismissCycleCompletion = async () => {
    if (completedCycleForModal) {
      // Mark the cycle as completed even if dismissed
      await CycleRepo.update(completedCycleForModal.id, { status: 'completed' });
    }
    setShowCycleCompletionModal(false);
    setCompletedCycleForModal(null);
  };

  const handleMaxTestingComplete = () => {
    setShowMaxTestingWizard(false);
    setCompletedCycleForModal(null);
    // The max testing cycle is now active, user will see it
  };

  // Handlers
  const handleSkipWorkout = async () => {
    if (!nextPendingWorkout) return;
    await ScheduledWorkoutRepo.updateStatus(nextPendingWorkout.id, 'skipped');
    setShowSkipConfirm(false);
  };

  const handleEndWorkout = async () => {
    if (!displayWorkout || isShowingCompletedWorkout) return;
    const status = scheduledSetsCompleted.length > 0 ? 'partial' : 'skipped';
    await ScheduledWorkoutRepo.updateStatus(displayWorkout.id, status === 'partial' ? 'completed' : 'skipped');
    if (status === 'partial') {
      // Show completion view
      setJustCompletedWorkoutId(displayWorkout.id);
      setShowCompletionView(true);
      setCompletionDismissed(false);
      setDismissedWorkoutId(null); // Clear any previously dismissed workout
    }
    setShowEndConfirm(false);
  };

  const handleSelectExercise = (exercise: Exercise) => {
    setSelectedExercise(exercise);
    setShowExercisePicker(false);
  };

  const handleSelectScheduledSet = (set: ScheduledSet) => {
    if (!displayWorkout || isShowingCompletedWorkout) return;
    const exercise = exerciseMap.get(set.exerciseId);
    if (exercise) {
      // For max test sets, default to previous max instead of calculated target (which is 0)
      const targetReps = set.isMaxTest 
        ? (set.previousMaxReps || 0)
        : getTargetReps(set, displayWorkout);
      setSelectedScheduledSet({ set, workout: displayWorkout, targetReps });
      // Timer/stopwatch mode is now automatically selected by ScheduledSetModal
    }
  };

  // Quick complete a set (swipe right) - uses target reps as actual
  // For max test sets, opens the detailed form instead
  const handleQuickComplete = async (set: ScheduledSet) => {
    if (!displayWorkout || isShowingCompletedWorkout) return;
    
    // Max test sets require user input for the actual max
    if (set.isMaxTest) {
      handleSelectScheduledSet(set);
      return;
    }
    
    const targetReps = getTargetReps(set, displayWorkout);
    
    await CompletedSetRepo.createFromScheduled(
      set.id,
      displayWorkout.id,
      set.exerciseId,
      targetReps,
      targetReps, // actual = target for quick complete
      '',
      {}
    );
    
    const newCompletedCount = completedScheduledSetIds.size + 1;
    const totalSets = displayWorkout.scheduledSets.length;
    
    if (newCompletedCount >= totalSets) {
      await ScheduledWorkoutRepo.updateStatus(displayWorkout.id, 'completed');
      setJustCompletedWorkoutId(displayWorkout.id);
      setShowCompletionView(true);
      setCompletionDismissed(false);
      setDismissedWorkoutId(null); // Clear any previously dismissed workout
    } else {
      await ScheduledWorkoutRepo.updateStatus(displayWorkout.id, 'partial');
      // Show rest timer if enabled (regular sets only here, max test redirects above)
      if (restTimer.enabled) {
        setRestTimerDuration(restTimer.defaultDurationSeconds);
        setShowRestTimer(true);
      }
    }
  };

  // Initiate skip set (swipe left) - shows confirmation
  const handleInitiateSkipSet = (set: ScheduledSet) => {
    if (!displayWorkout || isShowingCompletedWorkout) return;
    const exercise = exerciseMap.get(set.exerciseId);
    if (exercise) {
      const targetReps = getTargetReps(set, displayWorkout);
      setSetToSkip({ set, workout: displayWorkout, targetReps });
    }
  };

  // Confirm skip set - creates a completed set with 0 reps and a skip note
  const handleConfirmSkipSet = async () => {
    if (!setToSkip || !displayWorkout) return;
    
    await CompletedSetRepo.createFromScheduled(
      setToSkip.set.id,
      displayWorkout.id,
      setToSkip.set.exerciseId,
      setToSkip.targetReps,
      0, // 0 reps for skipped
      'Skipped',
      {}
    );
    
    const newCompletedCount = completedScheduledSetIds.size + 1;
    const totalSets = displayWorkout.scheduledSets.length;
    
    if (newCompletedCount >= totalSets) {
      await ScheduledWorkoutRepo.updateStatus(displayWorkout.id, 'completed');
      setJustCompletedWorkoutId(displayWorkout.id);
      setShowCompletionView(true);
      setCompletionDismissed(false);
      setDismissedWorkoutId(null); // Clear any previously dismissed workout
    } else if (newCompletedCount > 0) {
      await ScheduledWorkoutRepo.updateStatus(displayWorkout.id, 'partial');
    }
    
    setSetToSkip(null);
  };

  // Open edit modal for a completed set
  const handleEditCompletedSet = (completedSet: CompletedSet) => {
    const exercise = exerciseMap.get(completedSet.exerciseId);
    if (exercise) {
      setEditingCompletedSet({ completedSet, exercise });
      // Form state is now managed inside EditCompletedSetModal
    }
  };

  // Save edited completed set
  const handleSaveEditedSet = async (reps: number, weight: number | undefined, notes: string) => {
    if (!editingCompletedSet) return;
    
    await CompletedSetRepo.update(editingCompletedSet.completedSet.id, {
      actualReps: reps,
      weight: weight,
      notes: notes
    });
  };

  // Delete a completed set (to redo it)
  const handleDeleteCompletedSet = async () => {
    if (!editingCompletedSet) return;
    
    await CompletedSetRepo.delete(editingCompletedSet.completedSet.id);
    
    // Check if we need to update workout status back to partial/pending
    if (displayWorkout) {
      const remainingCompleted = (workoutCompletedSets?.length || 1) - 1;
      if (remainingCompleted === 0) {
        await ScheduledWorkoutRepo.updateStatus(displayWorkout.id, 'pending');
      } else if (displayWorkout.status === 'completed') {
        await ScheduledWorkoutRepo.updateStatus(displayWorkout.id, 'partial');
      }
    }
  };

  const handleLogSet = async (
    reps: number, 
    notes: string, 
    parameters: Record<string, string | number>,
    weight?: number
  ) => {
    setIsLogging(true);
    let shouldShowTimer = false;
    
    try {
      if (selectedScheduledSet) {
        const { set, workout, targetReps } = selectedScheduledSet;
        
        await CompletedSetRepo.createFromScheduled(
          set.id,
          workout.id,
          set.exerciseId,
          targetReps,
          reps,
          notes,
          parameters,
          weight
        );
        
        // If this is a max test set, record a new max
        if (set.isMaxTest && reps > 0) {
          const exercise = exerciseMap.get(set.exerciseId);
          const isTimeBased = exercise?.measurementType === 'time';
          const newMaxRecord = await MaxRecordRepo.create(
            set.exerciseId,
            isTimeBased ? undefined : reps,  // maxReps
            isTimeBased ? reps : undefined,  // maxTime (reps field is used for time in seconds)
            'Max test result',
            weight
          );
          // Sync the new max record
          await syncItem('max_records', newMaxRecord);
        }
        
        const newCompletedCount = completedScheduledSetIds.size + 1;
        const totalSets = displayWorkout?.scheduledSets.length || 0;
        
        if (newCompletedCount >= totalSets && displayWorkout) {
          await ScheduledWorkoutRepo.updateStatus(displayWorkout.id, 'completed');
          // Show completion celebration
          setJustCompletedWorkoutId(displayWorkout.id);
          setShowCompletionView(true);
          setCompletionDismissed(false); // Reset so completion view shows
          setDismissedWorkoutId(null); // Clear any previously dismissed workout
          // Don't show timer when workout is complete
        } else if (newCompletedCount > 0 && displayWorkout) {
          await ScheduledWorkoutRepo.updateStatus(displayWorkout.id, 'partial');
          // Show rest timer if enabled and there are more sets
          // Use max test rest timer for max test sets, regular rest timer otherwise
          if (set.isMaxTest && maxTestRestTimer.enabled) {
            shouldShowTimer = true;
            setRestTimerDuration(maxTestRestTimer.defaultDurationSeconds);
          } else if (!set.isMaxTest && restTimer.enabled) {
            shouldShowTimer = true;
            setRestTimerDuration(restTimer.defaultDurationSeconds);
          }
        }
        
        setSelectedScheduledSet(null);
        // Timer/stopwatch mode is now managed inside ScheduledSetModal
      } else if (selectedExercise) {
        // Pass the current workout ID if one is active, so the set shows in workout history
        await CompletedSetRepo.create({
          exerciseId: selectedExercise.id,
          reps,
          weight,
          notes,
          parameters
        }, displayWorkout?.id);
        setSelectedExercise(null);
        // Show rest timer for ad-hoc sets too if enabled
        if (restTimer.enabled) {
          shouldShowTimer = true;
          setRestTimerDuration(restTimer.defaultDurationSeconds);
        }
      }
    } finally {
      setIsLogging(false);
      // Show rest timer after state updates
      if (shouldShowTimer) {
        setShowRestTimer(true);
      }
    }
  };

  const handleCycleCreated = () => {
    setShowCycleWizard(false);
  };

  // Ad-hoc workout handlers
  const handleStartAdHocWorkout = async () => {
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
      sequenceNumber: maxSequence + 0.5, // Place between existing workouts (will sort after completed ones)
      weekNumber: Math.ceil((cycleProgress?.passed || 0) / activeCycle.workoutDaysPerWeek) || 1,
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
    setCompletionDismissed(true);
    setShowCompletionView(false);
  };

  const handleCompleteAdHocWorkout = async () => {
    if (!displayWorkout?.isAdHoc) return;
    
    await ScheduledWorkoutRepo.updateStatus(displayWorkout.id, 'completed');
    
    // Show completion celebration
    setJustCompletedWorkoutId(displayWorkout.id);
    setShowCompletionView(true);
    setCompletionDismissed(false);
    setDismissedWorkoutId(null); // Clear any previously dismissed workout
  };

  const handleRenameAdHocWorkout = async (name: string) => {
    if (!displayWorkout?.isAdHoc || !name.trim()) return;
    
    await ScheduledWorkoutRepo.updateName(displayWorkout.id, name.trim());
  };

  const handleCancelAdHocWorkout = async () => {
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
      setCompletionDismissed(false);
      setShowCompletionView(false);
      setJustCompletedWorkoutId(null);
    } catch (error) {
      console.error('Failed to cancel ad-hoc workout:', error);
    } finally {
      setIsCancellingAdHoc(false);
    }
  };

  // Stats
  const todayStats = {
    totalSets: todaysSets?.length || 0,
    totalReps: todaysSets?.reduce((sum, s) => sum + s.actualReps, 0) || 0,
    scheduledRemaining: scheduledSetsRemaining.length,
    scheduledCompleted: scheduledSetsCompleted.length
  };

  const currentGroup = activeCycle?.groups.find(g => g.id === displayWorkout?.groupId);

  return (
    <>
      <PageHeader 
        title="Today" 
        subtitle={new Date().toLocaleDateString(undefined, { 
          weekday: 'long', 
          month: 'long', 
          day: 'numeric' 
        })}
        action={
          <Button onClick={() => setShowExercisePicker(true)} size="sm">
            <Plus className="w-4 h-4 mr-1" />
            Log
          </Button>
        }
      />

      <div className="px-4 py-4 space-y-4">
        {/* Cycle Progress Header (No Cycle / Progress / Complete) */}
        <CycleProgressHeader
          activeCycle={activeCycle}
          cycleProgress={cycleProgress}
          hasActiveWorkout={!!displayWorkout && !isShowingCompletedWorkout}
          onCreateCycle={() => setShowCycleTypeSelector(true)}
        />

        {/* Current/Completed Workout */}
        {displayWorkout && (
          <Card className="overflow-hidden">
            {/* Completion celebration banner */}
            {isShowingCompletedWorkout && (
              <WorkoutCompletionBanner 
                workoutName={
                  displayWorkout.isAdHoc 
                    ? displayWorkout.customName || 'Ad Hoc Workout'
                    : `${currentGroup?.name} #${displayWorkout.sequenceNumber}`
                }
              />
            )}

            <WorkoutHeader
              workout={displayWorkout}
              groupName={currentGroup?.name}
              mode={
                isShowingCompletedWorkout 
                  ? 'completed' 
                  : isShowingAdHocWorkout 
                    ? 'adHoc' 
                    : 'active'
              }
              scheduledSetsCompletedCount={scheduledSetsCompleted.length}
              adHocSetsCount={adHocCompletedSets.length}
              onRename={isShowingAdHocWorkout && !isShowingCompletedWorkout ? () => setShowRenameModal(true) : undefined}
            />

            {/* Scheduled sets - remaining and completed */}
            {!isShowingAdHocWorkout && (
              <ScheduledSetsList
                groupedSetsRemaining={isShowingCompletedWorkout ? [] : groupedSetsRemaining}
                groupedSetsCompleted={groupedSetsCompleted}
                exerciseMap={exerciseMap}
                workoutCompletedSets={workoutCompletedSets || []}
                isShowingCompletedWorkout={isShowingCompletedWorkout}
                showSwipeHint={scheduledSetsRemaining.length > 0 && scheduledSetsCompleted.length === 0}
                getTargetReps={(set) => getTargetReps(set, displayWorkout)}
                onQuickComplete={handleQuickComplete}
                onSkipSet={handleInitiateSkipSet}
                onSelectSet={handleSelectScheduledSet}
                onEditCompletedSet={handleEditCompletedSet}
              />
            )}

            {/* Ad-hoc completed sets (logged via "+ Log") */}
            <AdHocCompletedSetsList
              groupedSets={groupedAdHocSets}
              exerciseMap={exerciseMap}
              isAdHocWorkout={isShowingAdHocWorkout}
              showTopBorder={(scheduledSetsCompleted.length > 0 || !isShowingCompletedWorkout) && !isShowingAdHocWorkout}
              onEditSet={handleEditCompletedSet}
            />

            {/* Ad-hoc workout action buttons */}
            {isShowingAdHocWorkout && !isShowingCompletedWorkout && (
              <AdHocWorkoutControls
                hasCompletedSets={adHocCompletedSets.length > 0}
                onLogSet={() => setShowExercisePicker(true)}
                onComplete={handleCompleteAdHocWorkout}
                onCancel={() => setShowCancelAdHocConfirm(true)}
              />
            )}

            {/* Scheduled workout action buttons (Continue/Skip/End) */}
            {!isShowingAdHocWorkout && (isShowingCompletedWorkout || scheduledSetsRemaining.length > 0) && (
              <WorkoutActionButtons
                isShowingCompletedWorkout={isShowingCompletedWorkout}
                hasNextWorkout={!!nextPendingWorkout}
                hasCompletedSets={scheduledSetsCompleted.length > 0}
                onContinue={handleProceedToNextWorkout}
                onSkip={() => setShowSkipConfirm(true)}
                onEndEarly={() => setShowEndConfirm(true)}
              />
            )}
          </Card>
        )}

        {/* Log Ad-Hoc Workout button - show when completed workout is shown or no workout in progress */}
        {activeCycle && (isShowingCompletedWorkout || (!displayWorkout && !isCycleComplete)) && (
          <Button
            variant="secondary"
            className="w-full"
            onClick={handleStartAdHocWorkout}
          >
            <Plus className="w-4 h-4 mr-1" />
            Log Ad-Hoc Workout
          </Button>
        )}

        {/* Collapsible Stats Summary */}
        <TodayStats
          totalSets={todayStats.totalSets}
          totalReps={todayStats.totalReps}
          exerciseCount={new Set(todaysSets?.map(s => s.exerciseId)).size}
          adHocSets={todaysSets?.filter(s => !s.scheduledSetId) || []}
          exerciseMap={exerciseMap}
        />

        {/* Empty state */}
        {!activeCycle && (!todaysSets || todaysSets.length === 0) && (
          <EmptyState
            icon={Dumbbell}
            title="Ready to train?"
            description="Create a cycle for scheduled workouts, or log sets manually."
          />
        )}
      </div>

      {/* Exercise Picker Modal */}
      <ExercisePickerModal
        isOpen={showExercisePicker}
        exercises={exercises}
        onClose={() => setShowExercisePicker(false)}
        onSelectExercise={handleSelectExercise}
        onNavigateToAddExercises={() => { setShowExercisePicker(false); navigate('/exercises'); }}
      />

      {/* Quick Log Modal */}
      <Modal
        isOpen={!!selectedExercise && !selectedScheduledSet}
        onClose={() => setSelectedExercise(null)}
        title="Log Set"
      >
        {selectedExercise && (
          <QuickLogForm
            exercise={selectedExercise}
            onSubmit={handleLogSet}
            onCancel={() => setSelectedExercise(null)}
            isLoading={isLogging}
          />
        )}
      </Modal>

      {/* Scheduled Set Log Modal */}
      <ScheduledSetModal
        scheduledSet={selectedScheduledSet ? { set: selectedScheduledSet.set, targetReps: selectedScheduledSet.targetReps } : null}
        exercise={selectedScheduledSet ? exerciseMap.get(selectedScheduledSet.set.exerciseId) || null : null}
        isLogging={isLogging}
        onLogSet={handleLogSet}
        onClose={() => setSelectedScheduledSet(null)}
      />

      {/* Cycle Wizard Modal */}
      <Modal
        isOpen={showCycleWizard}
        onClose={() => setShowCycleWizard(false)}
        title="Create Training Cycle"
        size="full"
      >
        <div className="h-[80vh]">
          <CycleWizard
            onComplete={handleCycleCreated}
            onCancel={() => setShowCycleWizard(false)}
          />
        </div>
      </Modal>

      {/* Skip Workout Confirmation */}
      <SkipWorkoutConfirmModal
        isOpen={showSkipConfirm}
        onClose={() => setShowSkipConfirm(false)}
        onConfirm={handleSkipWorkout}
      />

      {/* End Workout Early Confirmation */}
      <EndWorkoutConfirmModal
        isOpen={showEndConfirm}
        completedSetCount={scheduledSetsCompleted.length}
        totalSetCount={displayWorkout?.scheduledSets.length || 0}
        onClose={() => setShowEndConfirm(false)}
        onConfirm={handleEndWorkout}
      />

      {/* Rest Timer Modal */}
      <Modal
        isOpen={showRestTimer}
        onClose={() => setShowRestTimer(false)}
        title="Rest Timer"
      >
        <RestTimer
          initialSeconds={restTimerDuration}
          onDismiss={() => setShowRestTimer(false)}
        />
      </Modal>

      {/* Skip Set Confirmation Modal */}
      <SkipSetConfirmModal
        setToSkip={setToSkip}
        exercise={setToSkip ? exerciseMap.get(setToSkip.set.exerciseId) : undefined}
        onClose={() => setSetToSkip(null)}
        onConfirm={handleConfirmSkipSet}
      />

      {/* Edit Completed Set Modal */}
      <EditCompletedSetModal
        completedSet={editingCompletedSet?.completedSet || null}
        exercise={editingCompletedSet?.exercise || null}
        onSave={handleSaveEditedSet}
        onDelete={handleDeleteCompletedSet}
        onClose={() => setEditingCompletedSet(null)}
      />

      {/* Cycle Completion Modal */}
      {completedCycleForModal && (
        <CycleCompletionModal
          isOpen={showCycleCompletionModal}
          cycle={completedCycleForModal}
          onStartMaxTesting={handleStartMaxTesting}
          onCreateNewCycle={handleCreateNewCycleFromCompletion}
          onDismiss={handleDismissCycleCompletion}
        />
      )}

      {/* Max Testing Wizard */}
      {showMaxTestingWizard && completedCycleForModal && (
        <MaxTestingWizard
          completedCycle={completedCycleForModal}
          onComplete={handleMaxTestingComplete}
          onCancel={() => {
            setShowMaxTestingWizard(false);
            setCompletedCycleForModal(null);
          }}
        />
      )}

      {/* Cycle Type Selector Modal */}
      <Modal
        isOpen={showCycleTypeSelector}
        onClose={() => setShowCycleTypeSelector(false)}
        title="Create New Cycle"
      >
        <CycleTypeSelector
          onSelectTraining={() => {
            setShowCycleTypeSelector(false);
            setShowCycleWizard(true);
          }}
          onSelectMaxTesting={() => {
            setShowCycleTypeSelector(false);
            setShowStandaloneMaxTesting(true);
          }}
          onCancel={() => setShowCycleTypeSelector(false)}
        />
      </Modal>

      {/* Standalone Max Testing Wizard (when selected from type selector) */}
      {showStandaloneMaxTesting && (
        <MaxTestingWizard
          onComplete={() => {
            setShowStandaloneMaxTesting(false);
          }}
          onCancel={() => setShowStandaloneMaxTesting(false)}
        />
      )}

      {/* Rename Ad-Hoc Workout Modal */}
      <RenameWorkoutModal
        isOpen={showRenameModal}
        initialName={displayWorkout?.customName || ''}
        onClose={() => setShowRenameModal(false)}
        onSave={handleRenameAdHocWorkout}
      />

      {/* Cancel Ad-Hoc Workout Confirmation Modal */}
      <CancelAdHocConfirmModal
        isOpen={showCancelAdHocConfirm}
        setCount={adHocCompletedSets.length}
        isDeleting={isCancellingAdHoc}
        onClose={() => setShowCancelAdHocConfirm(false)}
        onConfirm={handleCancelAdHocWorkout}
      />
    </>
  );
}
