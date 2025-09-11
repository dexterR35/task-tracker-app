import React from 'react';

const Loader = ({ 
  size = 'md', 
  text = 'Loading...', 
  className = '',
  variant = 'spinner', // 'spinner' or 'dots'
  fullScreen = false, // Add fullScreen prop for consistent full-screen loading
  minHeight = 'auto', // Allow custom min-height for different contexts
  showText = true // Allow hiding text for inline loaders
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16', // Fixed xl size
  };

  const textSizes = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl',
  };

  const Spinner = () => (
    <div className={`animate-spin rounded-full border-2 border-gray-300 border-t-blue-600 ${sizeClasses[size]} ${className}`} />
  );

  const Dots = () => (
    <div className={`flex space-x-1 ${className}`}>
      <div className="w-3.5 h-3.5 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
      <div className="w-3.5 h-3.5 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
      <div className="w-3.5 h-3.5 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
    </div>
  );

  const content = (
    <div className="flex-center flex-col space-y-4 p-8">
      {variant === 'spinner' ? <Spinner /> : <Dots />}
      {showText && text && (
        <p className={`text-gray-300 ${textSizes[size]} text-center`}>
          {text}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className={`min-h-screen flex-center`} role="status" aria-busy="true">
        {content}
      </div>
    );
  }

  if (minHeight !== 'auto') {
    return (
      <div className={`${minHeight} flex-center`} role="status" aria-busy="true">
        {content}
      </div>
    );
  }

  return content;
};

export default Loader;
