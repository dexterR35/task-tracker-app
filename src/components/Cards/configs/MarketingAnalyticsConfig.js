import {
  addConsistentColors,
  CHART_COLORS,
  CHART_DATA_TYPE,
  calculateCountWithPercentage,
  addGrandTotalRow,
  renderCountWithPercentage,
  calculateUsersChartsByCategory,
  normalizeMarket,
  getMarketColor,
} from "./analyticsSharedConfig";

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
  let tableData = [];
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
      const marketItems = sortedMarkets.map(market => ({
        key: market,
        count: categoryData[market] || 0
      }));
      sortedMarkets.forEach((market) => {
        const marketCount = categoryData[market] || 0;
        row[market] = calculateCountWithPercentage(marketCount, categoryTotal, marketItems, market);
      });

      tableData.push(row);
    }
  });

  // Add grand total row using shared utility
  if (tableData.length > 0) {
    const grandTotal = Object.values(marketTotals).reduce(
      (sum, count) => sum + count,
      0
    );
    if (grandTotal > 0) {
      tableData = addGrandTotalRow(tableData, {
        labelKey: 'category',
        labelValue: 'Grand Total',
        sumColumns: ['total'],
        marketColumns: sortedMarkets,
      });
    }
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
        render: renderCountWithPercentage,
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
        const normalizedMarket = normalizeMarket(market);
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
      .map(({ hours: _hours, ...rest }) => rest), // Remove hours from final data
    CHART_DATA_TYPE.MARKET
  );

  // Create chart data for sport marketing
  const sportMarketHours = calculateMarketHours(sportTasks, sortedMarkets);
  const sportMarketingData = addConsistentColors(
    sortedMarkets
      .map((market) => {
        // Normalize market to uppercase for consistent color mapping
        const normalizedMarket = normalizeMarket(market);
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
      .map(({ hours: _hours, ...rest }) => rest), // Remove hours from final data
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
        const normalizedMarket = normalizeMarket(market);

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
        const normalizedMarket = normalizeMarket(market);

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

  // Use shared calculateUsersChartsByCategory function
  // Wrapper to maintain API compatibility
  const calculateUsersChartsByCategoryWrapper = (marketingTasks, users, categoryName) => {
    return calculateUsersChartsByCategory(marketingTasks, users, categoryName);
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

  // Create biaxial chart data: Casino vs Sport per market
  // Each market will have casino and sport bars with market-specific colors
  const casinoSportPerMarketBiaxialData = sortedMarkets
    .map((market) => {
      const normalizedMarket = normalizeMarket(market);
      const casinoTasks = marketingData.casino[market] || 0;
      const sportTasks = marketingData.sport[market] || 0;
      const marketColor = getMarketColor(normalizedMarket);
      
      return {
        name: normalizedMarket,
        casino: casinoTasks,
        sport: sportTasks,
        color: marketColor, // Each market has its own color
      };
    })
    .filter((item) => item.casino > 0 || item.sport > 0)
    .sort((a, b) => {
      // Sort by total tasks (casino + sport) descending
      const totalA = a.casino + a.sport;
      const totalB = b.casino + b.sport;
      return totalB - totalA;
    });

  // Create biaxial chart data: Total Casino vs Total Sport
  // Calculate totals from per-market data to ensure consistency with "Casino vs Sport: Tasks by Markets" chart
  const totalCasinoFromMarkets = casinoSportPerMarketBiaxialData.reduce((sum, item) => sum + (item.casino || 0), 0);
  const totalSportFromMarkets = casinoSportPerMarketBiaxialData.reduce((sum, item) => sum + (item.sport || 0), 0);
  
  const totalCasinoSportBiaxialData = [
    {
      name: 'Total',
      casino: totalCasinoFromMarkets,
      sport: totalSportFromMarkets,
    },
  ];

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
    calculateUsersChartsByCategory: calculateUsersChartsByCategoryWrapper,
    casinoMarketingTasks,
    sportMarketingTasks,
    casinoSportPerMarketBiaxialData,
    totalCasinoSportBiaxialData,
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
    casinoSportPerMarketBiaxialData: calculatedData.casinoSportPerMarketBiaxialData,
    totalCasinoSportBiaxialData: calculatedData.totalCasinoSportBiaxialData,
    casinoUsersCharts: casinoUsersCharts,
    sportUsersCharts: sportUsersCharts,
    isLoading,
  };
};

// Simplified version without caching
export const getCachedMarketingAnalyticsCardProps = (
  tasks,
  users = [],
  isLoading = false
) => {
  return getMarketingAnalyticsCardProps(tasks, users, isLoading);
};

