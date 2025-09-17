import React from "react";
import AnalyticsTable from "../Table/AnalyticsTable";
import SimplePieChart from "../Charts/SimplePieChart";

const AnalyticsCard = ({ 
  title,
  tableData,
  tableColumns,
  chartData,
  chartTitle,
  colors,
  className = ""
}) => {
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-700 p-4 ${className}`}>
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{title}</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Table */}
        <div>
          <AnalyticsTable
            data={tableData}
            columns={tableColumns}
            title="Data Breakdown"
          />
        </div>
        
        {/* Chart */}
        <div>
          <SimplePieChart
            data={chartData}
            title={chartTitle}
            colors={colors}
          />
        </div>
      </div>
    </div>
  );
};

export default AnalyticsCard;
