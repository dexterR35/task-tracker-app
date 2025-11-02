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

  // NOTE: hasNoData logic has been removed.
  // The child components (Table and Charts) are now responsible for handling their own empty states.

  return (
    <div id="reporter-analytics-card" className={`${className}`}>
      <h3>{title}</h3>

      {/* Grid Container */}
      <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
        {/* Reporter Statistics Table */}
        <div className="table-container">
          {/* Always render the table, letting the component handle its data */}
          <AnalyticsTable
            data={reporterTableData}
            columns={reporterTableColumns}
          />
        </div>

        {/* Charts Container */}
        {/* Always render the charts, letting the components handle their data */}
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
              dataType="reporter"
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
              dataType="reporter"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReporterAnalyticsCard;