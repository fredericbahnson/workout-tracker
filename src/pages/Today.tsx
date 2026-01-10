import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { Plus, Dumbbell } from 'lucide-react';
import { CompletedSetRepo, ExerciseRepo, CycleRepo, ScheduledWorkoutRepo, MaxRecordRepo } from '@/data/repositories';
import { calculateTargetReps, calculateSimpleTargetWeight } from '@/services/scheduler';
import { useAppStore } from '@/stores/appStore';
import { useSyncItem } from '@/contexts/SyncContext';
import { useWorkoutDisplay, useCycleCompletion, useAdHocWorkout } from '@/hooks';
import { PageHeader } from '@/components/layout';
import { Button, Modal, EmptyState, Card } from '@/components/ui';
import { QuickLogForm, RestTimer } from '@/components/workouts';
import { WorkoutCompletionBanner, ScheduledSetsList, WorkoutHeader, AdHocWorkoutControls, EditCompletedSetModal, ScheduledSetModal, TodayStats, AdHocCompletedSetsList, WorkoutActionButtons, CycleProgressHeader, SkipWorkoutConfirmModal, EndWorkoutConfirmModal, SkipSetConfirmModal, CancelAdHocConfirmModal, ExercisePickerModal, RenameWorkoutModal } from '@/components/workouts/today';
import { CycleWizard, MaxTestingWizard, CycleCompletionModal, CycleTypeSelector } from '@/components/cycles';
import { EXERCISE_TYPES, getProgressionMode, type Exercise, type ScheduledWorkout, type ScheduledSet, type CompletedSet, type ProgressionMode } from '@/types';

