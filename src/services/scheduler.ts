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
  ProgressionInterval,
  DayOfWeek,
} from '@/types';
import { getProgressionMode, getExerciseProgressionMode, getSetProgressionMode } from '@/types';
import { WARMUP, RFEM, WEIGHT, CONDITIONING } from '@/constants/training';
import { createScopedLogger } from '@/utils/logger';

const log = createScopedLogger('Scheduler');

/**
 * Calculates dates for all workouts in a date-based schedule.
 *
 * Generates an array of dates based on the selected days of the week and number of weeks.
 * Handles the first week partial case - only includes days at or after the start date.
 *
 * @param startDate - The date the cycle starts
 * @param numberOfWeeks - Total number of weeks in the cycle
 * @param selectedDays - Array of days of the week (0=Sunday, 6=Saturday) when workouts occur
 * @returns Array of Date objects for each workout in chronological order
 *
 * @example
 * ```ts
 * // Starting Thursday Jan 2nd, 4 weeks, Mon/Wed/Fri selected
 * const dates = calculateWorkoutDates(new Date('2025-01-02'), 4, [1, 3, 5]);
 * // Returns: Jan 3 (Fri), Jan 6 (Mon), Jan 8 (Wed), Jan 10 (Fri), ...
 * ```
 */
export function calculateWorkoutDates(
  startDate: Date,
  numberOfWeeks: number,
  selectedDays: DayOfWeek[]
): Date[] {
  if (selectedDays.length === 0) {
    return [];
  }

  // Sort selected days for consistent ordering within each week
  const sortedDays = [...selectedDays].sort((a, b) => a - b);
  const dates: Date[] = [];

  // Get the day of week for the start date (0-6)
  const startDayOfWeek = startDate.getDay() as DayOfWeek;

  // Create a normalized start date at midnight local time
  const normalizedStart = new Date(startDate);
  normalizedStart.setHours(0, 0, 0, 0);

  for (let week = 0; week < numberOfWeeks; week++) {
    for (const dayOfWeek of sortedDays) {
      let daysFromStart: number;

      if (week === 0) {
        // First week: only include days at or after the start day of week
        if (dayOfWeek < startDayOfWeek) {
          continue;
        }
        daysFromStart = dayOfWeek - startDayOfWeek;
      } else {
        // Subsequent weeks: calculate from the start of that calendar week
        // Days to reach end of first calendar week (Sunday)
        const daysToEndOfFirstWeek = 7 - startDayOfWeek;
        // Add complete weeks
        const fullWeeksDays = (week - 1) * 7;
        // Add the day within the target week
        daysFromStart = daysToEndOfFirstWeek + fullWeeksDays + dayOfWeek;
      }

      const workoutDate = new Date(normalizedStart);
      workoutDate.setDate(normalizedStart.getDate() + daysFromStart);
      dates.push(workoutDate);
    }
  }

  return dates;
}

/**
 * Input configuration for schedule generation.
 */
interface SchedulerInput {
  /** The cycle to generate a schedule for */
  cycle: Cycle;
  /** Map of exercise IDs to Exercise objects for all exercises in the cycle */
  exercises: Map<string, Exercise>;
  /** Optional max records for RFEM calculations */
  maxRecords?: Map<string, MaxRecord>;
  /** If provided, only generate workouts starting from this sequence number (1-indexed) */
  startFromWorkout?: number;
}

/**
 * Internal representation of a single training day.
 */
interface DayAllocation {
  sequenceNumber: number;
  weekNumber: number;
  dayInWeek: number;
  group: Group;
  rfem: number;
  setsByType: Record<ExerciseType, number>;
}

