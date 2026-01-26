/**
 * SwipeDemo Component
 *
 * Interactive swipe tutorial for onboarding.
 * Uses the same swipe mechanics as SwipeableSetCard but with
 * exaggerated visual feedback and tutorial hints.
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { CheckCircle, Hand, ArrowRight, ArrowLeft, Sparkles, X, MousePointer } from 'lucide-react';
import {
  SWIPE_THRESHOLD,
  VELOCITY_THRESHOLD,
  SWIPE_RESISTANCE,
  SWIPE_MAX_TRANSLATE,
  SWIPE_ANIMATION_DURATION,
} from '@/constants';

type SwipeDemoMode = 'complete' | 'skip' | 'tap';

interface SwipeDemoProps {
  exercise: string;
  targetReps: number;
  onComplete: () => void;
  showHint?: boolean;
  mode?: SwipeDemoMode;
}

/**
 * Calculate swipe translation with resistance at edges.
 */
function calculateSwipeTranslation(diff: number): number {
  const maxTranslate = SWIPE_MAX_TRANSLATE;

  if (Math.abs(diff) > maxTranslate) {
    return diff > 0
      ? maxTranslate + (diff - maxTranslate) * SWIPE_RESISTANCE
      : -maxTranslate + (diff + maxTranslate) * SWIPE_RESISTANCE;
  }

  return diff;
}

