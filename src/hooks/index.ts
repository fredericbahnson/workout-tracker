export { useOnlineStatus } from './useOnlineStatus';
export { useWorkoutDisplay } from './useWorkoutDisplay';
export { useCycleCompletion } from './useCycleCompletion';
export { useAdHocWorkout } from './useAdHocWorkout';
export { useSettingsState } from './useSettingsState';
export { useScheduledWorkoutStatus } from './useScheduledWorkoutStatus';
export { useProgressiveOnboarding } from './useProgressiveOnboarding';
export type { SettingsState } from './useSettingsState';

// iOS preparation hooks (with web fallbacks)
export { useHaptics } from './useHaptics';
export type { ImpactStyle, NotificationType, HapticsOptions } from './useHaptics';
export { useKeyboardHeight } from './useKeyboardHeight';
export type { KeyboardState, KeyboardHeightOptions } from './useKeyboardHeight';

// Page-specific hooks
export { useTodayModals } from './today';
export type {
  TodayModalType,
  ScheduledSetModalData,
  SkipSetModalData,
  EditCompletedSetModalData,
} from './today';

export { useScheduleModals, useScheduleData } from './schedule';
