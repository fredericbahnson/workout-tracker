/**
 * Segmented control - a pill-style radio group for picking one of a few options.
 *
 * Visuals match the former hand-rolled ViewToggle on the Schedule page.
 */

import type { LucideIcon } from 'lucide-react';

export interface SegmentedControlOption<T extends string> {
  value: T;
  label: string;
  icon?: LucideIcon;
}

interface SegmentedControlProps<T extends string> {
  options: SegmentedControlOption<T>[];
  value: T;
  onChange: (value: T) => void;
  /** Stretch segments to fill the container width */
  fullWidth?: boolean;
  'aria-label': string;
  className?: string;
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  fullWidth = false,
  'aria-label': ariaLabel,
  className = '',
}: SegmentedControlProps<T>) {
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={`
        ${fullWidth ? 'flex w-full' : 'inline-flex'}
        rounded-lg border border-gray-200 dark:border-dark-border p-0.5 bg-gray-100 dark:bg-gray-800
        ${className}
      `}
    >
      {options.map(({ value: optionValue, label, icon: Icon }) => {
        const selected = value === optionValue;
        return (
          <button
            key={optionValue}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(optionValue)}
            className={`
              flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors
              ${fullWidth ? 'flex-1' : ''}
              ${
                selected
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }
            `}
          >
            {Icon && <Icon className="w-4 h-4" />}
            {label}
          </button>
        );
      })}
    </div>
  );
}
