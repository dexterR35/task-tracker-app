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

const MarketingAnalyticsCard = memo(({
  title,
  marketingTableData,
  marketingTableColumns,
  casinoMarketingData,
  casinoMarketingTitle,
  casinoTotalTasks = 0, // Unique tasks count
  casinoMarketingColors,
  sportMarketingData,
  sportMarketingTitle,
  sportTotalTasks = 0, // Unique tasks count
  sportMarketingColors,
  casinoBiaxialData,
  casinoBiaxialTitle,
  casinoBiaxialTasksColor,
  casinoBiaxialHoursColor,
  sportBiaxialData,
  sportBiaxialTitle,
  sportBiaxialTasksColor,
  sportBiaxialHoursColor,
  casinoSportPerMarketBiaxialData = [],
  totalCasinoSportBiaxialData = [],
  casinoUsersCharts,
  sportUsersCharts,
  className = "",
  isLoading = false,
}) => {
  if (isLoading) {
    return <SkeletonAnalyticsCard className={className} />;
  }

  // Calculate totals for pie charts
  // Pie chart segments show per market counts (RO: 3, IE: 2, UK: 2)
  // But totals should show unique tasks (3 tasks), not sum of market counts
  const casinoMarketingPieTotal = useMemo(() => {
    // Use unique tasks count from props (casinoTotalTasks is already unique tasks)
    return casinoTotalTasks || 0;
  }, [casinoTotalTasks]);
  
  const casinoMarketingPieHours = useMemo(() => 
    casinoBiaxialData?.reduce((sum, item) => sum + (item.hours || 0), 0) || 0,
    [casinoBiaxialData]
  );
  
  const sportMarketingPieTotal = useMemo(() => {
    // Use unique tasks count from props (sportTotalTasks is already unique tasks)
    return sportTotalTasks || 0;
  }, [sportTotalTasks]);
  
  const sportMarketingPieHours = useMemo(() => 
    sportBiaxialData?.reduce((sum, item) => sum + (item.hours || 0), 0) || 0,
    [sportBiaxialData]
  );

  return (
    <div id="marketing-analytics-card" className={`space-y-8 ${className}`}>
      {/* Section: Overview Table */}
      <div>
      
        <div>
          {/* Marketing Table */}
          {marketingTableData && marketingTableData.length > 0 ? (
            <AnalyticsTable
              data={marketingTableData}
              columns={marketingTableColumns}
              title="Marketing Statistics"
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
      </div>

      {/* Section: Distribution Charts */}
      <div>
        <div className="mb-4">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Distribution Analysis</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">Task distribution by markets</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Casino Marketing Chart */}
          <div className="card-small-modern group hover:shadow-xl transition-all duration-300">
            {/* Accent border on top */}
            <div
              className="absolute top-0 left-0 right-0 h-1 rounded-t-xl"
              style={{
                background: `linear-gradient(90deg, ${CARD_SYSTEM.COLOR_HEX_MAP.purple} 0%, ${CARD_SYSTEM.COLOR_HEX_MAP.purple}cc 50%, ${CARD_SYSTEM.COLOR_HEX_MAP.purple} 100%)`,
              }}
            />
            <div className="relative z-10">
              <ChartHeader
                title="Casino Marketing: by markets"
                badges={[
                  { value: `${casinoMarketingPieTotal} tasks` },
                  { value: `${Math.round(casinoMarketingPieHours * 10) / 10}h` }
                ]}
                color={CARD_SYSTEM.COLOR_HEX_MAP.purple}
              />
              <div className="px-5 pb-5">
                <SimplePieChart
                  data={casinoMarketingData}
                  title=""
                  colors={casinoMarketingColors}
                  dataType={CARD_SYSTEM.CHART_DATA_TYPE.MARKET}
                />
              </div>
            </div>
          </div>

          {/* Sport Marketing Chart */}
          <div className="card-small-modern group hover:shadow-xl transition-all duration-300">
            {/* Accent border on top */}
            <div
              className="absolute top-0 left-0 right-0 h-1 rounded-t-xl"
              style={{
                background: `linear-gradient(90deg, ${CARD_SYSTEM.COLOR_HEX_MAP.green} 0%, ${CARD_SYSTEM.COLOR_HEX_MAP.green}cc 50%, ${CARD_SYSTEM.COLOR_HEX_MAP.green} 100%)`,
              }}
            />
            <div className="relative z-10">
              <ChartHeader
                title="Sport Marketing: by markets"
                badges={[
                  { value: `${sportMarketingPieTotal} tasks` },
                  { value: `${Math.round(sportMarketingPieHours * 10) / 10}h` }
                ]}
                color={CARD_SYSTEM.COLOR_HEX_MAP.green}
              />
              <div className="px-5 pb-5">
                <SimplePieChart
                  data={sportMarketingData}
                  title=""
                  colors={sportMarketingColors}
                  dataType={CARD_SYSTEM.CHART_DATA_TYPE.MARKET}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Section: Performance Charts */}
      <div>
        <div className="mb-4">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Performance Metrics</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">Tasks and hours breakdown by markets</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Casino Biaxial Chart */}
          {(() => {
            // Use unique tasks count (not sum of market counts)
            const totalTasks = casinoTotalTasks || 0;
            const totalHours = casinoBiaxialData?.reduce((sum, item) => sum + (item.hours || 0), 0) || 0;
            return (
              <div className="card-small-modern group hover:shadow-xl transition-all duration-300">
                {/* Accent border on top */}
                <div
                  className="absolute top-0 left-0 right-0 h-1 rounded-t-xl"
                  style={{
                    background: `linear-gradient(90deg, ${CARD_SYSTEM.COLOR_HEX_MAP.purple} 0%, ${CARD_SYSTEM.COLOR_HEX_MAP.purple}cc 50%, ${CARD_SYSTEM.COLOR_HEX_MAP.purple} 100%)`,
                  }}
                />
                <div className="relative z-10">
                  <ChartHeader
                    title="Casino Marketing: Hours by Markets"
                    badges={[
                      { value: `${totalTasks} tasks` },
                      { value: `${totalHours}h` }
                    ]}
                    color={CARD_SYSTEM.COLOR_HEX_MAP.purple}
                  />
                  <div className="px-5 pb-5">
                    <BiaxialBarChart
                      data={casinoBiaxialData}
                      title=""
                      tasksColor={casinoBiaxialTasksColor}
                      hoursColor={casinoBiaxialHoursColor}
                      dataType={CARD_SYSTEM.CHART_DATA_TYPE.MARKET}
                      showHours={false}
                    />
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Sport Biaxial Chart */}
          {(() => {
            // Use unique tasks count (not sum of market counts)
            const totalTasks = sportTotalTasks || 0;
            const totalHours = sportBiaxialData?.reduce((sum, item) => sum + (item.hours || 0), 0) || 0;
            return (
              <div className="card-small-modern group hover:shadow-xl transition-all duration-300">
                {/* Accent border on top */}
                <div
                  className="absolute top-0 left-0 right-0 h-1 rounded-t-xl"
                  style={{
                    background: `linear-gradient(90deg, ${CARD_SYSTEM.COLOR_HEX_MAP.green} 0%, ${CARD_SYSTEM.COLOR_HEX_MAP.green}cc 50%, ${CARD_SYSTEM.COLOR_HEX_MAP.green} 100%)`,
                  }}
                />
                <div className="relative z-10">
                  <ChartHeader
                    title="Sport Marketing: Hours by Markets"
                    badges={[
                      { value: `${totalTasks} tasks` },
                      { value: `${totalHours}h` }
                    ]}
                    color={CARD_SYSTEM.COLOR_HEX_MAP.green}
                  />
                  <div className="px-5 pb-5">
                    <BiaxialBarChart
                      data={sportBiaxialData}
                      title=""
                      tasksColor={sportBiaxialTasksColor}
                      hoursColor={sportBiaxialHoursColor}
                      dataType={CARD_SYSTEM.CHART_DATA_TYPE.MARKET}
                      showHours={false}
                    />
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
            <p className="text-sm text-gray-500 dark:text-gray-400">Comparative analysis between casino and sport marketing</p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Casino vs Sport: by Markets */}
          {casinoSportPerMarketBiaxialData && casinoSportPerMarketBiaxialData.length > 0 && (
            <div className="card-small-modern group hover:shadow-xl transition-all duration-300">
              {/* Accent border on top */}
              <div
                className="absolute top-0 left-0 right-0 h-1 rounded-t-xl"
                style={{
                  background: `linear-gradient(90deg, ${CARD_SYSTEM.COLOR_HEX_MAP.orange} 0%, ${CARD_SYSTEM.COLOR_HEX_MAP.orange}cc 50%, ${CARD_SYSTEM.COLOR_HEX_MAP.orange} 100%)`,
                }}
              />
              <div className="relative z-10">
                <ChartHeader
                  title="Casino vs Sport: by Markets"
                  badges={[
                    `${(casinoTotalTasks || 0) + (sportTotalTasks || 0)} total tasks`
                  ]}
                  color={CARD_SYSTEM.COLOR_HEX_MAP.orange}
                />
                <div className="px-5 pb-5">
                  <BiaxialBarChart
                    data={casinoSportPerMarketBiaxialData}
                    title=""
                    bars={[
                      { dataKey: 'casino', name: 'Casino', color: '#dc143c' }, // Crimson
                      { dataKey: 'sport', name: 'Sport', color: '#22c55e' } // Green
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
              {/* Accent border on top */}
              <div
                className="absolute top-0 left-0 right-0 h-1 rounded-t-xl"
                style={{
                  background: `linear-gradient(90deg, ${CARD_SYSTEM.COLOR_HEX_MAP.orange} 0%, ${CARD_SYSTEM.COLOR_HEX_MAP.orange}cc 50%, ${CARD_SYSTEM.COLOR_HEX_MAP.orange} 100%)`,
                }}
              />
              <div className="relative z-10">
                <ChartHeader
                  title="Total Casino vs Total Sport"
                  badges={[
                    `${(casinoTotalTasks || 0) + (sportTotalTasks || 0)} total tasks`
                  ]}
                  color={CARD_SYSTEM.COLOR_HEX_MAP.orange}
                />
                <div className="px-5 pb-5">
                  <BiaxialBarChart
                    data={totalCasinoSportBiaxialData}
                    title=""
                    bars={[
                      { dataKey: 'casino', name: 'Casino', color: '#dc143c' }, // Crimson
                      { dataKey: 'sport', name: 'Sport', color: '#22c55e' } // Green
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
      <div>
        <div className="mb-4">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">User Analytics</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">Individual user performance </p>
        </div>
          
        {/* Casino Marketing: Per-User Charts */}
        <div className="mb-8">
          <div className="mb-4">
            <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Casino Marketing: Per User</h4>
          </div>
          {casinoUsersCharts && casinoUsersCharts.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {casinoUsersCharts.map((userChart) => (
                <div 
                  key={`casino-${userChart.userId}`} 
                  className="card-small-modern group hover:shadow-xl transition-all duration-300"
                >
                  {/* Accent border on top */}
                  <div
                    className="absolute top-0 left-0 right-0 h-1 rounded-t-xl"
                    style={{
                      background: `linear-gradient(90deg, ${CARD_SYSTEM.COLOR_HEX_MAP.purple} 0%, ${CARD_SYSTEM.COLOR_HEX_MAP.purple}cc 50%, ${CARD_SYSTEM.COLOR_HEX_MAP.purple} 100%)`,
                    }}
                  />
                  <div className="relative z-10 px-5 pt-4">
                    <ChartHeader
                      title={userChart.userName}
                      subtitle={`${userChart.category} - Markets`}
                      badges={[
                        `${userChart.totalTasks} tasks`,
                        `${userChart.totalHours}h`
                      ]}
                      color={CARD_SYSTEM.COLOR_HEX_MAP.purple}
                      className="!px-0 !py-0"
                    />
                    
                    {/* Chart Container */}
                    <div className="pb-5">
                      <BiaxialBarChart
                        data={userChart.marketData}
                        title=""
                        tasksColor={CHART_COLORS.DEFAULT[0]}
                        hoursColor={CHART_COLORS.DEFAULT[1]}
                        dataType={CARD_SYSTEM.CHART_DATA_TYPE.MARKET}
                        showHours={true}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="card-small-modern">
              <div className="text-center py-12">
                <Icons.generic.document className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-3" />
                <p className="text-gray-500 dark:text-gray-400 font-medium">No casino marketing user data</p>
              </div>
            </div>
          )}
        </div>

        {/* Sport Marketing: Per-User Charts */}
        <div>
          <div className="mb-4">
            <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Sport Marketing: Per User</h4>
          </div>
          {sportUsersCharts && sportUsersCharts.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {sportUsersCharts.map((userChart) => (
                <div 
                  key={`sport-${userChart.userId}`} 
                  className="card-small-modern group hover:shadow-xl transition-all duration-300"
                >
                  {/* Accent border on top */}
                  <div
                    className="absolute top-0 left-0 right-0 h-1 rounded-t-xl"
                    style={{
                      background: `linear-gradient(90deg, ${CARD_SYSTEM.COLOR_HEX_MAP.green} 0%, ${CARD_SYSTEM.COLOR_HEX_MAP.green}cc 50%, ${CARD_SYSTEM.COLOR_HEX_MAP.green} 100%)`,
                    }}
                  />
                  <div className="relative z-10 px-5 pt-4">
                    <ChartHeader
                      title={userChart.userName}
                      subtitle={`${userChart.category} - Markets`}
                      badges={[
                        `${userChart.totalTasks} tasks`,
                        `${userChart.totalHours}h`
                      ]}
                      color={CARD_SYSTEM.COLOR_HEX_MAP.green}
                      className="!px-0 !py-0"
                    />
                    
                    {/* Chart Container */}
                    <div className="pb-5">
                      <BiaxialBarChart
                        data={userChart.marketData}
                        title=""
                        tasksColor={CHART_COLORS.DEFAULT[0]}
                        hoursColor={CHART_COLORS.DEFAULT[1]}
                        dataType={CARD_SYSTEM.CHART_DATA_TYPE.MARKET}
                        showHours={true}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="card-small-modern">
              <div className="text-center py-12">
                <Icons.generic.document className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-3" />
                <p className="text-gray-500 dark:text-gray-400 font-medium">No sport marketing user data</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

MarketingAnalyticsCard.displayName = 'MarketingAnalyticsCard';

export default MarketingAnalyticsCard;
