import { generateId } from '@/data/db';
import type { 
  Cycle, 
  ScheduledWorkout, 
  ScheduledSet, 
  Exercise, 
  ExerciseType, 
  MaxRecord,
  Group,
  ExerciseAssignment,
  ProgressionInterval
} from '@/types';
import { getProgressionMode, getExerciseProgressionMode, getSetProgressionMode } from '@/types';
import { WARMUP, RFEM, WEIGHT, CONDITIONING } from '@/constants/training';
import { createScopedLogger } from '@/utils/logger';

const log = createScopedLogger('Scheduler');

interface SchedulerInput {
  cycle: Cycle;
  exercises: Map<string, Exercise>;
  startFromWorkout?: number; // If provided, only generate workouts from this sequence number
}

interface DayAllocation {
  sequenceNumber: number;
  weekNumber: number;
  dayInWeek: number;
  group: Group;
  rfem: number;
  setsByType: Record<ExerciseType, number>;
}

/**
 * Generates all scheduled workouts for a cycle
 */
export function generateSchedule(input: SchedulerInput): Omit<ScheduledWorkout, 'id'>[] {
  const { cycle, exercises, startFromWorkout = 1 } = input;
  const workouts: Omit<ScheduledWorkout, 'id'>[] = [];
  let sequenceNumber = 1;

  // For each week in the cycle
  for (let week = 1; week <= cycle.numberOfWeeks; week++) {
    const weekWorkouts = generateWeekSchedule(cycle, week, exercises, sequenceNumber);
    
    // Only add workouts at or after startFromWorkout
    for (const workout of weekWorkouts) {
      if (sequenceNumber >= startFromWorkout) {
        workouts.push(workout);
      }
      sequenceNumber++;
    }
  }

  return workouts;
}

/**
 * Generates scheduled workouts for a single week
 */
function generateWeekSchedule(
  cycle: Cycle,
  weekNumber: number,
  exercises: Map<string, Exercise>,
  startingSequence: number
): Omit<ScheduledWorkout, 'id'>[] {
  const { workoutDaysPerWeek, groups, groupRotation, rfemRotation, weeklySetGoals } = cycle;

  // Build day allocations
  const dayAllocations: DayAllocation[] = [];
  
  for (let dayNum = 1; dayNum <= workoutDaysPerWeek; dayNum++) {
    // Determine group and RFEM for this day
    const groupIndex = (dayNum - 1) % groupRotation.length;
    const rfemIndex = (dayNum - 1) % rfemRotation.length;
    
    const groupId = groupRotation[groupIndex];
    const group = groups.find(g => g.id === groupId);
    
    if (!group) {
      log.warn(`Group ${groupId} not found in cycle`);
      continue;
    }

    const rfem = rfemRotation[rfemIndex];

    dayAllocations.push({
      sequenceNumber: startingSequence + dayNum - 1,
      weekNumber,
      dayInWeek: dayNum,
      group,
      rfem,
      setsByType: {} as Record<ExerciseType, number>
    });
  }

  // Distribute sets across days
  distributeSets(dayAllocations, weeklySetGoals, exercises);

  // Convert allocations to scheduled workouts
  return dayAllocations.map(day => 
    createScheduledWorkout(day, cycle, exercises)
  );
}

/**
 * Distributes weekly set goals across workout days
 */
function distributeSets(
  days: DayAllocation[],
  weeklySetGoals: Record<ExerciseType, number>,
  exercises: Map<string, Exercise>
): void {
  const exerciseTypes: ExerciseType[] = ['push', 'pull', 'legs', 'core', 'balance', 'mobility', 'other'];

  for (const type of exerciseTypes) {
    const totalSets = weeklySetGoals[type] || 0;
    if (totalSets === 0) continue;

    // Find which days have exercises of this type
    const eligibleDays = days.filter(day => {
      return day.group.exerciseAssignments.some(ea => {
        const exercise = exercises.get(ea.exerciseId);
        return exercise && exercise.type === type;
      });
    });

    if (eligibleDays.length === 0) {
      log.warn(`No days have exercises of type ${type}, but goal is ${totalSets} sets`);
      continue;
    }

    // Base distribution
    const baseSets = Math.floor(totalSets / eligibleDays.length);
    let remainder = totalSets % eligibleDays.length;

    // Sort eligible days by RFEM descending (highest RFEM gets remainder sets)
    const sortedDays = [...eligibleDays].sort((a, b) => b.rfem - a.rfem);

    // Assign sets
    for (const day of sortedDays) {
      day.setsByType[type] = baseSets;
      if (remainder > 0) {
        day.setsByType[type]++;
        remainder--;
      }
    }
  }
}

