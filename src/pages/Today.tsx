import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { Plus, Dumbbell, Trophy, Target, Calendar, AlertTriangle } from 'lucide-react';
import {
  CompletedSetRepo,
  ExerciseRepo,
  CycleRepo,
  ScheduledWorkoutRepo,
  MaxRecordRepo,
} from '@/data/repositories';
import { calculateTargetReps, calculateSimpleTargetWeight } from '@/services/scheduler';
import { useSyncedPreferences } from '@/contexts';
import { useSyncItem } from '@/contexts';
import { useWorkoutDisplay, useCycleCompletion, useAdHocWorkout, useTodayModals } from '@/hooks';
import { PageHeader } from '@/components/layout';
import { Button, Modal, EmptyState, Card } from '@/components/ui';
import { QuickLogForm, RestTimer } from '@/components/workouts';
import {
  WorkoutCompletionBanner,
  ScheduledSetsList,
  WorkoutHeader,
  AdHocWorkoutControls,
  EditCompletedSetModal,
  ScheduledSetModal,
  TodayStats,
  AdHocCompletedSetsList,
  WorkoutActionButtons,
  CycleProgressHeader,
  SkipWorkoutConfirmModal,
  EndWorkoutConfirmModal,
  SkipSetConfirmModal,
  CancelAdHocConfirmModal,
  ExercisePickerModal,
  RenameWorkoutModal,
} from '@/components/workouts/today';
import {
  CycleWizard,
  MaxTestingWizard,
  CycleCompletionModal,
  CycleTypeSelector,
} from '@/components/cycles';
import {
  EXERCISE_TYPES,
  getProgressionMode,
  type Exercise,
  type ScheduledWorkout,
  type ScheduledSet,
} from '@/types';