export function SwipeDemo({
  exercise,
  targetReps,
  onComplete,
  showHint = true,
  mode = 'complete',
}: SwipeDemoProps) {
  const [translateX, setTranslateX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [showEditView, setShowEditView] = useState(false);
  const [editedReps, setEditedReps] = useState(targetReps);
  const startXRef = useRef(0);
  const startYRef = useRef(0);
  const startTimeRef = useRef(0);
  const hasDraggedRef = useRef(false);

  // Animated hint
  const [hintVisible, setHintVisible] = useState(showHint);

  // Hide hint after first interaction
  useEffect(() => {
    if ((isDragging || showEditView) && hintVisible) {
      setHintVisible(false);
    }
  }, [isDragging, showEditView, hintVisible]);

  // Sync editedReps when targetReps prop changes
  useEffect(() => {
    setEditedReps(targetReps);
  }, [targetReps]);

  const handleDragStart = useCallback(
    (clientX: number, clientY: number) => {
      // Dismiss hint immediately on any touch
      if (hintVisible) {
        setHintVisible(false);
      }
      if (isCompleted || mode === 'tap') return;
      startXRef.current = clientX;
      startYRef.current = clientY;
      startTimeRef.current = Date.now();
      hasDraggedRef.current = false;
      setIsDragging(true);
    },
    [isCompleted, mode, hintVisible]
  );

  const handleDragMove = useCallback(
    (clientX: number) => {
      if (!isDragging || isCompleted) return;
      const diff = clientX - startXRef.current;

      // Track if user has actually dragged
      if (Math.abs(diff) > 5) {
        hasDraggedRef.current = true;
      }

      // Allow translation in both directions during drag
      // Direction will be validated at drag end
      setTranslateX(calculateSwipeTranslation(diff));
    },
    [isDragging, isCompleted]
  );

  const handleDragEnd = useCallback(() => {
    if (!isDragging || isCompleted) return;

    const endTime = Date.now();
    const duration = endTime - startTimeRef.current;
    const velocity = Math.abs(translateX) / duration;
    const absTranslate = Math.abs(translateX);

    const meetsThreshold = absTranslate >= SWIPE_THRESHOLD || velocity >= VELOCITY_THRESHOLD;

    // Validate direction before completing
    const isCorrectDirection =
      (mode === 'complete' && translateX > 0) || (mode === 'skip' && translateX < 0);

    if (meetsThreshold && isCorrectDirection) {
      // Complete animation
      const direction = mode === 'skip' ? -1 : 1;
      setTranslateX(direction * window.innerWidth);
      setTimeout(() => {
        setIsCompleted(true);
        setShowCelebration(true);
        setTranslateX(0);

        // Celebration animation duration
        setTimeout(() => {
          setShowCelebration(false);
          onComplete();
        }, 2500);
      }, SWIPE_ANIMATION_DURATION);
    } else {
      // Snap back (wrong direction or insufficient distance)
      setTranslateX(0);
    }

    setIsDragging(false);
  }, [isDragging, translateX, isCompleted, onComplete, mode]);

  // Tap handler for 'tap' mode
  const handleTap = useCallback(() => {
    if (mode !== 'tap' || isCompleted) return;
    setShowEditView(true);
    setHintVisible(false);
  }, [mode, isCompleted]);

  const handleEditConfirm = useCallback(() => {
    setShowEditView(false);
    setIsCompleted(true);
    setShowCelebration(true);
    setTimeout(() => {
      setShowCelebration(false);
      onComplete();
    }, 2500);
  }, [onComplete]);

  // Touch handlers
  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => handleDragStart(e.touches[0].clientX, e.touches[0].clientY),
    [handleDragStart]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => handleDragMove(e.touches[0].clientX),
    [handleDragMove]
  );

  const handleTouchEnd = useCallback(() => handleDragEnd(), [handleDragEnd]);

  // Mouse handlers
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => handleDragStart(e.clientX, e.clientY),
    [handleDragStart]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => handleDragMove(e.clientX),
    [handleDragMove]
  );

  const handleMouseUp = useCallback(() => handleDragEnd(), [handleDragEnd]);

  const handleMouseLeave = useCallback(() => {
    if (isDragging) {
      setTranslateX(0);
      setIsDragging(false);
    }
  }, [isDragging]);

  // Click handler for tap mode
  const handleClick = useCallback(() => {
    // Dismiss hint on any click
    if (hintVisible) {
      setHintVisible(false);
    }
    if (mode === 'tap' && !hasDraggedRef.current) {
      handleTap();
    }
  }, [mode, handleTap, hintVisible]);

  // Increment/decrement handlers for edit view
  const handleDecrement = useCallback(() => {
    setEditedReps(prev => Math.max(1, prev - 1));
  }, []);

  const handleIncrement = useCallback(() => {
    setEditedReps(prev => prev + 1);
  }, []);

  // Progress calculation for visual feedback
  const progress = Math.min(Math.abs(translateX) / SWIPE_THRESHOLD, 1);

  // Configuration based on mode
  const modeConfig = {
    complete: {
      bgActive: 'bg-green-500',
      bgPartial: 'bg-green-400',
      bgIdle: 'bg-green-100 dark:bg-green-900/30',
      borderActive: 'border-green-400',
      icon: <CheckCircle className="w-6 h-6" />,
      label: 'Complete',
      celebrationBg: 'bg-green-500',
      celebrationTitle: 'Set Complete!',
      celebrationSub: "That's how easy it is",
      hintIcon: <ArrowRight className="w-5 h-5 text-primary-500" />,
      hintText: 'Swipe right to complete',
      progressColor: 'bg-green-500',
    },
    skip: {
      bgActive: 'bg-red-500',
      bgPartial: 'bg-red-400',
      bgIdle: 'bg-red-100 dark:bg-red-900/30',
      borderActive: 'border-red-400',
      icon: <X className="w-6 h-6" />,
      label: 'Skip',
      celebrationBg: 'bg-red-500',
      celebrationTitle: 'Set Skipped',
      celebrationSub: 'No worries, move on',
      hintIcon: <ArrowLeft className="w-5 h-5 text-red-500" />,
      hintText: 'Swipe left to skip',
      progressColor: 'bg-red-500',
    },
    tap: {
      bgActive: 'bg-primary-500',
      bgPartial: 'bg-primary-400',
      bgIdle: 'bg-primary-100 dark:bg-primary-900/30',
      borderActive: 'border-primary-400',
      icon: <MousePointer className="w-6 h-6" />,
      label: 'Edit',
      celebrationBg: 'bg-primary-500',
      celebrationTitle: 'Details Saved!',
      celebrationSub: 'Easy adjustments anytime',
      hintIcon: <MousePointer className="w-5 h-5 text-primary-500" />,
      hintText: 'Tap to edit details',
      progressColor: 'bg-primary-500',
    },
  };

  const config = modeConfig[mode];

  // Edit view for tap mode
  if (showEditView) {
    return (
      <div className="relative overflow-hidden rounded-xl">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg border-2 border-primary-400">
          <div className="mb-4">
            <div className="font-semibold text-gray-900 dark:text-gray-100 text-lg">{exercise}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Edit your reps</div>
          </div>

          <div className="flex items-center justify-center gap-4 mb-4 py-2">
            <button
              onClick={handleDecrement}
              className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300 text-xl font-bold"
            >
              −
            </button>
            <span className="text-3xl font-bold text-primary-600 dark:text-primary-400 w-16 text-center">
              {editedReps}
            </span>
            <button
              onClick={handleIncrement}
              className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300 text-xl font-bold"
            >
              +
            </button>
          </div>

          <button
            onClick={handleEditConfirm}
            className="w-full py-2.5 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600 transition-colors"
          >
            Save
          </button>
        </div>
      </div>
    );
  }

  // Celebration view
  if (showCelebration) {
    return (
      <div className="relative overflow-hidden rounded-xl">
        <div className={`${config.celebrationBg} rounded-xl p-6 text-center`}>
          <div className="flex flex-col items-center gap-3 text-white animate-in fade-in zoom-in duration-300">
            <div className="relative">
              {mode === 'skip' ? (
                <X className="w-16 h-16" />
              ) : mode === 'tap' ? (
                <CheckCircle className="w-16 h-16" />
              ) : (
                <CheckCircle className="w-16 h-16" />
              )}
              <Sparkles className="w-6 h-6 absolute -top-1 -right-1 animate-pulse" />
            </div>
            <div>
              <div className="text-xl font-bold">{config.celebrationTitle}</div>
              <div className="text-white/80 text-sm">{config.celebrationSub}</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <div className="relative overflow-hidden rounded-xl">
        {/* Background action indicator */}
        {mode !== 'tap' && (
          <div
            className={`absolute inset-0 flex items-center transition-all duration-150 rounded-xl pointer-events-none ${
              mode === 'skip' ? 'justify-end pr-4' : 'justify-start pl-4'
            } ${progress > 0 ? (progress >= 1 ? config.bgActive : config.bgPartial) : config.bgIdle}`}
          >
            <div
              className={`flex items-center gap-2 text-white transition-all duration-150 ${
                progress > 0.2 ? 'opacity-100 scale-100' : 'opacity-0 scale-90'
              }`}
            >
              {config.icon}
              <span className="font-semibold">{config.label}</span>
            </div>
          </div>
        )}

        {/* Swipeable/Tappable card */}
        <div
          className={`relative bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg border-2 ${
            progress >= 1 ? config.borderActive : 'border-gray-200 dark:border-gray-700'
          } ${isDragging ? '' : 'transition-transform duration-200'} ${
            mode === 'tap'
              ? 'cursor-pointer hover:border-primary-300'
              : 'cursor-grab active:cursor-grabbing'
          }`}
          style={{ transform: `translateX(${translateX}px)` }}
          onTouchStart={mode !== 'tap' ? handleTouchStart : undefined}
          onTouchMove={mode !== 'tap' ? handleTouchMove : undefined}
          onTouchEnd={mode !== 'tap' ? handleTouchEnd : undefined}
          onMouseDown={mode !== 'tap' ? handleMouseDown : undefined}
          onMouseMove={mode !== 'tap' ? handleMouseMove : undefined}
          onMouseUp={mode !== 'tap' ? handleMouseUp : undefined}
          onMouseLeave={mode !== 'tap' ? handleMouseLeave : undefined}
          onClick={handleClick}
        >
          {/* Set card content */}
          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold text-gray-900 dark:text-gray-100 text-lg">
                {exercise}
              </div>
              <div className="text-gray-500 dark:text-gray-400">
                Target:{' '}
                <span className="font-medium text-primary-600 dark:text-primary-400">
                  {targetReps} reps
                </span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
              <span className="text-xl font-bold text-gray-400">1</span>
            </div>
          </div>
        </div>

        {/* Progress indicator */}
        {Math.abs(translateX) > 0 && mode !== 'tap' && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200 dark:bg-gray-700 rounded-b-xl overflow-hidden">
            <div
              className={`h-full ${config.progressColor} transition-all duration-75`}
              style={{ width: `${progress * 100}%` }}
            />
          </div>
        )}
      </div>

      {/* Animated hint - shown below card, not overlaying it */}
      {hintVisible && !isCompleted && mode !== 'tap' && (
        <div className="mt-4 flex justify-center animate-pulse">
          <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-full">
            {mode === 'complete' ? (
              <>
                <Hand className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                <span className="text-sm text-gray-600 dark:text-gray-400">Swipe</span>
                <ArrowRight className="w-5 h-5 text-green-500" />
              </>
            ) : (
              <>
                <ArrowLeft className="w-5 h-5 text-red-500" />
                <span className="text-sm text-gray-600 dark:text-gray-400">Swipe</span>
                <Hand className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              </>
            )}
          </div>
        </div>
      )}

      {/* Tap hint for tap mode */}
      {hintVisible && !isCompleted && mode === 'tap' && (
        <div className="mt-4 flex justify-center animate-pulse">
          <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-full">
            <MousePointer className="w-4 h-4 text-primary-500" />
            <span className="text-sm text-gray-600 dark:text-gray-400">Tap the card</span>
          </div>
        </div>
      )}
    </div>
  );
}
