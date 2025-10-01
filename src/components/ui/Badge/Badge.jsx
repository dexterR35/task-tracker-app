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
      // Map color names to subtle CSS classes (muted colors like icons)
      const colorMap = {
        'red': 'bg-red-500/20 text-red-300 border border-red-500/30',
        'blue': 'bg-blue-500/20 text-blue-300 border border-blue-500/30',
        'green': 'bg-green-500/20 text-green-300 border border-green-500/30',
        'purple': 'bg-purple-500/20 text-purple-300 border border-purple-500/30',
        'yellow': 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30',
        'amber': 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
        'crimson': 'bg-red-600/20 text-red-300 border border-red-600/30',
        'pink': 'bg-pink-500/20 text-pink-300 border border-pink-500/30',
        'gray': 'bg-gray-500/20 text-gray-300 border border-gray-500/30',
        'secondary': 'bg-gray-600/20 text-gray-300 border border-gray-600/30'
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