/**
 * Generates all scheduled workouts for a training cycle.
 *
 * This is the main entry point for the scheduling engine. It creates a complete
 * workout plan based on the cycle configuration, distributing sets across weeks
 * and days according to the defined goals and rotation patterns.
 *
 * @param input - The scheduler configuration
 * @param input.cycle - The cycle defining training parameters (weeks, days, goals)
 * @param input.exercises - Map of all exercises available for scheduling
 * @param input.maxRecords - Optional max records for RFEM-based progression
 * @param input.startFromWorkout - Optional starting point for partial regeneration
 * @returns Array of scheduled workouts (without IDs - caller should assign)
 *
 * @example
 * ```ts
 * const workouts = generateSchedule({
 *   cycle: myCycle,
 *   exercises: exerciseMap,
 *   maxRecords: maxRecordMap
 * });
 * ```
 */
export function generateSchedule(input: SchedulerInput): Omit<ScheduledWorkout, 'id'>[] {
  const { cycle, exercises, startFromWorkout = 1 } = input;
  const workouts: Omit<ScheduledWorkout, 'id'>[] = [];
  let sequenceNumber = 1;

  // Calculate workout dates if using date-based scheduling
  const isDateBased = cycle.schedulingMode === 'date' && cycle.selectedDays?.length;
  const workoutDates = isDateBased
    ? calculateWorkoutDates(cycle.startDate, cycle.numberOfWeeks, cycle.selectedDays!)
    : [];

  // Track which date index we're at (for date-based scheduling)
  let dateIndex = 0;

  // For each week in the cycle
  for (let week = 1; week <= cycle.numberOfWeeks; week++) {
    const weekWorkouts = generateWeekSchedule(cycle, week, exercises, sequenceNumber);

    // Only add workouts at or after startFromWorkout
    for (const workout of weekWorkouts) {
      if (sequenceNumber >= startFromWorkout) {
        // Assign scheduled date if using date-based scheduling
        if (isDateBased && dateIndex < workoutDates.length) {
          (workout as Omit<ScheduledWorkout, 'id'>).scheduledDate = workoutDates[dateIndex];
        }
        workouts.push(workout);
        dateIndex++;
      } else {
        // Still need to increment date index for skipped workouts
        if (isDateBased) {
          dateIndex++;
        }
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
      setsByType: {} as Record<ExerciseType, number>,
    });
  }

  // Distribute sets across days
  distributeSets(dayAllocations, weeklySetGoals, exercises);

  // Convert allocations to scheduled workouts
  // Track group occurrences to rotate round-robin offset for balanced exercise distribution
  const groupOccurrences = new Map<string, number>();
  return dayAllocations.map(day => {
    const occurrence = groupOccurrences.get(day.group.id) || 0;
    groupOccurrences.set(day.group.id, occurrence + 1);
    return createScheduledWorkout(day, cycle, exercises, occurrence);
  });
}

/**
 * Distributes weekly set goals across workout days
 */
