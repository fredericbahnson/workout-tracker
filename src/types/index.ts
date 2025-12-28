// Core domain types

export type ExerciseType = 'push' | 'pull' | 'legs' | 'core' | 'balance' | 'mobility' | 'other';
export type ExerciseMode = 'standard' | 'conditioning';
export type MeasurementType = 'reps' | 'time';  // reps = count, time = seconds
export type CycleType = 'training' | 'max_testing';

export interface CustomParameter {
  name: string;
  type: 'text' | 'number' | 'select';
  options?: string[];
  defaultValue?: string | number;
}

export interface Exercise {
  id: string;
  name: string;
  type: ExerciseType;
  mode: ExerciseMode;
  measurementType: MeasurementType;           // 'reps' or 'time' (seconds)
  notes: string;
  customParameters: CustomParameter[];
  defaultConditioningReps?: number;           // Default starting reps for conditioning exercises
  defaultConditioningTime?: number;           // Default starting time in seconds for time-based conditioning
  weightEnabled?: boolean;                    // Whether this exercise tracks added weight
  defaultWeight?: number;                     // Default weight in lbs (optional convenience)
  createdAt: Date;
  updatedAt: Date;
}

export interface MaxRecord {
  id: string;
  exerciseId: string;
  maxReps?: number;           // Max reps (for rep-based exercises)
  maxTime?: number;           // Max time in seconds (for time-based exercises)
  weight?: number;            // Weight in lbs (undefined = bodyweight)
  recordedAt: Date;
  notes: string;
}

// Cycle-related types (Phase 2, but defined now for completeness)

export interface ExerciseAssignment {
  exerciseId: string;
  conditioningBaseReps?: number;     // For rep-based conditioning
  conditioningBaseTime?: number;     // For time-based conditioning (seconds)
}

export interface Group {
  id: string;
  name: string;
  exerciseAssignments: ExerciseAssignment[];
}

export interface Cycle {
  id: string;
  name: string;
  cycleType: CycleType;                // 'training' or 'max_testing'
  previousCycleId?: string;            // Reference to the cycle this max testing follows
  startDate: Date;
  numberOfWeeks: number;
  workoutDaysPerWeek: number;
  weeklySetGoals: Record<ExerciseType, number>;
  groups: Group[];
  groupRotation: string[];
  rfemRotation: number[];
  conditioningWeeklyRepIncrement: number;
  conditioningWeeklyTimeIncrement?: number;  // Weekly increment in seconds for time-based conditioning
  status: 'planning' | 'active' | 'completed';
  createdAt: Date;
  updatedAt: Date;
}

export interface ScheduledSet {
  id: string;
  exerciseId: string;
  exerciseType: ExerciseType;
  isConditioning: boolean;
  conditioningBaseReps?: number;     // Only for conditioning exercises (reps)
  conditioningBaseTime?: number;     // Only for conditioning exercises (time in seconds)
  setNumber: number;
  isWarmup?: boolean;                // For max testing: warmup set at 20% of previous max
  isMaxTest?: boolean;               // For max testing: the actual max attempt
  previousMaxReps?: number;          // For reference during max testing (reps)
  previousMaxTime?: number;          // For reference during max testing (time in seconds)
  measurementType?: MeasurementType; // Cached from exercise for display
  // Note: target is calculated dynamically based on current max and RFEM
}

export interface ScheduledWorkout {
  id: string;
  cycleId: string;
  sequenceNumber: number;           // 1, 2, 3... within the cycle
  weekNumber: number;               // 1-indexed week (for conditioning calculation)
  dayInWeek: number;                // 1-indexed day within week (for reference)
  groupId: string;
  rfem: number;
  scheduledSets: ScheduledSet[];
  status: 'pending' | 'completed' | 'partial' | 'skipped';
  completedAt?: Date;               // When the workout was completed
}

// Tracking types

export interface CompletedSet {
  id: string;
  scheduledSetId: string | null;
  scheduledWorkoutId: string | null;
  exerciseId: string;
  targetReps: number;              // Target reps OR target time in seconds
  actualReps: number;              // Actual reps OR actual time in seconds
  weight?: number;                 // Weight in lbs (undefined = bodyweight)
  completedAt: Date;
  notes: string;
  parameters: Record<string, string | number>;
}

// UI/Form types

export type ExerciseFormData = Omit<Exercise, 'id' | 'createdAt' | 'updatedAt'> & {
  initialMax?: number;       // Optional initial max reps to record at creation (standard exercises)
  initialMaxTime?: number;   // Optional initial max time in seconds (time-based standard exercises)
  startingReps?: number;     // Optional starting reps for conditioning exercises
  startingTime?: number;     // Optional starting time in seconds for time-based conditioning
};

export interface QuickLogData {
  exerciseId: string;
  reps: number;              // Reps OR time in seconds
  weight?: number;           // Weight in lbs (undefined = bodyweight)
  notes: string;
  parameters: Record<string, string | number>;
}

// Utility types

export const EXERCISE_TYPES: ExerciseType[] = ['push', 'pull', 'legs', 'core', 'balance', 'mobility', 'other'];

export const EXERCISE_TYPE_LABELS: Record<ExerciseType, string> = {
  push: 'Push',
  pull: 'Pull',
  legs: 'Legs',
  core: 'Core',
  balance: 'Balance',
  mobility: 'Mobility',
  other: 'Other'
};

export const EXERCISE_TYPE_COLORS: Record<ExerciseType, string> = {
  push: 'bg-red-500',
  pull: 'bg-blue-500',
  legs: 'bg-green-500',
  core: 'bg-yellow-500',
  balance: 'bg-purple-500',
  mobility: 'bg-pink-500',
  other: 'bg-gray-500'
};

// Helper function to format time in seconds to display string
export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Helper to parse time input (supports "30", "30s", "1m", "1m30s", "1:30")
export function parseTimeInput(input: string): number | null {
  const trimmed = input.trim().toLowerCase();
  
  // Try pure number (treat as seconds)
  const pureNum = parseInt(trimmed, 10);
  if (!isNaN(pureNum) && trimmed === String(pureNum)) {
    return pureNum;
  }
  
  // Try "Xs" format
  const secMatch = trimmed.match(/^(\d+)s$/);
  if (secMatch) {
    return parseInt(secMatch[1], 10);
  }
  
  // Try "Xm" format
  const minMatch = trimmed.match(/^(\d+)m$/);
  if (minMatch) {
    return parseInt(minMatch[1], 10) * 60;
  }
  
  // Try "XmYs" format
  const minSecMatch = trimmed.match(/^(\d+)m\s*(\d+)s?$/);
  if (minSecMatch) {
    return parseInt(minSecMatch[1], 10) * 60 + parseInt(minSecMatch[2], 10);
  }
  
  // Try "X:YY" format
  const colonMatch = trimmed.match(/^(\d+):(\d{1,2})$/);
  if (colonMatch) {
    return parseInt(colonMatch[1], 10) * 60 + parseInt(colonMatch[2], 10);
  }
  
  return null;
}
