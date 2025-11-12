import React from "react";
import { 
  addConsistentColors, 
  CHART_COLORS, 
  CHART_DATA_TYPE, 
  getMarketColor, 
  calculateCountWithPercentage, 
  addGrandTotalRow, 
  renderCountWithPercentage,
  calculatePercentagesForGroup,
  getUserName,
  normalizeMarket,
  getTaskMarkets,
  getTaskHours,
  getTaskUserUID,
  calculateUsersChartsByCategory,
} from "./analyticsSharedConfig";

/**
 * Misc Analytics Configuration
 * Handles misc product-specific analytics calculations and card props
 */
export const calculateMiscAnalyticsData = (tasks) => {
  if (!tasks || tasks.length === 0) {
    return {
      tableData: [],
      tableColumns: [
        { key: "category", header: "Misc Category", align: "left" },
        {
          key: "total",
          header: "Task Count",
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
      categoryPieData: [],
      miscPieData: [],
      biaxialData: [],
      categoryTotals: {},
    };
  }

  // Track misc categories and their markets
  const miscData = {};
  const marketTotals = {};
  const allMarkets = new Set();

  // Count tasks by misc category
  tasks.forEach((task) => {
    const products = task.data_task?.products || task.products;
    const markets = task.data_task?.markets || task.markets || [];

    if (!products) {
      return;
    }

    const productsLower = products.toLowerCase().trim();

    // Only count tasks that start with "misc" (misc casino, misc sport, etc.) or are exactly "misc"
    if (productsLower.startsWith("misc ") || productsLower === "misc") {
      const categoryKey = productsLower === "misc" ? "misc" : productsLower;
      
      if (!miscData[categoryKey]) {
        miscData[categoryKey] = {
          count: 0,
          hours: 0,
          markets: {}
        };
      }

      miscData[categoryKey].count++;
      const taskHours = task.data_task?.timeInHours || task.timeInHours || 0;
      miscData[categoryKey].hours += taskHours;

      // Track markets for this misc category
      if (Array.isArray(markets) && markets.length > 0) {
        markets.forEach((market) => {
          if (market) {
            const normalizedMarket = normalizeMarket(market);
            allMarkets.add(normalizedMarket);

            if (!miscData[categoryKey].markets[normalizedMarket]) {
              miscData[categoryKey].markets[normalizedMarket] = 0;
            }
            if (!marketTotals[normalizedMarket]) {
              marketTotals[normalizedMarket] = 0;
            }

            miscData[categoryKey].markets[normalizedMarket]++;
            marketTotals[normalizedMarket]++;
          }
        });
      }
    }
  });

  // Calculate totals for misc tasks
  const filteredTasks = tasks.filter((task) => {
    const products = task.data_task?.products || task.products;
    if (!products) return false;
    const productsLower = products.toLowerCase().trim();
    return productsLower.startsWith("misc ") || productsLower === "misc";
  });

  const totalTasks = filteredTasks.length;
  const totalHours = filteredTasks.reduce((sum, task) => {
    return sum + (task.data_task?.timeInHours || task.timeInHours || 0);
  }, 0);

  // Create table data for misc categories
  let tableData = [];
  const sortedMarkets = Array.from(allMarkets).sort();

  // Helper function to add a misc category row with markets
  const addMiscCategoryRow = (categoryKey, categoryName) => {
    const categoryData = miscData[categoryKey];
    if (categoryData && categoryData.count > 0) {
      const row = {
        category: categoryName,
        total: categoryData.count,
        totalHours: categoryData.hours,
      };

      // Calculate total market count for this misc category
      let miscMarketTotal = 0;
      const marketItems = [];
      sortedMarkets.forEach((market) => {
        const marketCount = categoryData.markets[market] || 0;
        miscMarketTotal += marketCount;
        marketItems.push({ key: market, count: marketCount });
      });

      // Add market columns with percentages
      sortedMarkets.forEach((market) => {
        const marketCount = categoryData.markets[market] || 0;
        row[market] = calculateCountWithPercentage(marketCount, miscMarketTotal, marketItems, market);
      });

      tableData.push(row);
    }
  };

  // Add all misc categories that have data
  Object.keys(miscData).forEach((categoryKey) => {
    const categoryName = categoryKey === "misc" 
      ? "Misc" 
      : categoryKey.split(" ").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
    addMiscCategoryRow(categoryKey, categoryName);
  });

  // Add Grand Total row
  if (totalTasks > 0 && tableData.length > 0) {
    tableData = addGrandTotalRow(tableData, {
      labelKey: 'category',
      labelValue: 'Grand Total',
      sumColumns: ['total', 'totalHours'],
      marketColumns: sortedMarkets,
    });
  }

  // Create table columns
  const tableColumns = [
    {
      key: "category",
      header: "Misc Category",
      align: "left",
      render: (value) => (
        <span className="font-medium text-gray-900 dark:text-gray-100">
          {value}
        </span>
      ),
    },
    {
      key: "total",
      header: "Task Count",
      align: "center",
      highlight: true,
      render: (value) => (
        <span className="text-gray-700 dark:text-gray-300">{value}</span>
      ),
    },
    {
      key: "totalHours",
      header: "Total Hours",
      align: "center",
      highlight: true,
      render: (value) => (
        <span className="text-gray-700 dark:text-gray-300">{value.toFixed(1)}h</span>
      ),
    },
  ];

  // Add market columns
  sortedMarkets.forEach((market) => {
    tableColumns.push({
      key: market,
      header: market.toUpperCase(),
      align: "center",
      render: renderCountWithPercentage,
    });
  });

  // Create category pie chart data
  const categoryPieData = addConsistentColors(
    Object.entries(miscData)
      .filter(([_, data]) => data.count > 0)
      .map(([categoryKey, data]) => ({
        name: categoryKey === "misc" 
          ? "Misc" 
          : categoryKey.split(" ").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" "),
        value: data.count,
        hours: Math.round(data.hours * 100) / 100,
        percentage: totalTasks > 0 ? Math.min(Math.round((data.count / totalTasks) * 100), 100) : 0,
      }))
      .sort((a, b) => {
        // Sort by tasks (value) first (descending), then by hours (descending)
        if (b.value !== a.value) {
          return b.value - a.value;
        }
        return b.hours - a.hours;
      })
      .map(({ hours, ...rest }) => rest), // Remove hours from final data
    CHART_DATA_TYPE.PRODUCT
  );

  // Create biaxial chart data
  const biaxialData = addConsistentColors(
    Object.entries(miscData)
      .filter(([_, data]) => data.count > 0)
      .map(([categoryKey, data]) => ({
        name: categoryKey === "misc" 
          ? "Misc" 
          : categoryKey.split(" ").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" "),
        tasks: data.count,
        hours: Math.round(data.hours * 100) / 100,
      })),
    CHART_DATA_TYPE.PRODUCT
  );

  return {
    tableData,
    tableColumns,
    categoryPieData,
    biaxialData,
    categoryTotals: Object.fromEntries(
      Object.entries(miscData).map(([key, data]) => [key, data.count])
    ),
    totalTasks,
    totalHours,
    sortedMarkets: Array.from(sortedMarkets),
    filteredTasks, // Return filtered tasks for user calculations
  };
};

