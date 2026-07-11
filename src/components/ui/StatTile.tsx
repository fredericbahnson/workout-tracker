/**
 * Compact stat tile - centered value + label on a subtle background.
 * Extracted from the hand-rolled tiles on the Progress page.
 */

import type { ReactNode } from 'react';

interface StatTileProps {
  value: ReactNode;
  label: string;
  /** Override the value text size (default text-3xl) */
  valueClassName?: string;
}

export function StatTile({ value, label, valueClassName = 'text-3xl' }: StatTileProps) {
  return (
    <div className="text-center p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
      <p className={`${valueClassName} font-bold text-gray-900 dark:text-gray-100`}>{value}</p>
      <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
    </div>
  );
}
