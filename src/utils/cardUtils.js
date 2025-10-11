/**
 * Comprehensive Card Utilities
 * Centralized card system for consistent design and functionality
 */

// ============================================================================
// CARD COLOR SYSTEM
// ============================================================================

// Card color constants
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

// Convert card color to hex for charts, icons, badges
export const getCardColorHex = (color) => {
  const colorMap = {
    "green": "#10b981",      // Emerald-500 - Fresh, growth
    "blue": "#3b82f6",       // Blue-500 - Professional, trust
    "purple": "#8b5cf6",     // Purple-500 - Premium, personal
    "crimson": "#dc2626",    // Red-600 - Authority, admin
    "amber": "#f59e0b",      // Amber-500 - Energy, action
    "pink": "#ec4899",       // Pink-500 - Calendar, time
    "red": "#ef4444",        // Red-500 - Error
    "yellow": "#f59e0b",     // Amber-500 - Warning
    "gray": "#64748b",       // Slate-500 - Disabled
  };
  return colorMap[color] || "#64748b";
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

// ============================================================================
// CARD UTILITY FUNCTIONS
// ============================================================================

// Get status badge variant for different statuses
export const getStatusBadgeVariant = (status) => {
  switch (status?.toLowerCase()) {
    case "active":
    case "current":
      return "success";
    case "inactive":
    case "disabled":
      return "error";
    case "filtered":
      return "primary";
    case "historical":
      return "secondary";
    case "admin":
      return "error";
    case "user":
      return "secondary";
    case "reporter":
      return "primary";
    default:
      return "secondary";
  }
};

// Get status badge color for different statuses
export const getStatusBadgeColor = (status) => {
  switch (status?.toLowerCase()) {
    case "active":
    case "current":
      return "success";
    case "inactive":
    case "disabled":
      return "error";
    case "filtered":
      return "primary";
    case "historical":
      return "secondary";
    case "admin":
      return "error";
    case "user":
      return "secondary";
    case "reporter":
      return "primary";
    default:
      return "secondary";
  }
};

// ============================================================================
// CARD DATA HELPERS
// ============================================================================

// Create user data card object for SmallCard component
export const createUserDataCard = (title, subtitle, value, description, icon, color = "blue", details = []) => ({
  title,
  subtitle,
  description,
  icon,
  color,
  value,
  status: null,
  details: details.map(detail => ({
    icon: icon,
    label: detail.label,
    value: detail.value
  })),
  badges: [],
  hasChart: false,
  chartData: [],
  chartColor: getCardColorHex(color)
});

// Generate market badges from tasks
export const calculateMarketBadges = (tasks) => {
  if (!tasks || tasks.length === 0) return [];
  
  const marketCounts = {};
  
  tasks.forEach(task => {
    const markets = Array.isArray(task.data_task?.markets) ? task.data_task.markets : 
                   Array.isArray(task.markets) ? task.markets : 
                   typeof task.data_task?.markets === 'string' ? [task.data_task.markets] :
                   typeof task.markets === 'string' ? [task.markets] : [];
    
    markets.forEach(market => {
      if (market && typeof market === 'string') {
        marketCounts[market] = (marketCounts[market] || 0) + 1;
      }
    });
  });
  
  return Object.entries(marketCounts)
    .map(([market, count]) => ({ market, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10); // Top 10 markets
};

// ============================================================================
// CARD STYLING UTILITIES
// ============================================================================

// Get card background color with opacity
export const getCardBackgroundColor = (color, opacity = 0.1) => {
  const hex = getCardColorHex(color);
  return `${hex}${Math.round(opacity * 255).toString(16).padStart(2, '0')}`;
};

// Get card border color with opacity
export const getCardBorderColor = (color, opacity = 0.2) => {
  const hex = getCardColorHex(color);
  return `${hex}${Math.round(opacity * 255).toString(16).padStart(2, '0')}`;
};

// Get gradient background for cards
export const getCardGradient = (color) => {
  const hex = getCardColorHex(color);
  return `linear-gradient(135deg, ${hex} 0%, ${hex}dd 100%)`;
};
