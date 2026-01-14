/**
 * DeleteWorkoutModal Component
 *
 * Confirmation modal for deleting a workout.
 */

import { Modal, Button } from '@/components/ui';
import type { ScheduledWorkout } from '@/types';

interface DeleteWorkoutModalProps {
  workout: ScheduledWorkout | null;
  groupName?: string;
  isDeleting: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export function DeleteWorkoutModal({
  workout,
  groupName,
  isDeleting,
  onConfirm,
  onClose,
}: DeleteWorkoutModalProps) {
  return (
    <Modal isOpen={!!workout} onClose={onClose} title="Delete Workout">
      <div className="space-y-4">
        <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
          <p className="text-sm text-red-800 dark:text-red-200">
            <strong>Warning:</strong> This action cannot be undone.
          </p>
        </div>

        <p className="text-gray-700 dark:text-gray-300">
          Are you sure you want to delete Workout #{workout?.sequenceNumber}?
        </p>

        {workout && (
          <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <p className="font-medium text-gray-900 dark:text-gray-100">{groupName || 'Workout'}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Week {workout.weekNumber} • {workout.scheduledSets.length} sets
            </p>
          </div>
        )}

        <div className="flex gap-2">
          <Button variant="secondary" className="flex-1" onClick={onClose} disabled={isDeleting}>
            Cancel
          </Button>
          <Button
            className="flex-1 bg-red-600 hover:bg-red-700 text-white"
            onClick={onConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? 'Deleting...' : 'Delete Workout'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
