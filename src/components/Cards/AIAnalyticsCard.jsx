import AnalyticsTable from "@/components/Table/AnalyticsTable";
import SimplePieChart from "@/components/Charts/SimplePieChart";
import BiaxialBarChart from "@/components/Charts/BiaxialBarChart";
import { SkeletonAnalyticsCard } from "@/components/ui/Skeleton/Skeleton";

const AIAnalyticsCard = ({
  title,
  aiTableData,
  aiTableColumns,
  aiModelsData,
  aiModelsTitle,
  aiModelsColors,
  usersAIData,
  usersAITitle,
  usersAIColors,
  usersBiaxialData,
  usersBiaxialTitle,
  usersBiaxialTimeColor,
  usersBiaxialTasksColor,
  marketsAIData,
  marketsAITitle,
  marketsAIColors,
  productsAIData,
  productsAITitle,
  productsAIColors,
  marketsBiaxialData,
  marketsBiaxialTitle,
  marketsBiaxialTasksColor,
  marketsBiaxialTimeColor,
  productsBiaxialData,
  productsBiaxialTitle,
  productsBiaxialTasksColor,
  productsBiaxialTimeColor,
  className = "",
  isLoading = false,
}) => {
  if (isLoading) {
    return <SkeletonAnalyticsCard className={className} />;
  }

  // Check if we have no data
  const hasNoData = aiTableData.length === 1 && aiTableData[0]?.noData;

  return (
    <div id="ai-analytics-card" className={`card-large ${className}`}>
      <h2 className="card-title text-xl mb-6">{title}</h2>

      {/* Grid Container */}
      <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
        {/* AI Usage Statistics Table */}
        <div className="table-container">
          {hasNoData ? (
            <div className="flex items-center justify-center h-32 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="text-center">
                <div className="text-gray-500 dark:text-gray-400 text-lg mb-2">📊</div>
                <p className="text-gray-600 dark:text-gray-300 font-medium">No data available</p>
                <p className="text-gray-500 dark:text-gray-400 text-sm">No AI usage data found for the selected period</p>
              </div>
            </div>
          ) : (
            <AnalyticsTable
              data={aiTableData}
              columns={aiTableColumns}
            />
          )}
        </div>
        
        {/* Charts Container */}
        {hasNoData ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((index) => (
              <div key={index} className="chart-container">
                <div className="flex items-center justify-center h-64 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="text-center">
                    <div className="text-gray-500 dark:text-gray-400 text-2xl mb-2">📊</div>
                    <p className="text-gray-600 dark:text-gray-300 font-medium">No data available</p>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">No chart data to display</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* AI Models Usage Pie Chart */}
            <div className="chart-container">
              <div className="mb-2">
                <span className="text-xs text-gray-600 dark:text-gray-400 bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded">
                  🤖 <strong>AI Models Usage:</strong> Distribution of AI models used
                </span>
              </div>
              <SimplePieChart
                data={aiModelsData}
                title={aiModelsTitle}
                colors={aiModelsColors}
                showPercentages={true}
              />
            </div>

            {/* Users by AI Time Pie Chart */}
            <div className="chart-container">
              <div className="mb-2">
                <span className="text-xs text-gray-600 dark:text-gray-400 bg-green-100 dark:bg-green-900 px-2 py-1 rounded">
                  👥 <strong>Users by AI Time:</strong> AI usage time distribution by user
                </span>
              </div>
              <SimplePieChart
                data={usersAIData}
                title={usersAITitle}
                colors={usersAIColors}
                showPercentages={true}
              />
            </div>

            {/* Markets AI Usage Pie Chart */}
            <div className="chart-container">
              <div className="mb-2">
                <span className="text-xs text-gray-600 dark:text-gray-400 bg-purple-100 dark:bg-purple-900 px-2 py-1 rounded">
                  🌍 <strong>Markets AI Usage:</strong> AI usage distribution by market
                </span>
              </div>
              <SimplePieChart
                data={marketsAIData}
                title={marketsAITitle}
                colors={marketsAIColors}
                showPercentages={true}
              />
            </div>

            {/* Products AI Usage Pie Chart */}
            <div className="chart-container">
              <div className="mb-2">
                <span className="text-xs text-gray-600 dark:text-gray-400 bg-orange-100 dark:bg-orange-900 px-2 py-1 rounded">
                  📦 <strong>Products AI Usage:</strong> AI usage distribution by product
                </span>
              </div>
              <SimplePieChart
                data={productsAIData}
                title={productsAITitle}
                colors={productsAIColors}
                showPercentages={true}
              />
            </div>
          </div>
        )}

        {/* Biaxial Chart Container */}
        {hasNoData ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[1, 2, 3].map((index) => (
              <div key={index} className="chart-container">
                <div className="flex items-center justify-center h-64 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="text-center">
                    <div className="text-gray-500 dark:text-gray-400 text-2xl mb-2">📊</div>
                    <p className="text-gray-600 dark:text-gray-300 font-medium">No data available</p>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">No chart data to display</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Users AI Time vs AI Tasks Biaxial Chart */}
            <div className="chart-container">
              <div className="mb-2">
                <span className="text-xs text-gray-600 dark:text-gray-400 bg-purple-100 dark:bg-purple-900 px-2 py-1 rounded">
                  📊 <strong>Users AI Analysis:</strong> AI time vs AI tasks by user
                </span>
              </div>
              <BiaxialBarChart
                data={usersBiaxialData}
                title={usersBiaxialTitle}
                tasksColor={usersBiaxialTasksColor}
                hoursColor={usersBiaxialTimeColor}
              />
            </div>

            {/* Markets AI Analysis Biaxial Chart */}
            <div className="chart-container">
              <div className="mb-2">
                <span className="text-xs text-gray-600 dark:text-gray-400 bg-indigo-100 dark:bg-indigo-900 px-2 py-1 rounded">
                  🌍 <strong>Markets AI Analysis:</strong> AI time vs AI tasks by market
                </span>
              </div>
              <BiaxialBarChart
                data={marketsBiaxialData}
                title={marketsBiaxialTitle}
                tasksColor={marketsBiaxialTasksColor}
                hoursColor={marketsBiaxialTimeColor}
              />
            </div>

            {/* Products AI Analysis Biaxial Chart */}
            <div className="chart-container">
              <div className="mb-2">
                <span className="text-xs text-gray-600 dark:text-gray-400 bg-teal-100 dark:bg-teal-900 px-2 py-1 rounded">
                  📦 <strong>Products AI Analysis:</strong> AI time vs AI tasks by product
                </span>
              </div>
              <BiaxialBarChart
                data={productsBiaxialData}
                title={productsBiaxialTitle}
                tasksColor={productsBiaxialTasksColor}
                hoursColor={productsBiaxialTimeColor}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIAnalyticsCard;
