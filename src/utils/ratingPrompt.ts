import type { RatingPromptState } from '@/stores/appStore';

/**
 * Returns the number of additional completed workouts required
 * before the next rating prompt should appear.
 *
 * Schedule:
 *   Prompt 0 (first): after 10 total workouts
 *   Prompt 1: +10
 *   Prompt 2: +15
 *   Prompt 3: +15
 *   Prompt 4+: +20 each
 */
export function getNextRatingInterval(promptCount: number): number {
  if (promptCount <= 1) return 10;
  if (promptCount <= 3) return 15;
  return 20;
}

/**
 * Determines whether the rating prompt should be shown.
 */
export function shouldShowRatingPrompt(
  totalCompletedWorkouts: number,
  ratingPrompt: RatingPromptState
): boolean {
  if (ratingPrompt.ratingCompleted) return false;

  // First prompt at 10 workouts
  if (ratingPrompt.ratingPromptCount === 0) {
    return totalCompletedWorkouts >= 10;
  }

  // Subsequent prompts: escalating interval from last prompt point
  const interval = getNextRatingInterval(ratingPrompt.ratingPromptCount);
  const workoutsSinceLastPrompt = totalCompletedWorkouts - ratingPrompt.ratingLastPromptedAt;
  return workoutsSinceLastPrompt >= interval;
}
