import { describe, it, expect } from 'vitest';
import {
  remoteToLocalExercise,
  localToRemoteExercise,
  remoteToLocalMaxRecord,
  localToRemoteMaxRecord,
  remoteToLocalCompletedSet,
  localToRemoteCompletedSet,
  remoteToLocalCycle,
  localToRemoteCycle,
  remoteToLocalScheduledWorkout,
  localToRemoteScheduledWorkout,
  remoteToLocalUserPreferences,
  localToRemoteUserPreferences,
} from './transformers';
import type {
  Exercise,
  MaxRecord,
  CompletedSet,
  Cycle,
  ScheduledWorkout,
  UserPreferences,
} from '@/types';
import type {
  RemoteExercise,
  RemoteMaxRecord,
  RemoteCompletedSet,
  RemoteCycle,
  RemoteScheduledWorkout,
  RemoteUserPreferences,
} from './types';

describe('Sync Transformers', () => {
  describe('Exercise Transformers', () => {
    const remoteExercise: RemoteExercise = {
      id: 'ex-1',
      user_id: 'user-1',
      name: 'Push Up',
      type: 'push',
      mode: 'standard',
      measurement_type: 'reps',
      notes: 'Focus on form',
      custom_parameters: [{ name: 'grip', value: 'wide' }],
      default_conditioning_reps: 20,
      default_conditioning_time: null,
      weight_enabled: true,
      default_weight: 10,
      last_cycle_settings: { rfem: 3, mode: 'standard' },
      created_at: '2026-01-01T10:00:00.000Z',
      updated_at: '2026-01-02T10:00:00.000Z',
    };

    const localExercise: Exercise = {
      id: 'ex-1',
      name: 'Push Up',
      type: 'push',
      mode: 'standard',
      measurementType: 'reps',
      notes: 'Focus on form',
      customParameters: [{ name: 'grip', value: 'wide' }],
      defaultConditioningReps: 20,
      weightEnabled: true,
      defaultWeight: 10,
      lastCycleSettings: { rfem: 3, mode: 'standard' },
      createdAt: new Date('2026-01-01T10:00:00.000Z'),
      updatedAt: new Date('2026-01-02T10:00:00.000Z'),
    };

    it('converts remote exercise to local format', () => {
      const result = remoteToLocalExercise(remoteExercise);

      expect(result.id).toBe('ex-1');
      expect(result.name).toBe('Push Up');
      expect(result.type).toBe('push');
      expect(result.mode).toBe('standard');
      expect(result.measurementType).toBe('reps');
      expect(result.notes).toBe('Focus on form');
      expect(result.customParameters).toEqual([{ name: 'grip', value: 'wide' }]);
      expect(result.defaultConditioningReps).toBe(20);
      expect(result.weightEnabled).toBe(true);
      expect(result.defaultWeight).toBe(10);
      expect(result.createdAt).toBeInstanceOf(Date);
      expect(result.updatedAt).toBeInstanceOf(Date);
    });

    it('converts local exercise to remote format', () => {
      const result = localToRemoteExercise(localExercise, 'user-1');

      expect(result.id).toBe('ex-1');
      expect(result.user_id).toBe('user-1');
      expect(result.name).toBe('Push Up');
      expect(result.type).toBe('push');
      expect(result.mode).toBe('standard');
      expect(result.measurement_type).toBe('reps');
      expect(result.notes).toBe('Focus on form');
      expect(result.custom_parameters).toEqual([{ name: 'grip', value: 'wide' }]);
      expect(result.default_conditioning_reps).toBe(20);
      expect(result.weight_enabled).toBe(true);
      expect(result.default_weight).toBe(10);
      expect(typeof result.created_at).toBe('string');
      expect(typeof result.updated_at).toBe('string');
    });

    it('handles null/undefined values in remote exercise', () => {
      const minimal: RemoteExercise = {
        id: 'ex-2',
        user_id: 'user-1',
        name: 'Minimal Exercise',
        type: 'pull',
        mode: 'standard',
        measurement_type: null as unknown as string,
        notes: null,
        custom_parameters: null,
        default_conditioning_reps: null,
        default_conditioning_time: null,
        weight_enabled: null,
        default_weight: null,
        last_cycle_settings: null,
        created_at: '2026-01-01T10:00:00.000Z',
        updated_at: '2026-01-01T10:00:00.000Z',
      };

      const result = remoteToLocalExercise(minimal);

      expect(result.measurementType).toBe('reps'); // default
      expect(result.notes).toBe('');
      expect(result.customParameters).toEqual([]);
      expect(result.defaultConditioningReps).toBeUndefined();
      expect(result.weightEnabled).toBeUndefined();
    });
  });

  describe('MaxRecord Transformers', () => {
    const remoteMaxRecord: RemoteMaxRecord = {
      id: 'max-1',
      user_id: 'user-1',
      exercise_id: 'ex-1',
      max_reps: 25,
      max_time: null,
      weight: 50,
      notes: 'PR!',
      recorded_at: '2026-01-15T14:30:00.000Z',
    };

    const localMaxRecord: MaxRecord = {
      id: 'max-1',
      exerciseId: 'ex-1',
      maxReps: 25,
      weight: 50,
      notes: 'PR!',
      recordedAt: new Date('2026-01-15T14:30:00.000Z'),
    };

    it('converts remote max record to local format', () => {
      const result = remoteToLocalMaxRecord(remoteMaxRecord);

      expect(result.id).toBe('max-1');
      expect(result.exerciseId).toBe('ex-1');
      expect(result.maxReps).toBe(25);
      expect(result.maxTime).toBeUndefined();
      expect(result.weight).toBe(50);
      expect(result.notes).toBe('PR!');
      expect(result.recordedAt).toBeInstanceOf(Date);
    });

    it('converts local max record to remote format', () => {
      const result = localToRemoteMaxRecord(localMaxRecord, 'user-1');

      expect(result.id).toBe('max-1');
      expect(result.user_id).toBe('user-1');
      expect(result.exercise_id).toBe('ex-1');
      expect(result.max_reps).toBe(25);
      expect(result.max_time).toBeNull();
      expect(result.weight).toBe(50);
      expect(result.notes).toBe('PR!');
      expect(typeof result.recorded_at).toBe('string');
    });
  });

  describe('CompletedSet Transformers', () => {
    const remoteCompletedSet: RemoteCompletedSet = {
      id: 'set-1',
      user_id: 'user-1',
      scheduled_set_id: 'sset-1',
      scheduled_workout_id: 'workout-1',
      exercise_id: 'ex-1',
      target_reps: 10,
      actual_reps: 12,
      weight: 25,
      completed_at: '2026-01-20T09:15:00.000Z',
      notes: 'Felt strong',
      parameters: { tempo: 'slow' },
    };

    const localCompletedSet: CompletedSet = {
      id: 'set-1',
      scheduledSetId: 'sset-1',
      scheduledWorkoutId: 'workout-1',
      exerciseId: 'ex-1',
      targetReps: 10,
      actualReps: 12,
      weight: 25,
      completedAt: new Date('2026-01-20T09:15:00.000Z'),
      notes: 'Felt strong',
      parameters: { tempo: 'slow' },
    };

    it('converts remote completed set to local format', () => {
      const result = remoteToLocalCompletedSet(remoteCompletedSet);

      expect(result.id).toBe('set-1');
      expect(result.scheduledSetId).toBe('sset-1');
      expect(result.scheduledWorkoutId).toBe('workout-1');
      expect(result.exerciseId).toBe('ex-1');
      expect(result.targetReps).toBe(10);
      expect(result.actualReps).toBe(12);
      expect(result.weight).toBe(25);
      expect(result.completedAt).toBeInstanceOf(Date);
      expect(result.notes).toBe('Felt strong');
      expect(result.parameters).toEqual({ tempo: 'slow' });
    });

    it('converts local completed set to remote format', () => {
      const result = localToRemoteCompletedSet(localCompletedSet, 'user-1');

      expect(result.id).toBe('set-1');
      expect(result.user_id).toBe('user-1');
      expect(result.scheduled_set_id).toBe('sset-1');
      expect(result.scheduled_workout_id).toBe('workout-1');
      expect(result.exercise_id).toBe('ex-1');
      expect(result.target_reps).toBe(10);
      expect(result.actual_reps).toBe(12);
      expect(result.weight).toBe(25);
      expect(typeof result.completed_at).toBe('string');
    });
  });

  describe('Cycle Transformers', () => {
    const remoteCycle: RemoteCycle = {
      id: 'cycle-1',
      user_id: 'user-1',
      name: 'Strength Cycle',
      cycle_type: 'training',
      progression_mode: 'rfem',
      previous_cycle_id: null,
      start_date: '2026-01-01',
      number_of_weeks: 4,
      workout_days_per_week: 3,
      weekly_set_goals: { push: 10, pull: 10, legs: 10, core: 5 },
      groups: [{ id: 'g1', name: 'Push', exercises: [] }],
      group_rotation: ['g1', 'g2'],
      rfem_rotation: [3, 4, 5],
      conditioning_weekly_rep_increment: 2,
      conditioning_weekly_time_increment: 5,
      include_warmup_sets: true,
      include_timed_warmups: false,
      status: 'active',
      created_at: '2026-01-01T00:00:00.000Z',
      updated_at: '2026-01-02T00:00:00.000Z',
    };

    const localCycle: Cycle = {
      id: 'cycle-1',
      name: 'Strength Cycle',
      cycleType: 'training',
      progressionMode: 'rfem',
      startDate: new Date('2026-01-01'),
      numberOfWeeks: 4,
      workoutDaysPerWeek: 3,
      weeklySetGoals: { push: 10, pull: 10, legs: 10, core: 5 },
      groups: [{ id: 'g1', name: 'Push', exercises: [] }],
      groupRotation: ['g1', 'g2'],
      rfemRotation: [3, 4, 5],
      conditioningWeeklyRepIncrement: 2,
      conditioningWeeklyTimeIncrement: 5,
      includeWarmupSets: true,
      includeTimedWarmups: false,
      status: 'active',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-02T00:00:00.000Z'),
    };

    it('converts remote cycle to local format', () => {
      const result = remoteToLocalCycle(remoteCycle);

      expect(result.id).toBe('cycle-1');
      expect(result.name).toBe('Strength Cycle');
      expect(result.cycleType).toBe('training');
      expect(result.progressionMode).toBe('rfem');
      expect(result.startDate).toBeInstanceOf(Date);
      expect(result.numberOfWeeks).toBe(4);
      expect(result.workoutDaysPerWeek).toBe(3);
      expect(result.weeklySetGoals).toEqual({ push: 10, pull: 10, legs: 10, core: 5 });
      expect(result.groupRotation).toEqual(['g1', 'g2']);
      expect(result.rfemRotation).toEqual([3, 4, 5]);
      expect(result.conditioningWeeklyRepIncrement).toBe(2);
      expect(result.conditioningWeeklyTimeIncrement).toBe(5);
      expect(result.includeWarmupSets).toBe(true);
      expect(result.includeTimedWarmups).toBe(false);
      expect(result.status).toBe('active');
    });

    it('converts local cycle to remote format', () => {
      const result = localToRemoteCycle(localCycle, 'user-1');

      expect(result.id).toBe('cycle-1');
      expect(result.user_id).toBe('user-1');
      expect(result.name).toBe('Strength Cycle');
      expect(result.cycle_type).toBe('training');
      expect(result.progression_mode).toBe('rfem');
      expect(typeof result.start_date).toBe('string');
      expect(result.number_of_weeks).toBe(4);
      expect(result.workout_days_per_week).toBe(3);
      expect(result.weekly_set_goals).toEqual({ push: 10, pull: 10, legs: 10, core: 5 });
      expect(result.group_rotation).toEqual(['g1', 'g2']);
      expect(result.rfem_rotation).toEqual([3, 4, 5]);
      expect(result.conditioning_weekly_rep_increment).toBe(2);
      expect(result.conditioning_weekly_time_increment).toBe(5);
      expect(result.include_warmup_sets).toBe(true);
      expect(result.include_timed_warmups).toBe(false);
      expect(result.status).toBe('active');
    });
  });

  describe('ScheduledWorkout Transformers', () => {
    const remoteWorkout: RemoteScheduledWorkout = {
      id: 'workout-1',
      user_id: 'user-1',
      cycle_id: 'cycle-1',
      sequence_number: 1,
      week_number: 1,
      day_in_week: 1,
      group_id: 'g1',
      rfem: 3,
      scheduled_sets: [{ id: 'ss-1', exerciseId: 'ex-1', targetReps: 10 }],
      status: 'pending',
      completed_at: null,
    };

    const localWorkout: ScheduledWorkout = {
      id: 'workout-1',
      cycleId: 'cycle-1',
      sequenceNumber: 1,
      weekNumber: 1,
      dayInWeek: 1,
      groupId: 'g1',
      rfem: 3,
      scheduledSets: [{ id: 'ss-1', exerciseId: 'ex-1', targetReps: 10 }],
      status: 'pending',
    };

    it('converts remote scheduled workout to local format', () => {
      const result = remoteToLocalScheduledWorkout(remoteWorkout);

      expect(result.id).toBe('workout-1');
      expect(result.cycleId).toBe('cycle-1');
      expect(result.sequenceNumber).toBe(1);
      expect(result.weekNumber).toBe(1);
      expect(result.dayInWeek).toBe(1);
      expect(result.groupId).toBe('g1');
      expect(result.rfem).toBe(3);
      expect(result.scheduledSets).toHaveLength(1);
      expect(result.status).toBe('pending');
      expect(result.completedAt).toBeUndefined();
    });

    it('converts local scheduled workout to remote format', () => {
      const result = localToRemoteScheduledWorkout(localWorkout, 'user-1');

      expect(result.id).toBe('workout-1');
      expect(result.user_id).toBe('user-1');
      expect(result.cycle_id).toBe('cycle-1');
      expect(result.sequence_number).toBe(1);
      expect(result.week_number).toBe(1);
      expect(result.day_in_week).toBe(1);
      expect(result.group_id).toBe('g1');
      expect(result.rfem).toBe(3);
      expect(result.scheduled_sets).toHaveLength(1);
      expect(result.status).toBe('pending');
      expect(result.completed_at).toBeNull();
    });

    it('handles completed workout with completedAt', () => {
      const completedWorkout: ScheduledWorkout = {
        ...localWorkout,
        status: 'completed',
        completedAt: new Date('2026-01-15T18:00:00.000Z'),
      };

      const result = localToRemoteScheduledWorkout(completedWorkout, 'user-1');

      expect(result.status).toBe('completed');
      expect(result.completed_at).toBe('2026-01-15T18:00:00.000Z');
    });
  });

  describe('UserPreferences Transformers', () => {
    const remotePrefs: RemoteUserPreferences = {
      id: 'pref-1',
      user_id: 'user-1',
      app_mode: 'advanced',
      default_max_reps: 10,
      default_conditioning_reps: 20,
      conditioning_weekly_increment: 2,
      weekly_set_goals: { push: 12, pull: 12, legs: 12, core: 6 },
      rest_timer_enabled: true,
      rest_timer_duration_seconds: 180,
      max_test_rest_timer_enabled: true,
      max_test_rest_timer_duration_seconds: 300,
      created_at: '2026-01-01T00:00:00.000Z',
      updated_at: '2026-01-02T00:00:00.000Z',
    };

    const localPrefs: UserPreferences = {
      id: 'pref-1',
      appMode: 'advanced',
      defaultMaxReps: 10,
      defaultConditioningReps: 20,
      conditioningWeeklyIncrement: 2,
      weeklySetGoals: { push: 12, pull: 12, legs: 12, core: 6 },
      restTimer: {
        enabled: true,
        durationSeconds: 180,
      },
      maxTestRestTimer: {
        enabled: true,
        durationSeconds: 300,
      },
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-02T00:00:00.000Z'),
    };

    it('converts remote user preferences to local format', () => {
      const result = remoteToLocalUserPreferences(remotePrefs);

      expect(result.id).toBe('pref-1');
      expect(result.appMode).toBe('advanced');
      expect(result.defaultMaxReps).toBe(10);
      expect(result.defaultConditioningReps).toBe(20);
      expect(result.conditioningWeeklyIncrement).toBe(2);
      expect(result.weeklySetGoals).toEqual({ push: 12, pull: 12, legs: 12, core: 6 });
      expect(result.restTimer.enabled).toBe(true);
      expect(result.restTimer.durationSeconds).toBe(180);
      expect(result.maxTestRestTimer.enabled).toBe(true);
      expect(result.maxTestRestTimer.durationSeconds).toBe(300);
      expect(result.createdAt).toBeInstanceOf(Date);
      expect(result.updatedAt).toBeInstanceOf(Date);
    });

    it('converts local user preferences to remote format', () => {
      const result = localToRemoteUserPreferences(localPrefs, 'user-1');

      expect(result.id).toBe('pref-1');
      expect(result.user_id).toBe('user-1');
      expect(result.app_mode).toBe('advanced');
      expect(result.default_max_reps).toBe(10);
      expect(result.default_conditioning_reps).toBe(20);
      expect(result.conditioning_weekly_increment).toBe(2);
      expect(result.weekly_set_goals).toEqual({ push: 12, pull: 12, legs: 12, core: 6 });
      expect(result.rest_timer_enabled).toBe(true);
      expect(result.rest_timer_duration_seconds).toBe(180);
      expect(result.max_test_rest_timer_enabled).toBe(true);
      expect(result.max_test_rest_timer_duration_seconds).toBe(300);
      expect(typeof result.created_at).toBe('string');
      expect(typeof result.updated_at).toBe('string');
    });

    it('handles missing app_mode with default', () => {
      const prefsWithoutAppMode: RemoteUserPreferences = {
        ...remotePrefs,
        app_mode: null as unknown as string,
      };

      const result = remoteToLocalUserPreferences(prefsWithoutAppMode);

      expect(result.appMode).toBe('standard'); // default
    });
  });

  describe('Round-trip transformations', () => {
    it('exercise survives round-trip transformation', () => {
      const localExercise: Exercise = {
        id: 'ex-roundtrip',
        name: 'Test Exercise',
        type: 'push',
        mode: 'standard',
        measurementType: 'reps',
        notes: 'Test notes',
        customParameters: [],
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        updatedAt: new Date('2026-01-01T00:00:00.000Z'),
      };

      const remote = localToRemoteExercise(localExercise, 'user-1');
      const backToLocal = remoteToLocalExercise(remote);

      expect(backToLocal.id).toBe(localExercise.id);
      expect(backToLocal.name).toBe(localExercise.name);
      expect(backToLocal.type).toBe(localExercise.type);
      expect(backToLocal.mode).toBe(localExercise.mode);
      expect(backToLocal.notes).toBe(localExercise.notes);
    });

    it('max record survives round-trip transformation', () => {
      const localMax: MaxRecord = {
        id: 'max-roundtrip',
        exerciseId: 'ex-1',
        maxReps: 20,
        notes: 'Test max',
        recordedAt: new Date('2026-01-15T00:00:00.000Z'),
      };

      const remote = localToRemoteMaxRecord(localMax, 'user-1');
      const backToLocal = remoteToLocalMaxRecord(remote);

      expect(backToLocal.id).toBe(localMax.id);
      expect(backToLocal.exerciseId).toBe(localMax.exerciseId);
      expect(backToLocal.maxReps).toBe(localMax.maxReps);
      expect(backToLocal.notes).toBe(localMax.notes);
    });
  });
});
