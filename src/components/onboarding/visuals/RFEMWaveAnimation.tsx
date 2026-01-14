/**
 * RFEMWaveAnimation Component
 *
 * Animated visualization of RFEM values rotating workout-by-workout.
 * Shows the wave pattern: 3 → 4 → 5 → 4 → 3 → 4 → 5 → 4...
 */

import { useEffect, useState } from 'react';
import type { RFEMWaveAnimationProps } from '../types';

export function RFEMWaveAnimation({ className = '', animate = true }: RFEMWaveAnimationProps) {
  const [isAnimated, setIsAnimated] = useState(!animate);
  const [highlightIndex, setHighlightIndex] = useState(0);

  useEffect(() => {
    if (animate) {
      const timer = setTimeout(() => setIsAnimated(true), 200);
      return () => clearTimeout(timer);
    }
  }, [animate]);

  // Cycle through highlighting each workout
  useEffect(() => {
    if (!isAnimated) return;

    const interval = setInterval(() => {
      setHighlightIndex(prev => (prev + 1) % 8);
    }, 1200);

    return () => clearInterval(interval);
  }, [isAnimated]);

  // RFEM rotation pattern: [3, 4, 5, 4] repeated
  const workouts = [
    { num: 1, rfem: 3, label: 'Harder' },
    { num: 2, rfem: 4, label: 'Medium' },
    { num: 3, rfem: 5, label: 'Lighter' },
    { num: 4, rfem: 4, label: 'Building' },
    { num: 5, rfem: 3, label: 'Harder' },
    { num: 6, rfem: 4, label: 'Medium' },
    { num: 7, rfem: 5, label: 'Lighter' },
    { num: 8, rfem: 4, label: 'Building' },
  ];

  // Chart dimensions
  const width = 300;
  const height = 100;
  const padding = { top: 15, right: 15, bottom: 30, left: 25 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Scale functions
  const xScale = (index: number) => padding.left + (index / 7) * chartWidth;
  const yScale = (rfem: number) => padding.top + ((5 - rfem) / 2) * chartHeight;

  // Generate smooth curve path
  const generatePath = () => {
    const points = workouts.map((w, i) => ({ x: xScale(i), y: yScale(w.rfem) }));

    // Create smooth curve using quadratic bezier
    let path = `M ${points[0].x} ${points[0].y}`;

    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const midX = (prev.x + curr.x) / 2;
      path += ` Q ${prev.x + (curr.x - prev.x) * 0.5} ${prev.y}, ${midX} ${(prev.y + curr.y) / 2}`;
      path += ` Q ${midX + (curr.x - midX) * 0.5} ${curr.y}, ${curr.x} ${curr.y}`;
    }

    return path;
  };

  return (
    <div className={`bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 ${className}`}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full max-w-[300px] mx-auto"
        style={{ overflow: 'visible' }}
      >
        {/* Y-axis labels (RFEM values) */}
        {[3, 4, 5].map(rfem => (
          <g key={rfem}>
            <text
              x={padding.left - 8}
              y={yScale(rfem) + 4}
              textAnchor="end"
              className="fill-gray-500 dark:fill-gray-400 text-[10px] font-medium"
            >
              {rfem}
            </text>
            <line
              x1={padding.left}
              y1={yScale(rfem)}
              x2={width - padding.right}
              y2={yScale(rfem)}
              stroke="currentColor"
              strokeWidth="1"
              strokeDasharray="2,2"
              className="text-gray-200 dark:text-gray-700"
              opacity="0.5"
            />
          </g>
        ))}

        {/* Y-axis title */}
        <text
          x={8}
          y={height / 2 - 10}
          textAnchor="middle"
          transform={`rotate(-90, 8, ${height / 2 - 10})`}
          className="fill-gray-400 dark:fill-gray-500 text-[9px]"
        >
          RFEM
        </text>

        {/* Wave line */}
        <path
          d={generatePath()}
          fill="none"
          stroke="#10b981"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`transition-opacity duration-500 ${isAnimated ? 'opacity-100' : 'opacity-0'}`}
        />

        {/* Data points */}
        {workouts.map((workout, index) => {
          const isHighlighted = index === highlightIndex;
          const x = xScale(index);
          const y = yScale(workout.rfem);

          return (
            <g
              key={index}
              className={`transition-all duration-300 ${isAnimated ? 'opacity-100' : 'opacity-0'}`}
              style={{ transitionDelay: `${index * 50}ms` }}
            >
              {/* Point */}
              <circle
                cx={x}
                cy={y}
                r={isHighlighted ? 6 : 4}
                className={`
                  transition-all duration-300
                  ${isHighlighted ? 'fill-emerald-400' : 'fill-emerald-500'}
                `}
              />

              {/* Highlight ring */}
              {isHighlighted && (
                <circle
                  cx={x}
                  cy={y}
                  r={10}
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="2"
                  opacity="0.3"
                  className="animate-ping"
                />
              )}

              {/* X-axis label (workout number) */}
              <text
                x={x}
                y={height - padding.bottom + 15}
                textAnchor="middle"
                className={`
                  text-[9px] transition-colors duration-300
                  ${isHighlighted ? 'fill-emerald-600 dark:fill-emerald-400 font-semibold' : 'fill-gray-500 dark:fill-gray-400'}
                `}
              >
                #{workout.num}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Current workout indicator */}
      <div className="mt-2 text-center">
        <div
          className={`
            inline-flex items-center gap-2 px-3 py-1.5 rounded-full
            bg-emerald-100 dark:bg-emerald-900/30
            text-emerald-700 dark:text-emerald-300 text-sm font-medium
            transition-all duration-300
          `}
        >
          <span>Workout #{workouts[highlightIndex].num}:</span>
          <span className="font-bold">RFEM {workouts[highlightIndex].rfem}</span>
          <span className="text-emerald-600 dark:text-emerald-400">
            ({workouts[highlightIndex].label})
          </span>
        </div>
      </div>

      {/* Labels */}
      <div className="flex justify-between mt-2 text-[10px] text-gray-400 px-2">
        <span>← Harder sessions</span>
        <span>Lighter sessions →</span>
      </div>
    </div>
  );
}
