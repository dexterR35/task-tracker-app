import React from "react";
import {
  addConsistentColors,
  CHART_COLORS,
  CHART_DATA_TYPE,
  normalizeMarket,
  getMarketColor,
  getUserName,
} from "./analyticsSharedConfig";
import { CARD_SYSTEM } from "@/constants";

// Helper function to check if a product string is acquisition
const isAcquisitionProduct = (products) => {
  if (typeof products !== "string") return false;
  const productsLower = products.toLowerCase().trim();
  return (
    productsLower.startsWith("acquisition ") ||
    productsLower === "acquisition" ||
    (productsLower.includes("acquisition") &&
      !productsLower.startsWith("product ") &&
      !productsLower.startsWith("marketing ") &&
      !productsLower.startsWith("misc "))
  );
};


export const calculateMonthToMonthComparison = (
  month1Tasks = [],
  month2Tasks = [],
  month1Name = "Month 1",
  month2Name = "Month 2",
  users = [],
  month3Tasks = null,
  month3Name = null
) => {
  // Helper to check product category
  const getProductCategory = (products) => {
    if (!products || typeof products !== "string") return null;
    const productsLower = products.toLowerCase().trim();
    if (productsLower.startsWith("marketing ") || productsLower.startsWith("marketing")) return "marketing";
    if (productsLower.startsWith("product ") || productsLower.startsWith("product")) return "product";
    if (isAcquisitionProduct(products)) return "acquisition";
    if (productsLower.startsWith("misc ") || productsLower === "misc") return "misc";
    return null;
  };

  // Helper to get product subcategory (casino, sport, etc.)
  const getProductSubcategory = (products) => {
    if (!products || typeof products !== "string") return null;
    const productsLower = products.toLowerCase().trim();
    if (productsLower.includes("casino")) return "casino";
    if (productsLower.includes("sport")) return "sport";
    if (productsLower.includes("poker")) return "poker";
    if (productsLower.includes("lotto")) return "lotto";
    return "other";
  };

  // Helper to calculate metrics for a set of tasks
  const calculateMetrics = (tasks, users = []) => {
    const metrics = {
      totalTasks: tasks.length,
      totalHours: tasks.reduce(
        (sum, task) =>
          sum + (task.data_task?.timeInHours || task.timeInHours || 0),
        0
      ),
      // Category breakdown (marketing, product, acquisition, misc)
      categories: {
        marketing: { tasks: 0, hours: 0, markets: {}, marketHours: {} },
        product: { tasks: 0, hours: 0 },
        acquisition: { tasks: 0, hours: 0, markets: {}, marketHours: {} },
        misc: { tasks: 0, hours: 0 },
      },
      // Product subcategory breakdown (casino, sport, etc.)
      products: {
        casino: { tasks: 0, hours: 0 },
        sport: { tasks: 0, hours: 0 },
        poker: { tasks: 0, hours: 0 },
        lotto: { tasks: 0, hours: 0 },
        other: { tasks: 0, hours: 0 },
      },
      // Markets breakdown
      markets: {},
      marketHours: {},
      // Users breakdown
      users: {},
      userHours: {},
      // Casino and Sport metrics (for backward compatibility)
      casino: {
        tasks: 0,
        hours: 0,
        markets: {},
        marketHours: {},
      },
      sport: {
        tasks: 0,
        hours: 0,
        markets: {},
        marketHours: {},
      },
      // Market acquisition for casino and sport
      casinoAcquisition: {
        tasks: 0,
        hours: 0,
        markets: {},
        marketHours: {},
      },
      sportAcquisition: {
        tasks: 0,
        hours: 0,
        markets: {},
        marketHours: {},
      },
    };

    tasks.forEach((task) => {
      const products = task.data_task?.products || task.products;
      const markets = task.data_task?.markets || task.markets || [];
      const taskHours = task.data_task?.timeInHours || task.timeInHours || 0;
      const userUID = task.userUID || task.createbyUID || task.data_task?.userUID || task.data_task?.createbyUID;

      // Count all tasks regardless of products/markets
      const productsLower = products ? products.toLowerCase().trim() : "";
      const category = getProductCategory(products);
      const subcategory = getProductSubcategory(products);

      // Count by category
      if (category && metrics.categories[category]) {
        metrics.categories[category].tasks += 1;
        metrics.categories[category].hours += taskHours;
        
        // Track marketing and acquisition tasks by market
        if ((category === 'marketing' || category === 'acquisition') && Array.isArray(markets) && markets.length > 0) {
          markets.forEach((market) => {
            if (market) {
              const normalizedMarket = normalizeMarket(market);
              if (!metrics.categories[category].markets[normalizedMarket]) {
                metrics.categories[category].markets[normalizedMarket] = 0;
                metrics.categories[category].marketHours[normalizedMarket] = 0;
              }
              metrics.categories[category].markets[normalizedMarket] += 1;
              metrics.categories[category].marketHours[normalizedMarket] += taskHours;
            }
          });
        }
      }

      // Count by product subcategory
      if (subcategory && metrics.products[subcategory]) {
        metrics.products[subcategory].tasks += 1;
        metrics.products[subcategory].hours += taskHours;
      }

      // Count by markets
      if (Array.isArray(markets) && markets.length > 0) {
        markets.forEach((market) => {
          if (market) {
            const normalizedMarket = normalizeMarket(market);
            metrics.markets[normalizedMarket] = (metrics.markets[normalizedMarket] || 0) + 1;
            metrics.marketHours[normalizedMarket] = (metrics.marketHours[normalizedMarket] || 0) + taskHours;
          }
        });
      }

      // Count by users
      if (userUID) {
        const userName = getUserName(userUID, users);
        metrics.users[userName] = (metrics.users[userName] || 0) + 1;
        metrics.userHours[userName] = (metrics.userHours[userName] || 0) + taskHours;
      }

      // Legacy casino/sport tracking (only if products exist)
      if (products && productsLower.includes("casino")) {
        metrics.casino.tasks += 1;
        metrics.casino.hours += taskHours;
        if (Array.isArray(markets) && markets.length > 0) {
          markets.forEach((market) => {
            if (market) {
              const normalizedMarket = normalizeMarket(market);
              metrics.casino.markets[normalizedMarket] = (metrics.casino.markets[normalizedMarket] || 0) + 1;
              metrics.casino.marketHours[normalizedMarket] = (metrics.casino.marketHours[normalizedMarket] || 0) + taskHours;
            }
          });
        }
      }

      if (products && productsLower.includes("sport")) {
        metrics.sport.tasks += 1;
        metrics.sport.hours += taskHours;
        if (Array.isArray(markets) && markets.length > 0) {
          markets.forEach((market) => {
            if (market) {
              const normalizedMarket = normalizeMarket(market);
              metrics.sport.markets[normalizedMarket] = (metrics.sport.markets[normalizedMarket] || 0) + 1;
              metrics.sport.marketHours[normalizedMarket] = (metrics.sport.marketHours[normalizedMarket] || 0) + taskHours;
            }
          });
        }
      }

      // Check for acquisition - casino
      if (products && isAcquisitionProduct(products) && productsLower.includes("casino")) {
        metrics.casinoAcquisition.tasks += 1;
        metrics.casinoAcquisition.hours += taskHours;
        if (Array.isArray(markets) && markets.length > 0) {
          markets.forEach((market) => {
            if (market) {
              const normalizedMarket = normalizeMarket(market);
              metrics.casinoAcquisition.markets[normalizedMarket] = (metrics.casinoAcquisition.markets[normalizedMarket] || 0) + 1;
              metrics.casinoAcquisition.marketHours[normalizedMarket] = (metrics.casinoAcquisition.marketHours[normalizedMarket] || 0) + taskHours;
            }
          });
        }
      }

      // Check for acquisition - sport
      if (products && isAcquisitionProduct(products) && productsLower.includes("sport")) {
        metrics.sportAcquisition.tasks += 1;
        metrics.sportAcquisition.hours += taskHours;
        if (Array.isArray(markets) && markets.length > 0) {
          markets.forEach((market) => {
            if (market) {
              const normalizedMarket = normalizeMarket(market);
              metrics.sportAcquisition.markets[normalizedMarket] = (metrics.sportAcquisition.markets[normalizedMarket] || 0) + 1;
              metrics.sportAcquisition.marketHours[normalizedMarket] = (metrics.sportAcquisition.marketHours[normalizedMarket] || 0) + taskHours;
            }
          });
        }
      }
    });

    return metrics;
  };

  // Calculate metrics for all months
  const month1Metrics = calculateMetrics(month1Tasks, users);
  const month2Metrics = calculateMetrics(month2Tasks, users);
  const month3Metrics = month3Tasks ? calculateMetrics(month3Tasks, users) : null;

  // Get all unique markets from all sources (all are normalized now)
  const allMarkets = new Set();
  const marketSources = [
    ...Object.keys(month1Metrics.markets),
    ...Object.keys(month2Metrics.markets),
    ...Object.keys(month1Metrics.casino.markets),
    ...Object.keys(month1Metrics.sport.markets),
    ...Object.keys(month1Metrics.casinoAcquisition.markets),
    ...Object.keys(month1Metrics.sportAcquisition.markets),
    ...Object.keys(month2Metrics.casino.markets),
    ...Object.keys(month2Metrics.sport.markets),
    ...Object.keys(month2Metrics.casinoAcquisition.markets),
    ...Object.keys(month2Metrics.sportAcquisition.markets),
  ];
  if (month3Metrics) {
    marketSources.push(
      ...Object.keys(month3Metrics.markets),
      ...Object.keys(month3Metrics.casino.markets),
      ...Object.keys(month3Metrics.sport.markets),
      ...Object.keys(month3Metrics.casinoAcquisition.markets),
      ...Object.keys(month3Metrics.sportAcquisition.markets)
    );
  }
  marketSources.forEach((market) => allMarkets.add(market));

  const sortedMarkets = Array.from(allMarkets).sort();

  // Get all unique users
  const allUsers = new Set();
  const userSources = [
    ...Object.keys(month1Metrics.users),
    ...Object.keys(month2Metrics.users),
  ];
  if (month3Metrics) {
    userSources.push(...Object.keys(month3Metrics.users));
  }
  userSources.forEach((user) => allUsers.add(user));

  const sortedUsers = Array.from(allUsers).sort();

  // Calculate percentage change
  const calculateChange = (month1, month2) => {
    if (month1 === 0 && month2 === 0) return 0;
    if (month1 === 0 && month2 > 0) return 100;
    if (month1 === 0 && month2 < 0) return -100;
    const change = ((month2 - month1) / month1) * 100;
    // Round to 1 decimal place
    return Math.round(change * 10) / 10;
  };

  // Helper to create table row with optional month3
  const createTableRow = (metric, getValue) => {
    const row = {
      metric,
      month1: getValue(month1Metrics),
      month2: getValue(month2Metrics),
      change: calculateChange(getValue(month1Metrics), getValue(month2Metrics)),
    };
    if (month3Metrics && month3Name) {
      row.month3 = getValue(month3Metrics);
    }
    return row;
  };

  // Create comparison table data
  const comparisonTableData = [
    createTableRow("Total Tasks", (m) => m.totalTasks),
    createTableRow("Total Hours", (m) => Math.round(m.totalHours * 100) / 100),
    createTableRow("Casino Tasks", (m) => m.casino.tasks),
    createTableRow("Casino Hours", (m) => Math.round(m.casino.hours * 100) / 100),
    createTableRow("Sport Tasks", (m) => m.sport.tasks),
    createTableRow("Sport Hours", (m) => Math.round(m.sport.hours * 100) / 100),
    createTableRow("Casino Acquisition Tasks", (m) => m.casinoAcquisition.tasks),
    createTableRow("Casino Acquisition Hours", (m) => Math.round(m.casinoAcquisition.hours * 100) / 100),
    createTableRow("Sport Acquisition Tasks", (m) => m.sportAcquisition.tasks),
    createTableRow("Sport Acquisition Hours", (m) => Math.round(m.sportAcquisition.hours * 100) / 100),
    createTableRow("Marketing Tasks", (m) => m.categories.marketing.tasks),
    createTableRow("Product Tasks", (m) => m.categories.product.tasks),
    createTableRow("Acquisition Tasks", (m) => m.categories.acquisition.tasks),
    createTableRow("Misc Tasks", (m) => m.categories.misc.tasks),
  ];

  // Helper to add month3 data to chart items
  const addMonth3ToChartItem = (item, getMonth3Value) => {
    if (month3Metrics && month3Name) {
      item[month3Name] = getMonth3Value(month3Metrics);
    }
    return item;
  };

  // Create chart data for casino comparison
  const casinoChartData = sortedMarkets
    .map((market) => {
      // Market is already normalized
      const item = {
        name: market,
        [month1Name]: month1Metrics.casino.markets[market] || 0,
        [month2Name]: month2Metrics.casino.markets[market] || 0,
        color: getMarketColor(market),
      };
      return addMonth3ToChartItem(item, (m) => m.casino.markets[market] || 0);
    })
    .filter(
      (item) => item[month1Name] > 0 || item[month2Name] > 0 || (month3Metrics && item[month3Name] > 0)
    );

  // Create chart data for sport comparison
  const sportChartData = sortedMarkets
    .map((market) => {
      // Market is already normalized
      const item = {
        name: market,
        [month1Name]: month1Metrics.sport.markets[market] || 0,
        [month2Name]: month2Metrics.sport.markets[market] || 0,
        color: getMarketColor(market),
      };
      return addMonth3ToChartItem(item, (m) => m.sport.markets[market] || 0);
    })
    .filter(
      (item) => item[month1Name] > 0 || item[month2Name] > 0 || (month3Metrics && item[month3Name] > 0)
    );

  // Create chart data for casino acquisition comparison
  const casinoAcquisitionChartData = sortedMarkets
    .map((market) => {
      // Market is already normalized
      const item = {
        name: market,
        [month1Name]: month1Metrics.casinoAcquisition.markets[market] || 0,
        [month2Name]: month2Metrics.casinoAcquisition.markets[market] || 0,
        color: getMarketColor(market),
      };
      return addMonth3ToChartItem(item, (m) => m.casinoAcquisition.markets[market] || 0);
    })
    .filter(
      (item) => item[month1Name] > 0 || item[month2Name] > 0 || (month3Metrics && item[month3Name] > 0)
    );

  // Create chart data for sport acquisition comparison
  const sportAcquisitionChartData = sortedMarkets
    .map((market) => {
      // Market is already normalized
      const item = {
        name: market,
        [month1Name]: month1Metrics.sportAcquisition.markets[market] || 0,
        [month2Name]: month2Metrics.sportAcquisition.markets[market] || 0,
        color: getMarketColor(market),
      };
      return addMonth3ToChartItem(item, (m) => m.sportAcquisition.markets[market] || 0);
    })
    .filter(
      (item) => item[month1Name] > 0 || item[month2Name] > 0 || (month3Metrics && item[month3Name] > 0)
    );

  // Create chart data - Categories
  const categoriesChartData = [
    {
      name: "Marketing",
      [month1Name]: month1Metrics.categories.marketing.tasks || 0,
      [month2Name]: month2Metrics.categories.marketing.tasks || 0,
      color: CARD_SYSTEM.COLOR_HEX_MAP.pink,
    },
    {
      name: "Product",
      [month1Name]: month1Metrics.categories.product.tasks || 0,
      [month2Name]: month2Metrics.categories.product.tasks || 0,
      color: CARD_SYSTEM.COLOR_HEX_MAP.orange,
    },
    {
      name: "Acquisition",
      [month1Name]: month1Metrics.categories.acquisition.tasks || 0,
      [month2Name]: month2Metrics.categories.acquisition.tasks || 0,
      color: CARD_SYSTEM.COLOR_HEX_MAP.amber,
    },
    {
      name: "Misc",
      [month1Name]: month1Metrics.categories.misc.tasks || 0,
      [month2Name]: month2Metrics.categories.misc.tasks || 0,
      color: CARD_SYSTEM.COLOR_HEX_MAP.soft_purple,
    },
  ].map(item => {
    if (month3Metrics && month3Name) {
      const categoryKey = item.name.toLowerCase();
      item[month3Name] = month3Metrics.categories[categoryKey]?.tasks || 0;
    }
    return item;
  }).filter(item => item[month1Name] > 0 || item[month2Name] > 0 || (month3Metrics && item[month3Name] > 0));

  // Create chart data - Products (Casino, Sport, etc.)
  const productsChartData = [
    {
      name: "Casino",
      [month1Name]: month1Metrics.products.casino.tasks || 0,
      [month2Name]: month2Metrics.products.casino.tasks || 0,
      color: CARD_SYSTEM.COLOR_HEX_MAP.crimson,
    },
    {
      name: "Sport",
      [month1Name]: month1Metrics.products.sport.tasks || 0,
      [month2Name]: month2Metrics.products.sport.tasks || 0,
      color: CARD_SYSTEM.COLOR_HEX_MAP.green,
    },
    {
      name: "Poker",
      [month1Name]: month1Metrics.products.poker.tasks || 0,
      [month2Name]: month2Metrics.products.poker.tasks || 0,
      color: CARD_SYSTEM.COLOR_HEX_MAP.purple,
    },
    {
      name: "Lotto",
      [month1Name]: month1Metrics.products.lotto.tasks || 0,
      [month2Name]: month2Metrics.products.lotto.tasks || 0,
      color: CARD_SYSTEM.COLOR_HEX_MAP.blue,
    },
    {
      name: "Other",
      [month1Name]: month1Metrics.products.other.tasks || 0,
      [month2Name]: month2Metrics.products.other.tasks || 0,
      color: CARD_SYSTEM.COLOR_HEX_MAP.gray,
    },
  ].map(item => {
    if (month3Metrics && month3Name) {
      const productKey = item.name.toLowerCase();
      item[month3Name] = month3Metrics.products[productKey]?.tasks || 0;
    }
    return item;
  }).filter(item => item[month1Name] > 0 || item[month2Name] > 0 || (month3Metrics && item[month3Name] > 0));

  // Create chart data - All Markets
  const allMarketsChartData = sortedMarkets
    .map((market) => {
      // Market is already normalized
      const item = {
        name: market,
        [month1Name]: month1Metrics.markets[market] || 0,
        [month2Name]: month2Metrics.markets[market] || 0,
        color: getMarketColor(market),
      };
      return addMonth3ToChartItem(item, (m) => m.markets[market] || 0);
    })
    .filter(
      (item) => item[month1Name] > 0 || item[month2Name] > 0 || (month3Metrics && item[month3Name] > 0)
    )
    .sort((a, b) => {
      const aTotal = a[month1Name] + a[month2Name] + (month3Metrics ? (a[month3Name] || 0) : 0);
      const bTotal = b[month1Name] + b[month2Name] + (month3Metrics ? (b[month3Name] || 0) : 0);
      return bTotal - aTotal;
    })
    .slice(0, 15); // Top 15 markets

  // Create chart data - Users
  const usersChartData = sortedUsers
    .map((user) => {
      const item = {
        name: user,
        [month1Name]: month1Metrics.users[user] || 0,
        [month2Name]: month2Metrics.users[user] || 0,
        color: CARD_SYSTEM.COLOR_HEX_MAP.blue,
      };
      return addMonth3ToChartItem(item, (m) => m.users[user] || 0);
    })
    .filter(
      (item) => item[month1Name] > 0 || item[month2Name] > 0 || (month3Metrics && item[month3Name] > 0)
    )
    .sort((a, b) => {
      const aTotal = a[month1Name] + a[month2Name] + (month3Metrics ? (a[month3Name] || 0) : 0);
      const bTotal = b[month1Name] + b[month2Name] + (month3Metrics ? (b[month3Name] || 0) : 0);
      return bTotal - aTotal;
    })
    .slice(0, 15); // Top 15 users

  // Get all markets for marketing and acquisition
  const marketingMarkets = new Set();
  const acquisitionMarkets = new Set();
  
  // Collect markets from all months
  [month1Metrics, month2Metrics, month3Metrics].forEach((metrics) => {
    if (metrics) {
      Object.keys(metrics.categories?.marketing?.markets || {}).forEach(market => marketingMarkets.add(market));
      Object.keys(metrics.categories?.acquisition?.markets || {}).forEach(market => acquisitionMarkets.add(market));
    }
  });
  
  const sortedMarketingMarkets = Array.from(marketingMarkets).sort();
  const sortedAcquisitionMarkets = Array.from(acquisitionMarkets).sort();

  // Create Marketing pie chart data for each month
  const marketingPieChartDataMonth1 = sortedMarketingMarkets
    .map((market) => ({
      name: market,
      value: month1Metrics.categories?.marketing?.markets[market] || 0,
      color: getMarketColor(market),
    }))
    .filter((item) => item.value > 0);

  const marketingPieChartDataMonth2 = sortedMarketingMarkets
    .map((market) => ({
      name: market,
      value: month2Metrics.categories?.marketing?.markets[market] || 0,
      color: getMarketColor(market),
    }))
    .filter((item) => item.value > 0);

  const marketingPieChartDataMonth3 = month3Metrics && month3Name
    ? sortedMarketingMarkets
        .map((market) => ({
          name: market,
          value: month3Metrics.categories?.marketing?.markets[market] || 0,
          color: getMarketColor(market),
        }))
        .filter((item) => item.value > 0)
    : null;

  // Create Marketing bar chart data (month-to-month comparison)
  const marketingBarChartData = sortedMarketingMarkets
    .map((market) => {
      const item = {
        name: market,
        [month1Name]: month1Metrics.categories?.marketing?.markets[market] || 0,
        [month2Name]: month2Metrics.categories?.marketing?.markets[market] || 0,
        color: getMarketColor(market),
      };
      return addMonth3ToChartItem(item, (m) => m.categories?.marketing?.markets[market] || 0);
    })
    .filter(
      (item) => item[month1Name] > 0 || item[month2Name] > 0 || (month3Metrics && item[month3Name] > 0)
    )
    .sort((a, b) => {
      const aTotal = a[month1Name] + a[month2Name] + (month3Metrics ? (a[month3Name] || 0) : 0);
      const bTotal = b[month1Name] + b[month2Name] + (month3Metrics ? (b[month3Name] || 0) : 0);
      return bTotal - aTotal;
    });

  // Create Acquisition pie chart data for each month
  const acquisitionPieChartDataMonth1 = sortedAcquisitionMarkets
    .map((market) => ({
      name: market,
      value: month1Metrics.categories?.acquisition?.markets[market] || 0,
      color: getMarketColor(market),
    }))
    .filter((item) => item.value > 0);

  const acquisitionPieChartDataMonth2 = sortedAcquisitionMarkets
    .map((market) => ({
      name: market,
      value: month2Metrics.categories?.acquisition?.markets[market] || 0,
      color: getMarketColor(market),
    }))
    .filter((item) => item.value > 0);

  const acquisitionPieChartDataMonth3 = month3Metrics && month3Name
    ? sortedAcquisitionMarkets
        .map((market) => ({
          name: market,
          value: month3Metrics.categories?.acquisition?.markets[market] || 0,
          color: getMarketColor(market),
        }))
        .filter((item) => item.value > 0)
    : null;

  // Create Acquisition bar chart data (month-to-month comparison)
  const acquisitionBarChartData = sortedAcquisitionMarkets
    .map((market) => {
      const item = {
        name: market,
        [month1Name]: month1Metrics.categories?.acquisition?.markets[market] || 0,
        [month2Name]: month2Metrics.categories?.acquisition?.markets[market] || 0,
        color: getMarketColor(market),
      };
      return addMonth3ToChartItem(item, (m) => m.categories?.acquisition?.markets[market] || 0);
    })
    .filter(
      (item) => item[month1Name] > 0 || item[month2Name] > 0 || (month3Metrics && item[month3Name] > 0)
    )
    .sort((a, b) => {
      const aTotal = a[month1Name] + a[month2Name] + (month3Metrics ? (a[month3Name] || 0) : 0);
      const bTotal = b[month1Name] + b[month2Name] + (month3Metrics ? (b[month3Name] || 0) : 0);
      return bTotal - aTotal;
    });

  // Create Marketing line chart data with both tasks and hours (month-to-month comparison)
  const marketingLineChartData = sortedMarketingMarkets
    .map((market) => {
      const item = {
        name: market,
        [`${month1Name} Tasks`]: month1Metrics.categories?.marketing?.markets[market] || 0,
        [`${month2Name} Tasks`]: month2Metrics.categories?.marketing?.markets[market] || 0,
        [`${month1Name} Hours`]: Math.round((month1Metrics.categories?.marketing?.marketHours[market] || 0) * 10) / 10,
        [`${month2Name} Hours`]: Math.round((month2Metrics.categories?.marketing?.marketHours[market] || 0) * 10) / 10,
        color: getMarketColor(market),
      };
      if (month3Metrics && month3Name) {
        item[`${month3Name} Tasks`] = month3Metrics.categories?.marketing?.markets[market] || 0;
        item[`${month3Name} Hours`] = Math.round((month3Metrics.categories?.marketing?.marketHours[market] || 0) * 10) / 10;
      }
      return item;
    })
    .filter(
      (item) => {
        const hasTasks = item[`${month1Name} Tasks`] > 0 || item[`${month2Name} Tasks`] > 0 || (month3Metrics && item[`${month3Name} Tasks`] > 0);
        const hasHours = item[`${month1Name} Hours`] > 0 || item[`${month2Name} Hours`] > 0 || (month3Metrics && item[`${month3Name} Hours`] > 0);
        return hasTasks || hasHours;
      }
    )
    .sort((a, b) => {
      const aTotal = (a[`${month1Name} Tasks`] || 0) + (a[`${month2Name} Tasks`] || 0) + (month3Metrics ? (a[`${month3Name} Tasks`] || 0) : 0);
      const bTotal = (b[`${month1Name} Tasks`] || 0) + (b[`${month2Name} Tasks`] || 0) + (month3Metrics ? (b[`${month3Name} Tasks`] || 0) : 0);
      return bTotal - aTotal;
    });

  // Create Acquisition line chart data with both tasks and hours (month-to-month comparison)
  const acquisitionLineChartData = sortedAcquisitionMarkets
    .map((market) => {
      const item = {
        name: market,
        [`${month1Name} Tasks`]: month1Metrics.categories?.acquisition?.markets[market] || 0,
        [`${month2Name} Tasks`]: month2Metrics.categories?.acquisition?.markets[market] || 0,
        [`${month1Name} Hours`]: Math.round((month1Metrics.categories?.acquisition?.marketHours[market] || 0) * 10) / 10,
        [`${month2Name} Hours`]: Math.round((month2Metrics.categories?.acquisition?.marketHours[market] || 0) * 10) / 10,
        color: getMarketColor(market),
      };
      if (month3Metrics && month3Name) {
        item[`${month3Name} Tasks`] = month3Metrics.categories?.acquisition?.markets[market] || 0;
        item[`${month3Name} Hours`] = Math.round((month3Metrics.categories?.acquisition?.marketHours[market] || 0) * 10) / 10;
      }
      return item;
    })
    .filter(
      (item) => {
        const hasTasks = item[`${month1Name} Tasks`] > 0 || item[`${month2Name} Tasks`] > 0 || (month3Metrics && item[`${month3Name} Tasks`] > 0);
        const hasHours = item[`${month1Name} Hours`] > 0 || item[`${month2Name} Hours`] > 0 || (month3Metrics && item[`${month3Name} Hours`] > 0);
        return hasTasks || hasHours;
      }
    )
    .sort((a, b) => {
      const aTotal = (a[`${month1Name} Tasks`] || 0) + (a[`${month2Name} Tasks`] || 0) + (month3Metrics ? (a[`${month3Name} Tasks`] || 0) : 0);
      const bTotal = (b[`${month1Name} Tasks`] || 0) + (b[`${month2Name} Tasks`] || 0) + (month3Metrics ? (b[`${month3Name} Tasks`] || 0) : 0);
      return bTotal - aTotal;
    });

  // Build table columns
  const comparisonTableColumns = [
    { key: "metric", header: "Metric", align: "left" },
    {
      key: "month1",
      header: month1Name,
      align: "center",
    },
    {
      key: "month2",
      header: month2Name,
      align: "center",
    },
  ];
  
  if (month3Metrics && month3Name) {
    comparisonTableColumns.push({
      key: "month3",
      header: month3Name,
      align: "center",
    });
  }
  
  comparisonTableColumns.push({
    key: "change",
    header: "Change %",
    align: "center",
    render: (value) => {
      const change = parseFloat(value);
      const color = change > 0 ? "text-green-600" : change < 0 ? "text-red-600" : "text-gray-600";
      const sign = change > 0 ? "+" : "";
      return (
        <span className={color}>
          {sign}{change.toFixed(1)}%
        </span>
      );
    },
  });

  return {
    // Summary metrics
    month1Metrics,
    month2Metrics,
    month3Metrics,
    month1Name,
    month2Name,
    month3Name,
    // Comparison table
    comparisonTableData,
    comparisonTableColumns,
    // Charts
    casinoChartData,
    sportChartData,
    casinoAcquisitionChartData,
    sportAcquisitionChartData,
    // Charts
    categoriesChartData,
    productsChartData,
    allMarketsChartData,
    usersChartData,
    // Marketing charts
    marketingPieChartDataMonth1,
    marketingPieChartDataMonth2,
    marketingPieChartDataMonth3,
    marketingBarChartData,
    marketingLineChartData,
    // Acquisition charts
    acquisitionPieChartDataMonth1,
    acquisitionPieChartDataMonth2,
    acquisitionPieChartDataMonth3,
    acquisitionBarChartData,
    acquisitionLineChartData,
  };
};

/**
 * Get cached month-to-month comparison props
 */
let cachedComparisonProps = null;
let cachedComparisonKey = null;

export const getCachedMonthToMonthComparisonProps = (
  month1Tasks,
  month2Tasks,
  month1Name,
  month2Name,
  users = [],
  month3Tasks = null,
  month3Name = null
) => {
  const cacheKey = `${month1Name}_${month2Name}_${month3Name || ''}_${month1Tasks?.length || 0}_${month2Tasks?.length || 0}_${month3Tasks?.length || 0}_${users?.length || 0}`;
  
  if (cachedComparisonProps && cachedComparisonKey === cacheKey) {
    return cachedComparisonProps;
  }

  const props = calculateMonthToMonthComparison(
    month1Tasks,
    month2Tasks,
    month1Name,
    month2Name,
    users,
    month3Tasks,
    month3Name
  );

  cachedComparisonProps = {
    ...props,
    hasNoData:
      (!month1Tasks || month1Tasks.length === 0) &&
      (!month2Tasks || month2Tasks.length === 0),
  };
  cachedComparisonKey = cacheKey;

  return cachedComparisonProps;
};