/**
 * Creates a scheduled workout from a day allocation
 */
function createScheduledWorkout(
  day: DayAllocation,
  cycle: Cycle,
  exercises: Map<string, Exercise>
): Omit<ScheduledWorkout, 'id'> {
  const scheduledSets: ScheduledSet[] = [];
  const cycleMode = getProgressionMode(cycle);
  const isMixedMode = cycleMode === 'mixed';
  
  // Group exercises by type for this day's group
  const exercisesByType = new Map<ExerciseType, { 
    exerciseId: string; 
    assignment: ExerciseAssignment;
  }[]>();
  
  for (const assignment of day.group.exerciseAssignments) {
    const exercise = exercises.get(assignment.exerciseId);
    if (!exercise) continue;
    
    if (!exercisesByType.has(exercise.type)) {
      exercisesByType.set(exercise.type, []);
    }
    exercisesByType.get(exercise.type)!.push({
      exerciseId: assignment.exerciseId,
      assignment
    });
  }

  // Track which exercises will appear in this workout and need warmups
  // We need to know how many working sets each exercise will have to determine targets
  const exerciseWorkingSets = new Map<string, { 
    count: number;
    assignment: ExerciseAssignment;
    exercise: Exercise;
    hasWarmups: boolean;
  }>();
  
  // First pass: count working sets per exercise and determine warmup eligibility
  for (const [type, setsNeeded] of Object.entries(day.setsByType)) {
    const exerciseType = type as ExerciseType;
    const availableExercises = exercisesByType.get(exerciseType) || [];
    
    if (availableExercises.length === 0 || setsNeeded === 0) continue;
    
    for (let setNum = 0; setNum < setsNeeded; setNum++) {
      const exIndex = setNum % availableExercises.length;
      const { exerciseId, assignment } = availableExercises[exIndex];
      const exercise = exercises.get(exerciseId)!;
      
      if (!exerciseWorkingSets.has(exerciseId)) {
        const hasWarmups = shouldGenerateWarmups(exercise, assignment, cycle, cycleMode);
        exerciseWorkingSets.set(exerciseId, { 
          count: 0, 
          assignment, 
          exercise,
          hasWarmups
        });
      }
      exerciseWorkingSets.get(exerciseId)!.count++;
    }
  }
  
  // Second pass: generate warmup sets for exercises that need them
  for (const [exerciseId, info] of exerciseWorkingSets) {
    if (!info.hasWarmups) continue;
    
    const { exercise, assignment } = info;
    const exerciseMode = getExerciseProgressionMode(cycleMode, assignment);
    const isTimeBased = exercise.measurementType === 'time';
    const isWeighted = exercise.weightEnabled === true;
    
    // Calculate the target value for working sets (needed for warmup calculation)
    let workoutTargetValue: number;
    let workoutTargetWeight: number | undefined;
    let progressionType: 'reps' | 'time' | 'weight' | undefined;
    
    if (exerciseMode === 'simple') {
      // For simple mode, use base values
      if (isTimeBased) {
        workoutTargetValue = assignment.simpleBaseTime ?? 30;
        progressionType = (assignment.simpleTimeProgressionType !== 'constant' && assignment.simpleTimeIncrement) 
          ? 'time' : undefined;
      } else {
        workoutTargetValue = assignment.simpleBaseReps ?? 10;
        progressionType = (assignment.simpleRepProgressionType !== 'constant' && assignment.simpleRepIncrement)
          ? 'reps' : undefined;
      }
      
      if (isWeighted) {
        workoutTargetWeight = assignment.simpleBaseWeight;
        // Check if weight is the primary progression
        if (assignment.simpleWeightProgressionType !== 'constant' && assignment.simpleWeightIncrement) {
          progressionType = 'weight';
        }
      }
    } else {
      // For RFEM mode, use RFEM percentage (we don't have max here, so use a placeholder)
      // The actual target will be calculated at workout time based on current max
      // For warmup purposes, we'll use the RFEM value as a percentage indicator
      workoutTargetValue = day.rfem * RFEM.ESTIMATION_MULTIPLIER;
      workoutTargetWeight = isWeighted ? (exercise.defaultWeight ?? 0) : undefined;
    }
    
    const warmups = generateWarmupSets({
      exerciseId,
      exerciseType: exercise.type,
      measurementType: exercise.measurementType || 'reps',
      isWeighted,
      workoutTargetValue,
      workoutTargetWeight,
      effectiveMode: exerciseMode,
      progressionType,
      weightIncrement: assignment.simpleWeightIncrement
    });
    
    // Copy mode-specific fields to warmup sets for display/calculation
    if (isMixedMode) {
      warmups.forEach(w => {
        w.progressionMode = exerciseMode;
      });
    }
    
    // For RFEM mode warmups, we need to store info to calculate at workout time
    if (exerciseMode === 'rfem') {
      warmups.forEach(w => {
        // Clear any simple mode values - warmups will calculate from RFEM
        w.simpleBaseReps = undefined;
        w.simpleBaseTime = undefined;
        w.simpleBaseWeight = undefined;
      });
    }
    
    scheduledSets.push(...warmups);
  }

  // Third pass: generate working sets with adjusted set numbers
  for (const [type, setsNeeded] of Object.entries(day.setsByType)) {
    const exerciseType = type as ExerciseType;
    const availableExercises = exercisesByType.get(exerciseType) || [];
    
    if (availableExercises.length === 0 || setsNeeded === 0) continue;

    // Round-robin through available exercises
    for (let setNum = 0; setNum < setsNeeded; setNum++) {
      const exIndex = setNum % availableExercises.length;
      const { exerciseId, assignment } = availableExercises[exIndex];
      const exercise = exercises.get(exerciseId)!;
      const isConditioning = exercise.mode === 'conditioning';
      const isTimeBased = exercise.measurementType === 'time';
      
      // Determine the effective mode for this specific exercise
      const exerciseMode = getExerciseProgressionMode(cycleMode, assignment);
      const usesSimple = exerciseMode === 'simple';
      
      // Calculate set number, accounting for warmups
      const info = exerciseWorkingSets.get(exerciseId)!;
      const warmupOffset = info.hasWarmups ? WARMUP.SET_COUNT : 0;
      const baseSetNumber = Math.floor(setNum / availableExercises.length) + 1;

      const scheduledSet: ScheduledSet = {
        id: generateId(),
        exerciseId,
        exerciseType,
        isConditioning,
        measurementType: exercise.measurementType || 'reps',
        setNumber: baseSetNumber + warmupOffset,
        isWarmup: false
      };

      // For mixed mode, denormalize the per-exercise progression mode
      if (isMixedMode) {
        scheduledSet.progressionMode = exerciseMode;
        
        // Denormalize per-exercise conditioning increments
        if (isConditioning) {
          scheduledSet.conditioningRepIncrement = assignment.conditioningRepIncrement;
          scheduledSet.conditioningTimeIncrement = assignment.conditioningTimeIncrement;
        }
      }

      // Add mode-specific fields
      if (usesSimple && !isConditioning) {
        // Simple mode (non-conditioning): copy progression settings from assignment
        if (isTimeBased) {
          scheduledSet.simpleBaseTime = assignment.simpleBaseTime;
          scheduledSet.simpleTimeProgressionType = assignment.simpleTimeProgressionType;
          scheduledSet.simpleTimeIncrement = assignment.simpleTimeIncrement;
        } else {
          scheduledSet.simpleBaseReps = assignment.simpleBaseReps;
          scheduledSet.simpleRepProgressionType = assignment.simpleRepProgressionType;
          scheduledSet.simpleRepIncrement = assignment.simpleRepIncrement;
        }
        // Weight progression
        scheduledSet.simpleBaseWeight = assignment.simpleBaseWeight;
        scheduledSet.simpleWeightProgressionType = assignment.simpleWeightProgressionType;
        scheduledSet.simpleWeightIncrement = assignment.simpleWeightIncrement;
      }
      
      // Conditioning base values (used in all modes)
      if (isConditioning) {
        if (isTimeBased) {
          scheduledSet.conditioningBaseTime = assignment.conditioningBaseTime || CONDITIONING.DEFAULT_BASE_TIME;
        } else {
          scheduledSet.conditioningBaseReps = assignment.conditioningBaseReps || CONDITIONING.DEFAULT_BASE_REPS;
        }
      }

      scheduledSets.push(scheduledSet);
    }
  }

  return {
    cycleId: cycle.id,
    sequenceNumber: day.sequenceNumber,
    weekNumber: day.weekNumber,
    dayInWeek: day.dayInWeek,
    groupId: day.group.id,
    rfem: day.rfem,
    scheduledSets,
    status: 'pending'
  };
}

