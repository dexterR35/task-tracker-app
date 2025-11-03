import AnalyticsTable from "@/components/Table/AnalyticsTable";
import SimplePieChart from "@/components/Charts/SimplePieChart";
import BiaxialBarChart from "@/components/Charts/BiaxialBarChart";
import { SkeletonAnalyticsCard } from "@/components/ui/Skeleton/Skeleton";
import { CHART_COLORS } from "./configs/analyticsSharedConfig";
import { CARD_SYSTEM } from "@/constants";

const AcquisitionAnalyticsCard = ({
  title,
  acquisitionTableData,
  acquisitionTableColumns,
  casinoAcquisitionData,
  casinoAcquisitionTitle,
  casinoAcquisitionColors,
  sportAcquisitionData,
  sportAcquisitionTitle,
  sportAcquisitionColors,
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
    <div id="acquisition-analytics-card" className={`${className}`}>
      <h3>{title}</h3>

      {/* Grid Container */}
      <div className="grid grid-cols-1 lg:grid-cols-1 gap-4">
        {/* Acquisition Table */}
        {acquisitionTableData && acquisitionTableData.length > 0 ? (
          <div className="table-container">
            <AnalyticsTable
              data={acquisitionTableData}
              columns={acquisitionTableColumns}
            />
          </div>
        ) : (
          <div className="card">
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400">No data</p>
            </div>
          </div>
        )}
        {/* Charts Container */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Casino Acquisition Chart */}
          <div className="chart-container">
            <div className="mb-2">
              <span className="text-xs dark:bg-blue-800 px-2 py-1 rounded">
                🎰 <strong>Casino Acquisition:</strong> Tasks by markets
              </span>
            </div>
            <SimplePieChart
              data={casinoAcquisitionData}
              title={casinoAcquisitionTitle}
              colors={casinoAcquisitionColors}
              dataType={CARD_SYSTEM.CHART_DATA_TYPE.MARKET}
            />
          </div>

          {/* Sport Acquisition Chart */}
          <div className="chart-container">
            <div className="mb-2">
              <span className="text-xs dark:bg-blue-800 px-2 py-1 rounded">
                ⚽ <strong>Sport Acquisition:</strong> Tasks by markets
              </span>
            </div>
            <SimplePieChart
              data={sportAcquisitionData}
              title={sportAcquisitionTitle}
              colors={sportAcquisitionColors}
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
                🎰 <strong>Casino Acquisition:</strong> Tasks & Hours by Markets
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
              <span className="text-xs dark:bg-blue-900 px-2 py-1 rounded">
                ⚽ <strong>Sport Acquisition:</strong> Tasks & Hours by Markets
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

        {/* Casino Acquisition: Per-User Charts */}
        <div>
          <h3 className=" mb-6">🎰 Casino Acquisition: Per User</h3>
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

        {/* Sport Acquisition: Per-User Charts */}
        <div>
          <h3 className=" mb-6">⚽ Sport Acquisition: Per User</h3>
          {sportUsersCharts && sportUsersCharts.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {sportUsersCharts.map((userChart) => (
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
  );
};

export default AcquisitionAnalyticsCard;
