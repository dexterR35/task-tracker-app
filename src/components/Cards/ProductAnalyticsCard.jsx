import AnalyticsTable from "@/components/Table/AnalyticsTable";
import SimplePieChart from "@/components/Charts/SimplePieChart";
import BiaxialBarChart from "@/components/Charts/BiaxialBarChart";
import { SkeletonAnalyticsCard } from "@/components/ui/Skeleton/Skeleton";
import { CHART_COLORS } from "./configs/analyticsSharedConfig";
import { CARD_SYSTEM } from "@/constants";

const ProductAnalyticsCard = ({
  title,
  productTableData,
  productTableColumns,
  categoryPieData,
  categoryPieTitle,
  categoryPieColors,
  productPieData,
  productPieTitle,
  productPieColors,
  categoryBiaxialData,
  categoryBiaxialTitle,
  categoryBiaxialTasksColor,
  categoryBiaxialHoursColor,
  productBiaxialData,
  productBiaxialTitle,
  productBiaxialTasksColor,
  productBiaxialHoursColor,
  productCasinoMarketsPieData,
  productCasinoMarketsPieTitle,
  productCasinoMarketsPieColors,
  productCasinoMarketsBiaxialData,
  productCasinoMarketsBiaxialTitle,
  productCasinoMarketsBiaxialTasksColor,
  productCasinoMarketsBiaxialHoursColor,
  productSportMarketsPieData,
  productSportMarketsPieTitle,
  productSportMarketsPieColors,
  productSportMarketsBiaxialData,
  productSportMarketsBiaxialTitle,
  productSportMarketsBiaxialTasksColor,
  productSportMarketsBiaxialHoursColor,
  productUsersCharts,
  className = "",
  isLoading = false,
}) => {
  if (isLoading) {
    return <SkeletonAnalyticsCard className={className} />;
  }

  return (
    <div id="product-analytics-card" className={`${className}`}>
      <h3>{title}</h3>

      {/* Grid Container */}
      <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
        {/* Product Statistics Table */}
        {productTableData && productTableData.length > 0 ? (
          <div className="table-container">
            <AnalyticsTable
              data={productTableData}
              columns={productTableColumns}
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
          {/* Product Categories Pie Chart */}
          <div className="chart-container">
            <div className="mb-2">
              <span className="text-xs dark:bg-blue-800 px-2 py-1 rounded">
                📊 <strong>Product Categories:</strong> Task by category
              </span>
            </div>
            <SimplePieChart
              data={categoryPieData}
              title={categoryPieTitle}
              colors={categoryPieColors}
              showPercentages={true}
              dataType={CARD_SYSTEM.CHART_DATA_TYPE.PRODUCT}
            />
          </div>

          {/* Individual Products Pie Chart */}
          <div className="chart-container">
            <div className="mb-2">
              <span className="text-xs dark:bg-blue-800 px-2 py-1 rounded">
                📊 <strong>Individual Products:</strong> Task by product
              </span>
            </div>
            <SimplePieChart
              data={productPieData}
              title={productPieTitle}
              colors={productPieColors}
              showPercentages={true}
              dataType={CARD_SYSTEM.CHART_DATA_TYPE.PRODUCT}
            />
          </div>
        </div>

        {/* Biaxial Charts Container */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Product Categories Biaxial Chart */}
          <div className="chart-container">
            <div className="mb-2">
              <span className="text-xs dark:bg-blue-800 px-2 py-1 rounded">
                📊 <strong>Product Categories:</strong> Tasks & Hours by Category
              </span>
            </div>
            <BiaxialBarChart
              data={categoryBiaxialData}
              title={categoryBiaxialTitle}
              tasksColor={categoryBiaxialTasksColor}
              hoursColor={categoryBiaxialHoursColor}
              dataType={CARD_SYSTEM.CHART_DATA_TYPE.PRODUCT}
            />
          </div>

          {/* Individual Products Biaxial Chart */}
          <div className="chart-container">
            <div className="mb-2">
              <span className="text-xs dark:bg-blue-800 px-2 py-1 rounded">
                📊 <strong>Individual Products:</strong> Tasks & Hours by Product
              </span>
            </div>
            <BiaxialBarChart
              data={productBiaxialData}
              title={productBiaxialTitle}
              tasksColor={productBiaxialTasksColor}
              hoursColor={productBiaxialHoursColor}
              dataType={CARD_SYSTEM.CHART_DATA_TYPE.PRODUCT}
            />
          </div>
        </div>

        {/* Product Casino Markets Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Product Casino Markets Pie Chart */}
          <div className="chart-container">
            <div className="mb-2">
              <span className="text-xs dark:bg-blue-800 px-2 py-1 rounded">
                🎰 <strong>Product Casino:</strong> Markets Distribution
              </span>
            </div>
            <SimplePieChart
              data={productCasinoMarketsPieData}
              title={productCasinoMarketsPieTitle}
              colors={productCasinoMarketsPieColors}
              showPercentages={true}
              dataType={CARD_SYSTEM.CHART_DATA_TYPE.MARKET}
            />
          </div>

          {/* Product Casino Markets Biaxial Chart */}
          <div className="chart-container">
            <div className="mb-2">
              <span className="text-xs dark:bg-blue-800 px-2 py-1 rounded">
                🎰 <strong>Product Casino:</strong> Markets Tasks & Hours
              </span>
            </div>
            <BiaxialBarChart
              data={productCasinoMarketsBiaxialData}
              title={productCasinoMarketsBiaxialTitle}
              tasksColor={productCasinoMarketsBiaxialTasksColor}
              hoursColor={productCasinoMarketsBiaxialHoursColor}
              dataType={CARD_SYSTEM.CHART_DATA_TYPE.MARKET}
            />
          </div>
        </div>

        {/* Product Sport Markets Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Product Sport Markets Pie Chart */}
          <div className="chart-container">
            <div className="mb-2">
              <span className="text-xs dark:bg-blue-800 px-2 py-1 rounded">
                ⚽ <strong>Product Sport:</strong> Markets Distribution
              </span>
            </div>
            <SimplePieChart
              data={productSportMarketsPieData}
              title={productSportMarketsPieTitle}
              colors={productSportMarketsPieColors}
              showPercentages={true}
              dataType={CARD_SYSTEM.CHART_DATA_TYPE.MARKET}
            />
          </div>

          {/* Product Sport Markets Biaxial Chart */}
          <div className="chart-container">
            <div className="mb-2">
              <span className="text-xs dark:bg-blue-800 px-2 py-1 rounded">
                ⚽ <strong>Product Sport:</strong> Markets Tasks & Hours
              </span>
            </div>
            <BiaxialBarChart
              data={productSportMarketsBiaxialData}
              title={productSportMarketsBiaxialTitle}
              tasksColor={productSportMarketsBiaxialTasksColor}
              hoursColor={productSportMarketsBiaxialHoursColor}
              dataType={CARD_SYSTEM.CHART_DATA_TYPE.MARKET}
            />
          </div>
        </div>

        {/* Product Analytics: Per-User Charts */}
        <div>
          <h3 className="mb-6" >📊 Product Analytics: Per User</h3>
          {productUsersCharts && productUsersCharts.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {productUsersCharts.map((userChart) => (
                <div key={userChart.userId} className="chart-container">
                  <div className="mb-2">
                    <span className="text-xs dark:bg-blue-800 px-2 py-1 rounded">
                      👥 <strong>{userChart.userName}:</strong> Markets
                    </span>
                  </div>
                  <BiaxialBarChart
                    data={userChart.marketData}
                    title={`${userChart.userName}: Product Markets (${userChart.totalTasks} tasks, ${userChart.totalHours}h)`}
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

export default ProductAnalyticsCard;
