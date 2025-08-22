import React, { useMemo } from "react";
import { useSubscribeToMonthTasksQuery } from "../../../redux/services/tasksApi";
import useFormat from "../../../hooks/useFormat";

const SmallCard = ({
  title,
  monthId,
  userId = null,
  icon: Icon,
  trend,
  trendValue,
  trendDirection = "neutral", // "up", "down", "neutral"
  className = "",
  onClick,
  loading = false,
  ...props
}) => {
  const { format } = useFormat();

  // Use the proper RTK Query hook for real-time data
  const { data: tasks = [], isLoading, error } = useSubscribeToMonthTasksQuery(
    { monthId, userId, useCache: true },
    { skip: !monthId }
  );

  // Calculate value from real-time data
  const cardData = useMemo(() => {
    if (!monthId) return { value: 0, isLoading: false, error: null };

    // Filter tasks by user if userId is provided (though the query should already handle this)
    const filteredTasks = userId
      ? tasks.filter((task) => task.userUID === userId)
      : tasks;

    // Calculate value based on title
    let value = 0;
    let additionalData = {};

    if (title === "Total Tasks") {
      value = filteredTasks.length;
    } else if (title === "Total Hours") {
      value = filteredTasks.reduce(
        (sum, task) => sum + (parseFloat(task.timeInHours) || 0),
        0
      );
    } else if (title === "Total Time with AI") {
      value = filteredTasks
        .filter((task) => task.aiUsed)
        .reduce((sum, task) => sum + (parseFloat(task.timeSpentOnAI) || 0), 0);
    } else if (title === "AI Tasks") {
      value = filteredTasks.filter((task) => task.aiUsed).length;
    } else if (title === "Development") {
      // Count development-related tasks and calculate stats
      const devTasks = filteredTasks.filter((task) => {
        const taskName = (task.taskName || "").toLowerCase();
        return taskName === "dev";
      });
      
      value = devTasks.length;
      const devHours = devTasks.reduce((sum, task) => sum + (parseFloat(task.timeInHours) || 0), 0);
      const devAITasks = devTasks.filter(task => task.aiUsed).length;
      const devAIHours = devTasks.reduce((sum, task) => sum + (task.aiUsed ? (parseFloat(task.timeSpentOnAI) || 0) : 0), 0);
      
      additionalData = {
        totalHours: devHours,
        aiTasks: devAITasks,
        aiHours: devAIHours,
        avgHoursPerTask: devTasks.length > 0 ? devHours / devTasks.length : 0,
        aiPercentage: devTasks.length > 0 ? (devAITasks / devTasks.length) * 100 : 0,
        tasks: devTasks
      };
    } else if (title === "Design") {
      // Count design-related tasks and calculate stats
      const designTasks = filteredTasks.filter((task) => {
        const taskName = (task.taskName || "").toLowerCase();
        return taskName === "design";
      });
      
      value = designTasks.length;
      const designHours = designTasks.reduce((sum, task) => sum + (parseFloat(task.timeInHours) || 0), 0);
      const designAITasks = designTasks.filter(task => task.aiUsed).length;
      const designAIHours = designTasks.reduce((sum, task) => sum + (task.aiUsed ? (parseFloat(task.timeSpentOnAI) || 0) : 0), 0);
      
      additionalData = {
        totalHours: designHours,
        aiTasks: designAITasks,
        aiHours: designAIHours,
        avgHoursPerTask: designTasks.length > 0 ? designHours / designTasks.length : 0,
        aiPercentage: designTasks.length > 0 ? (designAITasks / designTasks.length) * 100 : 0,
        tasks: designTasks
      };
    } else if (title === "Video") {
      // Count video-related tasks and calculate stats
      const videoTasks = filteredTasks.filter((task) => {
        const taskName = (task.taskName || "").toLowerCase();
        return taskName === "video";
      });
      
      value = videoTasks.length;
      const videoHours = videoTasks.reduce((sum, task) => sum + (parseFloat(task.timeInHours) || 0), 0);
      const videoAITasks = videoTasks.filter(task => task.aiUsed).length;
      const videoAIHours = videoTasks.reduce((sum, task) => sum + (task.aiUsed ? (parseFloat(task.timeSpentOnAI) || 0) : 0), 0);
      
      additionalData = {
        totalHours: videoHours,
        aiTasks: videoAITasks,
        aiHours: videoAIHours,
        avgHoursPerTask: videoTasks.length > 0 ? videoHours / videoTasks.length : 0,
        aiPercentage: videoTasks.length > 0 ? (videoAITasks / videoTasks.length) * 100 : 0,
        tasks: videoTasks
      };
    } else if (title === "User Performance") {
      // Group tasks by user and calculate performance
      const userStats = {};
      filteredTasks.forEach((task) => {
        if (!userStats[task.userUID]) {
          userStats[task.userUID] = {
            name: task.createdByName || task.userUID,
            tasks: 0,
            hours: 0,
          };
        }
        userStats[task.userUID].tasks += 1;
        userStats[task.userUID].hours += parseFloat(task.timeInHours) || 0;
      });

      // Calculate average performance
      const users = Object.values(userStats);
      if (users.length > 0) {
        const totalTasks = users.reduce((sum, user) => sum + user.tasks, 0);
        const totalHours = users.reduce((sum, user) => sum + user.hours, 0);
        value = users.length; // Show number of users
        additionalData = {
          totalHours,
          avgHoursPerTask: totalTasks > 0 ? totalHours / totalTasks : 0,
          userStats: users,
          totalTasks,
        };
      }
    } else if (title === "Markets") {
      const marketStats = {};
      filteredTasks.forEach((task) => {
        if (Array.isArray(task.markets)) {
          task.markets.forEach((market) => {
            if (!marketStats[market]) {
              marketStats[market] = { count: 0, hours: 0 };
            }
            marketStats[market].count += 1;
            marketStats[market].hours += parseFloat(task.timeInHours) || 0;
          });
        }
      });
    
      const markets = Object.entries(marketStats).map(([market, stats]) => ({
        name: market,
        count: stats.count,
        hours: stats.hours,
      }));
    
      value = markets.length; // number of unique markets
      additionalData = { markets };
    } else if (title === "Products") {
      const productStats = {};
      filteredTasks.forEach((task) => {
        if (task.product) {
          if (!productStats[task.product]) {
            productStats[task.product] = { count: 0, hours: 0 };
          }
          productStats[task.product].count += 1;
          productStats[task.product].hours += parseFloat(task.timeInHours) || 0;
        }
      });
    
      const products = Object.entries(productStats).map(([product, stats]) => ({
        name: product,
        count: stats.count,
        hours: stats.hours,
      }));
    
      value = products.length; // number of unique products
      additionalData = { products };
    }

    return { value, isLoading, error, tasks: filteredTasks, additionalData };
  }, [tasks, monthId, userId, title, isLoading, error]);

  // Dynamic trend calculation based on task count with granular thresholds
  const getDynamicTrend = () => {
    if (title === "Total Tasks") {
      const taskCount = cardData.value;
      if (taskCount < 5) return { direction: "down", color: "text-red-error", icon: "↘", label: "Very Low" };
      if (taskCount < 10) return { direction: "down", color: "text-orange-400", icon: "↘", label: "Low" };
      if (taskCount < 15) return { direction: "neutral", color: "text-gray-300", icon: "→", label: "Normal" };
      if (taskCount < 20) return { direction: "up", color: "text-green-400", icon: "↗", label: "High" };
      return { direction: "up", color: "text-green-success", icon: "↗", label: "Very High" };
    }
    
    // AI Tasks trend
    if (title === "AI Tasks") {
      const aiTaskCount = cardData.value;
      const totalTasks = cardData.tasks.length;
      const aiPercentage = totalTasks > 0 ? (aiTaskCount / totalTasks) * 100 : 0;
      
      if (aiPercentage < 20) return { direction: "down", color: "text-red-error", icon: "↘", label: "Low AI Usage" };
      if (aiPercentage < 40) return { direction: "neutral", color: "text-gray-300", icon: "→", label: "Moderate AI" };
      return { direction: "up", color: "text-green-success", icon: "↗", label: "High AI Usage" };
    }
    
    // Task type trends (Development, Design, Video)
    if (["Development", "Design", "Video"].includes(title)) {
      const typeCount = cardData.value;
      const totalTasks = cardData.tasks.length;
      const typePercentage = totalTasks > 0 ? (typeCount / totalTasks) * 100 : 0;
      
      if (typeCount === 0) return { direction: "down", color: "text-red-error", icon: "↘", label: "No Tasks" };
      if (typeCount < 2) return { direction: "down", color: "text-orange-400", icon: "↘", label: "Low Activity" };
      if (typeCount < 5) return { direction: "neutral", color: "text-gray-300", icon: "→", label: "Normal" };
      return { direction: "up", color: "text-green-success", icon: "↗", label: "High Activity" };
    }
    
    return null;
  };

  const dynamicTrend = getDynamicTrend();

  const getTrendColor = () => {
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

  const getTrendIcon = () => {
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

  // Format value based on title
  const formatValue = (value) => {
    if (title === "Total Hours") {
      return `${Number(value).toFixed(0)}h`;
    }
    if (title === "Total Time with AI") {
      return `${Number(value).toFixed(1)}h`;
    }
    if (title === "User Performance") {
      return `${value} users`;
    }
    if (title === "Markets" || title === "Products") {
      return `${value} active`;
    }
    if (["Development", "Design", "Video"].includes(title)) {
      return `${value} tasks`;
    }
    return value.toString();
  };

  // Format additional info for specific cards
  const formatAdditionalInfo = () => {
    // Task type cards (Development, Design, Video)
    if (["Development", "Design", "Video"].includes(title) && cardData.additionalData) {
      const { totalHours, aiTasks, aiHours, avgHoursPerTask, aiPercentage, tasks } = cardData.additionalData;
      
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
    }

    if (title === "User Performance" && cardData.additionalData?.userStats) {
      const { userStats } = cardData.additionalData;
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
    }

    if (title === "Markets" && cardData.additionalData?.markets) {
      const markets = cardData.additionalData.markets.sort((a, b) => b.count - a.count);
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
    }

    if (title === "Products" && cardData.additionalData?.products) {
      const products = cardData.additionalData.products.sort((a, b) => b.count - a.count);
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
    }

    return null;
  };

  return (
    <div
      className={`card p-6 hover:shadow-xl transition-all duration-300 transform hover:scale-105 ${
        onClick ? "cursor-pointer hover:bg-gray-700/50" : ""
      } ${className}`}
      onClick={onClick}
      {...props}
    >
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            {Icon && (
              <div className="p-2 bg-gray-600/50 rounded-lg">
                <Icon className="w-5 h-5 text-gray-300" />
              </div>
            )}
            <h3 className="text-sm font-semibold text-gray-200 uppercase tracking-wide">
              {title}
            </h3>
          </div>
          
          {/* Dynamic Trend Indicator */}
          {(dynamicTrend || trend) && (
            <div className={`flex items-center space-x-1 px-2 py-1 rounded-full bg-gray-700/50 ${getTrendColor()}`}>
              <span className="text-sm font-bold">{getTrendIcon()}</span>
              {dynamicTrend?.label && <span className="text-xs font-medium">{dynamicTrend.label}</span>}
              {!dynamicTrend?.label && trendValue && <span className="text-xs font-medium">{trendValue}</span>}
            </div>
          )}
        </div>

        {/* Main Content */}
        {cardData.isLoading || loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="space-y-3 w-full">
              <div className="h-8 bg-gray-600 rounded-lg animate-pulse"></div>
              <div className="h-4 bg-gray-600 rounded animate-pulse w-3/4"></div>
            </div>
          </div>
        ) : (
          <div className="flex-1">
            {/* Main Value */}
            <div className="mb-4">
              <div className="text-3xl font-bold text-gray-100 mb-1">
                {formatValue(cardData.value)}
              </div>
              {dynamicTrend && (
                <div className={`text-xs font-medium ${getTrendColor()}`}>
                  {dynamicTrend.label}
                </div>
              )}
            </div>

            {/* Additional Info */}
            {formatAdditionalInfo() && (
              <div className="border-t border-gray-600/50 pt-4">
                {formatAdditionalInfo()}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SmallCard;
