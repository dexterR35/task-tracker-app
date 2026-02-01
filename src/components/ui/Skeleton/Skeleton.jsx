import React from "react";
import CardWithStrip from "@/components/ui/CardWithStrip";

const Skeleton = ({ 
  className = '', 
  width = '100%', 
  height = '1rem', 
  rounded = 'md',
  animate = true 
}) => {
  const baseClasses = `bg-gray-200 dark:bg-gray-600/50 ${rounded === 'md' ? 'rounded-md' : rounded === 'lg' ? 'rounded-lg' : rounded === 'full' ? 'rounded-full' : ''}`;
  const animateClasses = animate ? 'animate-pulse' : '';
  
  return (
    <div 
      className={`${baseClasses} ${animateClasses} ${className}`}
      style={{ width, height }}
    />
  );
};

/** Skeleton that matches CardWithStrip layout (same as SmallCard). */
export const SkeletonCard = ({ className = "" }) => (
  <CardWithStrip className={`relative h-full ${className}`.trim()}>
    <div className="flex items-stretch justify-between gap-3 m-0">
      <div className="flex flex-col gap-2 min-w-0 flex-1">
        <Skeleton height="0.6875rem" width="5rem" rounded="md" />
        <Skeleton height="1.5rem" width="4rem" rounded="md" />
      </div>
      <Skeleton height="2.25rem" width="2.25rem" rounded="xl" className="shrink-0" />
    </div>
  </CardWithStrip>
);

export const SkeletonSelect = ({ className = '' }) => (
  <div className={`space-y-2 ${className}`}>
    <Skeleton height="2.5rem" width="100%" />
    <div className="flex items-center justify-between">
      <Skeleton height="0.875rem" width="60%" />
      <Skeleton height="1.5rem" width="1.5rem" rounded="full" />
    </div>
  </div>
);

export const SkeletonButton = ({ className = '' }) => (
  <Skeleton height="2.5rem" width="100%" className={className} />
);

export const SkeletonTable = ({ rows = 5, className = '' }) => (
  <div className={`table-card overflow-hidden relative ${className}`}>
    <div className="table-card-inner overflow-x-auto">
      <div className="space-y-0">
        <div className="grid grid-cols-6 gap-4 px-4 py-3 border-b border-gray-100 dark:border-gray-700/40 bg-gray-50/50 dark:bg-gray-800/30">
          <Skeleton height="0.6875rem" width="80%" className="bg-gray-200 dark:bg-gray-600" />
          <Skeleton height="0.6875rem" width="60%" className="bg-gray-200 dark:bg-gray-600" />
          <Skeleton height="0.6875rem" width="70%" className="bg-gray-200 dark:bg-gray-600" />
          <Skeleton height="0.6875rem" width="50%" className="bg-gray-200 dark:bg-gray-600" />
          <Skeleton height="0.6875rem" width="60%" className="bg-gray-200 dark:bg-gray-600" />
          <Skeleton height="0.6875rem" width="40%" className="bg-gray-200 dark:bg-gray-600" />
        </div>
        {Array.from({ length: rows }).map((_, index) => (
          <div
            key={index}
            className="grid grid-cols-6 gap-4 px-4 py-3 border-b border-gray-100 dark:border-gray-700/40"
          >
            <Skeleton height="0.8125rem" width="90%" className="bg-gray-100 dark:bg-gray-700/50" />
            <Skeleton height="0.8125rem" width="70%" className="bg-gray-100 dark:bg-gray-700/50" />
            <Skeleton height="0.8125rem" width="80%" className="bg-gray-100 dark:bg-gray-700/50" />
            <Skeleton height="0.8125rem" width="60%" className="bg-gray-100 dark:bg-gray-700/50" />
            <Skeleton height="0.8125rem" width="50%" className="bg-gray-100 dark:bg-gray-700/50" />
            <Skeleton height="0.8125rem" width="30%" className="bg-gray-100 dark:bg-gray-700/50" />
          </div>
        ))}
      </div>
    </div>
  </div>
);

export const SkeletonDashboardCard = ({ className = '' }) => (
  <div className={`card-small-modern ${className}`}>
    <div className="mb-4">
      <Skeleton height="1.25rem" width="60%" className="mb-2" />
      <Skeleton height="0.875rem" width="40%" />
    </div>
    <div className="space-y-3">
      <Skeleton height="2.5rem" width="100%" />
      <div className="flex items-center justify-between">
        <Skeleton height="0.875rem" width="50%" />
        <Skeleton height="1.5rem" width="1.5rem" rounded="full" />
      </div>
      <div className="flex items-center justify-between">
        <Skeleton height="0.875rem" width="60%" />
        <Skeleton height="1.5rem" width="1.5rem" rounded="full" />
      </div>
    </div>
  </div>
);

export const SkeletonHeader = ({ className = '' }) => (
  <div className={`mb-8 ${className}`}>
    {/* Navigation Buttons */}
    <div className="flex items-center justify-between mb-6">
      <Skeleton height="2rem" width="8rem" rounded="md" />
      <Skeleton height="2rem" width="6rem" rounded="md" />
    </div>
    
    {/* Header Card */}
    <div className="card-small-modern">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <Skeleton height="2rem" width="16rem" className="mb-2" />
          <Skeleton height="1rem" width="8rem" />
        </div>
        <div className="flex gap-2">
          <Skeleton height="1.5rem" width="4rem" rounded="full" />
          <Skeleton height="1.5rem" width="5rem" rounded="full" />
        </div>
      </div>
    </div>
  </div>
);

export default Skeleton;
