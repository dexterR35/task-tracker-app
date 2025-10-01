// Dynamic Card Color System
// This utility provides consistent color mapping for all cards

export const CARD_COLORS = {
  // Role-based colors
  ADMIN: 'crimson',
  USER: 'purple', 
  REPORTER: 'blue',
  
  // Status-based colors
  ACTIVE: 'green',
  INACTIVE: 'gray',
  WARNING: 'amber',
  
  // Feature-based colors
  FILTER: 'blue',
  ACTIONS: 'amber',
  PROFILE: 'purple',
  MONTH: 'crimson',
  
  // Default fallback
  DEFAULT: 'gray'
};

// Color mapping for different card types with better colors
export const getCardColor = (cardType, data = {}) => {
  switch (cardType) {
    case 'user-profile':
      // Only admin and user roles exist for authenticated users (no reporter)
      return data?.currentUser?.role === 'admin' ? 'crimson' : 'purple';
    
    case 'actions':
      return 'amber';
    
    case 'user-filter':
      return 'blue';
    
    case 'reporter-filter':
      return 'green';
    
    case 'month-selection':
      return 'pink';
    
    default:
      return CARD_COLORS.DEFAULT;
  }
};

// Badge color mapping (matches card colors)
export const getBadgeColor = (cardType, data = {}) => {
  return getCardColor(cardType, data);
};

// Icon color mapping (matches card colors)
export const getIconColor = (cardType, data = {}) => {
  return getCardColor(cardType, data);
};

// Future card types can be easily added here:
// case 'new-feature':
//   return CARD_COLORS.CUSTOM_COLOR;