/**
 * Calculate per-user misc analytics with markets
 */
const calculateUsersMiscData = (miscTasks, users, allMarkets) => {
  if (!miscTasks || miscTasks.length === 0 || !users || users.length === 0) {
    return {
      tableData: [],
      tableColumns: [
        { key: "user", header: "User", align: "left" },
        { key: "total", header: "Total Tasks", align: "center", highlight: true },
        { key: "totalHours", header: "Total Hours", align: "center", highlight: true },
      ],
    };
  }

  const userMiscData = {};
  const sortedMarkets = Array.from(allMarkets).sort();

  miscTasks.forEach((task) => {
    const taskMarkets = getTaskMarkets(task);
    const taskHours = getTaskHours(task);
    const userId = getTaskUserUID(task);

    if (!userId || !taskMarkets || taskMarkets.length === 0) return;

    const userName = getUserName(userId, users);

    // Initialize user if not exists
    if (!userMiscData[userId]) {
      userMiscData[userId] = {
        userName,
        markets: {},
        totalTasks: 0,
        totalHours: 0,
      };
    }

    taskMarkets.forEach((market) => {
      if (market) {
        const normalizedMarket = normalizeMarket(market);
        if (!userMiscData[userId].markets[normalizedMarket]) {
          userMiscData[userId].markets[normalizedMarket] = {
            tasks: 0,
            hours: 0,
          };
        }
        userMiscData[userId].markets[normalizedMarket].tasks += 1;
        userMiscData[userId].markets[normalizedMarket].hours += taskHours;
      }
    });

    // Update user totals
    userMiscData[userId].totalTasks += 1;
    userMiscData[userId].totalHours += taskHours;
  });

  // Create table data
  const userTableData = Object.entries(userMiscData)
    .map(([userId, userData]) => {
      const row = {
        user: userData.userName,
        total: userData.totalTasks,
        totalHours: Math.round(userData.totalHours * 100) / 100,
      };

      // Calculate total market count for this user
      let userMarketTotal = 0;
      const marketItems = [];
      sortedMarkets.forEach((market) => {
        const marketCount = userData.markets[market]?.tasks || 0;
        userMarketTotal += marketCount;
        marketItems.push({ key: market, count: marketCount });
      });

      // Add market columns with percentages
      sortedMarkets.forEach((market) => {
        const marketCount = userData.markets[market]?.tasks || 0;
        row[market] = calculateCountWithPercentage(marketCount, userMarketTotal, marketItems, market);
      });

      return row;
    })
    .sort((a, b) => b.total - a.total); // Sort by total tasks descending

  // Add Grand Total row
  if (userTableData.length > 0) {
    // Calculate grand totals from user data directly
    const grandTotal = Object.values(userMiscData).reduce(
      (acc, userData) => {
        acc.total += userData.totalTasks;
        acc.totalHours += userData.totalHours;
        sortedMarkets.forEach((market) => {
          const marketCount = userData.markets[market]?.tasks || 0;
          acc.markets[market] = (acc.markets[market] || 0) + marketCount;
        });
        return acc;
      },
      { total: 0, totalHours: 0, markets: {} }
    );

    const grandTotalRow = {
      user: "Grand Total",
      total: grandTotal.total,
      totalHours: Math.round(grandTotal.totalHours * 100) / 100,
      bold: true,
      highlight: true,
    };

    // Add market totals (counts only, no percentages for grand total)
    sortedMarkets.forEach((market) => {
      grandTotalRow[market] = grandTotal.markets[market] || 0;
    });

    userTableData.push(grandTotalRow);
  }

  // Create table columns
  const userTableColumns = [
    {
      key: "user",
      header: "User",
      align: "left",
      render: (value, row) => (
        <span className={row?.bold ? "font-bold text-gray-900 dark:text-gray-100" : "font-medium text-gray-900 dark:text-gray-100"}>
          {value}
        </span>
      ),
    },
    {
      key: "total",
      header: "Total Tasks",
      align: "center",
      highlight: true,
      render: (value, row) => (
        <span className={row?.bold ? "font-bold text-gray-700 dark:text-gray-300" : "text-gray-700 dark:text-gray-300"}>
          {value}
        </span>
      ),
    },
    {
      key: "totalHours",
      header: "Total Hours",
      align: "center",
      highlight: true,
      render: (value, row) => (
        <span className={row?.bold ? "font-bold text-gray-700 dark:text-gray-300" : "text-gray-700 dark:text-gray-300"}>
          {value.toFixed(1)}h
        </span>
      ),
    },
  ];

  // Add market columns
  sortedMarkets.forEach((market) => {
    userTableColumns.push({
      key: market,
      header: market.toUpperCase(),
      align: "center",
      render: (value, row) => {
        if (row?.bold) {
          // Grand Total row - show count only
          return <span className="font-bold text-gray-700 dark:text-gray-300">{value || 0}</span>;
        }
        // Regular rows - use percentage renderer
        return renderCountWithPercentage(value);
      },
    });
  });

  return {
    tableData: userTableData,
    tableColumns: userTableColumns,
  };
};

