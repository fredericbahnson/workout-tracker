/**
 * ConfirmModal Component
 *
 * A generic confirmation modal for simple confirm/cancel dialogs.
 * For complex confirmations with custom content, consider creating
 * a specialized modal component instead.
 */

import { Modal, Button } from '@/components/ui';

interface ConfirmModalProps {
  /** Whether the modal is visible */
  isOpen: boolean;
  /** Called when the modal is closed (cancel or backdrop click) */
  onClose: () => void;
  /** Called when the confirm button is clicked */
  onConfirm: () => void;
  /** Modal title */
  title: string;
  /** Main message to display */
  message: string;
  /** Optional secondary message (displayed in smaller text) */
  secondaryMessage?: string;
  /** Text for the confirm button */
  confirmLabel?: string;
  /** Text for the cancel button */
  cancelLabel?: string;
  /** Button style variant */
  confirmVariant?: 'primary' | 'danger';
  /** Whether an action is in progress (disables buttons, shows loading text) */
  isLoading?: boolean;
  /** Loading text to show on confirm button */
  loadingLabel?: string;
  /** Optional children for custom content between message and buttons */
  children?: React.ReactNode;
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  secondaryMessage,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  confirmVariant = 'primary',
  isLoading = false,
  loadingLabel,
  children,
}: ConfirmModalProps) {
  const confirmButtonClass =
    confirmVariant === 'danger'
      ? 'bg-red-600 hover:bg-red-700 text-white disabled:bg-red-400'
      : undefined;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="space-y-4">
        <p className="text-gray-600 dark:text-gray-400">{message}</p>

        {secondaryMessage && (
          <p className="text-sm text-gray-500 dark:text-gray-500">{secondaryMessage}</p>
        )}

        {children}

        <div className="flex gap-3">
          <Button variant="secondary" onClick={onClose} disabled={isLoading} className="flex-1">
            {cancelLabel}
          </Button>
          <Button
            variant={confirmVariant === 'danger' ? undefined : 'primary'}
            className={`flex-1 ${confirmButtonClass || ''}`}
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? loadingLabel || `${confirmLabel}...` : confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
