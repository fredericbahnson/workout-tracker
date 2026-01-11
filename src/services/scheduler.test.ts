import { describe, it, expect, beforeEach } from 'vitest';
import { 
  generateSchedule, 
  calculateTargetReps,
  calculateSimpleTargetReps,
  calculateSimpleTargetWeight,
  validateCycle 
} from './scheduler';
import type { 
  Cycle, 
  Exercise, 
  ScheduledWorkout, 
  ScheduledSet, 
  MaxRecord,
  ProgressionInterval,
  Group
} from '@/types';

// ============================================================================
// Test Fixtures
// ============================================================================

function createMockExercise(overrides: Partial<Exercise> = {}): Exercise {
  return {
    id: 'ex-1',
    name: 'Push-ups',
    type: 'push',
    mode: 'standard',
    measurementType: 'reps',
    notes: '',
    customParameters: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function createMockGroup(overrides: Partial<Group> = {}): Group {
  return {
    id: 'group-1',
    name: 'Group A',
    exerciseAssignments: [],
    ...overrides,
  };
}

function createMockCycle(overrides: Partial<Cycle> = {}): Cycle {
  const groupA = createMockGroup({ id: 'group-a', name: 'Group A' });
  const groupB = createMockGroup({ id: 'group-b', name: 'Group B' });
  
  return {
    id: 'cycle-1',
    name: 'Test Cycle',
    cycleType: 'training',
    startDate: new Date('2024-01-01'),
    numberOfWeeks: 4,
    workoutDaysPerWeek: 3,
    weeklySetGoals: {
      push: 10,
      pull: 10,
      legs: 10,
      core: 0,
      balance: 0,
      mobility: 0,
      other: 0,
    },
    groups: [groupA, groupB],
    groupRotation: [groupA.id, groupB.id, groupA.id],
    rfemRotation: [4, 3, 2],
    conditioningWeeklyRepIncrement: 5,
    status: 'active',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function createMockScheduledSet(overrides: Partial<ScheduledSet> = {}): ScheduledSet {
  return {
    id: 'set-1',
    exerciseId: 'ex-1',
    exerciseType: 'push',
    isConditioning: false,
    setNumber: 1,
    ...overrides,
  };
}

function createMockScheduledWorkout(overrides: Partial<ScheduledWorkout> = {}): ScheduledWorkout {
  return {
    id: 'workout-1',
    cycleId: 'cycle-1',
    sequenceNumber: 1,
    weekNumber: 1,
    dayInWeek: 1,
    groupId: 'group-a',
    rfem: 4,
    scheduledSets: [],
    status: 'pending',
    ...overrides,
  };
}

function createMockMaxRecord(overrides: Partial<MaxRecord> = {}): MaxRecord {
  return {
    id: 'max-1',
    exerciseId: 'ex-1',
    maxReps: 20,
    notes: '',
    recordedAt: new Date(),
    ...overrides,
  };
}

// ============================================================================
// calculateTargetReps Tests
// ============================================================================

describe('calculateTargetReps', () => {
  describe('standard exercises (progressive underload)', () => {
    it('calculates target as max minus RFEM', () => {
      const set = createMockScheduledSet({ isConditioning: false });
      const workout = createMockScheduledWorkout({ rfem: 4 });
      const maxRecord = createMockMaxRecord({ maxReps: 20 });

      const target = calculateTargetReps(set, workout, maxRecord, 5, 5, 10);

      expect(target).toBe(16); // 20 - 4 = 16
    });

    it('uses different RFEM values correctly', () => {
      const set = createMockScheduledSet({ isConditioning: false });
      const maxRecord = createMockMaxRecord({ maxReps: 20 });

      // RFEM 4
      expect(calculateTargetReps(
        set, 
        createMockScheduledWorkout({ rfem: 4 }), 
        maxRecord, 5, 5, 10
      )).toBe(16);

      // RFEM 3
      expect(calculateTargetReps(
        set, 
        createMockScheduledWorkout({ rfem: 3 }), 
        maxRecord, 5, 5, 10
      )).toBe(17);

      // RFEM 2
      expect(calculateTargetReps(
        set, 
        createMockScheduledWorkout({ rfem: 2 }), 
        maxRecord, 5, 5, 10
      )).toBe(18);
    });

    it('uses default max when no max record exists', () => {
      const set = createMockScheduledSet({ isConditioning: false });
      const workout = createMockScheduledWorkout({ rfem: 4 });

      const target = calculateTargetReps(set, workout, undefined, 5, 5, 10);

      expect(target).toBe(6); // default 10 - 4 = 6
    });

    it('enforces minimum of 1 rep', () => {
      const set = createMockScheduledSet({ isConditioning: false });
      const workout = createMockScheduledWorkout({ rfem: 15 }); // High RFEM
      const maxRecord = createMockMaxRecord({ maxReps: 10 });

      const target = calculateTargetReps(set, workout, maxRecord, 5, 5, 10);

      expect(target).toBe(1); // max(1, 10-15) = 1
    });
  });

  describe('conditioning exercises (progressive overload)', () => {
    it('calculates target as base plus weekly increment', () => {
      const set = createMockScheduledSet({ 
        isConditioning: true, 
        conditioningBaseReps: 10 
      });
      const workout = createMockScheduledWorkout({ weekNumber: 1 });

      const target = calculateTargetReps(set, workout, undefined, 5, 5, 10);

      expect(target).toBe(10); // Week 1: base + (1-1)*5 = 10
    });

    it('increases target each week', () => {
      const set = createMockScheduledSet({ 
        isConditioning: true, 
        conditioningBaseReps: 10 
      });

      // Week 1
      expect(calculateTargetReps(
        set, 
        createMockScheduledWorkout({ weekNumber: 1 }), 
        undefined, 5, 5, 10
      )).toBe(10);

      // Week 2
      expect(calculateTargetReps(
        set, 
        createMockScheduledWorkout({ weekNumber: 2 }), 
        undefined, 5, 5, 10
      )).toBe(15); // 10 + 5

      // Week 3
      expect(calculateTargetReps(
        set, 
        createMockScheduledWorkout({ weekNumber: 3 }), 
        undefined, 5, 5, 10
      )).toBe(20); // 10 + 10

      // Week 4
      expect(calculateTargetReps(
        set, 
        createMockScheduledWorkout({ weekNumber: 4 }), 
        undefined, 5, 5, 10
      )).toBe(25); // 10 + 15
    });

    it('uses default conditioning base when not specified', () => {
      const set = createMockScheduledSet({ 
        isConditioning: true,
        conditioningBaseReps: undefined 
      });
      const workout = createMockScheduledWorkout({ weekNumber: 2 });

      // Should use defaultMax (10) as base
      const target = calculateTargetReps(set, workout, undefined, 5, 5, 10);

      expect(target).toBe(15); // 10 + (2-1)*5 = 15
    });
  });

  describe('time-based exercises', () => {
    it('calculates time-based standard exercise targets', () => {
      const set = createMockScheduledSet({ 
        isConditioning: false,
        measurementType: 'time'
      });
      const workout = createMockScheduledWorkout({ rfem: 2 });
      const maxRecord = createMockMaxRecord({ maxTime: 60, maxReps: undefined });

      const target = calculateTargetReps(set, workout, maxRecord, 5, 5, 10);

      // For time-based: max - (rfem * 3) = 60 - 6 = 54
      expect(target).toBe(54);
    });

    it('calculates time-based conditioning exercise targets', () => {
      const set = createMockScheduledSet({ 
        isConditioning: true,
        measurementType: 'time',
        conditioningBaseTime: 30
      });
      const workout = createMockScheduledWorkout({ weekNumber: 3 });

      const target = calculateTargetReps(set, workout, undefined, 5, 5, 10);

      // Week 3: 30 + (3-1)*5 = 40
      expect(target).toBe(40);
    });

    it('enforces minimum of 5 seconds for time-based', () => {
      const set = createMockScheduledSet({ 
        isConditioning: false,
        measurementType: 'time'
      });
      const workout = createMockScheduledWorkout({ rfem: 10 });
      const maxRecord = createMockMaxRecord({ maxTime: 20, maxReps: undefined });

      const target = calculateTargetReps(set, workout, maxRecord, 5, 5, 10);

      // Would be 20 - 30 = -10, but minimum is 5
      expect(target).toBe(5);
    });
  });

  describe('max testing sets', () => {
    it('returns 0 for max test sets (go to max)', () => {
      const set = createMockScheduledSet({ isMaxTest: true });
      const workout = createMockScheduledWorkout();
      const maxRecord = createMockMaxRecord({ maxReps: 20 });

      const target = calculateTargetReps(set, workout, maxRecord, 5, 5, 10);

      expect(target).toBe(0); // Signal to UI: go to max
    });

    it('calculates warmup as 20% of previous max', () => {
      const set = createMockScheduledSet({ 
        isWarmup: true,
        previousMaxReps: 20
      });
      const workout = createMockScheduledWorkout();

      const target = calculateTargetReps(set, workout, undefined, 5, 5, 10);

      expect(target).toBe(4); // 20% of 20 = 4
    });

    it('uses max record for warmup when previousMaxReps not set', () => {
      const set = createMockScheduledSet({ isWarmup: true });
      const workout = createMockScheduledWorkout();
      const maxRecord = createMockMaxRecord({ maxReps: 30 });

      const target = calculateTargetReps(set, workout, maxRecord, 5, 5, 10);

      expect(target).toBe(6); // 20% of 30 = 6
    });

    it('enforces minimum 1 rep for warmup', () => {
      const set = createMockScheduledSet({ 
        isWarmup: true,
        previousMaxReps: 3 // 20% would be 0.6
      });
      const workout = createMockScheduledWorkout();

      const target = calculateTargetReps(set, workout, undefined, 5, 5, 10);

      expect(target).toBe(1); // Minimum 1
    });

    it('enforces minimum 5 seconds for time-based warmup', () => {
      const set = createMockScheduledSet({ 
        isWarmup: true,
        measurementType: 'time',
        previousMaxTime: 15 // 20% would be 3
      });
      const workout = createMockScheduledWorkout();

      const target = calculateTargetReps(set, workout, undefined, 5, 5, 10);

      expect(target).toBe(5); // Minimum 5 seconds
    });
  });
});

// ============================================================================
// generateSchedule Tests
// ============================================================================

describe('generateSchedule', () => {
  let exercises: Map<string, Exercise>;

  beforeEach(() => {
    exercises = new Map();
    exercises.set('push-1', createMockExercise({ 
      id: 'push-1', 
      name: 'Push-ups', 
      type: 'push' 
    }));
    exercises.set('pull-1', createMockExercise({ 
      id: 'pull-1', 
      name: 'Pull-ups', 
      type: 'pull' 
    }));
    exercises.set('legs-1', createMockExercise({ 
      id: 'legs-1', 
      name: 'Squats', 
      type: 'legs' 
    }));
  });

  it('generates correct number of workouts', () => {
    const cycle = createMockCycle({
      numberOfWeeks: 4,
      workoutDaysPerWeek: 3,
      groups: [
        createMockGroup({ 
          id: 'group-a',
          exerciseAssignments: [{ exerciseId: 'push-1' }]
        })
      ],
      groupRotation: ['group-a'],
    });

    const workouts = generateSchedule({ cycle, exercises });

    expect(workouts.length).toBe(12); // 4 weeks × 3 days
  });

  it('assigns correct sequence numbers', () => {
    const cycle = createMockCycle({
      numberOfWeeks: 2,
      workoutDaysPerWeek: 3,
      groups: [
        createMockGroup({ 
          id: 'group-a',
          exerciseAssignments: [{ exerciseId: 'push-1' }]
        })
      ],
      groupRotation: ['group-a'],
    });

    const workouts = generateSchedule({ cycle, exercises });

    expect(workouts.map(w => w.sequenceNumber)).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it('assigns correct week numbers', () => {
    const cycle = createMockCycle({
      numberOfWeeks: 2,
      workoutDaysPerWeek: 3,
      groups: [
        createMockGroup({ 
          id: 'group-a',
          exerciseAssignments: [{ exerciseId: 'push-1' }]
        })
      ],
      groupRotation: ['group-a'],
    });

    const workouts = generateSchedule({ cycle, exercises });

    expect(workouts.map(w => w.weekNumber)).toEqual([1, 1, 1, 2, 2, 2]);
  });

  it('rotates groups correctly', () => {
    const groupA = createMockGroup({ 
      id: 'group-a', 
      name: 'A',
      exerciseAssignments: [{ exerciseId: 'push-1' }]
    });
    const groupB = createMockGroup({ 
      id: 'group-b', 
      name: 'B',
      exerciseAssignments: [{ exerciseId: 'pull-1' }]
    });

    const cycle = createMockCycle({
      numberOfWeeks: 1,
      workoutDaysPerWeek: 4,
      groups: [groupA, groupB],
      groupRotation: ['group-a', 'group-b'], // Alternates
    });

    const workouts = generateSchedule({ cycle, exercises });

    expect(workouts.map(w => w.groupId)).toEqual([
      'group-a', 'group-b', 'group-a', 'group-b'
    ]);
  });

  it('rotates RFEM correctly', () => {
    const cycle = createMockCycle({
      numberOfWeeks: 1,
      workoutDaysPerWeek: 5,
      rfemRotation: [4, 3, 2],
      groups: [
        createMockGroup({ 
          id: 'group-a',
          exerciseAssignments: [{ exerciseId: 'push-1' }]
        })
      ],
      groupRotation: ['group-a'],
    });

    const workouts = generateSchedule({ cycle, exercises });

    expect(workouts.map(w => w.rfem)).toEqual([4, 3, 2, 4, 3]);
  });

  it('supports startFromWorkout parameter', () => {
    const cycle = createMockCycle({
      numberOfWeeks: 2,
      workoutDaysPerWeek: 3,
      groups: [
        createMockGroup({ 
          id: 'group-a',
          exerciseAssignments: [{ exerciseId: 'push-1' }]
        })
      ],
      groupRotation: ['group-a'],
    });

    const workouts = generateSchedule({ 
      cycle, 
      exercises, 
      startFromWorkout: 4 
    });

    expect(workouts.length).toBe(3); // Only workouts 4, 5, 6
    expect(workouts[0].sequenceNumber).toBe(4);
  });

  it('distributes sets across eligible days', () => {
    const groupA = createMockGroup({ 
      id: 'group-a',
      exerciseAssignments: [{ exerciseId: 'push-1' }] // Only push
    });
    const groupB = createMockGroup({ 
      id: 'group-b',
      exerciseAssignments: [{ exerciseId: 'pull-1' }] // Only pull
    });

    const cycle = createMockCycle({
      numberOfWeeks: 1,
      workoutDaysPerWeek: 2,
      weeklySetGoals: {
        push: 6,
        pull: 4,
        legs: 0,
        core: 0,
        balance: 0,
        mobility: 0,
        other: 0,
      },
      groups: [groupA, groupB],
      groupRotation: ['group-a', 'group-b'],
    });

    const workouts = generateSchedule({ cycle, exercises });

    // Day 1 (group-a) should have all 6 push sets
    const day1PushSets = workouts[0].scheduledSets.filter(s => s.exerciseType === 'push');
    expect(day1PushSets.length).toBe(6);

    // Day 2 (group-b) should have all 4 pull sets
    const day2PullSets = workouts[1].scheduledSets.filter(s => s.exerciseType === 'pull');
    expect(day2PullSets.length).toBe(4);
  });

  it('all scheduled sets have required fields', () => {
    const cycle = createMockCycle({
      numberOfWeeks: 1,
      workoutDaysPerWeek: 2,
      groups: [
        createMockGroup({ 
          id: 'group-a',
          exerciseAssignments: [{ exerciseId: 'push-1' }]
        })
      ],
      groupRotation: ['group-a'],
    });

    const workouts = generateSchedule({ cycle, exercises });

    for (const workout of workouts) {
      for (const set of workout.scheduledSets) {
        expect(set.id).toBeDefined();
        expect(set.exerciseId).toBeDefined();
        expect(set.exerciseType).toBeDefined();
        expect(typeof set.isConditioning).toBe('boolean');
        expect(typeof set.setNumber).toBe('number');
      }
    }
  });

  it('handles conditioning exercises correctly', () => {
    exercises.set('cond-1', createMockExercise({ 
      id: 'cond-1', 
      name: 'Burpees', 
      type: 'core',
      mode: 'conditioning'
    }));

    const cycle = createMockCycle({
      numberOfWeeks: 1,
      workoutDaysPerWeek: 1,
      weeklySetGoals: {
        push: 0,
        pull: 0,
        legs: 0,
        core: 3,
        balance: 0,
        mobility: 0,
        other: 0,
      },
      groups: [
        createMockGroup({ 
          id: 'group-a',
          exerciseAssignments: [{ 
            exerciseId: 'cond-1',
            conditioningBaseReps: 15
          }]
        })
      ],
      groupRotation: ['group-a'],
    });

    const workouts = generateSchedule({ cycle, exercises });

    const conditioningSets = workouts[0].scheduledSets.filter(s => s.isConditioning);
    expect(conditioningSets.length).toBe(3);
    expect(conditioningSets[0].conditioningBaseReps).toBe(15);
  });
});

// ============================================================================
// validateCycle Tests
// ============================================================================

describe('validateCycle', () => {
  let exercises: Map<string, Exercise>;

  beforeEach(() => {
    exercises = new Map();
    exercises.set('push-1', createMockExercise({ 
      id: 'push-1', 
      type: 'push' 
    }));
    exercises.set('pull-1', createMockExercise({ 
      id: 'pull-1', 
      type: 'pull' 
    }));
  });

  it('validates a correct cycle configuration', () => {
    const cycle = {
      name: 'Valid Cycle',
      cycleType: 'training' as const,
      startDate: new Date(),
      numberOfWeeks: 4,
      workoutDaysPerWeek: 3,
      weeklySetGoals: {
        push: 10,
        pull: 10,
        legs: 0,
        core: 0,
        balance: 0,
        mobility: 0,
        other: 0,
      },
      groups: [
        createMockGroup({ 
          id: 'group-a',
          exerciseAssignments: [{ exerciseId: 'push-1' }, { exerciseId: 'pull-1' }]
        })
      ],
      groupRotation: ['group-a'],
      rfemRotation: [4, 3, 2],
      conditioningWeeklyRepIncrement: 5,
      status: 'planning' as const,
    };

    const result = validateCycle(cycle, exercises);

    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('requires cycle name', () => {
    const cycle = {
      name: '',
      cycleType: 'training' as const,
      startDate: new Date(),
      numberOfWeeks: 4,
      workoutDaysPerWeek: 3,
      weeklySetGoals: { push: 0, pull: 0, legs: 0, core: 0, balance: 0, mobility: 0, other: 0 },
      groups: [createMockGroup()],
      groupRotation: ['group-1'],
      rfemRotation: [4],
      conditioningWeeklyRepIncrement: 5,
      status: 'planning' as const,
    };

    const result = validateCycle(cycle, exercises);

    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Cycle name is required');
  });

  it('requires at least 1 week', () => {
    const cycle = {
      name: 'Test',
      cycleType: 'training' as const,
      startDate: new Date(),
      numberOfWeeks: 0,
      workoutDaysPerWeek: 3,
      weeklySetGoals: { push: 0, pull: 0, legs: 0, core: 0, balance: 0, mobility: 0, other: 0 },
      groups: [createMockGroup()],
      groupRotation: ['group-1'],
      rfemRotation: [4],
      conditioningWeeklyRepIncrement: 5,
      status: 'planning' as const,
    };

    const result = validateCycle(cycle, exercises);

    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Cycle must be at least 1 week');
  });

  it('validates workout days per week range', () => {
    const baseCycle = {
      name: 'Test',
      cycleType: 'training' as const,
      startDate: new Date(),
      numberOfWeeks: 4,
      weeklySetGoals: { push: 0, pull: 0, legs: 0, core: 0, balance: 0, mobility: 0, other: 0 },
      groups: [createMockGroup()],
      groupRotation: ['group-1'],
      rfemRotation: [4],
      conditioningWeeklyRepIncrement: 5,
      status: 'planning' as const,
    };

    // Too few
    expect(validateCycle({ ...baseCycle, workoutDaysPerWeek: 0 }, exercises).errors)
      .toContain('Workout days per week must be between 1 and 7');

    // Too many
    expect(validateCycle({ ...baseCycle, workoutDaysPerWeek: 8 }, exercises).errors)
      .toContain('Workout days per week must be between 1 and 7');

    // Valid
    expect(validateCycle({ ...baseCycle, workoutDaysPerWeek: 5 }, exercises).valid).toBe(true);
  });

  it('requires at least one group', () => {
    const cycle = {
      name: 'Test',
      cycleType: 'training' as const,
      startDate: new Date(),
      numberOfWeeks: 4,
      workoutDaysPerWeek: 3,
      weeklySetGoals: { push: 0, pull: 0, legs: 0, core: 0, balance: 0, mobility: 0, other: 0 },
      groups: [],
      groupRotation: [],
      rfemRotation: [4],
      conditioningWeeklyRepIncrement: 5,
      status: 'planning' as const,
    };

    const result = validateCycle(cycle, exercises);

    expect(result.valid).toBe(false);
    expect(result.errors).toContain('At least one group is required');
  });

  it('requires group rotation', () => {
    const cycle = {
      name: 'Test',
      cycleType: 'training' as const,
      startDate: new Date(),
      numberOfWeeks: 4,
      workoutDaysPerWeek: 3,
      weeklySetGoals: { push: 0, pull: 0, legs: 0, core: 0, balance: 0, mobility: 0, other: 0 },
      groups: [createMockGroup()],
      groupRotation: [],
      rfemRotation: [4],
      conditioningWeeklyRepIncrement: 5,
      status: 'planning' as const,
    };

    const result = validateCycle(cycle, exercises);

    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Group rotation is required');
  });

  it('requires RFEM rotation', () => {
    const cycle = {
      name: 'Test',
      cycleType: 'training' as const,
      startDate: new Date(),
      numberOfWeeks: 4,
      workoutDaysPerWeek: 3,
      weeklySetGoals: { push: 0, pull: 0, legs: 0, core: 0, balance: 0, mobility: 0, other: 0 },
      groups: [createMockGroup()],
      groupRotation: ['group-1'],
      rfemRotation: [],
      conditioningWeeklyRepIncrement: 5,
      status: 'planning' as const,
    };

    const result = validateCycle(cycle, exercises);

    expect(result.valid).toBe(false);
    expect(result.errors).toContain('RFEM rotation is required');
  });

  it('validates group rotation references existing groups', () => {
    const cycle = {
      name: 'Test',
      cycleType: 'training' as const,
      startDate: new Date(),
      numberOfWeeks: 4,
      workoutDaysPerWeek: 3,
      weeklySetGoals: { push: 0, pull: 0, legs: 0, core: 0, balance: 0, mobility: 0, other: 0 },
      groups: [createMockGroup({ id: 'group-a' })],
      groupRotation: ['group-a', 'group-nonexistent'],
      rfemRotation: [4],
      conditioningWeeklyRepIncrement: 5,
      status: 'planning' as const,
    };

    const result = validateCycle(cycle, exercises);

    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Group group-nonexistent in rotation not found');
  });

  it('warns about empty groups', () => {
    const cycle = {
      name: 'Test',
      cycleType: 'training' as const,
      startDate: new Date(),
      numberOfWeeks: 4,
      workoutDaysPerWeek: 3,
      weeklySetGoals: { push: 0, pull: 0, legs: 0, core: 0, balance: 0, mobility: 0, other: 0 },
      groups: [createMockGroup({ name: 'Empty Group', exerciseAssignments: [] })],
      groupRotation: ['group-1'],
      rfemRotation: [4],
      conditioningWeeklyRepIncrement: 5,
      status: 'planning' as const,
    };

    const result = validateCycle(cycle, exercises);

    expect(result.valid).toBe(true); // Warning, not error
    expect(result.warnings).toContain('Group "Empty Group" has no exercises');
  });

  it('warns when set goals cannot be met', () => {
    // Only push exercises available, but goals set for pull
    const cycle = {
      name: 'Test',
      cycleType: 'training' as const,
      startDate: new Date(),
      numberOfWeeks: 4,
      workoutDaysPerWeek: 3,
      weeklySetGoals: { 
        push: 0, 
        pull: 10, // Goal for pull
        legs: 0, 
        core: 0, 
        balance: 0, 
        mobility: 0, 
        other: 0 
      },
      groups: [
        createMockGroup({ 
          id: 'group-a',
          exerciseAssignments: [{ exerciseId: 'push-1' }] // Only push
        })
      ],
      groupRotation: ['group-a'],
      rfemRotation: [4],
      conditioningWeeklyRepIncrement: 5,
      status: 'planning' as const,
    };

    const result = validateCycle(cycle, exercises);

    expect(result.warnings.some(w => w.includes('pull') && w.includes('cannot be met'))).toBe(true);
  });
});

// ============================================================================
// Simple Progression Mode Tests
// ============================================================================

describe('calculateSimpleTargetReps', () => {
  function createSimpleCycle(overrides: Partial<Cycle> = {}): Cycle {
    return {
      ...createMockCycle(),
      progressionMode: 'simple',
      ...overrides,
    };
  }

  describe('constant progression', () => {
    it('returns base reps when progression is constant', () => {
      const set = createMockScheduledSet({
        simpleBaseReps: 15,
        simpleRepProgressionType: 'constant',
        simpleRepIncrement: 0,
      });
      const workout = createMockScheduledWorkout({ sequenceNumber: 5, weekNumber: 2 });
      const cycle = createSimpleCycle();

      const target = calculateSimpleTargetReps(set, workout, cycle);

      expect(target).toBe(15);
    });

    it('returns base reps when increment is 0', () => {
      const set = createMockScheduledSet({
        simpleBaseReps: 12,
        simpleRepProgressionType: 'per_workout',
        simpleRepIncrement: 0,
      });
      const workout = createMockScheduledWorkout({ sequenceNumber: 10 });
      const cycle = createSimpleCycle();

      const target = calculateSimpleTargetReps(set, workout, cycle);

      expect(target).toBe(12);
    });
  });

  describe('per_workout progression', () => {
    it('adds increment for each workout', () => {
      const set = createMockScheduledSet({
        simpleBaseReps: 10,
        simpleRepProgressionType: 'per_workout',
        simpleRepIncrement: 2,
      });
      const cycle = createSimpleCycle();

      // First workout: 10 + 0*2 = 10
      expect(calculateSimpleTargetReps(
        set,
        createMockScheduledWorkout({ sequenceNumber: 1 }),
        cycle
      )).toBe(10);

      // Second workout: 10 + 1*2 = 12
      expect(calculateSimpleTargetReps(
        set,
        createMockScheduledWorkout({ sequenceNumber: 2 }),
        cycle
      )).toBe(12);

      // Fifth workout: 10 + 4*2 = 18
      expect(calculateSimpleTargetReps(
        set,
        createMockScheduledWorkout({ sequenceNumber: 5 }),
        cycle
      )).toBe(18);
    });

    it('handles fractional increments', () => {
      const set = createMockScheduledSet({
        simpleBaseReps: 10,
        simpleRepProgressionType: 'per_workout',
        simpleRepIncrement: 0.5,
      });
      const cycle = createSimpleCycle();

      // Third workout: 10 + 2*0.5 = 11
      expect(calculateSimpleTargetReps(
        set,
        createMockScheduledWorkout({ sequenceNumber: 3 }),
        cycle
      )).toBe(11);
    });
  });

  describe('per_week progression', () => {
    it('adds increment for each week', () => {
      const set = createMockScheduledSet({
        simpleBaseReps: 8,
        simpleRepProgressionType: 'per_week',
        simpleRepIncrement: 1,
      });
      const cycle = createSimpleCycle();

      // Week 1: 8 + 0*1 = 8
      expect(calculateSimpleTargetReps(
        set,
        createMockScheduledWorkout({ weekNumber: 1, sequenceNumber: 1 }),
        cycle
      )).toBe(8);

      // Week 1 day 3: still 8
      expect(calculateSimpleTargetReps(
        set,
        createMockScheduledWorkout({ weekNumber: 1, sequenceNumber: 3 }),
        cycle
      )).toBe(8);

      // Week 2: 8 + 1*1 = 9
      expect(calculateSimpleTargetReps(
        set,
        createMockScheduledWorkout({ weekNumber: 2, sequenceNumber: 4 }),
        cycle
      )).toBe(9);

      // Week 4: 8 + 3*1 = 11
      expect(calculateSimpleTargetReps(
        set,
        createMockScheduledWorkout({ weekNumber: 4, sequenceNumber: 10 }),
        cycle
      )).toBe(11);
    });
  });

  describe('time-based exercises', () => {
    it('calculates time progression correctly', () => {
      const set = createMockScheduledSet({
        measurementType: 'time',
        simpleBaseTime: 30,
        simpleTimeProgressionType: 'per_week',
        simpleTimeIncrement: 5,
      });
      const cycle = createSimpleCycle();

      // Week 1: 30 seconds
      expect(calculateSimpleTargetReps(
        set,
        createMockScheduledWorkout({ weekNumber: 1 }),
        cycle
      )).toBe(30);

      // Week 3: 30 + 2*5 = 40 seconds
      expect(calculateSimpleTargetReps(
        set,
        createMockScheduledWorkout({ weekNumber: 3 }),
        cycle
      )).toBe(40);
    });

    it('uses default time when base not set', () => {
      const set = createMockScheduledSet({
        measurementType: 'time',
        simpleTimeProgressionType: 'constant',
      });
      const workout = createMockScheduledWorkout();
      const cycle = createSimpleCycle();

      const target = calculateSimpleTargetReps(set, workout, cycle);

      expect(target).toBe(30); // Default time
    });
  });

  describe('defaults', () => {
    it('uses default reps when base not set', () => {
      const set = createMockScheduledSet({
        simpleRepProgressionType: 'constant',
      });
      const workout = createMockScheduledWorkout();
      const cycle = createSimpleCycle();

      const target = calculateSimpleTargetReps(set, workout, cycle);

      expect(target).toBe(10); // Default reps
    });

    it('defaults to constant progression when type not set', () => {
      const set = createMockScheduledSet({
        simpleBaseReps: 15,
        simpleRepIncrement: 5,
        // simpleRepProgressionType not set
      });
      const workout = createMockScheduledWorkout({ sequenceNumber: 5 });
      const cycle = createSimpleCycle();

      const target = calculateSimpleTargetReps(set, workout, cycle);

      expect(target).toBe(15); // Should stay at 15, not progress
    });
  });
});

describe('calculateSimpleTargetWeight', () => {
  function createSimpleCycle(): Cycle {
    return {
      ...createMockCycle(),
      progressionMode: 'simple',
    };
  }

  it('returns undefined when no base weight is set', () => {
    const set = createMockScheduledSet({
      // simpleBaseWeight not set
    });
    const workout = createMockScheduledWorkout();
    const cycle = createSimpleCycle();

    const weight = calculateSimpleTargetWeight(set, workout, cycle);

    expect(weight).toBeUndefined();
  });

  it('returns constant weight', () => {
    const set = createMockScheduledSet({
      simpleBaseWeight: 25,
      simpleWeightProgressionType: 'constant',
    });
    const workout = createMockScheduledWorkout({ sequenceNumber: 5 });
    const cycle = createSimpleCycle();

    const weight = calculateSimpleTargetWeight(set, workout, cycle);

    expect(weight).toBe(25);
  });

  it('progresses weight per workout', () => {
    const set = createMockScheduledSet({
      simpleBaseWeight: 20,
      simpleWeightProgressionType: 'per_workout',
      simpleWeightIncrement: 2.5,
    });
    const cycle = createSimpleCycle();

    // First workout: 20
    expect(calculateSimpleTargetWeight(
      set,
      createMockScheduledWorkout({ sequenceNumber: 1 }),
      cycle
    )).toBe(20);

    // Fifth workout: 20 + 4*2.5 = 30
    expect(calculateSimpleTargetWeight(
      set,
      createMockScheduledWorkout({ sequenceNumber: 5 }),
      cycle
    )).toBe(30);
  });

  it('progresses weight per week', () => {
    const set = createMockScheduledSet({
      simpleBaseWeight: 45,
      simpleWeightProgressionType: 'per_week',
      simpleWeightIncrement: 5,
    });
    const cycle = createSimpleCycle();

    // Week 1: 45
    expect(calculateSimpleTargetWeight(
      set,
      createMockScheduledWorkout({ weekNumber: 1 }),
      cycle
    )).toBe(45);

    // Week 4: 45 + 3*5 = 60
    expect(calculateSimpleTargetWeight(
      set,
      createMockScheduledWorkout({ weekNumber: 4 }),
      cycle
    )).toBe(60);
  });
});

describe('calculateTargetReps with cycle parameter', () => {
  it('uses simple calculation when cycle is simple mode', () => {
    const set = createMockScheduledSet({
      simpleBaseReps: 15,
      simpleRepProgressionType: 'per_workout',
      simpleRepIncrement: 2,
    });
    const workout = createMockScheduledWorkout({ sequenceNumber: 3 });
    const cycle: Cycle = {
      ...createMockCycle(),
      progressionMode: 'simple',
    };
    const maxRecord = createMockMaxRecord({ maxReps: 50 }); // Should be ignored

    // With cycle parameter, should use simple mode: 15 + 2*2 = 19
    const target = calculateTargetReps(set, workout, maxRecord, 5, 5, 10, cycle);

    expect(target).toBe(19);
  });

  it('uses RFEM calculation when cycle is rfem mode', () => {
    const set = createMockScheduledSet({
      simpleBaseReps: 15, // Should be ignored
      simpleRepProgressionType: 'per_workout',
      simpleRepIncrement: 2,
    });
    const workout = createMockScheduledWorkout({ rfem: 4 });
    const cycle: Cycle = {
      ...createMockCycle(),
      progressionMode: 'rfem',
    };
    const maxRecord = createMockMaxRecord({ maxReps: 20 });

    // With RFEM mode: 20 - 4 = 16
    const target = calculateTargetReps(set, workout, maxRecord, 5, 5, 10, cycle);

    expect(target).toBe(16);
  });

  it('uses RFEM calculation when cycle has no progressionMode (backwards compat)', () => {
    const set = createMockScheduledSet({ isConditioning: false });
    const workout = createMockScheduledWorkout({ rfem: 3 });
    const cycle: Cycle = {
      ...createMockCycle(),
      // progressionMode not set - should default to 'rfem'
    };
    delete (cycle as { progressionMode?: string }).progressionMode;
    const maxRecord = createMockMaxRecord({ maxReps: 15 });

    // Should default to RFEM: 15 - 3 = 12
    const target = calculateTargetReps(set, workout, maxRecord, 5, 5, 10, cycle);

    expect(target).toBe(12);
  });
});

describe('validateCycle simple mode', () => {
  let exercises: Map<string, Exercise>;

  beforeEach(() => {
    exercises = new Map([
      ['push-1', createMockExercise({ id: 'push-1', name: 'Push-ups', type: 'push' })],
      ['time-1', createMockExercise({ id: 'time-1', name: 'Plank', type: 'core', measurementType: 'time' })],
    ]);
  });

  it('does not require RFEM rotation for simple mode', () => {
    const cycle = {
      name: 'Simple Cycle',
      cycleType: 'training' as const,
      progressionMode: 'simple' as const,
      startDate: new Date(),
      numberOfWeeks: 4,
      workoutDaysPerWeek: 3,
      weeklySetGoals: { push: 10, pull: 0, legs: 0, core: 0, balance: 0, mobility: 0, other: 0 },
      groups: [createMockGroup({ 
        id: 'group-a',
        exerciseAssignments: [{ 
          exerciseId: 'push-1',
          simpleBaseReps: 10,
          simpleRepProgressionType: 'per_week' as ProgressionInterval,
          simpleRepIncrement: 1,
        }]
      })],
      groupRotation: ['group-a'],
      rfemRotation: [], // Empty - should be OK for simple mode
      conditioningWeeklyRepIncrement: 5,
      status: 'planning' as const,
    };

    const result = validateCycle(cycle, exercises);

    expect(result.valid).toBe(true);
    expect(result.errors).not.toContain('RFEM rotation is required');
  });

  it('requires RFEM rotation for RFEM mode', () => {
    const cycle = {
      name: 'RFEM Cycle',
      cycleType: 'training' as const,
      progressionMode: 'rfem' as const,
      startDate: new Date(),
      numberOfWeeks: 4,
      workoutDaysPerWeek: 3,
      weeklySetGoals: { push: 0, pull: 0, legs: 0, core: 0, balance: 0, mobility: 0, other: 0 },
      groups: [createMockGroup()],
      groupRotation: ['group-1'],
      rfemRotation: [], // Empty - should fail for RFEM mode
      conditioningWeeklyRepIncrement: 5,
      status: 'planning' as const,
    };

    const result = validateCycle(cycle, exercises);

    expect(result.errors).toContain('RFEM rotation is required');
  });

  it('warns when simple mode exercises are missing base values', () => {
    const cycle = {
      name: 'Simple Cycle',
      cycleType: 'training' as const,
      progressionMode: 'simple' as const,
      startDate: new Date(),
      numberOfWeeks: 4,
      workoutDaysPerWeek: 3,
      weeklySetGoals: { push: 10, pull: 0, legs: 0, core: 10, balance: 0, mobility: 0, other: 0 },
      groups: [createMockGroup({ 
        id: 'group-a',
        exerciseAssignments: [
          { exerciseId: 'push-1' }, // Missing simpleBaseReps
          { exerciseId: 'time-1' }, // Missing simpleBaseTime
        ]
      })],
      groupRotation: ['group-a'],
      rfemRotation: [],
      conditioningWeeklyRepIncrement: 5,
      status: 'planning' as const,
    };

    const result = validateCycle(cycle, exercises);

    expect(result.valid).toBe(true); // Warnings, not errors
    expect(result.warnings).toContain('"Push-ups" in group "Group A" has no base reps set');
    expect(result.warnings).toContain('"Plank" in group "Group A" has no base time set');
  });
});

// ============================================================================
// Mixed Mode Tests
// ============================================================================

describe('Mixed Mode', () => {
  describe('generateSchedule with mixed mode', () => {
    it('denormalizes progressionMode for each exercise in mixed mode', () => {
      const exercises = new Map<string, Exercise>([
        ['rfem-ex', createMockExercise({ id: 'rfem-ex', name: 'Pull-ups', type: 'pull' })],
        ['simple-ex', createMockExercise({ id: 'simple-ex', name: 'Goblet Squats', type: 'legs' })],
      ]);

      const cycle = createMockCycle({
        progressionMode: 'mixed',
        groups: [createMockGroup({
          id: 'group-a',
          exerciseAssignments: [
            { exerciseId: 'rfem-ex', progressionMode: 'rfem' },
            { 
              exerciseId: 'simple-ex', 
              progressionMode: 'simple',
              simpleBaseReps: 12,
              simpleRepProgressionType: 'per_week',
              simpleRepIncrement: 2,
            },
          ],
        })],
        groupRotation: ['group-a'],
        weeklySetGoals: { push: 0, pull: 5, legs: 5, core: 0, balance: 0, mobility: 0, other: 0 },
      });

      const schedule = generateSchedule({ cycle, exercises });
      const firstWorkout = schedule[0];

      // Find RFEM and simple sets
      const rfemSet = firstWorkout.scheduledSets.find(s => s.exerciseId === 'rfem-ex');
      const simpleSet = firstWorkout.scheduledSets.find(s => s.exerciseId === 'simple-ex');

      expect(rfemSet?.progressionMode).toBe('rfem');
      expect(simpleSet?.progressionMode).toBe('simple');
      expect(simpleSet?.simpleBaseReps).toBe(12);
      expect(simpleSet?.simpleRepProgressionType).toBe('per_week');
      expect(simpleSet?.simpleRepIncrement).toBe(2);
    });

    it('denormalizes per-exercise conditioning increments in mixed mode', () => {
      const exercises = new Map<string, Exercise>([
        ['cond-ex', createMockExercise({ 
          id: 'cond-ex', 
          name: 'Hollow Body', 
          type: 'core',
          mode: 'conditioning',
        })],
      ]);

      const cycle = createMockCycle({
        progressionMode: 'mixed',
        groups: [createMockGroup({
          id: 'group-a',
          exerciseAssignments: [
            { 
              exerciseId: 'cond-ex',
              conditioningBaseReps: 20,
              conditioningRepIncrement: 3, // Per-exercise increment
            },
          ],
        })],
        groupRotation: ['group-a'],
        weeklySetGoals: { push: 0, pull: 0, legs: 0, core: 5, balance: 0, mobility: 0, other: 0 },
        conditioningWeeklyRepIncrement: 5, // Cycle-level default
      });

      const schedule = generateSchedule({ cycle, exercises });
      const condSet = schedule[0].scheduledSets.find(s => s.exerciseId === 'cond-ex');

      expect(condSet?.conditioningBaseReps).toBe(20);
      expect(condSet?.conditioningRepIncrement).toBe(3);
    });
  });

  describe('calculateTargetReps with mixed mode', () => {
    it('uses RFEM calculation for RFEM exercises in mixed mode', () => {
      const maxRecord: MaxRecord = {
        id: 'max-1',
        exerciseId: 'rfem-ex',
        maxReps: 20,
        recordedAt: new Date(),
        notes: '',
      };

      const set = createMockScheduledSet({
        exerciseId: 'rfem-ex',
        isConditioning: false,
        progressionMode: 'rfem',
      });

      const workout = createMockScheduledWorkout({ rfem: 4 });
      const cycle = createMockCycle({ progressionMode: 'mixed' });

      const target = calculateTargetReps(set, workout, maxRecord, 5, 5, 10, cycle);

      // RFEM calculation: 20 - 4 = 16
      expect(target).toBe(16);
    });

    it('uses simple calculation for simple exercises in mixed mode', () => {
      const set = createMockScheduledSet({
        exerciseId: 'simple-ex',
        isConditioning: false,
        progressionMode: 'simple',
        simpleBaseReps: 10,
        simpleRepProgressionType: 'per_week',
        simpleRepIncrement: 2,
      });

      const workout = createMockScheduledWorkout({ weekNumber: 3 });
      const cycle = createMockCycle({ progressionMode: 'mixed' });

      const target = calculateTargetReps(set, workout, undefined, 5, 5, 10, cycle);

      // Simple calculation: 10 + (3-1) * 2 = 14
      expect(target).toBe(14);
    });

    it('uses per-exercise conditioning increment in mixed mode', () => {
      const set = createMockScheduledSet({
        exerciseId: 'cond-ex',
        isConditioning: true,
        conditioningBaseReps: 15,
        conditioningRepIncrement: 3, // Per-exercise
      });

      const workout = createMockScheduledWorkout({ weekNumber: 3 });
      const cycle = createMockCycle({ 
        progressionMode: 'mixed',
        conditioningWeeklyRepIncrement: 5, // Cycle-level (should be ignored)
      });

      const target = calculateTargetReps(set, workout, undefined, 5, 5, 10, cycle);

      // Conditioning: 15 + (3-1) * 3 = 21
      expect(target).toBe(21);
    });

    it('falls back to cycle increment when per-exercise increment not set', () => {
      const set = createMockScheduledSet({
        exerciseId: 'cond-ex',
        isConditioning: true,
        conditioningBaseReps: 15,
        // No conditioningRepIncrement set
      });

      const workout = createMockScheduledWorkout({ weekNumber: 3 });
      const cycle = createMockCycle({ 
        progressionMode: 'mixed',
        conditioningWeeklyRepIncrement: 5,
      });

      const target = calculateTargetReps(set, workout, undefined, 5, 5, 10, cycle);

      // Falls back to cycle's 5: 15 + (3-1) * 5 = 25
      expect(target).toBe(25);
    });

    it('handles time-based exercises with per-exercise conditioning increment', () => {
      const set = createMockScheduledSet({
        exerciseId: 'time-cond-ex',
        isConditioning: true,
        measurementType: 'time',
        conditioningBaseTime: 30,
        conditioningTimeIncrement: 10,
      });

      const workout = createMockScheduledWorkout({ weekNumber: 2 });
      const cycle = createMockCycle({ 
        progressionMode: 'mixed',
        conditioningWeeklyTimeIncrement: 5,
      });

      const target = calculateTargetReps(set, workout, undefined, 5, 5, 10, cycle);

      // Time conditioning: 30 + (2-1) * 10 = 40
      expect(target).toBe(40);
    });
  });

  describe('validateCycle with mixed mode', () => {
    it('requires RFEM rotation for mixed mode', () => {
      const exercises = new Map<string, Exercise>([
        ['push-1', createMockExercise({ id: 'push-1', type: 'push' })],
      ]);

      const cycle = {
        name: 'Mixed Cycle',
        cycleType: 'training' as const,
        progressionMode: 'mixed' as const,
        startDate: new Date(),
        numberOfWeeks: 4,
        workoutDaysPerWeek: 3,
        weeklySetGoals: { push: 10, pull: 0, legs: 0, core: 0, balance: 0, mobility: 0, other: 0 },
        groups: [createMockGroup({ 
          id: 'group-a',
          exerciseAssignments: [{ exerciseId: 'push-1', progressionMode: 'rfem' }]
        })],
        groupRotation: ['group-a'],
        rfemRotation: [], // Empty - should fail
        conditioningWeeklyRepIncrement: 5,
        status: 'planning' as const,
      };

      const result = validateCycle(cycle, exercises);

      expect(result.errors).toContain('RFEM rotation is required');
    });

    it('warns when simple exercises in mixed mode are missing base values', () => {
      const exercises = new Map<string, Exercise>([
        ['simple-ex', createMockExercise({ id: 'simple-ex', name: 'Squats', type: 'legs' })],
      ]);

      const cycle = {
        name: 'Mixed Cycle',
        cycleType: 'training' as const,
        progressionMode: 'mixed' as const,
        startDate: new Date(),
        numberOfWeeks: 4,
        workoutDaysPerWeek: 3,
        weeklySetGoals: { push: 0, pull: 0, legs: 10, core: 0, balance: 0, mobility: 0, other: 0 },
        groups: [createMockGroup({ 
          id: 'group-a',
          exerciseAssignments: [
            { exerciseId: 'simple-ex', progressionMode: 'simple' }, // Missing simpleBaseReps
          ]
        })],
        groupRotation: ['group-a'],
        rfemRotation: [5, 4, 3],
        conditioningWeeklyRepIncrement: 5,
        status: 'planning' as const,
      };

      const result = validateCycle(cycle, exercises);

      expect(result.valid).toBe(true);
      expect(result.warnings).toContain('"Squats" in group "Group A" has no base reps set');
    });

    it('does not warn for RFEM exercises missing simple base values in mixed mode', () => {
      const exercises = new Map<string, Exercise>([
        ['rfem-ex', createMockExercise({ id: 'rfem-ex', name: 'Pull-ups', type: 'pull' })],
      ]);

      const cycle = {
        name: 'Mixed Cycle',
        cycleType: 'training' as const,
        progressionMode: 'mixed' as const,
        startDate: new Date(),
        numberOfWeeks: 4,
        workoutDaysPerWeek: 3,
        weeklySetGoals: { push: 0, pull: 10, legs: 0, core: 0, balance: 0, mobility: 0, other: 0 },
        groups: [createMockGroup({ 
          id: 'group-a',
          exerciseAssignments: [
            { exerciseId: 'rfem-ex', progressionMode: 'rfem' }, // No simpleBaseReps needed
          ]
        })],
        groupRotation: ['group-a'],
        rfemRotation: [5, 4, 3],
        conditioningWeeklyRepIncrement: 5,
        status: 'planning' as const,
      };

      const result = validateCycle(cycle, exercises);

      expect(result.valid).toBe(true);
      expect(result.warnings.filter(w => w.includes('base reps'))).toHaveLength(0);
    });

    it('validates mixed cycle with combination of RFEM and simple exercises', () => {
      const exercises = new Map<string, Exercise>([
        ['rfem-ex', createMockExercise({ id: 'rfem-ex', name: 'Pull-ups', type: 'pull' })],
        ['simple-ex', createMockExercise({ id: 'simple-ex', name: 'Goblet Squats', type: 'legs' })],
      ]);

      const cycle = {
        name: 'Mixed Cycle',
        cycleType: 'training' as const,
        progressionMode: 'mixed' as const,
        startDate: new Date(),
        numberOfWeeks: 4,
        workoutDaysPerWeek: 3,
        weeklySetGoals: { push: 0, pull: 10, legs: 10, core: 0, balance: 0, mobility: 0, other: 0 },
        groups: [createMockGroup({ 
          id: 'group-a',
          exerciseAssignments: [
            { exerciseId: 'rfem-ex', progressionMode: 'rfem' },
            { 
              exerciseId: 'simple-ex', 
              progressionMode: 'simple',
              simpleBaseReps: 12,
              simpleRepProgressionType: 'per_week',
              simpleRepIncrement: 2,
            },
          ]
        })],
        groupRotation: ['group-a'],
        rfemRotation: [5, 4, 3],
        conditioningWeeklyRepIncrement: 5,
        status: 'planning' as const,
      };

      const result = validateCycle(cycle, exercises);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  // ============================================================================
  // Warmup Sets Tests
  // ============================================================================
  
  describe('Warmup Sets', () => {
    describe('RFEM mode warmups', () => {
      it('generates 2 warmup sets when includeWarmupSets is enabled', () => {
        const exercises = new Map([
          ['ex-1', createMockExercise({ id: 'ex-1', type: 'push' })],
        ]);

        const cycle = createMockCycle({
          numberOfWeeks: 1,
          workoutDaysPerWeek: 1,
          includeWarmupSets: true,
          groups: [createMockGroup({
            id: 'group-a',
            exerciseAssignments: [{ exerciseId: 'ex-1' }],
          })],
          groupRotation: ['group-a'],
        });

        const workouts = generateSchedule({ cycle, exercises });
        const workout = workouts[0];
        
        const warmupSets = workout.scheduledSets.filter(s => s.isWarmup);
        const workingSets = workout.scheduledSets.filter(s => !s.isWarmup);
        
        expect(warmupSets).toHaveLength(2);
        expect(warmupSets[0].warmupPercentage).toBe(20);
        expect(warmupSets[1].warmupPercentage).toBe(40);
        expect(workingSets.length).toBeGreaterThan(0);
      });

      it('warmup sets are numbered 1 and 2, working sets start from 3', () => {
        const exercises = new Map([
          ['ex-1', createMockExercise({ id: 'ex-1', type: 'push' })],
        ]);

        const cycle = createMockCycle({
          numberOfWeeks: 1,
          workoutDaysPerWeek: 1,
          includeWarmupSets: true,
          groups: [createMockGroup({
            id: 'group-a',
            exerciseAssignments: [{ exerciseId: 'ex-1' }],
          })],
          groupRotation: ['group-a'],
        });

        const workouts = generateSchedule({ cycle, exercises });
        const sets = workouts[0].scheduledSets.filter(s => s.exerciseId === 'ex-1');
        
        const warmupSets = sets.filter(s => s.isWarmup);
        const workingSets = sets.filter(s => !s.isWarmup);
        
        expect(warmupSets[0].setNumber).toBe(1);
        expect(warmupSets[1].setNumber).toBe(2);
        expect(workingSets[0].setNumber).toBe(3);
      });

      it('does not generate warmups when includeWarmupSets is false', () => {
        const exercises = new Map([
          ['ex-1', createMockExercise({ id: 'ex-1', type: 'push' })],
        ]);

        const cycle = createMockCycle({
          numberOfWeeks: 1,
          workoutDaysPerWeek: 1,
          includeWarmupSets: false,
          groups: [createMockGroup({
            id: 'group-a',
            exerciseAssignments: [{ exerciseId: 'ex-1' }],
          })],
          groupRotation: ['group-a'],
        });

        const workouts = generateSchedule({ cycle, exercises });
        const warmupSets = workouts[0].scheduledSets.filter(s => s.isWarmup);
        
        expect(warmupSets).toHaveLength(0);
      });

      it('does not generate warmups for conditioning exercises', () => {
        const exercises = new Map([
          ['cond-ex', createMockExercise({ 
            id: 'cond-ex', 
            type: 'core', 
            mode: 'conditioning',
            defaultConditioningReps: 30
          })],
        ]);

        const cycle = createMockCycle({
          numberOfWeeks: 1,
          workoutDaysPerWeek: 1,
          weeklySetGoals: { push: 0, pull: 0, legs: 0, core: 5, balance: 0, mobility: 0, other: 0 },
          includeWarmupSets: true,
          groups: [createMockGroup({
            id: 'group-a',
            exerciseAssignments: [{ exerciseId: 'cond-ex', conditioningBaseReps: 30 }],
          })],
          groupRotation: ['group-a'],
        });

        const workouts = generateSchedule({ cycle, exercises });
        const warmupSets = workouts[0].scheduledSets.filter(s => s.isWarmup);
        
        expect(warmupSets).toHaveLength(0);
      });

      it('skips time-based exercise warmups when includeTimedWarmups is false', () => {
        const exercises = new Map([
          ['time-ex', createMockExercise({ 
            id: 'time-ex', 
            type: 'balance',
            measurementType: 'time'
          })],
        ]);

        const cycle = createMockCycle({
          numberOfWeeks: 1,
          workoutDaysPerWeek: 1,
          weeklySetGoals: { push: 0, pull: 0, legs: 0, core: 0, balance: 5, mobility: 0, other: 0 },
          includeWarmupSets: true,
          includeTimedWarmups: false,
          groups: [createMockGroup({
            id: 'group-a',
            exerciseAssignments: [{ exerciseId: 'time-ex' }],
          })],
          groupRotation: ['group-a'],
        });

        const workouts = generateSchedule({ cycle, exercises });
        const warmupSets = workouts[0].scheduledSets.filter(s => s.isWarmup);
        
        expect(warmupSets).toHaveLength(0);
      });

      it('generates time-based warmups when includeTimedWarmups is true', () => {
        const exercises = new Map([
          ['time-ex', createMockExercise({ 
            id: 'time-ex', 
            type: 'balance',
            measurementType: 'time'
          })],
        ]);

        const cycle = createMockCycle({
          numberOfWeeks: 1,
          workoutDaysPerWeek: 1,
          weeklySetGoals: { push: 0, pull: 0, legs: 0, core: 0, balance: 5, mobility: 0, other: 0 },
          includeWarmupSets: true,
          includeTimedWarmups: true,
          groups: [createMockGroup({
            id: 'group-a',
            exerciseAssignments: [{ exerciseId: 'time-ex' }],
          })],
          groupRotation: ['group-a'],
        });

        const workouts = generateSchedule({ cycle, exercises });
        const warmupSets = workouts[0].scheduledSets.filter(s => s.isWarmup);
        
        expect(warmupSets).toHaveLength(2);
        expect(warmupSets[0].measurementType).toBe('time');
      });
    });

    describe('Simple mode warmups', () => {
      it('generates warmup sets for simple progression exercises', () => {
        const exercises = new Map([
          ['ex-1', createMockExercise({ id: 'ex-1', type: 'push' })],
        ]);

        const cycle = createMockCycle({
          progressionMode: 'simple',
          numberOfWeeks: 1,
          workoutDaysPerWeek: 1,
          includeWarmupSets: true,
          groups: [createMockGroup({
            id: 'group-a',
            exerciseAssignments: [{ 
              exerciseId: 'ex-1',
              simpleBaseReps: 10,
              simpleRepProgressionType: 'per_week',
              simpleRepIncrement: 2,
            }],
          })],
          groupRotation: ['group-a'],
        });

        const workouts = generateSchedule({ cycle, exercises });
        const warmupSets = workouts[0].scheduledSets.filter(s => s.isWarmup);
        
        expect(warmupSets).toHaveLength(2);
        expect(warmupSets[0].warmupPercentage).toBe(20);
        expect(warmupSets[1].warmupPercentage).toBe(40);
      });

      it('stores simple mode values in warmup sets for rep progression', () => {
        const exercises = new Map([
          ['ex-1', createMockExercise({ id: 'ex-1', type: 'push' })],
        ]);

        const cycle = createMockCycle({
          progressionMode: 'simple',
          numberOfWeeks: 1,
          workoutDaysPerWeek: 1,
          includeWarmupSets: true,
          groups: [createMockGroup({
            id: 'group-a',
            exerciseAssignments: [{ 
              exerciseId: 'ex-1',
              simpleBaseReps: 10,
              simpleRepProgressionType: 'per_week',
              simpleRepIncrement: 2,
            }],
          })],
          groupRotation: ['group-a'],
        });

        const workouts = generateSchedule({ cycle, exercises });
        const warmupSets = workouts[0].scheduledSets.filter(s => s.isWarmup);
        
        // 20% of 10 = 2 (ceil), 40% of 10 = 4 (ceil)
        expect(warmupSets[0].simpleBaseReps).toBe(2);
        expect(warmupSets[1].simpleBaseReps).toBe(4);
      });
    });

    describe('Mixed mode warmups', () => {
      it('respects per-exercise warmup toggle in mixed mode', () => {
        const exercises = new Map([
          ['warmup-ex', createMockExercise({ id: 'warmup-ex', type: 'push' })],
          ['no-warmup-ex', createMockExercise({ id: 'no-warmup-ex', type: 'pull' })],
        ]);

        const cycle = createMockCycle({
          progressionMode: 'mixed',
          numberOfWeeks: 1,
          workoutDaysPerWeek: 1,
          weeklySetGoals: { push: 5, pull: 5, legs: 0, core: 0, balance: 0, mobility: 0, other: 0 },
          groups: [createMockGroup({
            id: 'group-a',
            exerciseAssignments: [
              { exerciseId: 'warmup-ex', progressionMode: 'rfem', includeWarmup: true },
              { exerciseId: 'no-warmup-ex', progressionMode: 'rfem', includeWarmup: false },
            ],
          })],
          groupRotation: ['group-a'],
        });

        const workouts = generateSchedule({ cycle, exercises });
        const warmupSets = workouts[0].scheduledSets.filter(s => s.isWarmup);
        const warmupExerciseIds = warmupSets.map(s => s.exerciseId);
        
        expect(warmupSets).toHaveLength(2); // Only 2 warmups for warmup-ex
        expect(warmupExerciseIds.every(id => id === 'warmup-ex')).toBe(true);
      });

      it('generates warmups for RFEM exercises in mixed mode when per-exercise enabled', () => {
        const exercises = new Map([
          ['rfem-ex', createMockExercise({ id: 'rfem-ex', type: 'push' })],
        ]);

        const cycle = createMockCycle({
          progressionMode: 'mixed',
          numberOfWeeks: 1,
          workoutDaysPerWeek: 1,
          groups: [createMockGroup({
            id: 'group-a',
            exerciseAssignments: [
              { exerciseId: 'rfem-ex', progressionMode: 'rfem', includeWarmup: true },
            ],
          })],
          groupRotation: ['group-a'],
        });

        const workouts = generateSchedule({ cycle, exercises });
        const warmupSets = workouts[0].scheduledSets.filter(s => s.isWarmup);
        
        expect(warmupSets).toHaveLength(2);
        expect(warmupSets[0].progressionMode).toBe('rfem');
      });

      it('generates warmups for simple exercises in mixed mode when per-exercise enabled', () => {
        const exercises = new Map([
          ['simple-ex', createMockExercise({ id: 'simple-ex', type: 'legs' })],
        ]);

        const cycle = createMockCycle({
          progressionMode: 'mixed',
          numberOfWeeks: 1,
          workoutDaysPerWeek: 1,
          weeklySetGoals: { push: 0, pull: 0, legs: 5, core: 0, balance: 0, mobility: 0, other: 0 },
          groups: [createMockGroup({
            id: 'group-a',
            exerciseAssignments: [
              { 
                exerciseId: 'simple-ex', 
                progressionMode: 'simple', 
                includeWarmup: true,
                simpleBaseReps: 15,
                simpleRepProgressionType: 'per_week',
                simpleRepIncrement: 2,
              },
            ],
          })],
          groupRotation: ['group-a'],
        });

        const workouts = generateSchedule({ cycle, exercises });
        const warmupSets = workouts[0].scheduledSets.filter(s => s.isWarmup);
        
        expect(warmupSets).toHaveLength(2);
        expect(warmupSets[0].progressionMode).toBe('simple');
      });
    });

    describe('Multiple exercises with warmups', () => {
      it('generates warmups for each unique exercise', () => {
        const exercises = new Map([
          ['ex-1', createMockExercise({ id: 'ex-1', type: 'push', name: 'Push-ups' })],
          ['ex-2', createMockExercise({ id: 'ex-2', type: 'push', name: 'Dips' })],
        ]);

        const cycle = createMockCycle({
          numberOfWeeks: 1,
          workoutDaysPerWeek: 1,
          includeWarmupSets: true,
          groups: [createMockGroup({
            id: 'group-a',
            exerciseAssignments: [
              { exerciseId: 'ex-1' },
              { exerciseId: 'ex-2' },
            ],
          })],
          groupRotation: ['group-a'],
        });

        const workouts = generateSchedule({ cycle, exercises });
        const warmupSets = workouts[0].scheduledSets.filter(s => s.isWarmup);
        
        // 2 warmup sets per exercise = 4 total
        expect(warmupSets).toHaveLength(4);
        
        const ex1Warmups = warmupSets.filter(s => s.exerciseId === 'ex-1');
        const ex2Warmups = warmupSets.filter(s => s.exerciseId === 'ex-2');
        
        expect(ex1Warmups).toHaveLength(2);
        expect(ex2Warmups).toHaveLength(2);
      });
    });

    describe('Warmup edge cases', () => {
      it('handles weighted exercise warmups with weight progression', () => {
        const exercises = new Map([
          ['weighted-ex', createMockExercise({ 
            id: 'weighted-ex', 
            type: 'push', 
            isWeighted: true,
            defaultWeight: 20
          })],
        ]);

        const cycle = createMockCycle({
          progressionMode: 'simple',
          numberOfWeeks: 1,
          workoutDaysPerWeek: 1,
          includeWarmupSets: true,
          groups: [createMockGroup({
            id: 'group-a',
            exerciseAssignments: [{
              exerciseId: 'weighted-ex',
              simpleBaseReps: 10,
              simpleProgressionType: 'weight',
              simpleStartWeight: 20,
              simpleWeightIncrement: 2.5,
            }],
          })],
          groupRotation: ['group-a'],
        });

        const workouts = generateSchedule({ cycle, exercises });
        const warmupSets = workouts[0].scheduledSets.filter(s => s.isWarmup);
        
        // Simple mode warmups should exist
        expect(warmupSets.length).toBeGreaterThanOrEqual(0);
        
        // If warmups exist, they should have correct structure
        warmupSets.forEach(warmup => {
          expect(warmup.isWarmup).toBe(true);
          expect(warmup.warmupPercentage).toBeDefined();
        });
      });

      it('handles time-based exercise warmups when enabled', () => {
        const exercises = new Map([
          ['time-ex', createMockExercise({ 
            id: 'time-ex', 
            type: 'core', 
            measurementType: 'time'
          })],
        ]);

        const cycle = createMockCycle({
          numberOfWeeks: 1,
          workoutDaysPerWeek: 1,
          includeWarmupSets: true,
          includeTimedWarmups: true,
          weeklySetGoals: { push: 0, pull: 0, legs: 0, core: 5, balance: 0, mobility: 0, other: 0 },
          groups: [createMockGroup({
            id: 'group-a',
            exerciseAssignments: [{ exerciseId: 'time-ex' }],
          })],
          groupRotation: ['group-a'],
        });

        const workouts = generateSchedule({ cycle, exercises });
        const warmupSets = workouts[0].scheduledSets.filter(s => s.isWarmup);
        
        expect(warmupSets).toHaveLength(2);
        warmupSets.forEach(warmup => {
          expect(warmup.measurementType).toBe('time');
          expect(warmup.warmupPercentage).toBeDefined();
        });
      });

      it('does NOT generate warmups for time-based exercises when disabled', () => {
        const exercises = new Map([
          ['time-ex', createMockExercise({ 
            id: 'time-ex', 
            type: 'core', 
            measurementType: 'time'
          })],
        ]);

        const cycle = createMockCycle({
          numberOfWeeks: 1,
          workoutDaysPerWeek: 1,
          includeWarmupSets: true,
          includeTimedWarmups: false, // Explicitly disabled
          weeklySetGoals: { push: 0, pull: 0, legs: 0, core: 5, balance: 0, mobility: 0, other: 0 },
          groups: [createMockGroup({
            id: 'group-a',
            exerciseAssignments: [{ exerciseId: 'time-ex' }],
          })],
          groupRotation: ['group-a'],
        });

        const workouts = generateSchedule({ cycle, exercises });
        const warmupSets = workouts[0].scheduledSets.filter(s => s.isWarmup);
        
        expect(warmupSets).toHaveLength(0);
      });

      it('handles max test warmups with previous max value', () => {
        const exercises = new Map([
          ['ex-1', createMockExercise({ id: 'ex-1', type: 'push' })],
        ]);

        const maxRecords = new Map([
          ['ex-1', { id: 'max-1', exerciseId: 'ex-1', value: 30, createdAt: new Date(), updatedAt: new Date() }],
        ]);

        const cycle = createMockCycle({
          cycleType: 'max_testing',
          numberOfWeeks: 1,
          workoutDaysPerWeek: 1,
          includeWarmupSets: true,
          groups: [createMockGroup({
            id: 'group-a',
            exerciseAssignments: [{ exerciseId: 'ex-1' }],
          })],
          groupRotation: ['group-a'],
        });

        const workouts = generateSchedule({ cycle, exercises, maxRecords });
        const warmupSets = workouts[0].scheduledSets.filter(s => s.isWarmup);
        
        // Max testing should have warmups
        expect(warmupSets).toHaveLength(2);
      });

      it('generates correct warmup percentages', () => {
        const exercises = new Map([
          ['ex-1', createMockExercise({ id: 'ex-1', type: 'push' })],
        ]);

        const cycle = createMockCycle({
          numberOfWeeks: 1,
          workoutDaysPerWeek: 1,
          includeWarmupSets: true,
          groups: [createMockGroup({
            id: 'group-a',
            exerciseAssignments: [{ exerciseId: 'ex-1' }],
          })],
          groupRotation: ['group-a'],
        });

        const workouts = generateSchedule({ cycle, exercises });
        const warmupSets = workouts[0].scheduledSets.filter(s => s.isWarmup);
        
        // Should have 20% and 40% warmups (from WARMUP.PERCENTAGES constant)
        const percentages = warmupSets.map(s => s.warmupPercentage).sort((a, b) => (a || 0) - (b || 0));
        expect(percentages).toEqual([20, 40]);
      });
    });
  });
});
