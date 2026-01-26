/**
 * Onboarding Types
 *
 * Type definitions for the onboarding flow components.
 */

import type { ReactNode } from 'react';

/**
 * Chapters that can be revisited from Settings.
 */
export type OnboardingChapter = 'rfem_guide' | 'app_tour';

/**
 * Visual variant for slides.
 */
export type SlideVariant = 'default' | 'rfem' | 'tour' | 'exercise' | 'health';

/**
 * Props for the shared OnboardingSlide component.
 */
export interface OnboardingSlideProps {
  // Content
  icon?: ReactNode;
  image?: string;
  headline: string;
  body: ReactNode;

  // Visual customization
  variant?: SlideVariant;
  gradient?: string;

  // Actions
  primaryAction: {
    label: string;
    onClick: () => void;
    icon?: ReactNode;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };

  // State
  isLoading?: boolean;

  // Layout
  scrollable?: boolean; // Enable scrolling for long content
}

/**
 * Props for the OnboardingProgress component.
 */
export interface OnboardingProgressProps {
  totalSteps: number;
  currentStep: number;
  moduleBreaks?: number[]; // Indices where modules change
  onSkip?: () => void;
  showSkip?: boolean;
}

/**
 * Module definition for organizing slides.
 */
export interface OnboardingModule {
  id: string;
  name: string;
  slides: number; // Number of slides in this module
}

/**
 * Props for the RFEMCalculator visual component.
 */
export interface RFEMCalculatorProps {
  initialMax?: number;
  showRotation?: boolean;
  interactive?: boolean;
  className?: string;
}

/**
 * Props for the ProgressComparisonChart visual component.
 */
export interface ProgressComparisonChartProps {
  className?: string;
  animate?: boolean;
}
