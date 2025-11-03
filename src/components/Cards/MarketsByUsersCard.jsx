import React, { useMemo } from "react";
import AnalyticsTable from "@/components/Table/AnalyticsTable";
import SimplePieChart from "@/components/Charts/SimplePieChart";
import BiaxialBarChart from "@/components/Charts/BiaxialBarChart";
import { SkeletonAnalyticsCard } from "@/components/ui/Skeleton/Skeleton";
import { CARD_SYSTEM } from "@/constants";
import { addConsistentColors } from "@/components/Cards/analyticsCardConfig";
import { getMarketColor } from "@/components/Cards/configs/analyticsSharedConfig";

const CHART_COLORS = {
  DEFAULT: Object.values(CARD_SYSTEM.COLOR_HEX_MAP),
  USER_BY_TASK: Object.values(CARD_SYSTEM.COLOR_HEX_MAP).slice(0, 10),
};

const CALCULATION_OPTIONS = {
  FULL_MARKETS_BY_USERS: {
    includeTable: true,
    includeMarketsChart: true,
    includeUsersChart: true,
    includeHours: true,
    includeGrandTotal: true,
  },
};

// Helper function to get user name
const getUserName = (userId, users) => {
  const user = users?.find((u) => (u.id || u.uid || u.userUID) === userId);
  return user?.name || user?.email || `User ${userId?.slice(0, 8)}`;
};

const calculateTotal = (dataObject, defaultValue = 0) => {
  if (!dataObject || typeof dataObject !== "object") {
    return defaultValue;
  }
  return Object.values(dataObject).reduce((sum, value) => {
    const numValue = typeof value === "number" ? value : 0;
    return sum + numValue;
  }, 0);
};

const calculateUserDataTotals = (userData) => {
  const { userHours = {}, userTotals = {} } = userData;
  return {
    totalHours: calculateTotal(userHours),
    totalTasks: calculateTotal(userTotals),
  };
};

const calculateCountWithPercentage = (count, total, decimals = 1) => {
  if (total === 0) return `${count} (0%)`;
  const percentage = Math.round((count / total) * 100);
  return `${count} (${percentage}%)`;
};

