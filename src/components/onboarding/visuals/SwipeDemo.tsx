/**
 * SwipeDemo Component
 *
 * Interactive swipe tutorial for onboarding.
 * Uses the same swipe mechanics as SwipeableSetCard but with
 * exaggerated visual feedback and tutorial hints.
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { CheckCircle, Hand, ArrowRight, Sparkles } from 'lucide-react';
import {
  SWIPE_THRESHOLD,
  VELOCITY_THRESHOLD,
  SWIPE_RESISTANCE,
  SWIPE_MAX_TRANSLATE,
  SWIPE_ANIMATION_DURATION,
} from '@/constants';

interface SwipeDemoProps {
  exercise: string;
  targetReps: number;
  onComplete: () => void;
  showHint?: boolean;
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

export function SwipeDemo({ exercise, targetReps, onComplete, showHint = true }: SwipeDemoProps) {
  const [translateX, setTranslateX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const startXRef = useRef(0);
  const startTimeRef = useRef(0);

  // Animated hint
  const [hintVisible, setHintVisible] = useState(showHint);

  // Hide hint after first interaction
  useEffect(() => {
    if (isDragging && hintVisible) {
      setHintVisible(false);
    }
  }, [isDragging, hintVisible]);

  const handleDragStart = useCallback(
    (clientX: number) => {
      if (isCompleted) return;
      startXRef.current = clientX;
      startTimeRef.current = Date.now();
      setIsDragging(true);
    },
    [isCompleted]
  );

  const handleDragMove = useCallback(
    (clientX: number) => {
      if (!isDragging || isCompleted) return;
      const diff = clientX - startXRef.current;
      // Only allow right swipe for demo
      if (diff > 0) {
        setTranslateX(calculateSwipeTranslation(diff));
      }
    },
    [isDragging, isCompleted]
  );

  const handleDragEnd = useCallback(() => {
    if (!isDragging || isCompleted) return;

    const endTime = Date.now();
    const duration = endTime - startTimeRef.current;
    const velocity = Math.abs(translateX) / duration;

    const meetsThreshold = translateX >= SWIPE_THRESHOLD || velocity >= VELOCITY_THRESHOLD;

    if (meetsThreshold) {
      // Complete animation
      setTranslateX(window.innerWidth);
      setTimeout(() => {
        setIsCompleted(true);
        setShowCelebration(true);
        setTranslateX(0);

        // Celebration animation duration
        setTimeout(() => {
          setShowCelebration(false);
          onComplete();
        }, 1500);
      }, SWIPE_ANIMATION_DURATION);
    } else {
      // Snap back
      setTranslateX(0);
    }

    setIsDragging(false);
  }, [isDragging, translateX, isCompleted, onComplete]);

  // Touch handlers
  const handleTouchStart = (e: React.TouchEvent) => handleDragStart(e.touches[0].clientX);
  const handleTouchMove = (e: React.TouchEvent) => handleDragMove(e.touches[0].clientX);
  const handleTouchEnd = () => handleDragEnd();

  // Mouse handlers
  const handleMouseDown = (e: React.MouseEvent) => handleDragStart(e.clientX);
  const handleMouseMove = (e: React.MouseEvent) => handleDragMove(e.clientX);
  const handleMouseUp = () => handleDragEnd();
  const handleMouseLeave = () => {
    if (isDragging) {
      setTranslateX(0);
      setIsDragging(false);
    }
  };

  // Progress calculation for visual feedback
  const progress = Math.min(translateX / SWIPE_THRESHOLD, 1);

  // Celebration view
  if (showCelebration) {
    return (
      <div className="relative overflow-hidden rounded-xl">
        <div className="bg-green-500 rounded-xl p-6 text-center">
          <div className="flex flex-col items-center gap-3 text-white animate-in fade-in zoom-in duration-300">
            <div className="relative">
              <CheckCircle className="w-16 h-16" />
              <Sparkles className="w-6 h-6 absolute -top-1 -right-1 animate-pulse" />
            </div>
            <div>
              <div className="text-xl font-bold">Set Complete!</div>
              <div className="text-green-100 text-sm">That's how easy it is</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-xl">
      {/* Background action indicator */}
      <div
        className={`absolute inset-0 flex items-center justify-start pl-4 transition-all duration-150 rounded-xl ${
          progress > 0
            ? progress >= 1
              ? 'bg-green-500'
              : 'bg-green-400'
            : 'bg-green-100 dark:bg-green-900/30'
        }`}
      >
        <div
          className={`flex items-center gap-2 text-white transition-all duration-150 ${
            progress > 0.2 ? 'opacity-100 scale-100' : 'opacity-0 scale-90'
          }`}
        >
          <CheckCircle className="w-6 h-6" />
          <span className="font-semibold">Complete</span>
        </div>
      </div>

      {/* Swipeable card */}
      <div
        className={`relative bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg border-2 ${
          progress >= 1 ? 'border-green-400' : 'border-gray-200 dark:border-gray-700'
        } ${isDragging ? '' : 'transition-transform duration-200'} cursor-grab active:cursor-grabbing`}
        style={{ transform: `translateX(${translateX}px)` }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      >
        {/* Set card content */}
        <div className="flex items-center justify-between">
          <div>
            <div className="font-semibold text-gray-900 dark:text-gray-100 text-lg">{exercise}</div>
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

        {/* Animated hint overlay */}
        {hintVisible && !isCompleted && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/10 dark:bg-black/30 rounded-xl pointer-events-none">
            <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 rounded-full shadow-lg animate-bounce-x">
              <Hand className="w-5 h-5 text-primary-500" />
              <ArrowRight className="w-5 h-5 text-primary-500" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Swipe right to complete
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Progress indicator */}
      {translateX > 0 && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200 dark:bg-gray-700 rounded-b-xl overflow-hidden">
          <div
            className="h-full bg-green-500 transition-all duration-75"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
      )}
    </div>
  );
}
