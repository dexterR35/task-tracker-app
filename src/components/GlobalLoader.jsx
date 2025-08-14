import React from 'react';
import { useUI } from '../hooks/useUI';

const GlobalLoader = () => {
  const { globalLoading } = useUI();

  if (!globalLoading) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 flex flex-col items-center space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <div className="text-gray-700 font-medium">Loading...</div>
      </div>
    </div>
  );
};

export default GlobalLoader;
