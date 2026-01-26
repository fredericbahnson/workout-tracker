/**
 * Sync Transformers
 *
 * Functions for converting between local (Dexie) and remote (Supabase) data formats.
 *
 * Local format: camelCase, Date objects
 * Remote format: snake_case, ISO string dates
 */

import type {
  Exercise,
  MaxRecord,
  CompletedSet,
  Cycle,
  ScheduledWorkout,
  UserPreferences,
  WeeklySetGoals,
  AppMode,
  SchedulingMode,
  DayOfWeek,
} from '@/types';
import type {
  RemoteExercise,
  RemoteMaxRecord,
  RemoteCompletedSet,
  RemoteCycle,
  RemoteScheduledWorkout,
  RemoteUserPreferences,
} from './types';
import { toDate, toDateRequired, toISOString } from '@/utils/dateUtils';

// =============================================================================
// Remote → Local Transformers
// =============================================================================

/**
 * Convert a remote exercise to local format.
 */
export function remoteToLocalExercise(remote: RemoteExercise): Exercise {
  return {
    id: remote.id,
    name: remote.name,
    type: remote.type as Exercise['type'],
    mode: remote.mode as Exercise['mode'],
    measurementType: (remote.measurement_type as Exercise['measurementType']) || 'reps',
    notes: remote.notes || '',
    customParameters: (remote.custom_parameters as Exercise['customParameters']) || [],
    defaultConditioningReps: remote.default_conditioning_reps ?? undefined,
    defaultConditioningTime: remote.default_conditioning_time ?? undefined,
    weightEnabled: remote.weight_enabled ?? undefined,
    defaultWeight: remote.default_weight ?? undefined,
    lastCycleSettings: (remote.last_cycle_settings as Exercise['lastCycleSettings']) ?? undefined,
    createdAt: toDateRequired(remote.created_at),
    updatedAt: toDateRequired(remote.updated_at),
  };
}

/**
 * Convert a remote max record to local format.
 */
export function remoteToLocalMaxRecord(remote: RemoteMaxRecord): MaxRecord {
  return {
    id: remote.id,
    exerciseId: remote.exercise_id,
    maxReps: remote.max_reps ?? undefined,
    maxTime: remote.max_time ?? undefined,
    weight: remote.weight ?? undefined,
    notes: remote.notes || '',
    recordedAt: toDateRequired(remote.recorded_at),
  };
}

/**
 * Convert a remote completed set to local format.
 */
export function remoteToLocalCompletedSet(remote: RemoteCompletedSet): CompletedSet {
  return {
    id: remote.id,
    scheduledSetId: remote.scheduled_set_id,
    scheduledWorkoutId: remote.scheduled_workout_id,
    exerciseId: remote.exercise_id,
    targetReps: remote.target_reps,
    actualReps: remote.actual_reps,
    weight: remote.weight ?? undefined,
    completedAt: toDateRequired(remote.completed_at),
    notes: remote.notes || '',
    parameters: (remote.parameters as Record<string, string | number>) || {},
  };
}

/**
 * Convert a remote cycle to local format.
 */
export function remoteToLocalCycle(remote: RemoteCycle): Cycle {
  return {
    id: remote.id,
    name: remote.name,
    cycleType: (remote.cycle_type as Cycle['cycleType']) || 'training',
    progressionMode: (remote.progression_mode as Cycle['progressionMode']) || 'rfem',
    previousCycleId: remote.previous_cycle_id || undefined,
    startDate: toDateRequired(remote.start_date),
    numberOfWeeks: remote.number_of_weeks,
    workoutDaysPerWeek: remote.workout_days_per_week,
    weeklySetGoals: remote.weekly_set_goals as Cycle['weeklySetGoals'],
    groups: remote.groups as Cycle['groups'],
    groupRotation: remote.group_rotation as string[],
    rfemRotation: remote.rfem_rotation as number[],
    conditioningWeeklyRepIncrement: remote.conditioning_weekly_rep_increment,
    conditioningWeeklyTimeIncrement: remote.conditioning_weekly_time_increment ?? undefined,
    includeWarmupSets: remote.include_warmup_sets ?? undefined,
    includeTimedWarmups: remote.include_timed_warmups ?? undefined,
    schedulingMode: (remote.scheduling_mode as SchedulingMode) ?? undefined,
    selectedDays: (remote.selected_days as DayOfWeek[]) ?? undefined,
    status: remote.status as Cycle['status'],
    createdAt: toDateRequired(remote.created_at),
    updatedAt: toDateRequired(remote.updated_at),
  };
}

