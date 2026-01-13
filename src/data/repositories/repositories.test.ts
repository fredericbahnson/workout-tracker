import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';

// ============================================================================
// Mock Setup
// ============================================================================

// Mock Dexie database
vi.mock('../db', () => ({
  db: {
    exercises: {
      get: vi.fn(),
      add: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
      toArray: vi.fn(),
      orderBy: vi.fn(() => ({ toArray: vi.fn() })),
      where: vi.fn(() => ({ equals: vi.fn(() => ({ toArray: vi.fn() })) })),
      filter: vi.fn(() => ({ toArray: vi.fn() })),
    },
    maxRecords: {
      get: vi.fn(),
      add: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
      toArray: vi.fn(),
      where: vi.fn(() => ({
        equals: vi.fn(() => ({
          toArray: vi.fn(),
          first: vi.fn(),
          delete: vi.fn(),
        })),
      })),
    },
    completedSets: {
      get: vi.fn(),
      add: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
      toArray: vi.fn(),
      where: vi.fn(() => ({
        equals: vi.fn(() => ({
          toArray: vi.fn(),
          delete: vi.fn(),
        })),
        between: vi.fn(() => ({ toArray: vi.fn() })),
      })),
    },
    cycles: {
      get: vi.fn(),
      add: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
      toArray: vi.fn(),
      where: vi.fn(() => ({
        equals: vi.fn(() => ({
          first: vi.fn(),
          toArray: vi.fn(),
        })),
      })),
    },
    scheduledWorkouts: {
      get: vi.fn(),
      add: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
      toArray: vi.fn(),
      where: vi.fn(() => ({
        equals: vi.fn(() => ({
          toArray: vi.fn(),
          delete: vi.fn(),
        })),
      })),
    },
  },
  generateId: vi.fn(() => 'mock-id-' + Math.random().toString(36).substr(2, 9)),
}));

// Import after mocking
import { db, generateId } from '../db';
import { ExerciseRepo } from './ExerciseRepo';
import { MaxRecordRepo } from './MaxRecordRepo';
import { CycleRepo } from './CycleRepo';
import { CompletedSetRepo } from './CompletedSetRepo';
import type { Exercise, MaxRecord, Cycle, CompletedSet, ScheduledWorkout } from '@/types';

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
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    ...overrides,
  };
}

function createMockMaxRecord(overrides: Partial<MaxRecord> = {}): MaxRecord {
  return {
    id: 'max-1',
    exerciseId: 'ex-1',
    maxReps: 25,
    recordedAt: new Date('2024-01-01'),
    ...overrides,
  };
}

function createMockCycle(overrides: Partial<Cycle> = {}): Cycle {
  return {
    id: 'cycle-1',
    name: 'Test Cycle',
    cycleType: 'training',
    status: 'active',
    progressionMode: 'rfem',
    numberOfWeeks: 4,
    workoutDaysPerWeek: 3,
    setsPerExercise: 3,
    weeklySetGoals: { push: 10, pull: 10, legs: 10, core: 5, balance: 0, mobility: 0, other: 0 },
    groups: [],
    groupRotation: [],
    includeWarmupSets: true,
    includeTimedWarmups: false,
    conditioningWeeklyRepIncrement: 2,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    ...overrides,
  };
}

function createMockCompletedSet(overrides: Partial<CompletedSet> = {}): CompletedSet {
  return {
    id: 'cs-1',
    scheduledSetId: 'ss-1',
    scheduledWorkoutId: 'sw-1',
    exerciseId: 'ex-1',
    targetReps: 15,
    actualReps: 14,
    completedAt: new Date('2024-01-10'),
    notes: '',
    parameters: {},
    ...overrides,
  };
}

function createMockScheduledWorkout(overrides: Partial<ScheduledWorkout> = {}): ScheduledWorkout {
  return {
    id: 'sw-1',
    cycleId: 'cycle-1',
    sequenceNumber: 1,
    weekNumber: 1,
    dayInWeek: 1,
    groupId: 'group-1',
    rfem: 3,
    scheduledSets: [],
    status: 'completed',
    ...overrides,
  };
}

// ============================================================================
// ExerciseRepo Tests
// ============================================================================

