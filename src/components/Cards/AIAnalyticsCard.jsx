import AnalyticsTable from "@/components/Table/AnalyticsTable";
import SimplePieChart from "@/components/Charts/SimplePieChart";
import BiaxialBarChart from "@/components/Charts/BiaxialBarChart";
import { SkeletonAnalyticsCard } from "@/components/ui/Skeleton/Skeleton";
import { CARD_SYSTEM } from "@/constants";

const AIAnalyticsCard = ({
  title,
  aiTableData,
  aiTableColumns,
  aiModelsData,
  aiModelsTitle,
  aiModelsColors,
  aiModelsBiaxialData,
  aiModelsBiaxialTitle,
  aiModelsBiaxialTasksColor,
  aiModelsBiaxialHoursColor,
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

  return (
    <div id="ai-analytics-card" className={`${className}`}>
      <h3>{title}</h3>
      {/* Grid Container */}
      <div className="grid grid-cols-1 lg:grid-cols-1 gap-4">
        {/* AI Usage Statistics Table */}
        {aiTableData && aiTableData.length > 0 ? (
          <div className="table-container">
            <AnalyticsTable
              data={aiTableData}
              columns={aiTableColumns}
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
          {/* Left Column: Products */}
          <div className="space-y-6">
            {/* Products AI Usage Pie Chart */}
            <div className="chart-container">
              <div className="mb-2">
                <span className="text-xs dark:bg-blue-800 px-2 py-1 rounded">
                  📦 <strong>Products AI:</strong> AI usage by product
                </span>
              </div>
              <SimplePieChart
                data={productsAIData}
                title={productsAITitle}
                colors={productsAIColors}
                showPercentages={true}
                dataType={CARD_SYSTEM.CHART_DATA_TYPE.PRODUCT}
              />
            </div>

            {/* Products AI Analysis Biaxial Chart - Below pie chart */}
            <div className="chart-container">
              <div className="mb-2">
                <span className="text-xs dark:bg-blue-800 px-2 py-1 rounded">
                  📦 <strong>Products AI:</strong> AI Time vs AI Tasks by product
                </span>
              </div>
              <BiaxialBarChart
                data={productsBiaxialData}
                title={productsBiaxialTitle}
                tasksColor={productsBiaxialTasksColor}
                hoursColor={productsBiaxialTimeColor}
                dataType={CARD_SYSTEM.CHART_DATA_TYPE.PRODUCT}
              />
            </div>
          </div>

          {/* Right Column: Markets */}
          <div className="space-y-6">
            {/* Markets AI Usage Pie Chart */}
            <div className="chart-container">
              <div className="mb-2">
                <span className="text-xs dark:bg-blue-800 px-2 py-1 rounded">
                  🌍 <strong>Markets AI:</strong> AI usage by market
                </span>
              </div>
              <SimplePieChart
                data={marketsAIData}
                title={marketsAITitle}
                colors={marketsAIColors}
                showPercentages={true}
                dataType={CARD_SYSTEM.CHART_DATA_TYPE.MARKET}
              />
            </div>

            {/* Markets AI Analysis Biaxial Chart - Below pie chart */}
            <div className="chart-container">
              <div className="mb-2">
                <span className="text-xs dark:bg-blue-800 px-2 py-1 rounded">
                  🌍 <strong>Markets AI:</strong> AI Time vs AI Tasks by market
                </span>
              </div>
              <BiaxialBarChart
                data={marketsBiaxialData}
                title={marketsBiaxialTitle}
                tasksColor={marketsBiaxialTasksColor}
                hoursColor={marketsBiaxialTimeColor}
                dataType={CARD_SYSTEM.CHART_DATA_TYPE.MARKET}
              />
            </div>
          </div>

          {/* AI Models Section - Pie chart with biaxial below */}
          <div className="space-y-6">
            {/* AI Models Usage Pie Chart */}
            <div className="chart-container">
              <div className="mb-2">
                <span className="text-xs dark:bg-blue-800 px-2 py-1 rounded">
                  🤖 <strong>AI Models:</strong> Distribution of AI models used
                </span>
              </div>
              <SimplePieChart
                data={aiModelsData}
                title={aiModelsTitle}
                colors={aiModelsColors}
                showPercentages={true}
                dataType={CARD_SYSTEM.CHART_DATA_TYPE.AI_MODEL}
              />
            </div>

            {/* AI Models Biaxial Chart - Below pie chart */}
            <div className="chart-container">
              <div className="mb-2">
                <span className="text-xs dark:bg-blue-800 px-2 py-1 rounded">
                  🤖 <strong>AI Models:</strong> AI Time vs AI Tasks by model
                </span>
              </div>
              <BiaxialBarChart
                data={aiModelsBiaxialData}
                title={aiModelsBiaxialTitle}
                tasksColor={aiModelsBiaxialTasksColor}
                hoursColor={aiModelsBiaxialHoursColor}
                dataType={CARD_SYSTEM.CHART_DATA_TYPE.AI_MODEL}
              />
            </div>
          </div>

          {/* Users Section - Pie chart with biaxial below */}
          <div className="space-y-6">
            {/* Users by AI Time Pie Chart */}
            <div className="chart-container">
              <div className="mb-2">
                <span className="text-xs dark:bg-blue-800 px-2 py-1 rounded">
                  👥 <strong> AI Time:</strong> AI usage time by user
                </span>
              </div>
              <SimplePieChart
                data={usersAIData}
                title={usersAITitle}
                colors={usersAIColors}
                showPercentages={true}
                dataType={CARD_SYSTEM.CHART_DATA_TYPE.USER}
              />
            </div>

            {/* Users AI Time vs AI Tasks Biaxial Chart - Below pie chart */}
            <div className="chart-container">
              <div className="mb-2">
                <span className="text-xs dark:bg-blue-800 px-2 py-1 rounded">
                  📊 <strong>Users AI:</strong> AI time vs AI tasks by user
                </span>
              </div>
              <BiaxialBarChart
                data={usersBiaxialData}
                title={usersBiaxialTitle}
                tasksColor={usersBiaxialTasksColor}
                hoursColor={usersBiaxialTimeColor}
                dataType={CARD_SYSTEM.CHART_DATA_TYPE.USER}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIAnalyticsCard;