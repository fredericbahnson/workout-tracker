import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useAdHocWorkout } from './useAdHocWorkout';
import type { Cycle, ScheduledWorkout } from '@/types';

// Mock repositories
vi.mock('@/data/repositories', () => ({
  ScheduledWorkoutRepo: {
    countAdHocWorkouts: vi.fn(),
    getByCycleId: vi.fn(),
    create: vi.fn(),
    updateStatus: vi.fn(),
    updateName: vi.fn(),
    delete: vi.fn(),
  },
  CompletedSetRepo: {
    deleteByScheduledWorkoutId: vi.fn(),
  },
}));

// Mock logger
vi.mock('@/utils/logger', () => ({
  createScopedLogger: () => ({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
}));

import { ScheduledWorkoutRepo, CompletedSetRepo } from '@/data/repositories';

// Helper to create mock cycle
function createMockCycle(overrides: Partial<Cycle> = {}): Cycle {
  return {
    id: 'cycle-1',
    name: 'Test Cycle',
    startDate: '2026-01-01',
    lengthInWeeks: 4,
    workoutDaysPerWeek: 3,
    mode: 'standard',
    progressionScheme: 'rfem',
    groups: [],
    exerciseAssignments: [],
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

// Helper to create mock workout
function createMockWorkout(overrides: Partial<ScheduledWorkout> = {}): ScheduledWorkout {
  return {
    id: 'workout-1',
    cycleId: 'cycle-1',
    groupId: 'group-1',
    weekNumber: 1,
    sequenceNumber: 1,
    scheduledSets: [],
    status: 'pending',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

describe('useAdHocWorkout', () => {
  const mockSyncItem = vi.fn();
  const mockDeleteItem = vi.fn();
  const mockMarkWorkoutCompleted = vi.fn();
  const mockDismissCompletionView = vi.fn();
  const mockResetCompletionState = vi.fn();

  const defaultParams = {
    activeCycle: createMockCycle(),
    cycleProgressPassed: 3,
    displayWorkout: null as ScheduledWorkout | null,
    syncItem: mockSyncItem,
    deleteItem: mockDeleteItem,
    markWorkoutCompleted: mockMarkWorkoutCompleted,
    dismissCompletionView: mockDismissCompletionView,
    resetCompletionState: mockResetCompletionState,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('modal state management', () => {
    it('initializes with modals closed', () => {
      const { result } = renderHook(() => useAdHocWorkout(defaultParams));

      expect(result.current.showRenameModal).toBe(false);
      expect(result.current.showCancelAdHocConfirm).toBe(false);
      expect(result.current.isCancellingAdHoc).toBe(false);
    });

    it('opens and closes rename modal', () => {
      const { result } = renderHook(() => useAdHocWorkout(defaultParams));

      act(() => {
        result.current.openRenameModal();
      });
      expect(result.current.showRenameModal).toBe(true);

      act(() => {
        result.current.closeRenameModal();
      });
      expect(result.current.showRenameModal).toBe(false);
    });

    it('opens and closes cancel confirmation modal', () => {
      const { result } = renderHook(() => useAdHocWorkout(defaultParams));

      act(() => {
        result.current.openCancelConfirm();
      });
      expect(result.current.showCancelAdHocConfirm).toBe(true);

      act(() => {
        result.current.closeCancelConfirm();
      });
      expect(result.current.showCancelAdHocConfirm).toBe(false);
    });
  });

  describe('handleStartAdHocWorkout', () => {
    it('creates ad-hoc workout with correct properties', async () => {
      vi.mocked(ScheduledWorkoutRepo.countAdHocWorkouts).mockResolvedValue(2);
      vi.mocked(ScheduledWorkoutRepo.getByCycleId).mockResolvedValue([
        createMockWorkout({ sequenceNumber: 1 }),
        createMockWorkout({ sequenceNumber: 2 }),
      ]);
      vi.mocked(ScheduledWorkoutRepo.create).mockResolvedValue(
        createMockWorkout({
          id: 'adhoc-1',
          isAdHoc: true,
          customName: 'Ad Hoc Workout 3',
        })
      );

      const { result } = renderHook(() => useAdHocWorkout(defaultParams));

      await act(async () => {
        await result.current.handleStartAdHocWorkout();
      });

      expect(ScheduledWorkoutRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          cycleId: 'cycle-1',
          isAdHoc: true,
          status: 'partial',
          groupId: 'ad-hoc',
          customName: 'Ad Hoc Workout 3',
          sequenceNumber: 2.5, // maxSequence(2) + 0.5
        })
      );
    });

    it('syncs the new workout', async () => {
      const createdWorkout = createMockWorkout({ id: 'adhoc-1', isAdHoc: true });
      vi.mocked(ScheduledWorkoutRepo.countAdHocWorkouts).mockResolvedValue(0);
      vi.mocked(ScheduledWorkoutRepo.getByCycleId).mockResolvedValue([]);
      vi.mocked(ScheduledWorkoutRepo.create).mockResolvedValue(createdWorkout);

      const { result } = renderHook(() => useAdHocWorkout(defaultParams));

      await act(async () => {
        await result.current.handleStartAdHocWorkout();
      });

      expect(mockSyncItem).toHaveBeenCalledWith('scheduled_workouts', createdWorkout);
    });

    it('dismisses completion view after creating ad-hoc', async () => {
      vi.mocked(ScheduledWorkoutRepo.countAdHocWorkouts).mockResolvedValue(0);
      vi.mocked(ScheduledWorkoutRepo.getByCycleId).mockResolvedValue([]);
      vi.mocked(ScheduledWorkoutRepo.create).mockResolvedValue(createMockWorkout());

      const { result } = renderHook(() => useAdHocWorkout(defaultParams));

      await act(async () => {
        await result.current.handleStartAdHocWorkout();
      });

      expect(mockDismissCompletionView).toHaveBeenCalled();
    });

    it('does nothing if no active cycle', async () => {
      const { result } = renderHook(() => useAdHocWorkout({ ...defaultParams, activeCycle: null }));

      await act(async () => {
        await result.current.handleStartAdHocWorkout();
      });

      expect(ScheduledWorkoutRepo.create).not.toHaveBeenCalled();
    });
  });

  describe('handleCompleteAdHocWorkout', () => {
    it('completes ad-hoc workout and shows completion view', async () => {
      const adHocWorkout = createMockWorkout({ id: 'adhoc-1', isAdHoc: true });

      const { result } = renderHook(() =>
        useAdHocWorkout({ ...defaultParams, displayWorkout: adHocWorkout })
      );

      await act(async () => {
        await result.current.handleCompleteAdHocWorkout();
      });

      expect(ScheduledWorkoutRepo.updateStatus).toHaveBeenCalledWith('adhoc-1', 'completed');
      expect(mockMarkWorkoutCompleted).toHaveBeenCalledWith('adhoc-1');
    });

    it('does nothing if workout is not ad-hoc', async () => {
      const regularWorkout = createMockWorkout({ id: 'regular-1', isAdHoc: false });

      const { result } = renderHook(() =>
        useAdHocWorkout({ ...defaultParams, displayWorkout: regularWorkout })
      );

      await act(async () => {
        await result.current.handleCompleteAdHocWorkout();
      });

      expect(ScheduledWorkoutRepo.updateStatus).not.toHaveBeenCalled();
    });

    it('does nothing if no display workout', async () => {
      const { result } = renderHook(() => useAdHocWorkout(defaultParams));

      await act(async () => {
        await result.current.handleCompleteAdHocWorkout();
      });

      expect(ScheduledWorkoutRepo.updateStatus).not.toHaveBeenCalled();
    });
  });

  describe('handleRenameAdHocWorkout', () => {
    it('renames ad-hoc workout', async () => {
      const adHocWorkout = createMockWorkout({ id: 'adhoc-1', isAdHoc: true });

      const { result } = renderHook(() =>
        useAdHocWorkout({ ...defaultParams, displayWorkout: adHocWorkout })
      );

      await act(async () => {
        await result.current.handleRenameAdHocWorkout('My Custom Workout');
      });

      expect(ScheduledWorkoutRepo.updateName).toHaveBeenCalledWith('adhoc-1', 'My Custom Workout');
    });

    it('trims whitespace from name', async () => {
      const adHocWorkout = createMockWorkout({ id: 'adhoc-1', isAdHoc: true });

      const { result } = renderHook(() =>
        useAdHocWorkout({ ...defaultParams, displayWorkout: adHocWorkout })
      );

      await act(async () => {
        await result.current.handleRenameAdHocWorkout('  Trimmed Name  ');
      });

      expect(ScheduledWorkoutRepo.updateName).toHaveBeenCalledWith('adhoc-1', 'Trimmed Name');
    });

    it('does nothing for empty name', async () => {
      const adHocWorkout = createMockWorkout({ id: 'adhoc-1', isAdHoc: true });

      const { result } = renderHook(() =>
        useAdHocWorkout({ ...defaultParams, displayWorkout: adHocWorkout })
      );

      await act(async () => {
        await result.current.handleRenameAdHocWorkout('   ');
      });

      expect(ScheduledWorkoutRepo.updateName).not.toHaveBeenCalled();
    });

    it('does nothing if workout is not ad-hoc', async () => {
      const regularWorkout = createMockWorkout({ id: 'regular-1', isAdHoc: false });

      const { result } = renderHook(() =>
        useAdHocWorkout({ ...defaultParams, displayWorkout: regularWorkout })
      );

      await act(async () => {
        await result.current.handleRenameAdHocWorkout('New Name');
      });

      expect(ScheduledWorkoutRepo.updateName).not.toHaveBeenCalled();
    });
  });

  describe('handleCancelAdHocWorkout', () => {
    it('deletes ad-hoc workout and associated sets', async () => {
      const adHocWorkout = createMockWorkout({ id: 'adhoc-1', isAdHoc: true });
      vi.mocked(CompletedSetRepo.deleteByScheduledWorkoutId).mockResolvedValue(['set-1', 'set-2']);

      const { result } = renderHook(() =>
        useAdHocWorkout({ ...defaultParams, displayWorkout: adHocWorkout })
      );

      await act(async () => {
        await result.current.handleCancelAdHocWorkout();
      });

      // Should delete completed sets first
      expect(CompletedSetRepo.deleteByScheduledWorkoutId).toHaveBeenCalledWith('adhoc-1');
      expect(mockDeleteItem).toHaveBeenCalledWith('completed_sets', 'set-1');
      expect(mockDeleteItem).toHaveBeenCalledWith('completed_sets', 'set-2');

      // Then delete the workout
      expect(ScheduledWorkoutRepo.delete).toHaveBeenCalledWith('adhoc-1');
      expect(mockDeleteItem).toHaveBeenCalledWith('scheduled_workouts', 'adhoc-1');

      // Should reset state
      expect(mockResetCompletionState).toHaveBeenCalled();
    });

    it('sets loading state while cancelling', async () => {
      const adHocWorkout = createMockWorkout({ id: 'adhoc-1', isAdHoc: true });
      let resolveDelete: () => void;
      vi.mocked(CompletedSetRepo.deleteByScheduledWorkoutId).mockImplementation(
        () =>
          new Promise(resolve => {
            resolveDelete = () => resolve([]);
          })
      );

      const { result } = renderHook(() =>
        useAdHocWorkout({ ...defaultParams, displayWorkout: adHocWorkout })
      );

      // Start cancellation
      act(() => {
        result.current.handleCancelAdHocWorkout();
      });

      // Should be loading
      expect(result.current.isCancellingAdHoc).toBe(true);

      // Complete the operation
      await act(async () => {
        resolveDelete!();
      });

      // Should no longer be loading
      await waitFor(() => {
        expect(result.current.isCancellingAdHoc).toBe(false);
      });
    });

    it('does nothing if workout is not ad-hoc', async () => {
      const regularWorkout = createMockWorkout({ id: 'regular-1', isAdHoc: false });

      const { result } = renderHook(() =>
        useAdHocWorkout({ ...defaultParams, displayWorkout: regularWorkout })
      );

      await act(async () => {
        await result.current.handleCancelAdHocWorkout();
      });

      expect(ScheduledWorkoutRepo.delete).not.toHaveBeenCalled();
    });

    it('closes cancel confirm modal after completion', async () => {
      const adHocWorkout = createMockWorkout({ id: 'adhoc-1', isAdHoc: true });
      vi.mocked(CompletedSetRepo.deleteByScheduledWorkoutId).mockResolvedValue([]);

      const { result } = renderHook(() =>
        useAdHocWorkout({ ...defaultParams, displayWorkout: adHocWorkout })
      );

      // Open the modal first
      act(() => {
        result.current.openCancelConfirm();
      });
      expect(result.current.showCancelAdHocConfirm).toBe(true);

      // Cancel the workout
      await act(async () => {
        await result.current.handleCancelAdHocWorkout();
      });

      // Modal should be closed
      expect(result.current.showCancelAdHocConfirm).toBe(false);
    });
  });
});
