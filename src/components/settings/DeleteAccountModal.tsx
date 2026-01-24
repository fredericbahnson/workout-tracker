/**
 * DeleteAccountModal Component
 *
 * Confirmation modal for deleting user account.
 */

import { Modal, Button } from '@/components/ui';

interface DeleteAccountModalProps {
  isOpen: boolean;
  isDeleting: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export function DeleteAccountModal({
  isOpen,
  isDeleting,
  onConfirm,
  onClose,
}: DeleteAccountModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Delete Account">
      <div className="space-y-4">
        <p className="text-gray-600 dark:text-gray-400">
          Are you sure you want to delete your account? This will permanently remove:
        </p>
        <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400 space-y-1">
          <li>Your account and login credentials</li>
          <li>All cloud-synced data</li>
          <li>All local data on this device</li>
          <li>Any in-app purchases (Standard/Advanced)</li>
        </ul>
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg p-3">
          <p className="text-sm text-amber-700 dark:text-amber-300">
            <strong>Warning:</strong> If you have purchased Standard or Advanced, you will lose
            access and need to re-purchase if you create a new account.
          </p>
        </div>
        <p className="text-sm text-red-600 dark:text-red-400 font-medium">
          This action cannot be undone.
        </p>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button variant="danger" onClick={onConfirm} disabled={isDeleting} className="flex-1">
            {isDeleting ? 'Deleting...' : 'Delete Account'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
