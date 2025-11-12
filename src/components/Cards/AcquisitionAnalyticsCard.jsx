import React, { memo, useMemo } from "react";
import AnalyticsTable from "@/components/Table/AnalyticsTable";
import SimplePieChart from "@/components/Charts/SimplePieChart";
import BiaxialBarChart from "@/components/Charts/BiaxialBarChart";
import { SkeletonAnalyticsCard } from "@/components/ui/Skeleton/Skeleton";
import ChartHeader from "./ChartHeader";
import { CHART_COLORS, getProductColor } from "./configs/analyticsSharedConfig";
import { CARD_SYSTEM } from "@/constants";
import { Icons } from "@/components/icons";

const ChartIcon = Icons.generic.chart;

const AcquisitionAnalyticsCard = memo(
  ({
    title = "Acquisition Analytics",
    acquisitionTableData = [],
    acquisitionTableColumns = [],
    casinoAcquisitionData = [],
    casinoAcquisitionTitle = "Casino Acquisition by Markets",
    casinoAcquisitionColors = [],
    sportAcquisitionData = [],
    sportAcquisitionTitle = "Sport Acquisition by Markets",
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
    const casinoAcquisitionPieTotal = useMemo(
      () =>
        casinoAcquisitionData?.reduce(
          (sum, item) => sum + (item.value || 0),
          0
        ) || 0,
      [casinoAcquisitionData]
    );
    const casinoAcquisitionPieHours = useMemo(
      () =>
        casinoBiaxialData?.reduce((sum, item) => sum + (item.hours || 0), 0) ||
        0,
      [casinoBiaxialData]
    );
    const sportAcquisitionPieTotal = useMemo(
      () =>
        sportAcquisitionData?.reduce(
          (sum, item) => sum + (item.value || 0),
          0
        ) || 0,
      [sportAcquisitionData]
    );
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
                sectionTitle=""
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
                sectionTitle=""
              />
            )}

            {/* Sport Acquisition: Per-User Table */}
            {sportUserTableData && sportUserTableData.length > 0 && (
              <AnalyticsTable
                data={sportUserTableData}
                columns={sportUserTableColumns}
                sectionTitle=""
              />
            )}
          </div>

          {/* Sport + Casino: Per-User Table */}
          {sportCasinoUserTableData && sportCasinoUserTableData.length > 0 && (
            <div className="mt-6">
              <AnalyticsTable
                data={sportCasinoUserTableData}
                columns={sportCasinoUserTableColumns}
                sectionTitle=""
              />
            </div>
          )}
        </div>

        {/* Section: Distribution Charts */}
        <div>
          <div className="mb-4">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Distribution Analysis</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Acquisition distribution by markets</p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Casino Acquisition Chart */}
            <div className="card-small-modern group hover:shadow-xl transition-all duration-300">
              <div
                className="absolute top-0 left-0 right-0 h-1 rounded-t-xl"
                style={{
                  background: `linear-gradient(90deg, ${CARD_SYSTEM.COLOR_HEX_MAP.crimson} 0%, ${CARD_SYSTEM.COLOR_HEX_MAP.crimson}cc 50%, ${CARD_SYSTEM.COLOR_HEX_MAP.crimson} 100%)`,
                }}
              />
              <div className="relative z-10">
                <ChartHeader
                  title="Casino Acquisition"
                  badges={[
                    `${casinoAcquisitionPieTotal} tasks`,
                    `${Math.round(casinoAcquisitionPieHours * 10) / 10}h`,
                  ]}
                  color={CARD_SYSTEM.COLOR_HEX_MAP.crimson}
                />
                <div className="px-5 pb-5">
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
                </div>
              </div>
            </div>

            {/* Sport Acquisition Chart */}
            <div className="card-small-modern group hover:shadow-xl transition-all duration-300">
              <div
                className="absolute top-0 left-0 right-0 h-1 rounded-t-xl"
                style={{
                  background: `linear-gradient(90deg, ${CARD_SYSTEM.COLOR_HEX_MAP.green} 0%, ${CARD_SYSTEM.COLOR_HEX_MAP.green}cc 50%, ${CARD_SYSTEM.COLOR_HEX_MAP.green} 100%)`,
                }}
              />
              <div className="relative z-10">
                <ChartHeader
                  title="Sport Acquisition"
                  badges={[
                    `${sportAcquisitionPieTotal} tasks`,
                    `${Math.round(sportAcquisitionPieHours * 10) / 10}h`,
                  ]}
                  color={CARD_SYSTEM.COLOR_HEX_MAP.green}
                />
                <div className="px-5 pb-5">
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
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section: Performance Charts */}
        <div>
          <div className="mb-4">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Performance Metrics</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Tasks and hours by markets</p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Casino Biaxial Chart */}
            {(() => {
              const totalTasks =
                casinoBiaxialData?.reduce(
                  (sum, item) => sum + (item.tasks || 0),
                  0
                ) || 0;
              const totalHours =
                casinoBiaxialData?.reduce(
                  (sum, item) => sum + (item.hours || 0),
                  0
                ) || 0;
              return (
                <div className="card-small-modern group hover:shadow-xl transition-all duration-300">
                  <div
                    className="absolute top-0 left-0 right-0 h-1 rounded-t-xl"
                    style={{
                      background: `linear-gradient(90deg, ${CARD_SYSTEM.COLOR_HEX_MAP.crimson} 0%, ${CARD_SYSTEM.COLOR_HEX_MAP.crimson}cc 50%, ${CARD_SYSTEM.COLOR_HEX_MAP.crimson} 100%)`,
                    }}
                  />
                  <div className="relative z-10">
                    <ChartHeader
                      title="Casino Performance"
                      badges={[`${totalTasks} tasks`, `${totalHours}h`]}
                      color={CARD_SYSTEM.COLOR_HEX_MAP.crimson}
                    />
                    <div className="px-5 pb-5">
                      {casinoBiaxialData && casinoBiaxialData.length > 0 ? (
                        <BiaxialBarChart
                          data={casinoBiaxialData}
                          title=""
                          tasksColor={casinoBiaxialTasksColor}
                          hoursColor={casinoBiaxialHoursColor}
                          dataType={CARD_SYSTEM.CHART_DATA_TYPE.MARKET}
                          showHours={false}
                        />
                      ) : (
                        <div className="text-center py-8">
                          <Icons.generic.document className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-3" />
                          <p className="text-gray-500 dark:text-gray-400 font-medium">No casino biaxial data</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Sport Biaxial Chart */}
            {(() => {
              const totalTasks =
                sportBiaxialData?.reduce(
                  (sum, item) => sum + (item.tasks || 0),
                  0
                ) || 0;
              const totalHours =
                sportBiaxialData?.reduce(
                  (sum, item) => sum + (item.hours || 0),
                  0
                ) || 0;
              return (
                <div className="card-small-modern group hover:shadow-xl transition-all duration-300">
                  <div
                    className="absolute top-0 left-0 right-0 h-1 rounded-t-xl"
                    style={{
                      background: `linear-gradient(90deg, ${CARD_SYSTEM.COLOR_HEX_MAP.green} 0%, ${CARD_SYSTEM.COLOR_HEX_MAP.green}cc 50%, ${CARD_SYSTEM.COLOR_HEX_MAP.green} 100%)`,
                    }}
                  />
                  <div className="relative z-10">
                    <ChartHeader
                      title="Sport Performance"
                      badges={[`${totalTasks} tasks`, `${totalHours}h`]}
                      color={CARD_SYSTEM.COLOR_HEX_MAP.green}
                    />
                    <div className="px-5 pb-5">
                      {sportBiaxialData && sportBiaxialData.length > 0 ? (
                        <BiaxialBarChart
                          data={sportBiaxialData}
                          title=""
                          tasksColor={sportBiaxialTasksColor}
                          hoursColor={sportBiaxialHoursColor}
                          dataType={CARD_SYSTEM.CHART_DATA_TYPE.MARKET}
                          showHours={false}
                        />
                      ) : (
                        <div className="text-center py-8">
                          <Icons.generic.document className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-3" />
                          <p className="text-gray-500 dark:text-gray-400 font-medium">No sport biaxial data</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>

        {/* Section: Comparison Charts */}
        {((casinoSportPerMarketBiaxialData && casinoSportPerMarketBiaxialData.length > 0) || 
          (totalCasinoSportBiaxialData && totalCasinoSportBiaxialData.length > 0)) && (
          <div>
            <div className="mb-4">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Casino vs Sport Comparison</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Comparative analysis between casino and sport acquisition</p>
            </div>
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
                        `${casinoSportPerMarketBiaxialData.reduce((sum, item) => sum + (item.casino || 0) + (item.sport || 0), 0)} total tasks`
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
                      title="Total Comparison"
                      badges={[
                        `${totalCasinoSportBiaxialData.reduce((sum, item) => sum + (item.casino || 0) + (item.sport || 0), 0)} total tasks`
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
          </div>
        )}

      {/* Section: User Analytics */}
      {((casinoUsersCharts && casinoUsersCharts.length > 0) || 
        (sportUsersCharts && sportUsersCharts.length > 0)) && (
        <div>
          <div className="mb-4">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">User Analytics</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Individual user performance</p>
          </div>

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
        </div>
      )}
    </div>
  );
});

AcquisitionAnalyticsCard.displayName = "AcquisitionAnalyticsCard";

export default AcquisitionAnalyticsCard;
