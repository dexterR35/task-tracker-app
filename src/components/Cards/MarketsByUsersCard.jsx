import React, { useMemo, memo } from "react";
import AnalyticsTable from "@/components/Table/AnalyticsTable";
import SimplePieChart from "@/components/Charts/SimplePieChart";
import BiaxialBarChart from "@/components/Charts/BiaxialBarChart";
import { SkeletonAnalyticsCard } from "@/components/ui/Skeleton/Skeleton";
import Avatar from "@/components/ui/Avatar/Avatar";
import Badge from "@/components/ui/Badge/Badge";
import ChartHeader from "./ChartHeader";
import { CARD_SYSTEM } from "@/constants";
import { addConsistentColors } from "@/components/Cards/analyticsCardConfig";
import { getMarketColor, calculateCountWithPercentage, renderCountWithPercentage, getUserName, normalizeMarket, getTaskMarkets, getTaskHours, getTaskUserUID } from "@/components/Cards/configs/analyticsSharedConfig";

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

// getUserName is now imported from analyticsSharedConfig

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
    const markets = getTaskMarkets(task);
    const userId = getTaskUserUID(task);

    if (userId && markets.length > 0) {
      allUsers.add(userId);

      if (!userMarketData[userId]) {
        userMarketData[userId] = {};
        userTotals[userId] = 0;
        userHours[userId] = 0;
      }

      if (options.includeHours) {
        const taskHours = getTaskHours(task);
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

      // Calculate total market count for this user (sum of all markets)
      // This ensures percentages sum to 100% since tasks can have multiple markets
      let userTotalMarketCount = 0;
      const marketItems = [];
      allMarkets.forEach((market) => {
        const marketCount = userMarketData[userId][market] || 0;
        userTotalMarketCount += marketCount;
        marketItems.push({ key: market, count: marketCount });
      });

      // Calculate percentages for all markets at once to ensure they sum to exactly 100%
      allMarkets.forEach((market) => {
        const marketCount = userMarketData[userId][market] || 0;
        row[market] = calculateCountWithPercentage(marketCount, userTotalMarketCount, marketItems, market);
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

    // Add market columns with only counts (no percentages for Grand Total)
    allMarkets.forEach((market) => {
      const marketTotal = marketTotals[market] || 0;
      grandTotalRow[market] = marketTotal;
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
          render: renderCountWithPercentage,
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
      const taskMarkets = getTaskMarkets(task);
      const taskHours = getTaskHours(task);
      taskMarkets.forEach((market) => {
        if (market) {
          const normalizedMarket = normalizeMarket(market);
          marketHoursMap[normalizedMarket] = (marketHoursMap[normalizedMarket] || 0) + taskHours;
        }
      });
    });
    
    chartData = addConsistentColors(
      Array.from(allMarkets)
        .map((market) => {
          // Normalize market to uppercase for consistent color mapping
          const normalizedMarket = normalizeMarket(market);
          return {
            name: normalizedMarket,
            value: marketTotals[market] || 0,
            hours: marketHoursMap[normalizedMarket] || 0,
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
        .map((row) => {
          // Extract hours from totalHours string (e.g., "25.5h" -> 25.5)
          const hoursValue = row.totalHours 
            ? parseFloat(row.totalHours.toString().replace('h', '')) || 0
            : 0;
          
          return {
            name: row.user,
            value: row.totalTasks || 0,
            hours: hoursValue,
          };
        })
        .sort((a, b) => {
          // Sort by tasks (value) first (descending), then by hours (descending)
          if (b.value !== a.value) {
            return b.value - a.value;
          }
          return b.hours - a.hours;
        })
        .map(({ hours, ...rest }) => rest) // Remove hours from final data
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
    const taskMarkets = getTaskMarkets(task);
    const taskHours = getTaskHours(task);

    taskMarkets.forEach((market) => {
      if (market) {
        const normalizedMarket = normalizeMarket(market);
        if (!marketStats[normalizedMarket]) {
          marketStats[normalizedMarket] = {
            tasks: 0,
            hours: 0,
          };
        }
        marketStats[normalizedMarket].tasks += 1;
        marketStats[normalizedMarket].hours += taskHours;
      }
    });
  });

  return addConsistentColors(
    Object.entries(marketStats)
      .map(([market, stats]) => ({
        name: market,
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
    const taskHours = getTaskHours(task);
    const userId = getTaskUserUID(task);

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
        const userName = getUserName(userId, users);

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
    const taskMarkets = getTaskMarkets(task);
    const taskHours = getTaskHours(task);
    const userId = getTaskUserUID(task);

    if (!userId || !taskMarkets || taskMarkets.length === 0) return;

    const userName = getUserName(userId, users);

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
        const normalizedMarket = normalizeMarket(market);
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

const MarketsByUsersCard = memo(({
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

  // Calculate totals for pie charts
  const marketsPieTotal = useMemo(() => 
    marketsData?.reduce((sum, item) => sum + (item.value || 0), 0) || 0,
    [marketsData]
  );
  const marketsPieHours = useMemo(() => 
    biaxialBarData?.reduce((sum, item) => sum + (item.hours || 0), 0) || 0,
    [biaxialBarData]
  );
  const userByTaskPieTotal = useMemo(() => 
    userByTaskData?.reduce((sum, item) => sum + (item.value || 0), 0) || 0,
    [userByTaskData]
  );
  const userByTaskPieHours = useMemo(() => 
    usersBiaxialData?.reduce((sum, item) => sum + (item.hours || 0), 0) || 0,
    [usersBiaxialData]
  );

  // If no data at all, show error message
  if (!hasRealData && !hasMarketsData && !hasUserByTaskData && !hasMarketsBiaxialData && !hasUsersBiaxialData && !hasUsersByMarketsCharts) {
    return (
      <div id="markets-by-users-card" className={`${className}`}>
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
      {/* Grid Container */}
      <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
        {/* Tables Section */}
        <div>
          {/* Markets by Users Table Div */}
          {hasRealData && (
            <div className="table-container">
              <AnalyticsTable
                data={analyticsByUserMarketsTableData}
                columns={analyticsByUserMarketsTableColumns}
                sectionTitle="Markets by Users"
              />
            </div>
          )}
        </div>

        {/* Charts Section */}
        <div>
          {/* Modern Charts Header */}
          <div className="relative bg-white/95 dark:bg-smallCard rounded-xl p-5 border border-gray-200/50 dark:border-gray-700/50 shadow-md mb-6 overflow-hidden">
            {/* Accent bar line on top */}
            <div 
              className="absolute top-0 left-0 right-0 h-1.5 rounded-t-xl"
              style={{
                background: `linear-gradient(90deg, ${CARD_SYSTEM.COLOR_HEX_MAP.color_default} 0%, ${CARD_SYSTEM.COLOR_HEX_MAP.color_default}cc 50%, ${CARD_SYSTEM.COLOR_HEX_MAP.color_default} 100%)`,
              }}
            />
            
            <div className="flex items-center gap-3 pt-2 relative z-10">
              {/* Icon with color_default background */}
              <div 
                className="w-10 h-10 rounded-xl flex items-center justify-center shadow-md flex-shrink-0"
                style={{
                  background: `linear-gradient(135deg, ${CARD_SYSTEM.COLOR_HEX_MAP.color_default} 0%, ${CARD_SYSTEM.COLOR_HEX_MAP.color_default}dd 100%)`,
                }}
              >
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-0.5">
                  Charts
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Visual analytics and data insights
                </p>
              </div>
              <Badge
                size="sm"
                className="shadow-sm"
                style={{
                  color: CARD_SYSTEM.COLOR_HEX_MAP.color_default,
                  backgroundColor: `${CARD_SYSTEM.COLOR_HEX_MAP.color_default}15`,
                  borderColor: `${CARD_SYSTEM.COLOR_HEX_MAP.color_default}30`,
                  borderWidth: '1px',
                  borderStyle: 'solid',
                }}
              >
                Analytics
              </Badge>
            </div>
          </div>
          
          {/* Charts Container - 2 charts in a row */}
        {(hasMarketsData || hasUserByTaskData) && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Markets Distribution Pie Chart */}
            {hasMarketsData && (
              <div className="group relative bg-white dark:bg-smallCard border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden">
                <div className="relative px-5 py-4 overflow-hidden">
                  {/* Accent bar line on top */}
                  <div 
                    className="absolute top-0 left-0 right-0 h-1.5 rounded-t-xl"
                    style={{
                      background: `linear-gradient(90deg, ${CARD_SYSTEM.COLOR_HEX_MAP.color_default} 0%, ${CARD_SYSTEM.COLOR_HEX_MAP.color_default}cc 50%, ${CARD_SYSTEM.COLOR_HEX_MAP.color_default} 100%)`,
                    }}
                  />
                  <div className="flex items-center gap-3 pt-2 relative z-10">
                    {/* Icon with color_default background */}
                    <div 
                      className="w-10 h-10 rounded-xl flex items-center justify-center shadow-md flex-shrink-0"
                      style={{
                        background: `linear-gradient(135deg, ${CARD_SYSTEM.COLOR_HEX_MAP.color_default} 0%, ${CARD_SYSTEM.COLOR_HEX_MAP.color_default}dd 100%)`,
                      }}
                    >
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h5 className="font-semibold text-gray-900 dark:text-white text-base">
                        <span>Markets Distribution: Task by markets</span>
                      </h5>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant="select_badge" 
                        size="sm"
                        style={{
                          color: CARD_SYSTEM.COLOR_HEX_MAP.color_default,
                          backgroundColor: `${CARD_SYSTEM.COLOR_HEX_MAP.color_default}15`,
                          borderColor: `${CARD_SYSTEM.COLOR_HEX_MAP.color_default}30`,
                          borderWidth: '1px',
                          borderStyle: 'solid',
                        }}
                      >
                        {marketsPieTotal} tasks
                      </Badge>
                      <Badge 
                        variant="select_badge" 
                        size="sm"
                        style={{
                          color: CARD_SYSTEM.COLOR_HEX_MAP.color_default,
                          backgroundColor: `${CARD_SYSTEM.COLOR_HEX_MAP.color_default}15`,
                          borderColor: `${CARD_SYSTEM.COLOR_HEX_MAP.color_default}30`,
                          borderWidth: '1px',
                          borderStyle: 'solid',
                        }}
                      >
                        {Math.round(marketsPieHours * 10) / 10}h
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="p-5">
                  <SimplePieChart
                    data={marketsData}
                    title=""
                    colors={marketsColors}
                    dataType={CARD_SYSTEM.CHART_DATA_TYPE.MARKET}
                    minPercentageThreshold={3}
                    leaderLineLength={20}
                  />
                </div>
              </div>
            )}

            {/* User by Task Chart */}
            {hasUserByTaskData && (
              <div className="group relative bg-white dark:bg-smallCard border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden">
                <div className="relative px-5 py-4 overflow-hidden">
                  {/* Accent bar line on top */}
                  <div 
                    className="absolute top-0 left-0 right-0 h-1.5 rounded-t-xl"
                    style={{
                      background: `linear-gradient(90deg, ${CARD_SYSTEM.COLOR_HEX_MAP.color_default} 0%, ${CARD_SYSTEM.COLOR_HEX_MAP.color_default}cc 50%, ${CARD_SYSTEM.COLOR_HEX_MAP.color_default} 100%)`,
                    }}
                  />
                  <div className="flex items-center gap-3 pt-2 relative z-10">
                    {/* Icon with color_default background */}
                    <div 
                      className="w-10 h-10 rounded-xl flex items-center justify-center shadow-md flex-shrink-0"
                      style={{
                        background: `linear-gradient(135deg, ${CARD_SYSTEM.COLOR_HEX_MAP.color_default} 0%, ${CARD_SYSTEM.COLOR_HEX_MAP.color_default}dd 100%)`,
                      }}
                    >
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h5 className="font-semibold text-gray-900 dark:text-white text-base">
                        <span>Users by Tasks: Task by users</span>
                      </h5>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant="select_badge" 
                        size="sm"
                        style={{
                          color: CARD_SYSTEM.COLOR_HEX_MAP.color_default,
                          backgroundColor: `${CARD_SYSTEM.COLOR_HEX_MAP.color_default}15`,
                          borderColor: `${CARD_SYSTEM.COLOR_HEX_MAP.color_default}30`,
                          borderWidth: '1px',
                          borderStyle: 'solid',
                        }}
                      >
                        {userByTaskPieTotal} tasks
                      </Badge>
                      <Badge 
                        variant="select_badge" 
                        size="sm"
                        style={{
                          color: CARD_SYSTEM.COLOR_HEX_MAP.color_default,
                          backgroundColor: `${CARD_SYSTEM.COLOR_HEX_MAP.color_default}15`,
                          borderColor: `${CARD_SYSTEM.COLOR_HEX_MAP.color_default}30`,
                          borderWidth: '1px',
                          borderStyle: 'solid',
                        }}
                      >
                        {Math.round(userByTaskPieHours * 10) / 10}h
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="p-5">
                  <SimplePieChart
                    data={userByTaskData}
                    title=""
                    colors={userByTaskColors}
                    dataType={CARD_SYSTEM.CHART_DATA_TYPE.USER}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Biaxial Charts Container - 2 charts in a row */}
        {(hasMarketsBiaxialData || hasUsersBiaxialData) && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Markets Biaxial Chart */}
            {hasMarketsBiaxialData && (() => {
              const totalTasks = biaxialBarData?.reduce((sum, item) => sum + (item.tasks || 0), 0) || 0;
              const totalHours = biaxialBarData?.reduce((sum, item) => sum + (item.hours || 0), 0) || 0;
              return (
                <div className="group relative bg-white dark:bg-smallCard border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden">
                  <div className="relative px-5 py-4 overflow-hidden">
                    {/* Accent bar line on top */}
                    <div 
                      className="absolute top-0 left-0 right-0 h-1.5 rounded-t-xl"
                      style={{
                        background: `linear-gradient(90deg, ${CARD_SYSTEM.COLOR_HEX_MAP.color_default} 0%, ${CARD_SYSTEM.COLOR_HEX_MAP.color_default}cc 50%, ${CARD_SYSTEM.COLOR_HEX_MAP.color_default} 100%)`,
                      }}
                    />
                    <div className="flex items-center gap-3 pt-2 relative z-10">
                      {/* Icon with color_default background */}
                      <div 
                        className="w-10 h-10 rounded-xl flex items-center justify-center shadow-md flex-shrink-0"
                        style={{
                          background: `linear-gradient(135deg, ${CARD_SYSTEM.COLOR_HEX_MAP.color_default} 0%, ${CARD_SYSTEM.COLOR_HEX_MAP.color_default}dd 100%)`,
                        }}
                      >
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h5 className="font-semibold text-gray-900 dark:text-white text-base">
                          <span>Markets: Tasks & Hours by Market</span>
                        </h5>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant="select_badge" 
                          size="sm"
                          style={{
                            color: CARD_SYSTEM.COLOR_HEX_MAP.color_default,
                            backgroundColor: `${CARD_SYSTEM.COLOR_HEX_MAP.color_default}15`,
                            borderColor: `${CARD_SYSTEM.COLOR_HEX_MAP.color_default}30`,
                            borderWidth: '1px',
                            borderStyle: 'solid',
                          }}
                        >
                          {totalTasks} tasks
                        </Badge>
                        <Badge 
                          variant="select_badge" 
                          size="sm"
                          style={{
                            color: CARD_SYSTEM.COLOR_HEX_MAP.color_default,
                            backgroundColor: `${CARD_SYSTEM.COLOR_HEX_MAP.color_default}15`,
                            borderColor: `${CARD_SYSTEM.COLOR_HEX_MAP.color_default}30`,
                            borderWidth: '1px',
                            borderStyle: 'solid',
                          }}
                        >
                          {totalHours}h
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="p-5">
                    <BiaxialBarChart
                      data={biaxialBarData}
                      title=""
                      tasksColor={biaxialTasksColor}
                      hoursColor={biaxialHoursColor}
                      dataType={CARD_SYSTEM.CHART_DATA_TYPE.MARKET}
                    />
                  </div>
                </div>
              );
            })()}

            {/* Users Biaxial Chart */}
            {hasUsersBiaxialData && (() => {
              const totalTasks = usersBiaxialData?.reduce((sum, item) => sum + (item.tasks || 0), 0) || 0;
              const totalHours = usersBiaxialData?.reduce((sum, item) => sum + (item.hours || 0), 0) || 0;
              return (
                <div className="group relative bg-white dark:bg-smallCard border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden">
                  <div className="relative px-5 py-4 overflow-hidden">
                    {/* Accent bar line on top */}
                    <div 
                      className="absolute top-0 left-0 right-0 h-1.5 rounded-t-xl"
                      style={{
                        background: `linear-gradient(90deg, ${CARD_SYSTEM.COLOR_HEX_MAP.color_default} 0%, ${CARD_SYSTEM.COLOR_HEX_MAP.color_default}cc 50%, ${CARD_SYSTEM.COLOR_HEX_MAP.color_default} 100%)`,
                      }}
                    />
                    <div className="flex items-center gap-3 pt-2 relative z-10">
                      {/* Icon with color_default background */}
                      <div 
                        className="w-10 h-10 rounded-xl flex items-center justify-center shadow-md flex-shrink-0"
                        style={{
                          background: `linear-gradient(135deg, ${CARD_SYSTEM.COLOR_HEX_MAP.color_default} 0%, ${CARD_SYSTEM.COLOR_HEX_MAP.color_default}dd 100%)`,
                        }}
                      >
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h5 className="font-semibold text-gray-900 dark:text-white text-base">
                          <span>Users: Tasks & Hours by User</span>
                        </h5>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant="select_badge" 
                          size="sm"
                          style={{
                            color: CARD_SYSTEM.COLOR_HEX_MAP.color_default,
                            backgroundColor: `${CARD_SYSTEM.COLOR_HEX_MAP.color_default}15`,
                            borderColor: `${CARD_SYSTEM.COLOR_HEX_MAP.color_default}30`,
                            borderWidth: '1px',
                            borderStyle: 'solid',
                          }}
                        >
                          {totalTasks} tasks
                        </Badge>
                        <Badge 
                          variant="select_badge" 
                          size="sm"
                          style={{
                            color: CARD_SYSTEM.COLOR_HEX_MAP.color_default,
                            backgroundColor: `${CARD_SYSTEM.COLOR_HEX_MAP.color_default}15`,
                            borderColor: `${CARD_SYSTEM.COLOR_HEX_MAP.color_default}30`,
                            borderWidth: '1px',
                            borderStyle: 'solid',
                          }}
                        >
                          {totalHours}h
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="p-5">
                    <BiaxialBarChart
                      data={usersBiaxialData}
                      title=""
                      tasksColor={usersBiaxialTasksColor}
                      hoursColor={usersBiaxialHoursColor}
                      dataType={CARD_SYSTEM.CHART_DATA_TYPE.USER}
                    />
                  </div>
                </div>
              );
            })()}
          </div>
        )}
        </div>

        {/* User Charts Section */}
        <div className="mt-8">
          <div className="mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <span>User Analytics</span>
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Individual user performance breakdown</p>
          </div>
          
          {/* Users by Markets - Separate Chart for Each User in 2-column grid */}
          {hasUsersByMarketsCharts && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {usersByMarketsCharts.map((userChart) => (
              <div 
                key={userChart.userId} 
                className="group relative bg-white dark:bg-smallCard border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden"
              >
                {/* Header with modern design */}
                <div className="relative px-5 py-4 overflow-hidden">
                  {/* Accent bar line on top */}
                  <div 
                    className="absolute top-0 left-0 right-0 h-1.5 rounded-t-xl"
                    style={{
                      background: `linear-gradient(90deg, ${CARD_SYSTEM.COLOR_HEX_MAP.color_default} 0%, ${CARD_SYSTEM.COLOR_HEX_MAP.color_default}cc 50%, ${CARD_SYSTEM.COLOR_HEX_MAP.color_default} 100%)`,
                    }}
                  />
                  <div className="flex items-center justify-between pt-2 relative z-10">
                    <div className="flex items-center gap-3">
                      <Avatar 
                        name={userChart.userName}
                        size="md"
                        showName={false}
                        className="flex-shrink-0"
                        backgroundColor={CARD_SYSTEM.COLOR_HEX_MAP.color_default}
                      />
                      <div>
                        <h5 className="font-semibold text-gray-900 dark:text-white text-base">
                          {userChart.userName}
                        </h5>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Markets Tasks & Hours</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant="select_badge" 
                        size="sm"
                        style={{
                          color: CARD_SYSTEM.COLOR_HEX_MAP.color_default,
                          backgroundColor: `${CARD_SYSTEM.COLOR_HEX_MAP.color_default}15`,
                          borderColor: `${CARD_SYSTEM.COLOR_HEX_MAP.color_default}30`,
                          borderWidth: '1px',
                          borderStyle: 'solid',
                        }}
                      >
                        {userChart.totalTasks} tasks
                      </Badge>
                      <Badge 
                        variant="select_badge" 
                        size="sm"
                        style={{
                          color: CARD_SYSTEM.COLOR_HEX_MAP.color_default,
                          backgroundColor: `${CARD_SYSTEM.COLOR_HEX_MAP.color_default}15`,
                          borderColor: `${CARD_SYSTEM.COLOR_HEX_MAP.color_default}30`,
                          borderWidth: '1px',
                          borderStyle: 'solid',
                        }}
                      >
                        {userChart.totalHours}h
                      </Badge>
                    </div>
                  </div>
                </div>
                
                {/* Chart Container */}
                <div className="p-5">
                  <BiaxialBarChart
                    data={userChart.marketData}
                    title=""
                    tasksColor={CHART_COLORS.DEFAULT[0]}
                    hoursColor={CHART_COLORS.DEFAULT[1]}
                    dataType={CARD_SYSTEM.CHART_DATA_TYPE.MARKET}
                  />
                </div>
              </div>
            ))}
          </div>
          )}
        </div>
      </div>
    </div>
  );
});

MarketsByUsersCard.displayName = 'MarketsByUsersCard';

export default MarketsByUsersCard;
