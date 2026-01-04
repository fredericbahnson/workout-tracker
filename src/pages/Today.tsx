import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { Plus, Dumbbell, Calendar, CheckCircle, Circle, SkipForward, StopCircle, PartyPopper, ChevronRight, ChevronDown, ChevronUp, BarChart3, Edit2 } from 'lucide-react';
import { CompletedSetRepo, ExerciseRepo, CycleRepo, ScheduledWorkoutRepo, MaxRecordRepo } from '../data/repositories';
import { calculateTargetReps } from '../services/scheduler';
import { useAppStore } from '../stores/appStore';
import { useSyncItem } from '../contexts/SyncContext';
import { isToday } from '../utils';
import { PageHeader } from '../components/layout';
import { Button, Modal, EmptyState, Card, NumberInput } from '../components/ui';
import { QuickLogForm, CompletedSetCard, RestTimer, SwipeableSetCard, ExerciseTimer, ExerciseStopwatch } from '../components/workouts';
import { ExerciseCard } from '../components/exercises';
import { CycleWizard, MaxTestingWizard, CycleCompletionModal, CycleTypeSelector } from '../components/cycles';
import { EXERCISE_TYPES, EXERCISE_TYPE_LABELS, formatTime, type Exercise, type ScheduledWorkout, type ScheduledSet, type CompletedSet, type Cycle } from '../types';

