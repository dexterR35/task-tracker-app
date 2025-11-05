import { addConsistentColors, CHART_COLORS, CHART_DATA_TYPE, getMarketColor, calculateCountWithPercentage } from "./analyticsSharedConfig";

/**
 * Marketing Analytics Configuration
 * Handles marketing-specific analytics calculations and card props
 */

export const calculateMarketingAnalyticsData = (tasks) => {
  const marketingData = {
    casino: {},
    sport: {},
    poker: {},
    lotto: {},
  };

  const marketTotals = {};
  const allMarkets = new Set();

  // Handle null/empty tasks array safely before iterating
  if (tasks && tasks.length > 0) {
    // Process tasks to extract marketing data
    tasks.forEach((task) => {
      const products = task.data_task?.products || task.products;
      const markets = task.data_task?.markets || task.markets || [];

      if (!products || !Array.isArray(markets) || markets.length === 0) return;

      // Check if it's a marketing task (products is a string)
      if (typeof products === "string" && products.includes("marketing")) {
        // Determine marketing category
        let category = null;
        if (products.includes("casino")) category = "casino";
        else if (products.includes("sport")) category = "sport";
        else if (products.includes("poker")) category = "poker";
        else if (products.includes("lotto")) category = "lotto";

        if (category) {
          // Process each market for this task
          markets.forEach((market) => {
            if (market) {
              allMarkets.add(market);

              // Initialize data structures
              if (!marketingData[category][market]) {
                marketingData[category][market] = 0;
              }
              if (!marketTotals[market]) {
                marketTotals[market] = 0;
              }

              // Count tasks
              marketingData[category][market]++;
              marketTotals[market]++;
            }
          });
        }
      }
    });
  }

  // Create table data
  const tableData = [];
  const sortedMarkets = Array.from(allMarkets).sort();

  // Add rows for each marketing category
  Object.keys(marketingData).forEach((category) => {
    const categoryData = marketingData[category];
    const categoryTotal = Object.values(categoryData).reduce(
      (sum, count) => sum + count,
      0
    );

    if (categoryTotal > 0) {
      const row = {
        category: category.charAt(0).toUpperCase() + category.slice(1),
        total: categoryTotal,
      };

      // Add market columns with percentages (categoryTotal is sum of all market counts, so percentages sum to 100%)
      sortedMarkets.forEach((market) => {
        const marketCount = categoryData[market] || 0;
        row[market] = calculateCountWithPercentage(marketCount, categoryTotal);
      });

      tableData.push(row);
    }
  });

  // Add grand total row
  const grandTotal = Object.values(marketTotals).reduce(
    (sum, count) => sum + count,
    0
  );
  if (grandTotal > 0) {
    const grandTotalRow = {
      category: "Grand Total",
      total: grandTotal,
      bold: true,
      highlight: true,
    };

    // Add market columns with percentages (grandTotal is sum of all market counts, so percentages sum to 100%)
    sortedMarkets.forEach((market) => {
      const marketTotal = marketTotals[market] || 0;
      grandTotalRow[market] = calculateCountWithPercentage(marketTotal, grandTotal);
    });

    tableData.push(grandTotalRow);
  }

  // Create table columns
  let tableColumns = [
    { key: "category", header: "Marketing Category", align: "left" },
    { key: "total", header: "Total Tasks", align: "center", highlight: true },
  ];

  // Add market columns only if there are markets
  if (sortedMarkets.length > 0) {
    sortedMarkets.forEach((market) => {
      tableColumns.push({
        key: market,
        header: market.toUpperCase(),
        align: "center",
      });
    });
  } else {
    // Ensure a minimal set of columns is returned if there are no markets
    tableColumns = [
      { key: "category", header: "Marketing Category", align: "left" },
      { key: "total", header: "Total Tasks", align: "center", highlight: true },
    ];
  }

  // Calculate totals for casino marketing
  const casinoTasks = tasks?.filter((task) => {
    const products = task.data_task?.products || task.products;
    return (
      typeof products === "string" &&
      products.includes("marketing") &&
      products.includes("casino")
    );
  }) || [];

  const casinoTotalTasks = casinoTasks.length;

  const casinoTotalHours = casinoTasks.reduce(
    (sum, task) =>
      sum + (task.data_task?.timeInHours || task.timeInHours || 0),
    0
  );

  // Calculate totals for sport marketing
  const sportTasks = tasks?.filter((task) => {
    const products = task.data_task?.products || task.products;
    return (
      typeof products === "string" &&
      products.includes("marketing") &&
      products.includes("sport")
    );
  }) || [];

  const sportTotalTasks = sportTasks.length;

  const sportTotalHours = sportTasks.reduce(
    (sum, task) =>
      sum + (task.data_task?.timeInHours || task.timeInHours || 0),
    0
  );

  // Helper function to calculate market hours for sorting
  const calculateMarketHours = (tasks, markets) => {
    const marketHoursMap = {};
    tasks.forEach((task) => {
      const taskMarkets = task.data_task?.markets || task.markets || [];
      const taskHours = task.data_task?.timeInHours || task.timeInHours || 0;
      taskMarkets.forEach((market) => {
        if (markets.includes(market)) {
          marketHoursMap[market] = (marketHoursMap[market] || 0) + taskHours;
        }
      });
    });
    return marketHoursMap;
  };

  // Create chart data for casino marketing
  const casinoMarketHours = calculateMarketHours(casinoTasks, sortedMarkets);
  const casinoMarketingData = addConsistentColors(
    sortedMarkets
      .map((market) => {
        // Normalize market to uppercase for consistent color mapping
        const normalizedMarket = market.trim().toUpperCase();
        return {
          name: normalizedMarket,
          value: marketingData.casino[market] || 0,
          hours: casinoMarketHours[market] || 0,
        };
      })
      .filter((item) => item.value > 0)
      .sort((a, b) => {
        // Sort by tasks/value first (descending), then by hours (descending)
        if (b.value !== a.value) {
          return b.value - a.value;
        }
        return b.hours - a.hours;
      })
      .map(({ hours, ...rest }) => rest), // Remove hours from final data
    CHART_DATA_TYPE.MARKET
  );

  // Create chart data for sport marketing
  const sportMarketHours = calculateMarketHours(sportTasks, sortedMarkets);
  const sportMarketingData = addConsistentColors(
    sortedMarkets
      .map((market) => {
        // Normalize market to uppercase for consistent color mapping
        const normalizedMarket = market.trim().toUpperCase();
        return {
          name: normalizedMarket,
          value: marketingData.sport[market] || 0,
          hours: sportMarketHours[market] || 0,
        };
      })
      .filter((item) => item.value > 0)
      .sort((a, b) => {
        // Sort by tasks/value first (descending), then by hours (descending)
        if (b.value !== a.value) {
          return b.value - a.value;
        }
        return b.hours - a.hours;
      })
      .map(({ hours, ...rest }) => rest), // Remove hours from final data
    CHART_DATA_TYPE.MARKET
  );

  // Create biaxial chart data for casino marketing
  const casinoBiaxialData = addConsistentColors(
    sortedMarkets
      .map((market) => {
        const marketTasks = marketingData.casino[market] || 0;
        const marketHours = casinoTasks
          .filter((task) => {
            const taskMarkets = task.data_task?.markets || task.markets || [];
            return taskMarkets.includes(market);
          })
          .reduce(
            (sum, task) =>
              sum + (task.data_task?.timeInHours || task.timeInHours || 0),
            0
          );

        // Normalize market to uppercase for consistent color mapping
        const normalizedMarket = market.trim().toUpperCase();
        
        return {
          name: normalizedMarket,
          tasks: marketTasks,
          hours: Math.round(marketHours * 100) / 100,
        };
      })
      .filter((item) => item.tasks > 0)
      .sort((a, b) => {
        // Sort by tasks first (descending), then by hours (descending)
        if (b.tasks !== a.tasks) {
          return b.tasks - a.tasks;
        }
        return b.hours - a.hours;
      }),
    CHART_DATA_TYPE.MARKET
  );

  // Create biaxial chart data for sport marketing
  const sportBiaxialData = addConsistentColors(
    sortedMarkets
      .map((market) => {
        const marketTasks = marketingData.sport[market] || 0;
        const marketHours = sportTasks
          .filter((task) => {
            const taskMarkets = task.data_task?.markets || task.markets || [];
            return taskMarkets.includes(market);
          })
          .reduce(
            (sum, task) =>
              sum + (task.data_task?.timeInHours || task.timeInHours || 0),
            0
          );

        // Normalize market to uppercase for consistent color mapping
        const normalizedMarket = market.trim().toUpperCase();
        
        return {
          name: normalizedMarket,
          tasks: marketTasks,
          hours: Math.round(marketHours * 100) / 100,
        };
      })
      .filter((item) => item.tasks > 0)
      .sort((a, b) => {
        // Sort by tasks first (descending), then by hours (descending)
        if (b.tasks !== a.tasks) {
          return b.tasks - a.tasks;
        }
        return b.hours - a.hours;
      }),
    CHART_DATA_TYPE.MARKET
  );

  // Calculate per-user charts for marketing (separate chart per user per category)
  const calculateUsersChartsByCategory = (marketingTasks, users, categoryName) => {
    if (!marketingTasks || marketingTasks.length === 0 || !users || users.length === 0) return [];

    const userMarketStats = {}; // { userId: { userName: "...", markets: { "RO": { tasks, hours }, ... } } }

    marketingTasks.forEach((task) => {
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
        ? user.displayName || user.name || user.email || `User ${userId.slice(0, 8)}`
        : `User ${userId.slice(0, 8)}`;

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
    return Object.entries(userMarketStats)
      .map(([userId, userData]) => {
        const marketData = Object.entries(userData.markets)
          .map(([market, stats]) => ({
            name: market,
            tasks: stats.tasks,
            hours: Math.round(stats.hours * 100) / 100,
            market: market,
          }))
          .filter((item) => item.tasks > 0 || item.hours > 0)
          .sort((a, b) => {
            if (b.tasks !== a.tasks) {
              return b.tasks - a.tasks;
            }
            return b.hours - a.hours;
          })
          .map((item) => ({
            ...item,
            color: getMarketColor(item.market),
          }));

        return {
          userId,
          userName: userData.userName,
          category: categoryName,
          marketData,
          totalTasks: userData.totalTasks,
          totalHours: Math.round(userData.totalHours * 100) / 100,
        };
      })
      .filter((chart) => chart.marketData.length > 0)
      .sort((a, b) => {
        if (b.totalTasks !== a.totalTasks) {
          return b.totalTasks - a.totalTasks;
        }
        return a.userName.localeCompare(b.userName);
      });
  };

  // Get marketing tasks filtered by category
  const casinoMarketingTasks = tasks?.filter((task) => {
    const products = task.data_task?.products || task.products;
    return (
      typeof products === "string" &&
      products.includes("marketing") &&
      products.includes("casino")
    );
  }) || [];

  const sportMarketingTasks = tasks?.filter((task) => {
    const products = task.data_task?.products || task.products;
    return (
      typeof products === "string" &&
      products.includes("marketing") &&
      products.includes("sport")
    );
  }) || [];

  return {
    tableData,
    tableColumns,
    casinoMarketingData,
    sportMarketingData,
    casinoBiaxialData,
    sportBiaxialData,
    casinoTotalTasks,
    casinoTotalHours,
    sportTotalTasks,
    sportTotalHours,
    calculateUsersChartsByCategory,
    casinoMarketingTasks,
    sportMarketingTasks,
  };
};

// Get marketing analytics card props for direct use with MarketingAnalyticsCard
export const getMarketingAnalyticsCardProps = (tasks, users = [], isLoading = false) => {
  const calculatedData = calculateMarketingAnalyticsData(tasks);

  // Calculate per-user charts for each category
  const casinoUsersCharts = calculatedData.calculateUsersChartsByCategory(
    calculatedData.casinoMarketingTasks,
    users,
    "Casino Marketing"
  );
  const sportUsersCharts = calculatedData.calculateUsersChartsByCategory(
    calculatedData.sportMarketingTasks,
    users,
    "Sport Marketing"
  );

  return {
    title: "Marketing Analytics",
    marketingTableData: calculatedData.tableData,
    marketingTableColumns: calculatedData.tableColumns,
    casinoMarketingData: calculatedData.casinoMarketingData,
    casinoMarketingTitle: `Casino Marketing by Markets (${calculatedData.casinoTotalTasks} tasks, ${calculatedData.casinoTotalHours}h)`,
    casinoMarketingColors: calculatedData.casinoMarketingData.map(
      (item) => item.color
    ),
    sportMarketingData: calculatedData.sportMarketingData,
    sportMarketingTitle: `Sport Marketing by Markets (${calculatedData.sportTotalTasks} tasks, ${calculatedData.sportTotalHours}h)`,
    sportMarketingColors: calculatedData.sportMarketingData.map(
      (item) => item.color
    ),
    casinoBiaxialData: calculatedData.casinoBiaxialData,
    casinoBiaxialTitle: `Casino Marketing Tasks & Hours by Markets (${calculatedData.casinoTotalTasks} tasks, ${calculatedData.casinoTotalHours}h)`,
    casinoBiaxialTasksColor: CHART_COLORS.DEFAULT[0],
    casinoBiaxialHoursColor: CHART_COLORS.DEFAULT[1],
    sportBiaxialData: calculatedData.sportBiaxialData,
    sportBiaxialTitle: `Sport Marketing Tasks & Hours by Markets (${calculatedData.sportTotalTasks} tasks, ${calculatedData.sportTotalHours}h)`,
    sportBiaxialTasksColor: CHART_COLORS.DEFAULT[0],
    sportBiaxialHoursColor: CHART_COLORS.DEFAULT[1],
    casinoUsersCharts: casinoUsersCharts,
    sportUsersCharts: sportUsersCharts,
    isLoading,
  };
};

// Simplified version without caching
export const getCachedMarketingAnalyticsCardProps = (
  tasks,
  month,
  users = [],
  isLoading = false
) => {
  return getMarketingAnalyticsCardProps(tasks, users, isLoading);
};

