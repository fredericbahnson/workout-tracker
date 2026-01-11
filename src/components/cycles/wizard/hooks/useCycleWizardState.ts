/**
 * useCycleWizardState Hook
 * 
 * Manages all state and business logic for the CycleWizard component.
 * Extracts state management from the UI for better separation of concerns.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { ExerciseRepo, CycleRepo, ScheduledWorkoutRepo } from '@/data/repositories';
import { generateSchedule, validateCycle } from '@/services/scheduler';
import { generateId } from '@/data/db';
import { useSyncedPreferences } from '@/contexts';
import { createScopedLogger } from '@/utils/logger';
import { getProgressionMode } from '@/types';
import type { 
  Cycle, 
  Group, 
  Exercise, 
  ExerciseAssignment, 
  ExerciseType, 
  ProgressionMode,
  ExerciseCycleDefaults
} from '@/types';
import { 
  type WizardStep, 
  type EditMode, 
  type ValidationResult,
  getStepsForMode 
} from '../types';

const log = createScopedLogger('CycleWizard');

interface UseCycleWizardStateProps {
  editCycle?: Cycle;
  initialProgressionMode?: ProgressionMode;
  onComplete: () => void;
}

export function useCycleWizardState({ 
  editCycle, 
  initialProgressionMode, 
  onComplete 
}: UseCycleWizardStateProps) {
  const { preferences } = useSyncedPreferences();
  
  // Create defaults object from preferences for backward compatibility with child components
  const defaults = useMemo(() => ({
    defaultConditioningReps: preferences.defaultConditioningReps,
  }), [preferences.defaultConditioningReps]);

  // Progression mode - from props, edit cycle, or default to 'rfem'
  const [progressionMode] = useState<ProgressionMode>(
    () => editCycle ? getProgressionMode(editCycle) : (initialProgressionMode || 'rfem')
  );

  // Get the appropriate steps for the current mode
  const STEPS = useMemo(() => getStepsForMode(progressionMode), [progressionMode]);

  // Skip 'start' step if editing an existing cycle or if mode was pre-selected
  const [currentStep, setCurrentStep] = useState<WizardStep>(
    editCycle || initialProgressionMode ? 'basics' : 'start'
  );
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Edit mode: 'continue' keeps completed workouts, 'restart' regenerates everything
  const [editMode, setEditMode] = useState<EditMode>(null);
  const [showEditModeChoice, setShowEditModeChoice] = useState(false);

  // Form state - use edit cycle values or defaults from settings
  const [name, setName] = useState(editCycle?.name || '');
  const [startDate, setStartDate] = useState(() => {
    if (editCycle) {
      return new Date(editCycle.startDate).toISOString().split('T')[0];
    }
    return new Date().toISOString().split('T')[0];
  });
  const [numberOfWeeks, setNumberOfWeeks] = useState(editCycle?.numberOfWeeks || 4);
  const [workoutDaysPerWeek, setWorkoutDaysPerWeek] = useState(editCycle?.workoutDaysPerWeek || 5);
  const [groups, setGroups] = useState<Group[]>(editCycle?.groups || []);
  const [weeklySetGoals, setWeeklySetGoals] = useState<Record<ExerciseType, number>>(() =>
    editCycle?.weeklySetGoals || { ...preferences.weeklySetGoals }
  );
  const [groupRotation, setGroupRotation] = useState<string[]>(editCycle?.groupRotation || []);
  const [rfemRotation, setRfemRotation] = useState<number[]>(editCycle?.rfemRotation || [4, 3, 2]);
  const [conditioningWeeklyRepIncrement, setConditioningWeeklyRepIncrement] = useState(
    editCycle?.conditioningWeeklyRepIncrement || preferences.conditioningWeeklyIncrement
  );

  // Warmup settings
  const [includeWarmupSets, setIncludeWarmupSets] = useState<boolean>(() => {
    if (editCycle) return editCycle.includeWarmupSets ?? false;
    return false;
  });
  const [includeTimedWarmups, setIncludeTimedWarmups] = useState<boolean>(() => {
    if (editCycle) return editCycle.includeTimedWarmups ?? false;
    return false;
  });

  // Data queries
  const exercises = useLiveQuery(() => ExerciseRepo.getAll(), []);
  const allCycles = useLiveQuery(() => CycleRepo.getAll(), []);
  const cycleProgress = useLiveQuery(async () => {
    if (!editCycle) return null;
    return ScheduledWorkoutRepo.getCycleProgress(editCycle.id);
  }, [editCycle?.id]);

  // Exercise map for quick lookups
  const exerciseMap = useMemo(
    () => new Map(exercises?.map(e => [e.id, e]) || []),
    [exercises]
  );

  // Smart defaults from most recent completed cycle (for new cycles only)
  useEffect(() => {
    if (editCycle || !allCycles || !initialProgressionMode) return;

    const recentCycle = allCycles
      .filter(c => c.cycleType === 'training' && c.status === 'completed')
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())[0];

    if (recentCycle) {
      setIncludeWarmupSets(recentCycle.includeWarmupSets ?? false);
      setIncludeTimedWarmups(recentCycle.includeTimedWarmups ?? false);
    }
  }, [allCycles, editCycle, initialProgressionMode]);

  // Count completed training cycles for naming
  const completedTrainingCycleCount = useMemo(() =>
    allCycles?.filter(c => c.cycleType !== 'max_testing' && c.status === 'completed').length || 0,
    [allCycles]
  );

  // Generate default name for new cycle
  const getDefaultCycleName = useCallback(
    () => `Workout Cycle ${completedTrainingCycleCount + 1}`,
    [completedTrainingCycleCount]
  );

  // Clone from a previous cycle
  const handleCloneFromCycle = useCallback((sourceCycle: Cycle) => {
    const groupIdMap = new Map<string, string>();
    const clonedGroups: Group[] = sourceCycle.groups.map(g => {
      const newId = generateId();
      groupIdMap.set(g.id, newId);
      return {
        id: newId,
        name: g.name,
        exerciseAssignments: g.exerciseAssignments.map(a => ({ ...a }))
      };
    });

    const clonedGroupRotation = sourceCycle.groupRotation.map(
      oldId => groupIdMap.get(oldId) || oldId
    );

    setGroups(clonedGroups);
    setGroupRotation(clonedGroupRotation);
    setWeeklySetGoals({ ...sourceCycle.weeklySetGoals });
    setRfemRotation([...sourceCycle.rfemRotation]);
    setNumberOfWeeks(sourceCycle.numberOfWeeks);
    setWorkoutDaysPerWeek(sourceCycle.workoutDaysPerWeek);
    setConditioningWeeklyRepIncrement(sourceCycle.conditioningWeeklyRepIncrement);
    setIncludeWarmupSets(sourceCycle.includeWarmupSets ?? false);
    setIncludeTimedWarmups(sourceCycle.includeTimedWarmups ?? false);
    setName(getDefaultCycleName());
    setCurrentStep('basics');
  }, [getDefaultCycleName]);

  // Start fresh with default groups
  const handleStartFresh = useCallback(() => {
    if (exercises) {
      const defaultGroups: Group[] = ['A', 'B', 'C'].map(letter => ({
        id: generateId(),
        name: `Group ${letter}`,
        exerciseAssignments: []
      }));
      setGroups(defaultGroups);
      setGroupRotation(defaultGroups.map(g => g.id));
    }
    setName(getDefaultCycleName());
    setNumberOfWeeks(4);
    setWorkoutDaysPerWeek(5);
    setRfemRotation([4, 3, 2]);
    setWeeklySetGoals({ ...preferences.weeklySetGoals });
    setConditioningWeeklyRepIncrement(preferences.conditioningWeeklyIncrement);
    setCurrentStep('basics');
  }, [exercises, preferences, getDefaultCycleName]);

  // Initialize default groups when exercises load
  useEffect(() => {
    if (exercises && groups.length === 0 && !editCycle && currentStep !== 'start') {
      const defaultGroups: Group[] = ['A', 'B', 'C'].map(letter => ({
        id: generateId(),
        name: `Group ${letter}`,
        exerciseAssignments: []
      }));
      setGroups(defaultGroups);
      setGroupRotation(defaultGroups.map(g => g.id));
    }
  }, [exercises, currentStep, groups.length, editCycle]);

  // Auto-clone the most recent training cycle if available
  useEffect(() => {
    if (editCycle || currentStep !== 'start' || !allCycles) return;

    const trainingCycles = allCycles
      .filter(c => c.cycleType !== 'max_testing')
      .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());

    if (trainingCycles.length > 0) {
      const sourceCycle = trainingCycles[0];
      const groupIdMap = new Map<string, string>();
      const clonedGroups: Group[] = sourceCycle.groups.map(g => {
        const newId = generateId();
        groupIdMap.set(g.id, newId);
        return {
          id: newId,
          name: g.name,
          exerciseAssignments: g.exerciseAssignments.map(a => ({ ...a }))
        };
      });

      const clonedGroupRotation = sourceCycle.groupRotation.map(
        oldId => groupIdMap.get(oldId) || oldId
      );

      const completedCount = allCycles.filter(
        c => c.cycleType !== 'max_testing' && c.status === 'completed'
      ).length;

      setGroups(clonedGroups);
      setGroupRotation(clonedGroupRotation);
      setWeeklySetGoals({ ...sourceCycle.weeklySetGoals });
      setRfemRotation([...sourceCycle.rfemRotation]);
      setNumberOfWeeks(sourceCycle.numberOfWeeks);
      setWorkoutDaysPerWeek(sourceCycle.workoutDaysPerWeek);
      setConditioningWeeklyRepIncrement(sourceCycle.conditioningWeeklyRepIncrement);
      setName(`Workout Cycle ${completedCount + 1}`);
      setCurrentStep('basics');
    }
  }, [allCycles, editCycle, currentStep]);

  // Validation
  const validation: ValidationResult = useMemo(() => {
    if (!exercises) {
      return { valid: false, errors: ['Loading...'], warnings: [] };
    }
    return validateCycle(
      {
        name,
        cycleType: 'training',
        progressionMode,
        startDate: new Date(startDate),
        numberOfWeeks,
        workoutDaysPerWeek,
        weeklySetGoals,
        groups,
        groupRotation,
        rfemRotation,
        conditioningWeeklyRepIncrement,
        status: 'planning'
      },
      exerciseMap
    );
  }, [
    exercises, name, progressionMode, startDate, numberOfWeeks, 
    workoutDaysPerWeek, weeklySetGoals, groups, groupRotation, 
    rfemRotation, conditioningWeeklyRepIncrement, exerciseMap
  ]);

  // Can proceed to next step?
  const canProceed = useCallback((): boolean => {
    switch (currentStep) {
      case 'basics':
        return !!(name.trim() && numberOfWeeks >= 1 && workoutDaysPerWeek >= 1);
      case 'groups':
        return groups.length > 0 && groups.some(g => g.exerciseAssignments.length > 0);
      case 'progression':
        return groups.every(g =>
          g.exerciseAssignments.every(a => {
            const exercise = exerciseMap.get(a.exerciseId);
            if (!exercise) return true;
            const isTimeBased = exercise.measurementType === 'time';
            return isTimeBased
              ? (a.simpleBaseTime !== undefined && a.simpleBaseTime > 0)
              : (a.simpleBaseReps !== undefined && a.simpleBaseReps > 0);
          })
        );
      case 'goals':
        if (progressionMode === 'simple') {
          return groupRotation.length > 0;
        }
        return groupRotation.length > 0 && rfemRotation.length > 0;
      case 'review':
        return validation.valid;
      default:
        return false;
    }
  }, [currentStep, name, numberOfWeeks, workoutDaysPerWeek, groups, exerciseMap, progressionMode, groupRotation, rfemRotation, validation]);

  // Navigation
  const nextStep = useCallback(() => {
    const stepIndex = STEPS.findIndex(s => s.key === currentStep);
    if (stepIndex < STEPS.length - 1) {
      setCurrentStep(STEPS[stepIndex + 1].key);
    }
  }, [STEPS, currentStep]);

  const prevStep = useCallback(() => {
    const stepIndex = STEPS.findIndex(s => s.key === currentStep);
    if (stepIndex > 0) {
      setCurrentStep(STEPS[stepIndex - 1].key);
    }
  }, [STEPS, currentStep]);

  // Group management
  const addGroup = useCallback(() => {
    const newGroup: Group = {
      id: generateId(),
      name: `Group ${String.fromCharCode(65 + groups.length)}`,
      exerciseAssignments: []
    };
    setGroups(prev => [...prev, newGroup]);
    setGroupRotation(prev => [...prev, newGroup.id]);
  }, [groups.length]);

  const removeGroup = useCallback((groupId: string) => {
    setGroups(prev => prev.filter(g => g.id !== groupId));
    setGroupRotation(prev => prev.filter(id => id !== groupId));
  }, []);

  const updateGroupName = useCallback((groupId: string, newName: string) => {
    setGroups(prev => prev.map(g => g.id === groupId ? { ...g, name: newName } : g));
  }, []);

  const addExerciseToGroup = useCallback((groupId: string, exerciseId: string) => {
    const exercise = exerciseMap.get(exerciseId);
    const assignment: ExerciseAssignment = {
      exerciseId,
      conditioningBaseReps: exercise?.mode === 'conditioning'
        ? (exercise.defaultConditioningReps || preferences.defaultConditioningReps)
        : undefined
    };

    setGroups(prev => prev.map(g => {
      if (g.id !== groupId) return g;
      if (g.exerciseAssignments.some(a => a.exerciseId === exerciseId)) return g;
      return { ...g, exerciseAssignments: [...g.exerciseAssignments, assignment] };
    }));
  }, [exerciseMap, preferences.defaultConditioningReps]);

  const removeExerciseFromGroup = useCallback((groupId: string, exerciseId: string) => {
    setGroups(prev => prev.map(g => {
      if (g.id !== groupId) return g;
      return {
        ...g,
        exerciseAssignments: g.exerciseAssignments.filter(a => a.exerciseId !== exerciseId)
      };
    }));
  }, []);

  const updateConditioningReps = useCallback((groupId: string, exerciseId: string, reps: number) => {
    setGroups(prev => prev.map(g => {
      if (g.id !== groupId) return g;
      return {
        ...g,
        exerciseAssignments: g.exerciseAssignments.map(a =>
          a.exerciseId === exerciseId ? { ...a, conditioningBaseReps: reps } : a
        )
      };
    }));
  }, []);

  const updateAssignment = useCallback((
    groupId: string,
    exerciseId: string,
    updates: Partial<ExerciseAssignment>
  ) => {
    setGroups(prev => prev.map(g => {
      if (g.id !== groupId) return g;
      return {
        ...g,
        exerciseAssignments: g.exerciseAssignments.map(a =>
          a.exerciseId === exerciseId ? { ...a, ...updates } : a
        )
      };
    }));
  }, []);

  // Save last cycle settings for each exercise
  const saveLastCycleSettings = useCallback(async (
    cycleGroups: Group[],
    cycleProgressionMode: ProgressionMode,
    exerciseMapRef: Map<string, Exercise>
  ) => {
    const isMixed = cycleProgressionMode === 'mixed';
    const isSimple = cycleProgressionMode === 'simple';

    for (const group of cycleGroups) {
      for (const assignment of group.exerciseAssignments) {
        const exercise = exerciseMapRef.get(assignment.exerciseId);
        if (!exercise) continue;

        let effectiveMode: 'rfem' | 'simple';
        if (isMixed) {
          effectiveMode = assignment.progressionMode || 'rfem';
        } else if (isSimple) {
          effectiveMode = 'simple';
        } else {
          effectiveMode = 'rfem';
        }

        const settings: ExerciseCycleDefaults = {
          progressionMode: effectiveMode,
          conditioningRepIncrement: assignment.conditioningRepIncrement,
          conditioningTimeIncrement: assignment.conditioningTimeIncrement,
          simpleBaseReps: assignment.simpleBaseReps,
          simpleBaseTime: assignment.simpleBaseTime,
          simpleBaseWeight: assignment.simpleBaseWeight,
          simpleRepProgressionType: assignment.simpleRepProgressionType,
          simpleRepIncrement: assignment.simpleRepIncrement,
          simpleTimeProgressionType: assignment.simpleTimeProgressionType,
          simpleTimeIncrement: assignment.simpleTimeIncrement,
          simpleWeightProgressionType: assignment.simpleWeightProgressionType,
          simpleWeightIncrement: assignment.simpleWeightIncrement,
        };

        await ExerciseRepo.updateLastCycleSettings(assignment.exerciseId, settings);
      }
    }
  }, []);

  // Create/Save cycle
  const handleCreate = useCallback(async () => {
    if (!exercises) return;

    // If editing a cycle with progress and user hasn't made a choice, show the choice modal
    if (editCycle && cycleProgress && cycleProgress.passed > 0 && editMode === null) {
      setShowEditModeChoice(true);
      return;
    }

    setIsCreating(true);
    setError(null);

    try {
      let cycle: Cycle;

      if (editCycle) {
        const updatedCycle = {
          ...editCycle,
          name,
          progressionMode,
          startDate: new Date(startDate),
          numberOfWeeks,
          workoutDaysPerWeek,
          weeklySetGoals,
          groups,
          groupRotation,
          rfemRotation,
          conditioningWeeklyRepIncrement,
          includeWarmupSets,
          includeTimedWarmups,
          updatedAt: new Date()
        };
        await CycleRepo.update(editCycle.id, updatedCycle);
        cycle = updatedCycle;

        if (editMode === 'continue') {
          const allWorkouts = await ScheduledWorkoutRepo.getByCycleId(editCycle.id);
          const pendingWorkoutIds = allWorkouts
            .filter(w => w.status === 'pending' || w.status === 'partial')
            .map(w => w.id);

          for (const id of pendingWorkoutIds) {
            await ScheduledWorkoutRepo.delete(id);
          }

          const remainingWorkouts = await ScheduledWorkoutRepo.getByCycleId(editCycle.id);
          const maxExistingSequence = remainingWorkouts.reduce(
            (max, w) => Math.max(max, w.sequenceNumber),
            0
          );

          const scheduleInput = {
            cycle,
            exercises: exerciseMap,
            startFromWorkout: maxExistingSequence + 1
          };

          const workouts = generateSchedule(scheduleInput);
          await ScheduledWorkoutRepo.bulkCreate(workouts);
        } else {
          await ScheduledWorkoutRepo.deleteByCycleId(editCycle.id);

          const scheduleInput = {
            cycle,
            exercises: exerciseMap
          };

          const workouts = generateSchedule(scheduleInput);
          await ScheduledWorkoutRepo.bulkCreate(workouts);
        }
      } else {
        cycle = await CycleRepo.create({
          name,
          cycleType: 'training',
          progressionMode,
          startDate: new Date(startDate),
          numberOfWeeks,
          workoutDaysPerWeek,
          weeklySetGoals,
          groups,
          groupRotation,
          rfemRotation,
          conditioningWeeklyRepIncrement,
          includeWarmupSets,
          includeTimedWarmups,
          status: 'active'
        });

        const scheduleInput = {
          cycle,
          exercises: exerciseMap
        };

        const workouts = generateSchedule(scheduleInput);
        await ScheduledWorkoutRepo.bulkCreate(workouts);
      }

      await saveLastCycleSettings(groups, progressionMode, exerciseMap);
      onComplete();
    } catch (err) {
      log.error(err as Error);
      setError(err instanceof Error ? err.message : 'Failed to save cycle');
    } finally {
      setIsCreating(false);
    }
  }, [
    exercises, editCycle, cycleProgress, editMode, name, progressionMode,
    startDate, numberOfWeeks, workoutDaysPerWeek, weeklySetGoals, groups,
    groupRotation, rfemRotation, conditioningWeeklyRepIncrement,
    includeWarmupSets, includeTimedWarmups, exerciseMap, saveLastCycleSettings, onComplete
  ]);

  // Get cycles available for cloning
  const cloneableCycles = useMemo(() =>
    allCycles
      ?.filter(c => c.id !== editCycle?.id && c.cycleType !== 'max_testing')
      .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()) || [],
    [allCycles, editCycle?.id]
  );

  // Get steps to display (hide 'start' step from progress indicator)
  const displaySteps = useMemo(
    () => STEPS.filter(s => s.key !== 'start'),
    [STEPS]
  );

  return {
    // State
    progressionMode,
    currentStep,
    setCurrentStep,
    isCreating,
    error,
    editMode,
    setEditMode,
    showEditModeChoice,
    setShowEditModeChoice,

    // Form state
    name,
    setName,
    startDate,
    setStartDate,
    numberOfWeeks,
    setNumberOfWeeks,
    workoutDaysPerWeek,
    setWorkoutDaysPerWeek,
    groups,
    weeklySetGoals,
    setWeeklySetGoals,
    groupRotation,
    setGroupRotation,
    rfemRotation,
    setRfemRotation,
    conditioningWeeklyRepIncrement,
    setConditioningWeeklyRepIncrement,
    includeWarmupSets,
    setIncludeWarmupSets,
    includeTimedWarmups,
    setIncludeTimedWarmups,

    // Data
    exercises,
    exerciseMap,
    allCycles,
    cycleProgress,
    cloneableCycles,
    defaults,

    // Validation & Navigation
    validation,
    canProceed,
    STEPS,
    displaySteps,

    // Actions
    nextStep,
    prevStep,
    handleStartFresh,
    handleCloneFromCycle,
    handleCreate,

    // Group management
    addGroup,
    removeGroup,
    updateGroupName,
    addExerciseToGroup,
    removeExerciseFromGroup,
    updateConditioningReps,
    updateAssignment,
  };
}
