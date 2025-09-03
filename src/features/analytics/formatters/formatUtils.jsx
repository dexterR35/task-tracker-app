import { ANALYTICS_TYPES } from "../types/analyticsTypes";

/**
 * Format value based on analytics type
 * @param {number} value - The numeric value to format
 * @param {string} type - The analytics type
 * @returns {string} Formatted value string
 */
export const formatAnalyticsValue = (value, type) => {
  switch (type) {
    case ANALYTICS_TYPES.TOTAL_HOURS:
      return `${Number(value).toFixed(0)}h`;
    
    case ANALYTICS_TYPES.TOTAL_TIME_WITH_AI:
      return `${Number(value).toFixed(1)}h`;
    
    case ANALYTICS_TYPES.USER_PERFORMANCE:
    case ANALYTICS_TYPES.TOP_REPORTER:
      return `${value} users`;
    
    case ANALYTICS_TYPES.MARKETS:
    case ANALYTICS_TYPES.PRODUCTS:
      return `${value} active`;
    
    case ANALYTICS_TYPES.DEVELOPMENT:
    case ANALYTICS_TYPES.DESIGN:
    case ANALYTICS_TYPES.VIDEO:
    case ANALYTICS_TYPES.AI_TASKS:
    case ANALYTICS_TYPES.AI_COMBINED:
      return `${value} tasks`;
    
    default:
      return value.toString();
  }
};

/**
 * Get dynamic trend information based on analytics type and value
 * @param {string} type - The analytics type
 * @param {number} value - The current value
 * @param {Array} tasks - Array of tasks for percentage calculations
 * @returns {Object|null} Trend object with direction, color, icon, and label
 */
export const getDynamicTrend = (type, value, tasks = []) => {
  switch (type) {
    case ANALYTICS_TYPES.TOTAL_TASKS:
      if (value < 5) return { direction: "down", color: "text-red-error", icon: "↘", label: "Very Low" };
      if (value < 10) return { direction: "down", color: "text-orange-400", icon: "↘", label: "Low" };
      if (value < 15) return { direction: "neutral", color: "text-gray-300", icon: "→", label: "Normal" };
      if (value < 20) return { direction: "up", color: "text-green-400", icon: "↗", label: "High" };
      return { direction: "up", color: "text-green-success", icon: "↗", label: "Very High" };

    case ANALYTICS_TYPES.AI_TASKS:
      const aiPercentage = tasks.length > 0 ? (value / tasks.length) * 100 : 0;
      if (aiPercentage < 20) return { direction: "down", color: "text-red-error", icon: "↘", label: "Low AI Usage" };
      if (aiPercentage < 40) return { direction: "neutral", color: "text-gray-300", icon: "→", label: "Moderate AI" };
      return { direction: "up", color: "text-green-success", icon: "↗", label: "High AI Usage" };

    case ANALYTICS_TYPES.DEVELOPMENT:
    case ANALYTICS_TYPES.DESIGN:
    case ANALYTICS_TYPES.VIDEO:
      const typePercentage = tasks.length > 0 ? (value / tasks.length) * 100 : 0;
      if (value === 0) return { direction: "down", color: "text-red-error", icon: "↘", label: "No Tasks" };
      if (value < 2) return { direction: "down", color: "text-orange-400", icon: "↘", label: "Low Activity" };
      if (value < 5) return { direction: "neutral", color: "text-gray-300", icon: "→", label: "Normal" };
      return { direction: "up", color: "text-green-success", icon: "↗", label: "High Activity" };

    default:
      return null;
  }
};

/**
 * Get trend color based on direction or dynamic trend
 * @param {string} trendDirection - Static trend direction
 * @param {Object} dynamicTrend - Dynamic trend object
 * @returns {string} CSS color class
 */
export const getTrendColor = (trendDirection, dynamicTrend = null) => {
  if (dynamicTrend) return dynamicTrend.color;
  
  switch (trendDirection) {
    case "up":
      return "text-green-success";
    case "down":
      return "text-red-error";
    default:
      return "text-gray-300";
  }
};

/**
 * Get trend icon based on direction or dynamic trend
 * @param {string} trendDirection - Static trend direction
 * @param {Object} dynamicTrend - Dynamic trend object
 * @returns {string} Trend icon
 */
export const getTrendIcon = (trendDirection, dynamicTrend = null) => {
  if (dynamicTrend) return dynamicTrend.icon;
  
  switch (trendDirection) {
    case "up":
      return "↗";
    case "down":
      return "↘";
    default:
      return "→";
  }
};

/**
 * Get color based on metric type
 * @param {string} type - The analytics type
 * @returns {string} Color hex code
 */
export const getMetricColor = (type) => {
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
    case 'user-reporter': return "#3d48c9";
    case 'markets': return "#2fd181";
    case 'products': return "#538cff";
    default: return "#3d48c9";
  }
};

/**
 * Get enhanced data from analytics
 * @param {string} type - The analytics type
 * @param {number} value - The metric value
 * @param {Object} additionalData - Additional analytics data
 * @param {Array} reporters - Array of reporters
 * @returns {Object} Enhanced data object
 */
export const getEnhancedData = (type, value, additionalData, reporters) => {
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
    case 'top-reporter':
      return {
        subtitle: "Reporter Team",
        bestAI: null, // Not shown for reporter
        deliverables: null, // Not shown for reporter
        bestCategory: null, // Not shown for reporter
        trend: "+12% from last month"
      };
    case 'user-reporter':
      return {
        subtitle: "All Reporters",
        bestAI: null, // Not shown for reporter
        deliverables: null, // Not shown for reporter
        bestCategory: null, // Not shown for reporter
        trend: "+12% from last month"
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
 * Format additional information for task type cards (Development, Design, Video)
 * @param {Object} additionalData - Additional data from analytics
 * @returns {JSX.Element|null} Formatted additional info component
 */
export const formatTaskTypeAdditionalInfo = (additionalData) => {
  if (!additionalData) return null;
  
  const { totalHours, aiTasks, aiHours, avgHoursPerTask, aiPercentage } = additionalData;
  
  // Ensure all values are numbers
  const safeTotalHours = typeof totalHours === 'number' ? totalHours : parseFloat(totalHours) || 0;
  const safeAvgHoursPerTask = typeof avgHoursPerTask === 'number' ? avgHoursPerTask : parseFloat(avgHoursPerTask) || 0;
  const safeAiPercentage = typeof aiPercentage === 'number' ? aiPercentage : parseFloat(aiPercentage) || 0;
  const safeAiHours = typeof aiHours === 'number' ? aiHours : parseFloat(aiHours) || 0;
  
  return (
    <div className="mt-3 space-y-2">
      <div className="flex items-center justify-between p-2 bg-gray-700/30 rounded-lg">
        <span className="text-xs text-gray-300">Total Hours</span>
        <span className="text-xs font-medium text-gray-300">{safeTotalHours.toFixed(1)}h</span>
      </div>
      <div className="flex items-center justify-between p-2 bg-gray-700/30 rounded-lg">
        <span className="text-xs text-gray-300">Avg Hours/Task</span>
        <span className="text-xs font-medium text-gray-300">{safeAvgHoursPerTask.toFixed(1)}h</span>
      </div>
      <div className="flex items-center justify-between p-2 bg-gray-700/30 rounded-lg">
        <span className="text-xs text-gray-300">AI Tasks</span>
        <span className="text-xs font-medium text-gray-300">{aiTasks} ({safeAiPercentage.toFixed(0)}%)</span>
      </div>
      {aiTasks > 0 && (
        <div className="flex items-center justify-between p-2 bg-gray-700/30 rounded-lg">
          <span className="text-xs text-gray-300">AI Hours</span>
          <span className="text-xs font-medium text-gray-300">{safeAiHours.toFixed(1)}h</span>
        </div>
      )}
    </div>
  );
};

/**
 * Format additional information for user performance card
 * @param {Object} additionalData - Additional data from analytics
 * @returns {JSX.Element|null} Formatted additional info component
 */
export const formatUserPerformanceAdditionalInfo = (additionalData) => {
  // Check if we have performance data
  if (!additionalData?.completedTasks && !additionalData?.overallScore) {
    return (
      <div className="mt-3 text-xs text-gray-500 text-center">
        No performance data available
      </div>
    );
  }
  
  return (
    <div className="mt-3 space-y-2">
      {additionalData.completedTasks > 0 && (
        <div className="flex items-center justify-between p-2 bg-gray-700/30 rounded-lg">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 rounded-full bg-green-400"></div>
            <span className="text-xs text-gray-300">Completed Tasks</span>
          </div>
          <div className="text-xs font-medium text-gray-300">
            {additionalData.completedTasks}
          </div>
        </div>
      )}
      
      {additionalData.overallScore > 0 && (
        <div className="flex items-center justify-between p-2 bg-gray-700/30 rounded-lg">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 rounded-full bg-blue-400"></div>
            <span className="text-xs text-gray-300">Performance Score</span>
          </div>
          <div className="text-xs font-medium text-gray-300">
            {Math.round(additionalData.overallScore)}%
          </div>
        </div>
      )}
      
      {(additionalData.efficiency > 0 || additionalData.productivity > 0) && (
        <div className="text-xs text-gray-500 text-center">
          Efficiency: {Math.round(additionalData.efficiency)}% • Productivity: {Math.round(additionalData.productivity)}%
        </div>
      )}
    </div>
  );
};

/**
 * Format additional information for top reporter card
 * @param {Object} additionalData - Additional data from analytics
 * @returns {JSX.Element|null} Formatted additional info component
 */
export const formatTopReporterAdditionalInfo = (additionalData) => {
  // Check if we have reporter data
  if (!additionalData?.reporterName || additionalData.reporterName === 'Unknown') {
    return (
      <div className="mt-3 text-xs text-gray-500 text-center">
        No reporter data available
      </div>
    );
  }
  
  return (
    <div className="mt-3 space-y-2">
      <div className="flex items-center justify-between p-2 bg-gray-700/30 rounded-lg">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
          <div className="flex flex-col">
            <span className="text-xs text-gray-300 truncate max-w-20">
              {additionalData.reporterName}
            </span>
            <span className="text-xs text-gray-500">Top Reporter</span>
          </div>
        </div>
        <div className="text-xs font-medium text-gray-300">
          {additionalData.topReporterTasks || 0} tasks
        </div>
      </div>
      
      {additionalData.totalHours > 0 && (
        <div className="text-xs text-gray-500 text-center">
          {additionalData.totalHours}h total • {additionalData.averageHours}h avg
        </div>
      )}
    </div>
  );
};

/**
 * Format additional information for user reporter card (All Reporters)
 * @param {Object} additionalData - Additional data from analytics
 * @returns {JSX.Element|null} Formatted additional info component
 */
export const formatUserReporterAdditionalInfo = (additionalData) => {
  // Check if we have reporter data
  if (!additionalData?.userReporters || additionalData.userReporters.length === 0) {
    return (
      <div className="mt-3 text-xs text-gray-500 text-center">
        No reporter data available
      </div>
    );
  }
  
  return (
    <div className="mt-3 space-y-2">
      {additionalData.userReporters.slice(0, 3).map((reporter, index) => (
        <div
          key={`reporter-${reporter.id}-${index}`}
          className="flex items-center justify-between p-2 bg-gray-700/30 rounded-lg"
        >
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 rounded-full bg-blue-400"></div>
            <div className="flex flex-col">
              <span className="text-xs font-medium text-gray-200 truncate max-w-24">
                {reporter.name}
              </span>
              <span className="text-xs text-gray-400">
                {reporter.totalTasks}t / {reporter.totalHours.toFixed(1)}h
              </span>
            </div>
          </div>
          <div className="text-xs text-gray-400">
            {reporter.completionRate.toFixed(0)}%
          </div>
        </div>
      ))}
      {additionalData.userReporters.length > 3 && (
        <div className="text-xs text-gray-500 text-center">
          +{additionalData.userReporters.length - 3} more reporters
        </div>
      )}
    </div>
  );
};

/**
 * Format additional information for markets card
 * @param {Object} additionalData - Additional data from analytics
 * @returns {JSX.Element|null} Formatted additional info component
 */
export const formatMarketsAdditionalInfo = (additionalData) => {
  if (!additionalData?.marketData || Object.keys(additionalData.marketData).length === 0) {
    return (
      <div className="mt-3 text-xs text-gray-500 text-center">
        No market data available
      </div>
    );
  }
  
  const markets = Object.entries(additionalData.marketData)
    .map(([name, data]) => ({ name, count: data.count || 0 }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
  
  return (
    <div className="mt-3 space-y-2">
      {markets.map((market, index) => (
        <div
          key={`market-${market.name}-${index}`}
          className="flex items-center justify-between p-2 bg-gray-700/30 rounded-lg"
        >
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${
              index === 0 ? 'bg-blue-400' : 
              index === 1 ? 'bg-green-400' : 
              index === 2 ? 'bg-purple-400' : 'bg-gray-400'
            }`}></div>
            <span className="text-xs text-gray-300 truncate max-w-20">{market.name}</span>
          </div>
          <div className="text-xs font-medium text-gray-200">
            {market.count} tasks
          </div>
        </div>
      ))}
      {Object.keys(additionalData.marketData).length > 5 && (
        <div className="text-xs text-gray-500 text-center italic">
          +{Object.keys(additionalData.marketData).length - 5} more markets
        </div>
      )}
    </div>
  );
};

/**
 * Format additional information for products card
 * @param {Object} additionalData - Additional data from analytics
 * @returns {JSX.Element|null} Formatted additional info component
 */
export const formatProductsAdditionalInfo = (additionalData) => {
  if (!additionalData?.productData || Object.keys(additionalData.productData).length === 0) {
    return (
      <div className="mt-3 text-xs text-gray-500 text-center">
        No product data available
      </div>
    );
  }
  
  const products = Object.entries(additionalData.productData)
    .map(([name, data]) => ({ name, count: data.count || 0 }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
  
  return (
    <div className="mt-3 space-y-2">
      {products.map((product, index) => (
        <div
          key={`product-${product.name}-${index}`}
          className="flex items-center justify-between p-2 bg-gray-700/30 rounded-lg"
        >
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${
              index === 0 ? 'bg-purple-400' : 
              index === 1 ? 'bg-pink-400' : 
              index === 2 ? 'bg-indigo-400' : 'bg-gray-400'
            }`}></div>
            <span className="text-xs text-gray-300 truncate max-w-20">{product.name}</span>
          </div>
          <div className="text-xs font-medium text-gray-200">
            {product.count} tasks
          </div>
        </div>
      ))}
      {Object.keys(additionalData.productData).length > 5 && (
        <div className="text-xs text-gray-500 text-center italic">
          +{Object.keys(additionalData.productData).length - 5} more products
        </div>
      )}
    </div>
  );
};

/**
 * Get the appropriate additional info formatter based on analytics type
 * @param {string} type - The analytics type
 * @param {Object} additionalData - Additional data from analytics
 * @returns {JSX.Element|null} Formatted additional info component
 */
export const formatAdditionalInfo = (type, additionalData) => {
  switch (type) {
    case ANALYTICS_TYPES.DEVELOPMENT:
    case ANALYTICS_TYPES.DESIGN:
    case ANALYTICS_TYPES.VIDEO:
      return formatTaskTypeAdditionalInfo(additionalData);
    
    case ANALYTICS_TYPES.USER_PERFORMANCE:
      return formatUserPerformanceAdditionalInfo(additionalData);
    
    case ANALYTICS_TYPES.TOP_REPORTER:
      return formatTopReporterAdditionalInfo(additionalData);
    
    case ANALYTICS_TYPES.USER_REPORTER:
      return formatUserReporterAdditionalInfo(additionalData);
    
    case ANALYTICS_TYPES.MARKETS:
      return formatMarketsAdditionalInfo(additionalData);
    
    case ANALYTICS_TYPES.PRODUCTS:
      return formatProductsAdditionalInfo(additionalData);
    
    default:
      return null;
  }
};
