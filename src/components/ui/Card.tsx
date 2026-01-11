import { type HTMLAttributes, forwardRef, memo } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'interactive';
}

const CardComponent = forwardRef<HTMLDivElement, CardProps>(
  ({ className = '', variant = 'default', children, ...props }, ref) => {
    const variants = {
      default: 'bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border',
      interactive: 'bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border hover:border-gray-300 dark:hover:border-dark-border-hover hover:shadow-md cursor-pointer transition-all'
    };

    return (
      <div
        ref={ref}
        className={`rounded-xl ${variants[variant]} ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  }
);

CardComponent.displayName = 'Card';

export const Card = memo(CardComponent);

// Sub-components
const CardHeaderComponent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className = '', children, ...props }, ref) => (
    <div ref={ref} className={`px-4 py-3 border-b border-gray-200 dark:border-dark-border ${className}`} {...props}>
      {children}
    </div>
  )
);
CardHeaderComponent.displayName = 'CardHeader';
export const CardHeader = memo(CardHeaderComponent);

const CardContentComponent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className = '', children, ...props }, ref) => (
    <div ref={ref} className={`px-4 py-4 ${className}`} {...props}>
      {children}
    </div>
  )
);
CardContentComponent.displayName = 'CardContent';
export const CardContent = memo(CardContentComponent);

const CardFooterComponent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className = '', children, ...props }, ref) => (
    <div ref={ref} className={`px-4 py-3 border-t border-gray-200 dark:border-dark-border ${className}`} {...props}>
      {children}
    </div>
  )
);
CardFooterComponent.displayName = 'CardFooter';
export const CardFooter = memo(CardFooterComponent);
