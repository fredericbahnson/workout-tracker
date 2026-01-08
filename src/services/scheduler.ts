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
import { getProgressionMode } from '@/types';

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
      console.warn(`Group ${groupId} not found in cycle`);
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
      console.warn(`No days have exercises of type ${type}, but goal is ${totalSets} sets`);
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
  const isSimpleMode = getProgressionMode(cycle) === 'simple';
  
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

  // For each type, create the scheduled sets
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

      const scheduledSet: ScheduledSet = {
        id: generateId(),
        exerciseId,
        exerciseType,
        isConditioning,
        measurementType: exercise.measurementType || 'reps',
        setNumber: Math.floor(setNum / availableExercises.length) + 1
      };

      // Add mode-specific fields
      if (isSimpleMode) {
        // Simple mode: copy progression settings from assignment
        if (isTimeBased) {
          scheduledSet.simpleBaseTime = assignment.simpleBaseTime;
          scheduledSet.simpleTimeProgressionType = assignment.simpleTimeProgressionType;
          scheduledSet.simpleTimeIncrement = assignment.simpleTimeIncrement;
        } else {
          scheduledSet.simpleBaseReps = assignment.simpleBaseReps;
          scheduledSet.simpleRepProgressionType = assignment.simpleRepProgressionType;
          scheduledSet.simpleRepIncrement = assignment.simpleRepIncrement;
        }
        // Weight progression (future-proofing)
        scheduledSet.simpleBaseWeight = assignment.simpleBaseWeight;
        scheduledSet.simpleWeightProgressionType = assignment.simpleWeightProgressionType;
        scheduledSet.simpleWeightIncrement = assignment.simpleWeightIncrement;
      } else {
        // RFEM mode: conditioning fields
        if (isConditioning) {
          if (isTimeBased) {
            scheduledSet.conditioningBaseTime = assignment.conditioningBaseTime || 30;
          } else {
            scheduledSet.conditioningBaseReps = assignment.conditioningBaseReps || 10;
          }
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
  const defaultReps = 10;
  const defaultTime = 30;

  if (isTimeBased) {
    const baseTime = set.simpleBaseTime ?? defaultTime;
    const progressionType = set.simpleTimeProgressionType ?? 'constant';
    const increment = set.simpleTimeIncrement ?? 0;

    return calculateProgressedValue(baseTime, progressionType, increment, workout);
  } else {
    const baseReps = set.simpleBaseReps ?? defaultReps;
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
 */
export function calculateTargetReps(
  set: ScheduledSet,
  workout: ScheduledWorkout,
  maxRecord: MaxRecord | undefined,
  conditioningWeeklyIncrement: number,
  conditioningWeeklyTimeIncrement: number = 5,
  defaultMax: number = 10,
  cycle?: Cycle
): number {
  // If cycle is provided and it's simple mode, use simple calculation
  if (cycle && getProgressionMode(cycle) === 'simple') {
    return calculateSimpleTargetReps(set, workout, cycle);
  }

  // RFEM mode calculation (original logic)
  const isTimeBased = set.measurementType === 'time';
  const defaultTimeMax = 30; // 30 seconds default for time-based
  
  // Max testing warmup: 20% of previous max (or default)
  if (set.isWarmup) {
    if (isTimeBased) {
      const prevMax = set.previousMaxTime || maxRecord?.maxTime || defaultTimeMax;
      return Math.max(5, Math.round(prevMax * 0.2)); // Minimum 5 seconds warmup
    } else {
      const prevMax = set.previousMaxReps || maxRecord?.maxReps || defaultMax;
      return Math.max(1, Math.round(prevMax * 0.2));
    }
  }
  
  // Max testing: no target, user goes to max
  if (set.isMaxTest) {
    // Return 0 to indicate "go to max" - UI will handle this specially
    return 0;
  }
  
  if (set.isConditioning) {
    // Conditioning: base + weekly increment
    if (isTimeBased) {
      const baseTime = set.conditioningBaseTime || defaultTimeMax;
      return baseTime + (workout.weekNumber - 1) * conditioningWeeklyTimeIncrement;
    } else {
      const baseReps = set.conditioningBaseReps || defaultMax;
      return baseReps + (workout.weekNumber - 1) * conditioningWeeklyIncrement;
    }
  } else {
    // Standard/Progressive: max - RFEM (same percentage logic applies to time)
    if (isTimeBased) {
      const max = maxRecord?.maxTime || defaultTimeMax;
      return Math.max(5, max - workout.rfem * 3); // Scale RFEM for time (each RFEM = ~3 seconds)
    } else {
      const max = maxRecord?.maxReps || defaultMax;
      return Math.max(1, max - workout.rfem);
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
  const isSimpleMode = getProgressionMode(cycle as Cycle) === 'simple';

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
  
  // RFEM rotation is only required for RFEM mode
  if (!isSimpleMode && cycle.rfemRotation.length === 0) {
    errors.push('RFEM rotation is required');
  }

  // Check that all groups in rotation exist
  for (const groupId of cycle.groupRotation) {
    if (!cycle.groups.find(g => g.id === groupId)) {
      errors.push(`Group ${groupId} in rotation not found`);
    }
  }

  // Check that each group has exercises
  for (const group of cycle.groups) {
    if (group.exerciseAssignments.length === 0) {
      warnings.push(`Group "${group.name}" has no exercises`);
    }
    
    // For simple mode, check that exercises have base values set
    if (isSimpleMode) {
      for (const assignment of group.exerciseAssignments) {
        const exercise = exercises.get(assignment.exerciseId);
        if (!exercise) continue;
        
        const isTimeBased = exercise.measurementType === 'time';
        if (isTimeBased && assignment.simpleBaseTime === undefined) {
          warnings.push(`"${exercise.name}" in group "${group.name}" has no base time set`);
        } else if (!isTimeBased && assignment.simpleBaseReps === undefined) {
          warnings.push(`"${exercise.name}" in group "${group.name}" has no base reps set`);
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
