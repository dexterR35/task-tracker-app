import AnalyticsTable from "@/components/Table/AnalyticsTable";
import SimplePieChart from "@/components/Charts/SimplePieChart";
import BiaxialBarChart from "@/components/Charts/BiaxialBarChart";
import { SkeletonAnalyticsCard } from "@/components/ui/Skeleton/Skeleton";

const MarketingAnalyticsCard = ({
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
  className = "",
  isLoading = false,
}) => {
  if (isLoading) {
    return <SkeletonAnalyticsCard className={className} />;
  }

  return (
    <div id="marketing-analytics-card" className={`${className} `}>
      <h3>{title}</h3>

      {/* Grid Container */}
      <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
        {/* Marketing Table */}
        <div className="table-container">
          <AnalyticsTable
            data={marketingTableData}
            columns={marketingTableColumns}
          />
        </div>
  
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
              dataType="market"
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
              dataType="market"
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
              dataType="market"
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
              dataType="market"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarketingAnalyticsCard;
