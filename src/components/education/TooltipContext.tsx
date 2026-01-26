/**
 * TooltipContext
 *
 * Context for managing first-run tooltips and contextual hints.
 * Tracks which tooltips have been shown to avoid repetition.
 */

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { useAppStore } from '@/stores/appStore';

export type TooltipId =
  | 'today-no-cycle'
  | 'set-card-first'
  | 'target-reps-why'
  | 'schedule-nudge'
  | 'first-workout';

interface TooltipState {
  /** Currently visible tooltip */
  activeTooltip: TooltipId | null;
  /** Show a tooltip if it hasn't been shown before */
  showTooltip: (id: TooltipId) => void;
  /** Dismiss the current tooltip */
  dismissTooltip: () => void;
  /** Check if a tooltip has been shown */
  hasSeenTooltip: (id: TooltipId) => boolean;
  /** Mark a tooltip as seen without showing it */
  markTooltipSeen: (id: TooltipId) => void;
}

const TooltipContext = createContext<TooltipState | null>(null);

interface TooltipProviderProps {
  children: ReactNode;
}

// Local storage key for tracking seen tooltips
const SEEN_TOOLTIPS_KEY = 'ascend-seen-tooltips';

function getSeenTooltips(): Set<TooltipId> {
  try {
    const stored = localStorage.getItem(SEEN_TOOLTIPS_KEY);
    if (stored) {
      return new Set(JSON.parse(stored) as TooltipId[]);
    }
  } catch {
    // Ignore parse errors
  }
  return new Set();
}

function saveSeenTooltips(tooltips: Set<TooltipId>) {
  try {
    localStorage.setItem(SEEN_TOOLTIPS_KEY, JSON.stringify([...tooltips]));
  } catch {
    // Ignore storage errors
  }
}

export function TooltipProvider({ children }: TooltipProviderProps) {
  const [activeTooltip, setActiveTooltip] = useState<TooltipId | null>(null);
  const [seenTooltips, setSeenTooltips] = useState<Set<TooltipId>>(getSeenTooltips);
  const hasCompletedOnboarding = useAppStore(state => state.hasCompletedOnboarding);

  const hasSeenTooltip = useCallback(
    (id: TooltipId): boolean => {
      return seenTooltips.has(id);
    },
    [seenTooltips]
  );

  const markTooltipSeen = useCallback((id: TooltipId) => {
    setSeenTooltips(prev => {
      const next = new Set(prev);
      next.add(id);
      saveSeenTooltips(next);
      return next;
    });
  }, []);

  const showTooltip = useCallback(
    (id: TooltipId) => {
      // Don't show tooltips during onboarding
      if (!hasCompletedOnboarding) return;

      // Don't show if already seen
      if (seenTooltips.has(id)) return;

      // Don't show if another tooltip is active
      if (activeTooltip) return;

      setActiveTooltip(id);
    },
    [hasCompletedOnboarding, seenTooltips, activeTooltip]
  );

  const dismissTooltip = useCallback(() => {
    if (activeTooltip) {
      markTooltipSeen(activeTooltip);
      setActiveTooltip(null);
    }
  }, [activeTooltip, markTooltipSeen]);

  return (
    <TooltipContext.Provider
      value={{
        activeTooltip,
        showTooltip,
        dismissTooltip,
        hasSeenTooltip,
        markTooltipSeen,
      }}
    >
      {children}
    </TooltipContext.Provider>
  );
}

export function useTooltips() {
  const context = useContext(TooltipContext);
  if (!context) {
    throw new Error('useTooltips must be used within a TooltipProvider');
  }
  return context;
}
