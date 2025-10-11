/**
 * Analytics Card Configuration
 * Centralized configuration for all analytics card types
 */

import { Icons } from "@/components/icons";
import { CARD_SYSTEM } from '@/constants';

// Analytics Card Types
export const ANALYTICS_CARD_TYPES = CARD_SYSTEM.ANALYTICS_CARD_TYPES;

// Analytics Card Configurations
export const ANALYTICS_CARD_CONFIGS = {
  [ANALYTICS_CARD_TYPES.MARKET_USER_BREAKDOWN]: {
    type: "analytics",
    title: "Market User Breakdown",
    subtitle: "Task distribution by market and user",
    icon: Icons.generic.trendingUp,
    color: "blue",
    chartType: "column",
    multiBar: true
  },

  [ANALYTICS_CARD_TYPES.REPORTER_ANALYTICS]: {
    type: "analytics", 
    title: "Reporter Analytics",
    subtitle: "Reporter performance and task distribution",
    icon: Icons.generic.reporter,
    color: "green",
    chartType: "pie"
  },

  [ANALYTICS_CARD_TYPES.USER_ANALYTICS]: {
    type: "analytics",
    title: "User Task Distribution", 
    subtitle: "Individual user performance metrics",
    icon: Icons.generic.user,
    color: "purple",
    chartType: "pie"
  },

  [ANALYTICS_CARD_TYPES.MARKETING_ANALYTICS]: {
    type: "analytics",
    title: "Marketing Analytics",
    subtitle: "Marketing task breakdown and performance",
    icon: Icons.generic.trendingUp,
    color: "amber",
    chartType: "column"
  },

  [ANALYTICS_CARD_TYPES.PRODUCT_BREAKDOWN]: {
    type: "large",
    title: "Task Breakdown by Product",
    subtitle: "Product-focused analysis",
    icon: Icons.generic.package,
    color: "green"
  },

  [ANALYTICS_CARD_TYPES.CATEGORY_BREAKDOWN]: {
    type: "large", 
    title: "Category Breakdown",
    subtitle: "Task categorization analysis",
    icon: Icons.generic.layers,
    color: "purple"
  }
};

// Get card configuration by type
export const getAnalyticsCardConfig = (cardType) => {
  return ANALYTICS_CARD_CONFIGS[cardType] || ANALYTICS_CARD_CONFIGS[ANALYTICS_CARD_TYPES.USER_ANALYTICS];
};

// Get all card types
export const getAllAnalyticsCardTypes = () => {
  return Object.values(ANALYTICS_CARD_TYPES);
};

// Get card types by category
export const getAnalyticsCardTypesByCategory = (category) => {
  const categories = {
    "analytics": [
      ANALYTICS_CARD_TYPES.MARKET_USER_BREAKDOWN,
      ANALYTICS_CARD_TYPES.REPORTER_ANALYTICS,
      ANALYTICS_CARD_TYPES.USER_ANALYTICS,
      ANALYTICS_CARD_TYPES.MARKETING_ANALYTICS
    ],
    "large": [
      ANALYTICS_CARD_TYPES.PRODUCT_BREAKDOWN,
      ANALYTICS_CARD_TYPES.CATEGORY_BREAKDOWN
    ]
  };
  
  return categories[category] || [];
};
