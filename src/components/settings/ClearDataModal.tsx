/**
 * ClearDataModal Component
 *
 * Confirmation modal for clearing all local data.
 */

import { Modal, Button } from '@/components/ui';

interface ClearDataModalProps {
  isOpen: boolean;
  isClearing: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export function ClearDataModal({ isOpen, isClearing, onConfirm, onClose }: ClearDataModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Clear All Data">
      <div className="space-y-4">
        <p className="text-gray-600 dark:text-gray-400">
          Are you sure you want to delete all data? This will permanently remove all exercises, max
          records, completed sets, and cycles. This action cannot be undone.
        </p>
        <p className="text-sm text-amber-600 dark:text-amber-400">
          Consider exporting a backup first.
        </p>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button variant="danger" onClick={onConfirm} disabled={isClearing} className="flex-1">
            {isClearing ? 'Clearing...' : 'Clear All Data'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
