import { useState, useRef, useCallback, type ReactNode } from 'react';
import { Trash2, ChevronLeft } from 'lucide-react';
import { 
  SWIPE_THRESHOLD, 
  VELOCITY_THRESHOLD, 
  SWIPE_RESISTANCE, 
  SWIPE_MAX_TRANSLATE,
  SWIPE_ANIMATION_DURATION,
  TAP_THRESHOLD 
} from '@/constants';

interface SwipeableWorkoutCardProps {
  children: ReactNode;
  onSwipeLeft: () => void;   // Delete (will trigger confirmation)
  onTap: () => void;         // Open preview
  disabled?: boolean;
}

export function SwipeableWorkoutCard({ 
  children, 
  onSwipeLeft, 
  onTap,
  disabled = false 
}: SwipeableWorkoutCardProps) {
  const [translateX, setTranslateX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startXRef = useRef(0);
  const startTimeRef = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

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
    
    // Only allow left swipe (negative diff)
    if (diff > 0) {
      setTranslateX(0);
      return;
    }
    
    // Apply resistance at edge
    const resistance = SWIPE_RESISTANCE;
    const maxTranslate = SWIPE_MAX_TRANSLATE;
    
    let newTranslate = diff;
    if (Math.abs(diff) > maxTranslate) {
      newTranslate = -maxTranslate + (diff + maxTranslate) * resistance;
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
    
    // Check for swipe completion (left only)
    const meetsThreshold = Math.abs(translateX) >= SWIPE_THRESHOLD || velocity >= VELOCITY_THRESHOLD;
    
    if (meetsThreshold && translateX < 0) {
      // Animate off screen to the left then trigger action
      setTranslateX(-window.innerWidth);
      setTimeout(() => {
        onSwipeLeft();
        setTranslateX(0);
      }, SWIPE_ANIMATION_DURATION);
    } else {
      // Snap back
      setTranslateX(0);
    }
    
    setIsDragging(false);
  }, [isDragging, translateX, disabled, onSwipeLeft, onTap]);

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
    
    // Only allow left swipe
    if (diff > 0) {
      setTranslateX(0);
      return;
    }
    
    const resistance = SWIPE_RESISTANCE;
    const maxTranslate = SWIPE_MAX_TRANSLATE;
    
    let newTranslate = diff;
    if (Math.abs(diff) > maxTranslate) {
      newTranslate = -maxTranslate + (diff + maxTranslate) * resistance;
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
    
    const meetsThreshold = Math.abs(translateX) >= SWIPE_THRESHOLD || velocity >= VELOCITY_THRESHOLD;
    
    if (meetsThreshold && translateX < 0) {
      setTranslateX(-window.innerWidth);
      setTimeout(() => {
        onSwipeLeft();
        setTranslateX(0);
      }, SWIPE_ANIMATION_DURATION);
    } else {
      setTranslateX(0);
    }
    
    setIsDragging(false);
  }, [isDragging, translateX, disabled, onSwipeLeft, onTap]);

  const handleMouseLeave = useCallback(() => {
    if (isDragging) {
      setTranslateX(0);
      setIsDragging(false);
    }
  }, [isDragging]);

  // Calculate background color based on swipe
  const showLeftAction = translateX < -20;
  const leftProgress = Math.min(-translateX / SWIPE_THRESHOLD, 1);

  return (
    <div 
      ref={containerRef}
      className="relative overflow-hidden rounded-lg"
    >
      {/* Background action (Delete) */}
      <div className="absolute inset-0 flex">
        {/* Left swipe background (Delete) */}
        <div 
          className={`flex-1 flex items-center justify-end pr-4 transition-colors ${
            showLeftAction 
              ? leftProgress >= 1 
                ? 'bg-red-500' 
                : 'bg-red-400'
              : 'bg-red-100 dark:bg-red-900/30'
          }`}
        >
          <div className={`flex items-center gap-2 text-white transition-opacity ${showLeftAction ? 'opacity-100' : 'opacity-0'}`}>
            <span className="font-medium text-sm">Delete</span>
            <Trash2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Swipeable card content */}
      <div
        className={`relative bg-white dark:bg-gray-900 ${isDragging ? '' : 'transition-transform duration-200'}`}
        style={{ transform: `translateX(${translateX}px)` }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      >
        {children}
      </div>

      {/* Swipe hint indicator (subtle) */}
      {translateX === 0 && !isDragging && (
        <div className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-300 dark:text-gray-600 pointer-events-none">
          <ChevronLeft className="w-4 h-4" />
        </div>
      )}
    </div>
  );
}
