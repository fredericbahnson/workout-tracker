import { useState, useEffect, useCallback } from 'react';
import { CycleRepo } from '@/data/repositories';
import type { Cycle } from '@/types';

interface UseCycleCompletionParams {
  /** Whether the cycle is complete (all workouts done) */
  isCycleComplete: boolean;
  /** The active cycle */
  activeCycle: Cycle | null | undefined;
  /** Whether the cycle wizard is currently showing */
  showCycleWizard: boolean;
  /** Called when user wants to create a new cycle */
  onShowCycleWizard: () => void;
}

interface UseCycleCompletionResult {
  /** Whether the cycle completion modal is open */
  showCycleCompletionModal: boolean;
  /** Whether the max testing wizard is open */
  showMaxTestingWizard: boolean;
  /** Whether the standalone max testing wizard is open */
  showStandaloneMaxTesting: boolean;
  /** The cycle that just completed (for modal display) */
  completedCycleForModal: Cycle | null;
  /** Whether the cycle is complete but user dismissed the modal (show create cycle button) */
  cycleCompleteDismissed: boolean;
  /** Handler: Start max testing after cycle completion */
  handleStartMaxTesting: () => Promise<void>;
  /** Handler: Create new cycle after completion (skipping max testing) */
  handleCreateNewCycleFromCompletion: () => Promise<void>;
  /** Handler: Dismiss the cycle completion modal */
  handleDismissCycleCompletion: () => void;
  /** Handler: Max testing wizard completed */
  handleMaxTestingComplete: () => void;
  /** Handler: Open standalone max testing (not from cycle completion) */
  openStandaloneMaxTesting: () => void;
  /** Handler: Close standalone max testing */
  closeStandaloneMaxTesting: () => void;
  /** Handler: Cancel max testing wizard */
  handleCancelMaxTesting: () => void;
  /** Handler: Show cycle completion modal again after dismissing */
  handleShowCycleCompletionModal: () => void;
}

/**
 * Manages the cycle completion flow including:
 * - Cycle completion modal (shown when all workouts done)
 * - Max testing wizard (optional after cycle completion)
 * - Standalone max testing (accessible from elsewhere)
 */
export function useCycleCompletion({
  isCycleComplete,
  activeCycle,
  showCycleWizard,
  onShowCycleWizard,
}: UseCycleCompletionParams): UseCycleCompletionResult {
  const [showCycleCompletionModal, setShowCycleCompletionModal] = useState(false);
  const [showMaxTestingWizard, setShowMaxTestingWizard] = useState(false);
  const [showStandaloneMaxTesting, setShowStandaloneMaxTesting] = useState(false);
  const [completedCycleForModal, setCompletedCycleForModal] = useState<Cycle | null>(null);
  // Track if user dismissed the completion modal (to avoid re-showing and enable inline buttons)
  const [cycleCompleteDismissed, setCycleCompleteDismissed] = useState(false);
  // Track which cycle was dismissed to reset when cycle changes
  const [dismissedCycleId, setDismissedCycleId] = useState<string | null>(null);

  // Reset dismissed state when active cycle changes
  useEffect(() => {
    if (activeCycle?.id !== dismissedCycleId) {
      setCycleCompleteDismissed(false);
      setDismissedCycleId(null);
    }
  }, [activeCycle?.id, dismissedCycleId]);

  // Show cycle completion modal when cycle finishes (only if not already dismissed)
  useEffect(() => {
    if (
      isCycleComplete &&
      activeCycle &&
      !showCycleCompletionModal &&
      !showMaxTestingWizard &&
      !showCycleWizard &&
      !cycleCompleteDismissed
    ) {
      setCompletedCycleForModal(activeCycle);
      setShowCycleCompletionModal(true);
    }
  }, [
    isCycleComplete,
    activeCycle,
    showCycleCompletionModal,
    showMaxTestingWizard,
    showCycleWizard,
    cycleCompleteDismissed,
  ]);

  // Start max testing after cycle completion
  const handleStartMaxTesting = useCallback(async () => {
    if (completedCycleForModal) {
      // Mark the cycle as completed when user explicitly chooses next action
      await CycleRepo.update(completedCycleForModal.id, { status: 'completed' });
      setShowCycleCompletionModal(false);
      setShowMaxTestingWizard(true);
      setCycleCompleteDismissed(false);
    }
  }, [completedCycleForModal]);

  // Create new cycle after completion (skipping max testing)
  const handleCreateNewCycleFromCompletion = useCallback(async () => {
    // Mark the cycle as completed when user explicitly creates new cycle
    const cycleToComplete = completedCycleForModal || activeCycle;
    if (cycleToComplete) {
      await CycleRepo.update(cycleToComplete.id, { status: 'completed' });
    }
    setShowCycleCompletionModal(false);
    setCompletedCycleForModal(null);
    setCycleCompleteDismissed(false);
    onShowCycleWizard();
  }, [completedCycleForModal, activeCycle, onShowCycleWizard]);

  // Dismiss the cycle completion modal WITHOUT marking cycle as completed
  // User stays on their completed workout view
  const handleDismissCycleCompletion = useCallback(() => {
    setShowCycleCompletionModal(false);
    setCycleCompleteDismissed(true);
    if (completedCycleForModal) {
      setDismissedCycleId(completedCycleForModal.id);
    }
    // Don't clear completedCycleForModal - keep it for potential re-show
  }, [completedCycleForModal]);

  // Show the cycle completion modal again (e.g., from inline button)
  const handleShowCycleCompletionModal = useCallback(() => {
    if (activeCycle) {
      setCompletedCycleForModal(activeCycle);
      setShowCycleCompletionModal(true);
      setCycleCompleteDismissed(false);
    }
  }, [activeCycle]);

  // Max testing wizard completed
  const handleMaxTestingComplete = useCallback(() => {
    setShowMaxTestingWizard(false);
    setCompletedCycleForModal(null);
    setCycleCompleteDismissed(false);
    // The max testing cycle is now active, user will see it
  }, []);

  // Cancel max testing wizard
  const handleCancelMaxTesting = useCallback(() => {
    setShowMaxTestingWizard(false);
    setCompletedCycleForModal(null);
    setCycleCompleteDismissed(false);
  }, []);

  // Open standalone max testing
  const openStandaloneMaxTesting = useCallback(() => {
    setShowStandaloneMaxTesting(true);
  }, []);

  // Close standalone max testing
  const closeStandaloneMaxTesting = useCallback(() => {
    setShowStandaloneMaxTesting(false);
  }, []);

  return {
    showCycleCompletionModal,
    showMaxTestingWizard,
    showStandaloneMaxTesting,
    completedCycleForModal,
    cycleCompleteDismissed,
    handleStartMaxTesting,
    handleCreateNewCycleFromCompletion,
    handleDismissCycleCompletion,
    handleMaxTestingComplete,
    openStandaloneMaxTesting,
    closeStandaloneMaxTesting,
    handleCancelMaxTesting,
    handleShowCycleCompletionModal,
  };
}
