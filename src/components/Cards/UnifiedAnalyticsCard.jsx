import React, { useMemo } from "react";
import AnalyticsCard from "@/components/Cards/AnalyticsCard";
import { Icons } from "@/components/icons";
import { 
  calculateAnalyticsData, 
  generateProductTableData, 
  generateProductChartData 
} from "@/utils/analyticsHelpers";
import { ANALYTICS_CARD_TYPES, getAnalyticsCardConfig } from "./analyticsCardConfig";

/**
 * Unified Analytics Card Component
 * Consolidates all analytics card types into a single flexible component
 */
const UnifiedAnalyticsCard = ({ 
  cardType, // Use predefined card types
  title,
  subtitle,
  icon,
  color = "blue",
  tasks,
  selectedMonth,
  users = [],
  reporters = [],
  isLoading = false,
  // Analytics-specific props
  tableData,
  tableColumns,
  chartData,
  chartTitle,
  chartType = "pie",
  multiBar = false
}) => {
  // Get configuration for predefined card types
  const config = cardType ? getAnalyticsCardConfig(cardType) : {};
  
  // Merge props with config
  const finalProps = {
    title: title || config.title || "Analytics",
    subtitle: subtitle || config.subtitle || "",
    icon: icon || config.icon || Icons.generic.chart,
    color: color || config.color || "blue",
    chartType: chartType || config.chartType || "pie",
    multiBar: multiBar || config.multiBar || false
  };

  // Helper functions for different analytics calculations
  const calculateMarketUserBreakdown = (filteredTasks, users) => {
    const userMarketData = {};
    const marketTotals = {};
    const userTotals = {};
    const allMarkets = new Set();
    const allUsers = new Set();

    // First pass: collect all markets and users
    filteredTasks.forEach(task => {
      const markets = task.data_task?.markets || task.markets || [];
      const userId = task.userUID || task.createbyUID;
      
      if (userId && markets.length > 0) {
        allUsers.add(userId);
        markets.forEach(market => {
          if (market) {
            allMarkets.add(market);
          }
        });
      }
    });

    // Initialize data structures
    allUsers.forEach(userId => {
      userMarketData[userId] = {};
      userTotals[userId] = 0;
      allMarkets.forEach(market => {
        userMarketData[userId][market] = 0;
      });
    });

    allMarkets.forEach(market => {
      marketTotals[market] = 0;
    });

    // Second pass: count tasks
    filteredTasks.forEach(task => {
      const markets = task.data_task?.markets || task.markets || [];
      const userId = task.userUID || task.createbyUID;
      
      if (userId && markets.length > 0) {
        userTotals[userId]++;
        markets.forEach(market => {
          if (market) {
            userMarketData[userId][market]++;
            marketTotals[market]++;
          }
        });
      }
    });

    // Get user names
    const getUserName = (userId) => {
      const user = users.find(u => (u.id || u.uid || u.userUID) === userId);
      return user?.name || user?.email || `User ${userId.slice(0, 8)}`;
    };

    // Calculate user hours
    const userHours = {};
    filteredTasks.forEach(task => {
      const userId = task.userUID || task.createbyUID;
      if (userId) {
        const taskHours = task.data_task?.timeInHours || task.timeInHours || 0;
        userHours[userId] = (userHours[userId] || 0) + taskHours;
      }
    });

    // Create table data
    const tableData = Array.from(allUsers).map(userId => {
      const userName = getUserName(userId);
      const userTotal = userTotals[userId];
      const userTotalHours = userHours[userId] || 0;
      const row = { 
        user: userName, 
        total: userTotal,
        totalHours: `${userTotalHours}h`,
        efficiency: userTotal > 0 ? (userTotalHours / userTotal).toFixed(1) : '0.0'
      };
      
      allMarkets.forEach(market => {
        const marketCount = userMarketData[userId][market] || 0;
        const percentage = userTotal > 0 ? ((marketCount / userTotal) * 100).toFixed(1) : '0.0';
        row[market] = `${marketCount} (${percentage}%)`;
      });
      
      return row;
    });

    tableData.sort((a, b) => b.total - a.total);

    // Add grand total row
    const totalHours = Object.values(userHours).reduce((sum, hours) => sum + hours, 0);
    const grandTotalRow = { 
      user: "Grand Total", 
      total: Object.values(userTotals).reduce((sum, total) => sum + total, 0),
      totalHours: `${totalHours}h`,
      efficiency: Object.values(userTotals).reduce((sum, total) => sum + total, 0) > 0 ? 
        (totalHours / Object.values(userTotals).reduce((sum, total) => sum + total, 0)).toFixed(1) : '0.0',
      bold: true, 
      highlight: true 
    };
    allMarkets.forEach(market => {
      const marketTotal = marketTotals[market];
      const totalTasks = grandTotalRow.total;
      const percentage = totalTasks > 0 ? ((marketTotal / totalTasks) * 100).toFixed(1) : '0.0';
      grandTotalRow[market] = `${marketTotal} (${percentage}%)`;
    });
    tableData.push(grandTotalRow);

    const tableColumns = [
      { key: "user", header: "User", align: "left" },
      { key: "total", header: "Total Tasks", align: "center", highlight: true },
      { key: "totalHours", header: "Total Hours", align: "center", highlight: true },
      { key: "efficiency", header: "Avg Hours/Task", align: "center" },
      ...Array.from(allMarkets).sort().map(market => ({
        key: market,
        header: market.toUpperCase(),
        align: "center"
      }))
    ];

    const chartData = Array.from(allMarkets).sort().map(market => ({
      name: market.toUpperCase(),
      value: marketTotals[market] || 0
    }));

    const colors = [
      "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4",
      "#84cc16", "#f97316", "#ec4899", "#6b7280", "#14b8a6", "#a855f7"
    ];

    return {
      tableData,
      tableColumns,
      chartData,
      colors: chartData.map((_, index) => colors[index % colors.length])
    };
  };

  const calculateUserAnalytics = (filteredTasks, users) => {
    const userData = {};
    const productTotals = {};
    const marketTotals = {};
    const categoryTotals = {};
    const allProducts = new Set();
    const allMarkets = new Set();
    const allCategories = new Set();

    // Process tasks
    filteredTasks.forEach(task => {
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
          const user = users.find(u => (u.id || u.uid || u.userUID) === userId);
          const userName = user?.name || user?.email || `User ${userId.slice(0, 8)}`;
          
        userData[userId] = {
          name: userName,
          id: userId,
          totalTasks: 0,
          totalHours: 0,
          products: {},
          markets: {},
          categories: {}
        };
        }

        userData[userId].totalTasks++;
        userData[userId].totalHours += task.data_task?.timeInHours || task.timeInHours || 0;
        
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

        products.forEach(product => {
          if (product && typeof product === 'string') {
            let category = '';
            if (product.includes('product')) category = 'Product';
            
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
        total: user.totalTasks,
        totalHours: `${user.totalHours}h`,
        efficiency: user.totalTasks > 0 ? (user.totalHours / user.totalTasks).toFixed(1) : '0.0'
      };

      allProducts.forEach(product => {
        row[product] = user.products[product] || 0;
      });

      allMarkets.forEach(market => {
        row[market] = user.markets[market] || 0;
      });

      allCategories.forEach(category => {
        row[category] = user.categories[category] || 0;
      });

      return row;
    });

    tableData.sort((a, b) => b.total - a.total);

    // Add grand total row
    const grandTotalRow = {
      user: "Grand Total",
      total: Object.values(userData).reduce((sum, user) => sum + user.totalTasks, 0),
      totalHours: `${Object.values(userData).reduce((sum, user) => sum + user.totalHours, 0)}h`,
      efficiency: Object.values(userData).reduce((sum, user) => sum + user.totalTasks, 0) > 0 ? 
        (Object.values(userData).reduce((sum, user) => sum + user.totalHours, 0) / Object.values(userData).reduce((sum, user) => sum + user.totalTasks, 0)).toFixed(1) : '0.0',
      bold: true,
      highlight: true
    };

    allProducts.forEach(product => {
      grandTotalRow[product] = productTotals[product] || 0;
    });

    allMarkets.forEach(market => {
      grandTotalRow[market] = marketTotals[market] || 0;
    });

    allCategories.forEach(category => {
      grandTotalRow[category] = categoryTotals[category] || 0;
    });

    tableData.push(grandTotalRow);

    const tableColumns = [
      { key: "user", header: "User", align: "left" },
      { key: "total", header: "Total Tasks", align: "center", highlight: true },
      { key: "totalHours", header: "Total Hours", align: "center", highlight: true },
      { key: "efficiency", header: "Avg Hours/Task", align: "center" },
      ...Array.from(allProducts).sort().map(product => ({
        key: product,
        header: product.charAt(0).toUpperCase() + product.slice(1),
        align: "center"
      })),
      ...Array.from(allMarkets).sort().map(market => ({
        key: market,
        header: market.toUpperCase(),
        align: "center"
      })),
      ...Array.from(allCategories).sort().map(category => ({
        key: category,
        header: category,
        align: "center"
      }))
    ];

    const chartData = Object.values(tableData)
      .filter(row => !row.bold)
      .slice(0, 10)
      .map(row => ({
        name: row.user.length > 15 ? row.user.substring(0, 15) + '...' : row.user,
        value: row.total
      }));

    const userColors = [
      "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4",
      "#84cc16", "#f97316", "#ec4899", "#6b7280"
    ];

    return {
      tableData,
      tableColumns,
      chartData,
      colors: chartData.map((_, index) => userColors[index % userColors.length])
    };
  };

  const calculateReporterAnalytics = (filteredTasks, reporters) => {
    const reporterData = {};
    const reporterTotals = {};
    const allReporters = new Set();

    // First pass: collect all reporters
    filteredTasks.forEach(task => {
      const reporterId = task.reporterUID || task.reporterId;
      if (reporterId) {
        allReporters.add(reporterId);
      }
    });

    // Initialize reporter data
    allReporters.forEach(reporterId => {
      const reporter = reporters.find(r => (r.id || r.uid || r.reporterUID) === reporterId);
      const reporterName = reporter?.name || reporter?.reporterName || `Reporter ${reporterId.slice(0, 8)}`;
      
      reporterData[reporterId] = {
        name: reporterName,
        id: reporterId,
        totalTasks: 0,
        totalHours: 0,
        markets: {},
        departments: {}
      };
      reporterTotals[reporterId] = { tasks: 0, hours: 0 };
    });

    // Second pass: count tasks and hours
    filteredTasks.forEach(task => {
      const reporterId = task.reporterUID || task.reporterId;
      if (reporterId && reporterData[reporterId]) {
        const taskHours = task.data_task?.timeInHours || task.timeInHours || 0;
        const markets = Array.isArray(task.data_task?.markets) ? task.data_task.markets : 
                       Array.isArray(task.markets) ? task.markets : 
                       typeof task.data_task?.markets === 'string' ? [task.data_task.markets] :
                       typeof task.markets === 'string' ? [task.markets] : [];
        
        const department = task.data_task?.department || task.department || 'Unknown';

        reporterData[reporterId].totalTasks++;
        reporterData[reporterId].totalHours += taskHours;
        reporterTotals[reporterId].tasks++;
        reporterTotals[reporterId].hours += taskHours;

        // Count by markets
        markets.forEach(market => {
          if (market && typeof market === 'string') {
            if (!reporterData[reporterId].markets[market]) {
              reporterData[reporterId].markets[market] = { tasks: 0, hours: 0 };
            }
            reporterData[reporterId].markets[market].tasks++;
            reporterData[reporterId].markets[market].hours += taskHours;
          }
        });

        // Count by departments
        if (department) {
          if (!reporterData[reporterId].departments[department]) {
            reporterData[reporterId].departments[department] = { tasks: 0, hours: 0 };
          }
          reporterData[reporterId].departments[department].tasks++;
          reporterData[reporterId].departments[department].hours += taskHours;
        }
      }
    });

    // Create table data
    const tableData = Object.values(reporterData).map(reporter => ({
      reporter: reporter.name,
      totalTasks: reporter.totalTasks,
      totalHours: `${reporter.totalHours}h`,
      efficiency: reporter.totalTasks > 0 ? (reporter.totalHours / reporter.totalTasks).toFixed(1) : '0.0'
    }));

    tableData.sort((a, b) => b.totalTasks - a.totalTasks);

    // Add grand total row
    const grandTotal = Object.values(reporterTotals).reduce((sum, total) => ({
      tasks: sum.tasks + total.tasks,
      hours: sum.hours + total.hours
    }), { tasks: 0, hours: 0 });

    tableData.push({
      reporter: "Grand Total",
      totalTasks: grandTotal.tasks,
      totalHours: `${grandTotal.hours}h`,
      efficiency: grandTotal.tasks > 0 ? (grandTotal.hours / grandTotal.tasks).toFixed(1) : '0.0',
      bold: true,
      highlight: true
    });

    const tableColumns = [
      { key: "reporter", header: "Reporter", align: "left" },
      { key: "totalTasks", header: "Total Tasks", align: "center", highlight: true },
      { key: "totalHours", header: "Total Hours", align: "center", highlight: true },
      { key: "efficiency", header: "Avg Hours/Task", align: "center" }
    ];

    const chartData = Object.values(tableData)
      .filter(row => !row.bold)
      .slice(0, 10)
      .map(row => ({
        name: row.reporter.length > 15 ? row.reporter.substring(0, 15) + '...' : row.reporter,
        value: row.totalTasks
      }));

    const colors = [
      "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4",
      "#84cc16", "#f97316", "#ec4899", "#6b7280"
    ];

    return {
      tableData,
      tableColumns,
      chartData,
      colors: chartData.map((_, index) => colors[index % colors.length])
    };
  };

  const calculateMarketingAnalytics = (filteredTasks) => {
    const acquisitionData = {};
    const departmentData = {};
    const marketData = {};
    const allAcquisitions = new Set();
    const allDepartments = new Set();
    const allMarkets = new Set();

    // Process tasks
    filteredTasks.forEach(task => {
      const taskHours = task.data_task?.timeInHours || task.timeInHours || 0;
      
      // Extract acquisition data
      const products = Array.isArray(task.data_task?.products) ? task.data_task.products : 
                     Array.isArray(task.products) ? task.products : 
                     typeof task.data_task?.products === 'string' ? [task.data_task.products] :
                     typeof task.products === 'string' ? [task.products] : [];
      
      // Extract department data
      const department = task.data_task?.department || task.department || 'Unknown';
      
      // Extract market data
      const markets = Array.isArray(task.data_task?.markets) ? task.data_task.markets : 
                     Array.isArray(task.markets) ? task.markets : 
                     typeof task.data_task?.markets === 'string' ? [task.data_task.markets] :
                     typeof task.markets === 'string' ? [task.markets] : [];

      // Process acquisitions (filter for acquisition-related products)
      products.forEach(product => {
        if (product && typeof product === 'string' && product.toLowerCase().includes('acquisition')) {
          allAcquisitions.add(product);
          if (!acquisitionData[product]) {
            acquisitionData[product] = { tasks: 0, hours: 0 };
          }
          acquisitionData[product].tasks++;
          acquisitionData[product].hours += taskHours;
        }
      });

      // Process departments
      allDepartments.add(department);
      if (!departmentData[department]) {
        departmentData[department] = { tasks: 0, hours: 0 };
      }
      departmentData[department].tasks++;
      departmentData[department].hours += taskHours;

      // Process markets
      markets.forEach(market => {
        if (market && typeof market === 'string') {
          allMarkets.add(market);
          if (!marketData[market]) {
            marketData[market] = { tasks: 0, hours: 0 };
          }
          marketData[market].tasks++;
          marketData[market].hours += taskHours;
        }
      });
    });

    // Create acquisition table data
    const acquisitionTableData = Array.from(allAcquisitions).map(acquisition => ({
      acquisition: acquisition,
      totalTasks: acquisitionData[acquisition].tasks,
      totalHours: `${acquisitionData[acquisition].hours}h`,
      efficiency: acquisitionData[acquisition].tasks > 0 ? 
        (acquisitionData[acquisition].hours / acquisitionData[acquisition].tasks).toFixed(1) : '0.0'
    }));

    // Create department table data
    const departmentTableData = Array.from(allDepartments).map(dept => ({
      department: dept,
      totalTasks: departmentData[dept].tasks,
      totalHours: `${departmentData[dept].hours}h`,
      efficiency: departmentData[dept].tasks > 0 ? 
        (departmentData[dept].hours / departmentData[dept].tasks).toFixed(1) : '0.0'
    }));

    // Create market table data
    const marketTableData = Array.from(allMarkets).map(market => ({
      market: market,
      totalTasks: marketData[market].tasks,
      totalHours: `${marketData[market].hours}h`,
      efficiency: marketData[market].tasks > 0 ? 
        (marketData[market].hours / marketData[market].tasks).toFixed(1) : '0.0'
    }));

    // Sort all data by total tasks
    acquisitionTableData.sort((a, b) => b.totalTasks - a.totalTasks);
    departmentTableData.sort((a, b) => b.totalTasks - a.totalTasks);
    marketTableData.sort((a, b) => b.totalTasks - a.totalTasks);

    // Add grand totals
    const acquisitionTotal = Object.values(acquisitionData).reduce((sum, data) => ({
      tasks: sum.tasks + data.tasks,
      hours: sum.hours + data.hours
    }), { tasks: 0, hours: 0 });

    const departmentTotal = Object.values(departmentData).reduce((sum, data) => ({
      tasks: sum.tasks + data.tasks,
      hours: sum.hours + data.hours
    }), { tasks: 0, hours: 0 });

    const marketTotal = Object.values(marketData).reduce((sum, data) => ({
      tasks: sum.tasks + data.tasks,
      hours: sum.hours + data.hours
    }), { tasks: 0, hours: 0 });

    // Add grand total rows
    acquisitionTableData.push({
      acquisition: "Grand Total",
      totalTasks: acquisitionTotal.tasks,
      totalHours: `${acquisitionTotal.hours}h`,
      efficiency: acquisitionTotal.tasks > 0 ? (acquisitionTotal.hours / acquisitionTotal.tasks).toFixed(1) : '0.0',
      bold: true,
      highlight: true
    });

    departmentTableData.push({
      department: "Grand Total",
      totalTasks: departmentTotal.tasks,
      totalHours: `${departmentTotal.hours}h`,
      efficiency: departmentTotal.tasks > 0 ? (departmentTotal.hours / departmentTotal.tasks).toFixed(1) : '0.0',
      bold: true,
      highlight: true
    });

    marketTableData.push({
      market: "Grand Total",
      totalTasks: marketTotal.tasks,
      totalHours: `${marketTotal.hours}h`,
      efficiency: marketTotal.tasks > 0 ? (marketTotal.hours / marketTotal.tasks).toFixed(1) : '0.0',
      bold: true,
      highlight: true
    });

    // Create combined table data (prioritize departments as main view)
    const combinedTableData = departmentTableData;

    const tableColumns = [
      { key: "department", header: "Department", align: "left" },
      { key: "totalTasks", header: "Total Tasks", align: "center", highlight: true },
      { key: "totalHours", header: "Total Hours", align: "center", highlight: true },
      { key: "efficiency", header: "Avg Hours/Task", align: "center" }
    ];

    // Create chart data for departments
    const chartData = departmentTableData
      .filter(row => !row.bold)
      .slice(0, 10)
      .map(row => ({
        name: row.department.length > 15 ? row.department.substring(0, 15) + '...' : row.department,
        value: row.totalTasks
      }));

    const colors = [
      "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4",
      "#84cc16", "#f97316", "#ec4899", "#6b7280"
    ];

    return {
      tableData: combinedTableData,
      tableColumns,
      chartData,
      colors: chartData.map((_, index) => colors[index % colors.length]),
      // Additional data for potential future use
      acquisitionData: acquisitionTableData,
      marketData: marketTableData
    };
  };


  // Calculate specific analytics data based on card type
  const calculatedAnalyticsData = useMemo(() => {
    if (!tasks || tasks.length === 0) {
      return { tableData: [], tableColumns: [], chartData: [], colors: [] };
    }

    const filteredTasks = tasks || [];

    switch (cardType) {
      case ANALYTICS_CARD_TYPES.MARKET_USER_BREAKDOWN:
        return calculateMarketUserBreakdown(filteredTasks, users);
      
      case ANALYTICS_CARD_TYPES.USER_ANALYTICS:
        return calculateUserAnalytics(filteredTasks, users);
      
      case ANALYTICS_CARD_TYPES.REPORTER_ANALYTICS:
        return calculateReporterAnalytics(filteredTasks, reporters);
      
      case ANALYTICS_CARD_TYPES.MARKETING_ANALYTICS:
        return calculateMarketingAnalytics(filteredTasks);
      
      default:
        return { tableData: [], tableColumns: [], chartData: [], colors: [] };
    }
  }, [tasks, users, reporters, cardType]);

  // Show skeleton if loading
  if (isLoading || !tasks || tasks.length === 0) {
    return (
      <AnalyticsCard
        title={finalProps.title}
        tableData={[]}
        tableColumns={[]}
        chartData={[]}
        chartTitle={chartTitle}
        colors={[]}
        isLoading={true}
      />
    );
  }

  // Default analytics card
  return (
    <AnalyticsCard
      title={finalProps.title}
      tableData={tableData || calculatedAnalyticsData.tableData}
      tableColumns={tableColumns || calculatedAnalyticsData.tableColumns}
      chartData={chartData || calculatedAnalyticsData.chartData}
      chartTitle={chartTitle || finalProps.title}
      colors={calculatedAnalyticsData.colors}
      chartType={finalProps.chartType}
      multiBar={finalProps.multiBar}
      isLoading={isLoading}
    />
  );
};

export default UnifiedAnalyticsCard;
