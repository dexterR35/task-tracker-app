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
          {/* Users Misc Statistics Table */}
          {usersMiscTableData && usersMiscTableData.length > 0 ? (
            <AnalyticsTable
              data={usersMiscTableData}
              columns={usersMiscTableColumns}
              title="Users Misc Statistics"
            />
          ) : (
            <div className="card-small-modern">
              <div className="text-center py-12">
                <Icons.generic.document className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-3" />
                <p className="text-gray-500 dark:text-gray-400 font-medium">No misc product data available</p>
              </div>
            </div>
          )}
        </div>
        
        {/* Charts Section */}
        <div>
          {/* Charts Container - 3 columns grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Misc Categories Pie Chart */}
            <ChartHeader
              variant="section"
              title="Misc Categories: Task by category"
              badges={[
                `${categoryPieTotal} tasks`,
                `${Math.round(categoryPieHours * 10) / 10}h`
              ]}
              color={CARD_SYSTEM.COLOR_HEX_MAP.pink}
            >
              <SimplePieChart
                data={categoryPieData}
                title=""
                colors={categoryPieColors}
                showPercentages={true}
                dataType={CARD_SYSTEM.CHART_DATA_TYPE.PRODUCT}
              />
            </ChartHeader>

            {/* Misc Categories Biaxial Chart */}
            {(() => {
              const totalTasks = categoryBiaxialData?.reduce((sum, item) => sum + (item.tasks || 0), 0) || 0;
              const totalHours = categoryBiaxialData?.reduce((sum, item) => sum + (item.hours || 0), 0) || 0;
              return (
                <ChartHeader
                  variant="section"
                  title="Misc Categories: Tasks & Hours by Category"
                  badges={[
                    `${totalTasks} tasks`,
                    `${totalHours}h`
                  ]}
                  color={CARD_SYSTEM.COLOR_HEX_MAP.pink}
                >
                  <BiaxialBarChart
                    data={categoryBiaxialData}
                    title=""
                    tasksColor={categoryBiaxialTasksColor}
                    hoursColor={categoryBiaxialHoursColor}
                    dataType={CARD_SYSTEM.CHART_DATA_TYPE.PRODUCT}
                  />
                </ChartHeader>
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
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Individual user performance </p>
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
                  <ChartHeader
                    key={`misc-${userChart.userId}`}
                    variant="section"
                    title={userChart.userName}
                    subtitle={`${userChart.category} - Markets`}
                    badges={[
                      `${userChart.totalTasks} tasks`,
                      `${userChart.totalHours}h`
                    ]}
                    color={CARD_SYSTEM.COLOR_HEX_MAP.pink}
                  >
                    <BiaxialBarChart
                      data={userChart.marketData}
                      title=""
                      tasksColor={CHART_COLORS.DEFAULT[0]}
                      hoursColor={CHART_COLORS.DEFAULT[1]}
                      dataType={CARD_SYSTEM.CHART_DATA_TYPE.MARKET}
                      showHours={true}
                    />
                  </ChartHeader>
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