export function TodayPage() {
  const navigate = useNavigate();
  const { preferences } = useSyncedPreferences();
  const { syncItem, deleteItem } = useSyncItem();

  // Consolidated modal state via useReducer
  const modals = useTodayModals({
    defaultRestTimerDuration: preferences.restTimer.durationSeconds,
  });

  // Track dismissed workout to force query refresh
  const [dismissedWorkoutId, setDismissedWorkoutId] = useState<string | null>(null);

  // Live queries
  const activeCycle = useLiveQuery(() => CycleRepo.getActive(), []);

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

  // Workout display logic
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

  const handleProceedToNextWorkout = () => {
    if (displayWorkout) {
      setDismissedWorkoutId(displayWorkout.id);
    }
    proceedToNextWorkout();
  };

  const cycleProgress = useLiveQuery(async () => {
    if (!activeCycle) return null;
    return ScheduledWorkoutRepo.getCycleProgress(activeCycle.id);
  }, [activeCycle?.id]);

  const isCycleComplete =
    cycleProgress && cycleProgress.completed === cycleProgress.total && cycleProgress.total > 0;

  // Cycle completion flow
  const {
    showCycleCompletionModal,
    showMaxTestingWizard,
    showStandaloneMaxTesting,
    completedCycleForModal,
    cycleCompleteDismissed,
    handleStartMaxTesting,
    handleCreateNewCycleFromCompletion,
    handleDismissCycleCompletion,
    handleMaxTestingComplete,
    handleCancelMaxTesting,
    openStandaloneMaxTesting,
    closeStandaloneMaxTesting,
    handleShowCycleCompletionModal,
  } = useCycleCompletion({
    isCycleComplete: !!isCycleComplete,
    activeCycle,
    showCycleWizard: modals.showCycleWizard,
    onShowCycleWizard: () => modals.openCycleWizard(),
  });

  // Ad-hoc workout management
  const adHocWorkout = useAdHocWorkout({
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

  const workoutCompletedSets = useLiveQuery(async () => {
    if (!displayWorkout) return [];
    return CompletedSetRepo.getForScheduledWorkout(displayWorkout.id);
  }, [displayWorkout?.id]);

  // Memoized maps and computations
  const exerciseMap = useMemo(() => {
    const map = new Map<string, Exercise>();
    exercises?.forEach(ex => map.set(ex.id, ex));
    return map;
  }, [exercises]);

  // Calculate which scheduled sets are completed
  const completedScheduledSetIds = useMemo(
    () => new Set(workoutCompletedSets?.map(s => s.scheduledSetId) || []),
    [workoutCompletedSets]
  );

  const { scheduledSetsRemaining, scheduledSetsCompleted } = useMemo(
    () => ({
      scheduledSetsRemaining:
        displayWorkout?.scheduledSets.filter(s => !completedScheduledSetIds.has(s.id)) || [],
      scheduledSetsCompleted:
        displayWorkout?.scheduledSets.filter(s => completedScheduledSetIds.has(s.id)) || [],
    }),
    [displayWorkout?.scheduledSets, completedScheduledSetIds]
  );

  // Helper functions
  const getTargetReps = (set: ScheduledSet, workout: ScheduledWorkout): number => {
    if (!activeCycle) return 0;
    const maxRecord = maxRecords?.get(set.exerciseId);
    return calculateTargetReps(
      set,
      workout,
      maxRecord,
      activeCycle.conditioningWeeklyRepIncrement,
      activeCycle.conditioningWeeklyTimeIncrement || 5,
      preferences.defaultMaxReps,
      activeCycle
    );
  };

  const getTargetWeight = (set: ScheduledSet, workout: ScheduledWorkout): number | undefined => {
    if (!activeCycle) return undefined;

    const cycleMode = getProgressionMode(activeCycle);
    // For mixed mode, check the per-exercise mode; otherwise use cycle mode
    const effectiveMode = cycleMode === 'mixed' ? set.progressionMode || 'rfem' : cycleMode;

    if (effectiveMode === 'simple') {
      return calculateSimpleTargetWeight(set, workout, activeCycle);
    }

    // For RFEM mode, return exercise.defaultWeight if weightEnabled
    const exercise = exerciseMap.get(set.exerciseId);
    if (exercise?.weightEnabled && exercise.defaultWeight) {
      return exercise.defaultWeight;
    }

    return undefined;
  };

  const groupSetsByType = useMemo(
    () => (sets: ScheduledSet[]) => {
      return EXERCISE_TYPES.map(type => ({
        type,
        sets: sets
          .filter(set => set.exerciseType === type)
          .sort((a, b) => {
            const exA = exerciseMap.get(a.exerciseId);
            const exB = exerciseMap.get(b.exerciseId);
            return (exA?.name || '').localeCompare(exB?.name || '');
          }),
      })).filter(group => group.sets.length > 0);
    },
    [exerciseMap]
  );

  const groupedSetsRemaining = useMemo(
    () => groupSetsByType(scheduledSetsRemaining),
    [groupSetsByType, scheduledSetsRemaining]
  );

  const groupedSetsCompleted = useMemo(
    () => groupSetsByType(scheduledSetsCompleted),
    [groupSetsByType, scheduledSetsCompleted]
  );

  const adHocCompletedSets = useMemo(
    () => workoutCompletedSets?.filter(s => s.scheduledSetId === null) || [],
    [workoutCompletedSets]
  );

  const groupedAdHocSets = useMemo(
    () =>
      EXERCISE_TYPES.map(type => ({
        type,
        sets: adHocCompletedSets
          .filter(set => exerciseMap.get(set.exerciseId)?.type === type)
          .sort((a, b) =>
            (exerciseMap.get(a.exerciseId)?.name || '').localeCompare(
              exerciseMap.get(b.exerciseId)?.name || ''
            )
          ),
      })).filter(group => group.sets.length > 0),
    [adHocCompletedSets, exerciseMap]
  );

  // Event handlers
  const handleSkipWorkout = async () => {
    if (!nextPendingWorkout) return;
    await ScheduledWorkoutRepo.updateStatus(nextPendingWorkout.id, 'skipped');
    modals.closeSkipWorkoutConfirm();
  };

  const handleEndWorkout = async () => {
    if (!displayWorkout || isShowingCompletedWorkout) return;
    const status = scheduledSetsCompleted.length > 0 ? 'partial' : 'skipped';
    await ScheduledWorkoutRepo.updateStatus(
      displayWorkout.id,
      status === 'partial' ? 'completed' : 'skipped'
    );
    if (status === 'partial') markWorkoutCompleted(displayWorkout.id);
    modals.closeEndWorkoutConfirm();
  };

  const handleSelectScheduledSet = (set: ScheduledSet) => {
    if (!displayWorkout || isShowingCompletedWorkout) return;
    const exercise = exerciseMap.get(set.exerciseId);
    if (exercise) {
      const targetReps = set.isMaxTest
        ? set.previousMaxReps || 0
        : getTargetReps(set, displayWorkout);
      const targetWeight = getTargetWeight(set, displayWorkout);
      modals.openScheduledSetModal({ set, workout: displayWorkout, targetReps, targetWeight });
    }
  };

  const handleQuickComplete = async (set: ScheduledSet) => {
    if (!displayWorkout || isShowingCompletedWorkout) return;
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
      targetReps,
      '',
      {}
    );

    // Query actual count from DB to avoid race conditions with React state
    const actualCompletedCount = await CompletedSetRepo.countCompletedScheduledSets(
      displayWorkout.id
    );
    if (actualCompletedCount >= displayWorkout.scheduledSets.length) {
      await ScheduledWorkoutRepo.updateStatus(displayWorkout.id, 'completed');
      markWorkoutCompleted(displayWorkout.id);
    } else {
      await ScheduledWorkoutRepo.updateStatus(displayWorkout.id, 'partial');
      if (preferences.restTimer.enabled) {
        const duration = set.isWarmup
          ? Math.round(preferences.restTimer.durationSeconds * 0.5)
          : preferences.restTimer.durationSeconds;
        modals.openRestTimer(duration);
      }
    }
  };

  const handleInitiateSkipSet = (set: ScheduledSet) => {
    if (!displayWorkout || isShowingCompletedWorkout) return;
    const targetReps = getTargetReps(set, displayWorkout);
    modals.openSkipSetConfirm({ set, workout: displayWorkout, targetReps });
  };

  const handleConfirmSkipSet = async () => {
    if (!modals.setToSkip || !displayWorkout) return;

    await CompletedSetRepo.createFromScheduled(
      modals.setToSkip.set.id,
      displayWorkout.id,
      modals.setToSkip.set.exerciseId,
      modals.setToSkip.targetReps,
      0,
      'Skipped',
      {}
    );

    // Query actual count from DB to avoid race conditions with React state
    const actualCompletedCount = await CompletedSetRepo.countCompletedScheduledSets(
      displayWorkout.id
    );
    if (actualCompletedCount >= displayWorkout.scheduledSets.length) {
      await ScheduledWorkoutRepo.updateStatus(displayWorkout.id, 'completed');
      markWorkoutCompleted(displayWorkout.id);
    } else if (actualCompletedCount > 0) {
      await ScheduledWorkoutRepo.updateStatus(displayWorkout.id, 'partial');
    }
    modals.closeSkipSetConfirm();
  };

  const handleEditCompletedSet = (
    completedSet: NonNullable<typeof workoutCompletedSets>[number]
  ) => {
    const exercise = exerciseMap.get(completedSet.exerciseId);
    if (exercise) modals.openEditCompletedSet({ completedSet, exercise });
  };

  const handleSaveEditedSet = async (reps: number, weight: number | undefined, notes: string) => {
    if (!modals.editingCompletedSet) return;
    await CompletedSetRepo.update(modals.editingCompletedSet.completedSet.id, {
      actualReps: reps,
      weight,
      notes,
    });
  };

  const handleDeleteCompletedSet = async () => {
    if (!modals.editingCompletedSet) return;
    await CompletedSetRepo.delete(modals.editingCompletedSet.completedSet.id);

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
    modals.setIsLogging(true);
    let shouldShowTimer = false;
    let timerDuration = preferences.restTimer.durationSeconds;

    try {
      if (modals.selectedScheduledSet) {
        const { set, workout, targetReps } = modals.selectedScheduledSet;

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

        // Query actual count from DB to avoid race conditions with React state
        const totalSets = displayWorkout?.scheduledSets.length || 0;
        const actualCompletedCount = displayWorkout
          ? await CompletedSetRepo.countCompletedScheduledSets(displayWorkout.id)
          : 0;

        if (actualCompletedCount >= totalSets && displayWorkout) {
          await ScheduledWorkoutRepo.updateStatus(displayWorkout.id, 'completed');
          markWorkoutCompleted(displayWorkout.id);
        } else if (actualCompletedCount > 0 && displayWorkout) {
          await ScheduledWorkoutRepo.updateStatus(displayWorkout.id, 'partial');
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
        modals.closeScheduledSetModal();
      } else if (modals.selectedExercise) {
        await CompletedSetRepo.create(
          { exerciseId: modals.selectedExercise.id, reps, weight, notes, parameters },
          displayWorkout?.id
        );
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
  };

  const currentGroup = activeCycle?.groups.find(g => g.id === displayWorkout?.groupId);

  return (
    <>
      <PageHeader
        title="Today"
        subtitle={new Date().toLocaleDateString(undefined, {
          weekday: 'long',
          month: 'long',
          day: 'numeric',
        })}
        action={
          <Button onClick={modals.openExercisePicker} size="sm">
            <Plus className="w-4 h-4 mr-1" />
            Log
          </Button>
        }
      />

      <div className="px-4 py-4 space-y-4">
        <CycleProgressHeader
          activeCycle={activeCycle}
          cycleProgress={cycleProgress}
          hasActiveWorkout={!!displayWorkout && !isShowingCompletedWorkout}
          onCreateCycle={modals.openCycleTypeSelector}
        />

        {displayWorkout && (
          <Card className="overflow-hidden">
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
                isShowingCompletedWorkout ? 'completed' : isShowingAdHocWorkout ? 'adHoc' : 'active'
              }
              scheduledSetsCompletedCount={scheduledSetsCompleted.length}
              adHocSetsCount={adHocCompletedSets.length}
              onRename={
                isShowingAdHocWorkout && !isShowingCompletedWorkout
                  ? adHocWorkout.openRenameModal
                  : undefined
              }
            />

            {/* Max testing warmup reminder */}
            {activeCycle?.cycleType === 'max_testing' &&
              !isShowingAdHocWorkout &&
              !isShowingCompletedWorkout && (
                <div className="mx-4 mb-3 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                  <div className="flex gap-2">
                    <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-amber-800 dark:text-amber-200">
                      <span className="font-medium">Warm up first!</span> Before attempting each max
                      test, do 2-3 lighter warmup sets to prepare the movement pattern.
                    </div>
                  </div>
                </div>
              )}

            {!isShowingAdHocWorkout && (
              <ScheduledSetsList
                groupedSetsRemaining={isShowingCompletedWorkout ? [] : groupedSetsRemaining}
                groupedSetsCompleted={groupedSetsCompleted}
                exerciseMap={exerciseMap}
                workoutCompletedSets={workoutCompletedSets || []}
                isShowingCompletedWorkout={isShowingCompletedWorkout}
                showSwipeHint={
                  scheduledSetsRemaining.length > 0 && scheduledSetsCompleted.length === 0
                }
                getTargetReps={set => getTargetReps(set, displayWorkout)}
                getTargetWeight={set => getTargetWeight(set, displayWorkout)}
                onQuickComplete={handleQuickComplete}
                onSkipSet={handleInitiateSkipSet}
                onSelectSet={handleSelectScheduledSet}
                onEditCompletedSet={handleEditCompletedSet}
              />
            )}

            <AdHocCompletedSetsList
              groupedSets={groupedAdHocSets}
              exerciseMap={exerciseMap}
              isAdHocWorkout={isShowingAdHocWorkout}
              showTopBorder={
                (scheduledSetsCompleted.length > 0 || !isShowingCompletedWorkout) &&
                !isShowingAdHocWorkout
              }
              onEditSet={handleEditCompletedSet}
            />

            {isShowingAdHocWorkout && !isShowingCompletedWorkout && (
              <AdHocWorkoutControls
                hasCompletedSets={adHocCompletedSets.length > 0}
                onLogSet={modals.openExercisePicker}
                onComplete={adHocWorkout.handleCompleteAdHocWorkout}
                onCancel={adHocWorkout.openCancelConfirm}
              />
            )}

            {/* Show action buttons for:
                1. Completed workouts (both scheduled and ad-hoc) - shows "Continue to Next Workout"
                2. In-progress scheduled workouts with remaining sets - shows Skip/End Early */}
            {(isShowingCompletedWorkout ||
              (!isShowingAdHocWorkout && scheduledSetsRemaining.length > 0)) && (
              <WorkoutActionButtons
                isShowingCompletedWorkout={isShowingCompletedWorkout}
                hasNextWorkout={!!nextPendingWorkout}
                hasCompletedSets={
                  isShowingAdHocWorkout
                    ? adHocCompletedSets.length > 0
                    : scheduledSetsCompleted.length > 0
                }
                onContinue={handleProceedToNextWorkout}
                onSkip={modals.openSkipWorkoutConfirm}
                onEndEarly={modals.openEndWorkoutConfirm}
              />
            )}
          </Card>
        )}

        {activeCycle && (isShowingCompletedWorkout || (!displayWorkout && !isCycleComplete)) && (
          <Button
            variant="secondary"
            className="w-full"
            onClick={adHocWorkout.handleStartAdHocWorkout}
          >
            <Plus className="w-4 h-4 mr-1" />
            Log Ad-Hoc Workout
          </Button>
        )}

        {/* Cycle complete actions - shown when user dismissed the completion modal */}
        {activeCycle && isCycleComplete && cycleCompleteDismissed && (
          <Card className="p-4 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border-yellow-200 dark:border-yellow-800">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center">
                <Trophy className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">Cycle Complete!</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  What would you like to do next?
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <Button onClick={handleShowCycleCompletionModal} className="w-full" size="sm">
                <Target className="w-4 h-4 mr-2" />
                Test New Maxes
              </Button>
              <Button
                variant="secondary"
                onClick={handleCreateNewCycleFromCompletion}
                className="w-full"
                size="sm"
              >
                <Calendar className="w-4 h-4 mr-2" />
                Create New Cycle
              </Button>
            </div>
          </Card>
        )}

        <TodayStats
          totalSets={todaysSets?.length || 0}
          totalReps={todaysSets?.reduce((sum, s) => sum + s.actualReps, 0) || 0}
          exerciseCount={new Set(todaysSets?.map(s => s.exerciseId)).size}
          adHocSets={todaysSets?.filter(s => !s.scheduledSetId) || []}
          exerciseMap={exerciseMap}
        />

        {!activeCycle && (!todaysSets || todaysSets.length === 0) && (
          <EmptyState
            icon={Dumbbell}
            title="Ready to train?"
            description="Create a cycle for scheduled workouts, or log sets manually."
          />
        )}
      </div>

      {/* Modals */}
      <ExercisePickerModal
        isOpen={modals.showExercisePicker}
        exercises={exercises}
        onClose={modals.closeExercisePicker}
        onSelectExercise={modals.selectExercise}
        onNavigateToAddExercises={() => {
          modals.closeExercisePicker();
          navigate('/exercises');
        }}
      />

      <Modal
        isOpen={!!modals.selectedExercise && !modals.selectedScheduledSet}
        onClose={modals.clearSelectedExercise}
        title="Log Set"
      >
        {modals.selectedExercise && (
          <QuickLogForm
            exercise={modals.selectedExercise}
            onSubmit={handleLogSet}
            onCancel={modals.clearSelectedExercise}
            isLoading={modals.isLogging}
          />
        )}
      </Modal>

      <ScheduledSetModal
        scheduledSet={
          modals.selectedScheduledSet
            ? {
                set: modals.selectedScheduledSet.set,
                targetReps: modals.selectedScheduledSet.targetReps,
                targetWeight: modals.selectedScheduledSet.targetWeight,
              }
            : null
        }
        exercise={
          modals.selectedScheduledSet
            ? exerciseMap.get(modals.selectedScheduledSet.set.exerciseId) || null
            : null
        }
        isLogging={modals.isLogging}
        timerVolume={preferences.timerVolume}
        onLogSet={handleLogSet}
        onClose={modals.closeScheduledSetModal}
      />

      <Modal
        isOpen={modals.showCycleWizard}
        onClose={modals.closeCycleWizard}
        title="Create Training Cycle"
        size="full"
      >
        <div className="h-[80vh]">
          <CycleWizard
            onComplete={modals.closeCycleWizard}
            onCancel={modals.closeCycleWizard}
            initialProgressionMode={modals.wizardProgressionMode}
          />
        </div>
      </Modal>

      <SkipWorkoutConfirmModal
        isOpen={modals.showSkipWorkoutConfirm}
        onClose={modals.closeSkipWorkoutConfirm}
        onConfirm={handleSkipWorkout}
      />
      <EndWorkoutConfirmModal
        isOpen={modals.showEndWorkoutConfirm}
        completedSetCount={scheduledSetsCompleted.length}
        totalSetCount={displayWorkout?.scheduledSets.length || 0}
        onClose={modals.closeEndWorkoutConfirm}
        onConfirm={handleEndWorkout}
      />

      <Modal isOpen={modals.showRestTimer} onClose={modals.closeRestTimer} title="Rest Timer">
        <RestTimer
          initialSeconds={modals.restTimerDuration}
          onDismiss={modals.closeRestTimer}
          volume={preferences.timerVolume}
        />
      </Modal>

      <SkipSetConfirmModal
        setToSkip={modals.setToSkip}
        exercise={modals.setToSkip ? exerciseMap.get(modals.setToSkip.set.exerciseId) : undefined}
        onClose={modals.closeSkipSetConfirm}
        onConfirm={handleConfirmSkipSet}
      />
      <EditCompletedSetModal
        completedSet={modals.editingCompletedSet?.completedSet || null}
        exercise={modals.editingCompletedSet?.exercise || null}
        onSave={handleSaveEditedSet}
        onDelete={handleDeleteCompletedSet}
        onClose={modals.closeEditCompletedSet}
      />

      {completedCycleForModal && (
        <CycleCompletionModal
          isOpen={showCycleCompletionModal}
          cycle={completedCycleForModal}
          onStartMaxTesting={handleStartMaxTesting}
          onCreateNewCycle={handleCreateNewCycleFromCompletion}
          onDismiss={handleDismissCycleCompletion}
        />
      )}
      {showMaxTestingWizard && completedCycleForModal && (
        <MaxTestingWizard
          completedCycle={completedCycleForModal}
          onComplete={handleMaxTestingComplete}
          onCancel={handleCancelMaxTesting}
        />
      )}

      <Modal
        isOpen={modals.showCycleTypeSelector}
        onClose={modals.closeCycleTypeSelector}
        title="Create New Cycle"
      >
        <CycleTypeSelector
          onSelectTraining={modals.selectCycleType}
          onSelectMaxTesting={() => {
            modals.closeCycleTypeSelector();
            openStandaloneMaxTesting();
          }}
          onCancel={modals.closeCycleTypeSelector}
        />
      </Modal>

      {showStandaloneMaxTesting && (
        <MaxTestingWizard
          onComplete={closeStandaloneMaxTesting}
          onCancel={closeStandaloneMaxTesting}
        />
      )}
      <RenameWorkoutModal
        isOpen={adHocWorkout.showRenameModal}
        initialName={displayWorkout?.customName || ''}
        onClose={adHocWorkout.closeRenameModal}
        onSave={adHocWorkout.handleRenameAdHocWorkout}
      />
      <CancelAdHocConfirmModal
        isOpen={adHocWorkout.showCancelAdHocConfirm}
        setCount={adHocCompletedSets.length}
        isDeleting={adHocWorkout.isCancellingAdHoc}
        onClose={adHocWorkout.closeCancelConfirm}
        onConfirm={adHocWorkout.handleCancelAdHocWorkout}
      />
    </>
  );
}
