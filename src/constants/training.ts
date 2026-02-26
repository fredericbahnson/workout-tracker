/**
 * Training Constants
 *
 * Centralized configuration values for workout calculations.
 * These values are used throughout the scheduler and workout components.
 */

/**
 * Warmup set configuration.
 * Warmup sets use reduced intensity to prepare for working sets.
 */
export const WARMUP = {
  /**
   * Number of warmup sets generated per exercise.
   */
  SET_COUNT: 2,

  /**
   * Percentages of working set intensity for warmup sets.
   * Two warmup sets are generated: one at 20% and one at 40%.
   */
  PERCENTAGES: [20, 40] as const,

  /**
   * Intensity factor for warmup sets when the opposite dimension is reduced.
   * For rep progression: warmup uses 60% of working weight
   * For weight progression: warmup uses 60% of working reps
   */
  REDUCED_INTENSITY_FACTOR: 0.6,

  /**
   * Rest timer multiplier for warmup sets.
   * Warmup sets use 50% of the configured rest time.
   */
  REST_TIMER_FACTOR: 0.5,

  /**
   * Minimum warmup reps (prevents 0-rep warmups).
   */
  MIN_REPS: 1,

  /**
   * Minimum warmup time in seconds (for time-based exercises).
   */
  MIN_TIME_SECONDS: 5,

  /**
   * Intensity factor for max testing warmups (20% of previous max).
   */
  MAX_TEST_INTENSITY: 0.2,

  /**
   * Percentages of previous max for max testing warmup sets.
   * Three warmup sets at 20%, 30%, and 40% of previous max.
   */
  MAX_TEST_PERCENTAGES: [20, 30, 40] as const,
} as const;

/**
 * RFEM (Reps From Established Max) configuration.
 * RFEM is the core progression system for standard exercises.
 */
export const RFEM = {
  /**
   * Percentage of max time removed per RFEM point for time-based exercises.
   * Each RFEM point removes 10% of the recorded max time.
   * e.g., RFEM-3 = maxTime × (1 - 0.3) = 70% of max
   */
  TIME_RFEM_PERCENTAGE: 0.1,

  /**
   * Minimum target reps for standard exercises.
   */
  MIN_TARGET_REPS: 1,

  /**
   * Minimum target time in seconds for time-based exercises.
   */
  MIN_TARGET_TIME_SECONDS: 5,

  /**
   * Default max value when no max record exists (rep-based).
   * Used as fallback for target calculations.
   */
  DEFAULT_MAX: 10,

  /**
   * Default max time in seconds when no max record exists (time-based).
   */
  DEFAULT_TIME_MAX: 30,

  /**
   * Multiplier used for rough RFEM-to-reps estimation.
   * Used when actual max is unknown during warmup planning.
   */
  ESTIMATION_MULTIPLIER: 10,
} as const;

/**
 * Weight rounding configuration.
 */
export const WEIGHT = {
  /**
   * Default weight increment for rounding (in pounds).
   * Weights are rounded to the nearest multiple of this value.
   */
  DEFAULT_INCREMENT: 5,
} as const;

/**
 * Conditioning exercise configuration.
 */
export const CONDITIONING = {
  /**
   * Default weekly rep increment for conditioning exercises.
   */
  DEFAULT_REP_INCREMENT: 2,

  /**
   * Default weekly time increment in seconds for time-based conditioning.
   */
  DEFAULT_TIME_INCREMENT: 5,

  /**
   * Default base reps for conditioning exercises when not specified.
   */
  DEFAULT_BASE_REPS: 10,

  /**
   * Default base time in seconds for time-based conditioning exercises.
   */
  DEFAULT_BASE_TIME: 30,
} as const;

/**
 * Type for warmup percentage values.
 */
export type WarmupPercentage = (typeof WARMUP.PERCENTAGES)[number];

/**
 * Rest timer configuration.
 * Default durations for rest timers between sets.
 */
export const TIMER = {
  /**
   * Default rest duration in seconds for standard workout sets.
   * 180 seconds = 3 minutes.
   */
  DEFAULT_REST_SECONDS: 180,

  /**
   * Default rest duration in seconds for max testing sets.
   * 300 seconds = 5 minutes (longer rest for max effort).
   */
  DEFAULT_MAX_TEST_REST_SECONDS: 300,
} as const;
