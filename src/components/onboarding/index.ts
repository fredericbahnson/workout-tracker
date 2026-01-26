/**
 * Onboarding Components
 *
 * Components for the onboarding flow and revisitable guides.
 */

// Main components
export { AuthGate } from './AuthGate';
export { OnboardingFlow } from './OnboardingFlow';

// Standalone modules (can be accessed from Settings)
export { RFEMGuide, RFEM_GUIDE_SLIDES } from './RFEMGuide';
export { AppTour, APP_TOUR_SLIDES } from './AppTour';

// Shared components
export { OnboardingSlide } from './OnboardingSlide';
export { OnboardingProgress } from './OnboardingProgress';

// Individual slides
export * from './slides';

// Visual components
export * from './visuals';

// Types
export type { OnboardingChapter, SlideVariant } from './types';
