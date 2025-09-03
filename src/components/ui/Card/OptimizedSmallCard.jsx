import React, { memo } from "react";
import Loader from '../Loader/Loader';
import {
  formatAnalyticsValue,
  getDynamicTrend,
  getTrendColor,
  getTrendIcon,
  formatAdditionalInfo,
  getMetricColor,
  getEnhancedData,
} from "@/features/analytics";
import { FiArrowUp, FiArrowDown, FiMinus, FiZap, FiPackage, FiTarget } from "react-icons/fi";

/**
 * Enhanced Optimized SmallCard Component
 * Now works with data passed from parent/table instead of separate API calls
 */
const OptimizedSmallCard = ({
  title,
  type,
  category = null,
  icon: Icon,
  // Direct data props instead of analyticsData
  value = 0,
  additionalData = {},
  reporters = [],
  // UI props
  trend = false,
  trendValue = "",
  trendDirection = "up",
  className = "",
  onClick,
  isLoading = false,
  error = null,
  ...props
}) => {
  // No more useFetchData - use props directly!
  
  // Use provided data or fallback to zero values
  const metricData = {
    value: value || 0,
    additionalData: additionalData || {},
    isLoading: isLoading || false,
    error: error || null
  };

  const { value: metricValue, additionalData: metricAdditionalData, isLoading: metricLoading, error: metricError } = metricData;

  // Get dynamic trend information
  const dynamicTrend = getDynamicTrend(type, metricValue, []);

  // Get trend styling
  const trendColor = getTrendColor(trendDirection, dynamicTrend);
  const trendIcon = getTrendIcon(trendDirection, dynamicTrend);

  // Format the main value
  const formattedValue = formatAnalyticsValue(metricValue, type);

  // Format additional information
  const additionalInfo = formatAdditionalInfo(type, metricAdditionalData);

  // Get color and enhanced data for this metric
  const metricColor = getMetricColor(type);
  const enhancedData = getEnhancedData(type, metricValue, metricAdditionalData, reporters);

  // Get trend icon component
  const getTrendIconComponent = (direction) => {
    switch (direction) {
      case "up": return <FiArrowUp className="w-3 h-3 text-green-success" />;
      case "down": return <FiArrowDown className="w-3 h-3 text-red-error" />;
      default: return <FiMinus className="w-3 h-3 text-gray-400" />;
    }
  };

  // Handle error state
  if (metricError) {
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
          {metricLoading ? (
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
                      {Math.min(100, Math.floor((metricValue / (metricValue + 50)) * 100))}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-700/50 rounded-full h-2">
                    <div 
                      className="h-2 rounded-full transition-all duration-1000 ease-out"
                      style={{ 
                        width: `${Math.min(100, Math.floor((metricValue / (metricValue + 50)) * 100))}%`,
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

export default memo(OptimizedSmallCard);
