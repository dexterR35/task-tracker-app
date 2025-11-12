import {
  addConsistentColors,
  CHART_COLORS,
  CHART_DATA_TYPE,
  calculateCountWithPercentage,
  addGrandTotalRow,
  renderCountWithPercentage,
  calculateUsersChartsByCategory,
  calculateUserTable,
  normalizeMarket,
  getMarketColor,
} from "./analyticsSharedConfig";

export const calculateAcquisitionAnalyticsData = (tasks) => {
  if (!tasks || tasks.length === 0) {
    return {
      tableData: [],
      tableColumns: [
        { key: "category", header: "Acquisition Category", align: "left" },
        {
          key: "total",
          header: "Total Tasks",
          align: "center",
          highlight: true,
        },
      ],
      casinoAcquisitionData: [],
      sportAcquisitionData: [],
      casinoBiaxialData: [],
      sportBiaxialData: [],
      casinoTotalTasks: 0,
      casinoTotalHours: 0,
      sportTotalTasks: 0,
      sportTotalHours: 0,
    };
  }

  // Initialize data structures
  const acquisitionData = {
    casino: {},
    sport: {},
    poker: {},
    lotto: {},
  };

  // Track hours per market per category
  const acquisitionHours = {
    casino: {},
    sport: {},
    poker: {},
    lotto: {},
  };

  const marketTotals = {};
  const marketHoursTotals = {}; // Track total hours per market
  const allMarkets = new Set();

  // Process tasks to extract acquisition data
  tasks.forEach((task) => {
    const products = task.data_task?.products || task.products;
    const markets = task.data_task?.markets || task.markets || [];
    const taskHours = task.data_task?.timeInHours || task.timeInHours || 0;

    if (!products || !Array.isArray(markets) || markets.length === 0) return;

    // Check if it's an acquisition task (products is a string)
    if (typeof products === "string" && products.includes("acquisition")) {
      // Determine acquisition category
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
            if (!acquisitionData[category][market]) {
              acquisitionData[category][market] = 0;
              acquisitionHours[category][market] = 0;
            }
            if (!marketTotals[market]) {
              marketTotals[market] = 0;
              marketHoursTotals[market] = 0;
            }

            // Count tasks and hours
            acquisitionData[category][market]++;
            acquisitionHours[category][market] += taskHours;
            marketTotals[market]++;
            marketHoursTotals[market] += taskHours;
          }
        });
      }
    }
  });

  // Create table data
  let tableData = [];
  const sortedMarkets = Array.from(allMarkets).sort();

  // Add rows for each acquisition category
  Object.keys(acquisitionData).forEach((category) => {
    const categoryData = acquisitionData[category];
    const categoryHours = acquisitionHours[category];
    const categoryTotal = Object.values(categoryData).reduce(
      (sum, count) => sum + count,
      0
    );
    const categoryTotalHours = Object.values(categoryHours).reduce(
      (sum, hours) => sum + hours,
      0
    );

    if (categoryTotal > 0) {
      const row = {
        category: category.charAt(0).toUpperCase() + category.slice(1),
        total: categoryTotal,
        totalHours: Math.round(categoryTotalHours * 100) / 100,
      };

      // Add market columns with percentages (categoryTotal is sum of all market counts, so percentages sum to 100%)
      const marketItems = sortedMarkets.map((market) => ({
        key: market,
        count: categoryData[market] || 0,
      }));
      sortedMarkets.forEach((market) => {
        const marketCount = categoryData[market] || 0;
        row[market] = calculateCountWithPercentage(
          marketCount,
          categoryTotal,
          marketItems,
          market
        );
        // Add hours column for this market
        const marketHours = acquisitionHours[category][market] || 0;
        row[`${market}_hours`] = Math.round(marketHours * 100) / 100;
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
        labelKey: "category",
        labelValue: "Grand Total",
        sumColumns: ["total", "totalHours"],
        marketColumns: sortedMarkets,
      });
    }
  }

  // Create table columns
  const tableColumns = [
    { key: "category", header: "Acquisition Category", align: "left" },
    { key: "total", header: "Total Tasks", align: "center", highlight: true },
    { key: "totalHours", header: "Total Hours", align: "center", highlight: true },
  ];

  // Add market columns (tasks with percentages)
  sortedMarkets.forEach((market) => {
    tableColumns.push({
      key: market,
      header: market.toUpperCase(),
      align: "center",
      render: renderCountWithPercentage,
    });
    // Add hours column for each market
    tableColumns.push({
      key: `${market}_hours`,
      header: `${market.toUpperCase()} Hours`,
      align: "center",
      highlight: false,
    });
  });

  // Calculate totals for casino acquisition
  const casinoTotalTasks = Object.values(acquisitionData.casino).reduce(
    (sum, count) => sum + count,
    0
  );
  const casinoTotalHours = tasks
    .filter((task) => {
      const products = task.data_task?.products || task.products;
      return (
        typeof products === "string" &&
        products.includes("acquisition") &&
        products.includes("casino")
      );
    })
    .reduce(
      (sum, task) =>
        sum + (task.data_task?.timeInHours || task.timeInHours || 0),
      0
    );

  // Calculate totals for sport acquisition
  const sportTotalTasks = Object.values(acquisitionData.sport).reduce(
    (sum, count) => sum + count,
    0
  );
  const sportTotalHours = tasks
    .filter((task) => {
      const products = task.data_task?.products || task.products;
      return (
        typeof products === "string" &&
        products.includes("acquisition") &&
        products.includes("sport")
      );
    })
    .reduce(
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

  // Create chart data for casino acquisition
  const casinoMarketHours = calculateMarketHours(
    tasks.filter((task) => {
      const products = task.data_task?.products || task.products;
      return (
        typeof products === "string" &&
        products.includes("acquisition") &&
        products.includes("casino")
      );
    }),
    sortedMarkets
  );
  const casinoAcquisitionData = addConsistentColors(
    sortedMarkets
      .map((market) => {
        // Normalize market to uppercase for consistent color mapping
        const normalizedMarket = normalizeMarket(market);
        return {
          name: normalizedMarket,
          value: acquisitionData.casino[market] || 0,
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

  // Create chart data for sport acquisition
  const sportMarketHours = calculateMarketHours(
    tasks.filter((task) => {
      const products = task.data_task?.products || task.products;
      return (
        typeof products === "string" &&
        products.includes("acquisition") &&
        products.includes("sport")
      );
    }),
    sortedMarkets
  );
  const sportAcquisitionData = addConsistentColors(
    sortedMarkets
      .map((market) => {
        // Normalize market to uppercase for consistent color mapping
        const normalizedMarket = normalizeMarket(market);
        return {
          name: normalizedMarket,
          value: acquisitionData.sport[market] || 0,
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

  // Create biaxial chart data for casino acquisition
  const casinoBiaxialData = addConsistentColors(
    sortedMarkets
      .map((market) => {
        const marketTasks = acquisitionData.casino[market] || 0;
        const marketHours = tasks
          .filter((task) => {
            const products = task.data_task?.products || task.products;
            const taskMarkets = task.data_task?.markets || task.markets || [];
            return (
              typeof products === "string" &&
              products.includes("acquisition") &&
              products.includes("casino") &&
              taskMarkets.includes(market)
            );
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

  // Create biaxial chart data for sport acquisition
  const sportBiaxialData = addConsistentColors(
    sortedMarkets
      .map((market) => {
        const marketTasks = acquisitionData.sport[market] || 0;
        const marketHours = tasks
          .filter((task) => {
            const products = task.data_task?.products || task.products;
            const taskMarkets = task.data_task?.markets || task.markets || [];
            return (
              typeof products === "string" &&
              products.includes("acquisition") &&
              products.includes("sport") &&
              taskMarkets.includes(market)
            );
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
  const calculateUsersChartsByCategoryWrapper = (acquisitionTasks, users, categoryName) => {
    return calculateUsersChartsByCategory(acquisitionTasks, users, categoryName);
  };

  // Get acquisition tasks filtered by category
  const casinoAcquisitionTasks = tasks.filter((task) => {
    const products = task.data_task?.products || task.products;
    return (
      typeof products === "string" &&
      products.includes("acquisition") &&
      products.includes("casino")
    );
  });

  const sportAcquisitionTasks = tasks.filter((task) => {
    const products = task.data_task?.products || task.products;
    return (
      typeof products === "string" &&
      products.includes("acquisition") &&
      products.includes("sport")
    );
  });

  // Use shared calculateUserTable function for both casino and sport
  // Wrappers to maintain API compatibility
  const calculateCasinoUserTable = (acquisitionTasks, users) => {
    return calculateUserTable(acquisitionTasks, users);
  };

  const calculateSportUserTable = (acquisitionTasks, users) => {
    return calculateUserTable(acquisitionTasks, users);
  };

  // Calculate Sport + Casino combined user table
  const calculateSportCasinoUserTable = (tasks, users) => {
    // Filter tasks for both sport and casino acquisition
    const sportCasinoTasks = tasks.filter((task) => {
      const products = task.data_task?.products || task.products;
      return (
        typeof products === "string" &&
        products.includes("acquisition") &&
        (products.includes("sport") || products.includes("casino"))
      );
    });

    return calculateUserTable(sportCasinoTasks, users);
  };

  // Create biaxial chart data: Casino vs Sport per market
  // Each market will have casino and sport bars with market-specific colors
  const casinoSportPerMarketBiaxialData = sortedMarkets
    .map((market) => {
      const normalizedMarket = normalizeMarket(market);
      const casinoTasks = acquisitionData.casino[market] || 0;
      const sportTasks = acquisitionData.sport[market] || 0;
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
  const totalCasinoSportBiaxialData = [
    {
      name: 'Total',
      casino: casinoTotalTasks,
      sport: sportTotalTasks,
    },
  ];

  return {
    tableData,
    tableColumns,
    casinoAcquisitionData,
    sportAcquisitionData,
    casinoBiaxialData,
    sportBiaxialData,
    casinoTotalTasks,
    casinoTotalHours,
    sportTotalTasks,
    sportTotalHours,
    calculateUsersChartsByCategory: calculateUsersChartsByCategoryWrapper,
    casinoAcquisitionTasks,
    sportAcquisitionTasks,
    calculateCasinoUserTable,
    calculateSportUserTable,
    calculateSportCasinoUserTable,
    casinoSportPerMarketBiaxialData,
    totalCasinoSportBiaxialData,
  };
};

// Get acquisition analytics card props for direct use with AcquisitionAnalyticsCard
export const getAcquisitionAnalyticsCardProps = (
  tasks,
  users = [],
  isLoading = false
) => {
  const calculatedData = calculateAcquisitionAnalyticsData(tasks);

  // Calculate per-user charts for each category
  const casinoUsersCharts = calculatedData.calculateUsersChartsByCategory(
    calculatedData.casinoAcquisitionTasks,
    users,
    "Casino Acquisition"
  );
  const sportUsersCharts = calculatedData.calculateUsersChartsByCategory(
    calculatedData.sportAcquisitionTasks,
    users,
    "Sport Acquisition"
  );

  // Calculate user tables
  const casinoUserTable = calculatedData.calculateCasinoUserTable(
    calculatedData.casinoAcquisitionTasks,
    users
  );
  const sportUserTable = calculatedData.calculateSportUserTable(
    calculatedData.sportAcquisitionTasks,
    users
  );
  const sportCasinoUserTable = calculatedData.calculateSportCasinoUserTable(
    tasks,
    users
  );

  return {
    title: "Acquisition Analytics",
    acquisitionTableData: calculatedData.tableData,
    acquisitionTableColumns: calculatedData.tableColumns,
    casinoAcquisitionData: calculatedData.casinoAcquisitionData,
    casinoAcquisitionTitle: `Casino Acquisition by Markets (${calculatedData.casinoTotalTasks} tasks, ${calculatedData.casinoTotalHours}h)`,
    casinoAcquisitionColors: calculatedData.casinoAcquisitionData.map(
      (item) => item.color
    ),
    sportAcquisitionData: calculatedData.sportAcquisitionData,
    sportAcquisitionTitle: `Sport Acquisition by Markets (${calculatedData.sportTotalTasks} tasks, ${calculatedData.sportTotalHours}h)`,
    sportAcquisitionColors: calculatedData.sportAcquisitionData.map(
      (item) => item.color
    ),
    casinoBiaxialData: calculatedData.casinoBiaxialData,
    casinoBiaxialTitle: `Casino Acquisition Tasks & Hours by Markets (${calculatedData.casinoTotalTasks} tasks, ${calculatedData.casinoTotalHours}h)`,
    casinoBiaxialTasksColor: CHART_COLORS.DEFAULT[0],
    casinoBiaxialHoursColor: CHART_COLORS.DEFAULT[1],
    sportBiaxialData: calculatedData.sportBiaxialData,
    sportBiaxialTitle: `Sport Acquisition Tasks & Hours by Markets (${calculatedData.sportTotalTasks} tasks, ${calculatedData.sportTotalHours}h)`,
    sportBiaxialTasksColor: CHART_COLORS.DEFAULT[0],
    sportBiaxialHoursColor: CHART_COLORS.DEFAULT[1],
    casinoUsersCharts: casinoUsersCharts,
    sportUsersCharts: sportUsersCharts,
    casinoUserTableData: casinoUserTable.tableData,
    casinoUserTableColumns: casinoUserTable.tableColumns,
    sportUserTableData: sportUserTable.tableData,
    sportUserTableColumns: sportUserTable.tableColumns,
    sportCasinoUserTableData: sportCasinoUserTable.tableData,
    sportCasinoUserTableColumns: sportCasinoUserTable.tableColumns,
    casinoSportPerMarketBiaxialData: calculatedData.casinoSportPerMarketBiaxialData,
    totalCasinoSportBiaxialData: calculatedData.totalCasinoSportBiaxialData,
    isLoading,
  };
};

// Simplified version without caching
export const getCachedAcquisitionAnalyticsCardProps = (
  tasks,
  users = [],
  isLoading = false
) => {
  return getAcquisitionAnalyticsCardProps(tasks, users, isLoading);
};