describe('ExerciseRepo', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAll', () => {
    it('returns all exercises ordered by name', async () => {
      const exercises = [
        createMockExercise({ id: 'ex-1', name: 'Dips' }),
        createMockExercise({ id: 'ex-2', name: 'Push-ups' }),
      ];

      const mockOrderBy = vi.fn().mockReturnValue({
        toArray: vi.fn().mockResolvedValue(exercises),
      });
      (db.exercises.orderBy as Mock).mockImplementation(mockOrderBy);

      const result = await ExerciseRepo.getAll();

      expect(mockOrderBy).toHaveBeenCalledWith('name');
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Dips');
    });

    it('returns empty array when no exercises exist', async () => {
      const mockOrderBy = vi.fn().mockReturnValue({
        toArray: vi.fn().mockResolvedValue([]),
      });
      (db.exercises.orderBy as Mock).mockImplementation(mockOrderBy);

      const result = await ExerciseRepo.getAll();

      expect(result).toEqual([]);
    });
  });

  describe('getById', () => {
    it('returns exercise when found', async () => {
      const exercise = createMockExercise();
      (db.exercises.get as Mock).mockResolvedValue(exercise);

      const result = await ExerciseRepo.getById('ex-1');

      expect(db.exercises.get).toHaveBeenCalledWith('ex-1');
      expect(result).toEqual(expect.objectContaining({ id: 'ex-1', name: 'Push-ups' }));
    });

    it('returns undefined when not found', async () => {
      (db.exercises.get as Mock).mockResolvedValue(undefined);

      const result = await ExerciseRepo.getById('nonexistent');

      expect(result).toBeUndefined();
    });
  });

  describe('getByType', () => {
    it('returns exercises of specified type', async () => {
      const pushExercises = [
        createMockExercise({ id: 'ex-1', type: 'push' }),
        createMockExercise({ id: 'ex-2', type: 'push', name: 'Dips' }),
      ];

      const mockWhere = vi.fn().mockReturnValue({
        equals: vi.fn().mockReturnValue({
          toArray: vi.fn().mockResolvedValue(pushExercises),
        }),
      });
      (db.exercises.where as Mock).mockImplementation(mockWhere);

      const result = await ExerciseRepo.getByType('push');

      expect(mockWhere).toHaveBeenCalledWith('type');
      expect(result).toHaveLength(2);
    });
  });

  describe('create', () => {
    it('creates exercise with generated id and timestamps', async () => {
      const formData = {
        name: 'New Exercise',
        type: 'pull' as const,
        mode: 'standard' as const,
        measurementType: 'reps' as const,
        notes: '',
        customParameters: [],
      };

      (generateId as Mock).mockReturnValue('new-id');
      (db.exercises.add as Mock).mockResolvedValue(undefined);

      const result = await ExerciseRepo.create(formData);

      expect(generateId).toHaveBeenCalled();
      expect(db.exercises.add).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'new-id',
          name: 'New Exercise',
          type: 'pull',
        })
      );
      expect(result.id).toBe('new-id');
      expect(result.createdAt).toBeDefined();
      expect(result.updatedAt).toBeDefined();
    });
  });

  describe('update', () => {
    it('updates existing exercise', async () => {
      const existing = createMockExercise();
      (db.exercises.get as Mock).mockResolvedValue(existing);
      (db.exercises.put as Mock).mockResolvedValue(undefined);

      const result = await ExerciseRepo.update('ex-1', { name: 'Updated Name' });

      expect(db.exercises.put).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'ex-1',
          name: 'Updated Name',
        })
      );
      expect(result?.name).toBe('Updated Name');
    });

    it('returns undefined when exercise not found', async () => {
      (db.exercises.get as Mock).mockResolvedValue(undefined);

      const result = await ExerciseRepo.update('nonexistent', { name: 'Test' });

      expect(result).toBeUndefined();
      expect(db.exercises.put).not.toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('deletes existing exercise', async () => {
      (db.exercises.get as Mock).mockResolvedValue(createMockExercise());
      (db.exercises.delete as Mock).mockResolvedValue(undefined);

      const result = await ExerciseRepo.delete('ex-1');

      expect(db.exercises.delete).toHaveBeenCalledWith('ex-1');
      expect(result).toBe(true);
    });

    it('returns false when exercise not found', async () => {
      (db.exercises.get as Mock).mockResolvedValue(undefined);

      const result = await ExerciseRepo.delete('nonexistent');

      expect(result).toBe(false);
      expect(db.exercises.delete).not.toHaveBeenCalled();
    });
  });

  describe('search', () => {
    it('searches exercises by name (case-insensitive)', async () => {
      const exercises = [
        createMockExercise({ name: 'Push-ups' }),
        createMockExercise({ id: 'ex-2', name: 'Diamond Push-ups' }),
      ];

      const mockFilter = vi.fn().mockReturnValue({
        toArray: vi.fn().mockResolvedValue(exercises),
      });
      (db.exercises.filter as Mock).mockImplementation(mockFilter);

      const result = await ExerciseRepo.search('push');

      expect(mockFilter).toHaveBeenCalled();
      expect(result).toHaveLength(2);
    });
  });
});

