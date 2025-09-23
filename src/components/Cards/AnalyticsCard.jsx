import React from "react";
import AnalyticsTable from "../Table/AnalyticsTable";
import SimplePieChart from "../Charts/SimplePieChart";
import SimpleColumnChart from "../Charts/SimpleColumnChart";
import { SkeletonAnalyticsCard } from "../ui/Skeleton/Skeleton";

const AnalyticsCard = ({ 
  title,
  tableData,
  tableColumns,
  chartData,
  chartTitle,
  colors,
  chartType = "pie",
  multiBar = false,
  className = "",
  isLoading = false
}) => {
  if (isLoading) {
    return <SkeletonAnalyticsCard className={className} />;
  }

  return (
    <div className={`card-large ${className}`}>
      <h2 className="card-title text-xl mb-6">{title}</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
          {chartType === "column" ? (
            <SimpleColumnChart
              data={chartData}
              title={chartTitle}
              colors={colors}
              multiBar={multiBar}
            />
          ) : (
            <SimplePieChart
              data={chartData}
              title={chartTitle}
              colors={colors}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsCard;