// Calculate markets by users data for table and charts
const calculateMarketsByUsersData = (tasks, users, options = CALCULATION_OPTIONS.FULL_MARKETS_BY_USERS) => {
  if (!tasks || tasks.length === 0) {
    return {
      tableData: [
        {
          user: "No data available",
          totalTasks: 0,
          totalHours: "0h",
          noData: true,
        },
      ],
      tableColumns: [
        { key: "user", header: "User", align: "left" },
        {
          key: "totalTasks",
          header: "Total Tasks",
          align: "center",
          highlight: true,
        },
        {
          key: "totalHours",
          header: "Total Hours",
          align: "center",
          highlight: true,
        },
      ],
      chartData: [{ name: "No data available", value: 0 }],
      colors: ["#6b7280"],
      userByTaskData: [{ name: "No data available", value: 0 }],
    };
  }

  const userMarketData = {};
  const marketTotals = {};
  const userTotals = {};
  const userHours = {};
  const allMarkets = new Set();
  const allUsers = new Set();

  // Single pass: collect markets, users, count tasks, and calculate hours
  tasks.forEach((task) => {
    const markets = task.data_task?.markets || task.markets || [];
    const userId = task.userUID || task.createbyUID;

    if (userId && markets.length > 0) {
      allUsers.add(userId);

      if (!userMarketData[userId]) {
        userMarketData[userId] = {};
        userTotals[userId] = 0;
        userHours[userId] = 0;
      }

      if (options.includeHours) {
        const taskHours = task.data_task?.timeInHours || task.timeInHours || 0;
        userHours[userId] += taskHours;
      }

      markets.forEach((market) => {
        if (market) {
          allMarkets.add(market);

          if (!userMarketData[userId][market]) {
            userMarketData[userId][market] = 0;
          }
          if (!marketTotals[market]) {
            marketTotals[market] = 0;
          }

          userMarketData[userId][market]++;
          marketTotals[market]++;
        }
      });

      userTotals[userId]++;
    }
  });

  // Create table data
  let tableData = [];
  if (options.includeTable) {
    tableData = Array.from(allUsers).map((userId) => {
      const userName = getUserName(userId, users);
      const userTotal = userTotals[userId];
      const userTotalHours = userHours[userId] || 0;

      const row = {
        user: userName,
        totalTasks: userTotal,
      };

      if (options.includeHours) {
        row.totalHours = `${userTotalHours}h`;
      }

      allMarkets.forEach((market) => {
        const marketCount = userMarketData[userId][market] || 0;
        row[market] = calculateCountWithPercentage(marketCount, userTotal);
      });

      return row;
    });

    tableData.sort((a, b) => b.totalTasks - a.totalTasks);
  }

  // Add grand total row
  if (options.includeTable && options.includeGrandTotal) {
    const totals = calculateUserDataTotals({
      userHours,
      userTotals,
    });

    const grandTotalRow = {
      user: "Grand Total",
      totalTasks: totals.totalTasks,
      bold: true,
      highlight: true,
    };

    if (options.includeHours) {
      grandTotalRow.totalHours = `${totals.totalHours}h`;
    }

    allMarkets.forEach((market) => {
      const marketTotal = marketTotals[market];
      grandTotalRow[market] = calculateCountWithPercentage(
        marketTotal,
        totals.totalTasks
      );
    });
    tableData.push(grandTotalRow);
  }

  // Create table columns
  let tableColumns = [];
  if (options.includeTable) {
    tableColumns = [
      { key: "user", header: "User", align: "left" },
      {
        key: "totalTasks",
        header: "Total Tasks",
        align: "center",
        highlight: true,
      },
    ];

    if (options.includeHours) {
      tableColumns.push({
        key: "totalHours",
        header: "Total Hours",
        align: "center",
        highlight: true,
      });
    }

    tableColumns.push(
      ...Array.from(allMarkets)
        .sort()
        .map((market) => ({
          key: market,
          header: market.toUpperCase(),
          align: "center",
        }))
    );
  }

  // Create chart data
  let chartData = [];
  let userByTaskData = [];

  if (options.includeMarketsChart) {
    // Calculate market hours for sorting
    const marketHoursMap = {};
    tasks.forEach((task) => {
      const taskMarkets = task.data_task?.markets || task.markets || [];
      const taskHours = task.data_task?.timeInHours || task.timeInHours || 0;
      taskMarkets.forEach((market) => {
        if (market) {
          marketHoursMap[market] = (marketHoursMap[market] || 0) + taskHours;
        }
      });
    });
    
    chartData = addConsistentColors(
      Array.from(allMarkets)
        .map((market) => {
          // Normalize market to uppercase for consistent color mapping
          const normalizedMarket = market.trim().toUpperCase();
          return {
            name: normalizedMarket,
            value: marketTotals[market] || 0,
            hours: marketHoursMap[market] || 0,
          };
        })
        .sort((a, b) => {
          // Sort by tasks/value first (descending), then by hours (descending)
          if (b.value !== a.value) {
            return b.value - a.value;
          }
          return b.hours - a.hours;
        })
        .map(({ hours, ...rest }) => rest), // Remove hours from final data
      "market"
    );
  }

  if (options.includeUsersChart && tableData.length > 0) {
    userByTaskData = addConsistentColors(
      tableData
        .filter((row) => !row.bold)
        .map((row) => ({
          name: row.user,
          value: row.totalTasks || 0,
        }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 10),
      "user"
    );
  }

  return {
    tableData,
    tableColumns,
    chartData,
    colors: chartData.map((item) => item.color),
    userByTaskData,
  };
};

// Helper function to calculate biaxial bar data
const calculateBiaxialBarData = (tasks) => {
  if (!tasks || tasks.length === 0) return [];

  const marketStats = {};

  tasks.forEach((task) => {
    const taskMarkets = task.data_task?.markets || task.markets || [];
    const taskHours = task.data_task?.timeInHours || task.timeInHours || 0;

    taskMarkets.forEach((market) => {
      if (market) {
        if (!marketStats[market]) {
          marketStats[market] = {
            tasks: 0,
            hours: 0,
          };
        }
        marketStats[market].tasks += 1;
        marketStats[market].hours += taskHours;
      }
    });
  });

  return addConsistentColors(
    Object.entries(marketStats)
      .map(([market, stats]) => ({
        name: market.toUpperCase(),
        tasks: stats.tasks,
        hours: Math.round(stats.hours * 100) / 100,
      }))
      .sort((a, b) => {
        // Sort by tasks first (descending), then by hours (descending)
        if (b.tasks !== a.tasks) {
          return b.tasks - a.tasks;
        }
        return b.hours - a.hours;
      }),
    "market"
  );
};

const calculateUsersBiaxialData = (tasks, users) => {
  if (!tasks || tasks.length === 0 || !users || users.length === 0) return [];

  const userStats = {};

  tasks.forEach((task) => {
    const taskHours = task.data_task?.timeInHours || task.timeInHours || 0;
    const userId = task.userUID || task.createbyUID;

    if (userId) {
      if (!userStats[userId]) {
        userStats[userId] = {
          tasks: 0,
          hours: 0,
        };
      }
      userStats[userId].tasks += 1;
      userStats[userId].hours += taskHours;
    }
  });

  return addConsistentColors(
    Object.entries(userStats)
      .map(([userId, stats]) => {
        const user = users.find(
          (u) =>
            u.uid === userId ||
            u.id === userId ||
            u.userUID === userId ||
            u.email === userId ||
            u.displayName === userId ||
            u.name === userId
        );

        const userName = user
          ? user.displayName || user.name || user.email || `User ${userId}`
          : `User ${userId}`;

        return {
          name: userName,
          tasks: stats.tasks,
          hours: Math.round(stats.hours * 100) / 100,
        };
      })
      .sort((a, b) => b.tasks - a.tasks),
    "user"
  );
};

// Calculate user-market breakdown - separate chart for each user
const calculateUsersByMarketsCharts = (tasks, users) => {
  if (!tasks || tasks.length === 0 || !users || users.length === 0) return [];

  const userMarketStats = {}; // { userId: { userName: "...", markets: { "RO": { tasks, hours }, ... } } }

  tasks.forEach((task) => {
    const taskMarkets = task.data_task?.markets || task.markets || [];
    const taskHours = task.data_task?.timeInHours || task.timeInHours || 0;
    const userId = task.userUID || task.createbyUID;

    if (!userId || !taskMarkets || taskMarkets.length === 0) return;

    // Get user name
    const user = users.find(
      (u) =>
        u.uid === userId ||
        u.id === userId ||
        u.userUID === userId ||
        u.email === userId ||
        u.displayName === userId ||
        u.name === userId
    );

    const userName = user
      ? user.displayName || user.name || user.email || `User ${userId}`
      : `User ${userId}`;

    // Initialize user if not exists
    if (!userMarketStats[userId]) {
      userMarketStats[userId] = {
        userName,
        markets: {},
        totalTasks: 0,
        totalHours: 0,
      };
    }

    taskMarkets.forEach((market) => {
      if (market) {
        // Normalize market (trim and uppercase) to ensure consistent matching
        const normalizedMarket = market.trim().toUpperCase();
        if (!userMarketStats[userId].markets[normalizedMarket]) {
          userMarketStats[userId].markets[normalizedMarket] = {
            tasks: 0,
            hours: 0,
          };
        }
        userMarketStats[userId].markets[normalizedMarket].tasks += 1;
        userMarketStats[userId].markets[normalizedMarket].hours += taskHours;
      }
    });

    // Update user totals
    userMarketStats[userId].totalTasks += 1;
    userMarketStats[userId].totalHours += taskHours;
  });

  // Create separate chart data for each user
  const userCharts = Object.entries(userMarketStats)
    .map(([userId, userData]) => {
      const marketData = Object.entries(userData.markets)
        .map(([market, stats]) => ({
          name: market,
          tasks: stats.tasks,
          hours: Math.round(stats.hours * 100) / 100,
          market: market, // Keep market reference for color mapping
        }))
        .filter((item) => item.tasks > 0 || item.hours > 0)
        .sort((a, b) => {
          // Sort by tasks first (descending), then by hours (descending)
          if (b.tasks !== a.tasks) {
            return b.tasks - a.tasks;
          }
          return b.hours - a.hours;
        })
        .map((item) => ({
          ...item,
          color: getMarketColor(item.market), // Use market color mapping
        }));

      return {
        userId,
        userName: userData.userName,
        marketData,
        totalTasks: userData.totalTasks,
        totalHours: Math.round(userData.totalHours * 100) / 100,
      };
    })
    .filter((chart) => chart.marketData.length > 0) // Only include users with market data
    .sort((a, b) => {
      // Sort by total tasks first (descending), then by user name alphabetically
      if (b.totalTasks !== a.totalTasks) {
        return b.totalTasks - a.totalTasks;
      }
      return a.userName.localeCompare(b.userName);
    });

  return userCharts;
};

const MarketsByUsersCard = ({
  tasks = [],
  users = [],
  className = "",
  isLoading = false,
}) => {
  const cardData = useMemo(() => {
    if (isLoading) return null;

    const calculatedData = calculateMarketsByUsersData(tasks, users, CALCULATION_OPTIONS.FULL_MARKETS_BY_USERS);

    const totalTasks = tasks?.length || 0;
    const totalHours =
      tasks?.reduce(
        (sum, task) =>
          sum + (task.data_task?.timeInHours || task.timeInHours || 0),
        0
      ) || 0;

    const biaxialBarData = calculateBiaxialBarData(tasks);
    const usersBiaxialData = calculateUsersBiaxialData(tasks, users);
    const usersByMarketsCharts = calculateUsersByMarketsCharts(tasks, users);

    return {
      title: "Markets by Users",
      analyticsByUserMarketsTableData: calculatedData.tableData,
      analyticsByUserMarketsTableColumns: calculatedData.tableColumns,
      marketsData: calculatedData.chartData,
      marketsTitle: `Markets Distribution (${totalTasks} tasks, ${totalHours}h)`,
      marketsColors: calculatedData.colors,
      userByTaskData: calculatedData.userByTaskData,
      userByTaskTitle: `Users by Task Count (${totalTasks} tasks, ${totalHours}h)`,
      userByTaskColors: CHART_COLORS.USER_BY_TASK,
      biaxialBarData: biaxialBarData,
      biaxialBarTitle: `Markets: Tasks & Hours (${totalTasks} tasks, ${totalHours}h)`,
      biaxialTasksColor: CHART_COLORS.DEFAULT[0],
      biaxialHoursColor: CHART_COLORS.DEFAULT[1],
      usersBiaxialData: usersBiaxialData,
      usersBiaxialTitle: `Users: Tasks & Hours (${totalTasks} tasks, ${totalHours}h)`,
      usersBiaxialTasksColor: CHART_COLORS.DEFAULT[2],
      usersBiaxialHoursColor: CHART_COLORS.DEFAULT[3],
      usersByMarketsCharts: usersByMarketsCharts,
    };
  }, [tasks, users, isLoading]);

  if (isLoading) {
    return <SkeletonAnalyticsCard className={className} />;
  }

  if (!cardData) {
    return <SkeletonAnalyticsCard className={className} />;
  }

  const {
    title,
    analyticsByUserMarketsTableData,
    analyticsByUserMarketsTableColumns,
    marketsData,
    marketsTitle,
    marketsColors,
    userByTaskData,
    userByTaskTitle,
    userByTaskColors,
    biaxialBarData,
    biaxialBarTitle,
    biaxialTasksColor,
    biaxialHoursColor,
    usersBiaxialData,
    usersBiaxialTitle,
    usersBiaxialTasksColor,
    usersBiaxialHoursColor,
    usersByMarketsCharts,
  } = cardData;

  // Check if there's real data
  const hasRealData = analyticsByUserMarketsTableData && analyticsByUserMarketsTableData.some(
    (row) => !row.bold && !row.user?.toLowerCase().includes("no data available") && (row.totalTasks > 0)
  );

  // Check if charts have real data
  const hasMarketsData = marketsData && marketsData.some(
    (item) => item.value > 0 && !item.name?.toLowerCase().includes("no data available")
  );
  const hasUserByTaskData = userByTaskData && userByTaskData.some(
    (item) => item.value > 0 && !item.name?.toLowerCase().includes("no data available")
  );
  const hasMarketsBiaxialData = biaxialBarData && biaxialBarData.length > 0 && biaxialBarData.some(
    (item) => (item.tasks > 0 || item.hours > 0) && !item.name?.toLowerCase().includes("no data available")
  );
  const hasUsersBiaxialData = usersBiaxialData && usersBiaxialData.length > 0 && usersBiaxialData.some(
    (item) => (item.tasks > 0 || item.hours > 0) && !item.name?.toLowerCase().includes("no data available")
  );
  const hasUsersByMarketsCharts = usersByMarketsCharts && usersByMarketsCharts.length > 0;

  // If no data at all, show error message
  if (!hasRealData && !hasMarketsData && !hasUserByTaskData && !hasMarketsBiaxialData && !hasUsersBiaxialData && !hasUsersByMarketsCharts) {
    return (
      <div id="markets-by-users-card" className={`${className}`}>
        <h3>{title}</h3>
        <div className="card">
          <div className="text-center py-8">
            <p className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
              No Data Available
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No analytics data found for the selected criteria.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div id="markets-by-users-card" className={`${className}`}>
      <h3>{title}</h3>

      {/* Grid Container */}
      <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
        {/* Markets by Users Table Div */}
        {hasRealData && (
          <div className="table-container">
            <AnalyticsTable
              data={analyticsByUserMarketsTableData}
              columns={analyticsByUserMarketsTableColumns}
            />
          </div>
        )}
        {/* Charts Container - 2 charts in a row */}
        {(hasMarketsData || hasUserByTaskData) && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Markets Distribution Pie Chart */}
            {hasMarketsData && (
              <div className="chart-container">
                <div className="mb-2">
                  <span className="text-xs dark:bg-blue-800 px-2 py-1 rounded">
                    📈 <strong>Markets Distribution:</strong> Task by markets
                  </span>
                </div>
                <SimplePieChart
                  data={marketsData}
                  title={marketsTitle}
                  colors={marketsColors}
                  dataType={CARD_SYSTEM.CHART_DATA_TYPE.MARKET}
                  minPercentageThreshold={3}
                  leaderLineLength={20}
                />
              </div>
            )}

            {/* User by Task Chart */}
            {hasUserByTaskData && (
              <div className="chart-container">
                <div className="mb-2">
                  <span className="text-xs dark:bg-blue-800 px-2 py-1 rounded">
                    👥 <strong>Users by Tasks:</strong> Task by users
                  </span>
                </div>
                <SimplePieChart
                  data={userByTaskData}
                  title={userByTaskTitle}
                  colors={userByTaskColors}
                  dataType={CARD_SYSTEM.CHART_DATA_TYPE.USER}
                />
              </div>
            )}
          </div>
        )}

        {/* Biaxial Charts Container - 2 charts in a row */}
        {(hasMarketsBiaxialData || hasUsersBiaxialData) && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Markets Biaxial Chart */}
            {hasMarketsBiaxialData && (
              <div className="chart-container">
                <div className="mb-2">
                  <span className="text-xs dark:bg-blue-800 px-2 py-1 rounded">
                    📊 <strong>Markets:</strong> Tasks & Hours by Market
                  </span>
                </div>
                <BiaxialBarChart
                  data={biaxialBarData}
                  title={biaxialBarTitle}
                  tasksColor={biaxialTasksColor}
                  hoursColor={biaxialHoursColor}
                  dataType={CARD_SYSTEM.CHART_DATA_TYPE.MARKET}
                />
              </div>
            )}

            {/* Users Biaxial Chart */}
            {hasUsersBiaxialData && (
              <div className="chart-container">
                <div className="mb-2">
                  <span className="text-xs dark:bg-blue-800 px-2 py-1 rounded">
                    👥 <strong>Users:</strong> Tasks & Hours by User
                  </span>
                </div>
                <BiaxialBarChart
                  data={usersBiaxialData}
                  title={usersBiaxialTitle}
                  tasksColor={usersBiaxialTasksColor}
                  hoursColor={usersBiaxialHoursColor}
                  dataType={CARD_SYSTEM.CHART_DATA_TYPE.USER}
                />
              </div>
            )}
          </div>
        )}

        {/* Users by Markets - Separate Chart for Each User in 2-column grid */}
        {hasUsersByMarketsCharts && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {usersByMarketsCharts.map((userChart) => (
              <div key={userChart.userId} className="chart-container">
                <div className="mb-2">
                  <span className="text-xs dark:bg-blue-800 px-2 py-1 rounded">
                    👥 <strong>{userChart.userName}:</strong> Markets Tasks & Hours
                  </span>
                </div>
                <BiaxialBarChart
                  data={userChart.marketData}
                  title={`${userChart.userName}: Markets (${userChart.totalTasks} tasks, ${userChart.totalHours}h)`}
                  tasksColor={CHART_COLORS.DEFAULT[0]}
                  hoursColor={CHART_COLORS.DEFAULT[1]}
                  dataType={CARD_SYSTEM.CHART_DATA_TYPE.MARKET}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MarketsByUsersCard;
