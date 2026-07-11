import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { Plus, Dumbbell, Trophy, Target, Calendar, AlertTriangle, Flame } from 'lucide-react';
import { CompletedSetRepo } from '@/data/repositories';
import { calculateTargetReps, calculateSimpleTargetWeight } from '@/services/scheduler';
import { useAppStore } from '@/stores/appStore';
import { useSyncedPreferences } from '@/contexts';
import { useSyncItem } from '@/contexts';
import { useGatedAction } from '@/contexts';
import {
  useWorkoutDisplay,
  useCycleCompletion,
  useAdHocWorkout,
  useTodayModals,
  useTodayLiveData,
  useTodayWorkoutActions,
  useScheduledWorkoutStatus,
  useRatingPrompt,
  useGettingStartedProgress,
} from '@/hooks';
import { PageHeader } from '@/components/layout';
import { Button, Modal, EmptyState, Card, Toggle } from '@/components/ui';
import { QuickLogForm, RestTimerBanner } from '@/components/workouts';
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
  OverdueBanner,
  OverdueWorkoutModal,
  RestDayCard,
  GettingStartedCard,
} from '@/components/workouts/today';
import { AppStoreRatingModal } from '@/components/engagement/AppStoreRatingModal';
import { WhyTheseRepsSheet } from '@/components/education/WhyTheseRepsSheet';
import { RFEMGuide } from '@/components/onboarding';
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
  const showWarmupSets = useAppStore(s => s.showWarmupSets);
  const setShowWarmupSets = useAppStore(s => s.setShowWarmupSets);
  const showTimedWarmups = useAppStore(s => s.showTimedWarmups);
  const setShowTimedWarmups = useAppStore(s => s.setShowTimedWarmups);

  // Consolidated modal state via useReducer
  const modals = useTodayModals({
    defaultRestTimerDuration: preferences.restTimer.durationSeconds,
  });

  // Track dismissed workout to force query refresh
  const [dismissedWorkoutId, setDismissedWorkoutId] = useState<string | null>(null);

  // Overdue workout modal state
  const [showOverdueModal, setShowOverdueModal] = useState(false);

  // "Why these reps?" education sheet (opened from the scheduled-set modal)
  const [showWhyReps, setShowWhyReps] = useState(false);
  const [showRFEMGuideFromWhy, setShowRFEMGuideFromWhy] = useState(false);

  // Live queries
  const {
    activeCycle,
    allCycleWorkouts,
    lastCompletedWorkout,
    nextPendingWorkout,
    inProgressAdHocWorkout,
    cycleProgress,
    todaysSets,
    exercises,
    maxRecords,
  } = useTodayLiveData({ dismissedWorkoutId });

  // Workout display logic
  const {
    displayWorkout,
    isShowingCompletedWorkout,
    isShowingAdHocWorkout,
    markWorkoutCompleted,
    handleProceedToNextWorkout: proceedToNextWorkout,
    dismissCompletionView,
    clearDismissedWorkout,
    resetCompletionState,
  } = useWorkoutDisplay({
    lastCompletedWorkout,
    nextPendingWorkout,
    inProgressAdHocWorkout,
  });

  // App Store rating prompt - fires once per transition into the completed view
  const ratingPrompt = useRatingPrompt();
  const prevShowingCompleted = useRef(false);
  useEffect(() => {
    const wasShowing = prevShowingCompleted.current;
    prevShowingCompleted.current = isShowingCompletedWorkout;
    if (isShowingCompletedWorkout && !wasShowing) {
      const timer = setTimeout(() => {
        ratingPrompt.checkRatingPrompt();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [isShowingCompletedWorkout, ratingPrompt.checkRatingPrompt]);

  const handleProceedToNextWorkout = () => {
    if (displayWorkout) {
      setDismissedWorkoutId(displayWorkout.id);
    }
    proceedToNextWorkout();
  };

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
    onShowCycleWizard: () => modals.openCycleTypeSelector(),
  });

  // Creating a NEW cycle requires Standard access once the trial has ended.
  // Gate here, before the handlers run, because handleCreateNewCycleFromCompletion
  // marks the old cycle 'completed' before opening the wizard - nothing may
  // mutate when the user lacks access.
  const gatedStartMaxTesting = useGatedAction(handleStartMaxTesting, 'standard');
  const gatedCreateNewCycleFromCompletion = useGatedAction(
    handleCreateNewCycleFromCompletion,
    'standard'
  );

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

  // Getting-started checklist (new users until first cycle + first logged sets)
  const gettingStarted = useGettingStartedProgress();

  // Date-based scheduling status
  const scheduledStatus = useScheduledWorkoutStatus({
    cycle: activeCycle,
    workouts: allCycleWorkouts,
  });

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

  // Data for the "Why these reps?" sheet, derived from the selected scheduled set
  const whyRepsData = useMemo(() => {
    const selected = modals.selectedScheduledSet;
    if (!selected) return null;
    const exercise = exerciseMap.get(selected.set.exerciseId);
    const maxRecord = maxRecords?.get(selected.set.exerciseId);
    const cycleMode = activeCycle ? getProgressionMode(activeCycle) : 'rfem';
    const effectiveMode = selected.set.progressionMode ?? cycleMode;
    const progressionMode: 'rfem' | 'simple' | 'conditioning' = selected.set.isConditioning
      ? 'conditioning'
      : effectiveMode === 'simple'
        ? 'simple'
        : 'rfem';
    const isTimeBased = exercise?.measurementType === 'time';
    return {
      exerciseName: exercise?.name ?? 'Exercise',
      targetReps: selected.targetReps,
      maxReps: isTimeBased ? maxRecord?.maxTime : maxRecord?.maxReps,
      rfemValue: selected.workout.rfem,
      progressionMode,
      simpleBase: isTimeBased ? selected.set.simpleBaseTime : selected.set.simpleBaseReps,
      simpleIncrement: selected.set.simpleRepIncrement,
      weekNumber: selected.workout.weekNumber,
    };
  }, [modals.selectedScheduledSet, exerciseMap, maxRecords, activeCycle]);

  // Filter warmup sets based on toggle state
  const isWarmupVisible = useCallback(
    (set: ScheduledSet): boolean => {
      if (!set.isWarmup) return true;
      if (!showWarmupSets) return false;
      if (!showTimedWarmups) {
        const exercise = exerciseMap.get(set.exerciseId);
        if (exercise?.measurementType === 'time') return false;
      }
      return true;
    },
    [showWarmupSets, showTimedWarmups, exerciseMap]
  );

  const { scheduledSetsRemaining, scheduledSetsCompleted } = useMemo(
    () => ({
      scheduledSetsRemaining:
        displayWorkout?.scheduledSets.filter(
          s => !completedScheduledSetIds.has(s.id) && isWarmupVisible(s)
        ) || [],
      scheduledSetsCompleted:
        displayWorkout?.scheduledSets.filter(
          s => completedScheduledSetIds.has(s.id) && isWarmupVisible(s)
        ) || [],
    }),
    [displayWorkout?.scheduledSets, completedScheduledSetIds, isWarmupVisible]
  );

  // Helper functions - memoized to prevent unnecessary re-renders
  const getTargetReps = useCallback(
    (set: ScheduledSet, workout: ScheduledWorkout): number => {
      if (!activeCycle) return 0;
      const maxRecord = maxRecords?.get(set.exerciseId);
      return calculateTargetReps(
        set,
        workout,
        maxRecord,
        activeCycle.conditioningWeeklyRepIncrement,
        activeCycle.conditioningWeeklyTimeIncrement ?? 5,
        preferences.defaultMaxReps,
        activeCycle
      );
    },
    [activeCycle, maxRecords, preferences.defaultMaxReps]
  );

  const getTargetWeight = useCallback(
    (set: ScheduledSet, workout: ScheduledWorkout): number | undefined => {
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
    },
    [activeCycle, exerciseMap]
  );

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

  // Count of visible (non-hidden-warmup) scheduled sets for completion checks
  const visibleSetsCount = useMemo(
    () => displayWorkout?.scheduledSets.filter(s => isWarmupVisible(s)).length || 0,
    [displayWorkout?.scheduledSets, isWarmupVisible]
  );

  const currentGroup = activeCycle?.groups.find(g => g.id === displayWorkout?.groupId);

  // Overdue workout (date-based scheduling)
  const overdueWorkout = scheduledStatus.overdueWorkouts[0] || null;
  const overdueGroupName = overdueWorkout
    ? activeCycle?.groups.find(g => g.id === overdueWorkout.groupId)?.name
    : undefined;

  // Event handlers - extracted to a hook, memoized to prevent unnecessary re-renders
  const {
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
  } = useTodayWorkoutActions({
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
    scheduledSetsCompletedCount: scheduledSetsCompleted.length,
    workoutCompletedSetsCount: workoutCompletedSets?.length,
  });

  // Get group name for next scheduled workout (for rest day card)
  const nextScheduledGroupName = scheduledStatus.nextScheduledWorkout
    ? activeCycle?.groups.find(g => g.id === scheduledStatus.nextScheduledWorkout?.groupId)?.name
    : undefined;

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

      <div className={`px-4 py-4 space-y-4 ${modals.showRestTimer ? 'pb-24' : ''}`}>
        <CycleProgressHeader
          activeCycle={activeCycle}
          cycleProgress={cycleProgress}
          hasActiveWorkout={!!displayWorkout && !isShowingCompletedWorkout}
          onCreateCycle={modals.openCycleTypeSelector}
        />

        {gettingStarted.shouldShow && (
          <GettingStartedCard
            steps={gettingStarted.steps}
            onDismiss={gettingStarted.dismiss}
            onStepClick={id => {
              if (id === 'create-cycle') {
                modals.openCycleTypeSelector();
              } else {
                navigate('/exercises');
              }
            }}
          />
        )}

        {/* Overdue workouts banner for date-based scheduling */}
        {scheduledStatus.overdueWorkouts.length > 0 && (
          <OverdueBanner
            count={scheduledStatus.overdueWorkouts.length}
            oldestDate={new Date(scheduledStatus.overdueWorkouts[0].scheduledDate!)}
            onReview={() => setShowOverdueModal(true)}
          />
        )}

        {/* Rest day card for date-based scheduling */}
        {scheduledStatus.isDateBased &&
          scheduledStatus.isRestDay &&
          !displayWorkout &&
          !isShowingCompletedWorkout && (
            <RestDayCard
              nextWorkout={scheduledStatus.nextScheduledWorkout}
              nextGroupName={nextScheduledGroupName}
              onWorkOutAnyway={adHocWorkout.handleStartAdHocWorkout}
            />
          )}

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

            {/* Scheduled date for date-based cycles */}
            {activeCycle?.schedulingMode === 'date' &&
              displayWorkout.scheduledDate &&
              !isShowingCompletedWorkout && (
                <div className="mx-4 mb-3">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 dark:bg-gray-800 rounded-full">
                    <Calendar className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                      Scheduled for{' '}
                      {new Date(displayWorkout.scheduledDate).toLocaleDateString(undefined, {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                </div>
              )}

            {/* Warmup sets toggle */}
            {!isShowingCompletedWorkout &&
              !isShowingAdHocWorkout &&
              displayWorkout.scheduledSets.some(s => s.isWarmup) && (
                <div className="mx-4 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Flame className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                      <span className="text-xs text-gray-500 dark:text-gray-400">Warmup Sets</span>
                      <Toggle
                        checked={showWarmupSets}
                        onChange={setShowWarmupSets}
                        size="sm"
                        aria-label="Show warmup sets"
                      />
                    </div>
                    {showWarmupSets &&
                      displayWorkout.scheduledSets.some(s => {
                        if (!s.isWarmup) return false;
                        const ex = exerciseMap.get(s.exerciseId);
                        return ex?.measurementType === 'time';
                      }) && (
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="text-xs text-gray-400 dark:text-gray-500">Timed</span>
                          <Toggle
                            checked={showTimedWarmups}
                            onChange={setShowTimedWarmups}
                            size="sm"
                            aria-label="Show timed warmup sets"
                          />
                        </div>
                      )}
                  </div>
                </div>
              )}

            {/* Max testing warmup reminder - only show when warmup sets are hidden */}
            {activeCycle?.cycleType === 'max_testing' &&
              !showWarmupSets &&
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

        {activeCycle && (isShowingCompletedWorkout || !displayWorkout) && (
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
                onClick={gatedCreateNewCycleFromCompletion}
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
        onClose={() => {
          setShowWhyReps(false);
          modals.closeScheduledSetModal();
        }}
        onWhyTarget={() => setShowWhyReps(true)}
      />

      {whyRepsData && (
        <WhyTheseRepsSheet
          isOpen={showWhyReps}
          onClose={() => setShowWhyReps(false)}
          {...whyRepsData}
          onLearnMore={() => {
            setShowWhyReps(false);
            setShowRFEMGuideFromWhy(true);
          }}
        />
      )}

      {showRFEMGuideFromWhy && (
        <RFEMGuide
          standalone={true}
          showProgress={true}
          showSkip={true}
          onComplete={() => setShowRFEMGuideFromWhy(false)}
          onSkip={() => setShowRFEMGuideFromWhy(false)}
        />
      )}

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

      {/* Non-blocking rest timer banner. The key remounts the banner when a
          new timer is opened mid-countdown - the only way to restart it,
          since useCountdownTimer reads its duration at mount. */}
      {modals.showRestTimer && (
        <RestTimerBanner
          key={modals.restTimerKey}
          initialSeconds={modals.restTimerDuration}
          onDismiss={modals.closeRestTimer}
          volume={preferences.timerVolume}
        />
      )}

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
          onStartMaxTesting={gatedStartMaxTesting}
          onCreateNewCycle={gatedCreateNewCycleFromCompletion}
          onDismiss={handleDismissCycleCompletion}
        />
      )}
      {showMaxTestingWizard && (
        <MaxTestingWizard onComplete={handleMaxTestingComplete} onCancel={handleCancelMaxTesting} />
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
      <OverdueWorkoutModal
        workout={showOverdueModal ? overdueWorkout : null}
        groupName={overdueGroupName}
        remainingCount={scheduledStatus.overdueWorkouts.length - 1}
        onDoWorkout={handleDoOverdueWorkout}
        onSkip={handleSkipOverdueWorkout}
        onClose={() => setShowOverdueModal(false)}
      />
      <AppStoreRatingModal
        isOpen={ratingPrompt.showRatingModal}
        onRate={ratingPrompt.handleRate}
        onFeedback={ratingPrompt.handleFeedback}
        onDismiss={ratingPrompt.handleDismiss}
      />
    </>
  );
}
