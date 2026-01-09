import { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { 
  ChevronRight, 
  ChevronLeft, 
  Plus, 
  Trash2, 
  AlertTriangle,
  Check,
  Copy
} from 'lucide-react';
import { Button, Input, NumberInput, Select, Card, Badge, Modal } from '@/components/ui';
import { ExerciseRepo, CycleRepo, ScheduledWorkoutRepo, CompletedSetRepo } from '@/data/repositories';
import { generateSchedule, validateCycle } from '@/services/scheduler';
import { generateId } from '@/data/db';
import { useAppStore } from '@/stores/appStore';
import { 
  EXERCISE_TYPES, 
  EXERCISE_TYPE_LABELS,
  PROGRESSION_INTERVAL_LABELS,
  getProgressionMode,
  type Cycle, 
  type Group, 
  type ExerciseType,
  type Exercise,
  type ExerciseAssignment,
  type ProgressionMode,
  type ProgressionInterval,
  type CompletedSet
} from '@/types';

interface CycleWizardProps {
  onComplete: () => void;
  onCancel: () => void;
  editCycle?: Cycle;  // If provided, we're editing an existing cycle
  initialProgressionMode?: ProgressionMode;  // Mode selected from CycleTypeSelector
}

type WizardStep = 'start' | 'basics' | 'groups' | 'progression' | 'goals' | 'review';

const RFEM_STEPS: { key: WizardStep; label: string }[] = [
  { key: 'start', label: 'Start' },
  { key: 'basics', label: 'Basics' },
  { key: 'groups', label: 'Groups' },
  { key: 'goals', label: 'Goals' },
  { key: 'review', label: 'Review' }
];

const SIMPLE_STEPS: { key: WizardStep; label: string }[] = [
  { key: 'start', label: 'Start' },
  { key: 'basics', label: 'Basics' },
  { key: 'groups', label: 'Groups' },
  { key: 'progression', label: 'Targets' },
  { key: 'goals', label: 'Goals' },
  { key: 'review', label: 'Review' }
];

// Mixed mode: per-exercise config happens inline in Groups step
const MIXED_STEPS: { key: WizardStep; label: string }[] = [
  { key: 'start', label: 'Start' },
  { key: 'basics', label: 'Basics' },
  { key: 'groups', label: 'Exercises' },  // Renamed to reflect per-exercise config
  { key: 'goals', label: 'Goals' },
  { key: 'review', label: 'Review' }
];

export function CycleWizard({ onComplete, onCancel, editCycle, initialProgressionMode }: CycleWizardProps) {
  const { defaults } = useAppStore();
  
  // Progression mode - from props, edit cycle, or default to 'rfem'
  const [progressionMode] = useState<ProgressionMode>(
    () => editCycle ? getProgressionMode(editCycle) : (initialProgressionMode || 'rfem')
  );
  
  // Get the appropriate steps for the current mode
  const STEPS = progressionMode === 'simple' 
    ? SIMPLE_STEPS 
    : progressionMode === 'mixed' 
      ? MIXED_STEPS 
      : RFEM_STEPS;
  
  // Skip 'start' step if editing an existing cycle or if mode was pre-selected
  const [currentStep, setCurrentStep] = useState<WizardStep>(
    editCycle || initialProgressionMode ? 'basics' : 'start'
  );
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Edit mode: 'continue' keeps completed workouts, 'restart' regenerates everything
  const [editMode, setEditMode] = useState<'continue' | 'restart' | null>(null);
  const [showEditModeChoice, setShowEditModeChoice] = useState(false);

  // Form state - use edit cycle values or defaults from settings
  const [name, setName] = useState(editCycle?.name || '');
  const [startDate, setStartDate] = useState(() => {
    if (editCycle) {
      return new Date(editCycle.startDate).toISOString().split('T')[0];
    }
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [numberOfWeeks, setNumberOfWeeks] = useState(editCycle?.numberOfWeeks || 4);
  const [workoutDaysPerWeek, setWorkoutDaysPerWeek] = useState(editCycle?.workoutDaysPerWeek || 5);
  const [groups, setGroups] = useState<Group[]>(editCycle?.groups || []);
  const [weeklySetGoals, setWeeklySetGoals] = useState<Record<ExerciseType, number>>(() => 
    editCycle?.weeklySetGoals || { ...defaults.weeklySetGoals }
  );
  const [groupRotation, setGroupRotation] = useState<string[]>(editCycle?.groupRotation || []);
  const [rfemRotation, setRfemRotation] = useState<number[]>(editCycle?.rfemRotation || [4, 3, 2]);
  const [conditioningWeeklyRepIncrement, setConditioningWeeklyRepIncrement] = useState(
    editCycle?.conditioningWeeklyRepIncrement || defaults.conditioningWeeklyIncrement
  );

  // Data queries
  const exercises = useLiveQuery(() => ExerciseRepo.getAll(), []);
  
  // Get all cycles for cloning option
  const allCycles = useLiveQuery(() => CycleRepo.getAll(), []);
  
  // Get cycle progress if editing
  const cycleProgress = useLiveQuery(async () => {
    if (!editCycle) return null;
    return ScheduledWorkoutRepo.getCycleProgress(editCycle.id);
  }, [editCycle?.id]);

  // Clone from a previous cycle
  const handleCloneFromCycle = (sourceCycle: Cycle) => {
    // Clone groups with new IDs, mapping old group IDs to new ones
    const groupIdMap = new Map<string, string>();
    const clonedGroups: Group[] = sourceCycle.groups.map(g => {
      const newId = generateId();
      groupIdMap.set(g.id, newId);
      return {
        id: newId,
        name: g.name,
        exerciseAssignments: g.exerciseAssignments.map(a => ({
          ...a
        }))
      };
    });
    
    // Update group rotation to use new IDs
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
    
    // Use default naming convention
    setName(getDefaultCycleName());
    
    // Move to basics step
    setCurrentStep('basics');
  };

  // Start fresh with default groups
  const handleStartFresh = () => {
    if (exercises) {
      const defaultGroups: Group[] = ['A', 'B', 'C'].map(letter => ({
        id: generateId(),
        name: `Group ${letter}`,
        exerciseAssignments: []
      }));
      setGroups(defaultGroups);
      setGroupRotation(defaultGroups.map(g => g.id));
    }
    // Use default naming convention
    setName(getDefaultCycleName());
    // Set default training cycle parameters
    setNumberOfWeeks(4);
    setWorkoutDaysPerWeek(5);
    setRfemRotation([4, 3, 2]);
    setWeeklySetGoals({ ...defaults.weeklySetGoals });
    setConditioningWeeklyRepIncrement(defaults.conditioningWeeklyIncrement);
    setCurrentStep('basics');
  };

  // Initialize default groups when exercises load (only if not editing and no groups yet)
  useEffect(() => {
    if (exercises && groups.length === 0 && !editCycle && currentStep !== 'start') {
      // Create default groups A, B, C
      const defaultGroups: Group[] = ['A', 'B', 'C'].map(letter => ({
        id: generateId(),
        name: `Group ${letter}`,
        exerciseAssignments: []
      }));
      setGroups(defaultGroups);
      setGroupRotation(defaultGroups.map(g => g.id));
    }
  }, [exercises, currentStep]);

  // Auto-clone the most recent training cycle if available (and not editing)
  useEffect(() => {
    if (editCycle || currentStep !== 'start' || !allCycles) return;
    
    // Get most recent training cycle
    const trainingCycles = allCycles
      .filter(c => c.cycleType !== 'max_testing')
      .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
    
    if (trainingCycles.length > 0) {
      const sourceCycle = trainingCycles[0];
      
      // Clone groups with new IDs
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
      
      // Update group rotation to use new IDs
      const clonedGroupRotation = sourceCycle.groupRotation.map(
        oldId => groupIdMap.get(oldId) || oldId
      );
      
      // Count completed training cycles for naming
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
      
      // Skip start step
      setCurrentStep('basics');
    }
  }, [allCycles, editCycle, currentStep]);

  const exerciseMap = new Map(exercises?.map(e => [e.id, e]) || []);

  // Validation
  const validation = exercises ? validateCycle(
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
  ) : { valid: false, errors: ['Loading...'], warnings: [] };

  const canProceed = () => {
    switch (currentStep) {
      case 'basics':
        return name.trim() && numberOfWeeks >= 1 && workoutDaysPerWeek >= 1;
      case 'groups':
        return groups.length > 0 && groups.some(g => g.exerciseAssignments.length > 0);
      case 'progression':
        // For simple mode, check that all exercises have base values
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
        // For simple mode, only need groupRotation
        // For RFEM mode, need both groupRotation and rfemRotation
        if (progressionMode === 'simple') {
          return groupRotation.length > 0;
        }
        return groupRotation.length > 0 && rfemRotation.length > 0;
      case 'review':
        return validation.valid;
      default:
        return false;
    }
  };

  const nextStep = () => {
    const stepIndex = STEPS.findIndex(s => s.key === currentStep);
    if (stepIndex < STEPS.length - 1) {
      setCurrentStep(STEPS[stepIndex + 1].key);
    }
  };

  const prevStep = () => {
    const stepIndex = STEPS.findIndex(s => s.key === currentStep);
    if (stepIndex > 0) {
      setCurrentStep(STEPS[stepIndex - 1].key);
    }
  };

  /**
   * Save last cycle settings for each exercise to provide smart defaults in future cycles.
   */
  const saveLastCycleSettings = async (
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
        
        // Determine effective mode for this exercise
        let effectiveMode: 'rfem' | 'simple';
        if (isMixed) {
          effectiveMode = assignment.progressionMode || 'rfem';
        } else if (isSimple) {
          effectiveMode = 'simple';
        } else {
          effectiveMode = 'rfem';
        }
        
        // Build settings object
        const settings: import('@/types').ExerciseCycleDefaults = {
          progressionMode: effectiveMode,
          // Conditioning increments
          conditioningRepIncrement: assignment.conditioningRepIncrement,
          conditioningTimeIncrement: assignment.conditioningTimeIncrement,
          // Simple progression settings
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
  };

  const handleCreate = async () => {
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
        // Update existing cycle
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
          updatedAt: new Date()
        };
        await CycleRepo.update(editCycle.id, updatedCycle);
        cycle = updatedCycle;

        if (editMode === 'continue') {
          // Only delete pending/partial workouts, keep completed/skipped
          const allWorkouts = await ScheduledWorkoutRepo.getByCycleId(editCycle.id);
          const pendingWorkoutIds = allWorkouts
            .filter(w => w.status === 'pending' || w.status === 'partial')
            .map(w => w.id);
          
          // Delete all pending workouts
          for (const id of pendingWorkoutIds) {
            await ScheduledWorkoutRepo.delete(id);
          }
          
          // Recalculate actual remaining workout count after deletion
          const remainingWorkouts = await ScheduledWorkoutRepo.getByCycleId(editCycle.id);
          const maxExistingSequence = remainingWorkouts.reduce(
            (max, w) => Math.max(max, w.sequenceNumber), 
            0
          );
          
          // Generate new schedule starting after the highest existing sequence
          const scheduleInput = {
            cycle,
            exercises: exerciseMap,
            startFromWorkout: maxExistingSequence + 1
          };
          
          const workouts = generateSchedule(scheduleInput);
          await ScheduledWorkoutRepo.bulkCreate(workouts);
        } else {
          // Restart: Delete all and regenerate
          await ScheduledWorkoutRepo.deleteByCycleId(editCycle.id);
          
          const scheduleInput = {
            cycle,
            exercises: exerciseMap
          };
          
          const workouts = generateSchedule(scheduleInput);
          await ScheduledWorkoutRepo.bulkCreate(workouts);
        }
      } else {
        // Create new cycle
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
          status: 'active'
        });

        // Generate and save the schedule
        const scheduleInput = {
          cycle,
          exercises: exerciseMap
        };
        
        const workouts = generateSchedule(scheduleInput);
        await ScheduledWorkoutRepo.bulkCreate(workouts);
      }

      // Save last cycle settings for each exercise (for smart defaults in future cycles)
      await saveLastCycleSettings(groups, progressionMode, exerciseMap);

      onComplete();
    } catch (err) {
      console.error('Failed to create/update cycle:', err);
      setError(err instanceof Error ? err.message : 'Failed to save cycle');
    } finally {
      setIsCreating(false);
    }
  };

  // Group management
  const addGroup = () => {
    const newGroup: Group = {
      id: generateId(),
      name: `Group ${String.fromCharCode(65 + groups.length)}`,
      exerciseAssignments: []
    };
    setGroups([...groups, newGroup]);
    setGroupRotation([...groupRotation, newGroup.id]);
  };

  const removeGroup = (groupId: string) => {
    setGroups(groups.filter(g => g.id !== groupId));
    setGroupRotation(groupRotation.filter(id => id !== groupId));
  };

  const updateGroupName = (groupId: string, newName: string) => {
    setGroups(groups.map(g => g.id === groupId ? { ...g, name: newName } : g));
  };

  const addExerciseToGroup = (groupId: string, exerciseId: string) => {
    const exercise = exerciseMap.get(exerciseId);
    const assignment: ExerciseAssignment = {
      exerciseId,
      conditioningBaseReps: exercise?.mode === 'conditioning' 
        ? (exercise.defaultConditioningReps || defaults.defaultConditioningReps) 
        : undefined
    };
    
    setGroups(groups.map(g => {
      if (g.id !== groupId) return g;
      // Don't add duplicates
      if (g.exerciseAssignments.some(a => a.exerciseId === exerciseId)) return g;
      return { ...g, exerciseAssignments: [...g.exerciseAssignments, assignment] };
    }));
  };

  const removeExerciseFromGroup = (groupId: string, exerciseId: string) => {
    setGroups(groups.map(g => {
      if (g.id !== groupId) return g;
      return { 
        ...g, 
        exerciseAssignments: g.exerciseAssignments.filter(a => a.exerciseId !== exerciseId) 
      };
    }));
  };

  const updateConditioningReps = (groupId: string, exerciseId: string, reps: number) => {
    setGroups(groups.map(g => {
      if (g.id !== groupId) return g;
      return {
        ...g,
        exerciseAssignments: g.exerciseAssignments.map(a => 
          a.exerciseId === exerciseId ? { ...a, conditioningBaseReps: reps } : a
        )
      };
    }));
  };

  // Update simple progression settings for an exercise assignment
  const updateSimpleProgression = (
    groupId: string, 
    exerciseId: string, 
    updates: Partial<ExerciseAssignment>
  ) => {
    setGroups(groups.map(g => {
      if (g.id !== groupId) return g;
      return {
        ...g,
        exerciseAssignments: g.exerciseAssignments.map(a => 
          a.exerciseId === exerciseId ? { ...a, ...updates } : a
        )
      };
    }));
  };

  // Get steps to display (hide 'start' step from progress indicator)
  const displaySteps = editCycle ? STEPS.filter(s => s.key !== 'start') : STEPS.filter(s => s.key !== 'start');
  
  // Get cycles available for cloning (training cycles only, excluding current one being edited)
  const cloneableCycles = allCycles
    ?.filter(c => c.id !== editCycle?.id && c.cycleType !== 'max_testing')
    .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()) || [];
  
  // Count completed training cycles for naming
  const completedTrainingCycleCount = allCycles
    ?.filter(c => c.cycleType !== 'max_testing' && c.status === 'completed')
    .length || 0;
  
  // Generate default name for new cycle
  const getDefaultCycleName = () => `Workout Cycle ${completedTrainingCycleCount + 1}`;

  return (
    <div className="flex flex-col h-full">
      {/* Progress indicator - hide on start step */}
      {currentStep !== 'start' && (
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-dark-border">
          {displaySteps.map((step, index) => {
            const isActive = step.key === currentStep;
            const currentDisplayIndex = displaySteps.findIndex(s => s.key === currentStep);
            const isPast = currentDisplayIndex > index;
            
            return (
              <div key={step.key} className="flex items-center">
                <div className={`
                  w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                  ${isActive ? 'bg-primary-600 text-white' : 
                    isPast ? 'bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400' : 
                    'bg-gray-100 text-gray-400 dark:bg-gray-800'}
                `}>
                  {isPast ? <Check className="w-4 h-4" /> : index + 1}
                </div>
                <span className={`ml-2 text-sm font-medium hidden sm:inline
                  ${isActive ? 'text-gray-900 dark:text-gray-100' : 'text-gray-500 dark:text-gray-400'}
                `}>
                  {step.label}
                </span>
                {index < displaySteps.length - 1 && (
                  <ChevronRight className="w-4 h-4 mx-2 text-gray-300 dark:text-gray-600" />
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Step content */}
      <div className="flex-1 overflow-y-auto p-4">
        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg text-sm">
            {error}
          </div>
        )}

        {currentStep === 'start' && (
          <StartStep
            cloneableCycles={cloneableCycles}
            onStartFresh={handleStartFresh}
            onCloneFromCycle={handleCloneFromCycle}
            onCancel={onCancel}
          />
        )}

        {currentStep === 'basics' && (
          <BasicsStep
            name={name}
            setName={setName}
            startDate={startDate}
            setStartDate={setStartDate}
            numberOfWeeks={numberOfWeeks}
            setNumberOfWeeks={setNumberOfWeeks}
            workoutDaysPerWeek={workoutDaysPerWeek}
            setWorkoutDaysPerWeek={setWorkoutDaysPerWeek}
          />
        )}

        {currentStep === 'groups' && (
          <GroupsStep
            groups={groups}
            exercises={exercises || []}
            exerciseMap={exerciseMap}
            defaults={defaults}
            progressionMode={progressionMode}
            onAddGroup={addGroup}
            onRemoveGroup={removeGroup}
            onUpdateGroupName={updateGroupName}
            onAddExercise={addExerciseToGroup}
            onRemoveExercise={removeExerciseFromGroup}
            onUpdateConditioningReps={updateConditioningReps}
            onUpdateAssignment={updateSimpleProgression}
          />
        )}

        {currentStep === 'progression' && progressionMode === 'simple' && (
          <ProgressionStep
            groups={groups}
            exerciseMap={exerciseMap}
            onUpdateProgression={updateSimpleProgression}
          />
        )}

        {currentStep === 'goals' && (
          <GoalsStep
            progressionMode={progressionMode}
            weeklySetGoals={weeklySetGoals}
            setWeeklySetGoals={setWeeklySetGoals}
            groups={groups}
            groupRotation={groupRotation}
            setGroupRotation={setGroupRotation}
            rfemRotation={rfemRotation}
            setRfemRotation={setRfemRotation}
            conditioningWeeklyRepIncrement={conditioningWeeklyRepIncrement}
            setConditioningWeeklyRepIncrement={setConditioningWeeklyRepIncrement}
            workoutDaysPerWeek={workoutDaysPerWeek}
          />
        )}

        {currentStep === 'review' && (
          <ReviewStep
            progressionMode={progressionMode}
            name={name}
            startDate={startDate}
            numberOfWeeks={numberOfWeeks}
            workoutDaysPerWeek={workoutDaysPerWeek}
            groups={groups}
            exerciseMap={exerciseMap}
            weeklySetGoals={weeklySetGoals}
            groupRotation={groupRotation}
            rfemRotation={rfemRotation}
            validation={validation}
          />
        )}
      </div>

      {/* Navigation - hide on start step (it has its own buttons) */}
      {currentStep !== 'start' && (
        <div className="flex gap-3 p-4 border-t border-gray-200 dark:border-dark-border">
          {currentStep === 'basics' ? (
            <Button variant="secondary" onClick={editCycle ? onCancel : () => setCurrentStep('start')} className="flex-1">
              {editCycle ? 'Cancel' : (
                <>
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Back
                </>
              )}
            </Button>
          ) : (
            <Button variant="secondary" onClick={prevStep} className="flex-1">
              <ChevronLeft className="w-4 h-4 mr-1" />
              Back
            </Button>
          )}
          
          {currentStep === 'review' ? (
            <Button 
              onClick={handleCreate} 
              disabled={!canProceed() || isCreating}
              className="flex-1"
            >
              {isCreating ? 'Saving...' : (editCycle ? 'Save Changes' : 'Create Cycle')}
            </Button>
          ) : (
            <Button 
              onClick={nextStep} 
              disabled={!canProceed()}
              className="flex-1"
            >
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          )}
        </div>
      )}

      {/* Edit Mode Choice Modal */}
      <Modal
        isOpen={showEditModeChoice}
        onClose={() => setShowEditModeChoice(false)}
        title="How to Apply Changes?"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            You have {cycleProgress?.passed || 0} completed workout{(cycleProgress?.passed || 0) !== 1 ? 's' : ''} in this cycle. 
            How would you like to apply your changes?
          </p>
          
          <div className="space-y-3">
            <button
              onClick={() => {
                setEditMode('continue');
                setShowEditModeChoice(false);
                handleCreate();
              }}
              className="w-full p-4 text-left rounded-lg border border-gray-200 dark:border-dark-border hover:border-primary-500 dark:hover:border-primary-500 transition-colors"
            >
              <div className="font-medium text-gray-900 dark:text-gray-100">
                Continue from current position
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Keep your {cycleProgress?.passed || 0} completed workout{(cycleProgress?.passed || 0) !== 1 ? 's' : ''} and apply changes to remaining workouts
              </p>
            </button>
            
            <button
              onClick={() => {
                setEditMode('restart');
                setShowEditModeChoice(false);
                handleCreate();
              }}
              className="w-full p-4 text-left rounded-lg border border-gray-200 dark:border-dark-border hover:border-primary-500 dark:hover:border-primary-500 transition-colors"
            >
              <div className="font-medium text-gray-900 dark:text-gray-100">
                Start fresh
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Clear all progress and regenerate the entire cycle schedule
              </p>
            </button>
          </div>
          
          <Button 
            variant="secondary" 
            onClick={() => setShowEditModeChoice(false)}
            className="w-full"
          >
            Cancel
          </Button>
        </div>
      </Modal>
    </div>
  );
}

// Step Components

function StartStep({
  cloneableCycles,
  onStartFresh,
  onCloneFromCycle,
  onCancel
}: {
  cloneableCycles: Cycle[];
  onStartFresh: () => void;
  onCloneFromCycle: (cycle: Cycle) => void;
  onCancel: () => void;
}) {
  return (
    <div className="space-y-6">
      <div className="text-center py-4">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
          Create New Cycle
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Start fresh or copy settings from a previous cycle
        </p>
      </div>

      <div className="space-y-3">
        {/* Start Fresh Option */}
        <button
          onClick={onStartFresh}
          className="w-full p-4 text-left rounded-xl border-2 border-gray-200 dark:border-dark-border hover:border-primary-500 dark:hover:border-primary-500 transition-colors bg-white dark:bg-gray-800"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0">
              <Plus className="w-6 h-6 text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <div className="font-semibold text-gray-900 dark:text-gray-100">
                Start Fresh
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Create a new cycle from scratch with default settings
              </p>
            </div>
          </div>
        </button>

        {/* Clone from Previous Cycle */}
        {cloneableCycles.length > 0 && (
          <>
            <div className="relative py-3">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200 dark:border-dark-border" />
              </div>
              <div className="relative flex justify-center">
                <span className="px-3 bg-gray-50 dark:bg-gray-900 text-sm text-gray-500 dark:text-gray-400">
                  or clone from previous
                </span>
              </div>
            </div>

            <div className="space-y-2">
              {cloneableCycles.slice(0, 5).map(cycle => (
                <button
                  key={cycle.id}
                  onClick={() => onCloneFromCycle(cycle)}
                  className="w-full p-4 text-left rounded-xl border-2 border-gray-200 dark:border-dark-border hover:border-primary-500 dark:hover:border-primary-500 transition-colors bg-white dark:bg-gray-800"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                      <Copy className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                        {cycle.name}
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {cycle.numberOfWeeks} weeks • {cycle.workoutDaysPerWeek} days/week • {cycle.groups.length} groups
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                        {new Date(cycle.startDate).toLocaleDateString()}
                      </p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  </div>
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      <div className="pt-4">
        <Button variant="secondary" onClick={onCancel} className="w-full">
          Cancel
        </Button>
      </div>
    </div>
  );
}

function BasicsStep({ 
  name, setName, 
  startDate, setStartDate, 
  numberOfWeeks, setNumberOfWeeks,
  workoutDaysPerWeek, setWorkoutDaysPerWeek 
}: {
  name: string;
  setName: (v: string) => void;
  startDate: string;
  setStartDate: (v: string) => void;
  numberOfWeeks: number;
  setNumberOfWeeks: (v: number) => void;
  workoutDaysPerWeek: number;
  setWorkoutDaysPerWeek: (v: number) => void;
}) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
        Cycle Basics
      </h2>
      
      <Input
        label="Cycle Name"
        value={name}
        onChange={e => setName(e.target.value)}
        placeholder="e.g., Winter 2025 Block 1"
      />

      <Input
        label="Start Date"
        type="date"
        value={startDate}
        onChange={e => setStartDate(e.target.value)}
      />

      <div className="grid grid-cols-2 gap-4">
        <NumberInput
          label="Number of Weeks"
          value={numberOfWeeks}
          onChange={setNumberOfWeeks}
          min={1}
          max={12}
        />

        <NumberInput
          label="Workout Days per Week"
          value={workoutDaysPerWeek}
          onChange={setWorkoutDaysPerWeek}
          min={1}
          max={7}
        />
      </div>
    </div>
  );
}

function GroupsStep({
  groups,
  exercises,
  exerciseMap,
  defaults,
  progressionMode,
  onAddGroup,
  onRemoveGroup,
  onUpdateGroupName,
  onAddExercise,
  onRemoveExercise,
  onUpdateConditioningReps,
  onUpdateAssignment
}: {
  groups: Group[];
  exercises: Exercise[];
  exerciseMap: Map<string, Exercise>;
  defaults: { defaultConditioningReps: number };
  progressionMode: ProgressionMode;
  onAddGroup: () => void;
  onRemoveGroup: (id: string) => void;
  onUpdateGroupName: (id: string, name: string) => void;
  onAddExercise: (groupId: string, exerciseId: string) => void;
  onRemoveExercise: (groupId: string, exerciseId: string) => void;
  onUpdateConditioningReps: (groupId: string, exerciseId: string, reps: number) => void;
  onUpdateAssignment: (groupId: string, exerciseId: string, updates: Partial<ExerciseAssignment>) => void;
}) {
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [showExercisePicker, setShowExercisePicker] = useState(false);
  const isMixedMode = progressionMode === 'mixed';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          {isMixedMode ? 'Exercises & Progression' : 'Workout Groups'}
        </h2>
        <Button variant="secondary" size="sm" onClick={onAddGroup}>
          <Plus className="w-4 h-4 mr-1" />
          Add Group
        </Button>
      </div>

      <p className="text-sm text-gray-500 dark:text-gray-400">
        {isMixedMode 
          ? 'Create groups and configure RFEM or simple progression for each exercise.'
          : 'Create groups of exercises that will be performed together on the same day.'
        }
      </p>

      <div className="space-y-3">
        {groups.map(group => (
          <Card key={group.id} className="p-3">
            <div className="flex items-center gap-2 mb-2">
              <Input
                value={group.name}
                onChange={e => onUpdateGroupName(group.id, e.target.value)}
                className="flex-1 font-medium"
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedGroup(group.id);
                  setShowExercisePicker(true);
                }}
              >
                <Plus className="w-4 h-4" />
              </Button>
              {groups.length > 1 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onRemoveGroup(group.id)}
                  className="text-red-500 hover:text-red-600"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>

            {group.exerciseAssignments.length === 0 ? (
              <p className="text-sm text-gray-400 dark:text-gray-500 py-2">
                No exercises yet. Tap + to add exercises.
              </p>
            ) : (
              <div className="space-y-2">
                {group.exerciseAssignments.map(assignment => {
                  const exercise = exerciseMap.get(assignment.exerciseId);
                  if (!exercise) return null;
                  
                  // In mixed mode, show inline configuration
                  if (isMixedMode) {
                    return (
                      <MixedExerciseConfig
                        key={assignment.exerciseId}
                        exercise={exercise}
                        assignment={assignment}
                        defaults={defaults}
                        onUpdate={(updates) => onUpdateAssignment(group.id, assignment.exerciseId, updates)}
                        onRemove={() => onRemoveExercise(group.id, assignment.exerciseId)}
                      />
                    );
                  }
                  
                  // Standard display for RFEM/Simple modes
                  return (
                    <div 
                      key={assignment.exerciseId}
                      className="flex items-start gap-2 py-1.5 px-2 bg-gray-50 dark:bg-gray-800/50 rounded"
                    >
                      <Badge variant={exercise.type} className="text-2xs flex-shrink-0 mt-0.5">
                        {EXERCISE_TYPE_LABELS[exercise.type]}
                      </Badge>
                      <span className="flex-1 text-sm min-w-0 break-words">{exercise.name}</span>
                      
                      {exercise.mode === 'conditioning' && (
                        <NumberInput
                          value={assignment.conditioningBaseReps || defaults.defaultConditioningReps}
                          onChange={v => onUpdateConditioningReps(
                            group.id, 
                            assignment.exerciseId, 
                            v
                          )}
                          min={1}
                          className="w-16 text-xs py-1 flex-shrink-0"
                        />
                      )}
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onRemoveExercise(group.id, assignment.exerciseId)}
                        className="p-1 text-gray-400 hover:text-red-500 flex-shrink-0"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        ))}
      </div>

      {/* Exercise Picker Modal */}
      <Modal
        isOpen={showExercisePicker}
        onClose={() => setShowExercisePicker(false)}
        title="Add/Remove Exercises"
        size="lg"
      >
        <div className="space-y-4">
          {EXERCISE_TYPES.map(type => {
            const typeExercises = exercises
              .filter(ex => ex.type === type)
              .sort((a, b) => a.name.localeCompare(b.name));
            
            if (typeExercises.length === 0) return null;
            
            return (
              <div key={type}>
                <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                  {EXERCISE_TYPE_LABELS[type]}
                </h3>
                <div className="space-y-2">
                  {typeExercises.map(exercise => {
                    const group = groups.find(g => g.id === selectedGroup);
                    const isAdded = group?.exerciseAssignments.some(a => a.exerciseId === exercise.id);
                    
                    return (
                      <button
                        key={exercise.id}
                        onClick={() => {
                          if (selectedGroup) {
                            if (isAdded) {
                              onRemoveExercise(selectedGroup, exercise.id);
                            } else {
                              onAddExercise(selectedGroup, exercise.id);
                            }
                          }
                        }}
                        className={`
                          w-full flex items-center gap-2 p-3 rounded-lg text-left transition-colors
                          ${isAdded 
                            ? 'bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800' 
                            : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                          }
                        `}
                      >
                        <Badge variant={exercise.type}>
                          {EXERCISE_TYPE_LABELS[exercise.type]}
                        </Badge>
                        <span className="flex-1">{exercise.name}</span>
                        {exercise.mode === 'conditioning' && (
                          <span className="text-xs text-gray-500 dark:text-gray-400">conditioning</span>
                        )}
                        {isAdded && <Check className="w-4 h-4 text-primary-500" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
          
          <Button 
            className="w-full mt-4"
            onClick={() => setShowExercisePicker(false)}
          >
            Done
          </Button>
        </div>
      </Modal>
    </div>
  );
}

/**
 * Inline configuration component for exercises in mixed mode.
 * Allows selecting RFEM or Simple progression mode for each exercise.
 */
function MixedExerciseConfig({
  exercise,
  assignment,
  defaults,
  onUpdate,
  onRemove
}: {
  exercise: Exercise;
  assignment: ExerciseAssignment;
  defaults: { defaultConditioningReps: number };
  onUpdate: (updates: Partial<ExerciseAssignment>) => void;
  onRemove: () => void;
}) {
  const isConditioning = exercise.mode === 'conditioning';
  const isTimeBased = exercise.measurementType === 'time';
  const isWeighted = exercise.weightEnabled === true;
  
  // For non-conditioning exercises, track which mode is selected
  const exerciseMode = assignment.progressionMode || 'rfem';
  
  // Initialize with smart defaults from lastCycleSettings or exercise defaults
  useEffect(() => {
    if (isConditioning) {
      // For conditioning, ensure base value and increment are set
      const updates: Partial<ExerciseAssignment> = {};
      
      if (isTimeBased) {
        if (assignment.conditioningBaseTime === undefined) {
          updates.conditioningBaseTime = exercise.lastCycleSettings?.simpleBaseTime 
            || exercise.defaultConditioningTime || 30;
        }
        if (assignment.conditioningTimeIncrement === undefined) {
          updates.conditioningTimeIncrement = exercise.lastCycleSettings?.conditioningTimeIncrement || 5;
        }
      } else {
        if (assignment.conditioningBaseReps === undefined) {
          updates.conditioningBaseReps = exercise.lastCycleSettings?.simpleBaseReps
            || exercise.defaultConditioningReps || defaults.defaultConditioningReps;
        }
        if (assignment.conditioningRepIncrement === undefined) {
          updates.conditioningRepIncrement = exercise.lastCycleSettings?.conditioningRepIncrement || 1;
        }
      }
      
      if (Object.keys(updates).length > 0) {
        onUpdate(updates);
      }
    } else {
      // For standard exercises, initialize from lastCycleSettings if available
      const lastSettings = exercise.lastCycleSettings;
      if (lastSettings && assignment.progressionMode === undefined) {
        const updates: Partial<ExerciseAssignment> = {
          progressionMode: lastSettings.progressionMode
        };
        
        // If last mode was simple, copy the simple settings
        if (lastSettings.progressionMode === 'simple') {
          if (isTimeBased) {
            updates.simpleBaseTime = lastSettings.simpleBaseTime;
            updates.simpleTimeProgressionType = lastSettings.simpleTimeProgressionType;
            updates.simpleTimeIncrement = lastSettings.simpleTimeIncrement;
          } else {
            updates.simpleBaseReps = lastSettings.simpleBaseReps;
            updates.simpleRepProgressionType = lastSettings.simpleRepProgressionType;
            updates.simpleRepIncrement = lastSettings.simpleRepIncrement;
          }
          if (isWeighted) {
            updates.simpleBaseWeight = lastSettings.simpleBaseWeight;
            updates.simpleWeightProgressionType = lastSettings.simpleWeightProgressionType;
            updates.simpleWeightIncrement = lastSettings.simpleWeightIncrement;
          }
        }
        
        onUpdate(updates);
      }
    }
  }, []); // Run once on mount

  // Conditioning exercise UI
  if (isConditioning) {
    return (
      <div className="border border-gray-200 dark:border-dark-border rounded-lg p-3 bg-gray-50 dark:bg-gray-800/50">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Badge variant={exercise.type} className="text-2xs">
              {EXERCISE_TYPE_LABELS[exercise.type]}
            </Badge>
            <span className="font-medium text-sm text-gray-900 dark:text-gray-100">{exercise.name}</span>
            <Badge variant="other" className="text-2xs">Conditioning</Badge>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onRemove}
            className="p-1 text-gray-400 hover:text-red-500"
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
              Base {isTimeBased ? 'Time (sec)' : 'Reps'}
            </label>
            <NumberInput
              value={isTimeBased 
                ? (assignment.conditioningBaseTime || 30) 
                : (assignment.conditioningBaseReps || defaults.defaultConditioningReps)}
              onChange={v => onUpdate(isTimeBased 
                ? { conditioningBaseTime: v } 
                : { conditioningBaseReps: v })}
              min={1}
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
              Add {isTimeBased ? 'sec' : 'reps'}/week
            </label>
            <NumberInput
              value={isTimeBased 
                ? (assignment.conditioningTimeIncrement ?? 5) 
                : (assignment.conditioningRepIncrement ?? 1)}
              onChange={v => onUpdate(isTimeBased 
                ? { conditioningTimeIncrement: v } 
                : { conditioningRepIncrement: v })}
              min={0}
              className="w-full"
            />
          </div>
        </div>
      </div>
    );
  }

  // Standard exercise UI with RFEM/Simple toggle
  return (
    <div className="border border-gray-200 dark:border-dark-border rounded-lg p-3 bg-gray-50 dark:bg-gray-800/50">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Badge variant={exercise.type} className="text-2xs">
            {EXERCISE_TYPE_LABELS[exercise.type]}
          </Badge>
          <span className="font-medium text-sm text-gray-900 dark:text-gray-100">{exercise.name}</span>
          {isWeighted && <Badge variant="other" className="text-2xs">Weighted</Badge>}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onRemove}
          className="p-1 text-gray-400 hover:text-red-500"
        >
          <Trash2 className="w-3 h-3" />
        </Button>
      </div>
      
      {/* Mode Toggle */}
      <div className="flex gap-2 mb-3">
        <button
          onClick={() => onUpdate({ progressionMode: 'rfem' })}
          className={`flex-1 py-1.5 px-3 text-xs font-medium rounded-md transition-colors ${
            exerciseMode === 'rfem'
              ? 'bg-primary-500 text-white'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
          }`}
        >
          RFEM
        </button>
        <button
          onClick={() => onUpdate({ progressionMode: 'simple' })}
          className={`flex-1 py-1.5 px-3 text-xs font-medium rounded-md transition-colors ${
            exerciseMode === 'simple'
              ? 'bg-emerald-500 text-white'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
          }`}
        >
          Simple
        </button>
      </div>
      
      {exerciseMode === 'rfem' ? (
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Uses cycle's RFEM rotation for target {isTimeBased ? 'time' : 'reps'}
        </p>
      ) : (
        <SimpleProgressionFields
          exercise={exercise}
          assignment={assignment}
          isTimeBased={isTimeBased}
          isWeighted={isWeighted}
          onUpdate={onUpdate}
        />
      )}
    </div>
  );
}

/**
 * Reusable simple progression input fields.
 * Used by both MixedExerciseConfig and ExerciseProgressionEditor.
 */
function SimpleProgressionFields({
  exercise,
  assignment,
  isTimeBased,
  isWeighted,
  onUpdate
}: {
  exercise: Exercise;
  assignment: ExerciseAssignment;
  isTimeBased: boolean;
  isWeighted: boolean;
  onUpdate: (updates: Partial<ExerciseAssignment>) => void;
}) {
  // Get default values
  const getDefaultValue = () => {
    if (isTimeBased) {
      return exercise.lastCycleSettings?.simpleBaseTime 
        || exercise.defaultConditioningTime || 30;
    }
    return exercise.lastCycleSettings?.simpleBaseReps 
      || exercise.defaultConditioningReps || 10;
  };

  const baseValue = isTimeBased 
    ? (assignment.simpleBaseTime ?? getDefaultValue())
    : (assignment.simpleBaseReps ?? getDefaultValue());
  
  const progressionType = isTimeBased 
    ? (assignment.simpleTimeProgressionType || 'constant')
    : (assignment.simpleRepProgressionType || 'constant');
  
  const increment = isTimeBased 
    ? (assignment.simpleTimeIncrement ?? 0)
    : (assignment.simpleRepIncrement ?? 0);

  const baseWeight = assignment.simpleBaseWeight ?? exercise.defaultWeight ?? 0;
  const weightProgressionType = assignment.simpleWeightProgressionType || 'constant';
  const weightIncrement = assignment.simpleWeightIncrement ?? 0;

  // Initialize defaults on mount if not set
  useEffect(() => {
    const updates: Partial<ExerciseAssignment> = {};
    
    if (isTimeBased && assignment.simpleBaseTime === undefined) {
      updates.simpleBaseTime = getDefaultValue();
    } else if (!isTimeBased && assignment.simpleBaseReps === undefined) {
      updates.simpleBaseReps = getDefaultValue();
    }
    
    if (isWeighted && assignment.simpleBaseWeight === undefined && exercise.defaultWeight) {
      updates.simpleBaseWeight = exercise.defaultWeight;
    }
    
    if (Object.keys(updates).length > 0) {
      onUpdate(updates);
    }
  }, []);

  return (
    <div className="space-y-3">
      {/* Reps/Time Row */}
      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
            Base {isTimeBased ? '(sec)' : 'Reps'}
          </label>
          <NumberInput
            value={baseValue}
            onChange={v => onUpdate(isTimeBased 
              ? { simpleBaseTime: v } 
              : { simpleBaseReps: v })}
            min={1}
            className="w-full"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
            Progress
          </label>
          <Select
            value={progressionType}
            onChange={e => onUpdate(isTimeBased 
              ? { simpleTimeProgressionType: e.target.value as ProgressionInterval }
              : { simpleRepProgressionType: e.target.value as ProgressionInterval })}
            options={[
              { value: 'constant', label: 'None' },
              { value: 'per_workout', label: '/workout' },
              { value: 'per_week', label: '/week' }
            ]}
            className="w-full text-xs"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
            +{isTimeBased ? 'sec' : 'reps'}
          </label>
          <NumberInput
            value={increment}
            onChange={v => onUpdate(isTimeBased 
              ? { simpleTimeIncrement: v } 
              : { simpleRepIncrement: v })}
            min={0}
            disabled={progressionType === 'constant'}
            className="w-full"
          />
        </div>
      </div>
      
      {/* Weight Row (only for weighted exercises) */}
      {isWeighted && (
        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-gray-200 dark:border-dark-border">
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
              Weight (lbs)
            </label>
            <NumberInput
              value={baseWeight}
              onChange={v => onUpdate({ simpleBaseWeight: v })}
              min={0}
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
              Progress
            </label>
            <Select
              value={weightProgressionType}
              onChange={e => onUpdate({ simpleWeightProgressionType: e.target.value as ProgressionInterval })}
              options={[
                { value: 'constant', label: 'None' },
                { value: 'per_workout', label: '/workout' },
                { value: 'per_week', label: '/week' }
              ]}
              className="w-full text-xs"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
              +lbs
            </label>
            <NumberInput
              value={weightIncrement}
              onChange={v => onUpdate({ simpleWeightIncrement: v })}
              min={0}
              disabled={weightProgressionType === 'constant'}
              className="w-full"
            />
          </div>
        </div>
      )}
    </div>
  );
}

function GoalsStep({
  progressionMode,
  weeklySetGoals,
  setWeeklySetGoals,
  groups,
  groupRotation,
  setGroupRotation,
  rfemRotation,
  setRfemRotation,
  conditioningWeeklyRepIncrement,
  setConditioningWeeklyRepIncrement,
  workoutDaysPerWeek
}: {
  progressionMode: ProgressionMode;
  weeklySetGoals: Record<ExerciseType, number>;
  setWeeklySetGoals: (v: Record<ExerciseType, number>) => void;
  groups: Group[];
  groupRotation: string[];
  setGroupRotation: (v: string[]) => void;
  rfemRotation: number[];
  setRfemRotation: (v: number[]) => void;
  conditioningWeeklyRepIncrement: number;
  setConditioningWeeklyRepIncrement: (v: number) => void;
  workoutDaysPerWeek: number;
}) {
  const isSimpleMode = progressionMode === 'simple';
  const isMixedMode = progressionMode === 'mixed';
  
  const updateGoal = (type: ExerciseType, value: number) => {
    setWeeklySetGoals({ ...weeklySetGoals, [type]: value });
  };

  const updateRfem = (index: number, value: number) => {
    const newRotation = [...rfemRotation];
    newRotation[index] = value;
    setRfemRotation(newRotation);
  };

  const addRfemValue = () => {
    setRfemRotation([...rfemRotation, 3]);
  };

  const removeRfemValue = (index: number) => {
    if (rfemRotation.length > 1) {
      setRfemRotation(rfemRotation.filter((_, i) => i !== index));
    }
  };

  return (
    <div className="space-y-6">
      {/* Weekly Set Goals */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
          Weekly Set Goals
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
          How many sets of each type per week?
        </p>
        
        <div className="grid grid-cols-2 gap-3">
          {EXERCISE_TYPES.filter(t => t !== 'other').map(type => (
            <div key={type} className="flex flex-col gap-1">
              <Badge variant={type} className="w-fit">
                {EXERCISE_TYPE_LABELS[type]}
              </Badge>
              <NumberInput
                value={weeklySetGoals[type]}
                onChange={v => updateGoal(type, v)}
                min={0}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Group Rotation */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
          Group Rotation
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
          Order of groups across workout days (repeats if fewer than {workoutDaysPerWeek} days)
        </p>
        
        <div className="flex flex-wrap gap-2">
          {groupRotation.map((groupId, index) => {
            return (
              <Select
                key={index}
                value={groupId}
                onChange={e => {
                  const newRotation = [...groupRotation];
                  newRotation[index] = e.target.value;
                  setGroupRotation(newRotation);
                }}
                options={groups.map(g => ({ value: g.id, label: g.name }))}
                className="w-28"
              />
            );
          })}
          <Button variant="ghost" size="sm" onClick={() => setGroupRotation([...groupRotation, groups[0]?.id || ''])}>
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* RFEM Rotation - for RFEM and mixed modes */}
      {!isSimpleMode && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            RFEM Rotation
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
            {isMixedMode 
              ? 'Reps From Established Max: applies to all RFEM-mode exercises'
              : 'Reps From Established Max: subtracted from your max for target reps'
            }
          </p>
          
          <div className="flex flex-wrap gap-2">
            {rfemRotation.map((value, index) => (
              <div key={index} className="flex items-center gap-1">
                <NumberInput
                  value={value}
                  onChange={v => updateRfem(index, v)}
                  min={0}
                  max={20}
                  className="w-16"
                />
                {rfemRotation.length > 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeRfemValue(index)}
                    className="p-1 text-gray-400"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                )}
              </div>
            ))}
            <Button variant="ghost" size="sm" onClick={addRfemValue}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Conditioning Increment - only for RFEM mode (mixed mode has per-exercise increments) */}
      {!isSimpleMode && !isMixedMode && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Conditioning Weekly Increment
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
            How many reps to add each week for conditioning exercises
          </p>
          
          <NumberInput
            value={conditioningWeeklyRepIncrement}
            onChange={setConditioningWeeklyRepIncrement}
            min={0}
            className="w-24"
          />
        </div>
      )}
    </div>
  );
}

function ProgressionStep({
  groups,
  exerciseMap,
  onUpdateProgression
}: {
  groups: Group[];
  exerciseMap: Map<string, Exercise>;
  onUpdateProgression: (groupId: string, exerciseId: string, updates: Partial<ExerciseAssignment>) => void;
}) {
  // Get all unique exercise IDs from groups
  const exerciseIds = Array.from(new Set(
    groups.flatMap(g => g.exerciseAssignments.map(a => a.exerciseId))
  ));

  // Load last completed sets for all exercises
  const lastCompletedSets = useLiveQuery(async () => {
    const results = new Map<string, CompletedSet | null>();
    for (const exerciseId of exerciseIds) {
      const lastSet = await CompletedSetRepo.getLastForExercise(exerciseId);
      results.set(exerciseId, lastSet);
    }
    return results;
  }, [exerciseIds.join(',')]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
          Set Exercise Targets
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Set base reps/time and optional progression for each exercise
        </p>
      </div>

      {groups.map(group => (
        <Card key={group.id} className="p-4">
          <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-4">{group.name}</h3>
          
          {group.exerciseAssignments.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400 italic">
              No exercises in this group
            </p>
          ) : (
            <div className="space-y-4">
              {group.exerciseAssignments.map(assignment => {
                const exercise = exerciseMap.get(assignment.exerciseId);
                if (!exercise) return null;
                
                const isTimeBased = exercise.measurementType === 'time';
                const lastSet = lastCompletedSets?.get(assignment.exerciseId) || null;
                
                return (
                  <ExerciseProgressionEditor
                    key={assignment.exerciseId}
                    exercise={exercise}
                    assignment={assignment}
                    isTimeBased={isTimeBased}
                    lastCompletedSet={lastSet}
                    onUpdate={(updates) => onUpdateProgression(group.id, assignment.exerciseId, updates)}
                  />
                );
              })}
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}

function ExerciseProgressionEditor({
  exercise,
  assignment,
  isTimeBased,
  lastCompletedSet,
  onUpdate
}: {
  exercise: Exercise;
  assignment: ExerciseAssignment;
  isTimeBased: boolean;
  lastCompletedSet: CompletedSet | null;
  onUpdate: (updates: Partial<ExerciseAssignment>) => void;
}) {
  const isWeighted = exercise.weightEnabled === true;
  
  // Calculate default values
  const getDefaultReps = () => {
    if (lastCompletedSet?.actualReps) return lastCompletedSet.actualReps;
    if (exercise.defaultConditioningReps) return exercise.defaultConditioningReps;
    return 10;
  };
  
  const getDefaultTime = () => {
    if (lastCompletedSet?.actualReps) return lastCompletedSet.actualReps; // actualReps holds time for time-based
    if (exercise.defaultConditioningTime) return exercise.defaultConditioningTime;
    return 30;
  };
  
  const getDefaultWeight = () => {
    if (lastCompletedSet?.weight) return lastCompletedSet.weight;
    if (exercise.defaultWeight) return exercise.defaultWeight;
    return 0;
  };

  // Current values (from assignment or defaults)
  const baseValue = isTimeBased 
    ? (assignment.simpleBaseTime ?? getDefaultTime())
    : (assignment.simpleBaseReps ?? getDefaultReps());
  const baseWeight = assignment.simpleBaseWeight ?? getDefaultWeight();
  
  const progressionType = isTimeBased 
    ? (assignment.simpleTimeProgressionType || 'constant')
    : (assignment.simpleRepProgressionType || 'constant');
  const increment = isTimeBased ? assignment.simpleTimeIncrement : assignment.simpleRepIncrement;
  
  const weightProgressionType = assignment.simpleWeightProgressionType || 'constant';
  const weightIncrement = assignment.simpleWeightIncrement;

  // Initialize defaults on first render if not set
  useEffect(() => {
    const updates: Partial<ExerciseAssignment> = {};
    
    if (isTimeBased && assignment.simpleBaseTime === undefined) {
      updates.simpleBaseTime = getDefaultTime();
    } else if (!isTimeBased && assignment.simpleBaseReps === undefined) {
      updates.simpleBaseReps = getDefaultReps();
    }
    
    if (isWeighted && assignment.simpleBaseWeight === undefined && getDefaultWeight() > 0) {
      updates.simpleBaseWeight = getDefaultWeight();
    }
    
    if (Object.keys(updates).length > 0) {
      onUpdate(updates);
    }
  }, []); // Run once on mount

  const handleBaseChange = (value: number) => {
    if (isTimeBased) {
      onUpdate({ simpleBaseTime: value });
    } else {
      onUpdate({ simpleBaseReps: value });
    }
  };

  const handleProgressionTypeChange = (type: ProgressionInterval) => {
    if (isTimeBased) {
      onUpdate({ simpleTimeProgressionType: type });
    } else {
      onUpdate({ simpleRepProgressionType: type });
    }
  };

  const handleIncrementChange = (value: number) => {
    if (isTimeBased) {
      onUpdate({ simpleTimeIncrement: value });
    } else {
      onUpdate({ simpleRepIncrement: value });
    }
  };

  const handleWeightChange = (value: number) => {
    onUpdate({ simpleBaseWeight: value });
  };

  const handleWeightProgressionTypeChange = (type: ProgressionInterval) => {
    onUpdate({ simpleWeightProgressionType: type });
  };

  const handleWeightIncrementChange = (value: number) => {
    onUpdate({ simpleWeightIncrement: value });
  };

  return (
    <div className="border border-dark-border rounded-lg p-3">
      <div className="flex items-center gap-2 mb-3">
        <Badge variant={exercise.type} className="text-2xs">
          {EXERCISE_TYPE_LABELS[exercise.type]}
        </Badge>
        <span className="font-medium text-gray-900 dark:text-gray-100">{exercise.name}</span>
        {isWeighted && (
          <Badge variant="other" className="text-2xs">Weighted</Badge>
        )}
      </div>
      
      {/* Reps/Time Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Base Value */}
        <div>
          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
            Base {isTimeBased ? 'Time (sec)' : 'Reps'}
          </label>
          <NumberInput
            value={baseValue}
            onChange={handleBaseChange}
            min={1}
            className="w-full"
          />
        </div>
        
        {/* Progression Type */}
        <div>
          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
            {isTimeBased ? 'Time' : 'Rep'} Progression
          </label>
          <Select
            value={progressionType}
            onChange={(e) => handleProgressionTypeChange(e.target.value as ProgressionInterval)}
            options={[
              { value: 'constant', label: 'Constant' },
              { value: 'per_workout', label: 'Each workout' },
              { value: 'per_week', label: 'Each week' }
            ]}
            className="w-full"
          />
        </div>
        
        {/* Increment */}
        <div>
          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
            Add {isTimeBased ? 'sec' : 'reps'}
          </label>
          <NumberInput
            value={increment || 0}
            onChange={handleIncrementChange}
            min={0}
            disabled={progressionType === 'constant'}
            className="w-full"
          />
        </div>
      </div>
      
      {/* Weight Row (only for weighted exercises) */}
      {isWeighted && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3 pt-3 border-t border-dark-border">
          {/* Base Weight */}
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
              Base Weight (lbs)
            </label>
            <NumberInput
              value={baseWeight}
              onChange={handleWeightChange}
              min={0}
              className="w-full"
            />
          </div>
          
          {/* Weight Progression Type */}
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
              Weight Progression
            </label>
            <Select
              value={weightProgressionType}
              onChange={(e) => handleWeightProgressionTypeChange(e.target.value as ProgressionInterval)}
              options={[
                { value: 'constant', label: 'Constant' },
                { value: 'per_workout', label: 'Each workout' },
                { value: 'per_week', label: 'Each week' }
              ]}
              className="w-full"
            />
          </div>
          
          {/* Weight Increment */}
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
              Add lbs
            </label>
            <NumberInput
              value={weightIncrement || 0}
              onChange={handleWeightIncrementChange}
              min={0}
              disabled={weightProgressionType === 'constant'}
              className="w-full"
            />
          </div>
        </div>
      )}
      
      {/* Preview */}
      {(progressionType !== 'constant' && increment && increment > 0) || 
       (isWeighted && weightProgressionType !== 'constant' && weightIncrement && weightIncrement > 0) ? (
        <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          Week 1: {baseValue}{isTimeBased ? ' sec' : ' reps'}
          {isWeighted && baseWeight > 0 && ` @ ${baseWeight} lbs`}
          {' → '}
          Week 4: {progressionType !== 'constant' && increment 
            ? baseValue + (progressionType === 'per_week' ? 3 : 11) * increment 
            : baseValue}
          {isTimeBased ? ' sec' : ' reps'}
          {isWeighted && baseWeight > 0 && weightProgressionType !== 'constant' && weightIncrement
            ? ` @ ${baseWeight + (weightProgressionType === 'per_week' ? 3 : 11) * weightIncrement} lbs`
            : isWeighted && baseWeight > 0 ? ` @ ${baseWeight} lbs` : ''}
        </div>
      ) : null}
    </div>
  );
}

function ReviewStep({
  progressionMode,
  name,
  startDate,
  numberOfWeeks,
  workoutDaysPerWeek,
  groups,
  exerciseMap,
  weeklySetGoals,
  groupRotation,
  rfemRotation,
  validation
}: {
  progressionMode: ProgressionMode;
  name: string;
  startDate: string;
  numberOfWeeks: number;
  workoutDaysPerWeek: number;
  groups: Group[];
  exerciseMap: Map<string, Exercise>;
  weeklySetGoals: Record<ExerciseType, number>;
  groupRotation: string[];
  rfemRotation: number[];
  validation: { valid: boolean; errors: string[]; warnings: string[] };
}) {
  const isSimpleMode = progressionMode === 'simple';
  const isMixedMode = progressionMode === 'mixed';
  const totalExercises = new Set(
    groups.flatMap(g => g.exerciseAssignments.map(a => a.exerciseId))
  ).size;
  
  const totalWeeklySets = Object.values(weeklySetGoals).reduce((a, b) => a + b, 0);

  // For mixed mode, categorize exercises
  const categorizedExercises = isMixedMode ? (() => {
    const rfemExercises: { exercise: Exercise; group: Group }[] = [];
    const simpleExercises: { exercise: Exercise; assignment: ExerciseAssignment; group: Group }[] = [];
    const conditioningExercises: { exercise: Exercise; assignment: ExerciseAssignment; group: Group }[] = [];
    
    groups.forEach(group => {
      group.exerciseAssignments.forEach(assignment => {
        const exercise = exerciseMap.get(assignment.exerciseId);
        if (!exercise) return;
        
        if (exercise.mode === 'conditioning') {
          conditioningExercises.push({ exercise, assignment, group });
        } else if (assignment.progressionMode === 'simple') {
          simpleExercises.push({ exercise, assignment, group });
        } else {
          rfemExercises.push({ exercise, group });
        }
      });
    });
    
    return { rfemExercises, simpleExercises, conditioningExercises };
  })() : null;

  // Get badge for mode
  const getModeLabel = () => {
    if (isSimpleMode) return 'Simple';
    if (isMixedMode) return 'Mixed';
    return 'RFEM';
  };
  
  const getModeBadgeVariant = () => {
    if (isSimpleMode) return 'other';
    if (isMixedMode) return 'balance';
    return 'push';
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
        Review & Confirm
      </h2>

      {/* Validation Messages */}
      {validation.errors.length > 0 && (
        <Card className="p-3 border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-red-700 dark:text-red-400">Errors</p>
              <ul className="text-sm text-red-600 dark:text-red-400 mt-1 space-y-1">
                {validation.errors.map((err, i) => <li key={i}>• {err}</li>)}
              </ul>
            </div>
          </div>
        </Card>
      )}

      {validation.warnings.length > 0 && (
        <Card className="p-3 border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-yellow-700 dark:text-yellow-400">Warnings</p>
              <ul className="text-sm text-yellow-600 dark:text-yellow-400 mt-1 space-y-1">
                {validation.warnings.map((warn, i) => <li key={i}>• {warn}</li>)}
              </ul>
            </div>
          </div>
        </Card>
      )}

      {/* Summary */}
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <h3 className="font-medium text-gray-900 dark:text-gray-100">{name}</h3>
          <Badge variant={getModeBadgeVariant()} className="text-2xs">
            {getModeLabel()}
          </Badge>
        </div>
        
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-gray-500 dark:text-gray-400">Start Date</span>
            <p className="font-medium">{new Date(startDate).toLocaleDateString()}</p>
          </div>
          <div>
            <span className="text-gray-500 dark:text-gray-400">Duration</span>
            <p className="font-medium">{numberOfWeeks} weeks</p>
          </div>
          <div>
            <span className="text-gray-500 dark:text-gray-400">Workout Days</span>
            <p className="font-medium">{workoutDaysPerWeek} per week</p>
          </div>
          <div>
            <span className="text-gray-500 dark:text-gray-400">Total Workouts</span>
            <p className="font-medium">{numberOfWeeks * workoutDaysPerWeek}</p>
          </div>
          <div>
            <span className="text-gray-500 dark:text-gray-400">Groups</span>
            <p className="font-medium">{groups.length}</p>
          </div>
          <div>
            <span className="text-gray-500 dark:text-gray-400">Exercises</span>
            <p className="font-medium">{totalExercises}</p>
          </div>
        </div>
      </Card>

      {/* Weekly Goals Summary */}
      <Card className="p-4">
        <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-3">
          Weekly Goals ({totalWeeklySets} total sets)
        </h3>
        <div className="flex flex-wrap gap-2">
          {EXERCISE_TYPES.filter(t => weeklySetGoals[t] > 0).map(type => (
            <Badge key={type} variant={type}>
              {EXERCISE_TYPE_LABELS[type]}: {weeklySetGoals[type]}
            </Badge>
          ))}
        </div>
      </Card>

      {/* Simple Mode: Exercise Targets Summary */}
      {isSimpleMode && (
        <Card className="p-4">
          <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-3">
            Exercise Targets
          </h3>
          <div className="space-y-3">
            {groups.map(group => (
              <div key={group.id}>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{group.name}</p>
                <div className="space-y-1">
                  {group.exerciseAssignments.map(a => {
                    const exercise = exerciseMap.get(a.exerciseId);
                    if (!exercise) return null;
                    const isTimeBased = exercise.measurementType === 'time';
                    const isWeighted = exercise.weightEnabled === true;
                    const baseValue = isTimeBased ? a.simpleBaseTime : a.simpleBaseReps;
                    const progressionType = isTimeBased ? a.simpleTimeProgressionType : a.simpleRepProgressionType;
                    const increment = isTimeBased ? a.simpleTimeIncrement : a.simpleRepIncrement;
                    const baseWeight = a.simpleBaseWeight;
                    const weightProgressionType = a.simpleWeightProgressionType;
                    const weightIncrement = a.simpleWeightIncrement;
                    
                    return (
                      <div key={a.exerciseId} className="flex flex-wrap items-center gap-x-2 gap-y-0 text-sm pl-2">
                        <span className="text-gray-600 dark:text-gray-400">{exercise.name}:</span>
                        <span className="font-medium">
                          {baseValue || '?'} {isTimeBased ? 'sec' : 'reps'}
                          {isWeighted && baseWeight ? ` @ ${baseWeight} lbs` : ''}
                        </span>
                        {progressionType && progressionType !== 'constant' && increment && (
                          <span className="text-gray-500 dark:text-gray-400">
                            (+{increment} {isTimeBased ? 'sec' : 'reps'} {PROGRESSION_INTERVAL_LABELS[progressionType].toLowerCase()})
                          </span>
                        )}
                        {isWeighted && weightProgressionType && weightProgressionType !== 'constant' && weightIncrement && (
                          <span className="text-gray-500 dark:text-gray-400">
                            (+{weightIncrement} lbs {PROGRESSION_INTERVAL_LABELS[weightProgressionType].toLowerCase()})
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Mixed Mode: Exercise Summary by Mode */}
      {isMixedMode && categorizedExercises && (
        <Card className="p-4">
          <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-3">
            Exercise Configuration
          </h3>
          <div className="space-y-4">
            {/* RFEM Exercises */}
            {categorizedExercises.rfemExercises.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="push" className="text-2xs">RFEM</Badge>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    Rotation: {rfemRotation.map(r => `-${r}`).join(', ')}
                  </span>
                </div>
                <div className="pl-2 space-y-0.5">
                  {categorizedExercises.rfemExercises.map(({ exercise, group }) => (
                    <p key={exercise.id} className="text-sm text-gray-600 dark:text-gray-400">
                      {exercise.name} <span className="text-gray-400">({group.name})</span>
                    </p>
                  ))}
                </div>
              </div>
            )}

            {/* Simple Progression Exercises */}
            {categorizedExercises.simpleExercises.length > 0 && (
              <div>
                <Badge variant="other" className="text-2xs mb-2">Simple Progression</Badge>
                <div className="pl-2 space-y-1">
                  {categorizedExercises.simpleExercises.map(({ exercise, assignment }) => {
                    const isTimeBased = exercise.measurementType === 'time';
                    const isWeighted = exercise.weightEnabled === true;
                    const baseValue = isTimeBased ? assignment.simpleBaseTime : assignment.simpleBaseReps;
                    const progressionType = isTimeBased ? assignment.simpleTimeProgressionType : assignment.simpleRepProgressionType;
                    const increment = isTimeBased ? assignment.simpleTimeIncrement : assignment.simpleRepIncrement;
                    const baseWeight = assignment.simpleBaseWeight;
                    const weightProgressionType = assignment.simpleWeightProgressionType;
                    const weightIncrement = assignment.simpleWeightIncrement;
                    
                    return (
                      <div key={exercise.id} className="flex flex-wrap items-center gap-x-2 gap-y-0 text-sm">
                        <span className="text-gray-600 dark:text-gray-400">{exercise.name}:</span>
                        <span className="font-medium">
                          {baseValue || '?'} {isTimeBased ? 'sec' : 'reps'}
                          {isWeighted && baseWeight ? ` @ ${baseWeight} lbs` : ''}
                        </span>
                        {progressionType && progressionType !== 'constant' && increment && (
                          <span className="text-gray-500 dark:text-gray-400">
                            (+{increment}/{progressionType === 'per_workout' ? 'workout' : 'week'})
                          </span>
                        )}
                        {isWeighted && weightProgressionType && weightProgressionType !== 'constant' && weightIncrement && (
                          <span className="text-gray-500 dark:text-gray-400">
                            (+{weightIncrement} lbs/{weightProgressionType === 'per_workout' ? 'workout' : 'week'})
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Conditioning Exercises */}
            {categorizedExercises.conditioningExercises.length > 0 && (
              <div>
                <Badge variant="core" className="text-2xs mb-2">Conditioning</Badge>
                <div className="pl-2 space-y-1">
                  {categorizedExercises.conditioningExercises.map(({ exercise, assignment }) => {
                    const isTimeBased = exercise.measurementType === 'time';
                    const baseValue = isTimeBased ? assignment.conditioningBaseTime : assignment.conditioningBaseReps;
                    const increment = isTimeBased ? assignment.conditioningTimeIncrement : assignment.conditioningRepIncrement;
                    
                    return (
                      <div key={exercise.id} className="flex items-center gap-2 text-sm">
                        <span className="text-gray-600 dark:text-gray-400">{exercise.name}:</span>
                        <span className="font-medium">
                          {baseValue || '?'} {isTimeBased ? 'sec' : 'reps'}
                        </span>
                        {increment !== undefined && increment > 0 && (
                          <span className="text-gray-500 dark:text-gray-400">
                            (+{increment} {isTimeBased ? 'sec' : 'reps'}/week)
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Rotation Preview */}
      <Card className="p-4">
        <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-3">
          First Week Preview
        </h3>
        <div className="space-y-2">
          {Array.from({ length: workoutDaysPerWeek }, (_, i) => {
            const groupId = groupRotation[i % groupRotation.length];
            const group = groups.find(g => g.id === groupId);
            const rfem = rfemRotation[i % rfemRotation.length];
            
            return (
              <div key={i} className="flex items-center gap-2 text-sm">
                <span className="text-gray-500 dark:text-gray-400 w-12">Day {i + 1}</span>
                <span className="font-medium">{group?.name || 'Unknown'}</span>
                {!isSimpleMode && (
                  <>
                    <span className="text-gray-400">•</span>
                    <span className="text-gray-500 dark:text-gray-400">RFEM -{rfem}</span>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
