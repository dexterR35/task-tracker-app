import AnalyticsTable from "@/components/Table/AnalyticsTable";
import SimplePieChart from "@/components/Charts/SimplePieChart";
import ProductColumnChart from "@/components/Charts/ProductColumnChart";
import { SkeletonAnalyticsCard } from "@/components/ui/Skeleton/Skeleton";

const ProductAnalyticsCard = ({
  title,
  productTableData,
  productTableColumns,
  productPieData,
  productPieTitle,
  productPieColors,
  productBarData,
  productBarTitle,
  productBarColors,
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
            title="Product Statistics"
          />
        </div>
        
        {/* Charts Container */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Product Distribution Pie Chart */}
          <div className="chart-container">
            <div className="mb-2">
              <span className="text-xs text-gray-600 dark:text-gray-400 bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded">
                📊 <strong>Product Distribution:</strong> Task distribution across products
              </span>
            </div>
            <SimplePieChart
              data={productPieData}
              title={productPieTitle}
              colors={productPieColors}
              showPercentages={true}
            />
          </div>

          {/* Product Tasks Bar Chart */}
          <div className="chart-container">
            <div className="mb-2">
              <span className="text-xs text-gray-600 dark:text-gray-400 bg-green-100 dark:bg-green-900 px-2 py-1 rounded">
                📈 <strong>Product Tasks:</strong> Task counts by product
              </span>
            </div>
            <ProductColumnChart
              data={productBarData}
              title={productBarTitle}
              colors={productBarColors}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductAnalyticsCard;
