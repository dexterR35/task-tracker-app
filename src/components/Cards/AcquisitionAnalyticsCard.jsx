import React, { memo, useMemo } from "react";
import AnalyticsTable from "@/components/Table/AnalyticsTable";
import SimplePieChart from "@/components/Charts/SimplePieChart";
import BiaxialBarChart from "@/components/Charts/BiaxialBarChart";
import { SkeletonAnalyticsCard } from "@/components/ui/Skeleton/Skeleton";
import ChartHeader from "./ChartHeader";
import { CHART_COLORS, getProductColor } from "./configs/analyticsSharedConfig";
import { CARD_SYSTEM } from "@/constants";
import { Icons } from "@/components/icons";
import CollapsibleSection from "@/components/ui/CollapsibleSection/CollapsibleSection";

const ChartIcon = Icons.generic.chart;

const AcquisitionAnalyticsCard = memo(
  ({
    title = "Acquisition Analytics",
    acquisitionTableData = [],
    acquisitionTableColumns = [],
    casinoAcquisitionData = [],
    casinoAcquisitionTitle = "Casino Acquisition by Markets",
    casinoTotalTasks = 0, // Unique tasks count
    casinoAcquisitionColors = [],
    sportAcquisitionData = [],
    sportAcquisitionTitle = "Sport Acquisition by Markets",
    sportTotalTasks = 0, // Unique tasks count
    sportAcquisitionColors = [],
    casinoBiaxialData = [],
    casinoBiaxialTitle = "Casino Acquisition Tasks & Hours by Markets",
    casinoBiaxialTasksColor,
    casinoBiaxialHoursColor,
    sportBiaxialData = [],
    sportBiaxialTitle = "Sport Acquisition Tasks & Hours by Markets",
    sportBiaxialTasksColor,
    sportBiaxialHoursColor,
    casinoUsersCharts = [],
    sportUsersCharts = [],
    casinoUserTableData = [],
    casinoUserTableColumns = [],
    sportUserTableData = [],
    sportUserTableColumns = [],
    sportCasinoUserTableData = [],
    sportCasinoUserTableColumns = [],
    casinoSportPerMarketBiaxialData = [],
    totalCasinoSportBiaxialData = [],
    className = "",
    isLoading = false,
  }) => {
    if (isLoading) {
      return <SkeletonAnalyticsCard className={className} />;
    }

    // Calculate totals for pie charts
    // Pie chart segments show per market counts (RO: 3, IE: 2, UK: 2)
    // But totals should show unique tasks (3 tasks), not sum of market counts
    const casinoAcquisitionPieTotal = useMemo(() => {
      // Use unique tasks count from props (casinoTotalTasks is already unique tasks)
      return casinoTotalTasks || 0;
    }, [casinoTotalTasks]);
    
    const casinoAcquisitionPieHours = useMemo(
      () =>
        casinoBiaxialData?.reduce((sum, item) => sum + (item.hours || 0), 0) ||
        0,
      [casinoBiaxialData]
    );
    
    const sportAcquisitionPieTotal = useMemo(() => {
      // Use unique tasks count from props (sportTotalTasks is already unique tasks)
      return sportTotalTasks || 0;
    }, [sportTotalTasks]);
    
    const sportAcquisitionPieHours = useMemo(
      () =>
        sportBiaxialData?.reduce((sum, item) => sum + (item.hours || 0), 0) ||
        0,
      [sportBiaxialData]
    );

    const cardColor = CARD_SYSTEM.COLOR_HEX_MAP.orange;

    return (
      <div id="acquisition-analytics-card" className={`space-y-8 ${className}`}>
        {/* Section: Overview Tables */}
        <div>
         
          
          {/* Main Acquisition Table */}
          {acquisitionTableData && acquisitionTableData.length > 0 ? (
            <div className="mb-6">
              <AnalyticsTable
                data={acquisitionTableData}
                columns={acquisitionTableColumns}
                title="Acquisition Statistics"
              />
            </div>
          ) : (
            <div className="card-small-modern mb-6">
              <div className="text-center py-12">
                <Icons.generic.document className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-3" />
                <p className="text-gray-500 dark:text-gray-400 font-medium">No data available</p>
              </div>
            </div>
          )}

          {/* User Tables - One per row */}
          <div className="space-y-6">
            {/* Casino Acquisition: Per-User Table */}
            {casinoUserTableData && casinoUserTableData.length > 0 && (
              <AnalyticsTable
                data={casinoUserTableData}
                columns={casinoUserTableColumns}
                title="Casino: Per User"
              />
            )}

            {/* Sport Acquisition: Per-User Table */}
            {sportUserTableData && sportUserTableData.length > 0 && (
              <AnalyticsTable
                data={sportUserTableData}
                columns={sportUserTableColumns}
                title="Sport: Per User"
              />
            )}
          </div>

          {/* Sport + Casino: Per-User Table */}
          {sportCasinoUserTableData && sportCasinoUserTableData.length > 0 && (
            <div className="mt-6">
              <AnalyticsTable
                data={sportCasinoUserTableData}
                columns={sportCasinoUserTableColumns}
                title="Sport + Casino: Per User"
              />
            </div>
          )}
        </div>

        {/* Section: Distribution Charts */}
        <CollapsibleSection title="Distribution Analysis" defaultOpen={true}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Casino Acquisition Chart */}
            <ChartHeader
              variant="section"
              title="Casino Acquisition"
              badges={[
                `${casinoAcquisitionPieTotal} tasks`,
                `${Math.round(casinoAcquisitionPieHours * 10) / 10}h`,
              ]}
              color={CARD_SYSTEM.COLOR_HEX_MAP.crimson}
              className="group hover:shadow-xl transition-all duration-300"
            >
              {casinoAcquisitionData && casinoAcquisitionData.length > 0 ? (
                <SimplePieChart
                  data={casinoAcquisitionData}
                  title=""
                  colors={casinoAcquisitionColors}
                  dataType={CARD_SYSTEM.CHART_DATA_TYPE.MARKET}
                />
              ) : (
                <div className="text-center py-8">
                  <Icons.generic.document className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-3" />
                  <p className="text-gray-500 dark:text-gray-400 font-medium">No casino acquisition data</p>
                </div>
              )}
            </ChartHeader>

            {/* Sport Acquisition Chart */}
            <ChartHeader
              variant="section"
              title="Sport Acquisition"
              badges={[
                `${sportAcquisitionPieTotal} tasks`,
                `${Math.round(sportAcquisitionPieHours * 10) / 10}h`,
              ]}
              color={CARD_SYSTEM.COLOR_HEX_MAP.green}
              className="group hover:shadow-xl transition-all duration-300"
            >
              {sportAcquisitionData && sportAcquisitionData.length > 0 ? (
                <SimplePieChart
                  data={sportAcquisitionData}
                  title=""
                  colors={sportAcquisitionColors}
                  dataType={CARD_SYSTEM.CHART_DATA_TYPE.MARKET}
                />
              ) : (
                <div className="text-center py-8">
                  <Icons.generic.document className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-3" />
                  <p className="text-gray-500 dark:text-gray-400 font-medium">No sport acquisition data</p>
                </div>
              )}
            </ChartHeader>
          </div>
        </CollapsibleSection>

        {/* Section: Performance Charts */}
        <CollapsibleSection title="Performance Metrics" defaultOpen={true}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Casino Biaxial Chart */}
            {(() => {
              // Use unique tasks count (not sum of market counts)
              const totalTasks = casinoTotalTasks || 0;
              const totalHours =
                casinoBiaxialData?.reduce(
                  (sum, item) => sum + (item.hours || 0),
                  0
                ) || 0;
              return (
                <ChartHeader
                  variant="section"
                  title="Casino Performance"
                  badges={[`${totalTasks} tasks`, `${totalHours}h`]}
                  color={CARD_SYSTEM.COLOR_HEX_MAP.crimson}
                  className="group hover:shadow-xl transition-all duration-300"
                >
                  {casinoBiaxialData && casinoBiaxialData.length > 0 ? (
                    <BiaxialBarChart
                      data={casinoBiaxialData}
                      title=""
                      tasksColor={casinoBiaxialTasksColor}
                      hoursColor={casinoBiaxialHoursColor}
                      dataType={CARD_SYSTEM.CHART_DATA_TYPE.MARKET}
                      showHours={true}
                    />
                  ) : (
                    <div className="text-center py-8">
                      <Icons.generic.document className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-3" />
                      <p className="text-gray-500 dark:text-gray-400 font-medium">No casino biaxial data</p>
                    </div>
                  )}
                </ChartHeader>
              );
            })()}

            {/* Sport Biaxial Chart */}
            {(() => {
              // Use unique tasks count (not sum of market counts)
              const totalTasks = sportTotalTasks || 0;
              const totalHours =
                sportBiaxialData?.reduce(
                  (sum, item) => sum + (item.hours || 0),
                  0
                ) || 0;
              return (
                <ChartHeader
                  variant="section"
                  title="Sport Performance"
                  badges={[`${totalTasks} tasks`, `${totalHours}h`]}
                  color={CARD_SYSTEM.COLOR_HEX_MAP.green}
                  className="group hover:shadow-xl transition-all duration-300"
                >
                  {sportBiaxialData && sportBiaxialData.length > 0 ? (
                    <BiaxialBarChart
                      data={sportBiaxialData}
                      title=""
                      tasksColor={sportBiaxialTasksColor}
                      hoursColor={sportBiaxialHoursColor}
                      dataType={CARD_SYSTEM.CHART_DATA_TYPE.MARKET}
                      showHours={true}
                    />
                  ) : (
                    <div className="text-center py-8">
                      <Icons.generic.document className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-3" />
                      <p className="text-gray-500 dark:text-gray-400 font-medium">No sport biaxial data</p>
                    </div>
                  )}
                </ChartHeader>
              );
            })()}
          </div>
        </CollapsibleSection>

        {/* Section: Charts */}
        {((casinoSportPerMarketBiaxialData && casinoSportPerMarketBiaxialData.length > 0) || 
          (totalCasinoSportBiaxialData && totalCasinoSportBiaxialData.length > 0)) && (
          <CollapsibleSection title="Casino vs Sport" defaultOpen={true}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Casino vs Sport: Tasks by Markets */}
              {casinoSportPerMarketBiaxialData && casinoSportPerMarketBiaxialData.length > 0 && (
                <div className="card-small-modern group hover:shadow-xl transition-all duration-300">
                  <div
                    className="absolute top-0 left-0 right-0 h-1 rounded-t-xl"
                    style={{
                      background: `linear-gradient(90deg, ${cardColor} 0%, ${cardColor}cc 50%, ${cardColor} 100%)`,
                    }}
                  />
                  <div className="relative z-10">
                    <ChartHeader
                      title="By Markets"
                      badges={[
                        `${(casinoTotalTasks || 0) + (sportTotalTasks || 0)} total tasks`
                      ]}
                      color={cardColor}
                    />
                    <div className="px-5 pb-5">
                      <BiaxialBarChart
                        data={casinoSportPerMarketBiaxialData}
                        title=""
                        bars={[
                          { dataKey: 'casino', name: 'Casino', color: '#dc143c' },
                          { dataKey: 'sport', name: 'Sport', color: '#22c55e' }
                        ]}
                        dataType={CARD_SYSTEM.CHART_DATA_TYPE.MARKET}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Total Casino vs Total Sport */}
              {totalCasinoSportBiaxialData && totalCasinoSportBiaxialData.length > 0 && (
                <div className="card-small-modern group hover:shadow-xl transition-all duration-300">
                  <div
                    className="absolute top-0 left-0 right-0 h-1 rounded-t-xl"
                    style={{
                      background: `linear-gradient(90deg, ${cardColor} 0%, ${cardColor}cc 50%, ${cardColor} 100%)`,
                    }}
                  />
                  <div className="relative z-10">
                    <ChartHeader
                      title="Total"
                      badges={[
                        `${(casinoTotalTasks || 0) + (sportTotalTasks || 0)} total tasks`
                      ]}
                      color={cardColor}
                    />
                    <div className="px-5 pb-5">
                      <BiaxialBarChart
                        data={totalCasinoSportBiaxialData}
                        title=""
                        bars={[
                          { dataKey: 'casino', name: 'Casino', color: '#dc143c' },
                          { dataKey: 'sport', name: 'Sport', color: '#22c55e' }
                        ]}
                        dataType={CARD_SYSTEM.CHART_DATA_TYPE.PRODUCT}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CollapsibleSection>
        )}

      {/* Section: User Analytics */}
      {((casinoUsersCharts && casinoUsersCharts.length > 0) || 
        (sportUsersCharts && sportUsersCharts.length > 0)) && (
        <CollapsibleSection title="User Analytics" defaultOpen={true}>
          {/* Casino Acquisition: Per-User Charts */}
          {casinoUsersCharts && casinoUsersCharts.length > 0 && (
            <div className="mb-8">
              <div className="mb-4">
                <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Casino Acquisition: Per User</h4>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {casinoUsersCharts.map((userChart) => (
                  <ChartHeader
                    key={`casino-${userChart.userId}`}
                    variant="section"
                    title={userChart.userName}
                    subtitle={`${userChart.category} - Markets`}
                    badges={[
                      `${userChart.totalTasks} tasks`,
                      `${userChart.totalHours}h`,
                    ]}
                    color={CARD_SYSTEM.COLOR_HEX_MAP.crimson}
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
            </div>
          )}

          {/* Sport Acquisition: Per-User Charts */}
          {sportUsersCharts && sportUsersCharts.length > 0 && (
            <div>
              <div className="mb-4">
                <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Sport Acquisition: Per User</h4>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {sportUsersCharts.map((userChart) => (
                  <ChartHeader
                    key={`sport-${userChart.userId}`}
                    variant="section"
                    title={userChart.userName}
                    subtitle={`${userChart.category} - Markets`}
                    badges={[
                      `${userChart.totalTasks} tasks`,
                      `${userChart.totalHours}h`,
                    ]}
                    color={CARD_SYSTEM.COLOR_HEX_MAP.green}
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
            </div>
          )}
        </CollapsibleSection>
      )}
    </div>
  );
});

AcquisitionAnalyticsCard.displayName = "AcquisitionAnalyticsCard";

export default AcquisitionAnalyticsCard;
