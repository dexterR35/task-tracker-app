import React from 'react';
import Skeleton, { 
  SkeletonCard, 
  SkeletonTable, 
  SkeletonForm, 
  SkeletonChart,
  SkeletonList,
  SkeletonGrid 
} from './Skeleton';

const LoadingWrapper = ({ 
  loading = false, 
  error = null, 
  children, 
  skeleton = 'card',
  skeletonProps = {},
  fallback = null,
  className = ''
}) => {
  if (loading) {
    const skeletonComponents = {
      card: <SkeletonCard {...skeletonProps} />,
      table: <SkeletonTable {...skeletonProps} />,
      form: <SkeletonForm {...skeletonProps} />,
      chart: <SkeletonChart {...skeletonProps} />,
      list: <SkeletonList {...skeletonProps} />,
      grid: <SkeletonGrid {...skeletonProps} />,
      text: <Skeleton variant="text" count={3} {...skeletonProps} />,
      title: <Skeleton variant="title" {...skeletonProps} />,
      avatar: <Skeleton variant="avatar" circle {...skeletonProps} />,
      button: <Skeleton variant="button" {...skeletonProps} />,
      input: <Skeleton variant="input" {...skeletonProps} />,
      badge: <Skeleton variant="badge" {...skeletonProps} />
    };

    return (
      <div className={className}>
        {skeletonComponents[skeleton] || skeletonComponents.card}
      </div>
    );
  }

  if (error) {
    return (
      <div className={`p-4 bg-red-50 border border-red-200 rounded-lg ${className}`}>
        <div className="flex items-center space-x-2">
          <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <span className="text-red-800 font-medium">Error loading data</span>
        </div>
        {error.message && (
          <p className="text-red-600 text-sm mt-1">{error.message}</p>
        )}
      </div>
    );
  }

  if (fallback) {
    return fallback;
  }

  return children;
};

export default LoadingWrapper;
