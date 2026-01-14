/**
 * RFEMCalculator Component
 *
 * Interactive demonstration of RFEM calculations.
 * Users can adjust max reps and see target calculations update in real-time.
 */

import { useState, useEffect } from 'react';
import type { RFEMCalculatorProps } from '../types';

export function RFEMCalculator({
  initialMax = 15,
  interactive = true,
  className = '',
}: RFEMCalculatorProps) {
  const [maxReps, setMaxReps] = useState(initialMax);
  const [isAnimated, setIsAnimated] = useState(false);

  // Animate in
  useEffect(() => {
    const timer = setTimeout(() => setIsAnimated(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // RFEM values to display
  const rfemValues = [3, 4, 5];

  // Calculate percentage for visual bar
  const getBarWidth = (rfem: number) => {
    const target = maxReps - rfem;
    return Math.max(0, Math.min(100, (target / maxReps) * 100));
  };

  return (
    <div
      className={`
        bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 
        transition-all duration-500
        ${isAnimated ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
        ${className}
      `}
    >
      {/* Max display */}
      <div className="text-center mb-4">
        <div className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">
          Your Max
        </div>
        <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          {maxReps} <span className="text-lg font-normal text-gray-500">reps</span>
        </div>
      </div>

      {/* Interactive slider */}
      {interactive && (
        <div className="mb-4 px-2">
          <input
            type="range"
            min={5}
            max={30}
            value={maxReps}
            onChange={e => setMaxReps(Number(e.target.value))}
            className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
          />
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>5</span>
            <span>30</span>
          </div>
        </div>
      )}

      {/* Formula */}
      <div className="text-center text-sm text-gray-600 dark:text-gray-400 mb-3 font-mono">
        Target = Max − RFEM
      </div>

      {/* RFEM calculations */}
      <div className="space-y-2">
        {rfemValues.map((rfem, index) => {
          const target = maxReps - rfem;
          const barWidth = getBarWidth(rfem);

          return (
            <div
              key={rfem}
              className={`
                transition-all duration-500
                ${isAnimated ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'}
              `}
              style={{ transitionDelay: `${200 + index * 100}ms` }}
            >
              {/* Label row */}
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-gray-600 dark:text-gray-400">RFEM {rfem}:</span>
                <span className="font-semibold text-gray-900 dark:text-gray-100">
                  {maxReps} − {rfem} ={' '}
                  <span className="text-emerald-600 dark:text-emerald-400">{target} reps</span>
                </span>
              </div>

              {/* Visual bar */}
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div className="h-full flex">
                  {/* Working reps (filled) */}
                  <div
                    className="h-full bg-emerald-500 dark:bg-emerald-400 transition-all duration-300 rounded-l-full"
                    style={{ width: `${barWidth}%` }}
                  />
                  {/* Buffer (striped) */}
                  <div
                    className="h-full bg-gray-300 dark:bg-gray-600 transition-all duration-300 rounded-r-full"
                    style={{ width: `${100 - barWidth}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 mt-3 text-xs text-gray-500 dark:text-gray-400">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-emerald-500" />
          <span>Working reps</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-gray-300 dark:bg-gray-600" />
          <span>Buffer</span>
        </div>
      </div>
    </div>
  );
}
