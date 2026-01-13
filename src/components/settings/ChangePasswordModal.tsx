/**
 * ChangePasswordModal Component
 *
 * Modal for changing user password.
 */

import { Modal, Button, Input } from '@/components/ui';

interface ChangePasswordModalProps {
  isOpen: boolean;
  newPassword: string;
  confirmPassword: string;
  isChanging: boolean;
  onNewPasswordChange: (password: string) => void;
  onConfirmPasswordChange: (password: string) => void;
  onConfirm: () => void;
  onClose: () => void;
}

export function ChangePasswordModal({
  isOpen,
  newPassword,
  confirmPassword,
  isChanging,
  onNewPasswordChange,
  onConfirmPasswordChange,
  onConfirm,
  onClose,
}: ChangePasswordModalProps) {
  const handleClose = () => {
    onNewPasswordChange('');
    onConfirmPasswordChange('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Change Password">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            New Password
          </label>
          <Input
            type="password"
            value={newPassword}
            onChange={e => onNewPasswordChange(e.target.value)}
            placeholder="Enter new password (6+ characters)"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Confirm Password
          </label>
          <Input
            type="password"
            value={confirmPassword}
            onChange={e => onConfirmPasswordChange(e.target.value)}
            placeholder="Confirm new password"
          />
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={handleClose} className="flex-1">
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isChanging || !newPassword || !confirmPassword}
            className="flex-1"
          >
            {isChanging ? 'Changing...' : 'Change Password'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