// ============================================================================
// MaxRecordRepo Tests
// ============================================================================

describe('MaxRecordRepo', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAllForExercise', () => {
    it('returns max records for exercise sorted by date descending', async () => {
      const records = [
        createMockMaxRecord({ maxReps: 25, recordedAt: new Date('2024-01-01') }),
        createMockMaxRecord({ id: 'max-2', maxReps: 30, recordedAt: new Date('2024-02-01') }),
      ];

      const mockWhere = vi.fn().mockReturnValue({
        equals: vi.fn().mockReturnValue({
          toArray: vi.fn().mockResolvedValue(records),
        }),
      });
      (db.maxRecords.where as Mock).mockImplementation(mockWhere);

      const result = await MaxRecordRepo.getAllForExercise('ex-1');

      expect(mockWhere).toHaveBeenCalledWith('exerciseId');
      expect(result).toHaveLength(2);
      // Should be sorted descending (newest first)
      expect(result[0].maxReps).toBe(30);
    });
  });

  describe('getLatestForExercise', () => {
    it('returns most recent max record', async () => {
      const records = [
        createMockMaxRecord({ maxReps: 30, recordedAt: new Date('2024-02-01') }),
        createMockMaxRecord({ maxReps: 25, recordedAt: new Date('2024-01-01') }),
      ];

      const mockWhere = vi.fn().mockReturnValue({
        equals: vi.fn().mockReturnValue({
          toArray: vi.fn().mockResolvedValue(records),
        }),
      });
      (db.maxRecords.where as Mock).mockImplementation(mockWhere);

      const result = await MaxRecordRepo.getLatestForExercise('ex-1');

      expect(result?.maxReps).toBe(30);
    });

    it('returns undefined when no records exist', async () => {
      const mockWhere = vi.fn().mockReturnValue({
        equals: vi.fn().mockReturnValue({
          toArray: vi.fn().mockResolvedValue([]),
        }),
      });
      (db.maxRecords.where as Mock).mockImplementation(mockWhere);

      const result = await MaxRecordRepo.getLatestForExercise('ex-1');

      expect(result).toBeUndefined();
    });
  });

  describe('create', () => {
    it('creates rep-based max record with generated id', async () => {
      (generateId as Mock).mockReturnValue('new-max-id');
      (db.maxRecords.add as Mock).mockResolvedValue(undefined);

      const result = await MaxRecordRepo.create('ex-1', 35);

      expect(db.maxRecords.add).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'new-max-id',
          exerciseId: 'ex-1',
          maxReps: 35,
        })
      );
      expect(result.maxReps).toBe(35);
    });

    it('creates time-based max record', async () => {
      (generateId as Mock).mockReturnValue('new-max-id');
      (db.maxRecords.add as Mock).mockResolvedValue(undefined);

      const result = await MaxRecordRepo.create('ex-1', undefined, 60);

      expect(db.maxRecords.add).toHaveBeenCalledWith(
        expect.objectContaining({
          exerciseId: 'ex-1',
          maxTime: 60,
        })
      );
      expect(result.maxTime).toBe(60);
    });
  });

  describe('getLatestForAllExercises', () => {
    it('returns map of latest records per exercise', async () => {
      const records = [
        createMockMaxRecord({
          exerciseId: 'ex-1',
          maxReps: 30,
          recordedAt: new Date('2024-02-01'),
        }),
        createMockMaxRecord({
          id: 'max-2',
          exerciseId: 'ex-1',
          maxReps: 25,
          recordedAt: new Date('2024-01-01'),
        }),
        createMockMaxRecord({
          id: 'max-3',
          exerciseId: 'ex-2',
          maxReps: 15,
          recordedAt: new Date('2024-01-15'),
        }),
      ];

      (db.maxRecords.toArray as Mock).mockResolvedValue(records);

      const result = await MaxRecordRepo.getLatestForAllExercises();

      expect(result).toBeInstanceOf(Map);
      expect(result.get('ex-1')?.maxReps).toBe(30);
      expect(result.get('ex-2')?.maxReps).toBe(15);
    });
  });

  describe('delete', () => {
    it('deletes existing max record', async () => {
      (db.maxRecords.get as Mock).mockResolvedValue(createMockMaxRecord());
      (db.maxRecords.delete as Mock).mockResolvedValue(undefined);

      const result = await MaxRecordRepo.delete('max-1');

      expect(db.maxRecords.delete).toHaveBeenCalledWith('max-1');
      expect(result).toBe(true);
    });

    it('returns false when record not found', async () => {
      (db.maxRecords.get as Mock).mockResolvedValue(undefined);

      const result = await MaxRecordRepo.delete('nonexistent');

      expect(result).toBe(false);
    });
  });
});