/**
 * Get Misc Analytics Card Props
 */
export const getMiscAnalyticsCardProps = (tasks, users = [], isLoading = false) => {
  const miscData = calculateMiscAnalyticsData(tasks);
  const usersMiscData = calculateUsersMiscData(miscData.filteredTasks, users, miscData.sortedMarkets);

  // Calculate per-user charts showing their markets breakdown for misc tasks
  const miscUsersCharts = calculateUsersChartsByCategory(
    miscData.filteredTasks,
    users,
    "Misc"
  );

  return {
    title: "Misc Analytics",
    miscTableData: miscData.tableData,
    miscTableColumns: miscData.tableColumns,
    usersMiscTableData: usersMiscData.tableData,
    usersMiscTableColumns: usersMiscData.tableColumns,
    categoryPieData: miscData.categoryPieData,
    categoryPieTitle: `Misc Categories Distribution (${miscData.totalTasks} tasks, ${Math.round(miscData.totalHours * 100) / 100}h)`,
    categoryPieColors: miscData.categoryPieData.map((item) => item.color),
    categoryBiaxialData: miscData.biaxialData,
    categoryBiaxialTitle: `Misc Categories: Tasks & Hours (${miscData.totalTasks} tasks, ${Math.round(miscData.totalHours * 100) / 100}h)`,
    categoryBiaxialTasksColor: CHART_COLORS.DEFAULT[0],
    categoryBiaxialHoursColor: CHART_COLORS.DEFAULT[1],
    miscUsersCharts: miscUsersCharts,
    totalTasks: miscData.totalTasks,
    totalHours: Math.round(miscData.totalHours * 100) / 100,
    className: "",
    isLoading,
  };
};

// Simplified version without caching
export const getCachedMiscAnalyticsCardProps = (
  tasks,
  users = [],
  isLoading = false
) => {
  return getMiscAnalyticsCardProps(tasks, users, isLoading);
};