/**
 * Convert a remote scheduled workout to local format.
 */
export function remoteToLocalScheduledWorkout(remote: RemoteScheduledWorkout): ScheduledWorkout {
  return {
    id: remote.id,
    cycleId: remote.cycle_id,
    sequenceNumber: remote.sequence_number,
    weekNumber: remote.week_number,
    dayInWeek: remote.day_in_week,
    groupId: remote.group_id,
    rfem: remote.rfem,
    scheduledSets: remote.scheduled_sets as ScheduledWorkout['scheduledSets'],
    status: remote.status as ScheduledWorkout['status'],
    completedAt: toDate(remote.completed_at),
    scheduledDate: toDate(remote.scheduled_date),
    skipReason: remote.skip_reason ?? undefined,
    isAdHoc: remote.is_ad_hoc ?? undefined,
    customName: remote.custom_name ?? undefined,
  };
}

// =============================================================================
// Local → Remote Transformers
// =============================================================================

/**
 * Convert a local exercise to remote format.
 */
export function localToRemoteExercise(local: Exercise, userId: string) {
  return {
    id: local.id,
    user_id: userId,
    name: local.name,
    type: local.type,
    mode: local.mode,
    measurement_type: local.measurementType || 'reps',
    notes: local.notes,
    custom_parameters: local.customParameters,
    default_conditioning_reps: local.defaultConditioningReps || null,
    default_conditioning_time: local.defaultConditioningTime || null,
    weight_enabled: local.weightEnabled || false,
    default_weight: local.defaultWeight || null,
    last_cycle_settings: local.lastCycleSettings || null,
    created_at: toISOString(local.createdAt),
    updated_at: toISOString(local.updatedAt),
  };
}

/**
 * Convert a local max record to remote format.
 */
export function localToRemoteMaxRecord(local: MaxRecord, userId: string) {
  return {
    id: local.id,
    user_id: userId,
    exercise_id: local.exerciseId,
    max_reps: local.maxReps || null,
    max_time: local.maxTime || null,
    weight: local.weight || null,
    notes: local.notes,
    recorded_at: toISOString(local.recordedAt),
  };
}

/**
 * Convert a local completed set to remote format.
 */
export function localToRemoteCompletedSet(local: CompletedSet, userId: string) {
  return {
    id: local.id,
    user_id: userId,
    scheduled_set_id: local.scheduledSetId,
    scheduled_workout_id: local.scheduledWorkoutId,
    exercise_id: local.exerciseId,
    target_reps: local.targetReps,
    actual_reps: local.actualReps,
    weight: local.weight || null,
    completed_at: toISOString(local.completedAt),
    notes: local.notes,
    parameters: local.parameters,
  };
}

/**
 * Convert a local cycle to remote format.
 */
