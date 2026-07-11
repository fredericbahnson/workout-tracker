/**
 * Selectable bordered card - the "pick one of these" pattern used for theme,
 * app mode, and font size in Settings (and reusable anywhere a radio-style
 * card choice is needed).
 *
 * Visuals match the former hand-rolled cards in AppearanceSection.
 */

import type { ReactNode } from 'react';

interface SelectionCardProps {
  selected: boolean;
  onSelect: () => void;
  title: string;
  description?: string;
  /** Leading visual: an icon, or any preview element (e.g. the "Aa" font sample) */
  icon?: ReactNode;
  /** Trailing element: badges like "Upgrade", lock icons, etc. */
  trailing?: ReactNode;
  /** Show a radio indicator dot (row layout only). Default 'none'. */
  indicator?: 'radio' | 'none';
  /** column = centered stack (theme/font grids), row = left-aligned (app-mode cards). Default 'column'. */
  layout?: 'row' | 'column';
  /**
   * Visual-only dimming; the card stays clickable so locked options can still
   * trigger actions like opening the paywall.
   */
  disabled?: boolean;
  className?: string;
}

export function SelectionCard({
  selected,
  onSelect,
  title,
  description,
  icon,
  trailing,
  indicator = 'none',
  layout = 'column',
  disabled = false,
  className = '',
}: SelectionCardProps) {
  const borderClasses = selected
    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
    : disabled
      ? 'border-gray-200 dark:border-dark-border opacity-60'
      : 'border-gray-200 dark:border-dark-border hover:border-gray-300 dark:hover:border-gray-600';

  const titleClasses = selected
    ? 'text-primary-600 dark:text-primary-400'
    : disabled
      ? 'text-gray-500 dark:text-gray-500'
      : 'text-gray-700 dark:text-gray-300';

  if (layout === 'row') {
    return (
      <button
        type="button"
        role="radio"
        aria-checked={selected}
        onClick={onSelect}
        className={`w-full p-3 rounded-lg border-2 transition-colors text-left ${borderClasses} ${className}`}
      >
        <div className="flex items-center gap-3">
          {indicator === 'radio' && (
            <div
              className={`
                w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0
                ${selected ? 'border-primary-500 bg-primary-500' : 'border-gray-300 dark:border-gray-600'}
              `}
            >
              {selected && <div className="w-2 h-2 rounded-full bg-white" />}
            </div>
          )}
          {icon}
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className={`text-sm font-medium ${titleClasses}`}>{title}</span>
            </div>
            {description && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{description}</p>
            )}
          </div>
          {trailing}
        </div>
      </button>
    );
  }

  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={`
        flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-colors
        ${borderClasses} ${className}
      `}
    >
      {icon}
      <span className={`text-sm font-medium ${titleClasses}`}>{title}</span>
      {description && <span className="text-xs text-gray-500">{description}</span>}
      {trailing}
    </button>
  );
}
