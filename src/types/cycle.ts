/**
 * Cycle Types
 * 
 * Types related to training cycles, groups, and exercise assignments.
 */

import type { 
  ExerciseType, 
  ExerciseProgressionMode, 
  ProgressionInterval 
} from './exercise';

/**
 * Type of training cycle.
 * - training: Regular training with progression
 * - max_testing: Cycle for establishing new max records
 */
export type CycleType = 'training' | 'max_testing';

/**
 * Progression mode for the entire cycle.
 * - rfem: Reps From Established Max (default)
 * - simple: Linear progression with increments
 * - mixed: Per-exercise mode selection
 */
export type ProgressionMode = 'rfem' | 'simple' | 'mixed';

/**
 * Configuration for a single exercise within a cycle group.
 */
export interface ExerciseAssignment {
  exerciseId: string;
  
  /**
   * Per-exercise progression mode (for mixed cycles only).
   * undefined = defaults to 'rfem' in mixed mode, or follows cycle mode otherwise.
   */
  progressionMode?: ExerciseProgressionMode;
  
  /**
   * Per-exercise warmup toggle (for mixed cycles only).
   * In pure RFEM/simple modes, global cycle value is used.
   */
  includeWarmup?: boolean;
  
  /** Conditioning settings (used in all modes) */
  conditioningBaseReps?: number;
  conditioningBaseTime?: number;
  
  /**
   * Per-exercise conditioning increments (for mixed mode).
   * In pure RFEM/simple modes, global cycle values are used.
   */
  conditioningRepIncrement?: number;
  conditioningTimeIncrement?: number;
  
  /** Simple mode - base values */
  simpleBaseReps?: number;
  simpleBaseTime?: number;
  simpleBaseWeight?: number;
  
  /** Simple mode - rep/time progression */
  simpleRepProgressionType?: ProgressionInterval;
  simpleRepIncrement?: number;
  simpleTimeProgressionType?: ProgressionInterval;
  simpleTimeIncrement?: number;
  
  /** Simple mode - weight progression */
  simpleWeightProgressionType?: ProgressionInterval;
  simpleWeightIncrement?: number;
}

/**
 * A group of exercises that rotate together in a cycle.
 */
export interface Group {
  id: string;
  name: string;
  exerciseAssignments: ExerciseAssignment[];
}

/**
 * A training cycle configuration.
 */
export interface Cycle {
  id: string;
  name: string;
  cycleType: CycleType;
  /** Progression mode - defaults to 'rfem' for backwards compatibility */
  progressionMode?: ProgressionMode;
  /** Reference to the cycle this max testing follows */
  previousCycleId?: string;
  startDate: Date;
  numberOfWeeks: number;
  workoutDaysPerWeek: number;
  weeklySetGoals: Record<ExerciseType, number>;
  groups: Group[];
  groupRotation: string[];
  /** RFEM rotation values (applies to all RFEM exercises) */
  rfemRotation: number[];
  /** Global fallback for conditioning rep increment */
  conditioningWeeklyRepIncrement: number;
  /** Global fallback for conditioning time increment */
  conditioningWeeklyTimeIncrement?: number;
  /** Whether to generate warmup sets for exercises */
  includeWarmupSets?: boolean;
  /** Include warmups for time-based exercises (when warmups enabled) */
  includeTimedWarmups?: boolean;
  status: 'planning' | 'active' | 'completed';
  createdAt: Date;
  updatedAt: Date;
}
