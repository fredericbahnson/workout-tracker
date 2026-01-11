import { type HTMLAttributes, forwardRef, memo } from 'react';
import type { ExerciseType } from '@/types';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'outline' | ExerciseType;
}

const typeColors: Record<ExerciseType, string> = {
  push: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  pull: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  legs: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  core: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  balance: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  mobility: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
  other: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
};

const BadgeComponent = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className = '', variant = 'default', children, ...props }, ref) => {
    const isExerciseType = variant in typeColors;
    
    const baseStyles = 'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium';
    
    const variantStyles = isExerciseType 
      ? typeColors[variant as ExerciseType]
      : variant === 'outline'
        ? 'border border-gray-300 text-gray-700 dark:border-gray-600 dark:text-gray-300'
        : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';

    return (
      <span
        ref={ref}
        className={`${baseStyles} ${variantStyles} ${className}`}
        {...props}
      >
        {children}
      </span>
    );
  }
);

BadgeComponent.displayName = 'Badge';

export const Badge = memo(BadgeComponent);
