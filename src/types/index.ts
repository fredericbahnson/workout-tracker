// Core domain types

export type ExerciseType = 'push' | 'pull' | 'legs' | 'core' | 'balance' | 'mobility' | 'other';
export type ExerciseMode = 'standard' | 'conditioning';

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
  notes: string;
  customParameters: CustomParameter[];
  defaultConditioningReps?: number;  // Default starting reps for conditioning exercises
  weightEnabled?: boolean;           // Whether this exercise tracks added weight
  defaultWeight?: number;            // Default weight in lbs (optional convenience)
  createdAt: Date;
  updatedAt: Date;
}

export interface MaxRecord {
  id: string;
  exerciseId: string;
  maxReps: number;
  weight?: number;       // Weight in lbs (undefined = bodyweight)
  recordedAt: Date;
  notes: string;
}

// Cycle-related types (Phase 2, but defined now for completeness)

export interface ExerciseAssignment {
  exerciseId: string;
  conditioningBaseReps?: number;
}

export interface Group {
  id: string;
  name: string;
  exerciseAssignments: ExerciseAssignment[];
}

export interface Cycle {
  id: string;
  name: string;
  startDate: Date;
  numberOfWeeks: number;
  workoutDaysPerWeek: number;
  weeklySetGoals: Record<ExerciseType, number>;
  groups: Group[];
  groupRotation: string[];
  rfemRotation: number[];
  conditioningWeeklyRepIncrement: number;
  status: 'planning' | 'active' | 'completed';
  createdAt: Date;
  updatedAt: Date;
}

export interface ScheduledSet {
  id: string;
  exerciseId: string;
  exerciseType: ExerciseType;
  isConditioning: boolean;
  conditioningBaseReps?: number;  // Only for conditioning exercises
  setNumber: number;
  // Note: targetReps is calculated dynamically based on current max and RFEM
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
  targetReps: number;
  actualReps: number;
  weight?: number;       // Weight in lbs (undefined = bodyweight)
  completedAt: Date;
  notes: string;
  parameters: Record<string, string | number>;
}

// UI/Form types

export type ExerciseFormData = Omit<Exercise, 'id' | 'createdAt' | 'updatedAt'> & {
  initialMax?: number;  // Optional initial max reps to record at creation (standard exercises)
  startingReps?: number; // Optional starting reps for conditioning exercises
};

export interface QuickLogData {
  exerciseId: string;
  reps: number;
  weight?: number;       // Weight in lbs (undefined = bodyweight)
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
