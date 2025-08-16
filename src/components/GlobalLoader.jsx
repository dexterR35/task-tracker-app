import React from 'react';
import { useSelector } from 'react-redux';

const GlobalLoader = () => {
  const count = useSelector(s => s.loading.count);
  if (count <= 0) return null;
  return (
    <div className="fixed inset-0 bg-white/70 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="flex flex-col items-center gap-4">
        <div className="h-12 w-12 relative">
          <div className="absolute inset-0 rounded-full border-4 border-blue-200" />
          <div className="absolute inset-0 rounded-full border-4 border-blue-600 border-t-transparent animate-spin" />
        </div>
        <p className="text-sm font-medium text-gray-700 tracking-wide">Loading...</p>
      </div>
    </div>
  );
};

export default GlobalLoader;
