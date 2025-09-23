import React, { useMemo } from "react";
import AnalyticsCard from "./AnalyticsCard";

const ReporterAnalyticsCard = ({ tasks, selectedMonth, reporters = [], isLoading = false }) => {
  // Tasks are already filtered by month from useMonthSelection, no need for additional filtering
  const filteredTasks = useMemo(() => {
    return tasks || [];
  }, [tasks]);

  // Show skeleton if loading or no tasks yet
  if (isLoading || !tasks || tasks.length === 0) {
    return (
      <AnalyticsCard
        title="Reporter Task Distribution"
        tableData={[]}
        tableColumns={[]}
        chartData={[]}
        chartTitle="Top Reporters by Task Count"
        colors={[]}
        isLoading={true}
      />
    );
  }

  // Calculate reporter analytics data
  const analyticsData = useMemo(() => {
    const reporterData = {};
    const productTotals = {};
    const marketTotals = {};
    const categoryTotals = {};

    // Initialize data structures
    const allProducts = new Set();
    const allMarkets = new Set();
    const allCategories = new Set();

    // First pass: collect all products, markets, and categories
    filteredTasks.forEach(task => {
      // Safely extract and ensure arrays
      const products = Array.isArray(task.data_task?.products) ? task.data_task.products : 
                     Array.isArray(task.products) ? task.products : 
                     typeof task.data_task?.products === 'string' ? [task.data_task.products] :
                     typeof task.products === 'string' ? [task.products] : [];
      
      const markets = Array.isArray(task.data_task?.markets) ? task.data_task.markets : 
                     Array.isArray(task.markets) ? task.markets : 
                     typeof task.data_task?.markets === 'string' ? [task.data_task.markets] :
                     typeof task.markets === 'string' ? [task.markets] : [];
      
      const reporterName = task.reporterName || task.data_task?.reporterName;
      const reporterId = task.reporters || task.data_task?.reporters;
      
      if (reporterName || reporterId) {
        const reporterKey = reporterId || reporterName;
        
        if (!reporterData[reporterKey]) {
          reporterData[reporterKey] = {
            name: reporterName || `Reporter ${reporterId}`,
            id: reporterId,
            totalTasks: 0,
            products: {},
            markets: {},
            categories: {}
          };
        }

        reporterData[reporterKey].totalTasks++;
        
        // Process products
        products.forEach(product => {
          if (product && typeof product === 'string') {
            allProducts.add(product);
            if (!reporterData[reporterKey].products[product]) {
              reporterData[reporterKey].products[product] = 0;
            }
            reporterData[reporterKey].products[product]++;
            productTotals[product] = (productTotals[product] || 0) + 1;
          }
        });

        // Process markets
        markets.forEach(market => {
          if (market && typeof market === 'string') {
            allMarkets.add(market);
            if (!reporterData[reporterKey].markets[market]) {
              reporterData[reporterKey].markets[market] = 0;
            }
            reporterData[reporterKey].markets[market]++;
            marketTotals[market] = (marketTotals[market] || 0) + 1;
          }
        });

        // Process categories (extract from products) - exclude marketing
        products.forEach(product => {
          if (product && typeof product === 'string') {
            let category = '';
            if (product.includes('acquisition')) category = 'Acquisition';
            else if (product.includes('product')) category = 'Product';
            // Removed marketing category
            
            if (category) {
              allCategories.add(category);
              if (!reporterData[reporterKey].categories[category]) {
                reporterData[reporterKey].categories[category] = 0;
              }
              reporterData[reporterKey].categories[category]++;
              categoryTotals[category] = (categoryTotals[category] || 0) + 1;
            }
          }
        });
      }
    });

    // Create table data
    const tableData = Object.values(reporterData).map(reporter => {
      const row = {
        reporter: reporter.name,
        total: reporter.totalTasks
      };

      // Add product columns
      allProducts.forEach(product => {
        row[product] = reporter.products[product] || 0;
      });

      // Add market columns
      allMarkets.forEach(market => {
        row[market] = reporter.markets[market] || 0;
      });

      // Add category columns
      allCategories.forEach(category => {
        row[category] = reporter.categories[category] || 0;
      });

      return row;
    });

    // Sort by total tasks (descending)
    tableData.sort((a, b) => b.total - a.total);

    // Add grand total row
    const grandTotalRow = {
      reporter: "Grand Total",
      total: Object.values(reporterData).reduce((sum, reporter) => sum + reporter.totalTasks, 0),
      bold: true,
      highlight: true
    };

    // Add totals for each product
    allProducts.forEach(product => {
      grandTotalRow[product] = productTotals[product] || 0;
    });

    // Add totals for each market
    allMarkets.forEach(market => {
      grandTotalRow[market] = marketTotals[market] || 0;
    });

    // Add totals for each category
    allCategories.forEach(category => {
      grandTotalRow[category] = categoryTotals[category] || 0;
    });

    tableData.push(grandTotalRow);

    return {
      tableData,
      productTotals,
      marketTotals,
      categoryTotals,
      allProducts: Array.from(allProducts).sort(),
      allMarkets: Array.from(allMarkets).sort(),
      allCategories: Array.from(allCategories).sort()
    };
  }, [filteredTasks, reporters]);

  // Create table columns
  const tableColumns = [
    { key: "reporter", header: "Reporter", align: "left" },
    { key: "total", header: "Total Tasks", align: "center", highlight: true },
    ...analyticsData.allProducts.map(product => ({
      key: product,
      header: product.charAt(0).toUpperCase() + product.slice(1),
      align: "center"
    })),
    ...analyticsData.allMarkets.map(market => ({
      key: market,
      header: market.toUpperCase(),
      align: "center"
    })),
    ...analyticsData.allCategories.map(category => ({
      key: category,
      header: category,
      align: "center"
    }))
  ];

  // Create chart data for reporter distribution
  const chartData = Object.values(analyticsData.tableData)
    .filter(row => !row.bold) // Exclude grand total row
    .slice(0, 10) // Show top 10 reporters
    .map(row => ({
      name: row.reporter.length > 15 ? row.reporter.substring(0, 15) + '...' : row.reporter,
      value: row.total
    }));

  // Generate colors for reporters
  const reporterColors = [
    "#3b82f6", // blue
    "#10b981", // emerald
    "#f59e0b", // amber
    "#ef4444", // red
    "#8b5cf6", // violet
    "#06b6d4", // cyan
    "#84cc16", // lime
    "#f97316", // orange
    "#ec4899", // pink
    "#6b7280"  // gray
  ];

  const colors = chartData.map((_, index) => reporterColors[index % reporterColors.length]);

  return (
    <AnalyticsCard
      title="Reporter Task Distribution"
      tableData={analyticsData.tableData}
      tableColumns={tableColumns}
      chartData={chartData}
      chartTitle="Top Reporters by Task Count"
      colors={colors}
      isLoading={isLoading}
    />
  );
};

export default ReporterAnalyticsCard;
