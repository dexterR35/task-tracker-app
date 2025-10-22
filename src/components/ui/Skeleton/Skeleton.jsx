import React from 'react';

const Skeleton = ({ 
  className = '', 
  width = '100%', 
  height = '1rem', 
  rounded = 'md',
  animate = true 
}) => {
  const baseClasses = `bg-gray-200 dark:bg-gray-700 ${rounded === 'md' ? 'rounded-md' : rounded === 'lg' ? 'rounded-lg' : rounded === 'full' ? 'rounded-full' : ''}`;
  const animateClasses = animate ? 'animate-pulse' : '';
  
  return (
    <div 
      className={`${baseClasses} ${animateClasses} ${className}`}
      style={{ width, height }}
    />
  );
};

// Predefined skeleton components for common use cases
export const SkeletonCard = ({ className = '' }) => (
  <div className={`card-small p-4 ${className}`}>
    <div className="h-auto">
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Skeleton height="2.5rem" width="2.5rem" rounded="lg" />
            <div className="leading-2">
              <Skeleton height="0.875rem" width="4rem" className="mb-1" />
              <Skeleton height="0.75rem" width="3rem" />
            </div>
          </div>
          <Skeleton height="1.25rem" width="2rem" rounded="md" />
        </div>

        {/* Main Content */}
        <div className="flex-1">
          {/* Main Value */}
          <div className="mb-6">
            <Skeleton height="2rem" width="3rem" className="mb-2" />
            <Skeleton height="0.875rem" width="5rem" />
          </div>

          {/* Details */}
          <div className="space-y-2">
            <div className="p-2 rounded-lg border">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Skeleton height="0.375rem" width="0.375rem" rounded="full" />
                  <Skeleton height="0.75rem" width="2rem" />
                </div>
                <Skeleton height="0.75rem" width="1.5rem" />
              </div>
            </div>
            <div className="p-2 rounded-lg border">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Skeleton height="0.375rem" width="0.375rem" rounded="full" />
                  <Skeleton height="0.75rem" width="2.5rem" />
                </div>
                <Skeleton height="0.75rem" width="1.5rem" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
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
  <div className={`space-y-3 ${className}`}>
    {/* Table Header */}
    <div className="grid grid-cols-6 gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
      <Skeleton height="1rem" width="80%" />
      <Skeleton height="1rem" width="60%" />
      <Skeleton height="1rem" width="70%" />
      <Skeleton height="1rem" width="50%" />
      <Skeleton height="1rem" width="60%" />
      <Skeleton height="1rem" width="40%" />
    </div>
    
    {/* Table Rows */}
    {Array.from({ length: rows }).map((_, index) => (
      <div key={index} className="grid grid-cols-6 gap-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
        <Skeleton height="1rem" width="90%" />
        <Skeleton height="1rem" width="70%" />
        <Skeleton height="1rem" width="80%" />
        <Skeleton height="1rem" width="60%" />
        <Skeleton height="1rem" width="50%" />
        <Skeleton height="1rem" width="30%" />
      </div>
    ))}
  </div>
);

export const SkeletonAnalyticsCard = ({ className = '' }) => (
  <div className={`card-large ${className}`}>
    {/* Title */}
    <Skeleton height="1.5rem" width="40%" className="mb-6" />
    
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Table Section */}
      <div>
        <Skeleton height="1.25rem" width="30%" className="mb-4" />
        <SkeletonTable rows={4} />
      </div>
      
      {/* Chart Section */}
      <div>
        <Skeleton height="1.25rem" width="35%" className="mb-4" />
        <div className="flex items-center justify-center h-64 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <Skeleton height="200px" width="200px" rounded="full" />
        </div>
      </div>
    </div>
  </div>
);

export const SkeletonDashboardCard = ({ className = '' }) => (
  <div className={`card-small ${className}`}>
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
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 shadow-sm">
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
