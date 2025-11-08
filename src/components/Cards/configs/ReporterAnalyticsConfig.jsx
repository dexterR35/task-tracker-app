import React from "react";
import Badge from "@/components/ui/Badge/Badge";
import { addConsistentColors, CHART_COLORS, CHART_DATA_TYPE, getMarketColor, addGrandTotalRow } from "./analyticsSharedConfig";

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
  let reporterTableData = Array.from(allReporters).map((reporterKey) => {
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

  // Add grand total row using shared utility
  if (reporterTableData.length > 0) {
    reporterTableData = addGrandTotalRow(reporterTableData, {
      labelKey: 'reporter',
      labelValue: 'Grand Total',
      sumColumns: ['totalTasks', 'totalHours'],
      customValues: {
        markets: "All Markets",
        products: "All Products",
      },
    });
  }

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
          <div className="flex flex-wrap gap-1 uppercase">
            {markets.map((market, index) => (
              <Badge key={index} color="purple" size="xs">
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
              <Badge key={index} color="green" size="xs">
                {product}
              </Badge>
            ))}
          </div>
        );
      },
    },
  ];

  // Create chart data - split all reporters into 3 pie charts
  const allReporterPieData = reporterTableData
    .filter((row) => !row.bold) // Exclude grand total row
    .map((row) => ({
      name: row.reporter,
      value: row.totalTasks,
      hours: row.totalHours,
    }))
    .sort((a, b) => {
      // Sort by tasks (value) first (descending), then by hours (descending)
      if (b.value !== a.value) {
        return b.value - a.value;
      }
      return b.hours - a.hours;
    })
    .map(({ hours, ...rest }) => rest); // Remove hours from final data

  // Split reporters into 3 groups (roughly equal thirds)
  const totalReporters = allReporterPieData.length;
  const thirdPoint = Math.ceil(totalReporters / 3);
  const twoThirdPoint = Math.ceil((totalReporters * 2) / 3);
  
  const reporterPieData1 = addConsistentColors(
    allReporterPieData.slice(0, thirdPoint),
    CHART_DATA_TYPE.REPORTER
  );
  const reporterPieData2 = addConsistentColors(
    allReporterPieData.slice(thirdPoint, twoThirdPoint),
    CHART_DATA_TYPE.REPORTER
  );
  const reporterPieData3 = addConsistentColors(
    allReporterPieData.slice(twoThirdPoint),
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
      }),
    CHART_DATA_TYPE.REPORTER
  );

  // Calculate reporter stats by product type (Casino and Sport)
  // Casino includes: acq casino, markets casino, product casino
  // Sport includes: acq sport, markets sport, product sport
  const reporterStatsCasino = {};
  const reporterStatsSport = {};

  // Process tasks and group by reporter for casino and sport
  tasks.forEach((task) => {
    const products = task.data_task?.products || task.products || "";
    const productLower = products.toLowerCase().trim();
    const reporterName = task.data_task?.reporterName || task.reporterName;
    const reporterUID = task.data_task?.reporterUID || task.data_task?.reporters || task.reporterUID || task.reporters;
    const timeInHours = task.data_task?.timeInHours || task.timeInHours || 0;

    if (!reporterName && !reporterUID) return;

    const normalizedName = normalizeReporterName(reporterName);
    const reporterKey = normalizedName || reporterUID;
    const reporterDisplayName = reporterData[reporterKey]?.reporterName || reporterName || reporterKey;

    // Check for sport and casino - they can be part of compound names like "acquisition sport", "marketing sport", "product sport"
    // Casino: includes "casino" (acq casino, markets casino, product casino)
    // Sport: includes "sport" (acq sport, markets sport, product sport)
    if (productLower.includes("casino")) {
      if (!reporterStatsCasino[reporterKey]) {
        reporterStatsCasino[reporterKey] = {
          reporter: reporterDisplayName,
          tasks: 0,
          hours: 0,
        };
      }
      reporterStatsCasino[reporterKey].tasks += 1;
      reporterStatsCasino[reporterKey].hours += timeInHours;
    } else if (productLower.includes("sport")) {
      if (!reporterStatsSport[reporterKey]) {
        reporterStatsSport[reporterKey] = {
          reporter: reporterDisplayName,
          tasks: 0,
          hours: 0,
        };
      }
      reporterStatsSport[reporterKey].tasks += 1;
      reporterStatsSport[reporterKey].hours += timeInHours;
    }
  });

  // Helper function to create biaxial chart data from stats, only including reporters with tasks
  // NOTE: No slice - shows ALL reporters with tasks (unlike pie chart which is limited to top 10)
  const createBiaxialData = (statsObject) => {
    return Object.values(statsObject)
      .filter((stat) => stat.tasks > 0) // Only include reporters with tasks
      .map((stat) => ({
        name: stat.reporter,
        tasks: stat.tasks,
        hours: Math.round(stat.hours * 100) / 100,
      }))
      .sort((a, b) => {
        // Sort by tasks first (descending), then by hours (descending)
        if (b.tasks !== a.tasks) {
          return b.tasks - a.tasks;
        }
        return b.hours - a.hours;
      });
    // No slice - return all reporters with tasks
  };

  // Create separate reporter biaxial chart data for Casino and Sport
  // Shows ALL reporters with tasks (no slice)
  const reporterMarketBiaxialDataCasino = createBiaxialData(reporterStatsCasino);
  const reporterMarketBiaxialDataSport = createBiaxialData(reporterStatsSport);
  const reporterMarketBiaxialDataProduct = []; // Not used anymore, but keeping for compatibility

  return {
    reporterTableData,
    reporterTableColumns,
    reporterPieData1,
    reporterPieData2,
    reporterPieData3,
    reporterBiaxialData,
    reporterMarketBiaxialDataCasino,
    reporterMarketBiaxialDataSport,
    reporterMarketBiaxialDataProduct,
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
    reporterPieData1: calculatedData.reporterPieData1,
    reporterPieData2: calculatedData.reporterPieData2,
    reporterPieData3: calculatedData.reporterPieData3,
    reporterPieColors1: calculatedData.reporterPieData1.map((item) => item.color),
    reporterPieColors2: calculatedData.reporterPieData2.map((item) => item.color),
    reporterPieColors3: calculatedData.reporterPieData3.map((item) => item.color),
    reporterBiaxialData: calculatedData.reporterBiaxialData,
    reporterBiaxialTitle: `Reporter Metrics: Tasks & Hours (${totalTasks} tasks, ${totalHours}h)`,
    reporterBiaxialTasksColor: CHART_COLORS.DEFAULT[0],
    reporterBiaxialHoursColor: CHART_COLORS.DEFAULT[1],
    reporterMarketBiaxialDataCasino: calculatedData.reporterMarketBiaxialDataCasino,
    reporterMarketBiaxialDataSport: calculatedData.reporterMarketBiaxialDataSport,
    reporterMarketBiaxialDataProduct: calculatedData.reporterMarketBiaxialDataProduct,
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

