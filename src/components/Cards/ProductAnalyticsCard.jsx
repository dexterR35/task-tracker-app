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

  const cardColor = CARD_SYSTEM.COLOR_HEX_MAP.amber;

  return (
    <div id="product-analytics-card" className={`space-y-8 ${className}`}>
      {/* Section: Overview Table */}
      <div>
  
        {productTableData && productTableData.length > 0 ? (
          <div className="card-small-modern">
            {/* Accent border on top */}
            <div
              className="absolute top-0 left-0 right-0 h-1 rounded-t-xl"
              style={{
                background: `linear-gradient(90deg, ${cardColor} 0%, ${cardColor}cc 50%, ${cardColor} 100%)`,
              }}
            />
            <div className="relative z-10 p-5">
              <AnalyticsTable
                data={productTableData}
                columns={productTableColumns}
                sectionTitle=""
              />
            </div>
          </div>
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
          <div className="card-small-modern group hover:shadow-xl transition-all duration-300">
            <div
              className="absolute top-0 left-0 right-0 h-1 rounded-t-xl"
              style={{
                background: `linear-gradient(90deg, ${cardColor} 0%, ${cardColor}cc 50%, ${cardColor} 100%)`,
              }}
            />
            <div className="relative z-10">
              <ChartHeader
                title="Categories Distribution"
                badges={[
                  `${categoryPieTotal} tasks`,
                  `${Math.round(categoryPieHours * 10) / 10}h`
                ]}
                color={cardColor}
              />
              <div className="px-5 pb-5">
                <SimplePieChart
                  data={categoryPieData}
                  title=""
                  colors={categoryPieColors}
                  showPercentages={true}
                  dataType={CARD_SYSTEM.CHART_DATA_TYPE.PRODUCT}
                />
              </div>
            </div>
          </div>

          {/* Product Casino Markets Pie Chart */}
          <div className="card-small-modern group hover:shadow-xl transition-all duration-300">
            <div
              className="absolute top-0 left-0 right-0 h-1 rounded-t-xl"
              style={{
                background: `linear-gradient(90deg, ${CARD_SYSTEM.COLOR_HEX_MAP.crimson} 0%, ${CARD_SYSTEM.COLOR_HEX_MAP.crimson}cc 50%, ${CARD_SYSTEM.COLOR_HEX_MAP.crimson} 100%)`,
              }}
            />
            <div className="relative z-10">
              <ChartHeader
                title="Casino Markets"
                badges={[
                  `${casinoMarketsPieTotal} tasks`,
                  `${Math.round(casinoMarketsPieHours * 10) / 10}h`
                ]}
                color={CARD_SYSTEM.COLOR_HEX_MAP.crimson}
              />
              <div className="px-5 pb-5">
                <SimplePieChart
                  data={productCasinoMarketsPieData}
                  title=""
                  colors={productCasinoMarketsPieColors}
                  showPercentages={true}
                  dataType={CARD_SYSTEM.CHART_DATA_TYPE.MARKET}
                />
              </div>
            </div>
          </div>

          {/* Product Sport Markets Pie Chart */}
          <div className="card-small-modern group hover:shadow-xl transition-all duration-300">
            <div
              className="absolute top-0 left-0 right-0 h-1 rounded-t-xl"
              style={{
                background: `linear-gradient(90deg, ${CARD_SYSTEM.COLOR_HEX_MAP.green} 0%, ${CARD_SYSTEM.COLOR_HEX_MAP.green}cc 50%, ${CARD_SYSTEM.COLOR_HEX_MAP.green} 100%)`,
              }}
            />
            <div className="relative z-10">
              <ChartHeader
                title="Sport Markets"
                badges={[
                  `${sportMarketsPieTotal} tasks`,
                  `${Math.round(sportMarketsPieHours * 10) / 10}h`
                ]}
                color={CARD_SYSTEM.COLOR_HEX_MAP.green}
              />
              <div className="px-5 pb-5">
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
              <div className="card-small-modern group hover:shadow-xl transition-all duration-300">
                <div
                  className="absolute top-0 left-0 right-0 h-1 rounded-t-xl"
                  style={{
                    background: `linear-gradient(90deg, ${cardColor} 0%, ${cardColor}cc 50%, ${cardColor} 100%)`,
                  }}
                />
                <div className="relative z-10">
                  <ChartHeader
                    title="Categories Performance"
                    badges={[
                      `${totalTasks} tasks`,
                      `${totalHours}h`
                    ]}
                    color={cardColor}
                  />
                  <div className="px-5 pb-5">
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
              </div>
            );
          })()}

          {/* Product Casino Markets Biaxial Chart */}
          {(() => {
            const totalTasks = productCasinoMarketsBiaxialData?.reduce((sum, item) => sum + (item.tasks || 0), 0) || 0;
            const totalHours = productCasinoMarketsBiaxialData?.reduce((sum, item) => sum + (item.hours || 0), 0) || 0;
            return (
              <div className="card-small-modern group hover:shadow-xl transition-all duration-300">
                <div
                  className="absolute top-0 left-0 right-0 h-1 rounded-t-xl"
                  style={{
                    background: `linear-gradient(90deg, ${CARD_SYSTEM.COLOR_HEX_MAP.crimson} 0%, ${CARD_SYSTEM.COLOR_HEX_MAP.crimson}cc 50%, ${CARD_SYSTEM.COLOR_HEX_MAP.crimson} 100%)`,
                  }}
                />
                <div className="relative z-10">
                  <ChartHeader
                    title="Casino Markets Performance"
                    badges={[
                      `${totalTasks} tasks`,
                      `${totalHours}h`
                    ]}
                    color={CARD_SYSTEM.COLOR_HEX_MAP.crimson}
                  />
                  <div className="px-5 pb-5">
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
              </div>
            );
          })()}

          {/* Product Sport Markets Biaxial Chart */}
          {(() => {
            const totalTasks = productSportMarketsBiaxialData?.reduce((sum, item) => sum + (item.tasks || 0), 0) || 0;
            const totalHours = productSportMarketsBiaxialData?.reduce((sum, item) => sum + (item.hours || 0), 0) || 0;
            return (
              <div className="card-small-modern group hover:shadow-xl transition-all duration-300">
                <div
                  className="absolute top-0 left-0 right-0 h-1 rounded-t-xl"
                  style={{
                    background: `linear-gradient(90deg, ${CARD_SYSTEM.COLOR_HEX_MAP.green} 0%, ${CARD_SYSTEM.COLOR_HEX_MAP.green}cc 50%, ${CARD_SYSTEM.COLOR_HEX_MAP.green} 100%)`,
                  }}
                />
                <div className="relative z-10">
                  <ChartHeader
                    title="Sport Markets Performance"
                    badges={[
                      `${totalTasks} tasks`,
                      `${totalHours}h`
                    ]}
                    color={CARD_SYSTEM.COLOR_HEX_MAP.green}
                  />
                  <div className="px-5 pb-5">
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
              </div>
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
              <div className="card-small-modern group hover:shadow-xl transition-all duration-300">
                <div
                  className="absolute top-0 left-0 right-0 h-1 rounded-t-xl"
                  style={{
                    background: `linear-gradient(90deg, ${CARD_SYSTEM.COLOR_HEX_MAP.orange} 0%, ${CARD_SYSTEM.COLOR_HEX_MAP.orange}cc 50%, ${CARD_SYSTEM.COLOR_HEX_MAP.orange} 100%)`,
                  }}
                />
                <div className="relative z-10">
                  <ChartHeader
                    title="By Markets"
                    badges={[
                      `${casinoSportPerMarketBiaxialData.reduce((sum, item) => sum + (item.casino || 0) + (item.sport || 0), 0)} total tasks`
                    ]}
                    color={CARD_SYSTEM.COLOR_HEX_MAP.orange}
                  />
                  <div className="px-5 pb-5">
                    <BiaxialBarChart
                      data={casinoSportPerMarketBiaxialData}
                      title=""
                      bars={[
                        { dataKey: 'casino', name: 'Casino', color: '#dc143c' },
                        { dataKey: 'sport', name: 'Sport', color: '#22c55e' }
                      ]}
                      dataType={CARD_SYSTEM.CHART_DATA_TYPE.MARKET}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Total Casino vs Total Sport */}
            {totalCasinoSportBiaxialData && totalCasinoSportBiaxialData.length > 0 && (
              <div className="card-small-modern group hover:shadow-xl transition-all duration-300">
                <div
                  className="absolute top-0 left-0 right-0 h-1 rounded-t-xl"
                  style={{
                    background: `linear-gradient(90deg, ${CARD_SYSTEM.COLOR_HEX_MAP.orange} 0%, ${CARD_SYSTEM.COLOR_HEX_MAP.orange}cc 50%, ${CARD_SYSTEM.COLOR_HEX_MAP.orange} 100%)`,
                  }}
                />
                <div className="relative z-10">
                  <ChartHeader
                    title="Total Comparison"
                    badges={[
                      `${totalCasinoSportBiaxialData.reduce((sum, item) => sum + (item.casino || 0) + (item.sport || 0), 0)} total tasks`
                    ]}
                    color={CARD_SYSTEM.COLOR_HEX_MAP.orange}
                  />
                  <div className="px-5 pb-5">
                    <BiaxialBarChart
                      data={totalCasinoSportBiaxialData}
                      title=""
                      bars={[
                        { dataKey: 'casino', name: 'Casino', color: '#dc143c' },
                        { dataKey: 'sport', name: 'Sport', color: '#22c55e' }
                      ]}
                      dataType={CARD_SYSTEM.CHART_DATA_TYPE.PRODUCT}
                    />
                  </div>
                </div>
              </div>
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
              <div 
                key={userChart.userId} 
                className="card-small-modern group hover:shadow-xl transition-all duration-300"
              >
                <div
                  className="absolute top-0 left-0 right-0 h-1 rounded-t-xl"
                  style={{
                    background: `linear-gradient(90deg, ${cardColor} 0%, ${cardColor}cc 50%, ${cardColor} 100%)`,
                  }}
                />
                <div className="relative z-10 px-5 pt-4">
                  <ChartHeader
                    title={userChart.userName}
                    subtitle="Product Markets"
                    badges={[
                      `${userChart.totalTasks} tasks`,
                      `${userChart.totalHours}h`
                    ]}
                    color={cardColor}
                    className="!px-0 !py-0"
                  />
                  
                  {/* Chart Container */}
                  <div className="pb-5">
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
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});

ProductAnalyticsCard.displayName = 'ProductAnalyticsCard';

export default ProductAnalyticsCard;
