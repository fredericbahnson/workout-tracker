import { describe, it, expect } from 'vitest';
import { getNextRatingInterval, shouldShowRatingPrompt } from './ratingPrompt';
import type { RatingPromptState } from '@/stores/appStore';

describe('getNextRatingInterval', () => {
  it('returns 10 for first two prompts', () => {
    expect(getNextRatingInterval(0)).toBe(10);
    expect(getNextRatingInterval(1)).toBe(10);
  });

  it('returns 15 for prompts 2-3', () => {
    expect(getNextRatingInterval(2)).toBe(15);
    expect(getNextRatingInterval(3)).toBe(15);
  });

  it('returns 20 for prompt 4 and beyond', () => {
    expect(getNextRatingInterval(4)).toBe(20);
    expect(getNextRatingInterval(5)).toBe(20);
    expect(getNextRatingInterval(10)).toBe(20);
  });
});

describe('shouldShowRatingPrompt', () => {
  const fresh: RatingPromptState = {
    ratingPromptCount: 0,
    ratingLastPromptedAt: 0,
    ratingCompleted: false,
  };

  it('does not show with fewer than 10 workouts', () => {
    expect(shouldShowRatingPrompt(0, fresh)).toBe(false);
    expect(shouldShowRatingPrompt(9, fresh)).toBe(false);
  });

  it('shows at exactly 10 workouts', () => {
    expect(shouldShowRatingPrompt(10, fresh)).toBe(true);
  });

  it('shows above 10 workouts if never prompted', () => {
    expect(shouldShowRatingPrompt(25, fresh)).toBe(true);
  });

  it('never shows when ratingCompleted is true', () => {
    const completed: RatingPromptState = { ...fresh, ratingCompleted: true };
    expect(shouldShowRatingPrompt(100, completed)).toBe(false);
  });

  it('respects escalating intervals after first prompt', () => {
    // After first prompt at 10 workouts, next at +10 = 20
    const afterFirst: RatingPromptState = {
      ratingPromptCount: 1,
      ratingLastPromptedAt: 10,
      ratingCompleted: false,
    };
    expect(shouldShowRatingPrompt(19, afterFirst)).toBe(false);
    expect(shouldShowRatingPrompt(20, afterFirst)).toBe(true);
  });

  it('uses interval of 15 after two prompts', () => {
    // After second prompt at 20, next at +15 = 35
    const afterSecond: RatingPromptState = {
      ratingPromptCount: 2,
      ratingLastPromptedAt: 20,
      ratingCompleted: false,
    };
    expect(shouldShowRatingPrompt(34, afterSecond)).toBe(false);
    expect(shouldShowRatingPrompt(35, afterSecond)).toBe(true);
  });

  it('uses interval of 20 after four prompts', () => {
    // After fourth prompt at 50, next at +20 = 70
    const afterFourth: RatingPromptState = {
      ratingPromptCount: 4,
      ratingLastPromptedAt: 50,
      ratingCompleted: false,
    };
    expect(shouldShowRatingPrompt(69, afterFourth)).toBe(false);
    expect(shouldShowRatingPrompt(70, afterFourth)).toBe(true);
  });

  it('follows full escalating schedule', () => {
    // Simulate the full schedule:
    // Prompt 1: at 10 (interval 10 from 0)
    // Prompt 2: at 20 (interval 10 from 10)
    // Prompt 3: at 35 (interval 15 from 20)
    // Prompt 4: at 50 (interval 15 from 35)
    // Prompt 5: at 70 (interval 20 from 50)
    // Prompt 6: at 90 (interval 20 from 70)
    const states: [number, RatingPromptState][] = [
      [10, { ratingPromptCount: 0, ratingLastPromptedAt: 0, ratingCompleted: false }],
      [20, { ratingPromptCount: 1, ratingLastPromptedAt: 10, ratingCompleted: false }],
      [35, { ratingPromptCount: 2, ratingLastPromptedAt: 20, ratingCompleted: false }],
      [50, { ratingPromptCount: 3, ratingLastPromptedAt: 35, ratingCompleted: false }],
      [70, { ratingPromptCount: 4, ratingLastPromptedAt: 50, ratingCompleted: false }],
      [90, { ratingPromptCount: 5, ratingLastPromptedAt: 70, ratingCompleted: false }],
    ];

    for (const [workouts, state] of states) {
      expect(shouldShowRatingPrompt(workouts - 1, state)).toBe(false);
      expect(shouldShowRatingPrompt(workouts, state)).toBe(true);
    }
  });
});
