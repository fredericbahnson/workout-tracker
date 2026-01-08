import { useState, useEffect, useCallback } from 'react';
import { CycleRepo } from '../data/repositories';
import type { Cycle } from '../types';

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
  /** Whether the standalone max testing modal is open */
  showStandaloneMaxTesting: boolean;
  /** The cycle that just completed (for modal display) */
  completedCycleForModal: Cycle | null;
  /** Handler: Start max testing after cycle completion */
  handleStartMaxTesting: () => Promise<void>;
  /** Handler: Create new cycle after completion (skipping max testing) */
  handleCreateNewCycleFromCompletion: () => Promise<void>;
  /** Handler: Dismiss the cycle completion modal */
  handleDismissCycleCompletion: () => Promise<void>;
  /** Handler: Max testing wizard completed */
  handleMaxTestingComplete: () => void;
  /** Handler: Open standalone max testing (not from cycle completion) */
  openStandaloneMaxTesting: () => void;
  /** Handler: Close standalone max testing */
  closeStandaloneMaxTesting: () => void;
  /** Handler: Cancel max testing wizard */
  handleCancelMaxTesting: () => void;
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

  // Show cycle completion modal when cycle finishes
  useEffect(() => {
    if (isCycleComplete && activeCycle && !showCycleCompletionModal && !showMaxTestingWizard && !showCycleWizard) {
      setCompletedCycleForModal(activeCycle);
      setShowCycleCompletionModal(true);
    }
  }, [isCycleComplete, activeCycle?.id, showCycleCompletionModal, showMaxTestingWizard, showCycleWizard]);

  // Start max testing after cycle completion
  const handleStartMaxTesting = useCallback(async () => {
    if (completedCycleForModal) {
      // Mark the cycle as completed
      await CycleRepo.update(completedCycleForModal.id, { status: 'completed' });
      setShowCycleCompletionModal(false);
      setShowMaxTestingWizard(true);
    }
  }, [completedCycleForModal]);

  // Create new cycle after completion (skipping max testing)
  const handleCreateNewCycleFromCompletion = useCallback(async () => {
    if (completedCycleForModal) {
      // Mark the cycle as completed
      await CycleRepo.update(completedCycleForModal.id, { status: 'completed' });
    }
    setShowCycleCompletionModal(false);
    setCompletedCycleForModal(null);
    onShowCycleWizard();
  }, [completedCycleForModal, onShowCycleWizard]);

  // Dismiss the cycle completion modal
  const handleDismissCycleCompletion = useCallback(async () => {
    if (completedCycleForModal) {
      // Mark the cycle as completed even if dismissed
      await CycleRepo.update(completedCycleForModal.id, { status: 'completed' });
    }
    setShowCycleCompletionModal(false);
    setCompletedCycleForModal(null);
  }, [completedCycleForModal]);

  // Max testing wizard completed
  const handleMaxTestingComplete = useCallback(() => {
    setShowMaxTestingWizard(false);
    setCompletedCycleForModal(null);
    // The max testing cycle is now active, user will see it
  }, []);

  // Cancel max testing wizard
  const handleCancelMaxTesting = useCallback(() => {
    setShowMaxTestingWizard(false);
    setCompletedCycleForModal(null);
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
    handleStartMaxTesting,
    handleCreateNewCycleFromCompletion,
    handleDismissCycleCompletion,
    handleMaxTestingComplete,
    openStandaloneMaxTesting,
    closeStandaloneMaxTesting,
    handleCancelMaxTesting,
  };
}
