import React, { useMemo } from "react";
import AnalyticsCard from "@/components/Cards/AnalyticsCard";
import { Icons } from "@/components/icons";
import { ANALYTICS_CARD_TYPES, getAnalyticsCardConfig } from "./analyticsCardConfig";

/**
 * Unified Analytics Card Component
 * Consolidates all analytics card types into a single flexible component
 */
const UnifiedAnalyticsCard = ({ 
  cardType, // Use predefined card types
  title,
  subtitle,
  icon,
  color = "blue",
  tasks,
  selectedMonth,
  users = [],
  isLoading = false,
  // Analytics-specific props
  tableData,
  tableColumns,
  chartData,
  chartTitle
}) => {
  // Get configuration for predefined card types
  const config = cardType ? getAnalyticsCardConfig(cardType) : {};
  
  // Merge props with config
  const finalProps = {
    title: title || config.title || "Analytics",
    subtitle: subtitle || config.subtitle || "",
    icon: icon || config.icon || Icons.generic.chart,
    color: color || config.color || "blue"
  };

  // Helper functions for different analytics calculations
  const calculateMarketUserBreakdown = (filteredTasks, users) => {
    const userMarketData = {};
    const marketTotals = {};
    const userTotals = {};
    const allMarkets = new Set();
    const allUsers = new Set();

    // First pass: collect all markets and users
    filteredTasks.forEach(task => {
      const markets = task.data_task?.markets || task.markets || [];
      const userId = task.userUID || task.createbyUID;
      
      if (userId && markets.length > 0) {
        allUsers.add(userId);
        markets.forEach(market => {
          if (market) {
            allMarkets.add(market);
          }
        });
      }
    });

    // Initialize data structures
    allUsers.forEach(userId => {
      userMarketData[userId] = {};
      userTotals[userId] = 0;
      allMarkets.forEach(market => {
        userMarketData[userId][market] = 0;
      });
    });

    allMarkets.forEach(market => {
      marketTotals[market] = 0;
    });

    // Second pass: count tasks
    filteredTasks.forEach(task => {
      const markets = task.data_task?.markets || task.markets || [];
      const userId = task.userUID || task.createbyUID;
      
      if (userId && markets.length > 0) {
        userTotals[userId]++;
        markets.forEach(market => {
          if (market) {
            userMarketData[userId][market]++;
            marketTotals[market]++;
          }
        });
      }
    });

    // Get user names
    const getUserName = (userId) => {
      const user = users.find(u => (u.id || u.uid || u.userUID) === userId);
      return user?.name || user?.email || `User ${userId.slice(0, 8)}`;
    };

    // Calculate user hours, deliverable counts, deliverable times, and variations data
    const userHours = {};
    const userDeliverableCounts = {};
    const userDeliverableTimes = {};
    const userVariationsCounts = {};
    const userVariationsTimes = {};
    
    filteredTasks.forEach(task => {
      const userId = task.userUID || task.createbyUID;
      if (userId) {
        // Task hours
        const taskHours = task.data_task?.timeInHours || task.timeInHours || 0;
        userHours[userId] = (userHours[userId] || 0) + taskHours;
        
        // Deliverable data - use real data from database
        const deliverablesUsed = task.data_task?.deliverablesUsed || task.deliverablesUsed || [];
        if (deliverablesUsed.length > 0) {
          deliverablesUsed.forEach(deliverable => {
            const count = deliverable.count || 1;
            userDeliverableCounts[userId] = (userDeliverableCounts[userId] || 0) + count;
            
            // Use actual deliverable time from database (timeInHours from task)
            const actualDeliverableTime = taskHours; // Use actual task hours as deliverable time
            userDeliverableTimes[userId] = (userDeliverableTimes[userId] || 0) + actualDeliverableTime;
            
            // Variations data (backward compatibility with declinari)
            const variationsCount = deliverable.variationsCount || deliverable.declinariCount || 0;
            if (variationsCount > 0) {
              userVariationsCounts[userId] = (userVariationsCounts[userId] || 0) + variationsCount;
              // Use actual variations time or estimate based on count
              const variationsTime = deliverable.variationsTime || deliverable.declinariTime || (variationsCount * 0.5);
              userVariationsTimes[userId] = (userVariationsTimes[userId] || 0) + variationsTime;
            }
          });
        }
      }
    });

    // No team averages - calculate efficiency per user only

    // Create table data
    const tableData = Array.from(allUsers).map(userId => {
      const userName = getUserName(userId);
      const userTotal = userTotals[userId];
      const userTotalHours = userHours[userId] || 0;
      const userDeliverableCount = userDeliverableCounts[userId] || 0;
      const userDeliverableTime = userDeliverableTimes[userId] || 0;
      
      // Get user's variations data
      const userVariationsCount = userVariationsCounts[userId] || 0;
      const userVariationsTime = userVariationsTimes[userId] || 0;
      
      const row = { 
        user: userName, 
        totalTasks: userTotal,
        totalHours: `${userTotalHours}h`,
        deliverableCount: userDeliverableCount,
        deliverableTime: `${userDeliverableTime}h`,
        variationsCount: userVariationsCount,
        variationsTime: `${userVariationsTime}h`
      };
      
      allMarkets.forEach(market => {
        const marketCount = userMarketData[userId][market] || 0;
        const percentage = userTotal > 0 ? ((marketCount / userTotal) * 100).toFixed(1) : '0.0';
        row[market] = `${marketCount} (${percentage}%)`;
      });
      
      return row;
    });

    tableData.sort((a, b) => b.totalTasks - a.totalTasks);

    // Add grand total row
    const totalHours = Object.values(userHours).reduce((sum, hours) => sum + hours, 0);
    const totalTasks = Object.values(userTotals).reduce((sum, total) => sum + total, 0);
    const totalDeliverables = Object.values(userDeliverableCounts).reduce((sum, count) => sum + count, 0);
    const totalDeliverableTime = Object.values(userDeliverableTimes).reduce((sum, time) => sum + time, 0);
    const totalVariations = Object.values(userVariationsCounts).reduce((sum, count) => sum + count, 0);
    const totalVariationsTime = Object.values(userVariationsTimes).reduce((sum, time) => sum + time, 0);
    
    const grandTotalRow = { 
      user: "Grand Total", 
      totalTasks: totalTasks,
      totalHours: `${totalHours}h`,
      deliverableCount: totalDeliverables,
      deliverableTime: `${totalDeliverableTime}h`,
      variationsCount: totalVariations,
      variationsTime: `${totalVariationsTime}h`,
      bold: true, 
      highlight: true 
    };
    allMarkets.forEach(market => {
      const marketTotal = marketTotals[market];
      const totalTasks = grandTotalRow.totalTasks;
      const percentage = totalTasks > 0 ? ((marketTotal / totalTasks) * 100).toFixed(1) : '0.0';
      grandTotalRow[market] = `${marketTotal} (${percentage}%)`;
    });
    tableData.push(grandTotalRow);

    const tableColumns = [
      { key: "user", header: "User", align: "left" },
      { key: "totalTasks", header: "Total Tasks", align: "center", highlight: true },
      { key: "totalHours", header: "Total Hours", align: "center", highlight: true },
      { key: "deliverableCount", header: "Deliverables", align: "center", highlight: true },
      { key: "deliverableTime", header: "Deliverable Time", align: "center", highlight: true },
      { key: "variationsCount", header: "Variations Count", align: "center", highlight: true },
      { key: "variationsTime", header: "Variations Time", align: "center", highlight: true },
      ...Array.from(allMarkets).sort().map(market => ({
        key: market,
        header: market.toUpperCase(),
        align: "center"
      }))
    ];

    const chartData = Array.from(allMarkets).sort().map(market => ({
      name: market.toUpperCase(),
      value: marketTotals[market] || 0
    }));

    const colors = [
      "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4",
      "#84cc16", "#f97316", "#ec4899", "#6b7280", "#14b8a6", "#a855f7"
    ];

    return {
      tableData,
      tableColumns,
      chartData,
      colors: chartData.map((_, index) => colors[index % colors.length])
    };
  };





  // Calculate specific analytics data based on card type
  const calculatedAnalyticsData = useMemo(() => {
    if (!tasks || tasks.length === 0) {
      return { tableData: [], tableColumns: [], chartData: [], colors: [] };
    }

    const filteredTasks = tasks || [];

    switch (cardType) {
      case ANALYTICS_CARD_TYPES.MARKET_USER_BREAKDOWN:
        return calculateMarketUserBreakdown(filteredTasks, users);
      
      default:
        return { tableData: [], tableColumns: [], chartData: [], colors: [] };
    }
  }, [tasks, users, cardType]);

  // Calculate user by task data with proper memoization
  const userByTaskData = useMemo(() => {
    if (cardType === ANALYTICS_CARD_TYPES.MARKET_USER_BREAKDOWN && calculatedAnalyticsData.tableData) {
      // Extract user task data from the existing table data
      const chartData = calculatedAnalyticsData.tableData
        .filter(row => !row.bold) // Exclude grand total row
        .map(row => ({
          name: row.user,
          value: row.totalTasks || row.total || 0 // Use totalTasks or fallback to total
        }))
        .sort((a, b) => b.value - a.value) // Sort by task count descending
        .slice(0, 10); // Show top 10 users

      return chartData;
    }
    return [];
  }, [cardType, calculatedAnalyticsData.tableData]);

  // Memoize colors to prevent unnecessary re-renders
  const userByTaskColors = useMemo(() => [
    "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4",
    "#84cc16", "#f97316", "#ec4899", "#6b7280"
  ], []);

  // Show skeleton only when loading
  if (isLoading) {
    return (
      <AnalyticsCard
        title={finalProps.title}
        tableData={[]}
        tableColumns={[]}
        chartData={[]}
        chartTitle={chartTitle}
        colors={[]}
        isLoading={true}
      />
    );
  }

  // Default analytics card - always show the card, let the table handle no data
  return (
    <AnalyticsCard
      title={finalProps.title}
      analyticsByUserMarketsTableData={tableData || calculatedAnalyticsData.tableData}
      analyticsByUserMarketsTableColumns={tableColumns || calculatedAnalyticsData.tableColumns}
      marketsData={chartData || calculatedAnalyticsData.chartData}
      marketsTitle={chartTitle || "Markets Distribution by Users by Task Count"}
      marketsColors={calculatedAnalyticsData.colors}
      isLoading={isLoading}
      userByTaskData={userByTaskData}
      userByTaskTitle="Users by Task Count"
      userByTaskColors={userByTaskColors}
    />
  );
};

export default UnifiedAnalyticsCard;
