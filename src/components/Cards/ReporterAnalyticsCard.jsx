import React from "react";
import AnalyticsTable from "@/components/Table/AnalyticsTable";
import SimplePieChart from "@/components/Charts/SimplePieChart";
import BiaxialBarChart from "@/components/Charts/BiaxialBarChart";
import { SkeletonAnalyticsCard } from "@/components/ui/Skeleton/Skeleton";

const ReporterAnalyticsCard = ({
  title,
  reporterTableData,
  reporterTableColumns,
  reporterPieData,
  reporterPieTitle,
  reporterPieColors,
  reporterBiaxialData,
  reporterBiaxialTitle,
  reporterBiaxialTasksColor,
  reporterBiaxialHoursColor,
  className = "",
  isLoading = false,
}) => {
  if (isLoading) {
    return <SkeletonAnalyticsCard className={className} />;
  }

  // Check if we have no data
  const hasNoData = reporterTableData.length === 1 && reporterTableData[0]?.noData;

  return (
    <div id="reporter-analytics-card" className={`card-large ${className}`}>
      <h2 className="card-title text-xl mb-6">{title}</h2>

      {/* Grid Container */}
      <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
        {/* Reporter Statistics Table */}
        <div className="table-container">
          {hasNoData ? (
            <div className="flex items-center justify-center h-32 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="text-center">
                <div className="text-gray-500 dark:text-gray-400 text-lg mb-2">📊</div>
                <p className="text-gray-600 dark:text-gray-300 font-medium">No data available</p>
                <p className="text-gray-500 dark:text-gray-400 text-sm">No reporter data found for the selected period</p>
              </div>
            </div>
          ) : (
            <AnalyticsTable
              data={reporterTableData}
              columns={reporterTableColumns}
            />
          )}
        </div>
        
        {/* Charts Container */}
        {hasNoData ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="flex items-center justify-center h-64 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="text-center">
                <div className="text-gray-500 dark:text-gray-400 text-2xl mb-2">📊</div>
                <p className="text-gray-600 dark:text-gray-300 font-medium">No chart data available</p>
              </div>
            </div>
            <div className="flex items-center justify-center h-64 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="text-center">
                <div className="text-gray-500 dark:text-gray-400 text-2xl mb-2">📈</div>
                <p className="text-gray-600 dark:text-gray-300 font-medium">No chart data available</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Reporter Metrics Pie Chart */}
            <div className="chart-container">
              <div className="mb-2">
                <span className="text-xs text-gray-600 dark:text-gray-400 bg-purple-100 dark:bg-purple-900 px-2 py-1 rounded">
                  📊 <strong>Reporter Metrics:</strong> Task distribution by reporter
                </span>
              </div>
              <SimplePieChart
                data={reporterPieData}
                title={reporterPieTitle}
                colors={reporterPieColors}
                showPercentages={true}
                dataType="reporter"
              />
            </div>

            {/* Reporter Metrics Biaxial Chart */}
            <div className="chart-container">
              <div className="mb-2">
                <span className="text-xs text-gray-600 dark:text-gray-400 bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded">
                  📊 <strong>Reporter Metrics:</strong> Tasks & Hours by reporter
                </span>
              </div>
              <BiaxialBarChart
                data={reporterBiaxialData}
                title={reporterBiaxialTitle}
                tasksColor={reporterBiaxialTasksColor}
                hoursColor={reporterBiaxialHoursColor}
                dataType="reporter"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReporterAnalyticsCard;