/**
 * Calculate target reps/time for a scheduled set in Simple Progression mode.
 * Returns reps for rep-based exercises, seconds for time-based exercises.
 */
export function calculateSimpleTargetReps(
  set: ScheduledSet,
  workout: ScheduledWorkout,
  _cycle: Cycle  // Kept for API consistency, may be needed for future enhancements
): number {
  const isTimeBased = set.measurementType === 'time';

  if (isTimeBased) {
    const baseTime = set.simpleBaseTime ?? RFEM.DEFAULT_TIME_MAX;
    const progressionType = set.simpleTimeProgressionType ?? 'constant';
    const increment = set.simpleTimeIncrement ?? 0;

    return calculateProgressedValue(baseTime, progressionType, increment, workout);
  } else {
    const baseReps = set.simpleBaseReps ?? RFEM.DEFAULT_MAX;
    const progressionType = set.simpleRepProgressionType ?? 'constant';
    const increment = set.simpleRepIncrement ?? 0;

    return calculateProgressedValue(baseReps, progressionType, increment, workout);
  }
}

/**
 * Calculate target weight for a scheduled set in Simple Progression mode.
 * Returns weight in lbs, or undefined if no weight is set.
 * (Future-proofing for weighted exercises)
 */
export function calculateSimpleTargetWeight(
  set: ScheduledSet,
  workout: ScheduledWorkout,
  _cycle: Cycle  // Kept for API consistency
): number | undefined {
  const baseWeight = set.simpleBaseWeight;
  if (baseWeight === undefined) return undefined;

  const progressionType = set.simpleWeightProgressionType ?? 'constant';
  const increment = set.simpleWeightIncrement ?? 0;

  return calculateProgressedValue(baseWeight, progressionType, increment, workout);
}

