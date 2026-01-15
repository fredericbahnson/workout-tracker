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
        // Note: sidebarOpen is not persisted
      }),
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
