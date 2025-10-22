/**
 * Shared analytics helper functions to reduce code duplication
 */

/**
 * Calculate market badges from tasks
 * @param {Array} tasks - Array of task objects
 * @returns {Array} Array of market badge objects
 */
export const calculateMarketBadges = (tasks) => {
  const marketCounts = {};

  tasks.forEach(task => {
    const markets = task.data_task?.markets || task.markets;
    if (markets && Array.isArray(markets)) {
      markets.forEach(market => {
        if (market) {
          marketCounts[market] = (marketCounts[market] || 0) + 1;
        }
      });
    }
  });

  return Object.entries(marketCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 6)
    .map(([market, count]) => ({ market, count }));
};

/**
 * Calculate analytics data for product/category breakdown
 * @param {Array} tasks - Array of task objects
 * @returns {Object} Analytics data object
 */
export const calculateAnalyticsData = (tasks) => {
  const data = {
    acquisition: { casino: 0, sport: 0, poker: 0, lotto: 0, total: 0 },
    product: { casino: 0, sport: 0, poker: 0, lotto: 0, total: 0 },
    marketing: { casino: 0, sport: 0, poker: 0, lotto: 0, total: 0 },
    grandTotal: 0
  };

  tasks.forEach(task => {
    const product = task.data_task?.products || task.products;
    if (!product) return;

    // Count tasks by category and product
    if (product.includes('acquisition')) {
      if (product.includes('casino')) data.acquisition.casino++;
      if (product.includes('sport')) data.acquisition.sport++;
      if (product.includes('poker')) data.acquisition.poker++;
      if (product.includes('lotto')) data.acquisition.lotto++;
      data.acquisition.total++;
    } else if (product.includes('product')) {
      if (product.includes('casino')) data.product.casino++;
      if (product.includes('sport')) data.product.sport++;
      if (product.includes('poker')) data.product.poker++;
      if (product.includes('lotto')) data.product.lotto++;
      data.product.total++;
    } else if (product.includes('marketing')) {
      if (product.includes('casino')) data.marketing.casino++;
      if (product.includes('sport')) data.marketing.sport++;
      if (product.includes('poker')) data.marketing.poker++;
      if (product.includes('lotto')) data.marketing.lotto++;
      data.marketing.total++;
    }

    data.grandTotal++;
  });

  return data;
};

/**
 * Generate product breakdown table data
 * @param {Object} analyticsData - Analytics data object
 * @returns {Array} Table data array
 */
export const generateProductTableData = (analyticsData) => [
  {
    product: "Casino",
    acquisition: analyticsData.acquisition.casino,
    product_dev: analyticsData.product.casino,
    marketing: analyticsData.marketing.casino,
    total: analyticsData.acquisition.casino + analyticsData.product.casino + analyticsData.marketing.casino
  },
  {
    product: "Sport",
    acquisition: analyticsData.acquisition.sport,
    product_dev: analyticsData.product.sport,
    marketing: analyticsData.marketing.sport,
    total: analyticsData.acquisition.sport + analyticsData.product.sport + analyticsData.marketing.sport
  },
  {
    product: "Poker",
    acquisition: analyticsData.acquisition.poker,
    product_dev: analyticsData.product.poker,
    marketing: analyticsData.marketing.poker,
    total: analyticsData.acquisition.poker + analyticsData.product.poker + analyticsData.marketing.poker
  },
  {
    product: "Lotto",
    acquisition: analyticsData.acquisition.lotto,
    product_dev: analyticsData.product.lotto,
    marketing: analyticsData.marketing.lotto,
    total: analyticsData.acquisition.lotto + analyticsData.product.lotto + analyticsData.marketing.lotto
  },
  {
    product: "Grand Total",
    acquisition: analyticsData.acquisition.total,
    product_dev: analyticsData.product.total,
    marketing: analyticsData.marketing.total,
    total: analyticsData.grandTotal,
    bold: true,
    highlight: true
  }
];

/**
 * Generate category breakdown table data
 * @param {Object} analyticsData - Analytics data object
 * @returns {Array} Table data array
 */
export const generateCategoryTableData = (analyticsData) => [
  {
    category: "Acquisition",
    casino: analyticsData.acquisition.casino,
    sport: analyticsData.acquisition.sport,
    poker: analyticsData.acquisition.poker,
    lotto: analyticsData.acquisition.lotto,
    total: analyticsData.acquisition.total
  },
  {
    category: "Product",
    casino: analyticsData.product.casino,
    sport: analyticsData.product.sport,
    poker: analyticsData.product.poker,
    lotto: analyticsData.product.lotto,
    total: analyticsData.product.total
  },
  {
    category: "Marketing",
    casino: analyticsData.marketing.casino,
    sport: analyticsData.marketing.sport,
    poker: analyticsData.marketing.poker,
    lotto: analyticsData.marketing.lotto,
    total: analyticsData.marketing.total
  },
  {
    category: "Grand Total",
    casino: analyticsData.acquisition.casino + analyticsData.product.casino + analyticsData.marketing.casino,
    sport: analyticsData.acquisition.sport + analyticsData.product.sport + analyticsData.marketing.sport,
    poker: analyticsData.acquisition.poker + analyticsData.product.poker + analyticsData.marketing.poker,
    lotto: analyticsData.acquisition.lotto + analyticsData.product.lotto + analyticsData.marketing.lotto,
    total: analyticsData.grandTotal,
    bold: true,
    highlight: true
  }
];

/**
 * Generate product chart data
 * @param {Object} analyticsData - Analytics data object
 * @returns {Array} Chart data array
 */
export const generateProductChartData = (analyticsData) => [
  { name: "Casino", value: analyticsData.acquisition.casino + analyticsData.product.casino + analyticsData.marketing.casino },
  { name: "Sport", value: analyticsData.acquisition.sport + analyticsData.product.sport + analyticsData.marketing.sport },
  { name: "Poker", value: analyticsData.acquisition.poker + analyticsData.product.poker + analyticsData.marketing.poker },
  { name: "Lotto", value: analyticsData.acquisition.lotto + analyticsData.product.lotto + analyticsData.marketing.lotto }
];

/**
 * Generate category chart data
 * @param {Object} analyticsData - Analytics data object
 * @returns {Array} Chart data array
 */
export const generateCategoryChartData = (analyticsData) => [
  { name: "Acquisition", value: analyticsData.acquisition.total },
  { name: "Product", value: analyticsData.product.total },
  { name: "Marketing", value: analyticsData.marketing.total }
];
