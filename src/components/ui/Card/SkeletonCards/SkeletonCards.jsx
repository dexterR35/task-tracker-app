import React from 'react';

const SkeletonCards = ({ 
  className = "", 
  count = 6,
  gridCols = "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
}) => {
  return (
    <div className={`${className} grid ${gridCols} gap-4`}>
      {[...Array(count)].map((_, index) => (
        <div key={index} className="card p-4 animate-pulse">
          <div className="flex items-center space-x-4">
            {/* Avatar skeleton */}
            <div className="w-16 h-16 bg-gray-700 rounded"></div>
            
            {/* Content skeleton */}
            <div className="flex-1">
              <div className="h-4 bg-gray-700 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-700 rounded w-1/2 mb-1"></div>
              <div className="h-3 bg-gray-700 rounded w-2/3"></div>
            </div>
            
            {/* Action buttons skeleton */}
            <div className="flex flex-col space-y-2">
              <div className="h-8 bg-gray-700 rounded w-16"></div>
              <div className="h-8 bg-gray-700 rounded w-16"></div>
              <div className="h-8 bg-gray-700 rounded w-16"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default SkeletonCards;
