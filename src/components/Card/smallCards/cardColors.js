// Dynamic Card Color System
// This utility provides consistent color mapping for all cards

export const CARD_COLORS = {
  // Role-based colors
  ADMIN: 'red',
  USER: 'purple', 
  REPORTER: 'blue',
  
  // Status-based colors
  ACTIVE: 'green',
  INACTIVE: 'gray',
  WARNING: 'yellow',
  
  // Feature-based colors
  FILTER: 'blue',
  ACTIONS: 'yellow',
  PROFILE: 'purple',
  MONTH: 'blue',
  
  // Default fallback
  DEFAULT: 'gray'
};

// Color mapping for different card types
export const getCardColor = (cardType, data = {}) => {
  switch (cardType) {
    case 'user-profile':
      return data?.currentUser?.role === 'admin' ? CARD_COLORS.ADMIN : 
             data?.currentUser?.role === 'reporter' ? CARD_COLORS.REPORTER : 
             CARD_COLORS.USER;
    
    case 'actions':
      return data?.canCreateTasks ? CARD_COLORS.ACTIVE : CARD_COLORS.WARNING;
    
    case 'user-filter':
    case 'reporter-filter':
      return CARD_COLORS.FILTER;
    
    case 'month-selection':
      return CARD_COLORS.MONTH;
    
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
