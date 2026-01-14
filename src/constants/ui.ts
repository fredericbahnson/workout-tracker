/**
 * Shared UI constants for consistent styling across the app.
 *
 * These values are used for interactive gestures and other
 * UI behaviors that need to be consistent across components.
 */

// =============================================================================
// Swipe Gesture Constants
// =============================================================================

/** Pixels needed to trigger a swipe action */
export const SWIPE_THRESHOLD = 80;

/** Minimum velocity (pixels/ms) for a fast swipe to trigger */
export const VELOCITY_THRESHOLD = 0.3;

/** Resistance factor when dragging past max translate (0-1) */
export const SWIPE_RESISTANCE = 0.4;

/** Maximum pixels a swipeable element can translate before resistance */
export const SWIPE_MAX_TRANSLATE = 120;

/** Duration (ms) for swipe animations */
export const SWIPE_ANIMATION_DURATION = 200;

/** Maximum movement (px) and duration (ms) to consider as a tap/click */
export const TAP_THRESHOLD = {
  movement: 10,
  duration: 200,
};