export function localToRemoteCycle(local: Cycle, userId: string) {
  return {
    id: local.id,
    user_id: userId,
    name: local.name,
    cycle_type: local.cycleType,
    progression_mode: local.progressionMode || 'rfem',
    previous_cycle_id: local.previousCycleId || null,
    start_date: toISOString(local.startDate),
    number_of_weeks: local.numberOfWeeks,
    workout_days_per_week: local.workoutDaysPerWeek,
    weekly_set_goals: local.weeklySetGoals,
    groups: local.groups,
    group_rotation: local.groupRotation,
    rfem_rotation: local.rfemRotation,
    conditioning_weekly_rep_increment: local.conditioningWeeklyRepIncrement,
    conditioning_weekly_time_increment: local.conditioningWeeklyTimeIncrement || null,
    include_warmup_sets: local.includeWarmupSets ?? false,
    include_timed_warmups: local.includeTimedWarmups ?? false,
    scheduling_mode: local.schedulingMode || null,
    selected_days: local.selectedDays || null,
    status: local.status,
    created_at: toISOString(local.createdAt),
    updated_at: toISOString(local.updatedAt),
  };
}

/**
 * Convert a local scheduled workout to remote format.
 */
export function localToRemoteScheduledWorkout(local: ScheduledWorkout, userId: string) {
  return {
    id: local.id,
    user_id: userId,
    cycle_id: local.cycleId,
    sequence_number: local.sequenceNumber,
    week_number: local.weekNumber,
    day_in_week: local.dayInWeek,
    group_id: local.groupId,
    rfem: local.rfem,
    scheduled_sets: local.scheduledSets,
    status: local.status,
    completed_at: local.completedAt ? toISOString(local.completedAt) : null,
    scheduled_date: local.scheduledDate ? toISOString(local.scheduledDate) : null,
    skip_reason: local.skipReason || null,
    is_ad_hoc: local.isAdHoc ?? false,
    custom_name: local.customName || null,
  };
}

// =============================================================================
// User Preferences Transformers
// =============================================================================

/**
 * Convert a remote user preferences record to local format.
 */
export function remoteToLocalUserPreferences(remote: RemoteUserPreferences): UserPreferences {
  return {
    id: remote.id,
    appMode: (remote.app_mode as AppMode) || 'standard', // Fallback for existing records
    defaultMaxReps: remote.default_max_reps,
    defaultConditioningReps: remote.default_conditioning_reps,
    conditioningWeeklyIncrement: remote.conditioning_weekly_increment,
    weeklySetGoals: remote.weekly_set_goals as WeeklySetGoals,
    restTimer: {
      enabled: remote.rest_timer_enabled,
      durationSeconds: remote.rest_timer_duration_seconds,
    },
    maxTestRestTimer: {
      enabled: remote.max_test_rest_timer_enabled,
      durationSeconds: remote.max_test_rest_timer_duration_seconds,
    },
    timerVolume: remote.timer_volume ?? 40, // Default to 40 for existing records
    lastSchedulingMode: (remote.last_scheduling_mode as SchedulingMode) ?? undefined,
    healthDisclaimerAcknowledgedAt: remote.health_disclaimer_acknowledged_at ?? null,
    createdAt: toDateRequired(remote.created_at),
    updatedAt: toDateRequired(remote.updated_at),
  };
}

/**
 * Convert a local user preferences record to remote format.
 */
export function localToRemoteUserPreferences(local: UserPreferences, userId: string) {
  return {
    id: local.id,
    user_id: userId,
    app_mode: local.appMode || 'standard',
    default_max_reps: local.defaultMaxReps,
    default_conditioning_reps: local.defaultConditioningReps,
    conditioning_weekly_increment: local.conditioningWeeklyIncrement,
    weekly_set_goals: local.weeklySetGoals,
    rest_timer_enabled: local.restTimer.enabled,
    rest_timer_duration_seconds: local.restTimer.durationSeconds,
    max_test_rest_timer_enabled: local.maxTestRestTimer.enabled,
    max_test_rest_timer_duration_seconds: local.maxTestRestTimer.durationSeconds,
    timer_volume: local.timerVolume,
    last_scheduling_mode: local.lastSchedulingMode || null,
    health_disclaimer_acknowledged_at: local.healthDisclaimerAcknowledgedAt || null,
    created_at: toISOString(local.createdAt),
    updated_at: toISOString(local.updatedAt),
  };
}
