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
    <div id="product-analytics-card" className={` ${className}`}>
      <h3>{title}</h3>

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
            <span className="text-xs dark:bg-blue-800 px-2 py-1 rounded">
                📊 <strong>Product Categories:</strong> Task by category
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
            <span className="text-xs dark:bg-blue-800 px-2 py-1 rounded">
                📊 <strong>Individual Products:</strong> Task by product
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
            <span className="text-xs dark:bg-blue-800 px-2 py-1 rounded">
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
            <span className="text-xs dark:bg-blue-800 px-2 py-1 rounded">
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
