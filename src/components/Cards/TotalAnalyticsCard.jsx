import React, { memo, useMemo } from "react";
import AnalyticsTable from "@/components/Table/AnalyticsTable";
import SimplePieChart from "@/components/Charts/SimplePieChart";
import { SkeletonAnalyticsCard } from "@/components/ui/Skeleton/Skeleton";
import ChartHeader from "./ChartHeader";
import { CARD_SYSTEM } from "@/constants";

const TotalAnalyticsCard = memo(({
  title,
  tableData,
  tableColumns,
  pieData,
  pieTitle,
  pieColors,
  totalTasks,
  totalHours,
  className = "",
  isLoading = false,
}) => {
  if (isLoading) {
    return <SkeletonAnalyticsCard className={className} />;
  }

  // Calculate pie chart total
  const pieTotal = useMemo(() => 
    pieData?.reduce((sum, item) => sum + (item.value || 0), 0) || 0,
    [pieData]
  );

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          {title}
        </h2>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {totalTasks} total tasks • {totalHours}h total hours
        </div>
      </div>

      {/* Table Section - First Row */}
      <div className="group relative bg-white dark:bg-smallCard border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden">
        <ChartHeader
          title="Category Totals"
          badges={[
            `${pieTotal} tasks`,
            `${totalHours}h`
          ]}
        />
        <div className="p-5">
          <AnalyticsTable
            data={tableData}
            columns={tableColumns}
            isLoading={isLoading}
            enablePagination={false}
            showPagination={false}
          />
        </div>
      </div>

      {/* Pie Chart Section - Second Row */}
      <div className="group relative bg-white dark:bg-smallCard border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden">
        <ChartHeader
          title="Total Tasks by Category"
          badges={[
            `${pieTotal} tasks`,
            `${totalHours}h`
          ]}
        />
        <div className="p-5">
          <SimplePieChart
            data={pieData}
            title=""
            colors={pieColors}
            showPercentages={true}
            dataType={CARD_SYSTEM.CHART_DATA_TYPE.PRODUCT}
          />
        </div>
      </div>
    </div>
  );
});

TotalAnalyticsCard.displayName = 'TotalAnalyticsCard';

export default TotalAnalyticsCard;

