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
  casinoSportPerMarketBiaxialData = [],
  totalCasinoSportBiaxialData = [],
  productUsersCharts,
  className = "",
  isLoading = false,
}) => {
  if (isLoading) {
    return <SkeletonAnalyticsCard className={className} />;
  }

  // Calculate totals for pie charts
  const categoryPieTotal = useMemo(() => 
    categoryPieData?.reduce((sum, item) => sum + (item.value || 0), 0) || 0,
    [categoryPieData]
  );
  const categoryPieHours = useMemo(() => 
    categoryBiaxialData?.reduce((sum, item) => sum + (item.hours || 0), 0) || 0,
    [categoryBiaxialData]
  );
  const casinoMarketsPieTotal = useMemo(() => 
    productCasinoMarketsPieData?.reduce((sum, item) => sum + (item.value || 0), 0) || 0,
    [productCasinoMarketsPieData]
  );
  const casinoMarketsPieHours = useMemo(() => 
    productCasinoMarketsBiaxialData?.reduce((sum, item) => sum + (item.hours || 0), 0) || 0,
    [productCasinoMarketsBiaxialData]
  );
  const sportMarketsPieTotal = useMemo(() => 
    productSportMarketsPieData?.reduce((sum, item) => sum + (item.value || 0), 0) || 0,
    [productSportMarketsPieData]
  );
  const sportMarketsPieHours = useMemo(() => 
    productSportMarketsBiaxialData?.reduce((sum, item) => sum + (item.hours || 0), 0) || 0,
    [productSportMarketsBiaxialData]
  );

  return (
    <div id="product-analytics-card" className={`${className}`}>
      {/* Grid Container */}
      <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
        {/* Tables Section */}
        <div>
          {/* Product Statistics Table */}
          {productTableData && productTableData.length > 0 ? (
            <div className="table-container">
              <AnalyticsTable
                data={productTableData}
                columns={productTableColumns}
                sectionTitle="Product Statistics"
              />
            </div>
          ) : (
            <div className="card">
              <div className="text-center py-8">
                <p className="text-gray-500 dark:text-gray-400">No data</p>
              </div>
            </div>
          )}
        </div>
        
        {/* Charts Section */}
      
          {/* Pie Charts Container - All pie charts together */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Product Categories Pie Chart */}
          <div className="group relative bg-white dark:bg-smallCard border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden">
            <ChartHeader
              title="Product Categories: Task by category"
              badges={[
                `${categoryPieTotal} tasks`,
                `${Math.round(categoryPieHours * 10) / 10}h`
              ]}
            />
            <div className="p-5">
              <SimplePieChart
                data={categoryPieData}
                title=""
                colors={categoryPieColors}
                showPercentages={true}
                dataType={CARD_SYSTEM.CHART_DATA_TYPE.PRODUCT}
              />
            </div>
          </div>

          {/* Product Casino Markets Pie Chart */}
          <div className="group relative bg-white dark:bg-smallCard border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden">
            <ChartHeader
              title="Product Casino: Markets Distribution"
              badges={[
                `${casinoMarketsPieTotal} tasks`,
                `${Math.round(casinoMarketsPieHours * 10) / 10}h`
              ]}
            />
            <div className="p-5">
              <SimplePieChart
                data={productCasinoMarketsPieData}
                title=""
                colors={productCasinoMarketsPieColors}
                showPercentages={true}
                dataType={CARD_SYSTEM.CHART_DATA_TYPE.MARKET}
              />
            </div>
          </div>

          {/* Product Sport Markets Pie Chart */}
          <div className="group relative bg-white dark:bg-smallCard border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden">
            <ChartHeader
              title="Product Sport: Markets Distribution"
              badges={[
                `${sportMarketsPieTotal} tasks`,
                `${Math.round(sportMarketsPieHours * 10) / 10}h`
              ]}
            />
            <div className="p-5">
              <SimplePieChart
                data={productSportMarketsPieData}
                title=""
                colors={productSportMarketsPieColors}
                showPercentages={true}
                dataType={CARD_SYSTEM.CHART_DATA_TYPE.MARKET}
              />
            </div>
          </div>
        </div>

        {/* Biaxial Charts Container - All biaxial charts together */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Product Categories Biaxial Chart */}
          {(() => {
            const totalTasks = categoryBiaxialData?.reduce((sum, item) => sum + (item.tasks || 0), 0) || 0;
            const totalHours = categoryBiaxialData?.reduce((sum, item) => sum + (item.hours || 0), 0) || 0;
            return (
              <div className="group relative bg-white dark:bg-smallCard border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden">
                <ChartHeader
                  title="Product Categories: Tasks & Hours by Category"
                  badges={[
                    `${totalTasks} tasks`,
                    `${totalHours}h`
                  ]}
                />
                <div className="p-5">
                  <BiaxialBarChart
                    data={categoryBiaxialData}
                    title=""
                    tasksColor={categoryBiaxialTasksColor}
                    hoursColor={categoryBiaxialHoursColor}
                    dataType={CARD_SYSTEM.CHART_DATA_TYPE.PRODUCT}
                    showHours={false}
                  />
                </div>
              </div>
            );
          })()}

          {/* Product Casino Markets Biaxial Chart */}
          {(() => {
            const totalTasks = productCasinoMarketsBiaxialData?.reduce((sum, item) => sum + (item.tasks || 0), 0) || 0;
            const totalHours = productCasinoMarketsBiaxialData?.reduce((sum, item) => sum + (item.hours || 0), 0) || 0;
            return (
              <div className="group relative bg-white dark:bg-smallCard border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden">
                <ChartHeader
                  title="Product Casino: Markets Tasks & Hours"
                  badges={[
                    `${totalTasks} tasks`,
                    `${totalHours}h`
                  ]}
                />
                <div className="p-5">
                  <BiaxialBarChart
                    data={productCasinoMarketsBiaxialData}
                    title=""
                    tasksColor={productCasinoMarketsBiaxialTasksColor}
                    hoursColor={productCasinoMarketsBiaxialHoursColor}
                    dataType={CARD_SYSTEM.CHART_DATA_TYPE.MARKET}
                    showHours={false}
                  />
                </div>
              </div>
            );
          })()}

          {/* Product Sport Markets Biaxial Chart */}
          {(() => {
            const totalTasks = productSportMarketsBiaxialData?.reduce((sum, item) => sum + (item.tasks || 0), 0) || 0;
            const totalHours = productSportMarketsBiaxialData?.reduce((sum, item) => sum + (item.hours || 0), 0) || 0;
            return (
              <div className="group relative bg-white dark:bg-smallCard border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden">
                <ChartHeader
                  title="Product Sport: Markets Tasks & Hours"
                  badges={[
                    `${totalTasks} tasks`,
                    `${totalHours}h`
                  ]}
                />
                <div className="p-5">
                  <BiaxialBarChart
                    data={productSportMarketsBiaxialData}
                    title=""
                    tasksColor={productSportMarketsBiaxialTasksColor}
                    hoursColor={productSportMarketsBiaxialHoursColor}
                    dataType={CARD_SYSTEM.CHART_DATA_TYPE.MARKET}
                    showHours={false}
                  />
                </div>
              </div>
            );
          })()}
        </div>

        {/* Casino vs Sport Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          {/* Casino vs Sport: Tasks by Markets */}
          {casinoSportPerMarketBiaxialData && casinoSportPerMarketBiaxialData.length > 0 && (
            <div className="group relative bg-white dark:bg-smallCard border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden">
              <ChartHeader
                title="Casino vs Sport: Tasks by Markets"
                badges={[
                  `${casinoSportPerMarketBiaxialData.reduce((sum, item) => sum + (item.casino || 0) + (item.sport || 0), 0)} total tasks`
                ]}
              />
              <div className="p-5">
                <BiaxialBarChart
                  data={casinoSportPerMarketBiaxialData}
                  title=""
                  bars={[
                    { dataKey: 'casino', name: 'Casino', color: getProductColor('product casino') },
                    { dataKey: 'sport', name: 'Sport', color: getProductColor('product sport') }
                  ]}
                  dataType={CARD_SYSTEM.CHART_DATA_TYPE.MARKET}
                />
              </div>
            </div>
          )}

          {/* Total Casino vs Total Sport */}
          {totalCasinoSportBiaxialData && totalCasinoSportBiaxialData.length > 0 && (
            <div className="group relative bg-white dark:bg-smallCard border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden">
              <ChartHeader
                title="Total Casino vs Total Sport"
                badges={[
                  `${totalCasinoSportBiaxialData.reduce((sum, item) => sum + (item.casino || 0) + (item.sport || 0), 0)} total tasks`
                ]}
              />
              <div className="p-5">
                <BiaxialBarChart
                  data={totalCasinoSportBiaxialData}
                  title=""
                  bars={[
                    { dataKey: 'casino', name: 'Casino', color: '#dc143c' }, // Crimson
                    { dataKey: 'sport', name: 'Sport', color: '#22c55e' } // Green
                  ]}
                  dataType={CARD_SYSTEM.CHART_DATA_TYPE.PRODUCT}
                />
              </div>
            </div>
          )}
        </div>
       

        {/* User Charts Section */}
        <div className="mt-8">
          <div className="mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <span>User Analytics</span>
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Individual user performancesss breakdown</p>
          </div>
          
          {/* Product Analytics: Per-User Charts */}
          <div className="mb-8">
            <div className="mb-5">
              <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                <span>Product Analytics: Per User</span>
              </h4>
            </div>
          {productUsersCharts && productUsersCharts.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {productUsersCharts.map((userChart) => (
                <div 
                  key={userChart.userId} 
                  className="group relative bg-white dark:bg-smallCard border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden"
                >
                  <ChartHeader
                    title={userChart.userName}
                    subtitle="Product Markets"
                    badges={[
                      `${userChart.totalTasks} tasks`,
                      `${userChart.totalHours}h`
                    ]}
                  />
                  
                  {/* Chart Container */}
                  <div className="p-5">
                    <BiaxialBarChart
                      data={userChart.marketData}
                      title=""
                      tasksColor={CHART_COLORS.DEFAULT[0]}
                      hoursColor={CHART_COLORS.DEFAULT[1]}
                      dataType={CARD_SYSTEM.CHART_DATA_TYPE.MARKET}
                      showHours={true}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="card rounded-xl">
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                </div>
                <p className="text-gray-500 dark:text-gray-400 font-medium">No user data available</p>
              </div>
            </div>
          )}
          </div>
        </div>
      </div>
    </div>
  );
});

ProductAnalyticsCard.displayName = 'ProductAnalyticsCard';

export default ProductAnalyticsCard;
