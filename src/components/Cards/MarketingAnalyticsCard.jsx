import AnalyticsTable from "@/components/Table/AnalyticsTable";
import SimplePieChart from "@/components/Charts/SimplePieChart";
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
  className = "",
  isLoading = false,
}) => {
  if (isLoading) {
    return <SkeletonAnalyticsCard className={className} />;
  }

  return (
    <div id="marketing-analytics-card" className={`card-large ${className} `}>
      <h2 className="card-title text-xl mb-6">{title}</h2>

      {/* Grid Container */}
      <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
        {/* Marketing Table */}
        <div className="table-container">
          <AnalyticsTable
            data={marketingTableData}
            columns={marketingTableColumns}
            title="Marketing by Markets"
          />
        </div>
        <hr className="my-4 border-gray-200 dark:border-gray-700" />
        {/* Charts Container */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Casino Marketing Chart */}
          <div className="chart-container">
            <div className="mb-2">
              <span className="text-xs text-gray-600 dark:text-gray-400 bg-purple-100 dark:bg-purple-900 px-2 py-1 rounded">
                🎰 <strong>Casino Marketing:</strong> Task distribution across markets
              </span>
            </div>
            <SimplePieChart
              data={casinoMarketingData}
              title={casinoMarketingTitle}
              colors={casinoMarketingColors}
            />
          </div>

          {/* Sport Marketing Chart */}
          <div className="chart-container">
            <div className="mb-2">
              <span className="text-xs text-gray-600 dark:text-gray-400 bg-green-100 dark:bg-green-900 px-2 py-1 rounded">
                ⚽ <strong>Sport Marketing:</strong> Task distribution across markets
              </span>
            </div>
            <SimplePieChart
              data={sportMarketingData}
              title={sportMarketingTitle}
              colors={sportMarketingColors}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarketingAnalyticsCard;
