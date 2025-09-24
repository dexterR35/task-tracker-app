import React, { useMemo } from "react";
import AnalyticsCard from "./AnalyticsCard";
import MarketDistributionTable from "../Table/MarketDistributionTable";
import SimplePieChart from "../Charts/SimplePieChart";

const MarketDistributionByUserCard = ({ tasks, selectedMonth, users = [], isLoading = false }) => {
  // Calculate market distribution by user
  const analyticsData = useMemo(() => {
    if (!tasks || tasks.length === 0) {
      return {
        tableData: [],
        chartData: [],
        tableColumns: []
      };
    }

    // Group tasks by user and market
    const userMarketData = {};
    const allMarkets = new Set();

    tasks.forEach(task => {
      const userId = task.userUID || task.createbyUID;
      const markets = task.markets || task.data_task?.markets || [];
      const hours = task.timeInHours || task.data_task?.timeInHours || 0;

      if (userId && markets.length > 0) {
        if (!userMarketData[userId]) {
          userMarketData[userId] = {
            userId,
            userName: users.find(u => (u.id || u.uid || u.userUID) === userId)?.name || 
                     users.find(u => (u.id || u.uid || u.userUID) === userId)?.email || 
                     `User ${userId.slice(0, 8)}`,
            markets: {},
            totalHours: 0
          };
        }

        markets.forEach(market => {
          if (market) {
            allMarkets.add(market);
            if (!userMarketData[userId].markets[market]) {
              userMarketData[userId].markets[market] = 0;
            }
            userMarketData[userId].markets[market] += hours;
            userMarketData[userId].totalHours += hours;
          }
        });
      }
    });

    // Prepare table data with user summary
    const tableData = Object.values(userMarketData).map(userData => {
      // Calculate total tasks for this user
      const userTasks = tasks.filter(task => {
        const userId = task.userUID || task.createbyUID;
        return userId === userData.userId;
      });
      
      const totalTasks = userTasks.length;
      
      // Calculate total AI hours for this user
      const totalAIHours = userTasks.reduce((sum, task) => 
        sum + (task.aiTime || task.data_task?.aiTime || 0), 0
      );
      
      // Get markets this user worked on
      const userMarkets = Object.keys(userData.markets).sort();
      
      return {
        user: userData.userName,
        totalHours: userData.totalHours,
        totalAIHours: totalAIHours,
        totalTasks: totalTasks,
        markets: userMarkets.join(', '),
        combinedHours: (userData.totalHours + totalAIHours).toFixed(1)
      };
    }).sort((a, b) => b.totalHours - a.totalHours);

    // Prepare chart data for market distribution
    const marketTotals = {};
    Object.values(userMarketData).forEach(userData => {
      Object.entries(userData.markets).forEach(([market, hours]) => {
        marketTotals[market] = (marketTotals[market] || 0) + hours;
      });
    });

    const chartData = Object.entries(marketTotals)
      .sort(([,a], [,b]) => b - a)
      .map(([market, totalHours]) => ({
        name: market,
        value: totalHours,
        hours: `${totalHours.toFixed(1)}h`
      }));

    // Create table columns for user summary
    const tableColumns = [
      { key: 'user', label: 'User' },
      { key: 'markets', label: 'Markets' },
      { key: 'totalTasks', label: 'Total Tasks' },
      { key: 'totalHours', label: 'Task Hours' },
      { key: 'totalAIHours', label: 'AI Hours' },
      { key: 'combinedHours', label: 'Total Hours (AI + Task)' }
    ];

    return {
      tableData,
      chartData,
      tableColumns,
      allMarkets: allMarkets
    };
  }, [tasks, users]);

  // Show skeleton if loading or no tasks yet
  if (isLoading || !tasks || tasks.length === 0) {
    return (
      <div className="card-large">
        <h2 className="card-title text-xl mb-6">Market Distribution by User</h2>
        <MarketDistributionTable 
          data={[]} 
          isLoading={true} 
        />
      </div>
    );
  }

  const colors = [
    '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', 
    '#06B6D4', '#84CC16', '#F97316', '#EC4899', '#6366F1'
  ];

  return (
    <div className="card-large">
      <h2 className="card-title text-xl mb-2">Market Distribution by User</h2>
      <p className="text-gray-600 dark:text-gray-400 text-sm mb-6">
        Hours and tasks per market by each user
      </p>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Custom Table */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            User Market Breakdown
          </h3>
          <MarketDistributionTable 
            data={analyticsData.tableData} 
            isLoading={false} 
          />
        </div>
        
        {/* Chart */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Total Hours by Market
          </h3>
          <SimplePieChart
            data={analyticsData.chartData}
            title="Market Distribution"
            colors={colors}
          />
        </div>
      </div>
    </div>
  );
};

export default MarketDistributionByUserCard;
