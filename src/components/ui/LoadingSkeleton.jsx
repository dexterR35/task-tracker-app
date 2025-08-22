import React from 'react';

/**
 * Loading Skeleton Components
 * Provides consistent loading states throughout the application
 */

// Basic skeleton with pulse animation
const SkeletonBase = ({ className = "", ...props }) => (
  <div 
    className={`animate-pulse bg-gray-200 rounded ${className}`}
    {...props}
  />
);

// Text skeleton
export const SkeletonText = ({ lines = 1, className = "", ...props }) => (
  <div className={`space-y-2 ${className}`} {...props}>
    {Array.from({ length: lines }).map((_, i) => (
      <SkeletonBase 
        key={i} 
        className={`h-4 ${i === lines - 1 ? 'w-3/4' : 'w-full'}`} 
      />
    ))}
  </div>
);

// Title skeleton
export const SkeletonTitle = ({ className = "", ...props }) => (
  <SkeletonBase className={`h-8 w-3/4 ${className}`} {...props} />
);

// Card skeleton
export const SkeletonCard = ({ className = "", ...props }) => (
  <div className={`bg-white rounded-lg shadow p-6 ${className}`} {...props}>
    <SkeletonTitle className="mb-4" />
    <SkeletonText lines={3} />
  </div>
);

// Table skeleton
export const SkeletonTable = ({ rows = 5, columns = 4, className = "", ...props }) => (
  <div className={`bg-white rounded-lg shadow overflow-hidden ${className}`} {...props}>
    {/* Header */}
    <div className="bg-gray-50 px-6 py-3 border-b">
      <div className="flex space-x-4">
        {Array.from({ length: columns }).map((_, i) => (
          <SkeletonBase key={i} className="h-4 flex-1" />
        ))}
      </div>
    </div>
    
    {/* Rows */}
    <div className="divide-y">
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="px-6 py-4">
          <div className="flex space-x-4">
            {Array.from({ length: columns }).map((_, colIndex) => (
              <SkeletonBase key={colIndex} className="h-4 flex-1" />
            ))}
          </div>
        </div>
      ))}
    </div>
  </div>
);

// Form skeleton
export const SkeletonForm = ({ fields = 4, className = "", ...props }) => (
  <div className={`bg-white rounded-lg shadow p-6 ${className}`} {...props}>
    <SkeletonTitle className="mb-6" />
    <div className="space-y-4">
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i}>
          <SkeletonBase className="h-4 w-24 mb-2" />
          <SkeletonBase className="h-10 w-full" />
        </div>
      ))}
    </div>
    <div className="flex space-x-3 mt-6">
      <SkeletonBase className="h-10 w-24" />
      <SkeletonBase className="h-10 w-24" />
    </div>
  </div>
);

// Chart skeleton
export const SkeletonChart = ({ className = "", ...props }) => (
  <div className={`bg-white rounded-lg shadow p-6 ${className}`} {...props}>
    <SkeletonTitle className="mb-4" />
    <div className="h-64 bg-gray-100 rounded flex items-center justify-center">
      <div className="text-gray-400 text-sm">Loading chart...</div>
    </div>
  </div>
);

// Dashboard skeleton
export const SkeletonDashboard = ({ className = "", ...props }) => (
  <div className={`space-y-6 ${className}`} {...props}>
    {/* Header */}
    <div className="bg-white rounded-lg shadow p-6">
      <SkeletonTitle className="mb-2" />
      <SkeletonText lines={1} />
    </div>
    
    {/* Stats Cards */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="bg-white rounded-lg shadow p-6">
          <SkeletonBase className="h-4 w-20 mb-2" />
          <SkeletonBase className="h-8 w-16" />
        </div>
      ))}
    </div>
    
    {/* Table */}
    <SkeletonTable rows={5} columns={5} />
  </div>
);

// User list skeleton
export const SkeletonUserList = ({ users = 5, className = "", ...props }) => (
  <div className={`space-y-4 ${className}`} {...props}>
    {Array.from({ length: users }).map((_, i) => (
      <div key={i} className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center space-x-4">
          <SkeletonBase className="h-12 w-12 rounded-full" />
          <div className="flex-1">
            <SkeletonBase className="h-4 w-32 mb-2" />
            <SkeletonBase className="h-3 w-24" />
          </div>
          <SkeletonBase className="h-8 w-20" />
        </div>
      </div>
    ))}
  </div>
);

// Task skeleton
export const SkeletonTask = ({ className = "", ...props }) => (
  <div className={`bg-white rounded-lg shadow p-4 ${className}`} {...props}>
    <div className="flex items-center justify-between mb-3">
      <SkeletonBase className="h-5 w-16" />
      <SkeletonBase className="h-5 w-20" />
    </div>
    <SkeletonBase className="h-4 w-full mb-2" />
    <div className="flex space-x-2">
      <SkeletonBase className="h-6 w-16 rounded-full" />
      <SkeletonBase className="h-6 w-20 rounded-full" />
    </div>
  </div>
);

// Analytics skeleton
export const SkeletonAnalytics = ({ className = "", ...props }) => (
  <div className={`space-y-6 ${className}`} {...props}>
    {/* Summary Cards */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="bg-white rounded-lg shadow p-6">
          <SkeletonBase className="h-4 w-20 mb-2" />
          <SkeletonBase className="h-8 w-16" />
        </div>
      ))}
    </div>
    
    {/* Charts */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <SkeletonChart />
      <SkeletonChart />
    </div>
    
    <SkeletonChart />
  </div>
);

// Page loading skeleton
export const SkeletonPage = ({ className = "", ...props }) => (
  <div className={`min-h-screen bg-gray-50 p-6 ${className}`} {...props}>
    <div className="max-w-7xl mx-auto">
      <SkeletonDashboard />
    </div>
  </div>
);

// Inline loading spinner
export const LoadingSpinner = ({ size = "md", className = "", ...props }) => {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6", 
    lg: "h-8 w-8",
    xl: "h-12 w-12"
  };
  
  return (
    <div 
      className={`animate-spin rounded-full border-2 border-gray-300 border-t-blue-600 ${sizeClasses[size]} ${className}`}
      {...props}
    />
  );
};

// Loading overlay
export const LoadingOverlay = ({ 
  isLoading, 
  children, 
  message = "Loading...", 
  className = "",
  ...props 
}) => {
  if (!isLoading) return children;
  
  return (
    <div className={`relative ${className}`} {...props}>
      {children}
      <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-50">
        <div className="text-center">
          <LoadingSpinner size="lg" className="mx-auto mb-4" />
          <p className="text-gray-600">{message}</p>
        </div>
      </div>
    </div>
  );
};

// Loading state wrapper
export const LoadingState = ({ 
  isLoading, 
  error, 
  children, 
  skeleton: Skeleton = SkeletonCard,
  skeletonProps = {},
  errorMessage = "Something went wrong",
  onRetry,
  className = "",
  ...props 
}) => {
  if (isLoading) {
    return <Skeleton {...skeletonProps} className={className} {...props} />;
  }
  
  if (error) {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-lg p-6 text-center ${className}`} {...props}>
        <div className="text-red-600 mb-4">
          <svg className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-red-800 mb-2">Error</h3>
        <p className="text-red-700 mb-4">{errorMessage}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        )}
      </div>
    );
  }
  
  return children;
};

export default LoadingState;
