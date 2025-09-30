import React, { useMemo } from "react";
import AnalyticsCard from "@/components/Cards/AnalyticsCard";

const MarketUserBreakdownCard = ({ tasks, selectedMonth, users = [], isLoading = false }) => {
  // Tasks are already filtered by month from useMonthSelection, no need for additional filtering
  const filteredTasks = useMemo(() => {
    return tasks || [];
  }, [tasks]);

  // Show skeleton if loading or no tasks yet
  if (isLoading || !tasks || tasks.length === 0) {
    return (
      <AnalyticsCard
        title="Market Distribution by User"
        tableData={[]}
        tableColumns={[]}
        chartData={[]}
        chartTitle="Tasks by Market"
        colors={[]}
        isLoading={true}
      />
    );
  }

  // Calculate market breakdown by user
  const analyticsData = useMemo(() => {
    const userMarketData = {};
    const marketTotals = {};
    const userTotals = {};

    // Initialize data structures
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

    // Initialize user data
    allUsers.forEach(userId => {
      userMarketData[userId] = {};
      userTotals[userId] = 0;
      allMarkets.forEach(market => {
        userMarketData[userId][market] = 0;
      });
    });

    // Initialize market totals
    allMarkets.forEach(market => {
      marketTotals[market] = 0;
    });

    // Second pass: count tasks by user and market
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

    // Create table data with percentages
    const tableData = Array.from(allUsers).map(userId => {
      const userName = getUserName(userId);
      const userTotal = userTotals[userId];
      const row = { user: userName, total: userTotal };
      
      // Add market columns with percentages
      allMarkets.forEach(market => {
        const marketCount = userMarketData[userId][market] || 0;
        const percentage = userTotal > 0 ? ((marketCount / userTotal) * 100).toFixed(1) : '0.0';
        row[market] = `${marketCount} (${percentage}%)`;
      });
      
      return row;
    });

    // Sort by total tasks (descending)
    tableData.sort((a, b) => b.total - a.total);

    // Add grand total row
    const grandTotalRow = { user: "Grand Total", total: Object.values(userTotals).reduce((sum, total) => sum + total, 0), bold: true, highlight: true };
    allMarkets.forEach(market => {
      const marketTotal = marketTotals[market];
      const totalTasks = grandTotalRow.total;
      const percentage = totalTasks > 0 ? ((marketTotal / totalTasks) * 100).toFixed(1) : '0.0';
      grandTotalRow[market] = `${marketTotal} (${percentage}%)`;
    });
    tableData.push(grandTotalRow);

    return {
      tableData,
      marketTotals,
      userTotals,
      allMarkets: Array.from(allMarkets).sort()
    };
  }, [filteredTasks, users]);

  // Create table columns
  const tableColumns = [
    { key: "user", header: "User", align: "left" },
    { key: "total", header: "Total Tasks", align: "center", highlight: true },
    ...analyticsData.allMarkets.map(market => ({
      key: market,
      header: market.toUpperCase(),
      align: "center"
    }))
  ];

  // Create chart data for market distribution
  const chartData = analyticsData.allMarkets.map(market => ({
    name: market.toUpperCase(),
    value: analyticsData.marketTotals[market] || 0
  }));

  // Generate colors for markets
  const marketColors = [
    "#3b82f6", // blue
    "#10b981", // emerald
    "#f59e0b", // amber
    "#ef4444", // red
    "#8b5cf6", // violet
    "#06b6d4", // cyan
    "#84cc16", // lime
    "#f97316", // orange
    "#ec4899", // pink
    "#6b7280", // gray
    "#14b8a6", // teal
    "#a855f7"  // purple
  ];

  const colors = analyticsData.allMarkets.map((_, index) => marketColors[index % marketColors.length]);

  return (
    <AnalyticsCard
      title="Market Distribution by User"
      tableData={analyticsData.tableData}
      tableColumns={tableColumns}
      chartData={chartData}
      chartTitle="Tasks by Market"
      colors={colors}
      isLoading={isLoading}
    />
  );
};

export default MarketUserBreakdownCard;
