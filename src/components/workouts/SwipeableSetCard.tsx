import { useState, useRef, useCallback, type ReactNode, type KeyboardEvent } from 'react';
import { CheckCircle, X } from 'lucide-react';
import { 
  SWIPE_THRESHOLD, 
  VELOCITY_THRESHOLD, 
  SWIPE_RESISTANCE, 
  SWIPE_MAX_TRANSLATE,
  SWIPE_ANIMATION_DURATION,
  TAP_THRESHOLD 
} from '@/constants';

interface SwipeableSetCardProps {
  children: ReactNode;
  onSwipeRight: () => void;  // Complete
  onSwipeLeft: () => void;   // Skip (will trigger confirmation)
  onTap: () => void;         // Open details
  disabled?: boolean;
  /** Accessible label describing the set (e.g., "Push-ups: 12 reps") */
  ariaLabel?: string;
}

export function SwipeableSetCard({ 
  children, 
  onSwipeRight, 
  onSwipeLeft, 
  onTap,
  disabled = false,
  ariaLabel
}: SwipeableSetCardProps) {
  const [translateX, setTranslateX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startXRef = useRef(0);
  const startTimeRef = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Keyboard handler for accessibility
  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLDivElement>) => {
    if (disabled) return;

    switch (e.key) {
      case 'Enter':
      case ' ':
        // Enter or Space: open details (same as tap)
        e.preventDefault();
        onTap();
        break;
      case 'ArrowRight':
        // Right arrow: complete set
        e.preventDefault();
        // Visual feedback
        setTranslateX(window.innerWidth);
        setTimeout(() => {
          onSwipeRight();
          setTranslateX(0);
        }, SWIPE_ANIMATION_DURATION);
        break;
      case 'ArrowLeft':
        // Left arrow: skip set
        e.preventDefault();
        // Visual feedback
        setTranslateX(-window.innerWidth);
        setTimeout(() => {
          onSwipeLeft();
          setTranslateX(0);
        }, SWIPE_ANIMATION_DURATION);
        break;
    }
  }, [disabled, onTap, onSwipeRight, onSwipeLeft]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (disabled) return;
    startXRef.current = e.touches[0].clientX;
    startTimeRef.current = Date.now();
    setIsDragging(true);
  }, [disabled]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging || disabled) return;
    const currentX = e.touches[0].clientX;
    const diff = currentX - startXRef.current;
    
    // Apply resistance at edges
    const resistance = SWIPE_RESISTANCE;
    const maxTranslate = SWIPE_MAX_TRANSLATE;
    
    let newTranslate = diff;
    if (Math.abs(diff) > maxTranslate) {
      newTranslate = diff > 0 
        ? maxTranslate + (diff - maxTranslate) * resistance
        : -maxTranslate + (diff + maxTranslate) * resistance;
    }
    
    setTranslateX(newTranslate);
  }, [isDragging, disabled]);

  const handleTouchEnd = useCallback((_e: React.TouchEvent) => {
    if (!isDragging || disabled) return;
    
    const endTime = Date.now();
    const duration = endTime - startTimeRef.current;
    const velocity = Math.abs(translateX) / duration;
    
    // Check if it was a tap (minimal movement and short duration)
    if (Math.abs(translateX) < TAP_THRESHOLD.movement && duration < TAP_THRESHOLD.duration) {
      setTranslateX(0);
      setIsDragging(false);
      onTap();
      return;
    }
    
    // Check for swipe completion
    const isSwipeRight = translateX > 0;
    const meetsThreshold = Math.abs(translateX) >= SWIPE_THRESHOLD || velocity >= VELOCITY_THRESHOLD;
    
    if (meetsThreshold) {
      if (isSwipeRight) {
        // Animate off screen to the right then trigger action
        setTranslateX(window.innerWidth);
        setTimeout(() => {
          onSwipeRight();
          setTranslateX(0);
        }, SWIPE_ANIMATION_DURATION);
      } else {
        // Animate off screen to the left then trigger action
        setTranslateX(-window.innerWidth);
        setTimeout(() => {
          onSwipeLeft();
          setTranslateX(0);
        }, SWIPE_ANIMATION_DURATION);
      }
    } else {
      // Snap back
      setTranslateX(0);
    }
    
    setIsDragging(false);
  }, [isDragging, translateX, disabled, onSwipeRight, onSwipeLeft, onTap]);

  // Mouse events for desktop testing
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (disabled) return;
    startXRef.current = e.clientX;
    startTimeRef.current = Date.now();
    setIsDragging(true);
  }, [disabled]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging || disabled) return;
    const diff = e.clientX - startXRef.current;
    
    const resistance = SWIPE_RESISTANCE;
    const maxTranslate = SWIPE_MAX_TRANSLATE;
    
    let newTranslate = diff;
    if (Math.abs(diff) > maxTranslate) {
      newTranslate = diff > 0 
        ? maxTranslate + (diff - maxTranslate) * resistance
        : -maxTranslate + (diff + maxTranslate) * resistance;
    }
    
    setTranslateX(newTranslate);
  }, [isDragging, disabled]);

  const handleMouseUp = useCallback(() => {
    if (!isDragging || disabled) return;
    
    const endTime = Date.now();
    const duration = endTime - startTimeRef.current;
    const velocity = Math.abs(translateX) / duration;
    
    // Check if it was a click
    if (Math.abs(translateX) < TAP_THRESHOLD.movement && duration < TAP_THRESHOLD.duration) {
      setTranslateX(0);
      setIsDragging(false);
      onTap();
      return;
    }
    
    const isSwipeRight = translateX > 0;
    const meetsThreshold = Math.abs(translateX) >= SWIPE_THRESHOLD || velocity >= VELOCITY_THRESHOLD;
    
    if (meetsThreshold) {
      if (isSwipeRight) {
        setTranslateX(window.innerWidth);
        setTimeout(() => {
          onSwipeRight();
          setTranslateX(0);
        }, SWIPE_ANIMATION_DURATION);
      } else {
        setTranslateX(-window.innerWidth);
        setTimeout(() => {
          onSwipeLeft();
          setTranslateX(0);
        }, SWIPE_ANIMATION_DURATION);
      }
    } else {
      setTranslateX(0);
    }
    
    setIsDragging(false);
  }, [isDragging, translateX, disabled, onSwipeRight, onSwipeLeft, onTap]);

  const handleMouseLeave = useCallback(() => {
    if (isDragging) {
      setTranslateX(0);
      setIsDragging(false);
    }
  }, [isDragging]);

  // Calculate background colors based on swipe direction
  const showRightAction = translateX > 20;
  const showLeftAction = translateX < -20;
  const rightProgress = Math.min(translateX / SWIPE_THRESHOLD, 1);
  const leftProgress = Math.min(-translateX / SWIPE_THRESHOLD, 1);

  return (
    <div 
      ref={containerRef}
      className="relative overflow-hidden rounded-lg"
    >
      {/* Background actions */}
      <div className="absolute inset-0 flex" aria-hidden="true">
        {/* Right swipe background (Complete) */}
        <div 
          className={`flex-1 flex items-center justify-start pl-4 transition-colors ${
            showRightAction 
              ? rightProgress >= 1 
                ? 'bg-green-500' 
                : 'bg-green-400'
              : 'bg-green-100 dark:bg-green-900/30'
          }`}
        >
          <div className={`flex items-center gap-2 text-white transition-opacity ${showRightAction ? 'opacity-100' : 'opacity-0'}`}>
            <CheckCircle className="w-5 h-5" />
            <span className="font-medium text-sm">Complete</span>
          </div>
        </div>
        
        {/* Left swipe background (Skip) */}
        <div 
          className={`flex-1 flex items-center justify-end pr-4 transition-colors ${
            showLeftAction 
              ? leftProgress >= 1 
                ? 'bg-orange-500' 
                : 'bg-orange-400'
              : 'bg-orange-100 dark:bg-orange-900/30'
          }`}
        >
          <div className={`flex items-center gap-2 text-white transition-opacity ${showLeftAction ? 'opacity-100' : 'opacity-0'}`}>
            <span className="font-medium text-sm">Skip</span>
            <X className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Swipeable card content */}
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-label={ariaLabel || 'Exercise set. Press Enter to view details, Right arrow to complete, Left arrow to skip.'}
        aria-disabled={disabled}
        className={`relative bg-gray-50 dark:bg-dark-surface/50 ${isDragging ? '' : 'transition-transform duration-200'} outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900 rounded-lg`}
        style={{ transform: `translateX(${translateX}px)` }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onKeyDown={handleKeyDown}
      >
        {children}
      </div>
    </div>
  );
}
