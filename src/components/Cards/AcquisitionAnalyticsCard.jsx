import React, { memo } from "react";
import AnalyticsTable from "@/components/Table/AnalyticsTable";
import SimplePieChart from "@/components/Charts/SimplePieChart";
import BiaxialBarChart from "@/components/Charts/BiaxialBarChart";
import { SkeletonAnalyticsCard } from "@/components/ui/Skeleton/Skeleton";
import { CHART_COLORS } from "./configs/analyticsSharedConfig";
import { CARD_SYSTEM } from "@/constants";

const AcquisitionAnalyticsCard = memo(({
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
  className = "",
  isLoading = false,
}) => {
  if (isLoading) {
    return <SkeletonAnalyticsCard className={className} />;
  }

  // Validate and ensure props are arrays to prevent errors
  const safeAcquisitionTableData = Array.isArray(acquisitionTableData) ? acquisitionTableData : [];
  const safeCasinoAcquisitionData = Array.isArray(casinoAcquisitionData) ? casinoAcquisitionData : [];
  const safeSportAcquisitionData = Array.isArray(sportAcquisitionData) ? sportAcquisitionData : [];
  const safeCasinoBiaxialData = Array.isArray(casinoBiaxialData) ? casinoBiaxialData : [];
  const safeSportBiaxialData = Array.isArray(sportBiaxialData) ? sportBiaxialData : [];
  const safeCasinoUsersCharts = Array.isArray(casinoUsersCharts) ? casinoUsersCharts : [];
  const safeSportUsersCharts = Array.isArray(sportUsersCharts) ? sportUsersCharts : [];
  const safeCasinoUserTableData = Array.isArray(casinoUserTableData) ? casinoUserTableData : [];
  const safeCasinoUserTableColumns = Array.isArray(casinoUserTableColumns) ? casinoUserTableColumns : [];
  const safeSportUserTableData = Array.isArray(sportUserTableData) ? sportUserTableData : [];
  const safeSportUserTableColumns = Array.isArray(sportUserTableColumns) ? sportUserTableColumns : [];

  return (
    <div id="acquisition-analytics-card" className={`${className}`}>
      {/* Grid Container */}
      <div className="grid grid-cols-1 lg:grid-cols-1 gap-4">
        {/* Tables Section */}
        <div>
          {/* Acquisition Table */}
          {safeAcquisitionTableData && safeAcquisitionTableData.length > 0 ? (
            <div className="table-container mb-6">
              <AnalyticsTable
                data={safeAcquisitionTableData}
                columns={acquisitionTableColumns}
                sectionTitle="📊 Acquisition Table"
              />
            </div>
          ) : (
            <div className="card mb-6">
              <div className="text-center py-8">
                <p className="text-gray-500 dark:text-gray-400">No data</p>
              </div>
            </div>
          )}

          {/* Casino Acquisition: Per-User Table */}
          <div className="mb-6">
          {safeCasinoUserTableData && safeCasinoUserTableData.length > 0 ? (
            <div className="table-container">
              <AnalyticsTable
                data={safeCasinoUserTableData}
                columns={safeCasinoUserTableColumns}
                sectionTitle="🎰 Casino Acquisition: Per User"
              />
            </div>
          ) : (
            <div className="card">
              <div className="text-center py-8">
                <p className="text-gray-500 dark:text-gray-400">No casino acquisition user data</p>
              </div>
            </div>
          )}
        </div>

            {/* Sport Acquisition: Per-User Table */}
            <div className="mb-6">
              {safeSportUserTableData && safeSportUserTableData.length > 0 ? (
                <div className="table-container">
                  <AnalyticsTable
                    data={safeSportUserTableData}
                    columns={safeSportUserTableColumns}
                    sectionTitle="⚽ Sport Acquisition: Per User"
                  />
                </div>
              ) : (
                <div className="card">
                  <div className="text-center py-8">
                    <p className="text-gray-500 dark:text-gray-400">No sport acquisition user data</p>
                  </div>
                </div>
              )}
            </div>
          </div>

        {/* Charts Section */}
        <div>
          <h3 className="mb-4 text-lg font-semibold">📈 Charts</h3>
          
          {/* Pie Charts Container */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Casino Acquisition Chart */}
          <div className="chart-container">
            <div className="mb-2">
              <span className="text-xs dark:bg-blue-800 px-2 py-1 rounded">
                🎰 <strong>Casino Acquisition:</strong> Tasks by markets
              </span>
            </div>
            {safeCasinoAcquisitionData && safeCasinoAcquisitionData.length > 0 ? (
              <SimplePieChart
                data={safeCasinoAcquisitionData}
                title={casinoAcquisitionTitle}
                colors={casinoAcquisitionColors}
                dataType={CARD_SYSTEM.CHART_DATA_TYPE.MARKET}
              />
            ) : (
              <div className="card">
                <div className="text-center py-8">
                  <p className="text-gray-500 dark:text-gray-400">No casino acquisition data</p>
                </div>
              </div>
            )}
          </div>

          {/* Sport Acquisition Chart */}
          <div className="chart-container">
            <div className="mb-2">
              <span className="text-xs dark:bg-blue-800 px-2 py-1 rounded">
                ⚽ <strong>Sport Acquisition:</strong> Tasks by markets
              </span>
            </div>
            {safeSportAcquisitionData && safeSportAcquisitionData.length > 0 ? (
              <SimplePieChart
                data={safeSportAcquisitionData}
                title={sportAcquisitionTitle}
                colors={sportAcquisitionColors}
                dataType={CARD_SYSTEM.CHART_DATA_TYPE.MARKET}
              />
            ) : (
              <div className="card">
                <div className="text-center py-8">
                  <p className="text-gray-500 dark:text-gray-400">No sport acquisition data</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Biaxial Charts Container */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Casino Biaxial Chart */}
          <div className="chart-container">
            <div className="mb-2">
              <span className="text-xs dark:bg-blue-800 px-2 py-1 rounded">
                🎰 <strong>Casino Acquisition:</strong> Tasks & Hours by Markets
              </span>
            </div>
            {safeCasinoBiaxialData && safeCasinoBiaxialData.length > 0 ? (
              <BiaxialBarChart
                data={safeCasinoBiaxialData}
                title={casinoBiaxialTitle}
                tasksColor={casinoBiaxialTasksColor}
                hoursColor={casinoBiaxialHoursColor}
                dataType={CARD_SYSTEM.CHART_DATA_TYPE.MARKET}
              />
            ) : (
              <div className="card">
                <div className="text-center py-8">
                  <p className="text-gray-500 dark:text-gray-400">No casino biaxial data</p>
                </div>
              </div>
            )}
          </div>

          {/* Sport Biaxial Chart */}
          <div className="chart-container">
            <div className="mb-2">
              <span className="text-xs dark:bg-blue-900 px-2 py-1 rounded">
                ⚽ <strong>Sport Acquisition:</strong> Tasks & Hours by Markets
              </span>
            </div>
            {safeSportBiaxialData && safeSportBiaxialData.length > 0 ? (
              <BiaxialBarChart
                data={safeSportBiaxialData}
                title={sportBiaxialTitle}
                tasksColor={sportBiaxialTasksColor}
                hoursColor={sportBiaxialHoursColor}
                dataType={CARD_SYSTEM.CHART_DATA_TYPE.MARKET}
              />
            ) : (
              <div className="card">
                <div className="text-center py-8">
                  <p className="text-gray-500 dark:text-gray-400">No sport biaxial data</p>
                </div>
              </div>
            )}
          </div>
        </div>
        </div>

        {/* User Charts Section */}
        <div>
          <h3 className="mb-4 text-lg font-semibold">👥 User Charts</h3>
          
          {/* Casino Acquisition: Per-User Charts */}
          <div className="mb-6">
            <h4 className="mb-4 text-md font-medium">🎰 Casino Acquisition: Per User</h4>
          {safeCasinoUsersCharts && safeCasinoUsersCharts.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {safeCasinoUsersCharts.map((userChart) => (
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

          {/* Sport Acquisition: Per-User Charts */}
          <div>
            <h4 className="mb-4 text-md font-medium">⚽ Sport Acquisition: Per User</h4>
            {safeSportUsersCharts && safeSportUsersCharts.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {safeSportUsersCharts.map((userChart) => (
                  <div key={`sport-${userChart.userId}`} className="chart-container">
                    <div className="mb-2">
                      <span className="text-xs dark:bg-blue-900 px-2 py-1 rounded">
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

AcquisitionAnalyticsCard.displayName = 'AcquisitionAnalyticsCard';

export default AcquisitionAnalyticsCard;
