import React from 'react';

// Reusable Badge Component
const Badge = ({ 
  children, 
  variant = 'default', 
  size = 'sm', 
  className = '',
  color,
  ...props 
}) => {
  // Size variants
  const sizeClasses = {
    xs: 'px-1 py-0.5 text-xs',
    sm: 'px-1.5 py-0.5 text-xs',
    md: 'px-2 py-1 text-sm',
    lg: 'px-2.5 py-1.5 text-sm'
  };

  // Color variants using new Tailwind color system
  const variantClasses = {
    default: 'bg-gray-300 text-gray-700 dark:bg-gray-600 dark:text-gray-300',
    primary: 'bg-btn-primary text-white',
    success: 'bg-green-success text-white',
    warning: 'bg-warning text-white',
    error: 'bg-red-error text-white',
    info: 'bg-blue-default text-white',
    secondary: 'bg-secondary text-white',
    // Legacy variants for backward compatibility
    blue: 'bg-blue-default text-white',
    green: 'bg-green-success text-white',
    red: 'bg-red-error text-white',
    yellow: 'bg-warning text-white',
    purple: 'bg-btn-primary text-white'
  };

  const baseClasses = 'inline-flex items-center font-normal rounded';
  const sizeClass = sizeClasses[size] || sizeClasses.sm;
  
  // Use custom color if provided, otherwise use variant
  const getVariantClass = () => {
    if (color) {
      // Map color names to solid CSS classes (no gradients, no opacity)
      const colorMap = {
        'red': 'bg-red-600 text-white',
        'blue': 'bg-blue-600 text-white',
        'green': 'bg-green-600 text-white',
        'purple': 'bg-purple-600 text-white',
        'yellow': 'bg-yellow-600 text-white',
        'amber': 'bg-amber-600 text-white',
        'crimson': 'bg-red-700 text-white',
        'pink': 'bg-pink-600 text-white',
        'gray': 'bg-gray-600 text-white',
        'secondary': 'bg-gray-700 text-white'
      };
      return colorMap[color] || variantClasses[variant] || variantClasses.default;
    }
    return variantClasses[variant] || variantClasses.default;
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
