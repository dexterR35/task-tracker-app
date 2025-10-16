import React from 'react';
import { CARD_SYSTEM } from '@/constants';

// Badge variant helpers for different data types

// Reusable Badge Component
const Badge = ({ 
  children, 
  variant = 'default', 
  color,
  colorHex,
  size = 'sm', 
  className = '',
  ...props 
}) => {
  // Size variants
  const sizeClasses = {
    xs: 'px-1 py-0.5 text-xs',
    sm: 'px-1.5 py-0.5 text-xs',
    md: 'px-2 py-1 text-sm',
    lg: 'px-2.5 py-1.5 text-sm'
  };

  // Color variants using constants
  const variantClasses = {
    default: 'bg-gray-300 text-gray-700 dark:bg-gray-600 dark:text-gray-300',
    primary: 'bg-btn-primary text-white',
    success: 'bg-green-success text-white',
    warning: 'bg-warning text-white',
    error: 'bg-red-error text-white',
    info: 'bg-blue-default text-white',
    secondary: 'bg-secondary text-white',
    // Role variants
    admin: 'bg-red-error text-white',
    reporter: 'bg-blue-default text-white',
    user: 'bg-green-success text-white',
    // Use constants for our main colors
    ...CARD_SYSTEM.BADGE_COLOR_CLASSES,
    // Legacy variants for backward compatibility
    yellow: 'bg-warning text-white'
  };

  const baseClasses = 'inline-flex items-center font-medium rounded bg-amber-500';
  const sizeClass = sizeClasses[size] || sizeClasses.sm;
  
  // If colorHex is provided, use inline styles; otherwise use classes
  if (colorHex) {
    return (
      <span 
        className={`${baseClasses} ${sizeClass} ${className}`}
        style={{ 
          backgroundColor: colorHex,
          color: 'white',
          fontWeight: '600'
        }}
        {...props}
      >
        {children}
      </span>
    );
  }
  
  // Get the final variant class - prioritize color over variant
  const getVariantClass = () => {
    // If color is provided, use it; otherwise use variant
    const colorKey = color || variant;
    return variantClasses[colorKey] || variantClasses.default;
  };
  
  const variantClass = getVariantClass();

  return (
    <span 
      className={`${baseClasses} ${sizeClass} ${variantClass} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
};

export default Badge;
