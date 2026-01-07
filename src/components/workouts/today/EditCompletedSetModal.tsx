import { useState, useEffect } from 'react';
import { Modal, Button, NumberInput } from '../../ui';
import type { Exercise, CompletedSet } from '../../../types';

interface EditCompletedSetModalProps {
  /** The completed set being edited, or null if modal is closed */
  completedSet: CompletedSet | null;
  /** The exercise associated with the set */
  exercise: Exercise | null;
  /** Called when user saves changes */
  onSave: (reps: number, weight: number | undefined, notes: string) => Promise<void>;
  /** Called when user wants to delete and redo the set */
  onDelete: () => Promise<void>;
  /** Called when modal is closed */
  onClose: () => void;
}

/**
 * Modal for editing a completed set's reps, weight, and notes.
 * Also allows undoing the set to redo it.
 */
export function EditCompletedSetModal({
  completedSet,
  exercise,
  onSave,
  onDelete,
  onClose,
}: EditCompletedSetModalProps) {
  const [editReps, setEditReps] = useState(0);
  const [editWeight, setEditWeight] = useState<string>('');
  const [editNotes, setEditNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Reset form when completedSet changes
  useEffect(() => {
    if (completedSet) {
      setEditReps(completedSet.actualReps);
      setEditWeight(completedSet.weight?.toString() || '');
      setEditNotes(completedSet.notes || '');
    }
  }, [completedSet]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const weightValue = editWeight.trim() ? parseFloat(editWeight) : undefined;
      await onSave(editReps, weightValue, editNotes);
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    setIsSaving(true);
    try {
      await onDelete();
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  const isOpen = !!completedSet && !!exercise;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Completed Set"
    >
      {completedSet && exercise && (
        <div className="space-y-4">
          <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            <p className="font-medium text-gray-900 dark:text-gray-100">
              {exercise.name}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Target was {completedSet.targetReps} {exercise.measurementType === 'time' ? 'seconds' : 'reps'}
            </p>
          </div>

          <NumberInput
            label={exercise.measurementType === 'time' ? 'Actual Seconds' : 'Actual Reps'}
            value={editReps}
            onChange={setEditReps}
            min={0}
          />

          {/* Weight Input - only show if exercise has weight tracking enabled */}
          {exercise.weightEnabled && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Added Weight (lbs)
              </label>
              <input
                type="number"
                min={0}
                step={0.5}
                value={editWeight}
                onChange={(e) => setEditWeight(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Bodyweight if blank"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Notes
            </label>
            <textarea
              value={editNotes}
              onChange={(e) => setEditNotes(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              rows={2}
              placeholder="Optional notes..."
            />
          </div>

          <div className="flex gap-3">
            <Button 
              variant="ghost" 
              onClick={handleDelete}
              disabled={isSaving}
              className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
            >
              Undo & Redo
            </Button>
            <Button 
              variant="secondary" 
              onClick={onClose} 
              className="flex-1"
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSave}
              className="flex-1"
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
