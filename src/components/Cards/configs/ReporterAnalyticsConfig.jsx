import React from "react";
import Badge from "@/components/ui/Badge/Badge";
import { addConsistentColors, CHART_COLORS, CHART_DATA_TYPE, getMarketColor } from "./analyticsSharedConfig";

/**
 * Reporter Analytics Configuration
 * Handles reporter-specific analytics calculations and card props
 */

export const calculateReporterAnalyticsData = (tasks, reporters) => {
  if (!tasks || tasks.length === 0) {
    return {
      reporterTableData: [],
      reporterTableColumns: [
        { key: "reporter", header: "Reporter", align: "left" },
        {
          key: "totalTasks",
          header: "Total Tasks",
          align: "center",
          highlight: true,
        },
        {
          key: "totalHours",
          header: "Total Hours",
          align: "center",
          highlight: true,
        },
        { key: "markets", header: "Markets", align: "left" },
        { key: "products", header: "Products", align: "left" },
      ],
      reporterPieData: [],
      reporterBiaxialData: [],
    };
  }

  // Helper function to normalize reporter names (trim and lowercase for comparison)
  const normalizeReporterName = (name) => {
    if (!name) return '';
    return name.trim().toLowerCase();
  };

  // Initialize data structures
  const reporterData = {};
  const allReporters = new Set();
  const nameToKeyMap = {}; // Map normalized names to actual keys to deduplicate

  // Process tasks to extract reporter data
  tasks.forEach((task) => {
    // Check for reporter name and reporterUID in task data
    // Prioritize data_task fields first (they contain the most recent updates)
    const reporterName = task.data_task?.reporterName || task.reporterName;
    const reporterUID = task.data_task?.reporterUID || task.data_task?.reporters || task.reporterUID || task.reporters;
    const markets = task.data_task?.markets || task.markets || [];
    const products = task.data_task?.products || task.products || "";
    const timeInHours = task.data_task?.timeInHours || task.timeInHours || 0;

    if (!reporterName && !reporterUID) return;

    // Normalize the reporter name for consistent grouping
    // Use normalized name as the primary key to prevent duplicates
    const normalizedName = normalizeReporterName(reporterName);
    
    if (!normalizedName && !reporterUID) return;
    
    // Always use normalized name as key to ensure same person groups together
    // This prevents duplicates when some tasks have UID and others don't
    const reporterKey = normalizedName || reporterUID;
    
    // Track the mapping for consistency
    if (normalizedName && !nameToKeyMap[normalizedName]) {
      nameToKeyMap[normalizedName] = reporterKey;
    }

    allReporters.add(reporterKey);

    // Initialize reporter data
    if (!reporterData[reporterKey]) {
      // Use the first encountered reporterName as the canonical name
      reporterData[reporterKey] = {
        reporterName: reporterName || `Reporter ${reporterKey.slice(0, 8)}`,
        totalTasks: 0,
        totalHours: 0,
        markets: new Set(),
        products: new Set(),
      };
    } else {
      // Update name if we have a better one (non-empty, non-generated)
      if (reporterName && !reporterData[reporterKey].reporterName.includes('Reporter')) {
        reporterData[reporterKey].reporterName = reporterName;
      }
    }

    reporterData[reporterKey].totalTasks += 1;
    reporterData[reporterKey].totalHours += timeInHours;

    // Process markets
    if (Array.isArray(markets)) {
      markets.forEach((market) => {
        if (market) {
          reporterData[reporterKey].markets.add(market);
        }
      });
    }

    // Process products
    if (products && typeof products === "string") {
      reporterData[reporterKey].products.add(products);
    }
  });

  // Create reporter table data
  const reporterTableData = Array.from(allReporters).map((reporterKey) => {
    const data = reporterData[reporterKey];

    return {
      reporter: data.reporterName,
      totalTasks: data.totalTasks,
      totalHours: Math.round(data.totalHours * 100) / 100,
      markets: Array.from(data.markets).join(", "),
      products: Array.from(data.products).join(", "),
    };
  });

  // Sort by total tasks descending
  reporterTableData.sort((a, b) => b.totalTasks - a.totalTasks);

  // Add grand total row
  const grandTotal = {
    reporter: "Grand Total",
    totalTasks: reporterTableData.reduce((sum, row) => sum + row.totalTasks, 0),
    totalHours:
      Math.round(
        reporterTableData.reduce((sum, row) => sum + row.totalHours, 0) * 100
      ) / 100,
    markets: "All Markets",
    products: "All Products",
    bold: true,
    highlight: true,
  };
  reporterTableData.push(grandTotal);

  // Create table columns
  const reporterTableColumns = [
    { key: "reporter", header: "Reporter", align: "left" },
    {
      key: "totalTasks",
      header: "Total Tasks",
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
      key: "markets",
      header: "Markets",
      align: "left",
      render: (value, row) => {
        if (!value || value === "All Markets")
          return value;
        const markets = value.split(", ").filter((m) => m.trim());
        return (
          <div className="flex flex-wrap gap-1">
            {markets.map((market, index) => (
              <Badge key={index} color="amber" size="xs">
                {market}
              </Badge>
            ))}
          </div>
        );
      },
    },
    {
      key: "products",
      header: "Products",
      align: "left",
      render: (value, row) => {
        if (!value || value === "All Products")
          return value;
        const products = value.split(", ").filter((p) => p.trim());
        return (
          <div className="flex flex-wrap gap-1">
            {products.map((product, index) => (
              <Badge key={index} color="orange" size="xs">
                {product}
              </Badge>
            ))}
          </div>
        );
      },
    },
  ];

  // Create chart data
  const reporterPieData = addConsistentColors(
    reporterTableData
      .filter((row) => !row.bold) // Exclude grand total row
      .map((row) => ({
        name: row.reporter,
        value: row.totalTasks,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10), // Show top 10 reporters
    CHART_DATA_TYPE.REPORTER
  );

  const reporterBiaxialData = addConsistentColors(
    reporterTableData
      .filter((row) => !row.bold) // Exclude grand total row
      .map((row) => ({
        name: row.reporter,
        tasks: row.totalTasks,
        hours: row.totalHours,
      }))
      .sort((a, b) => {
        // Sort by tasks first (descending), then by hours (descending)
        if (b.tasks !== a.tasks) {
          return b.tasks - a.tasks;
        }
        return b.hours - a.hours;
      })
      .slice(0, 10), // Show top 10 reporters
    CHART_DATA_TYPE.REPORTER
  );

  // Calculate reporter-market breakdown for biaxial chart
  const reporterMarketStats = {};
  tasks.forEach((task) => {
    const reporterName = task.data_task?.reporterName || task.reporterName;
    const reporterUID = task.data_task?.reporterUID || task.data_task?.reporters || task.reporterUID || task.reporters;
    const markets = task.data_task?.markets || task.markets || [];
    const timeInHours = task.data_task?.timeInHours || task.timeInHours || 0;

    if (!reporterName && !reporterUID) return;

    const normalizedName = normalizeReporterName(reporterName);
    const reporterKey = normalizedName || reporterUID;

    if (Array.isArray(markets) && markets.length > 0) {
      markets.forEach((market) => {
        if (market) {
          // Normalize market (trim and uppercase) to ensure consistent matching
          const normalizedMarket = market.trim().toUpperCase();
          const key = `${reporterKey}-${normalizedMarket}`;
          if (!reporterMarketStats[key]) {
            reporterMarketStats[key] = {
              reporter: reporterData[reporterKey]?.reporterName || reporterName || reporterKey,
              market: normalizedMarket, // Store normalized market
              tasks: 0,
              hours: 0,
            };
          }
          reporterMarketStats[key].tasks += 1;
          reporterMarketStats[key].hours += timeInHours;
        }
      });
    } else {
      // If no markets, count under "No Market"
      const key = `${reporterKey}-No Market`;
      if (!reporterMarketStats[key]) {
        reporterMarketStats[key] = {
          reporter: reporterData[reporterKey]?.reporterName || reporterName || reporterKey,
          market: "No Market",
          tasks: 0,
          hours: 0,
        };
      }
      reporterMarketStats[key].tasks += 1;
      reporterMarketStats[key].hours += timeInHours;
    }
  });

  // Create reporter-market biaxial chart data
  // Use market colors so each market (RO, IT, etc.) has the same color
  const reporterMarketBiaxialData = Object.values(reporterMarketStats)
    .map((stat) => ({
      name: `${stat.reporter} - ${stat.market}`,
      tasks: stat.tasks,
      hours: Math.round(stat.hours * 100) / 100,
      market: stat.market, // Keep market reference for color mapping
    }))
    .sort((a, b) => {
      // Sort by tasks first (descending), then by hours (descending)
      if (b.tasks !== a.tasks) {
        return b.tasks - a.tasks;
      }
      return b.hours - a.hours;
    })
    .slice(0, 30) // Show top 20 reporter-market combinations
    .map((item) => ({
      ...item,
      color: getMarketColor(item.market), // Use market color mapping
    }));

  return {
    reporterTableData,
    reporterTableColumns,
    reporterPieData,
    reporterBiaxialData,
    reporterMarketBiaxialData,
  };
};

export const getReporterAnalyticsCardProps = (
  tasks,
  reporters,
  isLoading = false
) => {
  const calculatedData = calculateReporterAnalyticsData(tasks, reporters);

  // Calculate totals for chart titles
  const totalTasks = tasks?.length || 0;
  const totalHours =
    tasks?.reduce(
      (sum, task) =>
        sum + (task.data_task?.timeInHours || task.timeInHours || 0),
      0
    ) || 0;

  return {
    title: "Reporter Analytics",
    reporterTableData: calculatedData.reporterTableData,
    reporterTableColumns: calculatedData.reporterTableColumns,
    reporterPieData: calculatedData.reporterPieData,
    reporterPieTitle: `Reporter Metrics (${totalTasks} tasks, ${totalHours}h)`,
    reporterPieColors: calculatedData.reporterPieData.map((item) => item.color),
    reporterBiaxialData: calculatedData.reporterBiaxialData,
    reporterBiaxialTitle: `Reporter Metrics: Tasks & Hours (${totalTasks} tasks, ${totalHours}h)`,
    reporterBiaxialTasksColor: CHART_COLORS.DEFAULT[0],
    reporterBiaxialHoursColor: CHART_COLORS.DEFAULT[1],
    reporterMarketBiaxialData: calculatedData.reporterMarketBiaxialData,
    reporterMarketBiaxialTitle: `Reporters by Markets: Tasks & Hours (${totalTasks} tasks, ${totalHours}h)`,
    reporterMarketBiaxialTasksColor: CHART_COLORS.DEFAULT[0],
    reporterMarketBiaxialHoursColor: CHART_COLORS.DEFAULT[1],
    isLoading,
  };
};

// Simplified version without caching
export const getCachedReporterAnalyticsCardProps = (
  tasks,
  reporters,
  month,
  isLoading = false
) => {
  return getReporterAnalyticsCardProps(tasks, reporters, isLoading);
};

