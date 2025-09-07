import React from "react";
import {
  FiClock,
  FiBarChart2,
  FiUsers,
  FiCheckCircle,
  FiTrendingUp,
  FiUser,
  FiZap,
  FiPackage,
  FiTarget,
  FiArrowUp,
  FiArrowDown,
  FiMinus,
  FiVideo,
  FiCode,
  FiGlobe,
  FiShoppingBag,
} from "react-icons/fi";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { getMetricColor } from "@/utils/analyticsUtils";

// Chart components (same as homepage)
const ModernAreaChart = ({ data, color = "#eb2743" }) => {
  // Ensure we have valid data
  const validData = Array.isArray(data) && data.length > 0 ? data : [];
  
  if (validData.length === 0) {
    return (
      <div className="flex items-center justify-center h-20 text-gray-500 text-sm">
        No data available
      </div>
    );
  }
  
  return (
    <ResponsiveContainer width="100%" height={80}>
      <AreaChart
        data={validData}
        margin={{ top: 10, right: 10, left: 10, bottom: 10 }}
      >
        <defs>
          <linearGradient id={`area-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.8} />
            <stop offset="95%" stopColor={color} stopOpacity={0.1} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
        <Area
          type="monotone"
          dataKey="value"
          fill={`url(#area-${color.replace('#', '')})`}
          stroke={color}
          strokeWidth={3}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
};

const ModernBarChart = ({ data, color = "#a99952" }) => {
  // Ensure we have valid data
  const validData = Array.isArray(data) && data.length > 0 ? data : [];
  
  if (validData.length === 0) {
    return (
      <div className="flex items-center justify-center h-20 text-gray-500 text-sm">
        No data available
      </div>
    );
  }
  
  return (
    <ResponsiveContainer width="100%" height={80}>
      <BarChart data={validData} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
        <defs>
          <linearGradient id={`bar-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={1} />
            <stop offset="100%" stopColor={color} stopOpacity={0.3} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
        <Bar
          dataKey="value"
          fill={`url(#bar-${color.replace('#', '')})`}
          radius={[2, 2, 0, 0]}
          barSize={35}
        />
      </BarChart>
    </ResponsiveContainer>
  );
};

// Block Chart Component
const BlockChart = ({ data, color = "#a99952" }) => {
  // Ensure we have valid data
  const validData = Array.isArray(data) && data.length > 0 ? data : [];
  
  if (validData.length === 0) {
    return (
      <div className="flex items-center justify-center h-20 text-gray-500 text-sm">
        No data available
      </div>
    );
  }
  
  return (
    <div className="flex items-end justify-between h-16 px-2">
      {validData.map((item, index) => {
        const maxValue = Math.max(...validData.map(d => d.value));
        const height = maxValue > 0 ? (item.value / maxValue) * 100 : 0;
        
        return (
          <div key={index} className="flex flex-col items-center flex-1">
            <div 
              className="w-3 rounded-sm transition-all duration-500 ease-out"
              style={{ 
                height: `${height}%`,
                backgroundColor: color,
                opacity: 0.8
              }}
            ></div>
          </div>
        );
      })}
    </div>
  );
};

// Line Chart Component
const LineChart = ({ data, color = "#a99952" }) => {
  // Ensure we have valid data
  const validData = Array.isArray(data) && data.length > 0 ? data : [];
  
  if (validData.length === 0) {
    return (
      <div className="flex items-center justify-center h-20 text-gray-500 text-sm">
        No data available
      </div>
    );
  }
  
  return (
    <ResponsiveContainer width="100%" height={80}>
      <AreaChart
        data={validData}
        margin={{ top: 10, right: 10, left: 10, bottom: 10 }}
      >
        <defs>
          <linearGradient id={`line-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.8} />
            <stop offset="95%" stopColor={color} stopOpacity={0.1} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
        <Area
          type="monotone"
          dataKey="value"
          fill={`url(#line-${color.replace('#', '')})`}
          stroke={color}
          strokeWidth={2}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
};

// Mini Progress Chart
const MiniProgressChart = ({ value, maxValue = 100, color = "#a99952" }) => {
  const percentage = Math.min((value / maxValue) * 100, 100);
  
  return (
    <div className="h-16 flex items-center justify-center">
      <div className="w-full max-w-24 h-2 bg-gray-700/50 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-1000 ease-out"
          style={{
            width: `${percentage}%`,
            background: `linear-gradient(90deg, ${color} 0%, ${color}80 100%)`
          }}
        ></div>
      </div>
    </div>
  );
};

// Icon mapping for different card types
const getIconForType = (type) => {
  switch (type) {
    case "total-tasks":
      return FiCheckCircle;
    case "total-hours":
      return FiClock;
    case "ai-tasks":
      return FiTrendingUp;
    case "design":
      return FiBarChart2;
    case "video":
      return FiVideo;
    case "developer":
      return FiCode;
    case "reporters":
      return FiUsers;
    case "users":
      return FiUser;
    case "markets":
      return FiGlobe;
    case "products":
      return FiShoppingBag;
    default:
      return FiBarChart2;
  }
};

// Get trend icon component
const getTrendIconComponent = (direction) => {
  switch (direction) {
    case "up":
      return <FiArrowUp className="w-4 h-4 text-green-success" />;
    case "down":
      return <FiArrowDown className="w-4 h-4 text-red-error" />;
    default:
      return <FiMinus className="w-4 h-4 text-gray-400" />;
  }
};

// Format value based on type
const formatValue = (value, type) => {
  if (type === "total-hours" || type === "ai-hours") {
    return value.toString();
  }
  if (type === "percentage") {
    return `${value}%`;
  }
  return value.toString();
};

// Dynamic Card Component
const DynamicCard = ({ 
  cardData, 
  isLoading = false, 
  error = null,
  onClick 
}) => {
  const metricColor = getMetricColor(cardData.type);
  const IconComponent = getIconForType(cardData.type);

  // Handle loading state
  if (isLoading) {
    return (
      <div className="bg-gray-800 border border-gray-700/50 rounded-lg p-6 w-full animate-pulse">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-12 h-12 bg-gray-700 rounded-xl"></div>
          <div className="flex-1">
            <div className="h-4 bg-gray-700 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-gray-700 rounded w-1/2"></div>
          </div>
        </div>
        <div className="h-8 bg-gray-700 rounded w-1/2 mb-4"></div>
        <div className="space-y-3">
          <div className="h-3 bg-gray-700 rounded"></div>
          <div className="h-3 bg-gray-700 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  // Handle error state
  if (error) {
    return (
      <div className="bg-gray-800 border border-red-500/50 rounded-lg p-6 w-full">
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-3 rounded-xl bg-red-500/20">
            <IconComponent className="w-6 h-6 text-red-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-200">
              {cardData.title}
            </h3>
            <p className="text-xs text-gray-400 mt-1">Error loading data</p>
          </div>
        </div>
        <div className="text-red-400 text-sm">
          {error.message || "Failed to load data"}
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`bg-gray-800 border border-gray-700/50 rounded-lg p-6 w-full transition-all duration-300 hover:border-gray-600/50 ${
        onClick ? "cursor-pointer hover:scale-[1.02]" : ""
      }`}
      onClick={onClick}
    >
      <div className="h-auto">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div
                className="p-3 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: `${metricColor}20` }}
              >
                <IconComponent
                  className="w-6 h-6"
                  style={{ color: metricColor }}
                />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-200">
                  {cardData.title}
                </h3>
                <p className="text-xs text-gray-400 mt-1">{cardData.subtitle}</p>
              </div>
            </div>

            {/* Trend Indicator */}
            {cardData.trend && (
              <div className="flex items-center space-x-1 px-2 py-1 rounded bg-gray-700/30">
                {getTrendIconComponent(cardData.trendDirection)}
                <span className={`text-xs font-medium ${
                  cardData.trendDirection === 'up' ? 'text-green-success' : 
                  cardData.trendDirection === 'down' ? 'text-red-error' : 'text-gray-400'
                }`}>
                  {cardData.trend}
                </span>
              </div>
            )}
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {/* Main Value */}
            <div className="mb-6">
              <div className="text-3xl font-bold text-gray-100 mb-2">
                {formatValue(cardData.value, cardData.valueType)}
              </div>
              {cardData.trend && (
                <div className="text-sm text-gray-400 mb-1">{cardData.trend}</div>
              )}
            </div>

            {/* Chart Section - Different chart types */}
            {cardData.chartType && cardData.chartData && (
              <div className="mb-6 h-16">
                {cardData.chartType === "bar" ? (
                  <ModernBarChart data={cardData.chartData} color={metricColor} />
                ) : cardData.chartType === "area" ? (
                  <ModernAreaChart data={cardData.chartData} color={metricColor} />
                ) : cardData.chartType === "line" ? (
                  <LineChart data={cardData.chartData} color={metricColor} />
                ) : cardData.chartType === "blocks" ? (
                  <BlockChart data={cardData.chartData} color={metricColor} />
                ) : cardData.chartType === "progress" ? (
                  <MiniProgressChart 
                    value={cardData.progressValue || 0} 
                    maxValue={cardData.progressMax || 100} 
                    color={metricColor} 
                  />
                ) : null}
              </div>
            )}

            {/* Enhanced Data */}
            {cardData.additionalData && cardData.additionalData.length > 0 && (
              <div className="space-y-1.5 mb-6">
                <div className="text-xs text-gray-500 mb-2 font-medium">Metrics:</div>
                {cardData.additionalData.map((item, index) => (
                  <div 
                    key={index} 
                    className="flex items-center justify-between p-2 rounded-md bg-gray-700/15 border border-gray-600/10 transition-all duration-200 hover:bg-gray-700/25"
                  >
                    <div className="flex items-center space-x-2">
                      {item.icon && (
                        <item.icon 
                          className="w-3 h-3" 
                          style={{ color: metricColor, opacity: 0.7 }}
                        />
                      )}
                      <span className="text-xs text-gray-400">{item.label}</span>
                    </div>
                    <span className="text-xs font-medium text-gray-300">
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* AI Items */}
            {cardData.aiItems && (
              <div className="space-y-1.5 mb-4">
                <div className="text-xs text-gray-500 mb-2 font-medium">Top 3 AI:</div>
                {cardData.aiItems.length > 0 ? cardData.aiItems.slice(0, 3).map((item, index) => {
                  const colors = {
                    bg: `bg-gray-700/20`,
                    dot: metricColor,
                    border: `border-gray-600/20`,
                    dotOpacity: index === 0 ? '80' : index === 1 ? '60' : '40'
                  };
                  
                  return (
                    <div 
                      key={`ai-${index}`} 
                      className={`flex items-center justify-between p-2.5 rounded-md ${colors.bg} ${colors.border} border transition-all duration-200 hover:bg-gray-700/30`}
                    >
                      <div className="flex items-center space-x-2.5 flex-1 min-w-0">
                        <div 
                          className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                          style={{ 
                            backgroundColor: colors.dot,
                            opacity: parseInt(colors.dotOpacity) / 100
                          }}
                        ></div>
                        <span className="text-xs text-gray-300 truncate">
                          {item.name}
                        </span>
                      </div>
                      <div className="flex items-center space-x-1.5 ml-2">
                        <span className="text-xs font-medium text-gray-200">
                          {item.count}
                        </span>
                        {index === 0 && (
                          <span 
                            className="text-xs font-bold"
                            style={{ color: colors.dot }}
                          >
                            #
                          </span>
                        )}
                      </div>
                    </div>
                  );
                }) : (
                  <div className="text-xs text-gray-500 text-center py-2">No AI data available</div>
                )}
              </div>
            )}

            {/* Market Items */}
            {cardData.marketItems && (
              <div className="space-y-1.5 mb-4">
                <div className="text-xs text-gray-500 mb-2 font-medium">Top 3 Markets:</div>
                {cardData.marketItems.length > 0 ? cardData.marketItems.slice(0, 3).map((item, index) => {
                  const colors = {
                    bg: `bg-gray-700/20`,
                    dot: metricColor,
                    border: `border-gray-600/20`,
                    dotOpacity: index === 0 ? '80' : index === 1 ? '60' : '40'
                  };
                  
                  return (
                    <div 
                      key={`market-${index}`} 
                      className={`flex items-center justify-between p-2.5 rounded-md ${colors.bg} ${colors.border} border transition-all duration-200 hover:bg-gray-700/30`}
                    >
                      <div className="flex items-center space-x-2.5 flex-1 min-w-0">
                        <div 
                          className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                          style={{ 
                            backgroundColor: colors.dot,
                            opacity: parseInt(colors.dotOpacity) / 100
                          }}
                        ></div>
                        <span className="text-xs text-gray-300 truncate">
                          {item.name}
                        </span>
                      </div>
                      <div className="flex items-center space-x-1.5 ml-2">
                        <span className="text-xs font-medium text-gray-200">
                          {item.count}
                        </span>
                        {index === 0 && (
                          <span 
                            className="text-xs font-bold"
                            style={{ color: colors.dot }}
                          >
                            #
                          </span>
                        )}
                      </div>
                    </div>
                  );
                }) : (
                  <div className="text-xs text-gray-500 text-center py-2">No market data available</div>
                )}
              </div>
            )}

            {/* Reporter Items */}
            {cardData.reporterItems && (
              <div className="space-y-1.5 mb-6">
                <div className="text-xs text-gray-500 mb-2 font-medium">Top 3 Reporters:</div>
                {cardData.reporterItems.length > 0 ? cardData.reporterItems.slice(0, 3).map((item, index) => {
                  const colors = {
                    bg: `bg-gray-700/20`,
                    dot: metricColor,
                    border: `border-gray-600/20`,
                    dotOpacity: index === 0 ? '80' : index === 1 ? '60' : '40'
                  };
                  
                  return (
                    <div 
                      key={`reporter-${index}`} 
                      className={`flex items-center justify-between p-2.5 rounded-md ${colors.bg} ${colors.border} border transition-all duration-200 hover:bg-gray-700/30`}
                    >
                      <div className="flex items-center space-x-2.5 flex-1 min-w-0">
                        <div 
                          className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                          style={{ 
                            backgroundColor: colors.dot,
                            opacity: parseInt(colors.dotOpacity) / 100
                          }}
                        ></div>
                        <span className="text-xs text-gray-300 truncate">
                          {item.name}
                        </span>
                      </div>
                      <div className="flex items-center space-x-1.5 ml-2">
                        <span className="text-xs font-medium text-gray-200">
                          {item.count}
                        </span>
                        {index === 0 && (
                          <span 
                            className="text-xs font-bold"
                            style={{ color: colors.dot }}
                          >
                            #
                          </span>
                        )}
                      </div>
                    </div>
                  );
                }) : (
                  <div className="text-xs text-gray-500 text-center py-2">No reporter data available</div>
                )}
              </div>
            )}

            {/* Fallback Top 3 Items for other cards */}
            {!cardData.aiItems && !cardData.marketItems && !cardData.reporterItems && cardData.topItems && cardData.topItems.length > 0 && (
              <div className="space-y-1.5 mb-6">
                <div className="text-xs text-gray-500 mb-2 font-medium">Top 3:</div>
                {cardData.topItems.slice(0, 3).map((item, index) => {
                  const colors = {
                    bg: `bg-gray-700/20`,
                    dot: metricColor,
                    border: `border-gray-600/20`,
                    dotOpacity: index === 0 ? '80' : index === 1 ? '60' : '40'
                  };
                  
                  return (
                    <div 
                      key={index} 
                      className={`flex items-center justify-between p-2.5 rounded-md ${colors.bg} ${colors.border} border transition-all duration-200 hover:bg-gray-700/30`}
                    >
                      <div className="flex items-center space-x-2.5 flex-1 min-w-0">
                        <div 
                          className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                          style={{ 
                            backgroundColor: colors.dot,
                            opacity: parseInt(colors.dotOpacity) / 100
                          }}
                        ></div>
                        <span className="text-xs text-gray-300 truncate">
                          {item.name || item.model || item.market || item.product}
                        </span>
                      </div>
                      <div className="flex items-center space-x-1.5 ml-2">
                        <span className="text-xs font-medium text-gray-200">
                          {item.count || item.taskCount || item.hours}
                        </span>
                        {index === 0 && (
                          <span 
                            className="text-xs font-bold"
                            style={{ color: colors.dot }}
                          >
                            #
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};

export default DynamicCard;
