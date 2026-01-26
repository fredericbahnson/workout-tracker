import React from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Local-only UI Preferences Store
 *
 * These preferences are stored in localStorage and are device-specific.
 * They do not sync across devices.
 *
 * Training preferences that sync across devices are managed by
 * SyncedPreferencesContext instead.
 */

export type Theme = 'light' | 'dark' | 'system';
export type RepDisplayMode = 'week' | 'cycle' | 'allTime';
export type FontSize = 'small' | 'default' | 'large' | 'xl';

/**
 * Progressive onboarding milestones for contextual education.
 * Tracks which key actions the user has completed to enable
 * contextual hints, nudges, and deferred education content.
 */
export interface OnboardingMilestones {
  identityShown: boolean;
  swipeDemoPracticed: boolean;
  firstExerciseCreated: boolean;
  firstMaxRecorded: boolean;
  firstSetLogged: boolean;
  firstCycleCreated: boolean;
  rfemDeepDiveSeen: boolean;
  cycleIntroSeen: boolean;
  maxTestingIntroSeen: boolean;
  adHocSessionCount: number;
}

const DEFAULT_MILESTONES: OnboardingMilestones = {
  identityShown: false,
  swipeDemoPracticed: false,
  firstExerciseCreated: false,
  firstMaxRecorded: false,
  firstSetLogged: false,
  firstCycleCreated: false,
  rfemDeepDiveSeen: false,
  cycleIntroSeen: false,
  maxTestingIntroSeen: false,
  adHocSessionCount: 0,
};

interface AppState {
  // Theme
  theme: Theme;
  setTheme: (theme: Theme) => void;

  // Font size
  fontSize: FontSize;
  setFontSize: (size: FontSize) => void;

  // Rep display mode
  repDisplayMode: RepDisplayMode;
  setRepDisplayMode: (mode: RepDisplayMode) => void;

  // Onboarding
  hasCompletedOnboarding: boolean;
  setHasCompletedOnboarding: (completed: boolean) => void;

  // Progressive onboarding milestones
  onboardingMilestones: OnboardingMilestones;
  setOnboardingMilestone: <K extends keyof OnboardingMilestones>(
    key: K,
    value: OnboardingMilestones[K]
  ) => void;
  resetOnboardingMilestones: () => void;

  // UI state (not persisted)
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    set => ({
      // Theme - default to system
      theme: 'system',
      setTheme: theme => set({ theme }),

      // Font size - default to 'default'
      fontSize: 'default',
      setFontSize: size => set({ fontSize: size }),

      // Rep display mode
      repDisplayMode: 'allTime',
      setRepDisplayMode: mode => set({ repDisplayMode: mode }),

      // Onboarding
      hasCompletedOnboarding: false,
      setHasCompletedOnboarding: completed => set({ hasCompletedOnboarding: completed }),

      // Progressive onboarding milestones
      onboardingMilestones: DEFAULT_MILESTONES,
      setOnboardingMilestone: (key, value) =>
        set(state => ({
          onboardingMilestones: {
            ...state.onboardingMilestones,
            [key]: value,
          },
        })),
      resetOnboardingMilestones: () => set({ onboardingMilestones: DEFAULT_MILESTONES }),

      // UI state
      sidebarOpen: false,
      setSidebarOpen: open => set({ sidebarOpen: open }),
    }),
    {
      name: 'ascend-settings',
      partialize: state => ({
        theme: state.theme,
        fontSize: state.fontSize,
        repDisplayMode: state.repDisplayMode,
        hasCompletedOnboarding: state.hasCompletedOnboarding,
        onboardingMilestones: state.onboardingMilestones,
        // Note: sidebarOpen is not persisted
      }),
      // Migration for existing users: if hasCompletedOnboarding is true but no milestones,
      // initialize all milestones as true (they've already been through onboarding)
      migrate: (persistedState: unknown, _version: number) => {
        const state = persistedState as Partial<AppState>;
        if (state.hasCompletedOnboarding && !state.onboardingMilestones) {
          return {
            ...state,
            onboardingMilestones: {
              identityShown: true,
              swipeDemoPracticed: true,
              firstExerciseCreated: true,
              firstMaxRecorded: true,
              firstSetLogged: true,
              firstCycleCreated: true,
              rfemDeepDiveSeen: true,
              cycleIntroSeen: true,
              maxTestingIntroSeen: true,
              adHocSessionCount: 0,
            },
          };
        }
        return state;
      },
      version: 1,
    }
  )
);

// Theme helper hook - applies theme to document and listens for system changes
export function useThemeEffect() {
  const { theme, setTheme } = useAppStore();

  // Apply theme to document and set up system theme listener
  React.useEffect(() => {
    const root = document.documentElement;

    const applyTheme = () => {
      if (theme === 'system') {
        const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        root.classList.toggle('dark', systemDark);
      } else {
        root.classList.toggle('dark', theme === 'dark');
      }
    };

    applyTheme();

    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (theme === 'system') {
        applyTheme();
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  return { theme, setTheme };
}

/**
 * @deprecated Use `useThemeEffect` instead. This legacy hook requires manual
 * `applyTheme()` calls, while `useThemeEffect` handles theme application
 * automatically via useEffect. This hook will be removed in a future version.
 *
 * Migration:
 * ```tsx
 * // Before (useTheme)
 * const { theme, setTheme, applyTheme } = useTheme();
 * const handleChange = (t) => { setTheme(t); applyTheme(t); };
 *
 * // After (useThemeEffect)
 * const { theme, setTheme } = useThemeEffect();
 * const handleChange = (t) => { setTheme(t); }; // Auto-applied!
 * ```
 */
export function useTheme() {
  const { theme, setTheme } = useAppStore();

  // Apply theme to document (for manual calls)
  const applyTheme = (newTheme: Theme) => {
    const root = document.documentElement;

    if (newTheme === 'system') {
      const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.classList.toggle('dark', systemDark);
    } else {
      root.classList.toggle('dark', newTheme === 'dark');
    }
  };

  return { theme, setTheme, applyTheme };
}
