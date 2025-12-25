import { useState, type FormEvent } from 'react';
import { Button, Input, Select } from '../ui';
import type { Exercise, CustomParameter } from '../../types';

interface QuickLogFormProps {
  exercise: Exercise;
  suggestedReps?: number;
  onSubmit: (reps: number, notes: string, parameters: Record<string, string | number>, weight?: number) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function QuickLogForm({ 
  exercise, 
  suggestedReps, 
  onSubmit, 
  onCancel, 
  isLoading 
}: QuickLogFormProps) {
  const [reps, setReps] = useState(suggestedReps?.toString() || '');
  const [notes, setNotes] = useState('');
  const [weight, setWeight] = useState(exercise.defaultWeight?.toString() || '');
  const [parameters, setParameters] = useState<Record<string, string | number>>(() => {
    const initial: Record<string, string | number> = {};
    exercise.customParameters.forEach(p => {
      if (p.defaultValue !== undefined) {
        initial[p.name] = p.defaultValue;
      }
    });
    return initial;
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const repCount = parseInt(reps, 10);
    if (isNaN(repCount) || repCount < 0) return;
    const weightValue = weight ? parseFloat(weight) : undefined;
    onSubmit(repCount, notes.trim(), parameters, weightValue);
  };

  const updateParameter = (param: CustomParameter, value: string) => {
    setParameters(prev => ({
      ...prev,
      [param.name]: param.type === 'number' ? (parseFloat(value) || 0) : value
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="text-center pb-2">
        <h3 className="font-medium text-gray-900 dark:text-gray-100">
          {exercise.name}
        </h3>
        {suggestedReps && (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Target: {suggestedReps} reps
          </p>
        )}
      </div>

      <Input
        label="Reps Completed"
        type="number"
        min={0}
        value={reps}
        onChange={e => setReps(e.target.value)}
        placeholder="Enter reps"
        required
        autoFocus
      />

      {/* Weight Input - only show if exercise has weight tracking enabled */}
      {exercise.weightEnabled && (
        <Input
          label="Added Weight (lbs)"
          type="number"
          min={0}
          step={0.5}
          value={weight}
          onChange={e => setWeight(e.target.value)}
          placeholder="Bodyweight if blank"
        />
      )}

      {/* Custom Parameters */}
      {exercise.customParameters.length > 0 && (
        <div className="space-y-3">
          {exercise.customParameters.map(param => (
            <div key={param.name}>
              {param.type === 'select' && param.options ? (
                <Select
                  label={param.name}
                  value={String(parameters[param.name] || '')}
                  onChange={e => updateParameter(param, e.target.value)}
                  options={[
                    { value: '', label: 'Select...' },
                    ...param.options.map(opt => ({ value: opt, label: opt }))
                  ]}
                />
              ) : (
                <Input
                  label={param.name}
                  type={param.type === 'number' ? 'number' : 'text'}
                  value={String(parameters[param.name] || '')}
                  onChange={e => updateParameter(param, e.target.value)}
                  placeholder={`Enter ${param.name.toLowerCase()}`}
                />
              )}
            </div>
          ))}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Notes (optional)
        </label>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="Any notes about this set?"
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
          disabled={!reps || parseInt(reps, 10) < 0 || isLoading} 
          className="flex-1"
        >
          {isLoading ? 'Logging...' : 'Log Set'}
        </Button>
      </div>
    </form>
  );
}
