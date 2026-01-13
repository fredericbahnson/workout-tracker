/**
 * Class Name Utility
 *
 * A lightweight utility for conditionally joining class names together.
 * Similar to clsx/classnames but without the dependency.
 *
 * Usage:
 *   cn('base-class', condition && 'conditional-class', className)
 *   cn('px-4 py-2', isActive && 'bg-blue-500', isDisabled && 'opacity-50')
 */

type ClassValue = string | boolean | null | undefined | ClassValue[];

/**
 * Combines class names, filtering out falsy values.
 *
 * @param classes - Class names or conditional expressions
 * @returns Combined class string
 *
 * @example
 * cn('btn', 'btn-primary') // 'btn btn-primary'
 * cn('btn', isActive && 'active') // 'btn active' or 'btn'
 * cn('btn', null, undefined, 'valid') // 'btn valid'
 * cn(['flex', 'items-center'], 'gap-2') // 'flex items-center gap-2'
 */
export function cn(...classes: ClassValue[]): string {
  return classes
    .flat()
    .filter((cls): cls is string => typeof cls === 'string' && cls.length > 0)
    .join(' ');
}

/**
 * Creates a class name builder for a component with variants.
 * Useful for components with multiple style variations.
 *
 * @param baseClasses - Classes always applied
 * @param variants - Map of variant names to their classes
 * @returns A function that builds the class string
 *
 * @example
 * const buttonClasses = createVariants(
 *   'px-4 py-2 rounded font-medium',
 *   {
 *     primary: 'bg-blue-500 text-white',
 *     secondary: 'bg-gray-200 text-gray-800',
 *     danger: 'bg-red-500 text-white',
 *   }
 * );
 *
 * buttonClasses('primary') // 'px-4 py-2 rounded font-medium bg-blue-500 text-white'
 * buttonClasses('secondary', 'mt-4') // 'px-4 py-2 rounded font-medium bg-gray-200 text-gray-800 mt-4'
 */
export function createVariants<T extends string>(baseClasses: string, variants: Record<T, string>) {
  return (variant: T, ...additionalClasses: ClassValue[]): string => {
    return cn(baseClasses, variants[variant], ...additionalClasses);
  };
}
