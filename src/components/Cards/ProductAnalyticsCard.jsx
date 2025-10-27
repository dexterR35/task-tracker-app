import AnalyticsTable from "@/components/Table/AnalyticsTable";
import SimplePieChart from "@/components/Charts/SimplePieChart";
import BiaxialBarChart from "@/components/Charts/BiaxialBarChart";
import { SkeletonAnalyticsCard } from "@/components/ui/Skeleton/Skeleton";

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
  className = "",
  isLoading = false,
}) => {
  if (isLoading) {
    return <SkeletonAnalyticsCard className={className} />;
  }

  return (
    <div id="product-analytics-card" className={`card-large ${className}`}>
      <h2 className="card-title text-xl mb-6">{title}</h2>

      {/* Grid Container */}
      <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
        {/* Product Statistics Table */}
        <div className="table-container">
          <AnalyticsTable
            data={productTableData}
            columns={productTableColumns}
          />
        </div>
        
        {/* Charts Container */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Product Categories Pie Chart */}
          <div className="chart-container">
            <div className="mb-2">
              <span className="text-xs text-gray-600 dark:text-gray-400 bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded">
                📊 <strong>Product Categories:</strong> Task distribution by category
              </span>
            </div>
            <SimplePieChart
              data={categoryPieData}
              title={categoryPieTitle}
              colors={categoryPieColors}
              showPercentages={true}
              dataType="product"
            />
          </div>

          {/* Individual Products Pie Chart */}
          <div className="chart-container">
            <div className="mb-2">
              <span className="text-xs text-gray-600 dark:text-gray-400 bg-green-100 dark:bg-green-900 px-2 py-1 rounded">
                📊 <strong>Individual Products:</strong> Task distribution by product
              </span>
            </div>
            <SimplePieChart
              data={productPieData}
              title={productPieTitle}
              colors={productPieColors}
              showPercentages={true}
              dataType="product"
            />
          </div>
        </div>

        {/* Biaxial Charts Container */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Product Categories Biaxial Chart */}
          <div className="chart-container">
            <div className="mb-2">
              <span className="text-xs text-gray-600 dark:text-gray-400 bg-purple-100 dark:bg-purple-900 px-2 py-1 rounded">
                📊 <strong>Product Categories:</strong> Tasks & Hours by Category
              </span>
            </div>
            <BiaxialBarChart
              data={categoryBiaxialData}
              title={categoryBiaxialTitle}
              tasksColor={categoryBiaxialTasksColor}
              hoursColor={categoryBiaxialHoursColor}
              dataType="product"
            />
          </div>

          {/* Individual Products Biaxial Chart */}
          <div className="chart-container">
            <div className="mb-2">
              <span className="text-xs text-gray-600 dark:text-gray-400 bg-orange-100 dark:bg-orange-900 px-2 py-1 rounded">
                📊 <strong>Individual Products:</strong> Tasks & Hours by Product
              </span>
            </div>
            <BiaxialBarChart
              data={productBiaxialData}
              title={productBiaxialTitle}
              tasksColor={productBiaxialTasksColor}
              hoursColor={productBiaxialHoursColor}
              dataType="product"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductAnalyticsCard;
