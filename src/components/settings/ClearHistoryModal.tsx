/**
 * ClearHistoryModal Component
 *
 * Confirmation modal for clearing workout history while keeping exercises and max records.
 */

import { AlertTriangle } from 'lucide-react';
import { Modal, Button } from '@/components/ui';

interface ClearHistoryModalProps {
  isOpen: boolean;
  isClearing: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export function ClearHistoryModal({
  isOpen,
  isClearing,
  onConfirm,
  onClose,
}: ClearHistoryModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Clear Workout History">
      <div className="space-y-4">
        <div className="flex gap-3 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
          <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-amber-800 dark:text-amber-200">
            <p className="font-medium">Looking for a fresh start after some time away?</p>
            <p className="mt-1 text-amber-700 dark:text-amber-300">
              This will give you a clean slate while keeping your exercise library and personal
              records.
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
            This will permanently delete:
          </p>
          <ul className="text-sm text-gray-600 dark:text-gray-400 list-disc list-inside space-y-1">
            <li>All completed workout sessions</li>
            <li>All logged sets and reps</li>
            <li>All training cycles (active and past)</li>
            <li>All scheduled workouts</li>
          </ul>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">This will be kept:</p>
          <ul className="text-sm text-gray-600 dark:text-gray-400 list-disc list-inside space-y-1">
            <li>Your exercise library</li>
            <li>Your max records (PRs, times, weights)</li>
            <li>Your account and subscription</li>
            <li>App settings and preferences</li>
          </ul>
        </div>

        <p className="text-sm text-red-600 dark:text-red-400 font-medium">
          This action cannot be undone.
        </p>

        <div className="flex gap-3 pt-2">
          <Button variant="secondary" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button variant="danger" onClick={onConfirm} disabled={isClearing} className="flex-1">
            {isClearing ? 'Clearing...' : 'Clear History'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
