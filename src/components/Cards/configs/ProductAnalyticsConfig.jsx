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
  calculateUsersChartsByCategory,
  normalizeMarket,
} from "./analyticsSharedConfig";

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

  // Track markets for each product category
  const productMarketData = {
    "product casino": {},
    "product sport": {},
    "product poker": {},
    "product lotto": {},
  };
  const marketTotals = {};
  const allMarkets = new Set();

  // Count tasks by product - only include "product" category tasks
  tasks.forEach((task) => {
    const products = task.data_task?.products || task.products;
    const markets = task.data_task?.markets || task.markets || [];

    if (!products) {
      return; // Skip tasks without products
    }

    const productsLower = products.toLowerCase().trim();

    // Only count tasks that start with "product" (product casino, product sport, etc.)
    if (productsLower.startsWith("product ")) {
      if (productCounts.hasOwnProperty(productsLower)) {
        productCounts[productsLower]++;
      }

      // Track markets for this product category
      if (Array.isArray(markets) && markets.length > 0) {
        markets.forEach((market) => {
          if (market) {
            const normalizedMarket = normalizeMarket(market);
            allMarkets.add(normalizedMarket);

            // Initialize market data structure
            if (!productMarketData[productsLower]) {
              productMarketData[productsLower] = {};
            }
            if (!productMarketData[productsLower][normalizedMarket]) {
              productMarketData[productsLower][normalizedMarket] = 0;
            }
            if (!marketTotals[normalizedMarket]) {
              marketTotals[normalizedMarket] = 0;
            }

            // Count market occurrences for this product category
            productMarketData[productsLower][normalizedMarket]++;
            marketTotals[normalizedMarket]++;
          }
        });
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
  let tableData = [];
  const sortedMarkets = Array.from(allMarkets).sort();

  // Prepare all category items for percentage calculation to ensure they sum to 100%
  const categoryItems = Object.entries(categoryTotals)
    .filter(([_, count]) => count > 0)
    .map(([key, count]) => ({ key, count }));

  // Calculate percentages for all categories at once to ensure they sum to exactly 100%
  const categoryPercentages = calculatePercentagesForGroup(
    categoryItems,
    totalTasks
  );

  // Helper function to add a product category row with markets
  const addProductCategoryRow = (productKey, categoryName) => {
    if (categoryTotals[productKey] > 0) {
      const row = {
        category: categoryName,
        total: categoryTotals[productKey],
        totalHours: tasks
          .filter((task) => {
            const products = task.data_task?.products || task.products;
            return products && products.toLowerCase().trim() === productKey;
          })
          .reduce(
            (sum, task) =>
              sum + (task.data_task?.timeInHours || task.timeInHours || 0),
            0
          ),
      };

      // Calculate total market count for this product category (sum of all markets)
      // This ensures percentages sum to 100% since tasks can have multiple markets
      let productMarketTotal = 0;
      const marketItems = [];
      sortedMarkets.forEach((market) => {
        const marketCount = productMarketData[productKey]?.[market] || 0;
        productMarketTotal += marketCount;
        marketItems.push({ key: market, count: marketCount });
      });

      // Add market columns with percentages that sum to 100%
      sortedMarkets.forEach((market) => {
        const marketCount = productMarketData[productKey]?.[market] || 0;
        row[market] = calculateCountWithPercentage(
          marketCount,
          productMarketTotal,
          marketItems,
          market
        );
      });

      tableData.push(row);
    }
  };

  // Add categories that have actual data
  addProductCategoryRow("product casino", "Product Casino");
  addProductCategoryRow("product sport", "Product Sport");
  addProductCategoryRow("product poker", "Product Poker");
  addProductCategoryRow("product lotto", "Product Lotto");

  // Add Grand Total row only if there are any product tasks
  if (totalTasks > 0 && tableData.length > 0) {
    tableData = addGrandTotalRow(tableData, {
      labelKey: "category",
      labelValue: "Grand Total",
      sumColumns: ["total", "totalHours"],
      marketColumns: sortedMarkets,
    });
  }

  // Create table columns
  const tableColumns = [
    {
      key: "category",
      header: "Product Category",
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
        <span className="text-gray-700 dark:text-gray-300">{value}h</span>
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

  // Create first pie chart data (categories with tasks - including misc)
  const categoryPieData = addConsistentColors(
    Object.entries(categoryTotals)
      .filter(([category, count]) => count > 0)
      .map(([category, count]) => {
        // Calculate hours for this category
        const categoryHours = tasks
          .filter((task) => {
            const products = task.data_task?.products || task.products;
            return products && products.toLowerCase().trim() === category;
          })
          .reduce(
            (sum, task) =>
              sum + (task.data_task?.timeInHours || task.timeInHours || 0),
            0
          );

        return {
          name: category.charAt(0).toUpperCase() + category.slice(1),
          value: count,
          hours: Math.round(categoryHours * 100) / 100,
          percentage:
            totalTasks > 0
              ? Math.min(Math.round((count / totalTasks) * 100), 100)
              : 0,
        };
      })
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

  // Create second pie chart data (individual products with tasks - including misc)
  const productPieData = addConsistentColors(
    Object.entries(productCounts)
      .filter(([product, count]) => count > 0)
      .map(([product, count]) => {
        // Calculate hours for this product
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
          value: count,
          hours: Math.round(productHours * 100) / 100,
        };
      })
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
        productMarketStats[productsLower][normalizedMarket].hours +=
          timeInHours;
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
            hours: Math.round(stats.hours * 100) / 100,
          }))
          .filter((item) => item.value > 0)
          .sort((a, b) => {
            // Sort by tasks (value) first (descending), then by hours (descending)
            if (b.value !== a.value) {
              return b.value - a.value;
            }
            return b.hours - a.hours;
          })
          .map(({ hours, ...rest }) => rest), // Remove hours from final data
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
            hours: Math.round(stats.hours * 100) / 100,
          }))
          .filter((item) => item.value > 0)
          .sort((a, b) => {
            // Sort by tasks (value) first (descending), then by hours (descending)
            if (b.value !== a.value) {
              return b.value - a.value;
            }
            return b.hours - a.hours;
          })
          .map(({ hours, ...rest }) => rest), // Remove hours from final data
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

  // Create biaxial chart data: Casino vs Sport per market
  // Get all markets from both product casino and product sport
  const allProductMarkets = new Set();
  if (productMarketStats["product casino"]) {
    Object.keys(productMarketStats["product casino"]).forEach((market) =>
      allProductMarkets.add(market)
    );
  }
  if (productMarketStats["product sport"]) {
    Object.keys(productMarketStats["product sport"]).forEach((market) =>
      allProductMarkets.add(market)
    );
  }
  const sortedProductMarkets = Array.from(allProductMarkets).sort();

  const casinoSportPerMarketBiaxialData = sortedProductMarkets
    .map((market) => {
      const normalizedMarket = normalizeMarket(market);
      const casinoStats = productMarketStats["product casino"]?.[market] || {
        tasks: 0,
      };
      const sportStats = productMarketStats["product sport"]?.[market] || {
        tasks: 0,
      };
      const marketColor = getMarketColor(normalizedMarket);

      return {
        name: normalizedMarket,
        casino: casinoStats.tasks || 0,
        sport: sportStats.tasks || 0,
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
  const totalCasinoFromMarkets = casinoSportPerMarketBiaxialData.reduce(
    (sum, item) => sum + (item.casino || 0),
    0
  );
  const totalSportFromMarkets = casinoSportPerMarketBiaxialData.reduce(
    (sum, item) => sum + (item.sport || 0),
    0
  );

  const totalCasinoSportBiaxialData = [
    {
      name: "Total",
      casino: totalCasinoFromMarkets,
      sport: totalSportFromMarkets,
    },
  ];

  // Use shared calculateUsersChartsByCategory function
  // Wrapper to maintain API compatibility (product doesn't use categoryName)
  const calculateUsersChartsByProduct = (productTasks, users) => {
    return calculateUsersChartsByCategory(productTasks, users, null);
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
    casinoSportPerMarketBiaxialData,
    totalCasinoSportBiaxialData,
    calculateUsersChartsByProduct,
    filteredTasks,
    totalTasks,
    totalHours,
  };
};

export const getProductAnalyticsCardProps = (
  tasks,
  users = [],
  isLoading = false
) => {
  const productData = calculateProductAnalyticsData(tasks);

  // Calculate per-user charts showing their markets breakdown for product tasks
  const productUsersCharts = productData.calculateUsersChartsByProduct(
    productData.filteredTasks,
    users
  );

  // Use totals directly from calculated data
  const totalTasks = productData.totalTasks || 0;
  const totalHours = Math.round((productData.totalHours || 0) * 100) / 100;

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
    productCasinoMarketsPieColors: productData.productCasinoMarketsPieData.map(
      (item) => item.color
    ),
    productCasinoMarketsBiaxialData:
      productData.productCasinoMarketsBiaxialData,
    productCasinoMarketsBiaxialTitle: `Product Casino: Markets Tasks & Hours (${productData.productCasinoTotalTasks} tasks, ${Math.round(productData.productCasinoTotalHours * 100) / 100}h)`,
    productCasinoMarketsBiaxialTasksColor: CHART_COLORS.DEFAULT[0],
    productCasinoMarketsBiaxialHoursColor: CHART_COLORS.DEFAULT[1],
    productSportMarketsPieData: productData.productSportMarketsPieData,
    productSportMarketsPieTitle: `Product Sport: Markets Distribution (${productData.productSportTotalTasks} tasks, ${Math.round(productData.productSportTotalHours * 100) / 100}h)`,
    productSportMarketsPieColors: productData.productSportMarketsPieData.map(
      (item) => item.color
    ),
    productSportMarketsBiaxialData: productData.productSportMarketsBiaxialData,
    productSportMarketsBiaxialTitle: `Product Sport: Markets Tasks & Hours (${productData.productSportTotalTasks} tasks, ${Math.round(productData.productSportTotalHours * 100) / 100}h)`,
    productSportMarketsBiaxialTasksColor: CHART_COLORS.DEFAULT[0],
    productSportMarketsBiaxialHoursColor: CHART_COLORS.DEFAULT[1],
    casinoSportPerMarketBiaxialData:
      productData.casinoSportPerMarketBiaxialData,
    totalCasinoSportBiaxialData: productData.totalCasinoSportBiaxialData,
    productUsersCharts: productUsersCharts,
    totalTasks,
    totalHours,
    className: "",
    isLoading,
  };
};

// Simplified version without caching
export const getCachedProductAnalyticsCardProps = (
  tasks,
  users = [],
  isLoading = false
) => {
  return getProductAnalyticsCardProps(tasks, users, isLoading);
};
