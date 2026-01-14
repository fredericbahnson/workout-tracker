/**
 * ProgressComparisonChart Component
 *
 * Visual comparison of "Training to Failure" vs "RFEM Training" progress curves.
 * Shows jagged plateaus vs smooth consistent growth.
 */

import { useEffect, useState } from 'react';
import type { ProgressComparisonChartProps } from '../types';

export function ProgressComparisonChart({
  className = '',
  animate = true,
}: ProgressComparisonChartProps) {
  const [isAnimated, setIsAnimated] = useState(!animate);

  useEffect(() => {
    if (animate) {
      const timer = setTimeout(() => setIsAnimated(true), 300);
      return () => clearTimeout(timer);
    }
  }, [animate]);

  // Chart dimensions
  const width = 280;
  const height = 120;
  const padding = { top: 10, right: 10, bottom: 25, left: 10 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Generate path data for "To Failure" - jagged with plateaus
  const failurePath = `
    M ${padding.left} ${height - padding.bottom - 10}
    L ${padding.left + chartWidth * 0.15} ${height - padding.bottom - 25}
    L ${padding.left + chartWidth * 0.25} ${height - padding.bottom - 20}
    L ${padding.left + chartWidth * 0.35} ${height - padding.bottom - 35}
    L ${padding.left + chartWidth * 0.45} ${height - padding.bottom - 30}
    L ${padding.left + chartWidth * 0.55} ${height - padding.bottom - 35}
    L ${padding.left + chartWidth * 0.7} ${height - padding.bottom - 45}
    L ${padding.left + chartWidth * 0.8} ${height - padding.bottom - 40}
    L ${padding.left + chartWidth * 0.9} ${height - padding.bottom - 50}
    L ${padding.left + chartWidth} ${height - padding.bottom - 55}
  `;

  // Generate path data for "RFEM" - smooth upward curve
  const rfemPath = `
    M ${padding.left} ${height - padding.bottom - 10}
    Q ${padding.left + chartWidth * 0.3} ${height - padding.bottom - 30},
      ${padding.left + chartWidth * 0.5} ${height - padding.bottom - 50}
    Q ${padding.left + chartWidth * 0.7} ${height - padding.bottom - 65},
      ${padding.left + chartWidth} ${height - padding.bottom - 75}
  `;

  return (
    <div className={`bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 ${className}`}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full max-w-[280px] mx-auto"
        style={{ overflow: 'visible' }}
      >
        {/* Grid lines */}
        <g className="text-gray-200 dark:text-gray-700">
          {[0, 0.25, 0.5, 0.75, 1].map(y => (
            <line
              key={y}
              x1={padding.left}
              y1={padding.top + chartHeight * (1 - y)}
              x2={width - padding.right}
              y2={padding.top + chartHeight * (1 - y)}
              stroke="currentColor"
              strokeWidth="1"
              strokeDasharray="2,2"
              opacity="0.5"
            />
          ))}
        </g>

        {/* "To Failure" line - red/orange, jagged */}
        <path
          d={failurePath}
          fill="none"
          stroke="#ef4444"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`transition-all duration-1000 ${isAnimated ? 'opacity-100' : 'opacity-0'}`}
          style={{
            strokeDasharray: isAnimated ? 'none' : '500',
            strokeDashoffset: isAnimated ? '0' : '500',
          }}
        />

        {/* "RFEM" line - green, smooth */}
        <path
          d={rfemPath}
          fill="none"
          stroke="#10b981"
          strokeWidth="2.5"
          strokeLinecap="round"
          className={`transition-all duration-1000 delay-300 ${isAnimated ? 'opacity-100' : 'opacity-0'}`}
          style={{
            strokeDasharray: isAnimated ? 'none' : '500',
            strokeDashoffset: isAnimated ? '0' : '500',
          }}
        />

        {/* X-axis label */}
        <text
          x={width / 2}
          y={height - 5}
          textAnchor="middle"
          className="fill-gray-400 dark:fill-gray-500 text-[10px]"
        >
          Time
        </text>

        {/* Y-axis label */}
        <text
          x={5}
          y={height / 2}
          textAnchor="middle"
          transform={`rotate(-90, 5, ${height / 2})`}
          className="fill-gray-400 dark:fill-gray-500 text-[10px]"
        >
          Strength
        </text>
      </svg>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 mt-2 text-xs">
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-0.5 bg-red-500 rounded" />
          <span className="text-gray-600 dark:text-gray-400">To Failure</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-0.5 bg-emerald-500 rounded" />
          <span className="text-gray-600 dark:text-gray-400">RFEM Training</span>
        </div>
      </div>
    </div>
  );
}
