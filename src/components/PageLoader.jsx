import React from 'react';

const PageLoader = ({ message = "Loading..." }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <div className="relative">
        {/* Spinning circle */}
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-blue-600"></div>
        
        {/* Inner circle */}
        <div className="absolute inset-0 rounded-full h-16 w-16 border-4 border-transparent border-l-blue-400 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1s' }}></div>
      </div>
      
      <p className="mt-4 text-gray-600 text-lg font-medium">{message}</p>
      
      {/* Loading dots animation */}
      <div className="flex space-x-1 mt-2">
        <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
        <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
        <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
      </div>
    </div>
  );
};

export default PageLoader;
