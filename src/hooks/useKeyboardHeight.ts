/**
 * useKeyboardHeight Hook
 *
 * Tracks virtual keyboard height for proper input positioning.
 * Uses visualViewport API on web browsers.
 * Will be enhanced with Capacitor Keyboard plugin when iOS integration is added.
 *
 * Usage:
 * ```tsx
 * const { keyboardHeight, isKeyboardVisible } = useKeyboardHeight();
 *
 * // Adjust content position when keyboard is visible
 * <div style={{ paddingBottom: keyboardHeight }}>
 *   <input />
 * </div>
 * ```
 *
 * The visualViewport API provides reliable keyboard detection on mobile browsers
 * by tracking viewport resize events. When the keyboard opens, the visual viewport
 * shrinks while the layout viewport stays the same, giving us the keyboard height.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';

/** Keyboard visibility state */
export interface KeyboardState {
  /** Current keyboard height in pixels (0 when hidden) */
  keyboardHeight: number;
  /** Whether the keyboard is currently visible */
  isKeyboardVisible: boolean;
  /** Whether keyboard tracking is supported on this device */
  isSupported: boolean;
}

/** Configuration options */
export interface KeyboardHeightOptions {
  /** Minimum height difference to consider as keyboard (default: 100px) */
  minHeight?: number;
  /** Callback when keyboard visibility changes */
  onVisibilityChange?: (visible: boolean, height: number) => void;
}

/**
 * Check if running on native platform (Capacitor).
 */
function isNativePlatform(): boolean {
  // TODO: When Capacitor is added:
  // import { Capacitor } from '@capacitor/core';
  // return Capacitor.isNativePlatform();
  return false;
}

/**
 * Check if visualViewport API is available.
 */
function isVisualViewportSupported(): boolean {
  return (
    typeof window !== 'undefined' && 'visualViewport' in window && window.visualViewport !== null
  );
}

/**
 * Keyboard height tracking hook.
 */
export function useKeyboardHeight(options: KeyboardHeightOptions = {}): KeyboardState {
  const { minHeight = 100, onVisibilityChange } = options;

  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  const isSupported = useMemo(() => {
    return isNativePlatform() || isVisualViewportSupported();
  }, []);

  /**
   * Handle viewport resize (web implementation).
   */
  const handleViewportResize = useCallback(() => {
    if (!isVisualViewportSupported()) return;

    const viewport = window.visualViewport!;

    // Calculate keyboard height from viewport difference
    // When keyboard opens, visualViewport.height shrinks
    const heightDiff = window.innerHeight - viewport.height;

    // Only consider it a keyboard if the difference exceeds threshold
    // This filters out browser UI changes (address bar, etc.)
    const newHeight = heightDiff > minHeight ? heightDiff : 0;
    const newVisible = newHeight > 0;

    setKeyboardHeight(newHeight);
    setIsKeyboardVisible(newVisible);

    // Call visibility change callback if provided
    if (onVisibilityChange) {
      onVisibilityChange(newVisible, newHeight);
    }
  }, [minHeight, onVisibilityChange]);

  /**
   * Set up native keyboard listeners (when Capacitor is available).
   */
  const setupNativeListeners = useCallback(() => {
    if (!isNativePlatform()) return undefined;

    // TODO: When Capacitor is added:
    // import { Keyboard, KeyboardInfo } from '@capacitor/keyboard';
    //
    // const showListener = Keyboard.addListener('keyboardWillShow', (info: KeyboardInfo) => {
    //   setKeyboardHeight(info.keyboardHeight);
    //   setIsKeyboardVisible(true);
    //   onVisibilityChange?.(true, info.keyboardHeight);
    // });
    //
    // const hideListener = Keyboard.addListener('keyboardWillHide', () => {
    //   setKeyboardHeight(0);
    //   setIsKeyboardVisible(false);
    //   onVisibilityChange?.(false, 0);
    // });
    //
    // return () => {
    //   showListener.remove();
    //   hideListener.remove();
    // };

    return undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- onVisibilityChange will be used when Capacitor is added
  }, [onVisibilityChange]);

  /**
   * Set up web viewport listeners.
   */
  const setupWebListeners = useCallback(() => {
    if (!isVisualViewportSupported()) return undefined;

    const viewport = window.visualViewport!;

    // Initial check
    handleViewportResize();

    // Listen for viewport resize events
    viewport.addEventListener('resize', handleViewportResize);
    viewport.addEventListener('scroll', handleViewportResize);

    return () => {
      viewport.removeEventListener('resize', handleViewportResize);
      viewport.removeEventListener('scroll', handleViewportResize);
    };
  }, [handleViewportResize]);

  useEffect(() => {
    // Use native implementation if available
    if (isNativePlatform()) {
      return setupNativeListeners();
    }

    // Fall back to web implementation
    return setupWebListeners();
  }, [setupNativeListeners, setupWebListeners]);

  return {
    keyboardHeight,
    isKeyboardVisible,
    isSupported,
  };
}

export default useKeyboardHeight;
