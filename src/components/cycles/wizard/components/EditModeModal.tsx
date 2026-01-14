/**
 * EditModeModal Component
 *
 * Modal for choosing how to apply changes when editing a cycle with progress.
 */

import { Button, Modal } from '@/components/ui';
import type { EditModeModalProps } from '../types';

export function EditModeModal({
  isOpen,
  completedCount,
  onContinue,
  onRestart,
  onClose,
}: EditModeModalProps) {
  const pluralSuffix = completedCount !== 1 ? 's' : '';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="How to Apply Changes?" size="md">
      <div className="space-y-4">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          You have {completedCount} completed workout{pluralSuffix} in this cycle. How would you
          like to apply your changes?
        </p>

        <div className="space-y-3">
          <button
            onClick={onContinue}
            className="w-full p-4 text-left rounded-lg border border-gray-200 dark:border-dark-border hover:border-primary-500 dark:hover:border-primary-500 transition-colors"
          >
            <div className="font-medium text-gray-900 dark:text-gray-100">
              Continue from current position
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Keep your {completedCount} completed workout{pluralSuffix} and apply changes to
              remaining workouts
            </p>
          </button>

          <button
            onClick={onRestart}
            className="w-full p-4 text-left rounded-lg border border-gray-200 dark:border-dark-border hover:border-primary-500 dark:hover:border-primary-500 transition-colors"
          >
            <div className="font-medium text-gray-900 dark:text-gray-100">Start fresh</div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Clear all progress and regenerate the entire cycle schedule
            </p>
          </button>
        </div>

        <Button variant="secondary" onClick={onClose} className="w-full">
          Cancel
        </Button>
      </div>
    </Modal>
  );
}
