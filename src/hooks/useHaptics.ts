/**
 * useHaptics Hook
 *
 * Provides haptic feedback functionality with web fallback.
 * Uses navigator.vibrate() on web browsers that support it.
 * Will be enhanced with Capacitor Haptics plugin when iOS integration is added.
 *
 * Usage:
 * ```tsx
 * const { trigger, impact, notification, selection } = useHaptics();
 *
 * // Light tap feedback
 * selection();
 *
 * // Button press feedback
 * impact('light');
 *
 * // Success/error/warning feedback
 * notification('success');
 * ```
 */

import { useCallback, useMemo } from 'react';
import { Capacitor } from '@capacitor/core';

/** Impact style for physical feedback */
export type ImpactStyle = 'light' | 'medium' | 'heavy';

/** Notification type for semantic feedback */
export type NotificationType = 'success' | 'warning' | 'error';

/** Haptic feedback options */
export interface HapticsOptions {
  /** Whether haptics are enabled (respects user preference) */
  enabled?: boolean;
}

/**
 * Check if the Vibration API is available.
 */
function isVibrationSupported(): boolean {
  return typeof navigator !== 'undefined' && 'vibrate' in navigator;
}

/**
 * Check if running on native platform (Capacitor).
 */
function isNativePlatform(): boolean {
  return Capacitor.isNativePlatform();
}

/**
 * Vibration patterns for different haptic types (in milliseconds).
 * These approximate the feel of native haptics using web vibration.
 */
const VIBRATION_PATTERNS: {
  impact: Record<ImpactStyle, number[]>;
  notification: Record<NotificationType, number[]>;
  selection: number[];
} = {
  // Impact patterns
  impact: {
    light: [10],
    medium: [20],
    heavy: [30],
  },
  // Notification patterns
  notification: {
    success: [10, 50, 10],
    warning: [20, 50, 20],
    error: [30, 50, 30, 50, 30],
  },
  // Selection (light tap)
  selection: [5],
};

/**
 * Haptics hook providing feedback methods.
 */
export function useHaptics(options: HapticsOptions = {}) {
  const { enabled = true } = options;

  const isSupported = useMemo(() => {
    return isNativePlatform() || isVibrationSupported();
  }, []);

  /**
   * Trigger a vibration pattern (web fallback).
   */
  const vibrate = useCallback(
    (pattern: number | number[]) => {
      if (!enabled || !isVibrationSupported()) return;

      try {
        navigator.vibrate(pattern);
      } catch {
        // Silently fail - haptics are non-critical
      }
    },
    [enabled]
  );

  /**
   * Trigger impact feedback.
   * On native: Uses Capacitor Haptics plugin
   * On web: Uses Vibration API
   */
  const impact = useCallback(
    async (style: ImpactStyle = 'medium') => {
      if (!enabled) return;

      if (isNativePlatform()) {
        try {
          const { Haptics, ImpactStyle: CapImpactStyle } = await import('@capacitor/haptics');
          const styleMap = {
            light: CapImpactStyle.Light,
            medium: CapImpactStyle.Medium,
            heavy: CapImpactStyle.Heavy,
          };
          await Haptics.impact({ style: styleMap[style] });
        } catch {
          // Silently fail - haptics are non-critical
        }
        return;
      }

      // Web fallback
      vibrate(VIBRATION_PATTERNS.impact[style]);
    },
    [enabled, vibrate]
  );

  /**
   * Trigger notification feedback.
   * Semantic feedback for success/warning/error states.
   */
  const notification = useCallback(
    async (type: NotificationType = 'success') => {
      if (!enabled) return;

      if (isNativePlatform()) {
        try {
          const { Haptics, NotificationType: CapNotificationType } =
            await import('@capacitor/haptics');
          const typeMap = {
            success: CapNotificationType.Success,
            warning: CapNotificationType.Warning,
            error: CapNotificationType.Error,
          };
          await Haptics.notification({ type: typeMap[type] });
        } catch {
          // Silently fail - haptics are non-critical
        }
        return;
      }

      // Web fallback
      vibrate(VIBRATION_PATTERNS.notification[type]);
    },
    [enabled, vibrate]
  );

  /**
   * Trigger selection feedback.
   * Light tap for UI selections like toggles, checkboxes.
   */
  const selection = useCallback(async () => {
    if (!enabled) return;

    if (isNativePlatform()) {
      try {
        const { Haptics } = await import('@capacitor/haptics');
        await Haptics.selectionStart();
        await Haptics.selectionEnd();
      } catch {
        // Silently fail - haptics are non-critical
      }
      return;
    }

    // Web fallback
    vibrate(VIBRATION_PATTERNS.selection);
  }, [enabled, vibrate]);

  /**
   * Generic trigger function for custom patterns.
   */
  const trigger = useCallback(
    (pattern: number | number[]) => {
      if (!enabled) return;
      vibrate(pattern);
    },
    [enabled, vibrate]
  );

  return {
    /** Whether haptics are supported on this device */
    isSupported,
    /** Trigger impact feedback (light/medium/heavy) */
    impact,
    /** Trigger notification feedback (success/warning/error) */
    notification,
    /** Trigger selection feedback (light tap) */
    selection,
    /** Trigger custom vibration pattern */
    trigger,
  };
}

export default useHaptics;
