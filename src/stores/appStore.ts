import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Theme = 'light' | 'dark' | 'system';
export type RepDisplayMode = 'week' | 'cycle' | 'allTime';

export interface AppDefaults {
  defaultMaxReps: number;
  defaultConditioningReps: number;
  conditioningWeeklyIncrement: number;
  weeklySetGoals: {
    push: number;
    pull: number;
    legs: number;
    core: number;
    balance: number;
    mobility: number;
    other: number;
  };
}

export interface RestTimerSettings {
  enabled: boolean;
  defaultDurationSeconds: number;
}

interface AppState {
  // Theme
  theme: Theme;
  setTheme: (theme: Theme) => void;
  
  // App defaults
  defaults: AppDefaults;
  setDefaults: (defaults: Partial<AppDefaults>) => void;
  setWeeklySetGoal: (type: keyof AppDefaults['weeklySetGoals'], value: number) => void;
  
  // Rep display mode
  repDisplayMode: RepDisplayMode;
  setRepDisplayMode: (mode: RepDisplayMode) => void;
  
  // Rest timer settings
  restTimer: RestTimerSettings;
  setRestTimer: (settings: Partial<RestTimerSettings>) => void;
  
  // Onboarding
  hasCompletedOnboarding: boolean;
  setHasCompletedOnboarding: (completed: boolean) => void;
  
  // UI state
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

const DEFAULT_SETTINGS: AppDefaults = {
  defaultMaxReps: 10,
  defaultConditioningReps: 30,
  conditioningWeeklyIncrement: 10,
  weeklySetGoals: {
    push: 10,
    pull: 10,
    legs: 10,
    core: 0,
    balance: 0,
    mobility: 0,
    other: 0
  }
};

const DEFAULT_REST_TIMER: RestTimerSettings = {
  enabled: false,
  defaultDurationSeconds: 180
};

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      // Theme - default to system
      theme: 'system',
      setTheme: (theme) => set({ theme }),
      
      // App defaults
      defaults: DEFAULT_SETTINGS,
      setDefaults: (newDefaults) => set((state) => ({ 
        defaults: { ...state.defaults, ...newDefaults } 
      })),
      setWeeklySetGoal: (type, value) => set((state) => ({
        defaults: {
          ...state.defaults,
          weeklySetGoals: {
            ...state.defaults.weeklySetGoals,
            [type]: value
          }
        }
      })),
      
      // Rep display mode
      repDisplayMode: 'allTime',
      setRepDisplayMode: (mode) => set({ repDisplayMode: mode }),
      
      // Rest timer settings
      restTimer: DEFAULT_REST_TIMER,
      setRestTimer: (settings) => set((state) => ({
        restTimer: { ...state.restTimer, ...settings }
      })),
      
      // Onboarding
      hasCompletedOnboarding: false,
      setHasCompletedOnboarding: (completed) => set({ hasCompletedOnboarding: completed }),
      
      // UI state
      sidebarOpen: false,
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
    }),
    {
      name: 'ascend-settings',
      partialize: (state) => ({ 
        theme: state.theme, 
        defaults: state.defaults, 
        repDisplayMode: state.repDisplayMode,
        restTimer: state.restTimer,
        hasCompletedOnboarding: state.hasCompletedOnboarding
      }),
    }
  )
);

// Theme helper hook
export function useTheme() {
  const { theme, setTheme } = useAppStore();
  
  // Apply theme to document
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