/**
 * Helper to calculate a value with progression applied.
 */
function calculateProgressedValue(
  baseValue: number,
  progressionType: ProgressionInterval,
  increment: number,
  workout: ScheduledWorkout
): number {
  if (progressionType === 'constant' || increment === 0) {
    return baseValue;
  }

  if (progressionType === 'per_workout') {
    // Add increment for each workout completed (0-indexed from first workout)
    return baseValue + increment * (workout.sequenceNumber - 1);
  }

  if (progressionType === 'per_week') {
    // Add increment for each week (0-indexed from first week)
    return baseValue + increment * (workout.weekNumber - 1);
  }

  return baseValue;
}

/**
 * Calculate target reps/time for a scheduled set dynamically.
 * Returns reps for rep-based exercises, seconds for time-based exercises.
 * 
 * For RFEM mode: Uses max records and RFEM percentage
 * For Simple mode: Uses base value + progression increments
 * For Mixed mode: Uses the per-exercise mode (RFEM or Simple) stored on the set
 */
export function calculateTargetReps(
  set: ScheduledSet,
  workout: ScheduledWorkout,
  maxRecord: MaxRecord | undefined,
  conditioningWeeklyIncrement: number,
  conditioningWeeklyTimeIncrement: number = CONDITIONING.DEFAULT_TIME_INCREMENT,
  defaultMax: number = RFEM.DEFAULT_MAX,
  cycle?: Cycle
): number {
  const cycleMode = cycle ? getProgressionMode(cycle) : 'rfem';
  
  // Determine the effective mode for this set
  const effectiveMode = getSetProgressionMode(cycleMode, set);
  
  // For non-conditioning exercises, check if this set uses simple progression
  if (!set.isConditioning && effectiveMode === 'simple') {
    return calculateSimpleTargetReps(set, workout, cycle!);
  }

  // RFEM mode calculation (or conditioning exercises in any mode)
  const isTimeBased = set.measurementType === 'time';
  
  // Max testing warmup: percentage of previous max (or default)
  if (set.isWarmup) {
    if (isTimeBased) {
      const prevMax = set.previousMaxTime || maxRecord?.maxTime || RFEM.DEFAULT_TIME_MAX;
      return Math.max(WARMUP.MIN_TIME_SECONDS, Math.round(prevMax * WARMUP.MAX_TEST_INTENSITY));
    } else {
      const prevMax = set.previousMaxReps || maxRecord?.maxReps || defaultMax;
      return Math.max(WARMUP.MIN_REPS, Math.round(prevMax * WARMUP.MAX_TEST_INTENSITY));
    }
  }
  
  // Max testing: no target, user goes to max
  if (set.isMaxTest) {
    // Return 0 to indicate "go to max" - UI will handle this specially
    return 0;
  }
  
  if (set.isConditioning) {
    // Conditioning: base + weekly increment
    // For mixed mode, use per-exercise increment if available, otherwise use cycle defaults
    if (isTimeBased) {
      const baseTime = set.conditioningBaseTime || RFEM.DEFAULT_TIME_MAX;
      const increment = set.conditioningTimeIncrement ?? conditioningWeeklyTimeIncrement;
      return baseTime + (workout.weekNumber - 1) * increment;
    } else {
      const baseReps = set.conditioningBaseReps || defaultMax;
      const increment = set.conditioningRepIncrement ?? conditioningWeeklyIncrement;
      return baseReps + (workout.weekNumber - 1) * increment;
    }
  } else {
    // Standard/Progressive RFEM: max - RFEM (scaled by TIME_SCALE_FACTOR for time-based)
    if (isTimeBased) {
      const max = maxRecord?.maxTime || RFEM.DEFAULT_TIME_MAX;
      return Math.max(RFEM.MIN_TARGET_TIME_SECONDS, max - workout.rfem * RFEM.TIME_SCALE_FACTOR);
    } else {
      const max = maxRecord?.maxReps || defaultMax;
      return Math.max(RFEM.MIN_TARGET_REPS, max - workout.rfem);
    }
  }
}

