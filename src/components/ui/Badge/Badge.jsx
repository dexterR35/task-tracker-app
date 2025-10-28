import React from 'react';
import { CARD_SYSTEM } from '@/constants';

// Badge variant helpers for different data types

// Use the same color system as small cards

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
    md: 'px-2 py-1 text-xs',
    lg: 'px-2.5 py-1.5 text-xs'
  };

  // Default fallback color
  const defaultColorHex = '#64748b';

  const baseClasses = 'inline-flex items-center font-medium rounded-md ';
  const sizeClass = sizeClasses[size] || sizeClasses.sm;
  
  // Get colorHex from colorHex prop, color prop using CARD_SYSTEM (like small cards), variant prop, or fallback
  const finalColorHex = colorHex || CARD_SYSTEM.COLOR_HEX_MAP[color] || CARD_SYSTEM.COLOR_HEX_MAP[variant] || defaultColorHex;
  
  // Enhanced styling for better dark mode support
  const badgeStyle = {
    backgroundColor: `${finalColorHex}15`,
    color: finalColorHex,
    border: `1px solid ${finalColorHex}30`,
    fontWeight: '600',
    boxShadow: `0 1px 3px ${finalColorHex}20`,
    backdropFilter: 'blur(4px)'
  };
  
  return (
    <span 
      className={`${baseClasses} ${sizeClass} ${className}`}
      style={badgeStyle}
      {...props}
    >
      {children}
    </span>
  );
};

export default Badge;
