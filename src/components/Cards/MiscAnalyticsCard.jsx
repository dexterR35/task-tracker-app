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
import CollapsibleSection from "@/components/ui/CollapsibleSection/CollapsibleSection";

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
  totalTasks = 0, // Unique tasks count
  miscUsersCharts = [],
  className = "",
  isLoading = false,
}) => {
  if (isLoading) {
    return <SkeletonAnalyticsCard className={className} />;
  }

  // Calculate totals for pie charts
  // Pie chart segments show per category counts, but totals should show unique tasks (not sum of category counts)
  const categoryPieTotal = useMemo(() => {
    // Use unique tasks count from props (totalTasks is already unique tasks)
    return totalTasks || 0;
  }, [totalTasks]);
  
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
        <CollapsibleSection title="Misc Categories Charts" defaultOpen={true}>
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
              // Use unique tasks count (not sum of category counts)
              const biaxialTotalTasks = totalTasks || 0;
              const totalHours = categoryBiaxialData?.reduce((sum, item) => sum + (item.hours || 0), 0) || 0;
              return (
                <ChartHeader
                  variant="section"
                  title="Misc Categories: Tasks & Hours by Category"
                  badges={[
                    `${biaxialTotalTasks} tasks`,
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
        </CollapsibleSection>

        {/* User Charts Section */}
        {miscUsersCharts && miscUsersCharts.length > 0 && (
          <CollapsibleSection title="User Analytics" defaultOpen={true} className="mt-8">
            {/* Misc: Per-User Charts */}
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
          </CollapsibleSection>
        )}
      </div>
    </div>
  );
});

MiscAnalyticsCard.displayName = 'MiscAnalyticsCard';

export default MiscAnalyticsCard;

