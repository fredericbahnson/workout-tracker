import { generateId } from '../data/db';
import type { 
  Cycle, 
  ScheduledWorkout, 
  ScheduledSet, 
  Exercise, 
  ExerciseType, 
  MaxRecord,
  Group 
} from '../types';

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
  
  // Group exercises by type for this day's group
  const exercisesByType = new Map<ExerciseType, { 
    exerciseId: string; 
    conditioningBaseReps?: number;
    conditioningBaseTime?: number;
  }[]>();
  
  for (const assignment of day.group.exerciseAssignments) {
    const exercise = exercises.get(assignment.exerciseId);
    if (!exercise) continue;
    
    if (!exercisesByType.has(exercise.type)) {
      exercisesByType.set(exercise.type, []);
    }
    exercisesByType.get(exercise.type)!.push({
      exerciseId: assignment.exerciseId,
      conditioningBaseReps: assignment.conditioningBaseReps,
      conditioningBaseTime: assignment.conditioningBaseTime
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
      const { exerciseId, conditioningBaseReps, conditioningBaseTime } = availableExercises[exIndex];
      const exercise = exercises.get(exerciseId)!;
      const isConditioning = exercise.mode === 'conditioning';
      const isTimeBased = exercise.measurementType === 'time';

      scheduledSets.push({
        id: generateId(),
        exerciseId,
        exerciseType,
        isConditioning,
        measurementType: exercise.measurementType || 'reps',
        conditioningBaseReps: isConditioning && !isTimeBased ? (conditioningBaseReps || 10) : undefined,
        conditioningBaseTime: isConditioning && isTimeBased ? (conditioningBaseTime || 30) : undefined,
        setNumber: Math.floor(setNum / availableExercises.length) + 1
      });
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
 * Calculate target reps/time for a scheduled set dynamically
 * Returns reps for rep-based exercises, seconds for time-based exercises
 */
export function calculateTargetReps(
  set: ScheduledSet,
  workout: ScheduledWorkout,
  maxRecord: MaxRecord | undefined,
  conditioningWeeklyIncrement: number,
  conditioningWeeklyTimeIncrement: number = 5,
  defaultMax: number = 10
): number {
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
  if (cycle.rfemRotation.length === 0) {
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
