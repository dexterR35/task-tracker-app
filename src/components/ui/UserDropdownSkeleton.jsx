import React from 'react';
import Skeleton from './Skeleton';

const UserDropdownSkeleton = ({ className = '' }) => {
  return (
    <div className={`flex items-center space-x-3 p-2 ${className}`}>
      <Skeleton variant="avatar" circle />
      <div className="flex-1 space-y-1">
        <Skeleton variant="text" width="60%" />
        <Skeleton variant="text" width="40%" />
      </div>
      <Skeleton variant="badge" />
    </div>
  );
};

export const UserDropdownListSkeleton = ({ items = 5, className = '' }) => {
  return (
    <div className={`bg-white rounded-lg shadow-lg border border-gray-200 py-2 ${className}`}>
      {Array.from({ length: items }).map((_, index) => (
        <UserDropdownSkeleton key={index} className="px-3" />
      ))}
    </div>
  );
};

export default UserDropdownSkeleton;
