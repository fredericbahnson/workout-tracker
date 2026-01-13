import { describe, it, expect, beforeEach, afterEach, vi, type Mock } from 'vitest';
import type { Exercise, MaxRecord } from '@/types';
import {
  remoteToLocalExercise,
  remoteToLocalMaxRecord,
  localToRemoteExercise,
  localToRemoteMaxRecord,
} from './sync/transformers';

// ============================================================================
// Mock Setup - Must use inline factory functions for hoisting
// ============================================================================

// Mock Supabase - inline factory to avoid hoisting issues
vi.mock('../data/supabase', () => ({
  supabase: {
    from: vi.fn(),
    auth: {
      getSession: vi.fn(),
      onAuthStateChange: vi.fn(),
    },
  },
  isSupabaseConfigured: vi.fn(() => true),
}));

// Mock Dexie database - inline factory
vi.mock('../data/db', () => ({
  db: {
    exercises: {
      get: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
      toArray: vi.fn(),
      clear: vi.fn(),
    },
    maxRecords: {
      get: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
      toArray: vi.fn(),
    },
    completedSets: {
      get: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
      toArray: vi.fn(),
    },
    cycles: {
      get: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
      toArray: vi.fn(),
    },
    scheduledWorkouts: {
      get: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
      toArray: vi.fn(),
    },
    syncQueue: {
      orderBy: vi.fn(() => ({ toArray: vi.fn(() => Promise.resolve([])) })),
      where: vi.fn(() => ({
        equals: vi.fn(() => ({ first: vi.fn() })),
      })),
      add: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(() => Promise.resolve(0)),
    },
  },
  generateId: vi.fn(() => 'mock-uuid-' + Math.random().toString(36).substr(2, 9)),
}));

// Import mocked modules AFTER vi.mock calls
import { SyncService } from './syncService';
import { supabase, isSupabaseConfigured } from '@/data/supabase';
import { db } from '@/data/db';

// Type the mocked functions for easier use
const mockSupabaseFrom = supabase.from as Mock;
const mockIsSupabaseConfigured = isSupabaseConfigured as Mock;
const mockDbExercises = db.exercises as {
  get: Mock;
  put: Mock;
  delete: Mock;
  toArray: Mock;
  clear: Mock;
};
const mockDbMaxRecords = db.maxRecords as {
  get: Mock;
  put: Mock;
  delete: Mock;
  toArray: Mock;
};
const mockDbCompletedSets = db.completedSets as {
  get: Mock;
  put: Mock;
  delete: Mock;
  toArray: Mock;
};
const mockDbCycles = db.cycles as {
  get: Mock;
  put: Mock;
  delete: Mock;
  toArray: Mock;
};
const mockDbScheduledWorkouts = db.scheduledWorkouts as {
  get: Mock;
  put: Mock;
  delete: Mock;
  toArray: Mock;
};
const mockDbSyncQueue = db.syncQueue as {
  orderBy: Mock;
  where: Mock;
  add: Mock;
  update: Mock;
  delete: Mock;
  count: Mock;
};

// Mock navigator.onLine - set up in beforeEach to avoid issues
let mockOnLineValue = true;
const originalOnLine = Object.getOwnPropertyDescriptor(navigator, 'onLine');

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
    maxReps: 20,
    notes: '',
    recordedAt: new Date('2024-01-01'),
    ...overrides,
  };
}

// Helper to setup Supabase mock responses
function setupSupabaseMock(responses: Record<string, { data?: unknown; error?: unknown }>) {
  mockSupabaseFrom.mockImplementation((table: string) => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        is: vi.fn(() => Promise.resolve(responses[table] || { data: [] })),
        not: vi.fn(() => Promise.resolve({ data: [] })),
      })),
    })),
    upsert: vi.fn(() => Promise.resolve(responses[`${table}_upsert`] || { error: null })),
    update: vi.fn(() => ({
      eq: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ error: null })),
      })),
    })),
  }));
}

// ============================================================================
// SyncService Tests
// ============================================================================