export function TodayPage() {
  const navigate = useNavigate();
  const { defaults, restTimer, maxTestRestTimer } = useAppStore();
  const { syncItem, deleteItem } = useSyncItem();
  const [showExercisePicker, setShowExercisePicker] = useState(false);
  const [showCycleWizard, setShowCycleWizard] = useState(false);
  const [showCycleTypeSelector, setShowCycleTypeSelector] = useState(false);
  const [wizardProgressionMode, setWizardProgressionMode] = useState<ProgressionMode>('rfem');
  const [showSkipConfirm, setShowSkipConfirm] = useState(false);
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [showRestTimer, setShowRestTimer] = useState(false);
  const [restTimerDuration, setRestTimerDuration] = useState(restTimer.defaultDurationSeconds);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [selectedScheduledSet, setSelectedScheduledSet] = useState<{
    set: ScheduledSet;
    workout: ScheduledWorkout;
    targetReps: number;
    targetWeight?: number;
  } | null>(null);
  const [isLogging, setIsLogging] = useState(false);
  
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
  
  // Track dismissed workout to force query refresh
  const [dismissedWorkoutId, setDismissedWorkoutId] = useState<string | null>(null);
  
  const nextPendingWorkout = useLiveQuery(async () => {
    if (!activeCycle) return null;
    const workouts = await ScheduledWorkoutRepo.getByCycleId(activeCycle.id);
    // Find first pending workout, skipping the one we just dismissed
    // This handles the case where the database hasn't fully updated yet
    const pending = workouts.find(w => 
      (w.status === 'pending' || w.status === 'partial') && 
      !w.isAdHoc &&
      w.id !== dismissedWorkoutId  // Skip the just-completed workout
    );
    return pending || null;
  }, [activeCycle?.id, dismissedWorkoutId]);

  // Get any in-progress ad-hoc workout
  const inProgressAdHocWorkout = useLiveQuery(async () => {
    if (!activeCycle) return null;
    return ScheduledWorkoutRepo.getInProgressAdHoc(activeCycle.id);
  }, [activeCycle?.id]);

  // Workout display logic (which workout to show, completion view state)
  const {
    displayWorkout,
    isShowingCompletedWorkout,
    isShowingAdHocWorkout,
    markWorkoutCompleted,
    handleProceedToNextWorkout: proceedToNextWorkout,
    dismissCompletionView,
    resetCompletionState,
  } = useWorkoutDisplay({
    lastCompletedWorkout,
    nextPendingWorkout,
    inProgressAdHocWorkout,
  });

  // Wrapper to handle proceeding to next workout with query refresh
  const handleProceedToNextWorkout = () => {
    // Set the dismissed workout ID to force the nextPendingWorkout query to refresh
    // This prevents showing a stale/just-completed workout
    if (displayWorkout) {
      setDismissedWorkoutId(displayWorkout.id);
    }
    proceedToNextWorkout();
  };

  const cycleProgress = useLiveQuery(async () => {
    if (!activeCycle) return null;
    return ScheduledWorkoutRepo.getCycleProgress(activeCycle.id);
  }, [activeCycle?.id]);

  // Detect when entire cycle is complete (all workouts done)
  const isCycleComplete = cycleProgress && cycleProgress.completed === cycleProgress.total && cycleProgress.total > 0;
  
  // Cycle completion flow (modal, max testing wizard)
  const {
    showCycleCompletionModal,
    showMaxTestingWizard,
    showStandaloneMaxTesting,
    completedCycleForModal,
    handleStartMaxTesting,
    handleCreateNewCycleFromCompletion,
    handleDismissCycleCompletion,
    handleMaxTestingComplete,
    handleCancelMaxTesting,
    openStandaloneMaxTesting,
    closeStandaloneMaxTesting,
  } = useCycleCompletion({
    isCycleComplete: !!isCycleComplete,
    activeCycle,
    showCycleWizard,
    onShowCycleWizard: () => setShowCycleWizard(true),
  });

  // Ad-hoc workout management
  const {
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
  } = useAdHocWorkout({
    activeCycle,
    cycleProgressPassed: cycleProgress?.passed || 0,
    displayWorkout,
    syncItem,
    deleteItem,
    markWorkoutCompleted,
    dismissCompletionView,
    resetCompletionState,
  });

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

  // Helper to get target weight for a set (simple progression mode only)
  const getTargetWeight = (set: ScheduledSet, workout: ScheduledWorkout): number | undefined => {
    if (!activeCycle || getProgressionMode(activeCycle) !== 'simple') return undefined;
    return calculateSimpleTargetWeight(set, workout, activeCycle);
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
      markWorkoutCompleted(displayWorkout.id);
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
      const targetWeight = getTargetWeight(set, displayWorkout);
      setSelectedScheduledSet({ set, workout: displayWorkout, targetReps, targetWeight });
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
      markWorkoutCompleted(displayWorkout.id);
    } else {
      await ScheduledWorkoutRepo.updateStatus(displayWorkout.id, 'partial');
      // Show rest timer if enabled (regular sets only here, max test redirects above)
      if (restTimer.enabled) {
        // Use 50% duration for warmup sets
        const duration = set.isWarmup 
          ? Math.round(restTimer.defaultDurationSeconds * 0.5)
          : restTimer.defaultDurationSeconds;
        setRestTimerDuration(duration);
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
      markWorkoutCompleted(displayWorkout.id);
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
          markWorkoutCompleted(displayWorkout.id);
          // Don't show timer when workout is complete
        } else if (newCompletedCount > 0 && displayWorkout) {
          await ScheduledWorkoutRepo.updateStatus(displayWorkout.id, 'partial');
          // Show rest timer if enabled and there are more sets
          // Use max test rest timer for max test sets, regular rest timer otherwise
          // Use 50% duration for warmup sets
          if (set.isMaxTest && maxTestRestTimer.enabled) {
            shouldShowTimer = true;
            setRestTimerDuration(maxTestRestTimer.defaultDurationSeconds);
          } else if (!set.isMaxTest && restTimer.enabled) {
            shouldShowTimer = true;
            const duration = set.isWarmup 
              ? Math.round(restTimer.defaultDurationSeconds * 0.5)
              : restTimer.defaultDurationSeconds;
            setRestTimerDuration(duration);
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
              onRename={isShowingAdHocWorkout && !isShowingCompletedWorkout ? openRenameModal : undefined}
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
                getTargetWeight={(set) => getTargetWeight(set, displayWorkout)}
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
                onCancel={openCancelConfirm}
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
        scheduledSet={selectedScheduledSet ? { 
          set: selectedScheduledSet.set, 
          targetReps: selectedScheduledSet.targetReps,
          targetWeight: selectedScheduledSet.targetWeight
        } : null}
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
            initialProgressionMode={wizardProgressionMode}
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
          onCancel={handleCancelMaxTesting}
        />
      )}

      {/* Cycle Type Selector Modal */}
      <Modal
        isOpen={showCycleTypeSelector}
        onClose={() => setShowCycleTypeSelector(false)}
        title="Create New Cycle"
      >
        <CycleTypeSelector
          onSelectTraining={(mode) => {
            setShowCycleTypeSelector(false);
            setWizardProgressionMode(mode);
            setShowCycleWizard(true);
          }}
          onSelectMaxTesting={() => {
            setShowCycleTypeSelector(false);
            openStandaloneMaxTesting();
          }}
          onCancel={() => setShowCycleTypeSelector(false)}
        />
      </Modal>

      {/* Standalone Max Testing Wizard (when selected from type selector) */}
      {showStandaloneMaxTesting && (
        <MaxTestingWizard
          onComplete={closeStandaloneMaxTesting}
          onCancel={closeStandaloneMaxTesting}
        />
      )}

      {/* Rename Ad-Hoc Workout Modal */}
      <RenameWorkoutModal
        isOpen={showRenameModal}
        initialName={displayWorkout?.customName || ''}
        onClose={closeRenameModal}
        onSave={handleRenameAdHocWorkout}
      />

      {/* Cancel Ad-Hoc Workout Confirmation Modal */}
      <CancelAdHocConfirmModal
        isOpen={showCancelAdHocConfirm}
        setCount={adHocCompletedSets.length}
        isDeleting={isCancellingAdHoc}
        onClose={closeCancelConfirm}
        onConfirm={handleCancelAdHocWorkout}
      />
    </>
  );
}
