import { type InputHTMLAttributes, forwardRef, useState, useEffect } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', label, error, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
    
    return (
      <div className="w-full">
        {label && (
          <label 
            htmlFor={inputId}
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`
            w-full px-3 py-2 rounded-lg border transition-colors
            bg-white dark:bg-dark-surface
            text-gray-900 dark:text-gray-100
            border-gray-300 dark:border-dark-border
            focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none
            placeholder:text-gray-400 dark:placeholder:text-gray-500
            disabled:bg-gray-50 disabled:dark:bg-dark-bg disabled:cursor-not-allowed
            ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}
            ${className}
          `}
          {...props}
        />
        {error && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

// Number input that properly handles empty state during editing
interface NumberInputProps {
  label?: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
}

export function NumberInput({ 
  label, 
  value, 
  onChange, 
  min = 0, 
  max,
  className = '',
  placeholder,
  disabled = false
}: NumberInputProps) {
  const [displayValue, setDisplayValue] = useState(value.toString());

  // Sync display value when external value changes
  useEffect(() => {
    setDisplayValue(value.toString());
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    
    // Allow empty string during editing
    if (rawValue === '') {
      setDisplayValue('');
      return;
    }
    
    // Only allow digits
    if (!/^\d*$/.test(rawValue)) return;
    
    setDisplayValue(rawValue);
    
    const parsed = parseInt(rawValue, 10);
    if (!isNaN(parsed)) {
      const bounded = max !== undefined ? Math.min(parsed, max) : parsed;
      onChange(Math.max(min, bounded));
    }
  };

  const handleBlur = () => {
    // On blur, if empty, reset to minimum
    if (displayValue === '' || isNaN(parseInt(displayValue, 10))) {
      setDisplayValue(min.toString());
      onChange(min);
    }
  };

  const inputId = label?.toLowerCase().replace(/\s+/g, '-');

  // If there's no label, render just the input (for inline use)
  if (!label) {
    return (
      <input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        value={displayValue}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder={placeholder}
        disabled={disabled}
        className={`
          px-3 py-2 rounded-lg border transition-colors
          bg-white dark:bg-dark-surface
          text-gray-900 dark:text-gray-100
          border-gray-300 dark:border-dark-border
          focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none
          placeholder:text-gray-400 dark:placeholder:text-gray-500
          disabled:opacity-50 disabled:cursor-not-allowed
          ${className}
        `}
      />
    );
  }

  return (
    <div className="w-full">
      <label 
        htmlFor={inputId}
        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
      >
        {label}
      </label>
      <input
        id={inputId}
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        value={displayValue}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder={placeholder}
        disabled={disabled}
        className={`
          w-full px-3 py-2 rounded-lg border transition-colors
          bg-white dark:bg-dark-surface
          text-gray-900 dark:text-gray-100
          border-gray-300 dark:border-dark-border
          focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none
          placeholder:text-gray-400 dark:placeholder:text-gray-500
          disabled:opacity-50 disabled:cursor-not-allowed
          ${className}
        `}
      />
    </div>
  );
}

// Time duration input in MM:SS format
interface TimeDurationInputProps {
  label?: string;
  value: number; // Total seconds
  onChange: (totalSeconds: number) => void;
  minSeconds?: number;
  maxSeconds?: number;
}

export function TimeDurationInput({
  label,
  value,
  onChange,
  minSeconds = 0,
  maxSeconds = 3600
}: TimeDurationInputProps) {
  const totalMinutes = Math.floor(value / 60);
  const remainingSeconds = value % 60;
  
  const [minutes, setMinutes] = useState(totalMinutes.toString());
  const [seconds, setSeconds] = useState(remainingSeconds.toString().padStart(2, '0'));

  // Sync when external value changes
  useEffect(() => {
    const newMinutes = Math.floor(value / 60);
    const newSeconds = value % 60;
    setMinutes(newMinutes.toString());
    setSeconds(newSeconds.toString().padStart(2, '0'));
  }, [value]);

  const updateValue = (newMinutes: number, newSeconds: number) => {
    let totalSeconds = (newMinutes * 60) + newSeconds;
    totalSeconds = Math.max(minSeconds, Math.min(maxSeconds, totalSeconds));
    onChange(totalSeconds);
  };

  const handleMinutesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    if (raw === '' || /^\d*$/.test(raw)) {
      setMinutes(raw);
      if (raw !== '') {
        const mins = parseInt(raw, 10);
        const secs = parseInt(seconds, 10) || 0;
        if (!isNaN(mins)) {
          updateValue(mins, secs);
        }
      }
    }
  };

  const handleSecondsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    if (raw === '' || /^\d*$/.test(raw)) {
      // Limit to 2 digits
      const limited = raw.slice(0, 2);
      setSeconds(limited);
      if (limited !== '') {
        const secs = Math.min(59, parseInt(limited, 10));
        const mins = parseInt(minutes, 10) || 0;
        if (!isNaN(secs)) {
          updateValue(mins, secs);
        }
      }
    }
  };

  const handleMinutesBlur = () => {
    if (minutes === '') {
      setMinutes('0');
      updateValue(0, parseInt(seconds, 10) || 0);
    }
  };

  const handleSecondsBlur = () => {
    const secs = parseInt(seconds, 10) || 0;
    const boundedSecs = Math.min(59, secs);
    setSeconds(boundedSecs.toString().padStart(2, '0'));
    updateValue(parseInt(minutes, 10) || 0, boundedSecs);
  };

  const inputClass = `
    w-16 px-3 py-2 rounded-lg border transition-colors text-center
    bg-white dark:bg-dark-surface
    text-gray-900 dark:text-gray-100
    border-gray-300 dark:border-dark-border
    focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none
  `;

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {label}
        </label>
      )}
      <div className="flex items-center gap-1">
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={minutes}
          onChange={handleMinutesChange}
          onBlur={handleMinutesBlur}
          className={inputClass}
          placeholder="0"
        />
        <span className="text-xl font-medium text-gray-500 dark:text-gray-400">:</span>
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={seconds}
          onChange={handleSecondsChange}
          onBlur={handleSecondsBlur}
          className={inputClass}
          placeholder="00"
          maxLength={2}
        />
        <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">min:sec</span>
      </div>
    </div>
  );
}
