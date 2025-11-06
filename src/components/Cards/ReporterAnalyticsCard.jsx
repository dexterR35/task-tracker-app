import React, { memo } from "react";
import AnalyticsTable from "@/components/Table/AnalyticsTable";
import SimplePieChart from "@/components/Charts/SimplePieChart";
import BiaxialBarChart from "@/components/Charts/BiaxialBarChart";
import { SkeletonAnalyticsCard } from "@/components/ui/Skeleton/Skeleton";
import { CARD_SYSTEM } from "@/constants";

const ReporterAnalyticsCard = memo(({
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
  reporterMarketBiaxialData,
  reporterMarketBiaxialTitle,
  reporterMarketBiaxialTasksColor,
  reporterMarketBiaxialHoursColor,
  className = "",
  isLoading = false,
}) => {
  if (isLoading) {
    return <SkeletonAnalyticsCard className={className} />;
  }

  return (
    <div id="reporter-analytics-card" className={`${className}`}>
      {/* Grid Container */}
      <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
        {/* Tables Section */}
        <div>
          {/* Reporter Statistics Table */}
          {reporterTableData && reporterTableData.length > 0 ? (
            <div className="table-container">
              <AnalyticsTable
                data={reporterTableData}
                columns={reporterTableColumns}
                sectionTitle="📊 Reporter Statistics"
              />
            </div>
          ) : (
            <div className="card">
              <div className="text-center py-8">
                <p className="text-gray-500 dark:text-gray-400">No data</p>
              </div>
            </div>
          )}
        </div>

        {/* Charts Section */}
        <div>
          <h3 className="mb-4 text-lg font-semibold">📈 Charts</h3>
          
          {/* Charts Container */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Reporter Metrics Pie Chart */}
          <div className="chart-container">
            <div className="mb-2">
              <span className="text-xs dark:bg-blue-800 px-2 py-1 rounded">
                📊 <strong>Reporter Metrics:</strong> Task by reporter
              </span>
            </div>
            <SimplePieChart
              data={reporterPieData}
              title={reporterPieTitle}
              colors={reporterPieColors}
              showPercentages={true}
              dataType={CARD_SYSTEM.CHART_DATA_TYPE.REPORTER}
            />
          </div>

          {/* Reporter Metrics Biaxial Chart */}
          <div className="chart-container">
            <div className="mb-2">
              <span className="text-xs dark:bg-blue-800 px-2 py-1 rounded">
                📊 <strong>Reporter Metrics:</strong> Tasks & Hours by reporter
              </span>
            </div>
            <BiaxialBarChart
              data={reporterBiaxialData}
              title={reporterBiaxialTitle}
              tasksColor={reporterBiaxialTasksColor}
              hoursColor={reporterBiaxialHoursColor}
              dataType={CARD_SYSTEM.CHART_DATA_TYPE.REPORTER}
            />
          </div>
        </div>

          {/* Reporter-Market Biaxial Chart */}
          <div className="chart-container">
            <div className="mb-2">
              <span className="text-xs dark:bg-blue-800 px-2 py-1 rounded">
                📊 <strong>Reporters by Markets:</strong> Tasks & Hours per market by reporter
              </span>
            </div>
            <BiaxialBarChart
              data={reporterMarketBiaxialData}
              title={reporterMarketBiaxialTitle}
              tasksColor={reporterMarketBiaxialTasksColor}
              hoursColor={reporterMarketBiaxialHoursColor}
              dataType="reporter"
            />
          </div>
        </div>
      </div>
    </div>
  );
});

ReporterAnalyticsCard.displayName = 'ReporterAnalyticsCard';

export default ReporterAnalyticsCard;