function distributeSets(
  days: DayAllocation[],
  weeklySetGoals: Record<ExerciseType, number>,
  exercises: Map<string, Exercise>
): void {
  const exerciseTypes: ExerciseType[] = [
    'push',
    'pull',
    'legs',
    'core',
    'balance',
    'mobility',
    'other',
  ];

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
  exercises: Map<string, Exercise>,
  groupOccurrence: number = 0
): Omit<ScheduledWorkout, 'id'> {
  const scheduledSets: ScheduledSet[] = [];
  const cycleMode = getProgressionMode(cycle);
  const isMixedMode = cycleMode === 'mixed';

  // Group exercises by type for this day's group
  const exercisesByType = new Map<
    ExerciseType,
    {
      exerciseId: string;
      assignment: ExerciseAssignment;
    }[]
  >();

  for (const assignment of day.group.exerciseAssignments) {
    const exercise = exercises.get(assignment.exerciseId);
    if (!exercise) continue;

    if (!exercisesByType.has(exercise.type)) {
      exercisesByType.set(exercise.type, []);
    }
    exercisesByType.get(exercise.type)!.push({
      exerciseId: assignment.exerciseId,
      assignment,
    });
  }

  // Track which exercises will appear in this workout and need warmups
  // We need to know how many working sets each exercise will have to determine targets
  const exerciseWorkingSets = new Map<
    string,
    {
      count: number;
      assignment: ExerciseAssignment;
      exercise: Exercise;
      hasWarmups: boolean;
    }
  >();

  // First pass: count working sets per exercise and determine warmup eligibility
  for (const [type, setsNeeded] of Object.entries(day.setsByType)) {
    const exerciseType = type as ExerciseType;
    const availableExercises = exercisesByType.get(exerciseType) || [];

    if (availableExercises.length === 0 || setsNeeded === 0) continue;

    for (let setNum = 0; setNum < setsNeeded; setNum++) {
      const exIndex = (setNum + groupOccurrence) % availableExercises.length;
      const { exerciseId, assignment } = availableExercises[exIndex];
      const exercise = exercises.get(exerciseId)!;

      if (!exerciseWorkingSets.has(exerciseId)) {
        const hasWarmups = shouldGenerateWarmups(exercise, assignment, cycle, cycleMode);
        exerciseWorkingSets.set(exerciseId, {
          count: 0,
          assignment,
          exercise,
          hasWarmups,
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
        progressionType =
          assignment.simpleTimeProgressionType !== 'constant' && assignment.simpleTimeIncrement
            ? 'time'
            : undefined;
      } else {
        workoutTargetValue = assignment.simpleBaseReps ?? 10;
        progressionType =
          assignment.simpleRepProgressionType !== 'constant' && assignment.simpleRepIncrement
            ? 'reps'
            : undefined;
      }

      if (isWeighted) {
        workoutTargetWeight = assignment.simpleBaseWeight;
        // Check if weight is the primary progression
        if (
          assignment.simpleWeightProgressionType !== 'constant' &&
          assignment.simpleWeightIncrement
        ) {
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
      weightIncrement: assignment.simpleWeightIncrement,
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

    // Round-robin through available exercises (offset rotates per group occurrence for balance)
    for (let setNum = 0; setNum < setsNeeded; setNum++) {
      const exIndex = (setNum + groupOccurrence) % availableExercises.length;
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
        isWarmup: false,
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
          scheduledSet.conditioningBaseTime =
            assignment.conditioningBaseTime || CONDITIONING.DEFAULT_BASE_TIME;
        } else {
          scheduledSet.conditioningBaseReps =
            assignment.conditioningBaseReps || CONDITIONING.DEFAULT_BASE_REPS;
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
    status: 'pending',
  };
}

/**
 * Calculates target reps or time for a scheduled set using Simple Progression mode.
 *
 * Simple Progression uses a base value plus periodic increments, allowing for
 * predictable linear progression without the need for max testing.
 *
 * @param set - The scheduled set to calculate targets for
 * @param workout - The workout containing the set (provides week/day context)
 * @param _cycle - The cycle (reserved for future use, maintains API consistency)
 * @returns Target reps for rep-based exercises, or seconds for time-based exercises
 *
 * @example
 * ```ts
 * // For a set with simpleBaseReps: 10, simpleRepIncrement: 2, per_week progression
 * // Week 1: 10 reps, Week 2: 12 reps, Week 3: 14 reps
 * const target = calculateSimpleTargetReps(set, workout, cycle);
 * ```
 */
export function calculateSimpleTargetReps(
  set: ScheduledSet,
  workout: ScheduledWorkout,
  _cycle: Cycle // Kept for API consistency, may be needed for future enhancements
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
 * Calculates target weight for a scheduled set using Simple Progression mode.
 *
 * Used for weighted exercises where the user wants to progress by adding weight
 * rather than increasing reps.
 *
 * @param set - The scheduled set to calculate weight for
 * @param workout - The workout containing the set (provides week/day context)
 * @param _cycle - The cycle (reserved for future use, maintains API consistency)
 * @returns Target weight in the user's configured unit, or undefined if not weighted
 *
 * @example
 * ```ts
 * // For a set with simpleBaseWeight: 20, simpleWeightIncrement: 2.5, per_week progression
 * // Week 1: 20 lbs, Week 2: 22.5 lbs, Week 3: 25 lbs
 * const weight = calculateSimpleTargetWeight(set, workout, cycle);
 * ```
 */
export function calculateSimpleTargetWeight(
  set: ScheduledSet,
  workout: ScheduledWorkout,
  _cycle: Cycle // Kept for API consistency
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
 * Calculates target reps or time for a scheduled set dynamically at workout time.
 *
 * This is the primary function for determining what targets to show the user.
 * It handles all progression modes:
 * - **RFEM**: max - RFEM offset (scaled for time-based exercises)
 * - **Simple**: base + periodic increments
 * - **Mixed**: Uses per-exercise mode stored on the set
 * - **Conditioning**: base + weekly increment
 * - **Warmup**: Percentage of working intensity (20% or 40%)
 * - **Max Test**: Returns 0 (UI shows "Go to Max")
 *
 * @param set - The scheduled set to calculate targets for
 * @param workout - The workout containing the set
 * @param maxRecord - The user's max record for this exercise (for RFEM calculation)
 * @param conditioningWeeklyIncrement - Rep increment per week for conditioning exercises
 * @param conditioningWeeklyTimeIncrement - Time increment per week for time-based conditioning
 * @param defaultMax - Default max to use if no max record exists
 * @param cycle - Optional cycle for mixed mode calculations
 * @returns Target reps for rep-based, seconds for time-based, or 0 for max tests
 *
 * @example
 * ```ts
 * // RFEM mode with max of 30 reps, RFEM offset of 5
 * // Returns: 30 - 5 = 25 target reps
 * const target = calculateTargetReps(set, workout, maxRecord, 2, 5, 20);
 * ```
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

  // Handle warmup sets
  if (set.isWarmup) {
    // For simple mode warmups, the values are pre-calculated and stored on the set
    if (set.simpleBaseReps !== undefined) {
      return set.simpleBaseReps;
    }
    if (set.simpleBaseTime !== undefined) {
      return set.simpleBaseTime;
    }

    // Max testing warmups: use previousMaxReps/Time with stored warmupPercentage
    if (set.previousMaxReps !== undefined || set.previousMaxTime !== undefined) {
      // Use warmupPercentage if set, fall back to 20% for backward compatibility
      const intensity =
        set.warmupPercentage !== undefined ? set.warmupPercentage / 100 : WARMUP.MAX_TEST_INTENSITY;

      if (isTimeBased) {
        const prevMax = set.previousMaxTime || maxRecord?.maxTime || RFEM.DEFAULT_TIME_MAX;
        return Math.max(WARMUP.MIN_TIME_SECONDS, Math.ceil(prevMax * intensity));
      } else {
        const prevMax = set.previousMaxReps || maxRecord?.maxReps || defaultMax;
        return Math.max(WARMUP.MIN_REPS, Math.round(prevMax * intensity));
      }
    }

    // Normal warmups: use warmupPercentage of working set target
    if (set.warmupPercentage) {
      const percentage = set.warmupPercentage / 100;

      if (isTimeBased) {
        const max = maxRecord?.maxTime || RFEM.DEFAULT_TIME_MAX;
        const workingTarget = Math.max(
          RFEM.MIN_TARGET_TIME_SECONDS,
          max - workout.rfem * RFEM.TIME_SCALE_FACTOR
        );
        return Math.max(WARMUP.MIN_TIME_SECONDS, Math.round(workingTarget * percentage));
      } else {
        const max = maxRecord?.maxReps || defaultMax;
        const workingTarget = Math.max(RFEM.MIN_TARGET_REPS, max - workout.rfem);
        return Math.max(WARMUP.MIN_REPS, Math.ceil(workingTarget * percentage));
      }
    }

    // Fallback: if neither previousMax nor warmupPercentage is set, use 20% of max
    if (isTimeBased) {
      const max = maxRecord?.maxTime || RFEM.DEFAULT_TIME_MAX;
      return Math.max(WARMUP.MIN_TIME_SECONDS, Math.round(max * WARMUP.MAX_TEST_INTENSITY));
    } else {
      const max = maxRecord?.maxReps || defaultMax;
      return Math.max(WARMUP.MIN_REPS, Math.round(max * WARMUP.MAX_TEST_INTENSITY));
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
 * Validates a cycle configuration before generating a schedule.
 *
 * Checks for common configuration errors and potential issues that could
 * cause problems during schedule generation or workout execution.
 *
 * @param cycle - The cycle configuration to validate (without ID fields)
 * @param exercises - Map of all available exercises
 * @returns Validation result with arrays of errors (blocking) and warnings (informational)
 *
 * @example
 * ```ts
 * const { valid, errors, warnings } = validateCycle(cycleConfig, exerciseMap);
 * if (!valid) {
 *   console.error('Cannot create cycle:', errors);
 * }
 * if (warnings.length > 0) {
 *   console.warn('Potential issues:', warnings);
 * }
 * ```
 *
 * @remarks
 * Errors include:
 * - Missing required fields (name, groups, rotation)
 * - Invalid numeric ranges (weeks, days per week)
 * - Missing RFEM rotation in RFEM/mixed modes
 * - References to non-existent groups or exercises
 *
 * Warnings include:
 * - Empty groups
 * - Missing base values for Simple mode exercises
 * - Missing conditioning increments
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

  // Note: Weekly set goals for exercise types not included in the cycle
  // are silently ignored - no warning needed as the cycle proceeds with
  // the exercises the user selected.

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Round a weight value to the nearest increment.
 * @param weight - The weight to round
 * @param increment - The increment to round to (default from WEIGHT.DEFAULT_INCREMENT)
 */
function roundToWeightIncrement(
  weight: number,
  increment: number = WEIGHT.DEFAULT_INCREMENT
): number {
  if (increment <= 0) return Math.round(weight);
  return Math.round(weight / increment) * increment;
}

/**
 * Determine if an exercise should have warmup sets generated.
 */
function shouldGenerateWarmups(
  exercise: Exercise,
  _assignment: ExerciseAssignment,
  _cycle: Cycle,
  _cycleMode: 'rfem' | 'simple' | 'mixed'
): boolean {
  // Conditioning exercises never get warmups
  if (exercise.mode === 'conditioning') return false;

  // All non-conditioning exercises (including time-based) always get warmup sets generated.
  // Visibility is controlled at display time via appStore toggles.
  return true;
}

interface WarmupParams {
  exerciseId: string;
  exerciseType: ExerciseType;
  measurementType: 'reps' | 'time';
  isWeighted: boolean;
  workoutTargetValue: number; // Target reps or time for working sets
  workoutTargetWeight?: number; // Weight for working sets (if applicable)
  effectiveMode: 'rfem' | 'simple'; // The mode this exercise uses
  progressionType?: 'reps' | 'time' | 'weight'; // For simple mode: what is progressing
  weightIncrement?: number; // For rounding weight
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
    weightIncrement,
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
        warmupPercentage: percentage,
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
        warmupWeight =
          isWeighted && workoutTargetWeight
            ? roundToWeightIncrement(workoutTargetWeight * WARMUP.REDUCED_INTENSITY_FACTOR)
            : undefined;
      } else {
        // Rep progression (default): percentage of target reps, reduced weight
        warmupReps = isTimeBased
          ? Math.round(workoutTargetValue * (percentage / 100))
          : Math.ceil(workoutTargetValue * (percentage / 100));
        warmupWeight =
          isWeighted && workoutTargetWeight
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
        simpleBaseWeight: warmupWeight,
      });
    }
  }

  return warmupSets;
}
