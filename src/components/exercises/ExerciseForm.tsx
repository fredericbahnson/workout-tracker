import { useState, type FormEvent } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Button, Input, NumberInput, Select } from '../ui';
import { useAppStore } from '../../stores/appStore';
import { 
  EXERCISE_TYPES, 
  EXERCISE_TYPE_LABELS, 
  type ExerciseFormData, 
  type CustomParameter,
  type Exercise 
} from '../../types';

interface ExerciseFormProps {
  initialData?: Exercise;
  onSubmit: (data: ExerciseFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function ExerciseForm({ initialData, onSubmit, onCancel, isLoading }: ExerciseFormProps) {
  const { defaults } = useAppStore();
  const [name, setName] = useState(initialData?.name || '');
  const [type, setType] = useState(initialData?.type || 'push');
  const [mode, setMode] = useState(initialData?.mode || 'standard');
  const [notes, setNotes] = useState(initialData?.notes || '');
  const [customParameters, setCustomParameters] = useState<CustomParameter[]>(
    initialData?.customParameters || []
  );
  const [initialMax, setInitialMax] = useState<string>('');
  const [startingReps, setStartingReps] = useState<number>(defaults.defaultConditioningReps);
  const [weightEnabled, setWeightEnabled] = useState(initialData?.weightEnabled || false);
  const [defaultWeight, setDefaultWeight] = useState<string>(
    initialData?.defaultWeight?.toString() || ''
  );

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    submitForm();
  };

  const submitForm = () => {
    if (!name.trim()) {
      console.log('Form validation failed: name is empty');
      return;
    }

    const data: ExerciseFormData = {
      name: name.trim(),
      type,
      mode,
      notes: notes.trim(),
      customParameters: customParameters.filter(p => p.name.trim()),
      initialMax: mode === 'standard' && initialMax ? parseInt(initialMax) : undefined,
      startingReps: mode === 'conditioning' ? startingReps : undefined,
      weightEnabled,
      defaultWeight: weightEnabled && defaultWeight ? parseFloat(defaultWeight) : undefined
    };
    
    console.log('Submitting exercise form:', data);
    onSubmit(data);
  };

  const addParameter = () => {
    setCustomParameters([
      ...customParameters,
      { name: '', type: 'text' }
    ]);
  };

  const updateParameter = (index: number, updates: Partial<CustomParameter>) => {
    setCustomParameters(params => 
      params.map((p, i) => i === index ? { ...p, ...updates } : p)
    );
  };

  const removeParameter = (index: number) => {
    setCustomParameters(params => params.filter((_, i) => i !== index));
  };

  const typeOptions = EXERCISE_TYPES.map(t => ({ 
    value: t, 
    label: EXERCISE_TYPE_LABELS[t] 
  }));

  const modeOptions = [
    { value: 'standard', label: 'Standard (uses RFEM)' },
    { value: 'conditioning', label: 'Conditioning (fixed reps)' }
  ];

  const paramTypeOptions = [
    { value: 'text', label: 'Text' },
    { value: 'number', label: 'Number' },
    { value: 'select', label: 'Select (options)' }
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Exercise Name"
        value={name}
        onChange={e => setName(e.target.value)}
        placeholder="e.g., Ring Rows"
        required
        autoFocus
      />

      <div className="grid grid-cols-2 gap-4">
        <Select
          label="Type"
          value={type}
          onChange={e => setType(e.target.value as typeof type)}
          options={typeOptions}
        />

        <Select
          label="Mode"
          value={mode}
          onChange={e => setMode(e.target.value as typeof mode)}
          options={modeOptions}
        />
      </div>

      {/* Weight Tracking Toggle */}
      <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <label className="text-sm font-medium text-gray-900 dark:text-gray-100">
              Track Added Weight
            </label>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Log weight added (e.g., weighted vest, dip belt)
            </p>
          </div>
          <button
            type="button"
            onClick={() => setWeightEnabled(!weightEnabled)}
            className={`
              relative inline-flex h-6 w-11 items-center rounded-full transition-colors
              ${weightEnabled 
                ? 'bg-primary-600' 
                : 'bg-gray-300 dark:bg-gray-600'
              }
            `}
          >
            <span
              className={`
                inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                ${weightEnabled ? 'translate-x-6' : 'translate-x-1'}
              `}
            />
          </button>
        </div>
        
        {weightEnabled && (
          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
            <Input
              label="Default Weight (lbs, optional)"
              type="number"
              min={0}
              step={0.5}
              value={defaultWeight}
              onChange={e => setDefaultWeight(e.target.value)}
              placeholder="e.g., 20"
            />
          </div>
        )}
      </div>

      {/* Initial Max - only show when creating and in standard mode */}
      {!initialData && mode === 'standard' && (
        <Input
          label="Initial Max Reps (optional)"
          type="number"
          min={1}
          value={initialMax}
          onChange={e => setInitialMax(e.target.value)}
          placeholder="Leave blank to set later"
        />
      )}

      {/* Starting Reps - only show when creating and in conditioning mode */}
      {!initialData && mode === 'conditioning' && (
        <NumberInput
          label="Starting Reps"
          value={startingReps}
          onChange={setStartingReps}
          min={1}
        />
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Notes
        </label>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="Form cues, variations, equipment needed..."
          rows={3}
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

      {/* Custom Parameters */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Custom Parameters
          </label>
          <Button type="button" variant="ghost" size="sm" onClick={addParameter}>
            <Plus className="w-4 h-4 mr-1" />
            Add
          </Button>
        </div>
        
        {customParameters.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No custom parameters. Add parameters to track things like strap length, band resistance, etc.
          </p>
        ) : (
          <div className="space-y-3">
            {customParameters.map((param, index) => (
              <div key={index} className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg space-y-2">
                <div className="flex items-start gap-2">
                  <div className="flex-1 grid grid-cols-2 gap-2">
                    <Input
                      placeholder="Parameter name"
                      value={param.name}
                      onChange={e => updateParameter(index, { name: e.target.value })}
                    />
                    <Select
                      value={param.type}
                      onChange={e => updateParameter(index, { type: e.target.value as CustomParameter['type'] })}
                      options={paramTypeOptions}
                    />
                  </div>
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="sm"
                    onClick={() => removeParameter(index)}
                    className="p-1.5 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
                
                {/* Options input for select type */}
                {param.type === 'select' && (
                  <Input
                    placeholder="Options (comma-separated, e.g.: 3 holes, 4 holes, 5 holes)"
                    value={param.options?.join(', ') || ''}
                    onChange={e => updateParameter(index, { 
                      options: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                    })}
                  />
                )}
                
                {/* Default value input */}
                {param.type === 'select' && param.options && param.options.length > 0 ? (
                  <Select
                    value={String(param.defaultValue || '')}
                    onChange={e => updateParameter(index, { defaultValue: e.target.value || undefined })}
                    options={[
                      { value: '', label: 'No default' },
                      ...param.options.map(opt => ({ value: opt, label: opt }))
                    ]}
                  />
                ) : param.type === 'number' ? (
                  <Input
                    type="number"
                    placeholder="Default value (optional)"
                    value={param.defaultValue !== undefined ? String(param.defaultValue) : ''}
                    onChange={e => updateParameter(index, { 
                      defaultValue: e.target.value ? parseFloat(e.target.value) : undefined 
                    })}
                  />
                ) : param.type === 'text' ? (
                  <Input
                    placeholder="Default value (optional)"
                    value={param.defaultValue !== undefined ? String(param.defaultValue) : ''}
                    onChange={e => updateParameter(index, { 
                      defaultValue: e.target.value || undefined 
                    })}
                  />
                ) : null}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
        <Button type="button" variant="secondary" onClick={onCancel} className="flex-1">
          Cancel
        </Button>
        <Button 
          type="submit" 
          disabled={!name.trim() || isLoading} 
          className="flex-1"
          onClick={(e) => {
            // Explicit click handler as mobile Safari fallback
            e.preventDefault();
            submitForm();
          }}
        >
          {isLoading ? 'Saving...' : (initialData ? 'Save Changes' : 'Add Exercise')}
        </Button>
      </div>
    </form>
  );
}
