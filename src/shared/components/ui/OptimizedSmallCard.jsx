import React from "react";
import Loader from './Loader';
import {
  formatAnalyticsValue,
  getDynamicTrend,
  getTrendColor,
  getTrendIcon,
  formatAdditionalInfo,
} from "../../utils/formatUtils.jsx";
import { FiArrowUp, FiArrowDown, FiMinus, FiUser, FiZap, FiPackage, FiTarget, FiTrendingUp, FiTrendingDown, FiActivity } from "react-icons/fi";
import { useCentralizedDataAnalytics } from "../../../shared/hooks/analytics/useCentralizedDataAnalytics";
import { useAuth } from "../../hooks/useAuth";
import { useGlobalMonthId } from "../../hooks/useGlobalMonthId";

// Get color based on metric type
const getMetricColor = (type) => {
  switch (type) {
    case 'total-tasks': return "#3d48c9";
    case 'total-hours': return "#2fd181";
    case 'total-time-with-ai': return "#538cff";
    case 'ai-tasks': return "#a99952";
    case 'ai-combined': return "#a99952";
    case 'development': return "#c10f29";
    case 'design': return "#eb2743";
    case 'video': return "#a99952";
    case 'user-performance': return "#3d48c9";
    case 'top-reporter': return "#3d48c9";
    case 'markets': return "#2fd181";
    case 'products': return "#538cff";
    default: return "#3d48c9";
  }
};

// Get reporter name from reporter ID (supports both document ID and reporterUID)
const getReporterName = (reporterId, reporters) => {
  if (!reporterId || !reporters || !Array.isArray(reporters)) {
    return "Unknown Reporter";
  }

  const reporter = reporters.find(r => r.id === reporterId || r.reporterUID === reporterId);
  return reporter ? reporter.name : "Unknown Reporter";
};

// Get enhanced data from analytics
const getEnhancedData = (type, value, additionalData, reporters) => {
  const bestAI = additionalData?.aiUsage ? 
    Object.entries(additionalData.aiUsage).reduce((best, [ai, count]) => 
      count > (best.count || 0) ? { ai, count } : best, { ai: "No AI Used", count: 0 }
    ).ai : null;
  
  const deliverables = additionalData?.deliverables || null;
  const bestCategory = additionalData?.bestCategory || "N/A";
  
  switch (type) {
    case 'total-tasks':
      return {
        subtitle: "Active Tasks",
        bestAI: null, // Not shown for tasks
        deliverables: null, // Not shown for tasks
        bestCategory: bestCategory,
        trend: "+12% from last month"
      };
    case 'total-hours':
      return {
        subtitle: "Hours Tracked",
        bestAI: null, // Not shown for hours
        deliverables: null, // Not shown for hours
        bestCategory: bestCategory,
        trend: "+8% from last month"
      };
    case 'total-time-with-ai':
      return {
        subtitle: "AI Assisted Time",
        bestAI: null, // Not shown for AI time
        deliverables: null, // Not shown for AI time
        bestCategory: bestCategory,
        trend: "+15% from last month"
      };
    case 'ai-tasks':
      return {
        subtitle: "AI Enhanced Tasks",
        bestAI: bestAI, // Only shown for AI tasks
        deliverables: null, // Not shown for AI tasks
        bestCategory: bestCategory,
        trend: "+20% from last month"
      };
    case 'ai-combined':
      return {
        subtitle: "AI Analytics",
        bestAI: bestAI, // Show best AI
        deliverables: null, // Not shown for AI
        bestCategory: bestCategory,
        trend: "+20% from last month"
      };
    case 'development':
      return {
        subtitle: "Development Work",
        bestAI: null, // Not shown for development
        deliverables: null, // Not shown for development
        bestCategory: bestCategory,
        trend: "+10% from last month"
      };
    case 'design':
      return {
        subtitle: "Design Projects",
        bestAI: null, // Not shown for design
        deliverables: deliverables, // Only shown for design
        bestCategory: bestCategory,
        trend: "+18% from last month"
      };
    case 'video':
      return {
        subtitle: "Video Production",
        bestAI: null, // Not shown for video
        deliverables: null, // Not shown for video
        bestCategory: bestCategory,
        trend: "+25% from last month"
      };
    case 'user-performance':
      return {
        subtitle: "Team Performance",
        bestAI: null, // Not shown for performance
        deliverables: null, // Not shown for performance
        bestCategory: bestCategory,
        trend: "+5% from last month"
      };
    case 'markets':
      return {
        subtitle: "Active Markets",
        bestAI: null, // Not shown for markets
        deliverables: null, // Not shown for markets
        bestCategory: bestCategory,
        trend: "+3% from last month"
      };
    case 'products':
      return {
        subtitle: "Product Focus",
        bestAI: null, // Not shown for products
        deliverables: null, // Not shown for products
        bestCategory: bestCategory,
        trend: "+7% from last month"
      };
    case 'top-reporter':
      return {
        subtitle: "Reporter Team",
        bestAI: null, // Not shown for reporter
        deliverables: null, // Not shown for reporter
        bestCategory: null, // Not shown for reporter
        trend: "+12% from last month"
      };
    default:
      return {
        subtitle: "Current Period",
        bestAI: null,
        deliverables: null,
        bestCategory: "N/A",
        trend: "+0% from last month"
      };
  }
};

