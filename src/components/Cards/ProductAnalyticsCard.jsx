import React, { memo, useMemo } from "react";
import AnalyticsTable from "@/components/Table/AnalyticsTable";
import SimplePieChart from "@/components/Charts/SimplePieChart";
import BiaxialBarChart from "@/components/Charts/BiaxialBarChart";
import { SkeletonAnalyticsCard } from "@/components/ui/Skeleton/Skeleton";
import ChartHeader from "./ChartHeader";
import { CHART_COLORS, getProductColor } from "./configs/analyticsSharedConfig";
import { CARD_SYSTEM } from "@/constants";
import { Icons } from "@/components/icons";

const ChartIcon = Icons.generic.chart;

const ProductAnalyticsCard = memo(({
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
  productCasinoTotalTasks = 0, // Unique tasks count
  productCasinoMarketsPieColors,
  productCasinoMarketsBiaxialData,
  productCasinoMarketsBiaxialTitle,
  productCasinoMarketsBiaxialTasksColor,
  productCasinoMarketsBiaxialHoursColor,
  productSportMarketsPieData,
  productSportMarketsPieTitle,
  productSportTotalTasks = 0, // Unique tasks count
  productSportMarketsPieColors,
  productSportMarketsBiaxialData,
  productSportMarketsBiaxialTitle,
  productSportMarketsBiaxialTasksColor,
  productSportMarketsBiaxialHoursColor,
  casinoSportPerMarketBiaxialData = [],
  totalCasinoSportBiaxialData = [],
  productUsersCharts,
  totalTasks = 0, // Unique tasks count
  className = "",
  isLoading = false,
}) => {
  if (isLoading) {
    return <SkeletonAnalyticsCard className={className} />;
  }

  // Calculate totals for pie charts
  // Pie chart segments show per category counts, but totals should show unique tasks (not sum of category counts)
  const categoryPieTotal = useMemo(() => {
    // Use unique tasks count from props (totalTasks is already unique tasks)
    return totalTasks || 0;
  }, [totalTasks]);
  const categoryPieHours = useMemo(() => 
    categoryBiaxialData?.reduce((sum, item) => sum + (item.hours || 0), 0) || 0,
    [categoryBiaxialData]
  );
  // Pie chart segments show per market counts (RO: 3, IE: 2, UK: 2)
  // But totals should show unique tasks (3 tasks), not sum of market counts
  const casinoMarketsPieTotal = useMemo(() => {
    // Use unique tasks count from props (productCasinoTotalTasks is already unique tasks)
    return productCasinoTotalTasks || 0;
  }, [productCasinoTotalTasks]);
  
  const casinoMarketsPieHours = useMemo(() => 
    productCasinoMarketsBiaxialData?.reduce((sum, item) => sum + (item.hours || 0), 0) || 0,
    [productCasinoMarketsBiaxialData]
  );
  
  const sportMarketsPieTotal = useMemo(() => {
    // Use unique tasks count from props (productSportTotalTasks is already unique tasks)
    return productSportTotalTasks || 0;
  }, [productSportTotalTasks]);
  
  const sportMarketsPieHours = useMemo(() => 
    productSportMarketsBiaxialData?.reduce((sum, item) => sum + (item.hours || 0), 0) || 0,
    [productSportMarketsBiaxialData]
  );

  const cardColor = CARD_SYSTEM.COLOR_HEX_MAP.amber;

  return (
    <div id="product-analytics-card" className={`space-y-8 ${className}`}>
      {/* Section: Overview Table */}
      <div>
        {productTableData && productTableData.length > 0 ? (
          <AnalyticsTable
            data={productTableData}
            columns={productTableColumns}
            title="Product Statistics"
          />
        ) : (
          <div className="card-small-modern">
            <div className="text-center py-12">
              <Icons.generic.document className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-gray-400 font-medium">No data available</p>
            </div>
          </div>
        )}
      </div>

      {/* Section: Distribution Charts */}
      <div>
        <div className="mb-4">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Distribution Analysis</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">Task distribution by categories and markets</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {/* Product Categories Pie Chart */}
          <ChartHeader
            variant="section"
            title="Categories Distribution"
            badges={[
              `${categoryPieTotal} tasks`,
              `${Math.round(categoryPieHours * 10) / 10}h`
            ]}
            color={cardColor}
            className="group hover:shadow-xl transition-all duration-300"
          >
            <SimplePieChart
              data={categoryPieData}
              title=""
              colors={categoryPieColors}
              showPercentages={true}
              dataType={CARD_SYSTEM.CHART_DATA_TYPE.PRODUCT}
            />
          </ChartHeader>

          {/* Product Casino Markets Pie Chart */}
          <ChartHeader
            variant="section"
            title="Casino Markets"
            badges={[
              `${casinoMarketsPieTotal} tasks`,
              `${Math.round(casinoMarketsPieHours * 10) / 10}h`
            ]}
            color={CARD_SYSTEM.COLOR_HEX_MAP.crimson}
            className="group hover:shadow-xl transition-all duration-300"
          >
            <SimplePieChart
              data={productCasinoMarketsPieData}
              title=""
              colors={productCasinoMarketsPieColors}
              showPercentages={true}
              dataType={CARD_SYSTEM.CHART_DATA_TYPE.MARKET}
            />
          </ChartHeader>

          {/* Product Sport Markets Pie Chart */}
          <ChartHeader
            variant="section"
            title="Sport Markets"
            badges={[
              `${sportMarketsPieTotal} tasks`,
              `${Math.round(sportMarketsPieHours * 10) / 10}h`
            ]}
            color={CARD_SYSTEM.COLOR_HEX_MAP.green}
            className="group hover:shadow-xl transition-all duration-300"
          >
            <SimplePieChart
              data={productSportMarketsPieData}
              title=""
              colors={productSportMarketsPieColors}
              showPercentages={true}
              dataType={CARD_SYSTEM.CHART_DATA_TYPE.MARKET}
            />
          </ChartHeader>
        </div>
      </div>

      {/* Section: Performance Charts */}
      <div>
        <div className="mb-4">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Performance Metrics</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">Tasks and hours  by category and market</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {/* Product Categories Biaxial Chart */}
          {(() => {
            const totalTasks = categoryBiaxialData?.reduce((sum, item) => sum + (item.tasks || 0), 0) || 0;
            const totalHours = categoryBiaxialData?.reduce((sum, item) => sum + (item.hours || 0), 0) || 0;
            return (
              <ChartHeader
                variant="section"
                title="Categories Performance"
                badges={[
                  `${totalTasks} tasks`,
                  `${totalHours}h`
                ]}
                color={cardColor}
                className="group hover:shadow-xl transition-all duration-300"
              >
                <BiaxialBarChart
                  data={categoryBiaxialData}
                  title=""
                  tasksColor={categoryBiaxialTasksColor}
                  hoursColor={categoryBiaxialHoursColor}
                  dataType={CARD_SYSTEM.CHART_DATA_TYPE.PRODUCT}
                  showHours={false}
                />
              </ChartHeader>
            );
          })()}

          {/* Product Casino Markets Biaxial Chart */}
          {(() => {
            // Use unique tasks count (not sum of market counts)
            const totalTasks = productCasinoTotalTasks || 0;
            const totalHours = productCasinoMarketsBiaxialData?.reduce((sum, item) => sum + (item.hours || 0), 0) || 0;
            return (
              <ChartHeader
                variant="section"
                title="Casino Markets Performance"
                badges={[
                  `${totalTasks} tasks`,
                  `${totalHours}h`
                ]}
                color={CARD_SYSTEM.COLOR_HEX_MAP.crimson}
                className="group hover:shadow-xl transition-all duration-300"
              >
                <BiaxialBarChart
                  data={productCasinoMarketsBiaxialData}
                  title=""
                  tasksColor={productCasinoMarketsBiaxialTasksColor}
                  hoursColor={productCasinoMarketsBiaxialHoursColor}
                  dataType={CARD_SYSTEM.CHART_DATA_TYPE.MARKET}
                  showHours={false}
                />
              </ChartHeader>
            );
          })()}

          {/* Product Sport Markets Biaxial Chart */}
          {(() => {
            // Use unique tasks count (not sum of market counts)
            const totalTasks = productSportTotalTasks || 0;
            const totalHours = productSportMarketsBiaxialData?.reduce((sum, item) => sum + (item.hours || 0), 0) || 0;
            return (
              <ChartHeader
                variant="section"
                title="Sport Markets Performance"
                badges={[
                  `${totalTasks} tasks`,
                  `${totalHours}h`
                ]}
                color={CARD_SYSTEM.COLOR_HEX_MAP.green}
                className="group hover:shadow-xl transition-all duration-300"
              >
                <BiaxialBarChart
                  data={productSportMarketsBiaxialData}
                  title=""
                  tasksColor={productSportMarketsBiaxialTasksColor}
                  hoursColor={productSportMarketsBiaxialHoursColor}
                  dataType={CARD_SYSTEM.CHART_DATA_TYPE.MARKET}
                  showHours={false}
                />
              </ChartHeader>
            );
          })()}
        </div>
      </div>

      {/* Section: Comparison Charts */}
      {((casinoSportPerMarketBiaxialData && casinoSportPerMarketBiaxialData.length > 0) || 
        (totalCasinoSportBiaxialData && totalCasinoSportBiaxialData.length > 0)) && (
        <div>
          <div className="mb-4">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Casino vs Sport Comparison</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Comparative analysis between casino and sport products</p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Casino vs Sport: Tasks by Markets */}
            {casinoSportPerMarketBiaxialData && casinoSportPerMarketBiaxialData.length > 0 && (
              <ChartHeader
                variant="section"
                title="By Markets"
                badges={[
                  `${(productCasinoTotalTasks || 0) + (productSportTotalTasks || 0)} total tasks`
                ]}
                color={CARD_SYSTEM.COLOR_HEX_MAP.orange}
                className="group hover:shadow-xl transition-all duration-300"
              >
                <BiaxialBarChart
                  data={casinoSportPerMarketBiaxialData}
                  title=""
                  bars={[
                    { dataKey: 'casino', name: 'Casino', color: '#dc143c' },
                    { dataKey: 'sport', name: 'Sport', color: '#22c55e' }
                  ]}
                  dataType={CARD_SYSTEM.CHART_DATA_TYPE.MARKET}
                />
              </ChartHeader>
            )}

            {/* Total Casino vs Total Sport */}
            {totalCasinoSportBiaxialData && totalCasinoSportBiaxialData.length > 0 && (
              <ChartHeader
                variant="section"
                title="Total Comparison"
                badges={[
                  `${(productCasinoTotalTasks || 0) + (productSportTotalTasks || 0)} total tasks`
                ]}
                color={CARD_SYSTEM.COLOR_HEX_MAP.orange}
                className="group hover:shadow-xl transition-all duration-300"
              >
                <BiaxialBarChart
                  data={totalCasinoSportBiaxialData}
                  title=""
                  bars={[
                    { dataKey: 'casino', name: 'Casino', color: '#dc143c' },
                    { dataKey: 'sport', name: 'Sport', color: '#22c55e' }
                  ]}
                  dataType={CARD_SYSTEM.CHART_DATA_TYPE.PRODUCT}
                />
              </ChartHeader>
            )}
          </div>
        </div>
      )}

      {/* Section: User Analytics */}
      {productUsersCharts && productUsersCharts.length > 0 && (
        <div>
          <div className="mb-4">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">User Analytics</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Individual user performance </p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {productUsersCharts.map((userChart) => (
              <ChartHeader
                key={userChart.userId}
                variant="section"
                title={userChart.userName}
                subtitle="Product Markets"
                badges={[
                  `${userChart.totalTasks} tasks`,
                  `${userChart.totalHours}h`
                ]}
                color={cardColor}
                className="group hover:shadow-xl transition-all duration-300"
              >
                <BiaxialBarChart
                  data={userChart.marketData}
                  title=""
                  tasksColor={CHART_COLORS.DEFAULT[0]}
                  hoursColor={CHART_COLORS.DEFAULT[1]}
                  dataType={CARD_SYSTEM.CHART_DATA_TYPE.MARKET}
                  showHours={true}
                />
              </ChartHeader>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});

ProductAnalyticsCard.displayName = 'ProductAnalyticsCard';

export default ProductAnalyticsCard;