export function TodayPage() {
  const navigate = useNavigate();
  const { defaults, restTimer, maxTestRestTimer } = useAppStore();
  const { syncItem } = useSyncItem();
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
  const [showTimerMode, setShowTimerMode] = useState(false);
  const [showStopwatchMode, setShowStopwatchMode] = useState(false);
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
  const [editReps, setEditReps] = useState(0);
  const [editWeight, setEditWeight] = useState<string>('');
  const [editNotes, setEditNotes] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  
  // Track just-completed workout in this session
  const [justCompletedWorkoutId, setJustCompletedWorkoutId] = useState<string | null>(null);
  const [showCompletionView, setShowCompletionView] = useState(false);
  const [completionDismissed, setCompletionDismissed] = useState(false);
  const [showStats, setShowStats] = useState(false);

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

  // Determine which workout to display
  // Show completion view if:
  // 1. User just completed a workout this session (showCompletionView is true), OR
  // 2. Most recent completed workout was today and user hasn't dismissed it
  const shouldShowCompletedWorkout = (): boolean => {
    // If user dismissed the completion view, don't show it
    if (completionDismissed) return false;
    
    // If user just completed a workout this session
    if (showCompletionView && justCompletedWorkoutId) return true;
    
    // If workout was completed today (on app reopen)
    if (lastCompletedWorkout?.completedAt && isToday(new Date(lastCompletedWorkout.completedAt))) {
      return true;
    }
    
    return false;
  };

  // The workout to display in the UI
  const displayWorkout = shouldShowCompletedWorkout() ? lastCompletedWorkout : nextPendingWorkout;
  const isShowingCompletedWorkout = shouldShowCompletedWorkout();

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

  // Handler to proceed to next workout after viewing completion
  const handleProceedToNextWorkout = () => {
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
      
      // Determine which mode to show based on exercise type and set type
      if (exercise.measurementType === 'time') {
        if (set.isMaxTest) {
          // Time-based max test: show stopwatch
          setShowStopwatchMode(true);
          setShowTimerMode(false);
        } else {
          // Regular time-based set: show countdown timer
          setShowTimerMode(true);
          setShowStopwatchMode(false);
        }
      } else {
        // Rep-based: show form
        setShowTimerMode(false);
        setShowStopwatchMode(false);
      }
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
      setEditReps(completedSet.actualReps);
      setEditWeight(completedSet.weight?.toString() || '');
      setEditNotes(completedSet.notes || '');
    }
  };

  // Save edited completed set
  const handleSaveEditedSet = async () => {
    if (!editingCompletedSet) return;
    
    setIsSavingEdit(true);
    try {
      const weightValue = editWeight ? parseFloat(editWeight) : undefined;
      await CompletedSetRepo.update(editingCompletedSet.completedSet.id, {
        actualReps: editReps,
        weight: weightValue,
        notes: editNotes
      });
      setEditingCompletedSet(null);
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Delete a completed set (to redo it)
  const handleDeleteCompletedSet = async () => {
    if (!editingCompletedSet) return;
    
    setIsSavingEdit(true);
    try {
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
      
      setEditingCompletedSet(null);
    } finally {
      setIsSavingEdit(false);
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
        setShowTimerMode(false);
        setShowStopwatchMode(false);
      } else if (selectedExercise) {
        await CompletedSetRepo.create({
          exerciseId: selectedExercise.id,
          reps,
          weight,
          notes,
          parameters
        });
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
        {/* No Active Cycle */}
        {!activeCycle && (
          <Card className="p-4 border-primary-200 dark:border-primary-800 bg-primary-50 dark:bg-primary-900/20">
            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-primary-600 dark:text-primary-400 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-medium text-gray-900 dark:text-gray-100">
                  No Active Cycle
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Create a training cycle to get scheduled workouts with RFEM-based rep targets.
                </p>
                <Button 
                  size="sm" 
                  className="mt-3"
                  onClick={() => setShowCycleTypeSelector(true)}
                >
                  Create Cycle
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Cycle Progress or Cycle Complete */}
        {activeCycle && cycleProgress && (
          <>
            {/* Cycle Complete - show when all workouts are done (including when viewing the last completed workout) */}
            {cycleProgress.passed === cycleProgress.total && cycleProgress.total > 0 ? (
              <Card className="p-4 text-center">
                <p className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                  🎉 Cycle Complete!
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  You've completed {activeCycle.name}
                  {cycleProgress.skipped > 0 
                    ? ` (${cycleProgress.completed} completed, ${cycleProgress.skipped} skipped)`
                    : ` — all ${cycleProgress.total} workouts done!`
                  }
                </p>
                <Button onClick={() => setShowCycleTypeSelector(true)}>
                  Start New Cycle
                </Button>
              </Card>
            ) : displayWorkout && !isShowingCompletedWorkout ? (
              /* Compact Cycle Progress - show when there's an active workout */
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">
                  {activeCycle.name}
                </span>
                <span className="text-gray-500 dark:text-gray-400">
                  Workout {cycleProgress.passed + 1} of {cycleProgress.total}
                </span>
              </div>
            ) : null}
          </>
        )}

        {/* Current/Completed Workout */}
        {displayWorkout && (
          <Card className="overflow-hidden">
            {/* Completion celebration banner */}
            {isShowingCompletedWorkout && (
              <div className="px-4 py-4 bg-green-50 dark:bg-green-900/20 border-b border-green-100 dark:border-green-800 text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <PartyPopper className="w-5 h-5 text-green-600 dark:text-green-400" />
                  <h2 className="font-semibold text-green-700 dark:text-green-300">
                    Workout Complete!
                  </h2>
                  <PartyPopper className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <p className="text-sm text-green-600 dark:text-green-400">
                  Great job finishing {currentGroup?.name} #{displayWorkout.sequenceNumber}
                </p>
              </div>
            )}

            <div className={`px-4 py-3 border-b ${isShowingCompletedWorkout 
              ? 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700' 
              : 'bg-primary-50 dark:bg-primary-900/20 border-primary-100 dark:border-primary-800'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-semibold text-gray-900 dark:text-gray-100">
                    {currentGroup?.name || 'Workout'} 
                    <span className="text-sm font-normal text-gray-500 dark:text-gray-400 ml-2">
                      #{displayWorkout.sequenceNumber}
                    </span>
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Week {displayWorkout.weekNumber} • RFEM -{displayWorkout.rfem}
                  </p>
                </div>
                <div className="text-right">
                  <p className={`text-gym-xl ${isShowingCompletedWorkout 
                    ? 'text-green-600 dark:text-green-400' 
                    : 'text-primary-600 dark:text-primary-400'
                  }`}>
                    {scheduledSetsCompleted.length}/{displayWorkout.scheduledSets.length}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">sets done</p>
                </div>
              </div>
            </div>

            {/* Remaining sets (only show if not viewing completed workout) */}
            {!isShowingCompletedWorkout && scheduledSetsRemaining.length > 0 && (
              <div className="p-3 space-y-4">
                {/* Swipe hint - only show once */}
                {scheduledSetsRemaining.length > 0 && scheduledSetsCompleted.length === 0 && (
                  <p className="text-xs text-gray-400 dark:text-gray-500 text-center mb-1">
                    Swipe right to complete • Swipe left to skip • Tap for details
                  </p>
                )}
                {groupedSetsRemaining.map(group => (
                  <div key={group.type}>
                    <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                      {EXERCISE_TYPE_LABELS[group.type]}
                    </h4>
                    <div className="space-y-2">
                      {group.sets.map(set => {
                        const exercise = exerciseMap.get(set.exerciseId);
                        if (!exercise) return null;
                        const targetReps = getTargetReps(set, displayWorkout);
                        const isMaxTestSet = set.isMaxTest;
                        const isWarmupSet = set.isWarmup;

                        return (
                          <SwipeableSetCard
                            key={set.id}
                            onSwipeRight={() => handleQuickComplete(set)}
                            onSwipeLeft={() => handleInitiateSkipSet(set)}
                            onTap={() => handleSelectScheduledSet(set)}
                          >
                            <div className="flex items-center gap-4 p-4 text-left">
                              <Circle className="w-6 h-6 text-gray-300 dark:text-gray-600 flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="text-lg font-medium text-gray-900 dark:text-gray-100 truncate">
                                  {exercise.name}
                                </p>
                                <div className="flex items-center gap-2 mt-1">
                                  {isWarmupSet && (
                                    <span className="text-xs px-1.5 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded">
                                      Warmup
                                    </span>
                                  )}
                                  {isMaxTestSet && (
                                    <span className="text-xs px-1.5 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded">
                                      Max Test
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="flex flex-col items-end">
                                <span className={`text-gym-2xl ${isMaxTestSet ? 'text-purple-600 dark:text-purple-400' : 'text-primary-600 dark:text-primary-400'}`}>
                                  {isMaxTestSet ? 'MAX' : exercise.measurementType === 'time' ? formatTime(targetReps) : targetReps}
                                </span>
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  {isMaxTestSet ? 'go all out' : isWarmupSet ? 'warmup' : set.isConditioning ? 'cond' : exercise.measurementType === 'time' ? 'hold' : 'reps'}
                                </span>
                              </div>
                            </div>
                          </SwipeableSetCard>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Completed sets */}
            {scheduledSetsCompleted.length > 0 && (
              <div className={`p-3 ${!isShowingCompletedWorkout && 'border-t border-gray-100 dark:border-gray-800'}`}>
                {!isShowingCompletedWorkout && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Completed (tap to edit)</p>
                )}
                <div className="space-y-4">
                  {groupedSetsCompleted.map(group => (
                    <div key={group.type}>
                      <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                        {EXERCISE_TYPE_LABELS[group.type]}
                      </h4>
                      <div className="space-y-2">
                        {group.sets.map(set => {
                          const exercise = exerciseMap.get(set.exerciseId);
                          const completedSet = workoutCompletedSets?.find(s => s.scheduledSetId === set.id);
                          if (!exercise || !completedSet) return null;
                          
                          const wasSkipped = completedSet.actualReps === 0 && completedSet.notes === 'Skipped';
                          const hasWeight = completedSet.weight !== undefined && completedSet.weight > 0;

                          return (
                            <button
                              key={set.id}
                              onClick={() => handleEditCompletedSet(completedSet)}
                              className={`w-full flex items-center gap-4 p-3 rounded-lg transition-colors text-left ${
                                wasSkipped 
                                  ? 'bg-orange-50 dark:bg-orange-900/20 hover:bg-orange-100 dark:hover:bg-orange-900/30'
                                  : 'bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30'
                              }`}
                            >
                              <CheckCircle className={`w-5 h-5 flex-shrink-0 ${
                                wasSkipped ? 'text-orange-500' : 'text-green-500'
                              }`} />
                              <span className="text-base text-gray-700 dark:text-gray-300 truncate flex-1">
                                {exercise.name}
                              </span>
                              <div className="flex items-baseline gap-1">
                                <span className={`text-gym-xl ${
                                  wasSkipped 
                                    ? 'text-orange-600 dark:text-orange-400'
                                    : 'text-green-600 dark:text-green-400'
                                }`}>
                                  {wasSkipped ? '—' : completedSet.actualReps}
                                </span>
                                {hasWeight && !wasSkipped && (
                                  <span className="text-sm text-purple-600 dark:text-purple-400">
                                    +{completedSet.weight}
                                  </span>
                                )}
                              </div>
                              <Edit2 className="w-3 h-3 text-gray-400" />
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Continue to next workout button (when showing completed workout) */}
            {isShowingCompletedWorkout && nextPendingWorkout && (
              <div className="p-4 border-t border-gray-100 dark:border-gray-800">
                <Button 
                  className="w-full"
                  onClick={handleProceedToNextWorkout}
                >
                  Continue to Next Workout
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            )}

            {/* Skip / End Workout buttons (only when actively working out) */}
            {!isShowingCompletedWorkout && scheduledSetsRemaining.length > 0 && (
              <div className="p-3 border-t border-gray-100 dark:border-gray-800 flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex-1 text-gray-500"
                  onClick={() => setShowSkipConfirm(true)}
                >
                  <SkipForward className="w-4 h-4 mr-1" />
                  Skip Workout
                </Button>
                {scheduledSetsCompleted.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex-1 text-gray-500"
                    onClick={() => setShowEndConfirm(true)}
                  >
                    <StopCircle className="w-4 h-4 mr-1" />
                    End Early
                  </Button>
                )}
              </div>
            )}
          </Card>
        )}

        {/* Collapsible Stats Summary */}
        {todayStats.totalSets > 0 && (
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
            <button
              onClick={() => setShowStats(!showStats)}
              className="w-full flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
            >
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                <span>Today's Stats</span>
                <span className="text-gray-400 dark:text-gray-500">
                  • {todayStats.totalSets} sets • {todayStats.totalReps} reps
                </span>
              </div>
              {showStats ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>
            
            {showStats && (
              <Card className="p-4 mt-3">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {todayStats.totalSets}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Sets Today</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {todayStats.totalReps}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Reps to Date</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {new Set(todaysSets?.map(s => s.exerciseId)).size}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Exercises</p>
                  </div>
                </div>
                
                {/* Ad-hoc completed sets shown in expanded view */}
                {todaysSets && todaysSets.filter(s => !s.scheduledSetId).length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 space-y-2">
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Additional Sets
                    </h3>
                    {todaysSets.filter(s => !s.scheduledSetId).map(set => (
                      <CompletedSetCard 
                        key={set.id} 
                        completedSet={set} 
                        exercise={exerciseMap.get(set.exerciseId)}
                      />
                    ))}
                  </div>
                )}
              </Card>
            )}
          </div>
        )}

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
      <Modal
        isOpen={showExercisePicker}
        onClose={() => setShowExercisePicker(false)}
        title="Select Exercise"
        size="lg"
      >
        {exercises && exercises.length > 0 ? (
          <div className="space-y-2">
            {exercises.map(exercise => (
              <ExerciseCard
                key={exercise.id}
                exercise={exercise}
                onClick={() => handleSelectExercise(exercise)}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Dumbbell}
            title="No exercises yet"
            description="Add some exercises first to start logging sets."
            action={
              <Button onClick={() => { setShowExercisePicker(false); navigate('/exercises'); }}>
                Add Exercises
              </Button>
            }
          />
        )}
      </Modal>

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
      <Modal
        isOpen={!!selectedScheduledSet}
        onClose={() => { setSelectedScheduledSet(null); setShowTimerMode(false); setShowStopwatchMode(false); }}
        title={
          selectedScheduledSet?.set.isMaxTest 
            ? (showStopwatchMode ? "Max Test" : "Record Max")
            : showTimerMode 
              ? "Timed Hold" 
              : "Complete Set"
        }
      >
        {selectedScheduledSet && (() => {
          const exercise = exerciseMap.get(selectedScheduledSet.set.exerciseId);
          if (!exercise) return null;
          
          // Show stopwatch for time-based max tests
          if (showStopwatchMode && exercise.measurementType === 'time' && selectedScheduledSet.set.isMaxTest) {
            return (
              <ExerciseStopwatch
                exerciseName={exercise.name}
                previousMax={selectedScheduledSet.set.previousMaxReps}
                onRecordMax={(seconds) => {
                  handleLogSet(seconds, '', {}, undefined);
                }}
                onCancel={() => { setSelectedScheduledSet(null); setShowStopwatchMode(false); }}
                onSkipToLog={() => setShowStopwatchMode(false)}
              />
            );
          }
          
          // Show timer for time-based exercises (non-max test)
          if (showTimerMode && exercise.measurementType === 'time') {
            return (
              <ExerciseTimer
                targetSeconds={selectedScheduledSet.targetReps}
                exerciseName={exercise.name}
                onComplete={(actualSeconds) => {
                  handleLogSet(actualSeconds, '', {}, undefined);
                }}
                onCancel={() => { setSelectedScheduledSet(null); setShowTimerMode(false); setShowStopwatchMode(false); }}
                onSkipToLog={() => setShowTimerMode(false)}
              />
            );
          }
          
          // Show form for manual entry
          return (
            <QuickLogForm
              exercise={exercise}
              suggestedReps={selectedScheduledSet.targetReps}
              isMaxTest={selectedScheduledSet.set.isMaxTest}
              onSubmit={handleLogSet}
              onCancel={() => { setSelectedScheduledSet(null); setShowTimerMode(false); setShowStopwatchMode(false); }}
              isLoading={isLogging}
            />
          );
        })()}
      </Modal>

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
      <Modal
        isOpen={showSkipConfirm}
        onClose={() => setShowSkipConfirm(false)}
        title="Skip Workout"
      >
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            Are you sure you want to skip this workout? It will be marked as skipped and you'll move on to the next workout.
          </p>
          <div className="flex gap-3">
            <Button 
              variant="secondary" 
              onClick={() => setShowSkipConfirm(false)} 
              className="flex-1"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSkipWorkout}
              className="flex-1"
            >
              Skip Workout
            </Button>
          </div>
        </div>
      </Modal>

      {/* End Workout Early Confirmation */}
      <Modal
        isOpen={showEndConfirm}
        onClose={() => setShowEndConfirm(false)}
        title="End Workout Early"
      >
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            You've completed {scheduledSetsCompleted.length} of {displayWorkout?.scheduledSets.length || 0} sets. 
            End this workout and move on to the next one?
          </p>
          <div className="flex gap-3">
            <Button 
              variant="secondary" 
              onClick={() => setShowEndConfirm(false)} 
              className="flex-1"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleEndWorkout}
              className="flex-1"
            >
              End Workout
            </Button>
          </div>
        </div>
      </Modal>

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
      <Modal
        isOpen={!!setToSkip}
        onClose={() => setSetToSkip(null)}
        title="Skip Set?"
      >
        {setToSkip && (
          <div className="space-y-4">
            <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
              <p className="font-medium text-gray-900 dark:text-gray-100">
                {exerciseMap.get(setToSkip.set.exerciseId)?.name}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Target: {setToSkip.targetReps} reps
              </p>
            </div>
            <p className="text-gray-600 dark:text-gray-400">
              Are you sure you want to skip this set? It will be marked as skipped with 0 reps.
            </p>
            <div className="flex gap-3">
              <Button 
                variant="secondary" 
                onClick={() => setSetToSkip(null)} 
                className="flex-1"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleConfirmSkipSet}
                className="flex-1 bg-orange-500 hover:bg-orange-600"
              >
                Skip Set
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Edit Completed Set Modal */}
      <Modal
        isOpen={!!editingCompletedSet}
        onClose={() => setEditingCompletedSet(null)}
        title="Edit Completed Set"
      >
        {editingCompletedSet && (
          <div className="space-y-4">
            <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
              <p className="font-medium text-gray-900 dark:text-gray-100">
                {editingCompletedSet.exercise.name}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Target was {editingCompletedSet.completedSet.targetReps} reps
              </p>
            </div>

            <NumberInput
              label="Actual Reps"
              value={editReps}
              onChange={setEditReps}
              min={0}
            />

            {/* Weight Input - only show if exercise has weight tracking enabled */}
            {editingCompletedSet.exercise.weightEnabled && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Added Weight (lbs)
                </label>
                <input
                  type="number"
                  min={0}
                  step={0.5}
                  value={editWeight}
                  onChange={(e) => setEditWeight(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Bodyweight if blank"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Notes
              </label>
              <textarea
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                rows={2}
                placeholder="Optional notes..."
              />
            </div>

            <div className="flex gap-3">
              <Button 
                variant="ghost" 
                onClick={handleDeleteCompletedSet}
                disabled={isSavingEdit}
                className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
              >
                Undo & Redo
              </Button>
              <Button 
                variant="secondary" 
                onClick={() => setEditingCompletedSet(null)} 
                className="flex-1"
                disabled={isSavingEdit}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSaveEditedSet}
                className="flex-1"
                disabled={isSavingEdit}
              >
                {isSavingEdit ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </div>
        )}
      </Modal>

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
    </>
  );
}
