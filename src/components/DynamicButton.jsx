import React, { useState, useCallback } from 'react';
import { useNotifications } from '../hooks/useNotifications';

const DynamicButton = ({
  id,
  variant = 'primary',
  size = 'md',
  children,
  onClick,
  disabled = false,
  loading = false,
  icon: Icon,
  iconPosition = 'left',
  type = 'button',
  className = '',
  loadingText = 'Loading...',
  successMessage,
  errorMessage,
  retryFunction,
  ...props
}) => {
  const [localLoading, setLocalLoading] = useState(false);
  const { addSuccess, addError } = useNotifications();
  
  // Simple static configuration
  const buttonConfig = {
    baseClasses: 'px-4 py-2 rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2',
    variants: {
      primary: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 shadow-sm',
      secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-500',
      success: 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500 shadow-sm',
      danger: 'bg-orange-600 text-white hover:bg-orange-700 focus:ring-orange-500 shadow-sm',
      warning: 'bg-yellow-600 text-white hover:bg-yellow-700 focus:ring-yellow-500 shadow-sm',
      outline: 'border-2 border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-gray-500',
    },
    sizes: {
      xs: 'px-2 py-1 text-xs',
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-sm',
      lg: 'px-6 py-3 text-base',
      xl: 'px-8 py-4 text-lg',
    }
  };

  const isLoading = loading || localLoading;
  const isDisabled = disabled || isLoading;

  const baseClasses = buttonConfig.baseClasses;
  const variantClasses = buttonConfig.variants?.[variant] || buttonConfig.variants.primary;
  const sizeClasses = buttonConfig.sizes?.[size] || 'px-4 py-2 text-sm';
  
  const buttonClasses = `
    ${baseClasses} 
    ${variantClasses} 
    ${sizeClasses}
    ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}
    ${className}
  `.trim();

  const handleClick = useCallback(async (e) => {
    if (isLoading || isDisabled || !onClick) return;

    try {
      setLocalLoading(true);
      await onClick(e);

      if (successMessage) {
        addSuccess(successMessage);
      }
    } catch (error) {
      const message = errorMessage || error.message || 'An error occurred';
      addError(message);
    } finally {
      setLocalLoading(false);
    }
  }, [isLoading, isDisabled, onClick, successMessage, errorMessage, addSuccess, addError, setLocalLoading]);

  const renderIcon = () => {
    if (isLoading) {
      return <span className="w-4 h-4 rounded skeleton inline-block" />;
    }
    return Icon ? <Icon className="w-4 h-4" /> : null;
  };

  return (
    <button
      type={type}
      className={buttonClasses}
      onClick={handleClick}
      disabled={isDisabled}
      aria-disabled={isDisabled}
      aria-busy={isLoading}
      {...props}
    >
      <div className="flex items-center justify-center gap-2">
        {iconPosition === 'left' && renderIcon()}
        <span>{isLoading ? loadingText : children}</span>
        {iconPosition === 'right' && renderIcon()}
      </div>
    </button>
  );
};

export default DynamicButton;
