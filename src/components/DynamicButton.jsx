import React from 'react';
import { useUI } from '../hooks/useUI';
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
  const { componentConfig, loading: globalLoading, buttonStates, setLoading, setButtonState } = useUI();
  const { addSuccess, addError } = useNotifications();
  
  const buttonConfig = componentConfig.buttons || {};
  const isLoading = loading || globalLoading[id] || buttonStates[id]?.loading;
  const isDisabled = disabled || isLoading;

  const baseClasses = buttonConfig.baseClasses || 'px-4 py-2 rounded font-medium transition-colors';
  const variantClasses = buttonConfig.variants?.[variant] || 'bg-blue-600 text-white hover:bg-blue-700';
  const sizeClasses = buttonConfig.sizes?.[size] || 'px-4 py-2 text-sm';
  
  const buttonClasses = `
    ${baseClasses} 
    ${variantClasses} 
    ${sizeClasses}
    ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}
    ${className}
  `.trim();

  const handleClick = async (e) => {
    if (isDisabled || !onClick) return;

    try {
      if (id) {
        setLoading(id, true);
        setButtonState(id, { loading: true, error: null });
      }

      await onClick(e);

      if (successMessage) {
        addSuccess(successMessage);
      }

      if (id) {
        setButtonState(id, { loading: false, success: true });
      }
    } catch (error) {
      const message = errorMessage || error.message || 'An error occurred';
      addError(message);

      if (id) {
        setButtonState(id, { 
          loading: false, 
          error: message,
          retryFunction: retryFunction || (() => handleClick(e))
        });
      }
    } finally {
      if (id) {
        setLoading(id, false);
      }
    }
  };

  const renderIcon = () => {
    if (isLoading) {
      return (
        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
        </svg>
      );
    }
    
    return Icon ? <Icon className="w-4 h-4" /> : null;
  };

  return (
    <button
      type={type}
      className={buttonClasses}
      onClick={handleClick}
      disabled={isDisabled}
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
