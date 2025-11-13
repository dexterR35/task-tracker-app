import React, { memo, useMemo } from "react";
import AnalyticsTable from "@/components/Table/AnalyticsTable";
import SimplePieChart from "@/components/Charts/SimplePieChart";
import { SkeletonAnalyticsCard } from "@/components/ui/Skeleton/Skeleton";
import ChartHeader from "./ChartHeader";
import { CARD_SYSTEM } from "@/constants";
import { Icons } from "@/components/icons";

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

  const cardColor = CARD_SYSTEM.COLOR_HEX_MAP.blue;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Table Section - First Row */}
      <div>
        {tableData && tableData.length > 0 ? (
          <AnalyticsTable
            data={tableData}
            columns={tableColumns}
            title="Category Totals"
            isLoading={isLoading}
            enablePagination={false}
            showPagination={false}
          />
        ) : (
          <div className="card-small-modern">
            <div className="text-center py-12">
              <Icons.generic.document className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-gray-400 font-medium">No data available</p>
            </div>
          </div>
        )}
      </div>

      {/* Pie Chart Section - Second Row */}
      <ChartHeader
        variant="section"
        title="Total Tasks by Category"
        badges={[
          `${pieTotal} tasks`,
          `${totalHours}h`
        ]}
        color={cardColor}
      >
        <SimplePieChart
          data={pieData}
          title=""
          colors={pieColors}
          showPercentages={true}
          dataType={CARD_SYSTEM.CHART_DATA_TYPE.PRODUCT}
        />
      </ChartHeader>
    </div>
  );
});

TotalAnalyticsCard.displayName = 'TotalAnalyticsCard';

export default TotalAnalyticsCard;

