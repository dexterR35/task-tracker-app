import React, { useMemo } from "react";
import AnalyticsCard from "@/components/Cards/AnalyticsCard";

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

  // Calculate reporter analytics data with specific format
  const analyticsData = useMemo(() => {
    const reporterData = {};
    const marketingTotals = { casino: 0, poker: 0, sport: 0 };
    const marketTotals = { COM: 0, DE: 0, FI: 0, FR: 0, IE: 0, IT: 0, RO: 0, UK: 0 };

    // Process each task
    filteredTasks.forEach(task => {
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
            marketing: { casino: 0, poker: 0, sport: 0 },
            markets: { COM: 0, DE: 0, FI: 0, FR: 0, IE: 0, IT: 0, RO: 0, UK: 0 }
          };
        }

        reporterData[reporterKey].totalTasks++;
        
        // Process marketing categories
        products.forEach(product => {
          if (product && typeof product === 'string') {
            if (product.includes('marketing') && product.includes('casino')) {
              reporterData[reporterKey].marketing.casino++;
              marketingTotals.casino++;
            } else if (product.includes('marketing') && product.includes('poker')) {
              reporterData[reporterKey].marketing.poker++;
              marketingTotals.poker++;
            } else if (product.includes('marketing') && product.includes('sport')) {
              reporterData[reporterKey].marketing.sport++;
              marketingTotals.sport++;
            }
          }
        });

        // Process markets
        markets.forEach(market => {
          if (market && typeof market === 'string') {
            const marketUpper = market.toUpperCase();
            if (reporterData[reporterKey].markets.hasOwnProperty(marketUpper)) {
              reporterData[reporterKey].markets[marketUpper]++;
              marketTotals[marketUpper]++;
            }
          }
        });
      }
    });

    // Create table data
    const tableData = Object.values(reporterData).map(reporter => {
      return {
        reporter: reporter.name,
        total: reporter.totalTasks,
        'Marketing casino': reporter.marketing.casino,
        'Marketing poker': reporter.marketing.poker,
        'Marketing sport': reporter.marketing.sport,
        COM: reporter.markets.COM,
        DE: reporter.markets.DE,
        FI: reporter.markets.FI,
        FR: reporter.markets.FR,
        IE: reporter.markets.IE,
        IT: reporter.markets.IT,
        RO: reporter.markets.RO,
        UK: reporter.markets.UK
      };
    });

    // Sort by total tasks (descending)
    tableData.sort((a, b) => b.total - a.total);

    // Add grand total row
    const grandTotalRow = {
      reporter: "Grand Total",
      total: Object.values(reporterData).reduce((sum, reporter) => sum + reporter.totalTasks, 0),
      'Marketing casino': marketingTotals.casino,
      'Marketing poker': marketingTotals.poker,
      'Marketing sport': marketingTotals.sport,
      COM: marketTotals.COM,
      DE: marketTotals.DE,
      FI: marketTotals.FI,
      FR: marketTotals.FR,
      IE: marketTotals.IE,
      IT: marketTotals.IT,
      RO: marketTotals.RO,
      UK: marketTotals.UK,
      bold: true,
      highlight: true
    };

    tableData.push(grandTotalRow);

    return {
      tableData,
      marketingTotals,
      marketTotals
    };
  }, [filteredTasks, reporters]);

  // Create table columns with exact format
  const tableColumns = [
    { key: "reporter", header: "Reporter", align: "left" },
    { key: "total", header: "Total Tasks", align: "center", highlight: true },
    { key: "Marketing casino", header: "Marketing casino", align: "center" },
    { key: "Marketing poker", header: "Marketing poker", align: "center" },
    { key: "Marketing sport", header: "Marketing sport", align: "center" },
    { key: "COM", header: "COM", align: "center" },
    { key: "DE", header: "DE", align: "center" },
    { key: "FI", header: "FI", align: "center" },
    { key: "FR", header: "FR", align: "center" },
    { key: "IE", header: "IE", align: "center" },
    { key: "IT", header: "IT", align: "center" },
    { key: "RO", header: "RO", align: "center" },
    { key: "UK", header: "UK", align: "center" }
  ];

  // Create chart data for reporter distribution with specific markets
  const chartData = Object.values(analyticsData.tableData)
    .filter(row => !row.bold) // Exclude grand total row
    .slice(0, 10) // Show top 10 reporters
    .map(row => {
      return {
        name: row.reporter.length > 15 ? row.reporter.substring(0, 15) + '...' : row.reporter,
        tasks: row.total,
        COM: row.COM || 0,
        DE: row.DE || 0,
        FI: row.FI || 0,
        FR: row.FR || 0,
        IE: row.IE || 0,
        IT: row.IT || 0,
        RO: row.RO || 0,
        UK: row.UK || 0
      };
    });

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
      chartTitle="Reporter Task Distribution"
      colors={colors}
      chartType="column"
      multiBar={true}
      isLoading={isLoading}
    />
  );
};

export default ReporterAnalyticsCard;
