/**
 * WheelPicker Component
 *
 * iOS-style vertical scroll picker with smooth momentum scrolling.
 * Uses CSS scroll-snap for smooth, native-feeling selection.
 */

import { useRef, useEffect, useCallback } from 'react';

interface WheelPickerOption {
  value: number;
  label: string;
}

interface WheelPickerProps {
  options: WheelPickerOption[];
  value: number;
  onChange: (value: number) => void;
  height?: number; // Item height in px
  visibleItems?: number; // Number of visible items (default 5)
}

export function WheelPicker({
  options,
  value,
  onChange,
  height = 40,
  visibleItems = 5,
}: WheelPickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isScrollingRef = useRef(false);
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const totalHeight = height * visibleItems;
  const paddingItems = Math.floor(visibleItems / 2);

  // Find current index
  const currentIndex = options.findIndex(opt => opt.value === value);
  const validIndex = currentIndex >= 0 ? currentIndex : 0;

  // Scroll to the selected value on mount and when value changes externally
  useEffect(() => {
    if (containerRef.current && !isScrollingRef.current) {
      const targetScroll = validIndex * height;
      containerRef.current.scrollTop = targetScroll;
    }
  }, [validIndex, height]);

  // Handle scroll end and select the centered item
  const handleScroll = useCallback(() => {
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    isScrollingRef.current = true;

    scrollTimeoutRef.current = setTimeout(() => {
      if (containerRef.current) {
        const scrollTop = containerRef.current.scrollTop;
        const selectedIndex = Math.round(scrollTop / height);
        const clampedIndex = Math.max(0, Math.min(selectedIndex, options.length - 1));

        // Snap to exact position
        containerRef.current.scrollTop = clampedIndex * height;

        const selectedOption = options[clampedIndex];
        if (selectedOption && selectedOption.value !== value) {
          onChange(selectedOption.value);
        }
      }
      isScrollingRef.current = false;
    }, 100);
  }, [height, options, value, onChange]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="relative" style={{ height: totalHeight }}>
      {/* Selection indicator - two horizontal lines */}
      <div
        className="absolute left-0 right-0 border-t-2 border-primary-200 dark:border-primary-700 pointer-events-none z-10"
        style={{ top: paddingItems * height }}
      />
      <div
        className="absolute left-0 right-0 border-b-2 border-primary-200 dark:border-primary-700 pointer-events-none z-10"
        style={{ top: (paddingItems + 1) * height }}
      />

      {/* Scrollable container */}
      <div
        ref={containerRef}
        className="h-full overflow-y-auto scrollbar-hide"
        style={{
          scrollSnapType: 'y mandatory',
          WebkitOverflowScrolling: 'touch',
        }}
        onScroll={handleScroll}
      >
        {/* Top padding */}
        <div style={{ height: paddingItems * height }} />

        {/* Options */}
        {options.map((option, index) => {
          const isSelected = index === validIndex;
          const distance = Math.abs(index - validIndex);

          return (
            <div
              key={option.value}
              className="flex items-center justify-center transition-all duration-150"
              style={{
                height,
                scrollSnapAlign: 'center',
              }}
            >
              <span
                className={`transition-all duration-150 ${
                  isSelected
                    ? 'text-xl font-semibold text-gray-900 dark:text-gray-100'
                    : distance === 1
                      ? 'text-base text-gray-400 dark:text-gray-500'
                      : 'text-sm text-gray-300 dark:text-gray-600'
                }`}
              >
                {option.label}
              </span>
            </div>
          );
        })}

        {/* Bottom padding */}
        <div style={{ height: paddingItems * height }} />
      </div>
    </div>
  );
}
