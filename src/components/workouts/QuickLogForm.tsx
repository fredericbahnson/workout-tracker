import { useState, type FormEvent } from 'react';
import { Button, Input, NumberInput, Select } from '@/components/ui';
import { formatWeightLabel, formatWeightAt } from '@/constants';
import { formatTime, parseTimeInput, type Exercise, type CustomParameter } from '@/types';

interface QuickLogFormProps {
  exercise: Exercise;
  suggestedReps?: number; // For time-based, this is seconds
  suggestedWeight?: number; // Target weight from simple progression
  isMaxTest?: boolean;
  onSubmit: (
    reps: number,
    notes: string,
    parameters: Record<string, string | number>,
    weight?: number
  ) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function QuickLogForm({
  exercise,
  suggestedReps,
  suggestedWeight,
  isMaxTest,
  onSubmit,
  onCancel,
  isLoading,
}: QuickLogFormProps) {
  const isTimeBased = exercise.measurementType === 'time';

  // Time-based: string state for flexible format parsing (M:SS, 90s, etc.)
  const [timeValue, setTimeValue] = useState(() => {
    if (isTimeBased && suggestedReps !== undefined) return formatTime(suggestedReps);
    return '';
  });
  // Rep-based: numeric state for stepper +/- buttons
  const [repValue, setRepValue] = useState(() => {
    if (!isTimeBased && suggestedReps !== undefined) return suggestedReps;
    return 0;
  });
  const [notes, setNotes] = useState('');
  // Use suggested weight, then fall back to exercise default
  const [weight, setWeight] = useState(() => {
    if (suggestedWeight !== undefined && suggestedWeight > 0) {
      return suggestedWeight.toString();
    }
    return exercise.defaultWeight?.toString() || '';
  });
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

    let numericValue: number;
    if (isTimeBased) {
      const parsed = parseTimeInput(timeValue);
      if (parsed === null || parsed < 0) return;
      numericValue = parsed;
    } else {
      if (repValue < 0) return;
      numericValue = repValue;
    }

    const weightValue = weight ? parseFloat(weight) : undefined;
    onSubmit(numericValue, notes.trim(), parameters, weightValue);
  };

  const updateParameter = (param: CustomParameter, paramValue: string) => {
    setParameters(prev => ({
      ...prev,
      [param.name]: param.type === 'number' ? parseFloat(paramValue) || 0 : paramValue,
    }));
  };

  // Validate the current value
  const isValid = () => {
    if (isTimeBased) {
      if (!timeValue) return false;
      const parsed = parseTimeInput(timeValue);
      return parsed !== null && parsed >= 0;
    }
    return repValue >= 0;
  };

  // Format suggested value for display
  const formatSuggested = () => {
    if (suggestedReps === undefined) return null;
    const repsText = isTimeBased ? formatTime(suggestedReps) : `${suggestedReps} reps`;
    if (suggestedWeight !== undefined && suggestedWeight > 0) {
      return `${repsText} ${formatWeightAt(suggestedWeight)}`;
    }
    return repsText;
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="text-center pb-2">
        <h3 className="font-medium text-gray-900 dark:text-gray-100">{exercise.name}</h3>
        {isMaxTest ? (
          <p className="text-sm text-purple-600 dark:text-purple-400 font-medium">
            Max Test{suggestedReps ? ` • Previous: ${formatSuggested()}` : ''}
          </p>
        ) : suggestedReps ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">Target: {formatSuggested()}</p>
        ) : null}
      </div>

      {isTimeBased ? (
        <>
          <Input
            label={isMaxTest ? 'Time Achieved' : 'Time Completed'}
            type="text"
            value={timeValue}
            onChange={e => setTimeValue(e.target.value)}
            placeholder={isMaxTest ? 'e.g., 0:45, 1:30' : 'e.g., 0:30, 1:00'}
            required
            autoFocus
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 -mt-2">
            Enter as M:SS (1:30), seconds (90), or with units (90s, 1m30s)
          </p>
        </>
      ) : (
        <NumberInput
          label={isMaxTest ? 'Reps Achieved' : 'Reps Completed'}
          value={repValue}
          onChange={setRepValue}
          min={0}
          stepper
        />
      )}

      {/* Weight Input - only show if exercise has weight tracking enabled */}
      {exercise.weightEnabled && (
        <Input
          label={formatWeightLabel('Added Weight')}
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
                    ...param.options.map(opt => ({ value: opt, label: opt })),
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
        <Button type="submit" disabled={!isValid() || isLoading} className="flex-1">
          {isLoading ? 'Logging...' : 'Log Set'}
        </Button>
      </div>
    </form>
  );
}
