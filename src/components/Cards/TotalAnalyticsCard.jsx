import React, { memo, useMemo } from "react";
import AnalyticsTable from "@/components/Table/AnalyticsTable";
import SimplePieChart from "@/components/Charts/SimplePieChart";
import BiaxialBarChart from "@/components/Charts/BiaxialBarChart";
import { SkeletonAnalyticsCard } from "@/components/ui/Skeleton/Skeleton";
import ChartHeader from "./ChartHeader";
import { CARD_SYSTEM } from "@/constants";
import { Icons } from "@/components/icons";

const TotalAnalyticsCard = memo(({
  title,
  tableData,
  tableColumns,
  pieData,
  barChartData,
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
  // Pie chart segments show per category counts, but totals should show unique tasks (not sum of category counts)
  const pieTotal = useMemo(() => {
    // Use unique tasks count from props (totalTasks is already unique tasks)
    return totalTasks || 0;
  }, [totalTasks]);

  // Ensure barChartData exists - create from tableData if barChartData is missing
  const finalBarChartData = useMemo(() => {
    if (barChartData && barChartData.length > 0) {
      return barChartData;
    }
    // Fallback: generate from tableData if barChartData is not provided
    if (tableData && tableData.length > 0 && pieData && pieData.length > 0) {
      const categoryColors = {
        'Marketing': '#e11d48',
        'Acquisition': '#2563eb',
        'Product': '#f59e0b',
        'Misc': '#8C00FF',
      };
      return tableData
        .filter((row) => row.isMainCategory && !row.isGrandTotal)
        .map((row) => {
          // Find matching pie data to get the color
          const pieItem = pieData.find(p => p.name === row.category);
          return {
            name: row.category,
            tasks: row.totalTasks || 0,
            hours: row.totalHours || 0,
            color: pieItem?.color || categoryColors[row.category] || '#2563eb',
          };
        });
    }
    return [];
  }, [barChartData, tableData, pieData]);

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

      {/* Charts Section - Second Row: Pie Chart and Bar Chart Side by Side */}
      {(pieData && pieData.length > 0) || (finalBarChartData && finalBarChartData.length > 0) ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pie Chart */}
          {pieData && pieData.length > 0 && (
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
          )}

          {/* Bar Chart */}
          {finalBarChartData && finalBarChartData.length > 0 && (
            <ChartHeader
              variant="section"
              title="Tasks and Hours by Category"
              badges={[
                `${pieTotal} tasks`,
                `${totalHours}h`
              ]}
              color={cardColor}
            >
              <BiaxialBarChart
                data={finalBarChartData}
                title=""
                showHours={true}
                dataType={CARD_SYSTEM.CHART_DATA_TYPE.PRODUCT}
              />
            </ChartHeader>
          )}
        </div>
      ) : (
        <div className="card-small-modern">
          <div className="text-center py-12">
            <Icons.generic.chart className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400 font-medium">No chart data available</p>
          </div>
        </div>
      )}
    </div>
  );
});

TotalAnalyticsCard.displayName = 'TotalAnalyticsCard';

export default TotalAnalyticsCard;

