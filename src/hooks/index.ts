export { useOnlineStatus } from './useOnlineStatus';
export { useWorkoutDisplay } from './useWorkoutDisplay';
export { useCycleCompletion } from './useCycleCompletion';
export { useAdHocWorkout } from './useAdHocWorkout';
export { useScheduledWorkoutStatus } from './useScheduledWorkoutStatus';

// iOS preparation hooks (with web fallbacks)
export { useKeyboardHeight } from './useKeyboardHeight';
export type { KeyboardState, KeyboardHeightOptions } from './useKeyboardHeight';

// Page-specific hooks
export { useTodayModals, useTodayLiveData, useTodayWorkoutActions } from './today';
export type {
  TodayModalType,
  ScheduledSetModalData,
  SkipSetModalData,
  EditCompletedSetModalData,
} from './today';

export { useScheduleModals, useScheduleData } from './schedule';
export { useRatingPrompt } from './useRatingPrompt';
