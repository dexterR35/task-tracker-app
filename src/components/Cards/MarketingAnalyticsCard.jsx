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
  casinoMarketingColors,
  sportMarketingData,
  sportMarketingTitle,
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
  const casinoMarketingPieTotal = useMemo(() => 
    casinoMarketingData?.reduce((sum, item) => sum + (item.value || 0), 0) || 0,
    [casinoMarketingData]
  );
  const casinoMarketingPieHours = useMemo(() => 
    casinoBiaxialData?.reduce((sum, item) => sum + (item.hours || 0), 0) || 0,
    [casinoBiaxialData]
  );
  const sportMarketingPieTotal = useMemo(() => 
    sportMarketingData?.reduce((sum, item) => sum + (item.value || 0), 0) || 0,
    [sportMarketingData]
  );
  const sportMarketingPieHours = useMemo(() => 
    sportBiaxialData?.reduce((sum, item) => sum + (item.hours || 0), 0) || 0,
    [sportBiaxialData]
  );

  return (
    <div id="marketing-analytics-card" className={`${className}`}>
      {/* Grid Container */}
      <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
        {/* Tables Section */}
        <div>
          {/* Marketing Table */}
          {marketingTableData && marketingTableData.length > 0 ? (
            <div className="table-container">
              <AnalyticsTable
                data={marketingTableData}
                columns={marketingTableColumns}
                sectionTitle="Marketing Statistics"
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
      
          {/* Charts Container */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Casino Marketing Chart */}
          <div className="group relative bg-white dark:bg-smallCard border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden">
            <ChartHeader
              title="Casino Marketing: Task by markets"
              badges={[
                { value: `${casinoMarketingPieTotal} tasks` },
                { value: `${Math.round(casinoMarketingPieHours * 10) / 10}h` }
              ]}
            />
            <div className="p-5">
              <SimplePieChart
                data={casinoMarketingData}
                title=""
                colors={casinoMarketingColors}
                dataType={CARD_SYSTEM.CHART_DATA_TYPE.MARKET}
              />
            </div>
          </div>

          {/* Sport Marketing Chart */}
          <div className="group relative bg-white dark:bg-smallCard border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden">
            <ChartHeader
              title="Sport Marketing: Task by markets"
              badges={[
                { value: `${sportMarketingPieTotal} tasks` },
                { value: `${Math.round(sportMarketingPieHours * 10) / 10}h` }
              ]}
            />
            <div className="p-5">
              <SimplePieChart
                data={sportMarketingData}
                title=""
                colors={sportMarketingColors}
                dataType={CARD_SYSTEM.CHART_DATA_TYPE.MARKET}
              />
            </div>
          </div>
        </div>

        {/* Biaxial Charts Container */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Casino Biaxial Chart */}
          {(() => {
            const totalTasks = casinoBiaxialData?.reduce((sum, item) => sum + (item.tasks || 0), 0) || 0;
            const totalHours = casinoBiaxialData?.reduce((sum, item) => sum + (item.hours || 0), 0) || 0;
            return (
              <div className="group relative bg-white dark:bg-smallCard border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden">
                <ChartHeader
                  title="Casino Marketing: Tasks & Hours by Markets"
                  badges={[
                    { value: `${totalTasks} tasks` },
                    { value: `${totalHours}h` }
                  ]}
                />
                <div className="p-5">
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
            );
          })()}

          {/* Sport Biaxial Chart */}
          {(() => {
            const totalTasks = sportBiaxialData?.reduce((sum, item) => sum + (item.tasks || 0), 0) || 0;
            const totalHours = sportBiaxialData?.reduce((sum, item) => sum + (item.hours || 0), 0) || 0;
            return (
              <div className="group relative bg-white dark:bg-smallCard border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden">
                <ChartHeader
                  title="Sport Marketing: Tasks & Hours by Markets"
                  badges={[
                    { value: `${totalTasks} tasks` },
                    { value: `${totalHours}h` }
                  ]}
                />
                <div className="p-5">
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
            );
          })()}
        </div>

        {/* Casino vs Sport Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          {/* Casino vs Sport: Tasks by Markets */}
          {casinoSportPerMarketBiaxialData && casinoSportPerMarketBiaxialData.length > 0 && (
            <div className="group relative bg-white dark:bg-smallCard border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden">
              <ChartHeader
                title="Casino vs Sport: Tasks by Markets"
                badges={[
                  `${casinoSportPerMarketBiaxialData.reduce((sum, item) => sum + (item.casino || 0) + (item.sport || 0), 0)} total tasks`
                ]}
              />
              <div className="p-5">
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
          )}

          {/* Total Casino vs Total Sport */}
          {totalCasinoSportBiaxialData && totalCasinoSportBiaxialData.length > 0 && (
            <div className="group relative bg-white dark:bg-smallCard border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden">
              <ChartHeader
                title="Total Casino vs Total Sport"
                badges={[
                  `${totalCasinoSportBiaxialData.reduce((sum, item) => sum + (item.casino || 0) + (item.sport || 0), 0)} total tasks`
                ]}
              />
              <div className="p-5">
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
          )}
        </div>
       

        {/* User Charts Section */}
        <div className="mt-8">
          <div className="mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <span>User Analytics</span>
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Individual user performance breakdown</p>
          </div>
          
          {/* Casino Marketing: Per-User Charts */}
          <div className="mb-8">
            <div className="mb-5">
              <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                <span>Casino Marketing: Per User</span>
              </h4>
            </div>
          {casinoUsersCharts && casinoUsersCharts.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {casinoUsersCharts.map((userChart) => (
                <div 
                  key={`casino-${userChart.userId}`} 
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
                      showHours={true}
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
                <p className="text-gray-500 dark:text-gray-400 font-medium">No casino marketing user data</p>
              </div>
            </div>
          )}
        </div>

            {/* Sport Marketing: Per-User Charts */}
            <div>
              <div className="mb-5">
                <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                  <span>Sport Marketing: Per User</span>
                </h4>
              </div>
          {sportUsersCharts && sportUsersCharts.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {sportUsersCharts.map((userChart) => (
                <div 
                  key={`sport-${userChart.userId}`} 
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
                      showHours={true}
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
                <p className="text-gray-500 dark:text-gray-400 font-medium">No sport marketing user data</p>
              </div>
            </div>
          )}
            </div>
          </div>
      </div>
    </div>
  );
});

MarketingAnalyticsCard.displayName = 'MarketingAnalyticsCard';

export default MarketingAnalyticsCard;
