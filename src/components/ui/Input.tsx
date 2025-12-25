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
            bg-white dark:bg-[#1A1A2E]
            text-gray-900 dark:text-gray-100
            border-gray-300 dark:border-[#2D2D4A]
            focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none
            placeholder:text-gray-400 dark:placeholder:text-gray-500
            disabled:bg-gray-50 disabled:dark:bg-[#121212] disabled:cursor-not-allowed
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
}

export function NumberInput({ 
  label, 
  value, 
  onChange, 
  min = 0, 
  max,
  className = '',
  placeholder
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
        className={`
          px-3 py-2 rounded-lg border transition-colors
          bg-white dark:bg-[#1A1A2E]
          text-gray-900 dark:text-gray-100
          border-gray-300 dark:border-[#2D2D4A]
          focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none
          placeholder:text-gray-400 dark:placeholder:text-gray-500
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
        className={`
          w-full px-3 py-2 rounded-lg border transition-colors
          bg-white dark:bg-[#1A1A2E]
          text-gray-900 dark:text-gray-100
          border-gray-300 dark:border-[#2D2D4A]
          focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none
          placeholder:text-gray-400 dark:placeholder:text-gray-500
          ${className}
        `}
      />
    </div>
  );
}