/**
 * Enhanced Optimized SmallCard Component
 * Uses analytics data directly from the analytics calculator
 */
const OptimizedSmallCard = ({
  title,
  type,
  category = null,
  userId = null,
  icon: Icon,
  trend,
  trendValue,
  trendDirection = "neutral",
  className = "",
  onClick,
  analyticsData = null,
  ...props
}) => {
  // Get reporters data from analytics or API - only if authenticated
  const { user } = useAuth();
  const { monthId } = useGlobalMonthId();
  
  // Use reporters data from analytics if available, otherwise fallback to API
  let reporters = [];
  if (analyticsData && analyticsData.additionalData && analyticsData.additionalData.reporterStats) {
    // Extract reporters from analytics data
    reporters = Object.values(analyticsData.additionalData.reporterStats).map(reporter => ({
      id: reporter.id,
      name: reporter.name,
      occupation: reporter.occupation || "Reporter",
      department: reporter.department || "Unknown"
    }));
  } else {
    // Fallback to API call only if needed
    const shouldCallAnalytics = user && monthId && typeof monthId === 'string' && monthId.match(/^\d{4}-\d{2}$/);
    const { reporters: apiReporters = [] } = useCentralizedDataAnalytics(
      shouldCallAnalytics ? monthId : null
    );
    reporters = apiReporters;
  }

  // Use provided analytics data or fallback to zero values
  const metricData = analyticsData || {
    value: 0,
    additionalData: {},
    isLoading: false,
    error: null
  };

  const { value, additionalData, isLoading, error } = metricData;

  // Get dynamic trend information
  const dynamicTrend = getDynamicTrend(type, value, []);

  // Get trend styling
  const trendColor = getTrendColor(trendDirection, dynamicTrend);
  const trendIcon = getTrendIcon(trendDirection, dynamicTrend);

  // Format the main value
  const formattedValue = formatAnalyticsValue(value, type);

  // Format additional information
  const additionalInfo = formatAdditionalInfo(type, additionalData);

  // Get color and enhanced data for this metric
  const metricColor = getMetricColor(type);
  const enhancedData = getEnhancedData(type, value, additionalData, reporters);

  // Get trend icon component
  const getTrendIconComponent = (direction) => {
    switch (direction) {
      case "up": return <FiArrowUp className="w-3 h-3 text-green-success" />;
      case "down": return <FiArrowDown className="w-3 h-3 text-red-error" />;
      default: return <FiMinus className="w-3 h-3 text-gray-400" />;
    }
  };

  // Handle error state
  if (error) {
    return (
      <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-lg p-6 transition-all duration-300">
        <div className="flex flex-col h-full">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-3">
              {Icon && (
                <div className="p-2 rounded-md bg-gray-700/50">
                  <Icon className="w-5 h-5 text-gray-300" />
                </div>
              )}
              <h3 className="text-sm font-semibold text-gray-200">
                {title}
              </h3>
            </div>
          </div>
          <div className="flex-1 flex items-center justify-center">
            <div className="text-red-400 text-sm">Error loading data</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`group transition-all duration-300 hover:scale-[1.02] ${
        onClick ? "cursor-pointer" : ""
      } ${className}`}
      onClick={onClick}
      {...props}
    >
      <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 hover:border-gray-600/50 rounded-lg p-6 h-full transition-all duration-300">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center space-x-3">
              {Icon && (
                <div 
                  className="p-3 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: `${metricColor}20` }}
                >
                  <Icon 
                    className="w-6 h-6" 
                    style={{ color: metricColor }}
                  />
                </div>
              )}
              <div>
                <h3 className="text-sm font-semibold text-gray-200">
                  {title}
                </h3>
                <span className="text-xs text-gray-400 mt-1 block">
                  {enhancedData.subtitle}
                </span>
              </div>
            </div>
            
            {/* Trend Indicator */}
            {(dynamicTrend || trend) && (
              <div className="flex items-center space-x-1 px-2 py-1 rounded bg-gray-700/30">
                {getTrendIconComponent(trendDirection)}
                <span className="text-xs font-medium text-green-success">
                  {dynamicTrend?.percentage || "+0%"}
                </span>
              </div>
            )}
          </div>

          {/* Main Content */}
          {isLoading ? (
            <div className="flex-1 flex items-center justify-center">
              <Loader />
            </div>
          ) : (
            <div className="flex-1">
              {/* Main Value */}
              <div className="mb-6">
                <div className="text-3xl font-bold text-gray-100 mb-2">
                  {formattedValue}
                </div>
                <div className="text-sm text-gray-400 mb-1">
                  {enhancedData.trend}
                </div>
              </div>

              {/* Enhanced Data - Only show for non-reporter cards */}
              {type !== 'top-reporter' && (
                <div className="space-y-3 mb-6">
                  {/* Only show best AI for AI task cards */}
                  {enhancedData.bestAI !== null && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <FiZap className="w-3 h-3 text-gray-400" />
                        <span className="text-xs text-gray-400">Best AI</span>
                      </div>
                      <span className="text-sm font-medium text-gray-200">
                        {enhancedData.bestAI}
                      </span>
                    </div>
                  )}
                  {/* Only show deliverables for design cards */}
                  {enhancedData.deliverables !== null && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <FiPackage className="w-3 h-3 text-gray-400" />
                        <span className="text-xs text-gray-400">Deliverables</span>
                      </div>
                      <span className="text-sm font-medium text-gray-200">
                        {enhancedData.deliverables}
                      </span>
                    </div>
                  )}
                  {/* Only show best category for non-reporter cards */}
                  {enhancedData.bestCategory !== null && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <FiTarget className="w-3 h-3 text-gray-400" />
                        <span className="text-xs text-gray-400">Best Category</span>
                      </div>
                      <span className="text-sm font-medium text-gray-200">
                        {enhancedData.bestCategory}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Progress Bar - Only show for non-reporter cards */}
              {type !== 'top-reporter' && (
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-400">Progress</span>
                    <span className="text-xs text-gray-400">
                      {Math.min(100, Math.floor((value / (value + 50)) * 100))}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-700/50 rounded-full h-2">
                    <div 
                      className="h-2 rounded-full transition-all duration-1000 ease-out"
                      style={{ 
                        width: `${Math.min(100, Math.floor((value / (value + 50)) * 100))}%`,
                        backgroundColor: metricColor 
                      }}
                    ></div>
                  </div>
                </div>
              )}

              {/* Additional Info */}
              {additionalInfo && (
                <div className="border-t border-gray-600/50 pt-4 mt-auto">
                  <span className="text-gray-400 text-sm">{additionalInfo}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OptimizedSmallCard;
