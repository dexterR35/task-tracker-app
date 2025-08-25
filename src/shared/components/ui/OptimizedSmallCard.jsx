import React from "react";
import Loader from './Loader';
import {
  formatAnalyticsValue,
  getDynamicTrend,
  getTrendColor,
  getTrendIcon,
  formatAdditionalInfo,
} from "../../utils/formatUtils.jsx";

/**
 * Optimized SmallCard Component
 * Uses centralized analytics data instead of individual API calls
 */
const OptimizedSmallCard = ({
  title,
  type,
  category = null,
  monthId,
  userId = null,
  icon: Icon,
  trend,
  trendValue,
  trendDirection = "neutral",
  className = "",
  onClick,
  loading = false,
  // Analytics data from centralized calculator
  analyticsData = null,
  ...props
}) => {
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

  // Handle error state
  if (error) {
    return (
      <div className={`card p-6 transition-all duration-300 ${className}`}>
        <div className="flex flex-col h-full">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-start space-x-3">
              {Icon && (
                <div className="p-2 bg-gray-600 rounded-md">
                  <Icon className="w-5 h-5 text-gray-200" />
                </div>
              )}
              <h3 className="text-sm font-semibold uppercase tracking-wide leading-4">
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
      className={`card p-6 transition-all duration-300 ${
        onClick ? "cursor-pointer hover:bg-gray-600" : ""
      } ${className}`}
      onClick={onClick}
      {...props}
    >
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start space-x-3">
            {Icon && (
              <div className="p-2 bg-gray-600 rounded-md">
                <Icon className="w-5 h-5 text-gray-200" />
              </div>
            )}
            <h3 className="text-sm font-semibold uppercase tracking-wide leading-4">
              {title}
            </h3>
          </div>
          
          {/* Dynamic Trend Indicator */}
          {(dynamicTrend || trend) && (
            <div className={`flex items-center space-x-1 px-2 py-1 rounded-full bg-gray-700/50 ${trendColor}`}>
              <span className="text-sm font-bold">{trendIcon}</span>
              {dynamicTrend?.label && <span className="text-xs font-medium">{dynamicTrend.label}</span>}
              {!dynamicTrend?.label && trendValue && <span className="text-xs font-medium">{trendValue}</span>}
            </div>
          )}
        </div>

        {/* Main Content */}
        {isLoading || loading ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader />
          </div>
        ) : (
          <div className="flex-1">
            {/* Main Value */}
            <div className="mb-4">
              <div className="text-3xl font-bold text-gray-100 mb-1">
                {formattedValue}
              </div>
              {dynamicTrend && (
                <div className={`text-xs font-medium ${trendColor}`}>
                  {dynamicTrend.label}
                </div>
              )}
            </div>

            {/* Additional Info */}
            {additionalInfo && (
              <div className="border-t border-gray-600/50 pt-4">
                {additionalInfo}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default OptimizedSmallCard;