describe('SyncService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockOnLineValue = true;
    Object.defineProperty(navigator, 'onLine', {
      get: () => mockOnLineValue,
      configurable: true,
    });
    mockIsSupabaseConfigured.mockReturnValue(true);

    // Reset sync queue mocks
    mockDbSyncQueue.orderBy.mockReturnValue({
      toArray: vi.fn(() => Promise.resolve([])),
    });
    mockDbSyncQueue.where.mockReturnValue({
      equals: vi.fn(() => ({
        first: vi.fn(() => Promise.resolve(undefined)),
      })),
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
    // Restore original onLine if it existed
    if (originalOnLine) {
      Object.defineProperty(navigator, 'onLine', originalOnLine);
    }
  });

  // --------------------------------------------------------------------------
  // Status Management
  // --------------------------------------------------------------------------

  describe('status management', () => {
    it('starts with idle status', () => {
      expect(SyncService.getStatus()).toBe('idle');
    });

    it('updates status and notifies listeners', () => {
      const listener = vi.fn();
      const unsubscribe = SyncService.onStatusChange(listener);

      SyncService.setStatus('syncing');
      expect(listener).toHaveBeenCalledWith('syncing');

      SyncService.setStatus('idle');
      expect(listener).toHaveBeenCalledWith('idle');

      unsubscribe();
      SyncService.setStatus('error');
      expect(listener).toHaveBeenCalledTimes(2); // Not called after unsubscribe
    });

    it('reports online status correctly', () => {
      mockOnLineValue = true;
      expect(SyncService.isOnline()).toBe(true);

      mockOnLineValue = false;
      expect(SyncService.isOnline()).toBe(false);
    });
  });

  // --------------------------------------------------------------------------
  // Full Sync
  // --------------------------------------------------------------------------

  describe('fullSync', () => {
    it('returns error when Supabase is not configured', async () => {
      mockIsSupabaseConfigured.mockReturnValue(false);

      const result = await SyncService.fullSync('user-1');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Supabase not configured');
    });

    it('returns error and sets offline status when offline', async () => {
      mockOnLineValue = false;

      const result = await SyncService.fullSync('user-1');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Offline');
      expect(SyncService.getStatus()).toBe('offline');
    });

    it('sets syncing status during sync', async () => {
      setupSupabaseMock({
        exercises: { data: [] },
        max_records: { data: [] },
        completed_sets: { data: [] },
        cycles: { data: [] },
        scheduled_workouts: { data: [] },
      });

      mockDbExercises.toArray.mockResolvedValue([]);
      mockDbMaxRecords.toArray.mockResolvedValue([]);
      mockDbCompletedSets.toArray.mockResolvedValue([]);
      mockDbCycles.toArray.mockResolvedValue([]);
      mockDbScheduledWorkouts.toArray.mockResolvedValue([]);

      const statusChanges: string[] = [];
      const unsubscribe = SyncService.onStatusChange(status => {
        statusChanges.push(status);
      });

      await SyncService.fullSync('user-1');

      unsubscribe();

      expect(statusChanges).toContain('syncing');
      // Should end with idle on success
      expect(statusChanges[statusChanges.length - 1]).toBe('idle');
    });

    it('sets error status on sync failure', async () => {
      mockSupabaseFrom.mockImplementation(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            is: vi.fn(() => Promise.reject(new Error('Network error'))),
          })),
        })),
      }));

      const result = await SyncService.fullSync('user-1');

      expect(result.success).toBe(false);
      expect(SyncService.getStatus()).toBe('error');
    });

    it('updates lastSyncTime on successful sync', async () => {
      setupSupabaseMock({
        exercises: { data: [] },
        max_records: { data: [] },
        completed_sets: { data: [] },
        cycles: { data: [] },
        scheduled_workouts: { data: [] },
      });

      mockDbExercises.toArray.mockResolvedValue([]);
      mockDbMaxRecords.toArray.mockResolvedValue([]);
      mockDbCompletedSets.toArray.mockResolvedValue([]);
      mockDbCycles.toArray.mockResolvedValue([]);
      mockDbScheduledWorkouts.toArray.mockResolvedValue([]);

      const beforeSync = new Date();
      await SyncService.fullSync('user-1');
      const afterSync = new Date();

      const lastSyncTime = SyncService.getLastSyncTime();
      expect(lastSyncTime).not.toBeNull();
      expect(lastSyncTime!.getTime()).toBeGreaterThanOrEqual(beforeSync.getTime());
      expect(lastSyncTime!.getTime()).toBeLessThanOrEqual(afterSync.getTime());
    });
  });

  // --------------------------------------------------------------------------
  // Data Conversion
  // --------------------------------------------------------------------------

  describe('data conversion', () => {
    describe('remoteToLocalExercise', () => {
      it('converts remote exercise format to local format', () => {
        const remote = {
          id: 'ex-1',
          user_id: 'user-1',
          name: 'Push-ups',
          type: 'push',
          mode: 'standard',
          measurement_type: 'reps',
          notes: 'Test notes',
          custom_parameters: [{ name: 'grip', type: 'select', options: ['wide', 'narrow'] }],
          default_conditioning_reps: 10,
          default_conditioning_time: null,
          weight_enabled: true,
          default_weight: 25,
          created_at: '2024-01-01T00:00:00.000Z',
          updated_at: '2024-01-15T00:00:00.000Z',
          deleted_at: null,
        };

        const local = remoteToLocalExercise(remote);

        expect(local.id).toBe('ex-1');
        expect(local.name).toBe('Push-ups');
        expect(local.type).toBe('push');
        expect(local.mode).toBe('standard');
        expect(local.measurementType).toBe('reps');
        expect(local.notes).toBe('Test notes');
        expect(local.customParameters).toEqual([
          { name: 'grip', type: 'select', options: ['wide', 'narrow'] },
        ]);
        expect(local.defaultConditioningReps).toBe(10);
        expect(local.defaultConditioningTime).toBeUndefined();
        expect(local.weightEnabled).toBe(true);
        expect(local.defaultWeight).toBe(25);
        expect(local.createdAt).toEqual(new Date('2024-01-01T00:00:00.000Z'));
        expect(local.updatedAt).toEqual(new Date('2024-01-15T00:00:00.000Z'));
      });

      it('handles null measurement_type with default', () => {
        const remote = {
          id: 'ex-1',
          user_id: 'user-1',
          name: 'Test',
          type: 'push',
          mode: 'standard',
          measurement_type: null,
          notes: '',
          custom_parameters: [],
          default_conditioning_reps: null,
          default_conditioning_time: null,
          weight_enabled: false,
          default_weight: null,
          created_at: '2024-01-01T00:00:00.000Z',
          updated_at: '2024-01-01T00:00:00.000Z',
          deleted_at: null,
        };

        const local = remoteToLocalExercise(remote);

        expect(local.measurementType).toBe('reps'); // Default
      });
    });

    describe('localToRemoteExercise', () => {
      it('converts local exercise format to remote format', () => {
        const local = createMockExercise({
          id: 'ex-1',
          name: 'Pull-ups',
          type: 'pull',
          mode: 'standard',
          measurementType: 'reps',
          notes: 'Back exercise',
          weightEnabled: true,
          defaultWeight: 10,
        });

        const remote = localToRemoteExercise(local, 'user-123');

        expect(remote.id).toBe('ex-1');
        expect(remote.user_id).toBe('user-123');
        expect(remote.name).toBe('Pull-ups');
        expect(remote.type).toBe('pull');
        expect(remote.mode).toBe('standard');
        expect(remote.measurement_type).toBe('reps');
        expect(remote.notes).toBe('Back exercise');
        expect(remote.weight_enabled).toBe(true);
        expect(remote.default_weight).toBe(10);
        expect(remote.created_at).toBe(local.createdAt.toISOString());
        expect(remote.updated_at).toBe(local.updatedAt.toISOString());
      });
    });

    describe('remoteToLocalMaxRecord', () => {
      it('converts remote max record to local format', () => {
        const remote = {
          id: 'max-1',
          user_id: 'user-1',
          exercise_id: 'ex-1',
          max_reps: 25,
          max_time: null,
          weight: 10,
          notes: 'PR!',
          recorded_at: '2024-01-15T10:30:00.000Z',
          deleted_at: null,
        };

        const local = remoteToLocalMaxRecord(remote);

        expect(local.id).toBe('max-1');
        expect(local.exerciseId).toBe('ex-1');
        expect(local.maxReps).toBe(25);
        expect(local.maxTime).toBeUndefined();
        expect(local.weight).toBe(10);
        expect(local.notes).toBe('PR!');
        expect(local.recordedAt).toEqual(new Date('2024-01-15T10:30:00.000Z'));
      });

      it('handles time-based max records', () => {
        const remote = {
          id: 'max-1',
          user_id: 'user-1',
          exercise_id: 'ex-1',
          max_reps: null,
          max_time: 120,
          weight: null,
          notes: '',
          recorded_at: '2024-01-15T10:30:00.000Z',
          deleted_at: null,
        };

        const local = remoteToLocalMaxRecord(remote);

        expect(local.maxReps).toBeUndefined();
        expect(local.maxTime).toBe(120);
        expect(local.weight).toBeUndefined();
      });
    });

    describe('localToRemoteMaxRecord', () => {
      it('converts local max record to remote format', () => {
        const local = createMockMaxRecord({
          id: 'max-1',
          exerciseId: 'ex-1',
          maxReps: 30,
          maxTime: undefined,
          weight: 15,
          notes: 'New max',
          recordedAt: new Date('2024-02-01T12:00:00.000Z'),
        });

        const remote = localToRemoteMaxRecord(local, 'user-456');

        expect(remote.id).toBe('max-1');
        expect(remote.user_id).toBe('user-456');
        expect(remote.exercise_id).toBe('ex-1');
        expect(remote.max_reps).toBe(30);
        expect(remote.max_time).toBeNull();
        expect(remote.weight).toBe(15);
        expect(remote.notes).toBe('New max');
        expect(remote.recorded_at).toBe('2024-02-01T12:00:00.000Z');
      });
    });
  });

  // --------------------------------------------------------------------------
  // Sync Queue
  // --------------------------------------------------------------------------

  describe('sync queue', () => {
    it('queues operations when offline', async () => {
      mockOnLineValue = false;

      mockDbSyncQueue.where.mockReturnValue({
        equals: vi.fn(() => ({
          first: vi.fn(() => Promise.resolve(undefined)), // No existing item
        })),
      });

      const exercise = createMockExercise();
      await SyncService.syncItem('exercises', exercise, 'user-1');

      expect(mockDbSyncQueue.add).toHaveBeenCalled();
      const addCall = mockDbSyncQueue.add.mock.calls[0][0];
      expect(addCall.table).toBe('exercises');
      expect(addCall.operation).toBe('upsert');
      expect(addCall.data).toEqual(exercise);
    });

    it('updates existing queue item instead of duplicating', async () => {
      mockOnLineValue = false;

      const existingQueueItem = {
        id: 'queue-1',
        table: 'exercises',
        itemId: 'ex-1',
        operation: 'upsert',
        data: { id: 'ex-1', name: 'Old Name' },
        createdAt: new Date(),
        retryCount: 0,
      };

      mockDbSyncQueue.where.mockReturnValue({
        equals: vi.fn(() => ({
          first: vi.fn(() => Promise.resolve(existingQueueItem)),
        })),
      });

      const exercise = createMockExercise({ id: 'ex-1', name: 'New Name' });
      await SyncService.syncItem('exercises', exercise, 'user-1');

      expect(mockDbSyncQueue.update).toHaveBeenCalledWith(
        'queue-1',
        expect.objectContaining({
          data: exercise,
          operation: 'upsert',
        })
      );
      expect(mockDbSyncQueue.add).not.toHaveBeenCalled();
    });

    it('returns queue count', async () => {
      mockDbSyncQueue.count.mockResolvedValue(5);

      const count = await SyncService.getQueueCount();

      expect(count).toBe(5);
    });
  });

  // --------------------------------------------------------------------------
  // Delete Operations
  // --------------------------------------------------------------------------

  describe('deleteItem', () => {
    it('soft deletes item in cloud when online', async () => {
      const mockUpdate = vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => Promise.resolve({ error: null })),
        })),
      }));

      mockSupabaseFrom.mockReturnValue({
        update: mockUpdate,
      });

      await SyncService.deleteItem('exercises', 'ex-1', 'user-1');

      expect(mockSupabaseFrom).toHaveBeenCalledWith('exercises');
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ deleted_at: expect.any(String) })
      );
    });

    it('queues delete when offline', async () => {
      mockOnLineValue = false;

      mockDbSyncQueue.where.mockReturnValue({
        equals: vi.fn(() => ({
          first: vi.fn(() => Promise.resolve(undefined)),
        })),
      });

      await SyncService.deleteItem('exercises', 'ex-1', 'user-1');

      expect(mockDbSyncQueue.add).toHaveBeenCalled();
      const addCall = mockDbSyncQueue.add.mock.calls[0][0];
      expect(addCall.table).toBe('exercises');
      expect(addCall.operation).toBe('delete');
      expect(addCall.itemId).toBe('ex-1');
    });
  });

  // --------------------------------------------------------------------------
  // Network Error Detection
  // --------------------------------------------------------------------------

  describe('isNetworkError', () => {
    it('detects fetch errors', () => {
      expect(SyncService.isNetworkError(new Error('Failed to fetch'))).toBe(true);
      expect(SyncService.isNetworkError(new Error('fetch error'))).toBe(true);
    });

    it('detects network errors', () => {
      expect(SyncService.isNetworkError(new Error('network error'))).toBe(true);
      // Note: implementation checks lowercase 'network', so 'Network' (capital) won't match
      // This is testing actual behavior, not ideal behavior
    });

    it('detects TypeError (common for network issues)', () => {
      const typeError = new TypeError('Failed to fetch');
      expect(SyncService.isNetworkError(typeError)).toBe(true);
    });

    it('returns false for non-network errors', () => {
      expect(SyncService.isNetworkError(new Error('Invalid data'))).toBe(false);
      expect(SyncService.isNetworkError(new Error('Validation failed'))).toBe(false);
      expect(SyncService.isNetworkError('string error')).toBe(false);
      expect(SyncService.isNetworkError(null)).toBe(false);
    });
  });

  // --------------------------------------------------------------------------
  // Process Queue
  // --------------------------------------------------------------------------

  describe('processQueue', () => {
    it('returns early when Supabase not configured', async () => {
      mockIsSupabaseConfigured.mockReturnValue(false);

      const result = await SyncService.processQueue('user-1');

      expect(result).toEqual({ processed: 0, failed: 0, skipped: 0 });
    });

    it('returns early when offline', async () => {
      mockOnLineValue = false;

      const result = await SyncService.processQueue('user-1');

      expect(result).toEqual({ processed: 0, failed: 0, skipped: 0 });
    });

    it('processes queued upsert operations', async () => {
      const queuedItem = {
        id: 'queue-1',
        table: 'exercises' as const,
        operation: 'upsert' as const,
        itemId: 'ex-1',
        data: createMockExercise(),
        createdAt: new Date(),
        retryCount: 0,
      };

      mockDbSyncQueue.orderBy.mockReturnValue({
        toArray: vi.fn(() => Promise.resolve([queuedItem])),
      });

      mockSupabaseFrom.mockReturnValue({
        upsert: vi.fn(() => Promise.resolve({ error: null })),
      });

      const result = await SyncService.processQueue('user-1');

      expect(result.processed).toBe(1);
      expect(result.failed).toBe(0);
      expect(mockDbSyncQueue.delete).toHaveBeenCalledWith('queue-1');
    });

    it('processes queued delete operations', async () => {
      const queuedItem = {
        id: 'queue-1',
        table: 'exercises' as const,
        operation: 'delete' as const,
        itemId: 'ex-1',
        data: { id: 'ex-1' },
        createdAt: new Date(),
        retryCount: 0,
      };

      mockDbSyncQueue.orderBy.mockReturnValue({
        toArray: vi.fn(() => Promise.resolve([queuedItem])),
      });

      mockSupabaseFrom.mockReturnValue({
        update: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => Promise.resolve({ error: null })),
          })),
        })),
      });

      const result = await SyncService.processQueue('user-1');

      expect(result.processed).toBe(1);
      expect(mockDbSyncQueue.delete).toHaveBeenCalledWith('queue-1');
    });

    it('increments retry count on failure with exponential backoff', async () => {
      const queuedItem = {
        id: 'queue-1',
        table: 'exercises' as const,
        operation: 'upsert' as const,
        itemId: 'ex-1',
        data: createMockExercise(),
        createdAt: new Date(),
        retryCount: 2,
      };

      mockDbSyncQueue.orderBy.mockReturnValue({
        toArray: vi.fn(() => Promise.resolve([queuedItem])),
      });

      mockSupabaseFrom.mockReturnValue({
        upsert: vi.fn(() => Promise.reject(new Error('Server error'))),
      });

      const result = await SyncService.processQueue('user-1');

      expect(result.failed).toBe(1);
      // Should update with incremented retry count and nextRetryAt timestamp
      expect(mockDbSyncQueue.update).toHaveBeenCalledWith(
        'queue-1',
        expect.objectContaining({
          retryCount: 3,
          nextRetryAt: expect.any(Date),
        })
      );
    });

    it('removes item from queue after 5 retries', async () => {
      const queuedItem = {
        id: 'queue-1',
        table: 'exercises' as const,
        operation: 'upsert' as const,
        itemId: 'ex-1',
        data: createMockExercise(),
        createdAt: new Date(),
        retryCount: 4, // Will become 5 after this failure
      };

      mockDbSyncQueue.orderBy.mockReturnValue({
        toArray: vi.fn(() => Promise.resolve([queuedItem])),
      });

      mockSupabaseFrom.mockReturnValue({
        upsert: vi.fn(() => Promise.reject(new Error('Persistent error'))),
      });

      await SyncService.processQueue('user-1');

      // Should delete rather than update retry count
      expect(mockDbSyncQueue.delete).toHaveBeenCalledWith('queue-1');
      expect(mockDbSyncQueue.update).not.toHaveBeenCalled();
    });

    it('skips items that have not reached their retry time', async () => {
      const futureDate = new Date(Date.now() + 60000); // 1 minute in the future
      const queuedItem = {
        id: 'queue-1',
        table: 'exercises' as const,
        operation: 'upsert' as const,
        itemId: 'ex-1',
        data: createMockExercise(),
        createdAt: new Date(),
        retryCount: 1,
        nextRetryAt: futureDate,
      };

      mockDbSyncQueue.orderBy.mockReturnValue({
        toArray: vi.fn(() => Promise.resolve([queuedItem])),
      });

      const result = await SyncService.processQueue('user-1');

      expect(result.skipped).toBe(1);
      expect(result.processed).toBe(0);
      expect(result.failed).toBe(0);
      // Should not attempt to process or delete the item
      expect(mockSupabaseFrom).not.toHaveBeenCalled();
      expect(mockDbSyncQueue.delete).not.toHaveBeenCalled();
    });
  });
});

