/**
 * Tooltip Component
 *
 * Contextual hint that appears for first-run education.
 * Positioned relative to a target element.
 */

import { useEffect, useState } from 'react';
import { X, Lightbulb } from 'lucide-react';
import { useTooltips, type TooltipId } from './TooltipContext';

interface TooltipProps {
  id: TooltipId;
  children: React.ReactNode;
  /** Position relative to target */
  position?: 'top' | 'bottom' | 'left' | 'right';
  /** Optional action button */
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function Tooltip({ id, children, position = 'bottom', action }: TooltipProps) {
  const { activeTooltip, dismissTooltip } = useTooltips();
  const [isVisible, setIsVisible] = useState(false);

  const isActive = activeTooltip === id;

  // Animate in
  useEffect(() => {
    if (isActive) {
      const timer = setTimeout(() => setIsVisible(true), 50);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
    }
  }, [isActive]);

  if (!isActive) return null;

  // Position classes
  const positionClasses = {
    top: 'bottom-full mb-2',
    bottom: 'top-full mt-2',
    left: 'right-full mr-2',
    right: 'left-full ml-2',
  };

  // Arrow classes
  const arrowClasses = {
    top: 'bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 rotate-45',
    bottom: 'top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 rotate-45',
    left: 'right-0 top-1/2 -translate-y-1/2 translate-x-1/2 rotate-45',
    right: 'left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 rotate-45',
  };

  return (
    <div
      className={`
        absolute z-50 ${positionClasses[position]}
        transition-all duration-200
        ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}
      `}
    >
      {/* Tooltip card */}
      <div className="relative bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-lg shadow-lg max-w-xs">
        {/* Arrow */}
        <div
          className={`absolute w-3 h-3 bg-gray-900 dark:bg-gray-100 ${arrowClasses[position]}`}
        />

        {/* Content */}
        <div className="relative p-3">
          {/* Header with icon and dismiss */}
          <div className="flex items-start justify-between gap-2 mb-1">
            <div className="flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-amber-400 dark:text-amber-600 flex-shrink-0" />
              <span className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-600">
                Tip
              </span>
            </div>
            <button
              onClick={dismissTooltip}
              className="p-1 -m-1 hover:bg-gray-800 dark:hover:bg-gray-200 rounded transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Message */}
          <div className="text-sm leading-relaxed">{children}</div>

          {/* Action button */}
          {action && (
            <button
              onClick={() => {
                action.onClick();
                dismissTooltip();
              }}
              className="mt-2 text-xs font-medium text-primary-400 dark:text-primary-600 hover:underline"
            >
              {action.label}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Wrapper component that positions a tooltip relative to its children.
 */
interface TooltipTargetProps {
  tooltipId: TooltipId;
  tooltip: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  children: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function TooltipTarget({
  tooltipId,
  tooltip,
  position = 'bottom',
  children,
  action,
}: TooltipTargetProps) {
  return (
    <div className="relative">
      {children}
      <Tooltip id={tooltipId} position={position} action={action}>
        {tooltip}
      </Tooltip>
    </div>
  );
}
