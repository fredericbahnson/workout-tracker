import { Modal, Button } from '@/components/ui';
import type { Exercise, ScheduledSet } from '@/types';

// ============================================
// Skip Workout Confirmation Modal
// ============================================

interface SkipWorkoutConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function SkipWorkoutConfirmModal({
  isOpen,
  onClose,
  onConfirm,
}: SkipWorkoutConfirmModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Skip Workout">
      <div className="space-y-4">
        <p className="text-gray-600 dark:text-gray-400">
          Are you sure you want to skip this workout? It will be marked as skipped and you'll move on to the next workout.
        </p>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button onClick={onConfirm} className="flex-1">
            Skip Workout
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// ============================================
// End Workout Early Confirmation Modal
// ============================================

interface EndWorkoutConfirmModalProps {
  isOpen: boolean;
  completedSetCount: number;
  totalSetCount: number;
  onClose: () => void;
  onConfirm: () => void;
}

export function EndWorkoutConfirmModal({
  isOpen,
  completedSetCount,
  totalSetCount,
  onClose,
  onConfirm,
}: EndWorkoutConfirmModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="End Workout Early">
      <div className="space-y-4">
        <p className="text-gray-600 dark:text-gray-400">
          You've completed {completedSetCount} of {totalSetCount} sets. 
          End this workout and move on to the next one?
        </p>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button onClick={onConfirm} className="flex-1">
            End Workout
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// ============================================
// Skip Set Confirmation Modal
// ============================================

interface SkipSetConfirmModalProps {
  /** The set being skipped, or null if modal is closed */
  setToSkip: { set: ScheduledSet; targetReps: number } | null;
  /** Exercise associated with the set */
  exercise: Exercise | undefined;
  onClose: () => void;
  onConfirm: () => void;
}

export function SkipSetConfirmModal({
  setToSkip,
  exercise,
  onClose,
  onConfirm,
}: SkipSetConfirmModalProps) {
  return (
    <Modal isOpen={!!setToSkip} onClose={onClose} title="Skip Set?">
      {setToSkip && (
        <div className="space-y-4">
          <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
            <p className="font-medium text-gray-900 dark:text-gray-100">
              {exercise?.name}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Target: {setToSkip.targetReps} reps
            </p>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Are you sure you want to skip this set? It will be marked as skipped with 0 reps.
          </p>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button 
              onClick={onConfirm}
              className="flex-1 bg-orange-500 hover:bg-orange-600"
            >
              Skip Set
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}

// ============================================
// Cancel Ad-Hoc Workout Confirmation Modal
// ============================================

interface CancelAdHocConfirmModalProps {
  isOpen: boolean;
  setCount: number;
  isDeleting: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function CancelAdHocConfirmModal({
  isOpen,
  setCount,
  isDeleting,
  onClose,
  onConfirm,
}: CancelAdHocConfirmModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Cancel Workout?">
      <div className="space-y-4">
        <p className="text-gray-600 dark:text-gray-400">
          This will delete the ad-hoc workout and all {setCount} logged set{setCount !== 1 ? 's' : ''}. This cannot be undone.
        </p>
        <div className="flex gap-2">
          <Button 
            variant="secondary" 
            onClick={onClose} 
            className="flex-1"
            disabled={isDeleting}
          >
            Keep Workout
          </Button>
          <Button 
            variant="danger"
            onClick={onConfirm}
            className="flex-1"
            disabled={isDeleting}
          >
            {isDeleting ? 'Deleting...' : 'Delete Workout'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
