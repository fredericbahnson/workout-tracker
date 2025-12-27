import { useState, useEffect } from 'react';
import { 
  ArrowRight, 
  ArrowLeft, 
  Target, 
  CheckCircle,
  X,
  Plus,
  Minus,
  Dumbbell,
  AlertCircle
} from 'lucide-react';
import { Button, Card, CardContent, Modal } from '../ui';
import { CycleRepo, ExerciseRepo, MaxRecordRepo, ScheduledWorkoutRepo } from '../../data/repositories';
import { useSyncItem } from '../../contexts/SyncContext';
import { generateId } from '../../data/db';
import type { Cycle, Exercise, Group, ScheduledSet, ScheduledWorkout, ExerciseType } from '../../types';

interface MaxTestingWizardProps {
  completedCycle?: Cycle;  // Optional - if not provided, user selects all exercises
  onComplete: () => void;
  onCancel: () => void;
}

interface ExerciseToTest {
  exerciseId: string;
  exerciseName: string;
  exerciseType: ExerciseType;
  isConditioning: boolean;
  previousMaxReps: number | null;
  conditioningBaseReps?: number;
  newConditioningBaseReps?: number;
  included: boolean;
  groupName: string;
}

type Step = 'select_exercises' | 'conditioning_baselines' | 'review';

