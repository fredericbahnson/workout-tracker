import { useState, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import { useAppStore } from '@/stores/appStore';
import { ScheduledWorkoutRepo } from '@/data/repositories';
import { shouldShowRatingPrompt } from '@/utils/ratingPrompt';
import { EXTERNAL_LINKS } from '@/constants/links';

export function useRatingPrompt() {
  const [showRatingModal, setShowRatingModal] = useState(false);
  const ratingPrompt = useAppStore(s => s.ratingPrompt);
  const setRatingPrompt = useAppStore(s => s.setRatingPrompt);

  const checkRatingPrompt = useCallback(async () => {
    if (!Capacitor.isNativePlatform()) return;
    if (ratingPrompt.ratingCompleted) return;

    const allCompleted = await ScheduledWorkoutRepo.getAllCompleted();
    const totalCount = allCompleted.length;

    if (shouldShowRatingPrompt(totalCount, ratingPrompt)) {
      setShowRatingModal(true);
      setRatingPrompt({
        ratingPromptCount: ratingPrompt.ratingPromptCount + 1,
        ratingLastPromptedAt: totalCount,
      });
    }
  }, [ratingPrompt, setRatingPrompt]);

  const handleRate = useCallback(() => {
    setShowRatingModal(false);
    setRatingPrompt({ ratingCompleted: true });
    window.open(EXTERNAL_LINKS.APP_STORE_REVIEW, '_blank');
  }, [setRatingPrompt]);

  const handleFeedback = useCallback(() => {
    setShowRatingModal(false);
    const subject = encodeURIComponent('Ascend Feedback');
    const body = encodeURIComponent('\n\n---\nSent from Ascend');
    window.open(`mailto:${EXTERNAL_LINKS.FEEDBACK_EMAIL}?subject=${subject}&body=${body}`, '_self');
  }, []);

  const handleDismiss = useCallback(() => {
    setShowRatingModal(false);
  }, []);

  return {
    showRatingModal,
    checkRatingPrompt,
    handleRate,
    handleFeedback,
    handleDismiss,
  };
}
