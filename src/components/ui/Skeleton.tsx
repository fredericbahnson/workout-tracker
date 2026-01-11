/**
 * Skeleton Loading Components
 * 
 * Placeholder components shown during data loading to improve perceived performance.
 */

import { memo } from 'react';
import { skeletonClasses } from '@/styles/classes';

interface SkeletonProps {
  className?: string;
}

/**
 * Base skeleton element with pulse animation
 */
export const Skeleton = memo(function Skeleton({ className = '' }: SkeletonProps) {
  return <div className={`${skeletonClasses.base} ${className}`} />;
});

/**
 * Text line skeleton
 */
export const SkeletonText = memo(function SkeletonText({ 
  className = '', 
  width = 'w-full' 
}: SkeletonProps & { width?: string }) {
  return <div className={`${skeletonClasses.base} ${skeletonClasses.text} ${width} ${className}`} />;
});

/**
 * Skeleton for a workout card in the Today page
 */
export const WorkoutCardSkeleton = memo(function WorkoutCardSkeleton() {
  return (
    <div className="rounded-xl bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-48" />
        </div>
        <Skeleton className="h-8 w-8 rounded-full" />
      </div>
      
      {/* Progress bar */}
      <Skeleton className="h-2 w-full rounded-full" />
      
      {/* Stats */}
      <div className="flex gap-4">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-24" />
      </div>
    </div>
  );
});

/**
 * Skeleton for scheduled sets list
 */
export const SetListSkeleton = memo(function SetListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <div 
          key={i} 
          className="rounded-lg bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border p-3 flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-lg" />
            <div className="space-y-1">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
          <Skeleton className="h-6 w-12" />
        </div>
      ))}
    </div>
  );
});

/**
 * Skeleton for the schedule page workout list
 */
export const ScheduleListSkeleton = memo(function ScheduleListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {/* Section header */}
      <Skeleton className="h-4 w-24" />
      
      {/* Workout cards */}
      <div className="space-y-2">
        {Array.from({ length: count }).map((_, i) => (
          <div 
            key={i} 
            className="rounded-xl bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border p-3"
          >
            <div className="flex items-start gap-3">
              <Skeleton className="h-10 w-10 rounded-lg flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-48" />
                <div className="flex gap-1">
                  <Skeleton className="h-5 w-16 rounded-full" />
                  <Skeleton className="h-5 w-14 rounded-full" />
                  <Skeleton className="h-5 w-12 rounded-full" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});

/**
 * Skeleton for exercise list in exercises page
 */
export const ExerciseListSkeleton = memo(function ExerciseListSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <div 
          key={i} 
          className="rounded-xl bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border p-4 flex items-center justify-between"
        >
          <div className="space-y-1">
            <Skeleton className="h-5 w-36" />
            <div className="flex gap-2">
              <Skeleton className="h-5 w-14 rounded-full" />
              <Skeleton className="h-5 w-20 rounded-full" />
            </div>
          </div>
          <Skeleton className="h-8 w-16" />
        </div>
      ))}
    </div>
  );
});

/**
 * Skeleton for stats card
 */
export const StatsCardSkeleton = memo(function StatsCardSkeleton() {
  return (
    <div className="rounded-xl bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border p-4">
      <div className="flex items-center justify-between mb-3">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-6 w-6 rounded" />
      </div>
      <Skeleton className="h-8 w-16 mb-1" />
      <Skeleton className="h-3 w-32" />
    </div>
  );
});

/**
 * Full page loading skeleton
 */
export const PageSkeleton = memo(function PageSkeleton() {
  return (
    <div className="px-4 py-6 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>
      
      {/* Content cards */}
      <div className="space-y-4">
        <WorkoutCardSkeleton />
        <SetListSkeleton count={4} />
      </div>
    </div>
  );
});