export function MaxTestingWizard({ completedCycle, onComplete, onCancel }: MaxTestingWizardProps) {
  const { syncItem } = useSyncItem();
  const [step, setStep] = useState<Step>('select_exercises');
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [exercisesToTest, setExercisesToTest] = useState<ExerciseToTest[]>([]);
  const [additionalExercises, setAdditionalExercises] = useState<Exercise[]>([]);
  const [showAddExercise, setShowAddExercise] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load exercises and their current maxes
  useEffect(() => {
    async function loadData() {
      const allExercises = await ExerciseRepo.getAll();
      setExercises(allExercises);

      const toTest: ExerciseToTest[] = [];
      
      if (completedCycle) {
        // Get unique exercises from all groups in the completed cycle
        const exerciseMap = new Map<string, { groupName: string; conditioningBaseReps?: number }>();
        
        for (const group of completedCycle.groups) {
          for (const assignment of group.exerciseAssignments) {
            if (!exerciseMap.has(assignment.exerciseId)) {
              exerciseMap.set(assignment.exerciseId, {
                groupName: group.name,
                conditioningBaseReps: assignment.conditioningBaseReps
              });
            }
          }
        }

        // Build the exercise list from the cycle
        for (const [exerciseId, info] of exerciseMap) {
          const exercise = allExercises.find(e => e.id === exerciseId);
          if (!exercise) continue;

          let previousMaxReps: number | null = null;
          if (exercise.mode === 'standard') {
            const maxRecords = await MaxRecordRepo.getAllForExercise(exerciseId);
            if (maxRecords.length > 0) {
              previousMaxReps = maxRecords[0].maxReps;
            }
          }

          toTest.push({
            exerciseId,
            exerciseName: exercise.name,
            exerciseType: exercise.type,
            isConditioning: exercise.mode === 'conditioning',
            previousMaxReps,
            conditioningBaseReps: info.conditioningBaseReps,
            newConditioningBaseReps: info.conditioningBaseReps,
            included: true,
            groupName: info.groupName
          });
        }

        // Sort by group name
        toTest.sort((a, b) => a.groupName.localeCompare(b.groupName));

        // Find exercises not in the cycle for "add more" option
        const cycleExerciseIds = new Set(exerciseMap.keys());
        const additional = allExercises.filter(e => 
          !cycleExerciseIds.has(e.id) && e.mode === 'standard'
        );
        setAdditionalExercises(additional);
      } else {
        // No completed cycle - show all standard exercises for selection
        for (const exercise of allExercises) {
          if (exercise.mode === 'standard') {
            let previousMaxReps: number | null = null;
            const maxRecords = await MaxRecordRepo.getAllForExercise(exercise.id);
            if (maxRecords.length > 0) {
              previousMaxReps = maxRecords[0].maxReps;
            }

            toTest.push({
              exerciseId: exercise.id,
              exerciseName: exercise.name,
              exerciseType: exercise.type,
              isConditioning: false,
              previousMaxReps,
              included: false, // Start with none selected
              groupName: exercise.type.charAt(0).toUpperCase() + exercise.type.slice(1) // Use type as group
            });
          }
        }

        // Sort by type/group name
        toTest.sort((a, b) => a.groupName.localeCompare(b.groupName));
        
        // No additional exercises when starting fresh
        setAdditionalExercises([]);
      }

      setExercisesToTest(toTest);
    }
    
    loadData();
  }, [completedCycle]);

  const toggleExercise = (exerciseId: string) => {
    setExercisesToTest(prev => 
      prev.map(e => 
        e.exerciseId === exerciseId 
          ? { ...e, included: !e.included }
          : e
      )
    );
  };

  const updateConditioningReps = (exerciseId: string, reps: number) => {
    setExercisesToTest(prev =>
      prev.map(e =>
        e.exerciseId === exerciseId
          ? { ...e, newConditioningBaseReps: reps }
          : e
      )
    );
  };

  const addExerciseToTest = async (exercise: Exercise) => {
    let previousMaxReps: number | null = null;
    if (exercise.mode === 'standard') {
      const maxRecords = await MaxRecordRepo.getAllForExercise(exercise.id);
      if (maxRecords.length > 0) {
        previousMaxReps = maxRecords[0].maxReps;
      }
    }

    setExercisesToTest(prev => [
      ...prev,
      {
        exerciseId: exercise.id,
        exerciseName: exercise.name,
        exerciseType: exercise.type,
        isConditioning: exercise.mode === 'conditioning',
        previousMaxReps,
        included: true,
        groupName: 'Added'
      }
    ]);

    setAdditionalExercises(prev => prev.filter(e => e.id !== exercise.id));
    setShowAddExercise(false);
  };

  const handleNext = () => {
    const hasConditioning = exercisesToTest.some(e => e.included && e.isConditioning);
    
    if (step === 'select_exercises') {
      if (hasConditioning) {
        setStep('conditioning_baselines');
      } else {
        setStep('review');
      }
    } else if (step === 'conditioning_baselines') {
      setStep('review');
    }
  };

  const handleBack = () => {
    const hasConditioning = exercisesToTest.some(e => e.included && e.isConditioning);
    
    if (step === 'review') {
      if (hasConditioning) {
        setStep('conditioning_baselines');
      } else {
        setStep('select_exercises');
      }
    } else if (step === 'conditioning_baselines') {
      setStep('select_exercises');
    }
  };

  const createMaxTestingCycle = async () => {
    setIsCreating(true);
    setError(null);

    try {
      const includedExercises = exercisesToTest.filter(e => e.included);
      const standardExercises = includedExercises.filter(e => !e.isConditioning);
      
      if (standardExercises.length === 0) {
        setError('Please select at least one standard exercise to test.');
        setIsCreating(false);
        return;
      }

      // Group exercises by TYPE (push, pull, legs, etc.)
      const exercisesByType = new Map<string, ExerciseToTest[]>();
      for (const ex of standardExercises) {
        const type = ex.exerciseType;
        if (!exercisesByType.has(type)) {
          exercisesByType.set(type, []);
        }
        exercisesByType.get(type)!.push(ex);
      }

      // Determine number of days needed = max exercises in any single type
      let maxExercisesInType = 0;
      for (const exercises of exercisesByType.values()) {
        maxExercisesInType = Math.max(maxExercisesInType, exercises.length);
      }
      const numberOfDays = Math.max(1, maxExercisesInType);

      // Distribute exercises across days (one per type per day)
      // Day 1 gets first exercise of each type, Day 2 gets second, etc.
      const dayExercises: ExerciseToTest[][] = [];
      for (let day = 0; day < numberOfDays; day++) {
        dayExercises.push([]);
      }

      for (const [_type, exercises] of exercisesByType) {
        exercises.forEach((ex, index) => {
          dayExercises[index].push(ex);
        });
      }

      // Create groups (one per day)
      const groups: Group[] = [];
      const groupIds: string[] = [];

      for (let dayIndex = 0; dayIndex < numberOfDays; dayIndex++) {
        const dayEx = dayExercises[dayIndex];
        if (dayEx.length === 0) continue;

        const groupId = generateId();
        groupIds.push(groupId);
        
        // Create descriptive name based on day number
        const dayName = numberOfDays === 1 
          ? 'Max Test' 
          : `Max Test Day ${dayIndex + 1}`;
        
        groups.push({
          id: groupId,
          name: dayName,
          exerciseAssignments: dayEx.map(ex => ({
            exerciseId: ex.exerciseId
          }))
        });
      }

      const actualNumberOfDays = groups.length;
      if (actualNumberOfDays === 0) {
        setError('No exercises to schedule.');
        setIsCreating(false);
        return;
      }

      const startDate = new Date();
      startDate.setHours(0, 0, 0, 0);

      // Deactivate any existing active cycle first
      const existingActive = await CycleRepo.getActive();
      if (existingActive) {
        await CycleRepo.update(existingActive.id, { status: 'completed' });
      }

      // Create the max testing cycle - use returned cycle which has the actual DB ID
      const savedCycle = await CycleRepo.create({
        name: 'Max Testing',
        cycleType: 'max_testing',
        previousCycleId: completedCycle?.id,
        startDate,
        numberOfWeeks: 1,
        workoutDaysPerWeek: actualNumberOfDays,
        weeklySetGoals: { push: 0, pull: 0, legs: 0, core: 0, balance: 0, mobility: 0, other: 0 },
        groups,
        groupRotation: groupIds,
        rfemRotation: [0], // RFEM 0 = max testing
        conditioningWeeklyRepIncrement: 0,
        status: 'active',
      });

      await syncItem('cycles', savedCycle);

      // Create scheduled workouts - one per day/group
      for (let dayIndex = 0; dayIndex < actualNumberOfDays; dayIndex++) {
        const group = groups[dayIndex];
        const scheduledSets: ScheduledSet[] = [];
        let setNumber = 1;

        for (const assignment of group.exerciseAssignments) {
          const exerciseInfo = standardExercises.find(e => e.exerciseId === assignment.exerciseId);
          if (!exerciseInfo) continue;

          // Warmup set at 20% of previous max (calculated dynamically)
          if (exerciseInfo.previousMaxReps) {
            scheduledSets.push({
              id: generateId(),
              exerciseId: assignment.exerciseId,
              exerciseType: exerciseInfo.exerciseType,
              isConditioning: false,
              setNumber: setNumber++,
              isWarmup: true,
              isMaxTest: false,
              previousMaxReps: exerciseInfo.previousMaxReps
            });
          }

          // Max test set
          scheduledSets.push({
            id: generateId(),
            exerciseId: assignment.exerciseId,
            exerciseType: exerciseInfo.exerciseType,
            isConditioning: false,
            setNumber: setNumber++,
            isWarmup: false,
            isMaxTest: true,
            previousMaxReps: exerciseInfo.previousMaxReps ?? undefined
          });
        }

        const workout: ScheduledWorkout = {
          id: generateId(),
          cycleId: savedCycle.id,  // Use the saved cycle's actual ID
          sequenceNumber: dayIndex + 1,
          weekNumber: 1,
          dayInWeek: dayIndex + 1,
          groupId: group.id,
          rfem: 0,
          scheduledSets,
          status: 'pending'
        };

        await ScheduledWorkoutRepo.create(workout);
        await syncItem('scheduled_workouts', workout);
      }

      // Update conditioning exercise baselines
      const conditioningExercises = includedExercises.filter(e => e.isConditioning);
      for (const ex of conditioningExercises) {
        if (ex.newConditioningBaseReps !== ex.conditioningBaseReps) {
          const exercise = exercises.find(e => e.id === ex.exerciseId);
          if (exercise) {
            const updated = await ExerciseRepo.update(exercise.id, {
              defaultConditioningReps: ex.newConditioningBaseReps
            });
            if (updated) {
              await syncItem('exercises', updated);
            }
          }
        }
      }

      onComplete();
    } catch (err) {
      console.error('Failed to create max testing cycle:', err);
      setError('Failed to create max testing cycle. Please try again.');
      setIsCreating(false);
    }
  };

  const includedStandard = exercisesToTest.filter(e => e.included && !e.isConditioning);
  const includedConditioning = exercisesToTest.filter(e => e.included && e.isConditioning);

  // Calculate number of days needed (max exercises in any single type)
  const calculateNumberOfDays = () => {
    const exercisesByType = new Map<string, number>();
    for (const ex of includedStandard) {
      const count = (exercisesByType.get(ex.exerciseType) || 0) + 1;
      exercisesByType.set(ex.exerciseType, count);
    }
    let maxInType = 0;
    for (const count of exercisesByType.values()) {
      maxInType = Math.max(maxInType, count);
    }
    return Math.max(1, maxInType);
  };

  const numberOfDays = calculateNumberOfDays();

  return (
    <div className="fixed inset-0 bg-gray-50 dark:bg-[#121212] z-50 flex flex-col safe-area-top safe-area-bottom">
      {/* Header */}
      <div className="px-4 py-4 flex items-center justify-between border-b border-gray-200 dark:border-[#2D2D4A]">
        <button onClick={onCancel} className="p-2 -ml-2">
          <X className="w-5 h-5 text-gray-500" />
        </button>
        <h2 className="font-semibold text-gray-900 dark:text-gray-100">
          Max Testing Setup
        </h2>
        <div className="w-9" /> {/* Spacer for centering */}
      </div>

      {/* Progress indicator */}
      <div className="px-4 py-3 bg-gray-100 dark:bg-[#1A1A2E]">
        <div className="flex items-center gap-2 text-sm">
          <div className={`flex items-center gap-1 ${step === 'select_exercises' ? 'text-primary-600 dark:text-primary-400 font-medium' : 'text-gray-500'}`}>
            <span className="w-5 h-5 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-xs">1</span>
            Select
          </div>
          <div className="flex-1 h-px bg-gray-300 dark:bg-gray-600" />
          {exercisesToTest.some(e => e.included && e.isConditioning) && (
            <>
              <div className={`flex items-center gap-1 ${step === 'conditioning_baselines' ? 'text-primary-600 dark:text-primary-400 font-medium' : 'text-gray-500'}`}>
                <span className="w-5 h-5 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-xs">2</span>
                Conditioning
              </div>
              <div className="flex-1 h-px bg-gray-300 dark:bg-gray-600" />
            </>
          )}
          <div className={`flex items-center gap-1 ${step === 'review' ? 'text-primary-600 dark:text-primary-400 font-medium' : 'text-gray-500'}`}>
            <span className="w-5 h-5 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-xs">
              {exercisesToTest.some(e => e.included && e.isConditioning) ? '3' : '2'}
            </span>
            Review
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {error && (
          <div className="mb-4 flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
            <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
          </div>
        )}

        {step === 'select_exercises' && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-primary-50 dark:bg-primary-900/20 rounded-xl">
              <Target className="w-6 h-6 text-primary-600 dark:text-primary-400 flex-shrink-0" />
              <p className="text-sm text-primary-700 dark:text-primary-300">
                {completedCycle 
                  ? 'Select the exercises you want to test new maxes for. Standard exercises will have a warmup set at 20% of your previous max, then a max attempt.'
                  : 'Select the exercises you want to establish or re-test maxes for. Each exercise will have a warmup set (if you have a previous max) followed by a max attempt.'
                }
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {completedCycle ? `Exercises from ${completedCycle.name}` : 'Available Exercises'}
              </h3>
              
              {exercisesToTest.length === 0 && (
                <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                  No standard exercises found. Create some exercises first from the Exercises page.
                </p>
              )}
              
              {exercisesToTest.map(ex => (
                <button
                  key={ex.exerciseId}
                  onClick={() => toggleExercise(ex.exerciseId)}
                  className={`w-full flex items-center justify-between p-3 rounded-lg border transition-colors ${
                    ex.included
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-gray-200 dark:border-[#2D2D4A] bg-white dark:bg-[#1A1A2E]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded border flex items-center justify-center ${
                      ex.included 
                        ? 'bg-primary-500 border-primary-500' 
                        : 'border-gray-300 dark:border-gray-600'
                    }`}>
                      {ex.included && <CheckCircle className="w-4 h-4 text-white" />}
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-gray-900 dark:text-gray-100">
                        {ex.exerciseName}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {ex.groupName} • {ex.isConditioning ? 'Conditioning' : `Max: ${ex.previousMaxReps ?? 'Not set'}`}
                      </p>
                    </div>
                  </div>
                  {ex.isConditioning && (
                    <span className="text-xs px-2 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded">
                      Conditioning
                    </span>
                  )}
                </button>
              ))}
            </div>

            {additionalExercises.length > 0 && (
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <Button
                  variant="secondary"
                  onClick={() => setShowAddExercise(true)}
                  className="w-full"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Other Exercises
                </Button>
              </div>
            )}
          </div>
        )}

        {step === 'conditioning_baselines' && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl">
              <Dumbbell className="w-6 h-6 text-amber-600 dark:text-amber-400 flex-shrink-0" />
              <p className="text-sm text-amber-700 dark:text-amber-300">
                Update the baseline reps for your conditioning exercises. These will be used as the starting point for your next training cycle.
              </p>
            </div>

            <div className="space-y-3">
              {includedConditioning.map(ex => (
                <Card key={ex.exerciseId}>
                  <CardContent className="py-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-gray-100">
                          {ex.exerciseName}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Previous baseline: {ex.conditioningBaseReps ?? 'Not set'}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateConditioningReps(ex.exerciseId, Math.max(1, (ex.newConditioningBaseReps ?? 1) - 1))}
                          className="p-1 rounded bg-gray-100 dark:bg-gray-800"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <input
                          type="number"
                          value={ex.newConditioningBaseReps ?? ''}
                          onChange={(e) => updateConditioningReps(ex.exerciseId, parseInt(e.target.value) || 1)}
                          className="w-16 text-center py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#1A1A2E] text-gray-900 dark:text-gray-100"
                        />
                        <button
                          onClick={() => updateConditioningReps(ex.exerciseId, (ex.newConditioningBaseReps ?? 1) + 1)}
                          className="p-1 rounded bg-gray-100 dark:bg-gray-800"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {step === 'review' && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-xl">
              <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400 flex-shrink-0" />
              <p className="text-sm text-green-700 dark:text-green-300">
                Ready to create your max testing cycle. You'll test {includedStandard.length} exercise{includedStandard.length !== 1 ? 's' : ''} over {numberOfDays} day{numberOfDays !== 1 ? 's' : ''}.
              </p>
            </div>

            <Card>
              <CardContent>
                <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-3">
                  Standard Exercises (Max Testing)
                </h3>
                <div className="space-y-2">
                  {includedStandard.map(ex => (
                    <div key={ex.exerciseId} className="flex items-center justify-between text-sm">
                      <span className="text-gray-700 dark:text-gray-300">{ex.exerciseName}</span>
                      <span className="text-gray-500 dark:text-gray-400">
                        Warmup: {ex.previousMaxReps ? Math.round(ex.previousMaxReps * 0.2) : '—'} → Max attempt
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {includedConditioning.length > 0 && (
              <Card>
                <CardContent>
                  <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-3">
                    Conditioning Exercises (Updated Baselines)
                  </h3>
                  <div className="space-y-2">
                    {includedConditioning.map(ex => (
                      <div key={ex.exerciseId} className="flex items-center justify-between text-sm">
                        <span className="text-gray-700 dark:text-gray-300">{ex.exerciseName}</span>
                        <span className="text-gray-500 dark:text-gray-400">
                          {ex.conditioningBaseReps} → {ex.newConditioningBaseReps} reps
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-gray-200 dark:border-[#2D2D4A] flex gap-3">
        {step !== 'select_exercises' && (
          <Button variant="secondary" onClick={handleBack} className="px-4">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        )}
        
        {step === 'review' ? (
          <Button 
            onClick={createMaxTestingCycle} 
            disabled={isCreating || includedStandard.length === 0}
            className="flex-1"
          >
            {isCreating ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Creating...
              </span>
            ) : (
              <>
                Start Max Testing
                <ArrowRight className="w-5 h-5 ml-2" />
              </>
            )}
          </Button>
        ) : (
          <Button 
            onClick={handleNext} 
            disabled={includedStandard.length === 0 && includedConditioning.length === 0}
            className="flex-1"
          >
            Next
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        )}
      </div>

      {/* Add Exercise Modal */}
      <Modal
        isOpen={showAddExercise}
        onClose={() => setShowAddExercise(false)}
        title="Add Exercise to Test"
      >
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {additionalExercises.map(ex => (
            <button
              key={ex.id}
              onClick={() => addExerciseToTest(ex)}
              className="w-full flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-[#2D2D4A] hover:bg-gray-50 dark:hover:bg-[#252542] transition-colors"
            >
              <span className="font-medium text-gray-900 dark:text-gray-100">{ex.name}</span>
              <Plus className="w-4 h-4 text-gray-400" />
            </button>
          ))}
          {additionalExercises.length === 0 && (
            <p className="text-center text-gray-500 dark:text-gray-400 py-4">
              No additional exercises available
            </p>
          )}
        </div>
      </Modal>
    </div>
  );
}
