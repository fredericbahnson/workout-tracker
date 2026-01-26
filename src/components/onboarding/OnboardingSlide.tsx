/**
 * OnboardingSlide Component
 *
 * Shared slide component used across all onboarding modules.
 * Provides consistent layout, animations, and styling.
 */

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui';
import type { OnboardingSlideProps } from './types';

export function OnboardingSlide({
  icon,
  image,
  headline,
  body,
  variant = 'default',
  gradient,
  primaryAction,
  secondaryAction,
  isLoading = false,
}: OnboardingSlideProps) {
  const [isVisible, setIsVisible] = useState(false);

  // Animate in on mount
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  // Variant-specific accent colors
  const variantColors = {
    default: 'from-primary-500 to-cyan-500',
    rfem: 'from-emerald-500 to-cyan-500',
    tour: 'from-purple-500 to-pink-500',
    exercise: 'from-orange-500 to-amber-500',
    health: 'from-rose-500 to-amber-500',
  };

  const accentGradient = gradient || variantColors[variant];

  return (
    <div
      className={`
        flex flex-col h-full transition-opacity duration-300
        ${isVisible ? 'opacity-100' : 'opacity-0'}
      `}
    >
      {/* Content area - centered vertically */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-8">
        {/* Icon or Image */}
        {image ? (
          <img
            src={image}
            alt=""
            className={`
              w-24 h-24 mb-6 rounded-3xl shadow-lg object-cover
              transition-transform duration-500 delay-100
              ${isVisible ? 'scale-100' : 'scale-90'}
            `}
          />
        ) : icon ? (
          <div
            className={`
              w-20 h-20 mb-6 rounded-2xl bg-gradient-to-br ${accentGradient}
              flex items-center justify-center shadow-lg
              transition-transform duration-500 delay-100
              ${isVisible ? 'scale-100' : 'scale-90'}
            `}
          >
            <div className="text-white">{icon}</div>
          </div>
        ) : null}

        {/* Headline */}
        <h2
          className={`
            text-2xl font-bold text-gray-900 dark:text-gray-100 text-center mb-4
            transition-all duration-500 delay-150
            ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}
          `}
        >
          {headline}
        </h2>

        {/* Body */}
        <div
          className={`
            text-gray-600 dark:text-gray-400 text-center text-base leading-relaxed max-w-sm
            transition-all duration-500 delay-200
            ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}
          `}
        >
          {body}
        </div>
      </div>

      {/* Actions - fixed at bottom */}
      <div
        className={`
          px-6 pb-6 pt-4 space-y-3
          transition-all duration-500 delay-300
          ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
        `}
      >
        <Button
          onClick={primaryAction.onClick}
          disabled={isLoading}
          className="w-full py-3 text-base font-medium"
        >
          {isLoading ? (
            <span className="flex items-center justify-center">
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              Loading...
            </span>
          ) : (
            <>
              {primaryAction.label}
              {primaryAction.icon && <span className="ml-2">{primaryAction.icon}</span>}
            </>
          )}
        </Button>

        {secondaryAction && (
          <Button
            variant="ghost"
            onClick={secondaryAction.onClick}
            disabled={isLoading}
            className="w-full py-2 text-sm"
          >
            {secondaryAction.label}
          </Button>
        )}
      </div>
    </div>
  );
}