// ============================================================================
// Integration-style Tests (testing conversion round-trips)
// ============================================================================

describe('SyncService data integrity', () => {
  describe('exercise round-trip', () => {
    it('preserves all exercise fields through conversion', () => {
      const original = createMockExercise({
        id: 'ex-test',
        name: 'Test Exercise',
        type: 'core',
        mode: 'conditioning',
        measurementType: 'time',
        notes: 'Important notes here',
        customParameters: [{ name: 'difficulty', type: 'select', options: ['easy', 'hard'] }],
        defaultConditioningReps: 15,
        defaultConditioningTime: 60,
        weightEnabled: true,
        defaultWeight: 20,
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
        updatedAt: new Date('2024-06-15T12:30:00.000Z'),
      });

      const remote = localToRemoteExercise(original, 'user-1');
      const roundTripped = remoteToLocalExercise(remote);

      expect(roundTripped.id).toBe(original.id);
      expect(roundTripped.name).toBe(original.name);
      expect(roundTripped.type).toBe(original.type);
      expect(roundTripped.mode).toBe(original.mode);
      expect(roundTripped.measurementType).toBe(original.measurementType);
      expect(roundTripped.notes).toBe(original.notes);
      expect(roundTripped.customParameters).toEqual(original.customParameters);
      expect(roundTripped.defaultConditioningReps).toBe(original.defaultConditioningReps);
      expect(roundTripped.defaultConditioningTime).toBe(original.defaultConditioningTime);
      expect(roundTripped.weightEnabled).toBe(original.weightEnabled);
      expect(roundTripped.defaultWeight).toBe(original.defaultWeight);
      expect(roundTripped.createdAt.toISOString()).toBe(original.createdAt.toISOString());
      expect(roundTripped.updatedAt.toISOString()).toBe(original.updatedAt.toISOString());
    });
  });

  describe('max record round-trip', () => {
    it('preserves all max record fields through conversion', () => {
      const original = createMockMaxRecord({
        id: 'max-test',
        exerciseId: 'ex-1',
        maxReps: 42,
        maxTime: undefined,
        weight: 25,
        notes: 'Personal record!',
        recordedAt: new Date('2024-03-15T09:00:00.000Z'),
      });

      const remote = localToRemoteMaxRecord(original, 'user-1');
      const roundTripped = remoteToLocalMaxRecord(remote);

      expect(roundTripped.id).toBe(original.id);
      expect(roundTripped.exerciseId).toBe(original.exerciseId);
      expect(roundTripped.maxReps).toBe(original.maxReps);
      expect(roundTripped.maxTime).toBe(original.maxTime);
      expect(roundTripped.weight).toBe(original.weight);
      expect(roundTripped.notes).toBe(original.notes);
      expect(roundTripped.recordedAt.toISOString()).toBe(original.recordedAt.toISOString());
    });

    it('preserves time-based max record fields', () => {
      const original = createMockMaxRecord({
        id: 'max-time',
        exerciseId: 'ex-1',
        maxReps: undefined,
        maxTime: 180,
        weight: undefined,
        notes: 'Plank hold',
        recordedAt: new Date('2024-03-15T09:00:00.000Z'),
      });

      const remote = localToRemoteMaxRecord(original, 'user-1');
      const roundTripped = remoteToLocalMaxRecord(remote);

      expect(roundTripped.maxReps).toBeUndefined();
      expect(roundTripped.maxTime).toBe(180);
      expect(roundTripped.weight).toBeUndefined();
    });
  });
});
