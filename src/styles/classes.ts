/**
 * Tailwind Class Utilities
 *
 * Centralized class definitions for commonly repeated patterns.
 * Using these ensures consistency and makes theme changes easier.
 */

/**
 * Input field base styles
 */
export const inputClasses = {
  base: `
    px-3 py-2 rounded-lg border transition-colors
    bg-white dark:bg-dark-surface
    text-gray-900 dark:text-gray-100
    border-gray-300 dark:border-dark-border
    focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none
    placeholder:text-gray-400 dark:placeholder:text-gray-500
  `
    .trim()
    .replace(/\s+/g, ' '),

  disabled: 'disabled:opacity-50 disabled:cursor-not-allowed',

  error: 'border-red-500 focus:border-red-500 focus:ring-red-500/20',

  fullWidth: 'w-full',
} as const;

/**
 * Button variant styles
 */
export const buttonClasses = {
  base: 'inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed',

  sizes: {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  },

  variants: {
    primary: 'bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500',
    secondary:
      'bg-gray-100 text-gray-900 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700 focus:ring-gray-500',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
    ghost:
      'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 focus:ring-gray-500',
  },
} as const;

/**
 * Card styles
 */
export const cardClasses = {
  base: 'rounded-xl bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border',
  interactive:
    'hover:border-gray-300 dark:hover:border-dark-border-hover hover:shadow-md cursor-pointer transition-all',
} as const;

/**
 * Badge styles by exercise type
 */
export const badgeClasses = {
  base: 'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',

  exerciseTypes: {
    push: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    pull: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    legs: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    core: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    balance: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    mobility: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
    other: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
  },

  variants: {
    default: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
    outline: 'border border-gray-300 text-gray-700 dark:border-gray-600 dark:text-gray-300',
  },
} as const;

/**
 * Text styles
 */
export const textClasses = {
  // Headings
  h1: 'text-2xl font-bold text-gray-900 dark:text-gray-100',
  h2: 'text-xl font-semibold text-gray-900 dark:text-gray-100',
  h3: 'text-lg font-semibold text-gray-900 dark:text-gray-100',
  h4: 'text-base font-medium text-gray-900 dark:text-gray-100',

  // Body text
  body: 'text-gray-700 dark:text-gray-300',
  bodySmall: 'text-sm text-gray-600 dark:text-gray-400',
  muted: 'text-sm text-gray-500 dark:text-gray-400',

  // Labels
  label: 'text-sm font-medium text-gray-700 dark:text-gray-300',
  labelSmall: 'text-xs font-medium text-gray-500 dark:text-gray-400',

  // Status text
  error: 'text-red-600 dark:text-red-400',
  success: 'text-green-600 dark:text-green-400',
  warning: 'text-amber-600 dark:text-amber-400',
} as const;

/**
 * Layout utilities
 */
export const layoutClasses = {
  // Flex containers
  flexCenter: 'flex items-center justify-center',
  flexBetween: 'flex items-center justify-between',
  flexStart: 'flex items-center gap-2',
  flexCol: 'flex flex-col',

  // Grid
  grid2: 'grid grid-cols-2 gap-4',
  grid3: 'grid grid-cols-3 gap-4',

  // Spacing
  section: 'space-y-6',
  stack: 'space-y-4',
  stackSmall: 'space-y-2',
} as const;

/**
 * Animation classes
 */
export const animationClasses = {
  fadeIn: 'animate-fade-in',
  slideUp: 'animate-slide-up',
  pulse: 'animate-pulse',
  spin: 'animate-spin',
} as const;

/**
 * Skeleton loading styles
 */
export const skeletonClasses = {
  base: 'animate-pulse bg-gray-200 dark:bg-gray-700 rounded',
  text: 'h-4 rounded',
  textSmall: 'h-3 rounded',
  heading: 'h-6 rounded',
  avatar: 'rounded-full',
  card: 'rounded-xl',
} as const;
