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
import { Button, Input, NumberInput, Select, Card, Badge, Modal } from '../ui';
import { ExerciseRepo, CycleRepo, ScheduledWorkoutRepo } from '../../data/repositories';
import { generateSchedule, validateCycle } from '../../services/scheduler';
import { generateId } from '../../data/db';
import { useAppStore } from '../../stores/appStore';
import { 
  EXERCISE_TYPES, 
  EXERCISE_TYPE_LABELS, 
  type Cycle, 
  type Group, 
  type ExerciseType,
  type Exercise,
  type ExerciseAssignment
} from '../../types';

interface CycleWizardProps {
  onComplete: () => void;
  onCancel: () => void;
  editCycle?: Cycle;  // If provided, we're editing an existing cycle
}

type WizardStep = 'start' | 'basics' | 'groups' | 'goals' | 'review';

const STEPS: { key: WizardStep; label: string }[] = [
  { key: 'start', label: 'Start' },
  { key: 'basics', label: 'Basics' },
  { key: 'groups', label: 'Groups' },
  { key: 'goals', label: 'Goals' },
  { key: 'review', label: 'Review' }
];

export function CycleWizard({ onComplete, onCancel, editCycle }: CycleWizardProps) {
  const { defaults } = useAppStore();
  // Skip 'start' step if editing an existing cycle
  const [currentStep, setCurrentStep] = useState<WizardStep>(editCycle ? 'basics' : 'start');
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
  const [workoutDaysPerWeek, setWorkoutDaysPerWeek] = useState(editCycle?.workoutDaysPerWeek || 3);
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
    
    // Don't copy name - suggest a new one
    setName(`${sourceCycle.name} (Copy)`);
    
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

  const exerciseMap = new Map(exercises?.map(e => [e.id, e]) || []);

  // Validation
  const validation = exercises ? validateCycle(
    {
      name,
      cycleType: 'training',
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
      case 'goals':
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
          const pendingWorkouts = allWorkouts.filter(w => w.status === 'pending' || w.status === 'partial');
          for (const workout of pendingWorkouts) {
            await ScheduledWorkoutRepo.delete(workout.id);
          }
          
          // Generate new schedule starting from current position
          const completedCount = cycleProgress?.passed || 0;
          const scheduleInput = {
            cycle,
            exercises: exerciseMap,
            startFromWorkout: completedCount + 1
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

  // Get steps to display (hide 'start' step from progress indicator)
  const displaySteps = editCycle ? STEPS.filter(s => s.key !== 'start') : STEPS.filter(s => s.key !== 'start');
  
  // Get cycles available for cloning (all except the current one being edited)
  const cloneableCycles = allCycles?.filter(c => c.id !== editCycle?.id) || [];

  return (
    <div className="flex flex-col h-full">
      {/* Progress indicator - hide on start step */}
      {currentStep !== 'start' && (
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
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
            onAddGroup={addGroup}
            onRemoveGroup={removeGroup}
            onUpdateGroupName={updateGroupName}
            onAddExercise={addExerciseToGroup}
            onRemoveExercise={removeExerciseFromGroup}
            onUpdateConditioningReps={updateConditioningReps}
          />
        )}

        {currentStep === 'goals' && (
          <GoalsStep
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
            name={name}
            startDate={startDate}
            numberOfWeeks={numberOfWeeks}
            workoutDaysPerWeek={workoutDaysPerWeek}
            groups={groups}
            weeklySetGoals={weeklySetGoals}
            groupRotation={groupRotation}
            rfemRotation={rfemRotation}
            validation={validation}
          />
        )}
      </div>

      {/* Navigation - hide on start step (it has its own buttons) */}
      {currentStep !== 'start' && (
        <div className="flex gap-3 p-4 border-t border-gray-200 dark:border-gray-700">
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
              className="w-full p-4 text-left rounded-lg border border-gray-200 dark:border-gray-700 hover:border-primary-500 dark:hover:border-primary-500 transition-colors"
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
              className="w-full p-4 text-left rounded-lg border border-gray-200 dark:border-gray-700 hover:border-primary-500 dark:hover:border-primary-500 transition-colors"
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
          className="w-full p-4 text-left rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:border-primary-500 dark:hover:border-primary-500 transition-colors bg-white dark:bg-gray-800"
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
                <div className="w-full border-t border-gray-200 dark:border-gray-700" />
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
                  className="w-full p-4 text-left rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:border-primary-500 dark:hover:border-primary-500 transition-colors bg-white dark:bg-gray-800"
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
  onAddGroup,
  onRemoveGroup,
  onUpdateGroupName,
  onAddExercise,
  onRemoveExercise,
  onUpdateConditioningReps
}: {
  groups: Group[];
  exercises: Exercise[];
  exerciseMap: Map<string, Exercise>;
  defaults: { defaultConditioningReps: number };
  onAddGroup: () => void;
  onRemoveGroup: (id: string) => void;
  onUpdateGroupName: (id: string, name: string) => void;
  onAddExercise: (groupId: string, exerciseId: string) => void;
  onRemoveExercise: (groupId: string, exerciseId: string) => void;
  onUpdateConditioningReps: (groupId: string, exerciseId: string, reps: number) => void;
}) {
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [showExercisePicker, setShowExercisePicker] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Workout Groups
        </h2>
        <Button variant="secondary" size="sm" onClick={onAddGroup}>
          <Plus className="w-4 h-4 mr-1" />
          Add Group
        </Button>
      </div>

      <p className="text-sm text-gray-500 dark:text-gray-400">
        Create groups of exercises that will be performed together on the same day.
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
              <div className="space-y-1">
                {group.exerciseAssignments.map(assignment => {
                  const exercise = exerciseMap.get(assignment.exerciseId);
                  if (!exercise) return null;
                  
                  return (
                    <div 
                      key={assignment.exerciseId}
                      className="flex items-start gap-2 py-1.5 px-2 bg-gray-50 dark:bg-gray-800/50 rounded"
                    >
                      <Badge variant={exercise.type} className="text-[10px] flex-shrink-0 mt-0.5">
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
        <div className="space-y-2">
          {exercises.map(exercise => {
            const group = groups.find(g => g.id === selectedGroup);
            const isAdded = group?.exerciseAssignments.some(a => a.exerciseId === exercise.id);
            
            return (
              <button
                key={exercise.id}
                onClick={() => {
                  if (selectedGroup) {
                    if (isAdded) {
                      // Remove if already added
                      onRemoveExercise(selectedGroup, exercise.id);
                    } else {
                      // Add if not added
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
      </Modal>
    </div>
  );
}

function GoalsStep({
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
            <div key={type} className="flex items-center gap-2">
              <Badge variant={type} className="w-20 justify-center">
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

      {/* RFEM Rotation */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
          RFEM Rotation
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
          Reps From Established Max: subtracted from your max for target reps
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

      {/* Conditioning Increment */}
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
    </div>
  );
}

function ReviewStep({
  name,
  startDate,
  numberOfWeeks,
  workoutDaysPerWeek,
  groups,
  weeklySetGoals,
  groupRotation,
  rfemRotation,
  validation
}: {
  name: string;
  startDate: string;
  numberOfWeeks: number;
  workoutDaysPerWeek: number;
  groups: Group[];
  weeklySetGoals: Record<ExerciseType, number>;
  groupRotation: string[];
  rfemRotation: number[];
  validation: { valid: boolean; errors: string[]; warnings: string[] };
}) {
  const totalExercises = new Set(
    groups.flatMap(g => g.exerciseAssignments.map(a => a.exerciseId))
  ).size;
  
  const totalWeeklySets = Object.values(weeklySetGoals).reduce((a, b) => a + b, 0);

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
        <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-3">{name}</h3>
        
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
                <span className="text-gray-400">•</span>
                <span className="text-gray-500 dark:text-gray-400">RFEM -{rfem}</span>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
