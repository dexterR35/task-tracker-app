import React, { memo, useMemo } from "react";
import AnalyticsTable from "@/components/Table/AnalyticsTable";
import SimplePieChart from "@/components/Charts/SimplePieChart";
import BiaxialBarChart from "@/components/Charts/BiaxialBarChart";
import { SkeletonAnalyticsCard } from "@/components/ui/Skeleton/Skeleton";
import Avatar from "@/components/ui/Avatar/Avatar";
import Badge from "@/components/ui/Badge/Badge";
import ChartHeader from "./ChartHeader";
import { CHART_COLORS } from "./configs/analyticsSharedConfig";
import { CARD_SYSTEM } from "@/constants";

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
        <div>
          {/* Modern Charts Header */}
          <div className="relative bg-white/95 dark:bg-smallCard rounded-xl p-5 border border-gray-200/50 dark:border-gray-700/50 shadow-md mb-6 overflow-hidden">
            {/* Accent bar line on top */}
            <div 
              className="absolute top-0 left-0 right-0 h-1.5 rounded-t-xl"
              style={{
                background: `linear-gradient(90deg, ${CARD_SYSTEM.COLOR_HEX_MAP.color_default} 0%, ${CARD_SYSTEM.COLOR_HEX_MAP.color_default}cc 50%, ${CARD_SYSTEM.COLOR_HEX_MAP.color_default} 100%)`,
              }}
            />
            
            <div className="flex items-center gap-3 pt-2 relative z-10">
              {/* Icon with color_default background */}
              <div 
                className="w-10 h-10 rounded-xl flex items-center justify-center shadow-md flex-shrink-0"
                style={{
                  background: `linear-gradient(135deg, ${CARD_SYSTEM.COLOR_HEX_MAP.color_default} 0%, ${CARD_SYSTEM.COLOR_HEX_MAP.color_default}dd 100%)`,
                }}
              >
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-0.5">
                  Charts
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Visual analytics and data insights
                </p>
              </div>
              <Badge
                size="sm"
                className="shadow-sm"
                style={{
                  color: CARD_SYSTEM.COLOR_HEX_MAP.color_default,
                  backgroundColor: `${CARD_SYSTEM.COLOR_HEX_MAP.color_default}15`,
                  borderColor: `${CARD_SYSTEM.COLOR_HEX_MAP.color_default}30`,
                  borderWidth: '1px',
                  borderStyle: 'solid',
                }}
              >
                Analytics
              </Badge>
            </div>
          </div>
          
          {/* Pie Charts Container - All pie charts together */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Product Categories Pie Chart */}
          <div className="group relative bg-white dark:bg-smallCard border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden">
            <ChartHeader
              title="Product Categories: Task by category"
              badges={[
                { value: `${categoryPieTotal} tasks` },
                { value: `${Math.round(categoryPieHours * 10) / 10}h` }
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
            <div className="relative px-5 py-4 overflow-hidden">
              {/* Accent bar line on top */}
              <div 
                className="absolute top-0 left-0 right-0 h-1.5 rounded-t-xl"
                style={{
                  background: `linear-gradient(90deg, ${CARD_SYSTEM.COLOR_HEX_MAP.color_default} 0%, ${CARD_SYSTEM.COLOR_HEX_MAP.color_default}cc 50%, ${CARD_SYSTEM.COLOR_HEX_MAP.color_default} 100%)`,
                }}
              />
              <div className="flex items-center gap-3 pt-2 relative z-10">
                {/* Icon with color_default background */}
                <div 
                  className="w-10 h-10 rounded-xl flex items-center justify-center shadow-md flex-shrink-0"
                  style={{
                    background: `linear-gradient(135deg, ${CARD_SYSTEM.COLOR_HEX_MAP.color_default} 0%, ${CARD_SYSTEM.COLOR_HEX_MAP.color_default}dd 100%)`,
                  }}
                >
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h5 className="font-semibold text-gray-900 dark:text-white text-base">
                    <span>Product Casino: Markets Distribution</span>
                  </h5>
                </div>
                <div className="flex items-center gap-2">
                  <Badge 
                    variant="select_badge" 
                    size="sm"
                    style={{
                      color: CARD_SYSTEM.COLOR_HEX_MAP.color_default,
                      backgroundColor: `${CARD_SYSTEM.COLOR_HEX_MAP.color_default}15`,
                      borderColor: `${CARD_SYSTEM.COLOR_HEX_MAP.color_default}30`,
                      borderWidth: '1px',
                      borderStyle: 'solid',
                    }}
                  >
                    {casinoMarketsPieTotal} tasks
                  </Badge>
                  <Badge 
                    variant="select_badge" 
                    size="sm"
                    style={{
                      color: CARD_SYSTEM.COLOR_HEX_MAP.color_default,
                      backgroundColor: `${CARD_SYSTEM.COLOR_HEX_MAP.color_default}15`,
                      borderColor: `${CARD_SYSTEM.COLOR_HEX_MAP.color_default}30`,
                      borderWidth: '1px',
                      borderStyle: 'solid',
                    }}
                  >
                    {Math.round(casinoMarketsPieHours * 10) / 10}h
                  </Badge>
                </div>
              </div>
            </div>
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
            <div className="relative px-5 py-4 overflow-hidden">
              {/* Accent bar line on top */}
              <div 
                className="absolute top-0 left-0 right-0 h-1.5 rounded-t-xl"
                style={{
                  background: `linear-gradient(90deg, ${CARD_SYSTEM.COLOR_HEX_MAP.color_default} 0%, ${CARD_SYSTEM.COLOR_HEX_MAP.color_default}cc 50%, ${CARD_SYSTEM.COLOR_HEX_MAP.color_default} 100%)`,
                }}
              />
              <div className="flex items-center gap-3 pt-2 relative z-10">
                {/* Icon with color_default background */}
                <div 
                  className="w-10 h-10 rounded-xl flex items-center justify-center shadow-md flex-shrink-0"
                  style={{
                    background: `linear-gradient(135deg, ${CARD_SYSTEM.COLOR_HEX_MAP.color_default} 0%, ${CARD_SYSTEM.COLOR_HEX_MAP.color_default}dd 100%)`,
                  }}
                >
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h5 className="font-semibold text-gray-900 dark:text-white text-base">
                    <span>Product Sport: Markets Distribution</span>
                  </h5>
                </div>
                <div className="flex items-center gap-2">
                  <Badge 
                    variant="select_badge" 
                    size="sm"
                    style={{
                      color: CARD_SYSTEM.COLOR_HEX_MAP.color_default,
                      backgroundColor: `${CARD_SYSTEM.COLOR_HEX_MAP.color_default}15`,
                      borderColor: `${CARD_SYSTEM.COLOR_HEX_MAP.color_default}30`,
                      borderWidth: '1px',
                      borderStyle: 'solid',
                    }}
                  >
                    {sportMarketsPieTotal} tasks
                  </Badge>
                  <Badge 
                    variant="select_badge" 
                    size="sm"
                    style={{
                      color: CARD_SYSTEM.COLOR_HEX_MAP.color_default,
                      backgroundColor: `${CARD_SYSTEM.COLOR_HEX_MAP.color_default}15`,
                      borderColor: `${CARD_SYSTEM.COLOR_HEX_MAP.color_default}30`,
                      borderWidth: '1px',
                      borderStyle: 'solid',
                    }}
                  >
                    {Math.round(sportMarketsPieHours * 10) / 10}h
                  </Badge>
                </div>
              </div>
            </div>
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
                <div className="relative px-5 py-4 overflow-hidden">
                  {/* Accent bar line on top */}
                  <div 
                    className="absolute top-0 left-0 right-0 h-1.5 rounded-t-xl"
                    style={{
                      background: `linear-gradient(90deg, ${CARD_SYSTEM.COLOR_HEX_MAP.color_default} 0%, ${CARD_SYSTEM.COLOR_HEX_MAP.color_default}cc 50%, ${CARD_SYSTEM.COLOR_HEX_MAP.color_default} 100%)`,
                    }}
                  />
                  <div className="flex items-center gap-3 pt-2 relative z-10">
                    {/* Icon with color_default background */}
                    <div 
                      className="w-10 h-10 rounded-xl flex items-center justify-center shadow-md flex-shrink-0"
                      style={{
                        background: `linear-gradient(135deg, ${CARD_SYSTEM.COLOR_HEX_MAP.color_default} 0%, ${CARD_SYSTEM.COLOR_HEX_MAP.color_default}dd 100%)`,
                      }}
                    >
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h5 className="font-semibold text-gray-900 dark:text-white text-base">
                        <span>Product Categories: Tasks & Hours by Category</span>
                      </h5>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant="select_badge" 
                        size="sm"
                        style={{
                          color: CARD_SYSTEM.COLOR_HEX_MAP.color_default,
                          backgroundColor: `${CARD_SYSTEM.COLOR_HEX_MAP.color_default}15`,
                          borderColor: `${CARD_SYSTEM.COLOR_HEX_MAP.color_default}30`,
                          borderWidth: '1px',
                          borderStyle: 'solid',
                        }}
                      >
                        {totalTasks} tasks
                      </Badge>
                      <Badge 
                        variant="select_badge" 
                        size="sm"
                        style={{
                          color: CARD_SYSTEM.COLOR_HEX_MAP.color_default,
                          backgroundColor: `${CARD_SYSTEM.COLOR_HEX_MAP.color_default}15`,
                          borderColor: `${CARD_SYSTEM.COLOR_HEX_MAP.color_default}30`,
                          borderWidth: '1px',
                          borderStyle: 'solid',
                        }}
                      >
                        {totalHours}h
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="p-5">
                  <BiaxialBarChart
                    data={categoryBiaxialData}
                    title=""
                    tasksColor={categoryBiaxialTasksColor}
                    hoursColor={categoryBiaxialHoursColor}
                    dataType={CARD_SYSTEM.CHART_DATA_TYPE.PRODUCT}
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
                <div className="relative px-5 py-4 overflow-hidden">
                  {/* Accent bar line on top */}
                  <div 
                    className="absolute top-0 left-0 right-0 h-1.5 rounded-t-xl"
                    style={{
                      background: `linear-gradient(90deg, ${CARD_SYSTEM.COLOR_HEX_MAP.color_default} 0%, ${CARD_SYSTEM.COLOR_HEX_MAP.color_default}cc 50%, ${CARD_SYSTEM.COLOR_HEX_MAP.color_default} 100%)`,
                    }}
                  />
                  <div className="flex items-center gap-3 pt-2 relative z-10">
                    {/* Icon with color_default background */}
                    <div 
                      className="w-10 h-10 rounded-xl flex items-center justify-center shadow-md flex-shrink-0"
                      style={{
                        background: `linear-gradient(135deg, ${CARD_SYSTEM.COLOR_HEX_MAP.color_default} 0%, ${CARD_SYSTEM.COLOR_HEX_MAP.color_default}dd 100%)`,
                      }}
                    >
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h5 className="font-semibold text-gray-900 dark:text-white text-base">
                        <span>Product Casino: Markets Tasks & Hours</span>
                      </h5>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant="select_badge" 
                        size="sm"
                        style={{
                          color: CARD_SYSTEM.COLOR_HEX_MAP.color_default,
                          backgroundColor: `${CARD_SYSTEM.COLOR_HEX_MAP.color_default}15`,
                          borderColor: `${CARD_SYSTEM.COLOR_HEX_MAP.color_default}30`,
                          borderWidth: '1px',
                          borderStyle: 'solid',
                        }}
                      >
                        {totalTasks} tasks
                      </Badge>
                      <Badge 
                        variant="select_badge" 
                        size="sm"
                        style={{
                          color: CARD_SYSTEM.COLOR_HEX_MAP.color_default,
                          backgroundColor: `${CARD_SYSTEM.COLOR_HEX_MAP.color_default}15`,
                          borderColor: `${CARD_SYSTEM.COLOR_HEX_MAP.color_default}30`,
                          borderWidth: '1px',
                          borderStyle: 'solid',
                        }}
                      >
                        {totalHours}h
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="p-5">
                  <BiaxialBarChart
                    data={productCasinoMarketsBiaxialData}
                    title=""
                    tasksColor={productCasinoMarketsBiaxialTasksColor}
                    hoursColor={productCasinoMarketsBiaxialHoursColor}
                    dataType={CARD_SYSTEM.CHART_DATA_TYPE.MARKET}
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
                <div className="relative px-5 py-4 overflow-hidden">
                  {/* Accent bar line on top */}
                  <div 
                    className="absolute top-0 left-0 right-0 h-1.5 rounded-t-xl"
                    style={{
                      background: `linear-gradient(90deg, ${CARD_SYSTEM.COLOR_HEX_MAP.color_default} 0%, ${CARD_SYSTEM.COLOR_HEX_MAP.color_default}cc 50%, ${CARD_SYSTEM.COLOR_HEX_MAP.color_default} 100%)`,
                    }}
                  />
                  <div className="flex items-center gap-3 pt-2 relative z-10">
                    {/* Icon with color_default background */}
                    <div 
                      className="w-10 h-10 rounded-xl flex items-center justify-center shadow-md flex-shrink-0"
                      style={{
                        background: `linear-gradient(135deg, ${CARD_SYSTEM.COLOR_HEX_MAP.color_default} 0%, ${CARD_SYSTEM.COLOR_HEX_MAP.color_default}dd 100%)`,
                      }}
                    >
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h5 className="font-semibold text-gray-900 dark:text-white text-base">
                        <span>Product Sport: Markets Tasks & Hours</span>
                      </h5>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant="select_badge" 
                        size="sm"
                        style={{
                          color: CARD_SYSTEM.COLOR_HEX_MAP.color_default,
                          backgroundColor: `${CARD_SYSTEM.COLOR_HEX_MAP.color_default}15`,
                          borderColor: `${CARD_SYSTEM.COLOR_HEX_MAP.color_default}30`,
                          borderWidth: '1px',
                          borderStyle: 'solid',
                        }}
                      >
                        {totalTasks} tasks
                      </Badge>
                      <Badge 
                        variant="select_badge" 
                        size="sm"
                        style={{
                          color: CARD_SYSTEM.COLOR_HEX_MAP.color_default,
                          backgroundColor: `${CARD_SYSTEM.COLOR_HEX_MAP.color_default}15`,
                          borderColor: `${CARD_SYSTEM.COLOR_HEX_MAP.color_default}30`,
                          borderWidth: '1px',
                          borderStyle: 'solid',
                        }}
                      >
                        {totalHours}h
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="p-5">
                  <BiaxialBarChart
                    data={productSportMarketsBiaxialData}
                    title=""
                    tasksColor={productSportMarketsBiaxialTasksColor}
                    hoursColor={productSportMarketsBiaxialHoursColor}
                    dataType={CARD_SYSTEM.CHART_DATA_TYPE.MARKET}
                  />
                </div>
              </div>
            );
          })()}
        </div>
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
                  {/* Header with modern design */}
                  <div className="relative px-5 py-4 overflow-hidden">
                    {/* Accent bar line on top */}
                    <div 
                      className="absolute top-0 left-0 right-0 h-1.5 rounded-t-xl"
                      style={{
                        background: `linear-gradient(90deg, ${CARD_SYSTEM.COLOR_HEX_MAP.color_default} 0%, ${CARD_SYSTEM.COLOR_HEX_MAP.color_default}cc 50%, ${CARD_SYSTEM.COLOR_HEX_MAP.color_default} 100%)`,
                      }}
                    />
                    <div className="flex items-center justify-between pt-2 relative z-10">
                      <div className="flex items-center gap-3">
                        <Avatar 
                          name={userChart.userName}
                          size="md"
                          showName={false}
                          className="flex-shrink-0"
                          backgroundColor={CARD_SYSTEM.COLOR_HEX_MAP.color_default}
                        />
                        <div>
                          <h5 className="font-semibold text-gray-900 dark:text-white text-base">
                            {userChart.userName}
                          </h5>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Product Markets</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant="select_badge" 
                          size="sm"
                          style={{
                            color: CARD_SYSTEM.COLOR_HEX_MAP.color_default,
                            backgroundColor: `${CARD_SYSTEM.COLOR_HEX_MAP.color_default}15`,
                            borderColor: `${CARD_SYSTEM.COLOR_HEX_MAP.color_default}30`,
                            borderWidth: '1px',
                            borderStyle: 'solid',
                          }}
                        >
                          {userChart.totalTasks} tasks
                        </Badge>
                        <Badge 
                          variant="select_badge" 
                          size="sm"
                          style={{
                            color: CARD_SYSTEM.COLOR_HEX_MAP.color_default,
                            backgroundColor: `${CARD_SYSTEM.COLOR_HEX_MAP.color_default}15`,
                            borderColor: `${CARD_SYSTEM.COLOR_HEX_MAP.color_default}30`,
                            borderWidth: '1px',
                            borderStyle: 'solid',
                          }}
                        >
                          {userChart.totalHours}h
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  {/* Chart Container */}
                  <div className="p-5">
                    <BiaxialBarChart
                      data={userChart.marketData}
                      title=""
                      tasksColor={CHART_COLORS.DEFAULT[0]}
                      hoursColor={CHART_COLORS.DEFAULT[1]}
                      dataType={CARD_SYSTEM.CHART_DATA_TYPE.MARKET}
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
