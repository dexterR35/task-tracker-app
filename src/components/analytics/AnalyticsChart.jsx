import React, { useMemo } from "react";
import DataTable from "./DataTable";
import PieChart from "./PieChart";
import { processTasksForTable, processTasksForChart, generateSummaryData } from "./dataProcessor";

const AnalyticsChart = ({ 
  tasks = [], 
  isLoading = false, 
  title = "Task Analytics",
  showTable = true,
  showChart = true,
  className = "",
  config = {}
}) => {
  // Process tasks data using the data processor
  const analyticsData = useMemo(() => {
    if (!Array.isArray(tasks) || tasks.length === 0) {
      return {
        tableData: {},
        chartData: [],
        summaryData: {},
        hasData: false
      };
    }

    const tableData = processTasksForTable(tasks, config);
    const chartData = processTasksForChart(tasks, config);
    const summaryData = generateSummaryData(tableData);

    return { 
      tableData, 
      chartData, 
      summaryData,
      hasData: tasks.length > 0 
    };
  }, [tasks, config]);

  // Loading state
  if (isLoading) {
    return (
      <div className={`bg-gray-800 rounded-lg p-6 shadow-lg ${className}`}>
        <h2 className="text-2xl font-semibold text-white mb-6">{title}</h2>
        <div className="text-center text-white">Loading analytics...</div>
      </div>
    );
  }

  // No data state
  if (!analyticsData.hasData) {
    return (
      <div className={`bg-gray-800 rounded-lg p-6 shadow-lg ${className}`}>
        <h2 className="text-2xl font-semibold text-white mb-6">{title}</h2>
        <div className="text-center text-red-400 py-8">
          <div className="text-xl font-semibold mb-2">⚠️ Data Not Available</div>
          <div className="text-gray-300">No task data is provided yet. Please add some tasks to see analytics.</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-gray-800 rounded-lg p-6 shadow-lg ${className}`}>
      <h2 className="text-2xl font-semibold text-white mb-6">{title}</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Data Table */}
        {showTable && (
          <DataTable
            data={analyticsData.tableData}
            title="Task Distribution by Category & Market"
            showSummary={true}
            summaryData={{
              totalTasks: analyticsData.summaryData.totalTasks,
              currentMonth: tasks.length
            }}
          />
        )}

        {/* 3D Pie Chart */}
        {showChart && (
          <PieChart
            data={analyticsData.chartData}
            title="Task Distribution Chart"
            options={{
              title: "Task Distribution",
              pieHole: 0.4,
              is3D: true,
              pieStartAngle: 100,
              sliceVisibilityThreshold: 0.02,
              legend: {
                position: "bottom",
                alignment: "center",
                textStyle: {
                  color: "#ffffff",
                  fontSize: 14,
                },
              },
              titleTextStyle: {
                color: "#ffffff",
                fontSize: 18,
              },
              colors: ["#8AD1C2", "#9F8AD1", "#D18A99", "#BCD18A"],
              backgroundColor: "transparent",
            }}
          />
        )}
      </div>
    </div>
  );
};

export default AnalyticsChart;
