import { cn } from '../../utils/cn';

interface FilterChipProps {
  /** Display label for the chip */
  label: string;
  /** Optional count to display after label */
  count?: number;
  /** Whether this chip is currently selected */
  isActive: boolean;
  /** Click handler */
  onClick: () => void;
  /** Additional className for customization */
  className?: string;
}

/**
 * A filter chip/button component for toggle-style filtering.
 * Used in list views to filter by category or type.
 */
export function FilterChip({ label, count, isActive, onClick, className }: FilterChipProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors',
        isActive
          ? 'bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900'
          : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
        className
      )}
    >
      {label}
      {count !== undefined && ` (${count})`}
    </button>
  );
}
