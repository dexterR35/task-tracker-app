import React from 'react';

const Loader = ({ 
  size = 'md', 
  text = 'Loading...', 
  className = '',
  variant = 'spinner' // 'spinner' or 'dots'
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };

  const textSizes = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl'
  };

  const Spinner = () => (
    <div className={`animate-spin rounded-full border-2 border-gray-300 border-t-blue-500 ${sizeClasses[size]} ${className}`} />
  );

  const Dots = () => (
    <div className={`flex space-x-1 ${className}`}>
      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
    </div>
  );

  return (
    <div className="flex-center flex-col space-y-4 p-8">
      {variant === 'spinner' ? <Spinner /> : <Dots />}
      {text && (
        <p className={`text-gray-300 ${textSizes[size]} text-center`}>
          {text}
        </p>
      )}
    </div>
  );
};

export default Loader;
