import React, { memo } from "react";
import AnalyticsTable from "@/components/Table/AnalyticsTable";
import SimplePieChart from "@/components/Charts/SimplePieChart";
import BiaxialBarChart from "@/components/Charts/BiaxialBarChart";
import { SkeletonAnalyticsCard } from "@/components/ui/Skeleton/Skeleton";
import { CHART_COLORS } from "./configs/analyticsSharedConfig";
import { CARD_SYSTEM } from "@/constants";

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
  casinoUsersCharts,
  sportUsersCharts,
  className = "",
  isLoading = false,
}) => {
  if (isLoading) {
    return <SkeletonAnalyticsCard className={className} />;
  }

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
                sectionTitle="📊 Marketing Statistics"
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
          {/* Casino Marketing Chart */}
          <div className="chart-container">
            <div className="mb-2">
              <span className="text-xs dark:bg-blue-800 px-2 py-1 rounded">
                🎰 <strong>Casino Marketing:</strong> Task by markets
              </span>
            </div>
            <SimplePieChart
              data={casinoMarketingData}
              title={casinoMarketingTitle}
              colors={casinoMarketingColors}
              dataType={CARD_SYSTEM.CHART_DATA_TYPE.MARKET}
            />
          </div>

          {/* Sport Marketing Chart */}
          <div className="chart-container">
            <div className="mb-2">
              <span className="text-xs dark:bg-blue-800 px-2 py-1 rounded">
                ⚽ <strong>Sport Marketing:</strong> Task by markets
              </span>
            </div>
            <SimplePieChart
              data={sportMarketingData}
              title={sportMarketingTitle}
              colors={sportMarketingColors}
              dataType={CARD_SYSTEM.CHART_DATA_TYPE.MARKET}
            />
          </div>
        </div>

        {/* Biaxial Charts Container */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Casino Biaxial Chart */}
          <div className="chart-container">
            <div className="mb-2">
              <span className="text-xs dark:bg-blue-800 px-2 py-1 rounded">
                🎰 <strong>Casino Marketing:</strong> Tasks & Hours by Markets
              </span>
            </div>
            <BiaxialBarChart
              data={casinoBiaxialData}
              title={casinoBiaxialTitle}
              tasksColor={casinoBiaxialTasksColor}
              hoursColor={casinoBiaxialHoursColor}
              dataType={CARD_SYSTEM.CHART_DATA_TYPE.MARKET}
            />
          </div>

          {/* Sport Biaxial Chart */}
          <div className="chart-container">
            <div className="mb-2">
              <span className="text-xs dark:bg-blue-800 px-2 py-1 rounded">
                ⚽ <strong>Sport Marketing:</strong> Tasks & Hours by Markets
              </span>
            </div>
            <BiaxialBarChart
              data={sportBiaxialData}
              title={sportBiaxialTitle}
              tasksColor={sportBiaxialTasksColor}
              hoursColor={sportBiaxialHoursColor}
              dataType={CARD_SYSTEM.CHART_DATA_TYPE.MARKET}
            />
          </div>
        </div>
        </div>

        {/* User Charts Section */}
        <div>
          <h3 className="mb-4 text-lg font-semibold">👥 User Charts</h3>
          
          {/* Casino Marketing: Per-User Charts */}
          <div className="mb-6">
            <h4 className="mb-4 text-md font-medium">🎰 Casino Marketing: Per User</h4>
          {casinoUsersCharts && casinoUsersCharts.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {casinoUsersCharts.map((userChart) => (
                <div key={`casino-${userChart.userId}`} className="chart-container">
                  <div className="mb-2">
                    <span className="text-xs dark:bg-blue-800 px-2 py-1 rounded">
                      👥 <strong>{userChart.userName}:</strong> {userChart.category} - Markets
                    </span>
                  </div>
                  <BiaxialBarChart
                    data={userChart.marketData}
                    title={`${userChart.userName}: ${userChart.category} (${userChart.totalTasks} tasks, ${userChart.totalHours}h)`}
                    tasksColor={CHART_COLORS.DEFAULT[0]}
                    hoursColor={CHART_COLORS.DEFAULT[1]}
                    dataType={CARD_SYSTEM.CHART_DATA_TYPE.MARKET}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="card">
              <div className="text-center py-8">
                <p className="text-gray-500 dark:text-gray-400">No data</p>
              </div>
            </div>
          )}
        </div>

            {/* Sport Marketing: Per-User Charts */}
            <div>
              <h4 className="mb-4 text-md font-medium">⚽ Sport Marketing: Per User</h4>
          {sportUsersCharts && sportUsersCharts.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {sportUsersCharts.map((userChart) => (
                <div key={`sport-${userChart.userId}`} className="chart-container">
                  <div className="mb-2">
                    <span className="text-xs dark:bg-blue-800 px-2 py-1 rounded">
                      👥 <strong>{userChart.userName}:</strong> {userChart.category} - Markets
                    </span>
                  </div>
                  <BiaxialBarChart
                    data={userChart.marketData}
                    title={`${userChart.userName}: ${userChart.category} (${userChart.totalTasks} tasks, ${userChart.totalHours}h)`}
                    tasksColor={CHART_COLORS.DEFAULT[0]}
                    hoursColor={CHART_COLORS.DEFAULT[1]}
                    dataType={CARD_SYSTEM.CHART_DATA_TYPE.MARKET}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="card">
              <div className="text-center py-8">
                <p className="text-gray-500 dark:text-gray-400">No data</p>
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
