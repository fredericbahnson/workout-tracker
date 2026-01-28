import { useState, type FormEvent } from 'react';
import { Button, Input } from '@/components/ui';
import { formatWeightLabel, getWeightUnitLabel } from '@/constants';
import { useKeyboardHeight } from '@/hooks/useKeyboardHeight';

interface MaxRecordFormProps {
  currentMax?: number;
  currentMaxWeight?: number;
  weightEnabled?: boolean;
  defaultWeight?: number;
  onSubmit: (maxReps: number, notes: string, weight?: number) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function MaxRecordForm({
  currentMax,
  currentMaxWeight,
  weightEnabled,
  defaultWeight,
  onSubmit,
  onCancel,
  isLoading,
}: MaxRecordFormProps) {
  const [maxReps, setMaxReps] = useState(currentMax?.toString() || '');
  const [notes, setNotes] = useState('');
  const [weight, setWeight] = useState(
    currentMaxWeight?.toString() || defaultWeight?.toString() || ''
  );
  const { keyboardHeight } = useKeyboardHeight();

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const reps = parseInt(maxReps, 10);
    if (isNaN(reps) || reps < 1) return;
    const weightValue = weight ? parseFloat(weight) : undefined;
    onSubmit(reps, notes.trim(), weightValue);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" style={{ paddingBottom: keyboardHeight }}>
      <Input
        label="Maximum Reps"
        type="number"
        min={1}
        value={maxReps}
        onChange={e => setMaxReps(e.target.value)}
        placeholder="Enter your max reps"
        required
        autoFocus
      />

      {weightEnabled && (
        <Input
          label={formatWeightLabel('At Weight')}
          type="number"
          min={0}
          step={0.5}
          value={weight}
          onChange={e => setWeight(e.target.value)}
          placeholder="Bodyweight if blank"
        />
      )}

      {currentMax && (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Current max: {currentMax} reps
          {currentMaxWeight !== undefined &&
            currentMaxWeight > 0 &&
            ` @ +${currentMaxWeight} ${getWeightUnitLabel()}`}
        </p>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Notes (optional)
        </label>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="How did it feel? Any context?"
          rows={2}
          className="
            w-full px-3 py-2 rounded-lg border transition-colors
            bg-white dark:bg-gray-800
            text-gray-900 dark:text-gray-100
            border-gray-300 dark:border-gray-600
            focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none
            placeholder:text-gray-400 dark:placeholder:text-gray-500
          "
        />
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel} className="flex-1">
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={!maxReps || parseInt(maxReps, 10) < 1 || isLoading}
          className="flex-1"
        >
          {isLoading ? 'Saving...' : 'Record Max'}
        </Button>
      </div>
    </form>
  );
}