/**
 * Validates a cycle configuration before generating schedule
 */
export function validateCycle(
  cycle: Omit<Cycle, 'id' | 'createdAt' | 'updatedAt'>,
  exercises: Map<string, Exercise>
): { valid: boolean; errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];
  const cycleMode = getProgressionMode(cycle as Cycle);
  const isSimpleMode = cycleMode === 'simple';
  const isMixedMode = cycleMode === 'mixed';

  // Check basics
  if (!cycle.name.trim()) {
    errors.push('Cycle name is required');
  }
  if (cycle.numberOfWeeks < 1) {
    errors.push('Cycle must be at least 1 week');
  }
  if (cycle.workoutDaysPerWeek < 1 || cycle.workoutDaysPerWeek > 7) {
    errors.push('Workout days per week must be between 1 and 7');
  }
  if (cycle.groups.length === 0) {
    errors.push('At least one group is required');
  }
  if (cycle.groupRotation.length === 0) {
    errors.push('Group rotation is required');
  }
  
  // RFEM rotation is required for RFEM and mixed modes (used by RFEM exercises)
  if (!isSimpleMode && cycle.rfemRotation.length === 0) {
    errors.push('RFEM rotation is required');
  }

  // Check that all groups in rotation exist
  for (const groupId of cycle.groupRotation) {
    if (!cycle.groups.find(g => g.id === groupId)) {
      errors.push(`Group ${groupId} in rotation not found`);
    }
  }

  // Check that each group has exercises and validate per-exercise settings
  for (const group of cycle.groups) {
    if (group.exerciseAssignments.length === 0) {
      warnings.push(`Group "${group.name}" has no exercises`);
    }
    
    for (const assignment of group.exerciseAssignments) {
      const exercise = exercises.get(assignment.exerciseId);
      if (!exercise) continue;
      
      const isTimeBased = exercise.measurementType === 'time';
      const isConditioning = exercise.mode === 'conditioning';
      
      // Determine effective mode for this exercise
      const exerciseMode = getExerciseProgressionMode(cycleMode, assignment);
      
      // For simple mode exercises (in simple or mixed cycles), check base values
      if (exerciseMode === 'simple' && !isConditioning) {
        if (isTimeBased && assignment.simpleBaseTime === undefined) {
          warnings.push(`"${exercise.name}" in group "${group.name}" has no base time set`);
        } else if (!isTimeBased && assignment.simpleBaseReps === undefined) {
          warnings.push(`"${exercise.name}" in group "${group.name}" has no base reps set`);
        }
      }
      
      // For conditioning exercises in mixed mode, check increments are set
      // (This is just a warning since we fall back to defaults)
      if (isMixedMode && isConditioning) {
        if (isTimeBased && assignment.conditioningTimeIncrement === undefined) {
          // Not a warning - we fall back to cycle defaults gracefully
        } else if (!isTimeBased && assignment.conditioningRepIncrement === undefined) {
          // Not a warning - we fall back to cycle defaults gracefully
        }
      }
    }
  }

  // Check that weekly set goals can be met
  const exerciseTypes: ExerciseType[] = ['push', 'pull', 'legs', 'core', 'balance', 'mobility', 'other'];
  
  for (const type of exerciseTypes) {
    const goalSets = cycle.weeklySetGoals[type] || 0;
    if (goalSets === 0) continue;

    // Count exercises of this type across all groups
    let hasType = false;
    for (const group of cycle.groups) {
      for (const assignment of group.exerciseAssignments) {
        const exercise = exercises.get(assignment.exerciseId);
        if (exercise && exercise.type === type) {
          hasType = true;
          break;
        }
      }
      if (hasType) break;
    }

    if (!hasType) {
      warnings.push(`Weekly goal of ${goalSets} ${type} sets cannot be met: no ${type} exercises in any group`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Round a weight value to the nearest increment.
 * @param weight - The weight to round
 * @param increment - The increment to round to (default from WEIGHT.DEFAULT_INCREMENT)
 */
function roundToWeightIncrement(weight: number, increment: number = WEIGHT.DEFAULT_INCREMENT): number {
  if (increment <= 0) return Math.round(weight);
  return Math.round(weight / increment) * increment;
}

/**
 * Determine if an exercise should have warmup sets generated.
 */
function shouldGenerateWarmups(
  exercise: Exercise,
  assignment: ExerciseAssignment,
  cycle: Cycle,
  cycleMode: 'rfem' | 'simple' | 'mixed'
): boolean {
  // Conditioning exercises never get warmups
  if (exercise.mode === 'conditioning') return false;
  
  // Time-based exercises only get warmups if includeTimedWarmups is enabled
  const isTimeBased = exercise.measurementType === 'time';
  if (isTimeBased && !cycle.includeTimedWarmups) return false;
  
  // For mixed mode, check per-exercise setting
  if (cycleMode === 'mixed') {
    return assignment.includeWarmup === true;
  }
  
  // For RFEM/Simple modes, check global cycle setting
  return cycle.includeWarmupSets === true;
}

interface WarmupParams {
  exerciseId: string;
  exerciseType: ExerciseType;
  measurementType: 'reps' | 'time';
  isWeighted: boolean;
  workoutTargetValue: number;        // Target reps or time for working sets
  workoutTargetWeight?: number;      // Weight for working sets (if applicable)
  effectiveMode: 'rfem' | 'simple';  // The mode this exercise uses
  progressionType?: 'reps' | 'time' | 'weight';  // For simple mode: what is progressing
  weightIncrement?: number;          // For rounding weight
}

/**
 * Generate warmup sets for an exercise.
 * Returns warmup sets at the percentages defined in WARMUP.PERCENTAGES.
 */
function generateWarmupSets(params: WarmupParams): ScheduledSet[] {
  const {
    exerciseId,
    exerciseType,
    measurementType,
    isWeighted,
    workoutTargetValue,
    workoutTargetWeight,
    effectiveMode,
    progressionType,
    weightIncrement
  } = params;
  
  const isTimeBased = measurementType === 'time';
  const warmupSets: ScheduledSet[] = [];
  
  if (effectiveMode === 'rfem') {
    // RFEM mode: warmups are at WARMUP.PERCENTAGES of target reps/time
    // The actual warmup values are calculated at display time based on current max
    // We just store the warmupPercentage for calculation
    for (const percentage of WARMUP.PERCENTAGES) {
      warmupSets.push({
        id: generateId(),
        exerciseId,
        exerciseType,
        isConditioning: false,
        measurementType,
        setNumber: warmupSets.length + 1,
        isWarmup: true,
        warmupPercentage: percentage
      });
    }
  } else {
    // Simple mode: warmup calculation depends on what's progressing
    for (const percentage of WARMUP.PERCENTAGES) {
      let warmupReps: number;
      let warmupWeight: number | undefined;
      
      if (progressionType === 'weight' && workoutTargetWeight !== undefined) {
        // Weight progression: reduced reps, percentage-based weight
        warmupReps = isTimeBased
          ? Math.round(workoutTargetValue * WARMUP.REDUCED_INTENSITY_FACTOR)
          : Math.ceil(workoutTargetValue * WARMUP.REDUCED_INTENSITY_FACTOR);
        warmupWeight = roundToWeightIncrement(
          workoutTargetWeight * (percentage / 100),
          weightIncrement
        );
      } else if (progressionType === 'time' && isTimeBased) {
        // Time progression: percentage of target time
        warmupReps = Math.round(workoutTargetValue * (percentage / 100));
        warmupWeight = isWeighted && workoutTargetWeight
          ? roundToWeightIncrement(workoutTargetWeight * WARMUP.REDUCED_INTENSITY_FACTOR)
          : undefined;
      } else {
        // Rep progression (default): percentage of target reps, reduced weight
        warmupReps = isTimeBased
          ? Math.round(workoutTargetValue * (percentage / 100))
          : Math.ceil(workoutTargetValue * (percentage / 100));
        warmupWeight = isWeighted && workoutTargetWeight
          ? roundToWeightIncrement(workoutTargetWeight * WARMUP.REDUCED_INTENSITY_FACTOR)
          : undefined;
      }
      
      // Ensure minimum values
      warmupReps = Math.max(WARMUP.MIN_REPS, warmupReps);
      
      warmupSets.push({
        id: generateId(),
        exerciseId,
        exerciseType,
        isConditioning: false,
        measurementType,
        setNumber: warmupSets.length + 1,
        isWarmup: true,
        warmupPercentage: percentage,
        // Store computed warmup values for simple mode
        simpleBaseReps: isTimeBased ? undefined : warmupReps,
        simpleBaseTime: isTimeBased ? warmupReps : undefined,
        simpleBaseWeight: warmupWeight
      });
    }
  }
  
  return warmupSets;
}

