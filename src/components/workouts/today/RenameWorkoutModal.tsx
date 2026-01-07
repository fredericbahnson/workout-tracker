import { useState, useEffect } from 'react';
import { Modal, Button, Input } from '../../ui';

interface RenameWorkoutModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Initial name to populate the input */
  initialName: string;
  /** Called when modal is closed */
  onClose: () => void;
  /** Called when user saves the new name */
  onSave: (name: string) => void;
}

/**
 * Modal for renaming an ad-hoc workout.
 */
export function RenameWorkoutModal({
  isOpen,
  initialName,
  onClose,
  onSave,
}: RenameWorkoutModalProps) {
  const [name, setName] = useState(initialName);

  // Reset name when modal opens
  useEffect(() => {
    if (isOpen) {
      setName(initialName);
    }
  }, [isOpen, initialName]);

  const handleSave = () => {
    if (name.trim()) {
      onSave(name.trim());
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Rename Workout">
      <div className="space-y-4">
        <Input
          label="Workout Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter workout name"
        />
        <div className="flex gap-2">
          <Button 
            variant="secondary" 
            onClick={onClose} 
            className="flex-1"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSave}
            className="flex-1"
            disabled={!name.trim()}
          >
            Save
          </Button>
        </div>
      </div>
    </Modal>
  );
}