// ============================================================================
// CycleRepo Tests
// ============================================================================

describe('CycleRepo', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getActive', () => {
    it('returns active cycle', async () => {
      const activeCycle = createMockCycle({ status: 'active' });

      const mockWhere = vi.fn().mockReturnValue({
        equals: vi.fn().mockReturnValue({
          first: vi.fn().mockResolvedValue(activeCycle),
        }),
      });
      (db.cycles.where as Mock).mockImplementation(mockWhere);

      const result = await CycleRepo.getActive();

      expect(mockWhere).toHaveBeenCalledWith('status');
      expect(result?.status).toBe('active');
    });

    it('returns undefined when no active cycle', async () => {
      const mockWhere = vi.fn().mockReturnValue({
        equals: vi.fn().mockReturnValue({
          first: vi.fn().mockResolvedValue(undefined),
        }),
      });
      (db.cycles.where as Mock).mockImplementation(mockWhere);

      const result = await CycleRepo.getActive();

      expect(result).toBeUndefined();
    });
  });

  describe('getAll', () => {
    it('returns all cycles sorted by startDate descending', async () => {
      const cycles = [
        createMockCycle({ id: 'cycle-1', startDate: new Date('2024-01-01') }),
        createMockCycle({ id: 'cycle-2', startDate: new Date('2024-02-01') }),
      ];

      (db.cycles.toArray as Mock).mockResolvedValue(cycles);

      const result = await CycleRepo.getAll();

      expect(result).toHaveLength(2);
      // Should be sorted descending (newest first)
      expect(result[0].id).toBe('cycle-2');
    });
  });

  describe('create', () => {
    it('creates cycle with generated id and timestamps', async () => {
      const cycleData = {
        name: 'New Cycle',
        cycleType: 'training' as const,
        status: 'active' as const,
        progressionMode: 'rfem' as const,
        numberOfWeeks: 4,
        workoutDaysPerWeek: 3,
        setsPerExercise: 3,
        weeklySetGoals: {
          push: 10,
          pull: 10,
          legs: 10,
          core: 5,
          balance: 0,
          mobility: 0,
          other: 0,
        },
        groups: [],
        groupRotation: [],
        includeWarmupSets: true,
        includeTimedWarmups: false,
        conditioningWeeklyRepIncrement: 2,
      };

      (generateId as Mock).mockReturnValue('new-cycle-id');
      (db.cycles.add as Mock).mockResolvedValue(undefined);

      const result = await CycleRepo.create(cycleData);

      expect(result.id).toBe('new-cycle-id');
      expect(result.name).toBe('New Cycle');
      expect(result.createdAt).toBeDefined();
    });
  });

  describe('update', () => {
    it('updates existing cycle', async () => {
      const existing = createMockCycle();
      (db.cycles.get as Mock).mockResolvedValue(existing);

      // Mock getActive for setActive call path
      const mockWhere = vi.fn().mockReturnValue({
        equals: vi.fn().mockReturnValue({
          first: vi.fn().mockResolvedValue(existing),
        }),
      });
      (db.cycles.where as Mock).mockImplementation(mockWhere);
      (db.cycles.put as Mock).mockResolvedValue(undefined);

      const result = await CycleRepo.update('cycle-1', { name: 'Updated Cycle' });

      expect(db.cycles.put).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Updated Cycle',
        })
      );
      expect(result?.name).toBe('Updated Cycle');
    });
  });

  describe('delete', () => {
    it('deletes existing cycle', async () => {
      (db.cycles.get as Mock).mockResolvedValue(createMockCycle());
      (db.cycles.delete as Mock).mockResolvedValue(undefined);

      const result = await CycleRepo.delete('cycle-1');

      expect(db.cycles.delete).toHaveBeenCalledWith('cycle-1');
      expect(result).toBe(true);
    });

    it('returns false when cycle not found', async () => {
      (db.cycles.get as Mock).mockResolvedValue(undefined);

      const result = await CycleRepo.delete('nonexistent');

      expect(result).toBe(false);
    });
  });

  describe('createGroup', () => {
    it('creates group with generated id', () => {
      (generateId as Mock).mockReturnValue('new-group-id');

      const result = CycleRepo.createGroup('Group A', []);

      expect(result.id).toBe('new-group-id');
      expect(result.name).toBe('Group A');
      expect(result.exerciseAssignments).toEqual([]);
    });
  });
});

