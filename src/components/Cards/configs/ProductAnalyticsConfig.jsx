import React from "react";
import { addConsistentColors, CHART_COLORS, CHART_DATA_TYPE, getMarketColor } from "./analyticsSharedConfig";

/**
 * Product Analytics Configuration
 * Handles product-specific analytics calculations and card props
 */

export const calculateProductAnalyticsData = (tasks) => {
  if (!tasks || tasks.length === 0) {
    return {
      tableData: [],
      tableColumns: [
        { key: "category", header: "Product Category", align: "left" },
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
        {
          key: "percentage",
          header: "Percentage",
          align: "center",
          highlight: true,
        },
      ],
      categoryPieData: [],
      productPieData: [],
      biaxialData: [],
      categoryTotals: {
        marketing: 0,
        acquisition: 0,
        product: 0,
        misc: 0,
      },
    };
  }

  // Initialize product counts
  const productCounts = {
    "marketing casino": 0,
    "marketing sport": 0,
    "marketing poker": 0,
    "marketing lotto": 0,
    "acquisition casino": 0,
    "acquisition sport": 0,
    "acquisition poker": 0,
    "acquisition lotto": 0,
    "product casino": 0,
    "product sport": 0,
    "product poker": 0,
    "product lotto": 0,
    misc: 0,
  };

  // Count tasks by product - only include "product" category tasks
  tasks.forEach((task) => {
    const products = task.data_task?.products || task.products;

    if (!products) {
      return; // Skip tasks without products
    }

    const productsLower = products.toLowerCase().trim();

    // Only count tasks that start with "product" (product casino, product sport, etc.)
    if (productsLower.startsWith("product ")) {
      if (productCounts.hasOwnProperty(productsLower)) {
        productCounts[productsLower]++;
      }
    }
    // Skip marketing, acquisition, and other categories
  });

  // Calculate totals for only "product" category tasks
  const filteredTasks = tasks.filter((task) => {
    const products = task.data_task?.products || task.products;
    if (!products) return false;
    const productsLower = products.toLowerCase().trim();
    return productsLower.startsWith("product ");
  });

  const totalTasks = filteredTasks.length;

  // Calculate total hours only for filtered tasks
  const totalHours = filteredTasks.reduce((sum, task) => {
    return sum + (task.data_task?.timeInHours || task.timeInHours || 0);
  }, 0);

  // Calculate category totals (only product categories)
  const categoryTotals = {
    "product casino": productCounts["product casino"],
    "product sport": productCounts["product sport"],
    "product poker": productCounts["product poker"],
    "product lotto": productCounts["product lotto"],
  };

  // Create table data for product categories only (only show categories with data)
  const tableData = [];

  // Only add categories that have actual data
  if (categoryTotals["product casino"] > 0) {
    tableData.push({
      category: "Product Casino",
      total: categoryTotals["product casino"],
      totalHours: tasks
        .filter((task) => {
          const products = task.data_task?.products || task.products;
          return products && products.toLowerCase().trim() === "product casino";
        })
        .reduce(
          (sum, task) =>
            sum + (task.data_task?.timeInHours || task.timeInHours || 0),
          0
        ),
      percentage:
        totalTasks > 0
          ? Math.round((categoryTotals["product casino"] / totalTasks) * 100)
          : 0,
      details: {
        "product casino": productCounts["product casino"],
      },
    });
  }

  if (categoryTotals["product sport"] > 0) {
    tableData.push({
      category: "Product Sport",
      total: categoryTotals["product sport"],
      totalHours: tasks
        .filter((task) => {
          const products = task.data_task?.products || task.products;
          return products && products.toLowerCase().trim() === "product sport";
        })
        .reduce(
          (sum, task) =>
            sum + (task.data_task?.timeInHours || task.timeInHours || 0),
          0
        ),
      percentage:
        totalTasks > 0
          ? Math.round((categoryTotals["product sport"] / totalTasks) * 100)
          : 0,
      details: {
        "product sport": productCounts["product sport"],
      },
    });
  }

  if (categoryTotals["product poker"] > 0) {
    tableData.push({
      category: "Product Poker",
      total: categoryTotals["product poker"],
      totalHours: tasks
        .filter((task) => {
          const products = task.data_task?.products || task.products;
          return products && products.toLowerCase().trim() === "product poker";
        })
        .reduce(
          (sum, task) =>
            sum + (task.data_task?.timeInHours || task.timeInHours || 0),
          0
        ),
      percentage:
        totalTasks > 0
          ? Math.round((categoryTotals["product poker"] / totalTasks) * 100)
          : 0,
      details: {
        "product poker": productCounts["product poker"],
      },
    });
  }

  if (categoryTotals["product lotto"] > 0) {
    tableData.push({
      category: "Product Lotto",
      total: categoryTotals["product lotto"],
      totalHours: tasks
        .filter((task) => {
          const products = task.data_task?.products || task.products;
          return products && products.toLowerCase().trim() === "product lotto";
        })
        .reduce(
          (sum, task) =>
            sum + (task.data_task?.timeInHours || task.timeInHours || 0),
          0
        ),
      percentage:
        totalTasks > 0
          ? Math.round((categoryTotals["product lotto"] / totalTasks) * 100)
          : 0,
      details: {
        "product lotto": productCounts["product lotto"],
      },
    });
  }

  // Add Total Tasks row only if there are any product tasks
  if (totalTasks > 0) {
    tableData.push({
      category: "Total Tasks",
      total: totalTasks,
      totalHours: totalHours,
      percentage: 100,
    });
  }

  // Create table columns
  const tableColumns = [
    {
      key: "category",
      header: "Product Category",
      render: (value) => (
        <span className="font-medium text-gray-900 dark:text-gray-100">
          {value}
        </span>
      ),
    },
    {
      key: "total",
      header: "Task Count",
      render: (value) => (
        <span className="text-gray-700 dark:text-gray-300">{value}</span>
      ),
    },
    {
      key: "totalHours",
      header: "Total Hours",
      render: (value) => (
        <span className="text-gray-700 dark:text-gray-300">{value}h</span>
      ),
    },
    {
      key: "percentage",
      header: "Percentage",
      render: (value) => (
        <span className="text-gray-700 dark:text-gray-300">{value}%</span>
      ),
    },
  ];

  // Create first pie chart data (categories with tasks - including misc)
  const categoryPieData = addConsistentColors(
    Object.entries(categoryTotals)
      .filter(([category, count]) => count > 0)
      .map(([category, count]) => ({
        name: category.charAt(0).toUpperCase() + category.slice(1),
        value: count,
        percentage: totalTasks > 0 ? Math.round((count / totalTasks) * 100) : 0,
      })),
    CHART_DATA_TYPE.PRODUCT
  );

  // Create second pie chart data (individual products with tasks - including misc)
  const productPieData = addConsistentColors(
    Object.entries(productCounts)
      .filter(([product, count]) => count > 0)
      .map(([product, count]) => ({
        name: product.charAt(0).toUpperCase() + product.slice(1),
        value: count,
      })),
    CHART_DATA_TYPE.PRODUCT
  );

  // Create biaxial chart data for product analytics (including misc)
  const biaxialData = addConsistentColors(
    Object.entries(productCounts)
      .filter(([product, count]) => count > 0)
      .map(([product, count]) => {
        const productHours = tasks
          .filter((task) => {
            const products = task.data_task?.products || task.products;
            return products && products.toLowerCase().trim() === product;
          })
          .reduce(
            (sum, task) =>
              sum + (task.data_task?.timeInHours || task.timeInHours || 0),
            0
          );

        return {
          name: product.charAt(0).toUpperCase() + product.slice(1),
          tasks: count,
          hours: Math.round(productHours * 100) / 100,
        };
      }),
    CHART_DATA_TYPE.PRODUCT
  );

  // Calculate market breakdown for each product category
  const productMarketStats = {}; // { "product casino": { "RO": { tasks: 10, hours: 25.5 }, ... }, ... }

  filteredTasks.forEach((task) => {
    const products = task.data_task?.products || task.products;
    const markets = task.data_task?.markets || task.markets || [];
    const timeInHours = task.data_task?.timeInHours || task.timeInHours || 0;

    if (!products || !Array.isArray(markets) || markets.length === 0) return;

    const productsLower = products.toLowerCase().trim();
    if (!productsLower.startsWith("product ")) return;

    // Initialize product category if not exists
    if (!productMarketStats[productsLower]) {
      productMarketStats[productsLower] = {};
    }

    // Process each market for this task
    markets.forEach((market) => {
      if (market) {
        // Normalize market to uppercase for consistent color mapping
        const normalizedMarket = market.trim().toUpperCase();
        if (!productMarketStats[productsLower][normalizedMarket]) {
          productMarketStats[productsLower][normalizedMarket] = {
            tasks: 0,
            hours: 0,
          };
        }
        productMarketStats[productsLower][normalizedMarket].tasks += 1;
        productMarketStats[productsLower][normalizedMarket].hours += timeInHours;
      }
    });
  });

  // Create market pie and biaxial data for each product category
  const productCasinoMarketsPieData = productMarketStats["product casino"]
    ? addConsistentColors(
        Object.entries(productMarketStats["product casino"])
          .map(([market, stats]) => ({
            name: market,
            value: stats.tasks,
          }))
          .filter((item) => item.value > 0)
          .sort((a, b) => b.value - a.value),
        CHART_DATA_TYPE.MARKET
      )
    : [];

  const productCasinoMarketsBiaxialData = productMarketStats["product casino"]
    ? Object.entries(productMarketStats["product casino"])
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
        }))
    : [];

  const productSportMarketsPieData = productMarketStats["product sport"]
    ? addConsistentColors(
        Object.entries(productMarketStats["product sport"])
          .map(([market, stats]) => ({
            name: market,
            value: stats.tasks,
          }))
          .filter((item) => item.value > 0)
          .sort((a, b) => b.value - a.value),
        CHART_DATA_TYPE.MARKET
      )
    : [];

  const productSportMarketsBiaxialData = productMarketStats["product sport"]
    ? Object.entries(productMarketStats["product sport"])
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
        }))
    : [];

  // Calculate totals for each product category from actual task data
  const productCasinoTasks = filteredTasks.filter((task) => {
    const products = task.data_task?.products || task.products;
    return products && products.toLowerCase().trim() === "product casino";
  });
  const productCasinoTotalTasks = productCasinoTasks.length;
  const productCasinoTotalHours = productCasinoTasks.reduce(
    (sum, task) => sum + (task.data_task?.timeInHours || task.timeInHours || 0),
    0
  );

  const productSportTasks = filteredTasks.filter((task) => {
    const products = task.data_task?.products || task.products;
    return products && products.toLowerCase().trim() === "product sport";
  });
  const productSportTotalTasks = productSportTasks.length;
  const productSportTotalHours = productSportTasks.reduce(
    (sum, task) => sum + (task.data_task?.timeInHours || task.timeInHours || 0),
    0
  );

  // Calculate per-user charts for product (separate chart per user showing their markets breakdown)
  const calculateUsersChartsByProduct = (productTasks, users) => {
    if (!productTasks || productTasks.length === 0 || !users || users.length === 0) return [];

    const userMarketStats = {}; // { userId: { userName: "...", markets: { "RO": { tasks, hours }, ... } } }

    productTasks.forEach((task) => {
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

  return {
    tableData,
    tableColumns,
    categoryPieData,
    productPieData,
    biaxialData,
    categoryTotals,
    productCasinoMarketsPieData,
    productCasinoMarketsBiaxialData,
    productCasinoTotalTasks,
    productCasinoTotalHours,
    productSportMarketsPieData,
    productSportMarketsBiaxialData,
    productSportTotalTasks,
    productSportTotalHours,
    calculateUsersChartsByProduct,
    filteredTasks,
  };
};

export const getProductAnalyticsCardProps = (tasks, users = [], isLoading = false) => {
  const productData = calculateProductAnalyticsData(tasks);

  // Calculate per-user charts showing their markets breakdown for product tasks
  const productUsersCharts = productData.calculateUsersChartsByProduct(
    productData.filteredTasks,
    users
  );

  // Use filtered totals from productData instead of all tasks
  const totalTasks =
    productData.tableData.find((row) => row.category === "Total Tasks")
      ?.total || 0;
  const totalHours =
    productData.tableData.find((row) => row.category === "Total Tasks")
      ?.totalHours || 0;

  // Split biaxial data into two charts (categories and products)
  const categoryBiaxialData = Object.entries(productData.categoryTotals || {})
    .filter(([category, count]) => count > 0)
    .map(([category, count], index) => {
      const categoryHours = tasks
        .filter((task) => {
          const products = task.data_task?.products || task.products;
          return products && products.toLowerCase().includes(category);
        })
        .reduce(
          (sum, task) =>
            sum + (task.data_task?.timeInHours || task.timeInHours || 0),
          0
        );

      return {
        name: category.charAt(0).toUpperCase() + category.slice(1),
        tasks: count,
        hours: Math.round(categoryHours * 100) / 100,
        color: CHART_COLORS.DEFAULT[index % CHART_COLORS.DEFAULT.length],
      };
    });

  return {
    title: "Product Analytics",
    productTableData: productData.tableData,
    productTableColumns: productData.tableColumns,
    categoryPieData: productData.categoryPieData,
    categoryPieTitle: `Product Categories (${totalTasks} tasks, ${totalHours}h)`,
    categoryPieColors: productData.categoryPieData.map((item) => item.color),
    productPieData: productData.productPieData,
    productPieTitle: `Individual Products (${totalTasks} tasks, ${totalHours}h)`,
    productPieColors: productData.productPieData.map((item) => item.color),
    categoryBiaxialData: categoryBiaxialData,
    categoryBiaxialTitle: `Product Categories Tasks & Hours (${totalTasks} tasks, ${totalHours}h)`,
    categoryBiaxialTasksColor: CHART_COLORS.DEFAULT[0],
    categoryBiaxialHoursColor: CHART_COLORS.DEFAULT[1],
    productBiaxialData: productData.biaxialData,
    productBiaxialTitle: `Individual Products Tasks & Hours (${totalTasks} tasks, ${totalHours}h)`,
    productBiaxialTasksColor: CHART_COLORS.DEFAULT[0],
    productBiaxialHoursColor: CHART_COLORS.DEFAULT[1],
    productCasinoMarketsPieData: productData.productCasinoMarketsPieData,
    productCasinoMarketsPieTitle: `Product Casino: Markets Distribution (${productData.productCasinoTotalTasks} tasks, ${Math.round(productData.productCasinoTotalHours * 100) / 100}h)`,
    productCasinoMarketsPieColors: productData.productCasinoMarketsPieData.map((item) => item.color),
    productCasinoMarketsBiaxialData: productData.productCasinoMarketsBiaxialData,
    productCasinoMarketsBiaxialTitle: `Product Casino: Markets Tasks & Hours (${productData.productCasinoTotalTasks} tasks, ${Math.round(productData.productCasinoTotalHours * 100) / 100}h)`,
    productCasinoMarketsBiaxialTasksColor: CHART_COLORS.DEFAULT[0],
    productCasinoMarketsBiaxialHoursColor: CHART_COLORS.DEFAULT[1],
    productSportMarketsPieData: productData.productSportMarketsPieData,
    productSportMarketsPieTitle: `Product Sport: Markets Distribution (${productData.productSportTotalTasks} tasks, ${Math.round(productData.productSportTotalHours * 100) / 100}h)`,
    productSportMarketsPieColors: productData.productSportMarketsPieData.map((item) => item.color),
    productSportMarketsBiaxialData: productData.productSportMarketsBiaxialData,
    productSportMarketsBiaxialTitle: `Product Sport: Markets Tasks & Hours (${productData.productSportTotalTasks} tasks, ${Math.round(productData.productSportTotalHours * 100) / 100}h)`,
    productSportMarketsBiaxialTasksColor: CHART_COLORS.DEFAULT[0],
    productSportMarketsBiaxialHoursColor: CHART_COLORS.DEFAULT[1],
    productUsersCharts: productUsersCharts,
    className: "",
    isLoading,
  };
};

// Simplified version without caching
export const getCachedProductAnalyticsCardProps = (
  tasks,
  month,
  users = [],
  isLoading = false
) => {
  return getProductAnalyticsCardProps(tasks, users, isLoading);
};

