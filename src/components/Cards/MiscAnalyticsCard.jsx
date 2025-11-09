import React, { memo, useMemo } from "react";
import AnalyticsTable from "@/components/Table/AnalyticsTable";
import SimplePieChart from "@/components/Charts/SimplePieChart";
import BiaxialBarChart from "@/components/Charts/BiaxialBarChart";
import { SkeletonAnalyticsCard } from "@/components/ui/Skeleton/Skeleton";
import ChartHeader from "./ChartHeader";
import { CHART_COLORS } from "./configs/analyticsSharedConfig";
import { CARD_SYSTEM } from "@/constants";
import Badge from "@/components/ui/Badge/Badge";
import { Icons } from "@/components/icons";

const ChartIcon = Icons.generic.chart;

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
  miscUsersCharts = [],
  className = "",
  isLoading = false,
}) => {
  if (isLoading) {
    return <SkeletonAnalyticsCard className={className} />;
  }

  // Calculate totals for pie charts
  const categoryPieTotal = useMemo(() => 
    categoryPieData?.reduce((sum, item) => sum + (item.value || 0), 0) || 0,
    [categoryPieData]
  );
  const categoryPieHours = useMemo(() => 
    categoryBiaxialData?.reduce((sum, item) => sum + (item.hours || 0), 0) || 0,
    [categoryBiaxialData]
  );

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
                sectionTitle="Misc Statistics"
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
                sectionTitle="Users Misc Statistics"
              />
            </div>
          ) : null}
        </div>
        
        {/* Charts Section */}
        <div>
          {/* Pie Charts Container */}
          <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
            {/* Misc Categories Pie Chart */}
            <div className="group relative bg-white dark:bg-smallCard border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden">
              <ChartHeader
                title="Misc Categories: Task by category"
                badges={[
                  `${categoryPieTotal} tasks`,
                  `${Math.round(categoryPieHours * 10) / 10}h`
                ]}
              />
              <div className="p-5">
                <SimplePieChart
                  data={categoryPieData}
                  title=""
                  colors={categoryPieColors}
                  showPercentages={true}
                  dataType={CARD_SYSTEM.CHART_DATA_TYPE.PRODUCT}
                />
              </div>
            </div>
          </div>

          {/* Biaxial Charts Container */}
          <div className="grid grid-cols-1 lg:grid-cols-1 gap-6 mt-6">
            {/* Misc Categories Biaxial Chart */}
            {(() => {
              const totalTasks = categoryBiaxialData?.reduce((sum, item) => sum + (item.tasks || 0), 0) || 0;
              const totalHours = categoryBiaxialData?.reduce((sum, item) => sum + (item.hours || 0), 0) || 0;
              return (
                <div className="group relative bg-white dark:bg-smallCard border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden">
                  <ChartHeader
                    title="Misc Categories: Tasks & Hours by Category"
                    badges={[
                      `${totalTasks} tasks`,
                      `${totalHours}h`
                    ]}
                  />
                  <div className="p-5">
                    <BiaxialBarChart
                      data={categoryBiaxialData}
                      title=""
                      tasksColor={categoryBiaxialTasksColor}
                      hoursColor={categoryBiaxialHoursColor}
                      dataType={CARD_SYSTEM.CHART_DATA_TYPE.PRODUCT}
                    />
                  </div>
                </div>
              );
            })()}
          </div>
        </div>

        {/* User Charts Section */}
        <div className="mt-8">
          <div className="mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <span>User Analytics</span>
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Individual user performance breakdown</p>
          </div>
          
          {/* Misc: Per-User Charts */}
          <div>
            <div className="mb-5">
              <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                <span>Misc: Per User</span>
              </h4>
            </div>
            {miscUsersCharts && miscUsersCharts.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {miscUsersCharts.map((userChart) => (
                  <div 
                    key={`misc-${userChart.userId}`} 
                    className="group relative bg-white dark:bg-smallCard border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden"
                  >
                    <ChartHeader
                      title={userChart.userName}
                      subtitle={`${userChart.category} - Markets`}
                      badges={[
                        `${userChart.totalTasks} tasks`,
                        `${userChart.totalHours}h`
                      ]}
                    />
                    
                    {/* Chart Container */}
                    <div className="p-5">
                      <BiaxialBarChart
                        data={userChart.marketData}
                        title=""
                        tasksColor={CHART_COLORS.DEFAULT[0]}
                        hoursColor={CHART_COLORS.DEFAULT[1]}
                        dataType={CARD_SYSTEM.CHART_DATA_TYPE.MARKET}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="card rounded-xl">
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                  </div>
                  <p className="text-gray-500 dark:text-gray-400 font-medium">No misc user data</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

MiscAnalyticsCard.displayName = 'MiscAnalyticsCard';

export default MiscAnalyticsCard;