// ============================================================================
// CompletedSetRepo Tests
// ============================================================================

describe('CompletedSetRepo', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getWorkingSetHistory', () => {
    it('returns empty array when no sets exist', async () => {
      const mockWhere = vi.fn().mockReturnValue({
        equals: vi.fn().mockReturnValue({
          toArray: vi.fn().mockResolvedValue([]),
        }),
      });
      (db.completedSets.where as Mock).mockImplementation(mockWhere);
      (db.scheduledWorkouts.toArray as Mock).mockResolvedValue([]);

      const result = await CompletedSetRepo.getWorkingSetHistory('ex-1');

      expect(result).toEqual([]);
    });

    it('excludes warmup sets from history', async () => {
      const completedSets = [
        createMockCompletedSet({
          id: 'cs-1',
          scheduledSetId: 'warmup-set-1',
          actualReps: 5,
          completedAt: new Date('2024-01-10T10:00:00'),
        }),
        createMockCompletedSet({
          id: 'cs-2',
          scheduledSetId: 'working-set-1',
          actualReps: 15,
          completedAt: new Date('2024-01-10T10:05:00'),
        }),
      ];

      const scheduledWorkout = createMockScheduledWorkout({
        scheduledSets: [
          {
            id: 'warmup-set-1',
            exerciseId: 'ex-1',
            exerciseType: 'push',
            isConditioning: false,
            setNumber: 1,
            isWarmup: true,
          },
          {
            id: 'working-set-1',
            exerciseId: 'ex-1',
            exerciseType: 'push',
            isConditioning: false,
            setNumber: 2,
            isWarmup: false,
          },
        ],
      });

      const mockWhere = vi.fn().mockReturnValue({
        equals: vi.fn().mockReturnValue({
          toArray: vi.fn().mockResolvedValue(completedSets),
        }),
      });
      (db.completedSets.where as Mock).mockImplementation(mockWhere);
      (db.scheduledWorkouts.toArray as Mock).mockResolvedValue([scheduledWorkout]);

      const result = await CompletedSetRepo.getWorkingSetHistory('ex-1');

      expect(result).toHaveLength(1);
      expect(result[0].sets).toHaveLength(1);
      expect(result[0].sets[0].actualReps).toBe(15);
    });

    it('includes ad-hoc sets (no scheduledSetId)', async () => {
      const completedSets = [
        createMockCompletedSet({
          id: 'cs-1',
          scheduledSetId: null,
          actualReps: 12,
          completedAt: new Date('2024-01-10T10:00:00'),
        }),
      ];

      const mockWhere = vi.fn().mockReturnValue({
        equals: vi.fn().mockReturnValue({
          toArray: vi.fn().mockResolvedValue(completedSets),
        }),
      });
      (db.completedSets.where as Mock).mockImplementation(mockWhere);
      (db.scheduledWorkouts.toArray as Mock).mockResolvedValue([]);

      const result = await CompletedSetRepo.getWorkingSetHistory('ex-1');

      expect(result).toHaveLength(1);
      expect(result[0].sets).toHaveLength(1);
      expect(result[0].sets[0].actualReps).toBe(12);
    });

    it('groups sets by same calendar day', async () => {
      const completedSets = [
        createMockCompletedSet({
          id: 'cs-1',
          scheduledSetId: null,
          actualReps: 15,
          completedAt: new Date('2024-01-10T10:00:00'),
        }),
        createMockCompletedSet({
          id: 'cs-2',
          scheduledSetId: null,
          actualReps: 14,
          completedAt: new Date('2024-01-10T10:05:00'),
        }),
        createMockCompletedSet({
          id: 'cs-3',
          scheduledSetId: null,
          actualReps: 12,
          completedAt: new Date('2024-01-08T09:00:00'),
        }),
      ];

      const mockWhere = vi.fn().mockReturnValue({
        equals: vi.fn().mockReturnValue({
          toArray: vi.fn().mockResolvedValue(completedSets),
        }),
      });
      (db.completedSets.where as Mock).mockImplementation(mockWhere);
      (db.scheduledWorkouts.toArray as Mock).mockResolvedValue([]);

      const result = await CompletedSetRepo.getWorkingSetHistory('ex-1');

      expect(result).toHaveLength(2);
      // First session (Jan 10) has 2 sets
      expect(result[0].sets).toHaveLength(2);
      // Second session (Jan 8) has 1 set
      expect(result[1].sets).toHaveLength(1);
    });

    it('sorts sessions by date descending (newest first)', async () => {
      const completedSets = [
        createMockCompletedSet({
          id: 'cs-1',
          scheduledSetId: null,
          actualReps: 10,
          completedAt: new Date('2024-01-05T10:00:00'),
        }),
        createMockCompletedSet({
          id: 'cs-2',
          scheduledSetId: null,
          actualReps: 15,
          completedAt: new Date('2024-01-10T10:00:00'),
        }),
        createMockCompletedSet({
          id: 'cs-3',
          scheduledSetId: null,
          actualReps: 12,
          completedAt: new Date('2024-01-08T10:00:00'),
        }),
      ];

      const mockWhere = vi.fn().mockReturnValue({
        equals: vi.fn().mockReturnValue({
          toArray: vi.fn().mockResolvedValue(completedSets),
        }),
      });
      (db.completedSets.where as Mock).mockImplementation(mockWhere);
      (db.scheduledWorkouts.toArray as Mock).mockResolvedValue([]);

      const result = await CompletedSetRepo.getWorkingSetHistory('ex-1');

      expect(result).toHaveLength(3);
      // Newest first
      expect(result[0].sets[0].actualReps).toBe(15); // Jan 10
      expect(result[1].sets[0].actualReps).toBe(12); // Jan 8
      expect(result[2].sets[0].actualReps).toBe(10); // Jan 5
    });

    it('includes weight when present', async () => {
      const completedSets = [
        createMockCompletedSet({
          id: 'cs-1',
          scheduledSetId: null,
          actualReps: 15,
          weight: 25,
          completedAt: new Date('2024-01-10T10:00:00'),
        }),
      ];

      const mockWhere = vi.fn().mockReturnValue({
        equals: vi.fn().mockReturnValue({
          toArray: vi.fn().mockResolvedValue(completedSets),
        }),
      });
      (db.completedSets.where as Mock).mockImplementation(mockWhere);
      (db.scheduledWorkouts.toArray as Mock).mockResolvedValue([]);

      const result = await CompletedSetRepo.getWorkingSetHistory('ex-1');

      expect(result[0].sets[0].weight).toBe(25);
    });
  });
});
