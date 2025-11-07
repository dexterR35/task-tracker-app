import React, { memo } from "react";
import AnalyticsTable from "@/components/Table/AnalyticsTable";
import SimplePieChart from "@/components/Charts/SimplePieChart";
import BiaxialBarChart from "@/components/Charts/BiaxialBarChart";
import { SkeletonAnalyticsCard } from "@/components/ui/Skeleton/Skeleton";
import { CHART_COLORS } from "./configs/analyticsSharedConfig";
import { CARD_SYSTEM } from "@/constants";

const MiscAnalyticsCard = memo(({
  title,
  miscTableData,
  miscTableColumns,
  usersMiscTableData,
  usersMiscTableColumns,
  categoryPieData,
  categoryPieTitle,
  categoryPieColors,
  categoryBiaxialData,
  categoryBiaxialTitle,
  categoryBiaxialTasksColor,
  categoryBiaxialHoursColor,
  className = "",
  isLoading = false,
}) => {
  if (isLoading) {
    return <SkeletonAnalyticsCard className={className} />;
  }

  return (
    <div id="misc-analytics-card" className={`${className}`}>
      {/* Grid Container */}
      <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
        {/* Tables Section */}
        <div>
          {/* Misc Statistics Table */}
          {miscTableData && miscTableData.length > 0 ? (
            <div className="table-container">
              <AnalyticsTable
                data={miscTableData}
                columns={miscTableColumns}
                sectionTitle="📊 Misc Statistics"
              />
            </div>
          ) : (
            <div className="card">
              <div className="text-center py-8">
                <p className="text-gray-500 dark:text-gray-400">No misc product data available</p>
              </div>
            </div>
          )}

          {/* Users Misc Statistics Table */}
          {usersMiscTableData && usersMiscTableData.length > 0 ? (
            <div className="table-container mt-6">
              <AnalyticsTable
                data={usersMiscTableData}
                columns={usersMiscTableColumns}
                sectionTitle="👥 Users Misc Statistics"
              />
            </div>
          ) : null}
        </div>
        
        {/* Charts Section */}
        <div>
          <h3 className="mb-4 text-lg font-semibold">📈 Charts</h3>
          
          {/* Pie Charts Container */}
          <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
            {/* Misc Categories Pie Chart */}
            <div className="chart-container">
              <div className="mb-2">
                <span className="text-xs dark:bg-blue-800 px-2 py-1 rounded">
                  📊 <strong>Misc Categories:</strong> Task by category
                </span>
              </div>
              <SimplePieChart
                data={categoryPieData}
                title={categoryPieTitle}
                colors={categoryPieColors}
                showPercentages={true}
                dataType={CARD_SYSTEM.CHART_DATA_TYPE.PRODUCT}
              />
            </div>
          </div>

          {/* Biaxial Charts Container */}
          <div className="grid grid-cols-1 lg:grid-cols-1 gap-6 mt-6">
            {/* Misc Categories Biaxial Chart */}
            <div className="chart-container">
              <div className="mb-2">
                <span className="text-xs dark:bg-blue-800 px-2 py-1 rounded">
                  📊 <strong>Misc Categories:</strong> Tasks & Hours by Category
                </span>
              </div>
              <BiaxialBarChart
                data={categoryBiaxialData}
                title={categoryBiaxialTitle}
                tasksColor={categoryBiaxialTasksColor}
                hoursColor={categoryBiaxialHoursColor}
                dataType={CARD_SYSTEM.CHART_DATA_TYPE.PRODUCT}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

MiscAnalyticsCard.displayName = 'MiscAnalyticsCard';

export default MiscAnalyticsCard;

