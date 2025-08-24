import { ANALYTICS_TYPES } from "../hooks/useTaskAnalytics";

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
      return `${value} users`;
    
    case ANALYTICS_TYPES.MARKETS:
    case ANALYTICS_TYPES.PRODUCTS:
      return `${value} active`;
    
    case ANALYTICS_TYPES.DEVELOPMENT:
    case ANALYTICS_TYPES.DESIGN:
    case ANALYTICS_TYPES.VIDEO:
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
 * Format additional information for task type cards (Development, Design, Video)
 * @param {Object} additionalData - Additional data from analytics
 * @returns {JSX.Element|null} Formatted additional info component
 */
export const formatTaskTypeAdditionalInfo = (additionalData) => {
  if (!additionalData) return null;
  
  const { totalHours, aiTasks, aiHours, avgHoursPerTask, aiPercentage } = additionalData;
  
  return (
    <div className="mt-3 space-y-2">
      <div className="flex items-center justify-between p-2 bg-gray-700/30 rounded-lg">
        <span className="text-xs text-gray-300">Total Hours</span>
        <span className="text-xs font-medium text-gray-200">{totalHours.toFixed(1)}h</span>
      </div>
      <div className="flex items-center justify-between p-2 bg-gray-700/30 rounded-lg">
        <span className="text-xs text-gray-300">Avg Hours/Task</span>
        <span className="text-xs font-medium text-gray-200">{avgHoursPerTask.toFixed(1)}h</span>
      </div>
      <div className="flex items-center justify-between p-2 bg-gray-700/30 rounded-lg">
        <span className="text-xs text-gray-300">AI Tasks</span>
        <span className="text-xs font-medium text-gray-200">{aiTasks} ({aiPercentage.toFixed(0)}%)</span>
      </div>
      {aiTasks > 0 && (
        <div className="flex items-center justify-between p-2 bg-gray-700/30 rounded-lg">
          <span className="text-xs text-gray-300">AI Hours</span>
          <span className="text-xs font-medium text-gray-200">{aiHours.toFixed(1)}h</span>
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
  if (!additionalData?.userStats) return null;
  
  const { userStats } = additionalData;
  const topUsers = userStats
    .sort((a, b) => b.tasks - a.tasks)
    .slice(0, 3);

  return (
    <div className="mt-3 space-y-2">
      {topUsers.map((user, index) => (
        <div
          key={user.name}
          className="flex items-center justify-between p-2 bg-gray-700/30 rounded-lg"
        >
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${
              index === 0 ? 'bg-yellow-400' : 
              index === 1 ? 'bg-gray-400' : 'bg-orange-500'
            }`}></div>
            <span className="text-xs text-gray-300 truncate max-w-20">{user.name}</span>
          </div>
          <div className="text-xs font-medium text-gray-200">
            {user.tasks}t / {user.hours.toFixed(1)}h
          </div>
        </div>
      ))}
      {userStats.length > 3 && (
        <div className="text-xs text-gray-500 text-center italic">
          +{userStats.length - 3} more users
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
  if (!additionalData?.markets) return null;
  
  const markets = additionalData.markets.sort((a, b) => b.count - a.count);
  
  return (
    <div className="mt-3 space-y-2">
      {markets.slice(0, 5).map((m, index) => (
        <div
          key={m.name}
          className="flex items-center justify-between p-2 bg-gray-700/30 rounded-lg"
        >
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${
              index === 0 ? 'bg-blue-400' : 
              index === 1 ? 'bg-green-400' : 
              index === 2 ? 'bg-purple-400' : 'bg-gray-400'
            }`}></div>
            <span className="text-xs text-gray-300 truncate max-w-20">{m.name}</span>
          </div>
          <div className="text-xs font-medium text-gray-200">
            {m.count} tasks
          </div>
        </div>
      ))}
      {markets.length > 5 && (
        <div className="text-xs text-gray-500 text-center italic">
          +{markets.length - 5} more markets
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
  if (!additionalData?.products) return null;
  
  const products = additionalData.products.sort((a, b) => b.count - a.count);
  
  return (
    <div className="mt-3 space-y-2">
      {products.slice(0, 5).map((p, index) => (
        <div
          key={p.name}
          className="flex items-center justify-between p-2 bg-gray-700/30 rounded-lg"
        >
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${
              index === 0 ? 'bg-indigo-400' : 
              index === 1 ? 'bg-pink-400' : 
              index === 2 ? 'bg-teal-400' : 'bg-gray-400'
            }`}></div>
            <span className="text-xs text-gray-300 truncate max-w-20">{p.name}</span>
          </div>
          <div className="text-xs font-medium text-gray-200">
            {p.count} tasks
          </div>
        </div>
      ))}
      {products.length > 5 && (
        <div className="text-xs text-gray-500 text-center italic">
          +{products.length - 5} more products
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
    
    case ANALYTICS_TYPES.MARKETS:
      return formatMarketsAdditionalInfo(additionalData);
    
    case ANALYTICS_TYPES.PRODUCTS:
      return formatProductsAdditionalInfo(additionalData);
    
    default:
      return null;
  }
};
