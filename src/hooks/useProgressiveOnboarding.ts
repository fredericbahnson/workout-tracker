/**
 * useProgressiveOnboarding Hook
 *
 * Provides convenient access to onboarding milestones and
 * contextual nudge logic for progressive education.
 */

import { useCallback, useMemo } from 'react';
import { useAppStore, type OnboardingMilestones } from '@/stores/appStore';

interface ProgressiveOnboardingState {
  /** All milestone states */
  milestones: OnboardingMilestones;

  /** Whether user has completed basic onboarding */
  hasCompletedOnboarding: boolean;

  /** Update a specific milestone */
  setMilestone: <K extends keyof OnboardingMilestones>(
    key: K,
    value: OnboardingMilestones[K]
  ) => void;

  /** Increment ad-hoc session count */
  incrementAdHocSessions: () => void;

  /** Check if should show RFEM deep dive prompt */
  shouldShowRFEMPrompt: boolean;

  /** Check if should show cycle creation nudge */
  shouldShowCycleNudge: boolean;

  /** Check if should show cycle intro modal */
  shouldShowCycleIntro: boolean;

  /** Check if should show max testing intro modal */
  shouldShowMaxTestingIntro: boolean;

  /** Mark RFEM deep dive as seen (user dismissed or completed) */
  dismissRFEMPrompt: () => void;

  /** Mark cycle intro as seen */
  dismissCycleIntro: () => void;

  /** Mark max testing intro as seen */
  dismissMaxTestingIntro: () => void;
}

export function useProgressiveOnboarding(): ProgressiveOnboardingState {
  const milestones = useAppStore(state => state.onboardingMilestones);
  const hasCompletedOnboarding = useAppStore(state => state.hasCompletedOnboarding);
  const setOnboardingMilestone = useAppStore(state => state.setOnboardingMilestone);

  // Update a milestone
  const setMilestone = useCallback(
    <K extends keyof OnboardingMilestones>(key: K, value: OnboardingMilestones[K]) => {
      setOnboardingMilestone(key, value);
    },
    [setOnboardingMilestone]
  );

  // Increment ad-hoc session count
  const incrementAdHocSessions = useCallback(() => {
    setOnboardingMilestone('adHocSessionCount', milestones.adHocSessionCount + 1);
  }, [setOnboardingMilestone, milestones.adHocSessionCount]);

  // Computed: Should show RFEM deep dive prompt
  // Shows after first set is logged but RFEM guide hasn't been seen
  const shouldShowRFEMPrompt = useMemo(() => {
    return hasCompletedOnboarding && milestones.firstSetLogged && !milestones.rfemDeepDiveSeen;
  }, [hasCompletedOnboarding, milestones.firstSetLogged, milestones.rfemDeepDiveSeen]);

  // Computed: Should show cycle creation nudge
  // Shows after 3+ ad-hoc sessions without creating a cycle
  const shouldShowCycleNudge = useMemo(() => {
    return (
      hasCompletedOnboarding && milestones.adHocSessionCount >= 3 && !milestones.firstCycleCreated
    );
  }, [hasCompletedOnboarding, milestones.adHocSessionCount, milestones.firstCycleCreated]);

  // Computed: Should show cycle intro modal
  const shouldShowCycleIntro = useMemo(() => {
    return hasCompletedOnboarding && !milestones.cycleIntroSeen;
  }, [hasCompletedOnboarding, milestones.cycleIntroSeen]);

  // Computed: Should show max testing intro modal
  const shouldShowMaxTestingIntro = useMemo(() => {
    return hasCompletedOnboarding && !milestones.maxTestingIntroSeen;
  }, [hasCompletedOnboarding, milestones.maxTestingIntroSeen]);

  // Dismiss actions
  const dismissRFEMPrompt = useCallback(() => {
    setOnboardingMilestone('rfemDeepDiveSeen', true);
  }, [setOnboardingMilestone]);

  const dismissCycleIntro = useCallback(() => {
    setOnboardingMilestone('cycleIntroSeen', true);
  }, [setOnboardingMilestone]);

  const dismissMaxTestingIntro = useCallback(() => {
    setOnboardingMilestone('maxTestingIntroSeen', true);
  }, [setOnboardingMilestone]);

  return {
    milestones,
    hasCompletedOnboarding,
    setMilestone,
    incrementAdHocSessions,
    shouldShowRFEMPrompt,
    shouldShowCycleNudge,
    shouldShowCycleIntro,
    shouldShowMaxTestingIntro,
    dismissRFEMPrompt,
    dismissCycleIntro,
    dismissMaxTestingIntro,
  };
}
