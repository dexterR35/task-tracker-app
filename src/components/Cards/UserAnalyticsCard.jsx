import React, { useMemo } from "react";
import AnalyticsCard from "./AnalyticsCard";

const UserAnalyticsCard = ({ tasks, selectedMonth, users = [], isLoading = false }) => {
  // Tasks are already filtered by month from useMonthSelection, no need for additional filtering
  const filteredTasks = useMemo(() => {
    return tasks || [];
  }, [tasks]);

  // Show skeleton if loading or no tasks yet
  if (isLoading || !tasks || tasks.length === 0) {
    return (
      <AnalyticsCard
        title="User Task Distribution"
        tableData={[]}
        tableColumns={[]}
        chartData={[]}
        chartTitle="Top Users by Task Count"
        colors={[]}
        isLoading={true}
      />
    );
  }

  // Calculate user analytics data
  const analyticsData = useMemo(() => {
    const userData = {};
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
      
      const userId = task.userUID || task.createbyUID;
      
      if (userId) {
        if (!userData[userId]) {
          // Find user name from users array
          const user = users.find(u => (u.id || u.uid || u.userUID) === userId);
          const userName = user?.name || user?.email || `User ${userId.slice(0, 8)}`;
          
          userData[userId] = {
            name: userName,
            id: userId,
            totalTasks: 0,
            products: {},
            markets: {},
            categories: {}
          };
        }

        userData[userId].totalTasks++;
        
        // Process products
        products.forEach(product => {
          if (product && typeof product === 'string') {
            allProducts.add(product);
            if (!userData[userId].products[product]) {
              userData[userId].products[product] = 0;
            }
            userData[userId].products[product]++;
            productTotals[product] = (productTotals[product] || 0) + 1;
          }
        });

        // Process markets
        markets.forEach(market => {
          if (market && typeof market === 'string') {
            allMarkets.add(market);
            if (!userData[userId].markets[market]) {
              userData[userId].markets[market] = 0;
            }
            userData[userId].markets[market]++;
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
              if (!userData[userId].categories[category]) {
                userData[userId].categories[category] = 0;
              }
              userData[userId].categories[category]++;
              categoryTotals[category] = (categoryTotals[category] || 0) + 1;
            }
          }
        });
      }
    });

    // Create table data
    const tableData = Object.values(userData).map(user => {
      const row = {
        user: user.name,
        total: user.totalTasks
      };

      // Add product columns
      allProducts.forEach(product => {
        row[product] = user.products[product] || 0;
      });

      // Add market columns
      allMarkets.forEach(market => {
        row[market] = user.markets[market] || 0;
      });

      // Add category columns
      allCategories.forEach(category => {
        row[category] = user.categories[category] || 0;
      });

      return row;
    });

    // Sort by total tasks (descending)
    tableData.sort((a, b) => b.total - a.total);

    // Add grand total row
    const grandTotalRow = {
      user: "Grand Total",
      total: Object.values(userData).reduce((sum, user) => sum + user.totalTasks, 0),
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
  }, [filteredTasks, users]);

  // Create table columns
  const tableColumns = [
    { key: "user", header: "User", align: "left" },
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

  // Create chart data for user distribution
  const chartData = Object.values(analyticsData.tableData)
    .filter(row => !row.bold) // Exclude grand total row
    .slice(0, 10) // Show top 10 users
    .map(row => ({
      name: row.user.length > 15 ? row.user.substring(0, 15) + '...' : row.user,
      value: row.total
    }));

  // Generate colors for users
  const userColors = [
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

  const colors = chartData.map((_, index) => userColors[index % userColors.length]);

  return (
    <AnalyticsCard
      title="User Task Distribution"
      tableData={analyticsData.tableData}
      tableColumns={tableColumns}
      chartData={chartData}
      chartTitle="Top Users by Task Count"
      colors={colors}
      isLoading={isLoading}
    />
  );
};

export default UserAnalyticsCard;
