import React, { memo, useMemo } from "react";
import AnalyticsTable from "@/components/Table/AnalyticsTable";
import SimplePieChart from "@/components/Charts/SimplePieChart";
import BiaxialBarChart from "@/components/Charts/BiaxialBarChart";
import { SkeletonAnalyticsCard } from "@/components/ui/Skeleton/Skeleton";
import Badge from "@/components/ui/Badge/Badge";
import ChartHeader from "./ChartHeader";
import { CARD_SYSTEM } from "@/constants";
import { Icons } from "@/components/icons";

const ChartIcon = Icons.generic.chart;

const AIAnalyticsCard = memo(({
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

  // Calculate totals for pie charts
  const productsAIPieTotal = useMemo(() => 
    productsAIData?.reduce((sum, item) => sum + (item.value || 0), 0) || 0,
    [productsAIData]
  );
  const productsAIPieHours = useMemo(() => 
    productsBiaxialData?.reduce((sum, item) => sum + (item.hours || 0), 0) || 0,
    [productsBiaxialData]
  );
  const marketsAIPieTotal = useMemo(() => 
    marketsAIData?.reduce((sum, item) => sum + (item.value || 0), 0) || 0,
    [marketsAIData]
  );
  const marketsAIPieHours = useMemo(() => 
    marketsBiaxialData?.reduce((sum, item) => sum + (item.hours || 0), 0) || 0,
    [marketsBiaxialData]
  );
  const aiModelsPieTotal = useMemo(() => 
    aiModelsData?.reduce((sum, item) => sum + (item.value || 0), 0) || 0,
    [aiModelsData]
  );
  const aiModelsPieHours = useMemo(() => 
    aiModelsBiaxialData?.reduce((sum, item) => sum + (item.hours || 0), 0) || 0,
    [aiModelsBiaxialData]
  );
  const usersAIPieTotal = useMemo(() => 
    usersAIData?.reduce((sum, item) => sum + (item.value || 0), 0) || 0,
    [usersAIData]
  );
  const usersAIPieHours = useMemo(() => 
    usersBiaxialData?.reduce((sum, item) => sum + (item.hours || 0), 0) || 0,
    [usersBiaxialData]
  );

  return (
    <div id="ai-analytics-card" className={`${className}`}>
      {/* Grid Container */}
      <div className="grid grid-cols-1 lg:grid-cols-1 gap-4">
        {/* Tables Section */}
        <div>
          {/* AI Usage Statistics Table */}
          {aiTableData && aiTableData.length > 0 ? (
            <div className="table-container">
              <AnalyticsTable
                data={aiTableData}
                columns={aiTableColumns}
                sectionTitle="AI Usage Statistics"
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
                <ChartIcon className="w-5 h-5 text-white" />
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
          
          {/* Charts Container */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column: Products */}
          <div className="space-y-6">
            {/* Products AI Usage Pie Chart */}
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
                      <span>Products AI: AI usage by product</span>
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
                      {productsAIPieTotal} tasks
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
                      {Math.round(productsAIPieHours * 10) / 10}h
                    </Badge>
                  </div>
                </div>
              </div>
              <div className="p-5">
                <SimplePieChart
                  data={productsAIData}
                  title=""
                  colors={productsAIColors}
                  showPercentages={true}
                  dataType={CARD_SYSTEM.CHART_DATA_TYPE.PRODUCT}
                />
              </div>
            </div>

            {/* Products AI Analysis Biaxial Chart - Below pie chart */}
            {(() => {
              const totalTasks = productsBiaxialData?.reduce((sum, item) => sum + (item.tasks || 0), 0) || 0;
              const totalHours = productsBiaxialData?.reduce((sum, item) => sum + (item.hours || 0), 0) || 0;
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
                          <span>Products AI: AI Time vs AI Tasks by product</span>
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
                      data={productsBiaxialData}
                      title=""
                      tasksColor={productsBiaxialTasksColor}
                      hoursColor={productsBiaxialTimeColor}
                      dataType={CARD_SYSTEM.CHART_DATA_TYPE.PRODUCT}
                    />
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Right Column: Markets */}
          <div className="space-y-6">
            {/* Markets AI Usage Pie Chart */}
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
                      <span>Markets AI: AI usage by market</span>
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
                      {marketsAIPieTotal} tasks
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
                      {Math.round(marketsAIPieHours * 10) / 10}h
                    </Badge>
                  </div>
                </div>
              </div>
              <div className="p-5">
                <SimplePieChart
                  data={marketsAIData}
                  title=""
                  colors={marketsAIColors}
                  showPercentages={true}
                  dataType={CARD_SYSTEM.CHART_DATA_TYPE.MARKET}
                />
              </div>
            </div>

            {/* Markets AI Analysis Biaxial Chart - Below pie chart */}
            {(() => {
              const totalTasks = marketsBiaxialData?.reduce((sum, item) => sum + (item.tasks || 0), 0) || 0;
              const totalHours = marketsBiaxialData?.reduce((sum, item) => sum + (item.hours || 0), 0) || 0;
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
                          <span>Markets AI: AI Time vs AI Tasks by market</span>
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
                      data={marketsBiaxialData}
                      title=""
                      tasksColor={marketsBiaxialTasksColor}
                      hoursColor={marketsBiaxialTimeColor}
                      dataType={CARD_SYSTEM.CHART_DATA_TYPE.MARKET}
                    />
                  </div>
                </div>
              );
            })()}
          </div>

          {/* AI Models Section - Pie chart with biaxial below */}
          <div className="space-y-6">
            {/* AI Models Usage Pie Chart */}
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
                      <span>AI Models: Distribution of AI models used</span>
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
                      {aiModelsPieTotal} tasks
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
                      {Math.round(aiModelsPieHours * 10) / 10}h
                    </Badge>
                  </div>
                </div>
              </div>
              <div className="p-5">
                <SimplePieChart
                  data={aiModelsData}
                  title=""
                  colors={aiModelsColors}
                  showPercentages={true}
                  dataType={CARD_SYSTEM.CHART_DATA_TYPE.AI_MODEL}
                />
              </div>
            </div>

            {/* AI Models Biaxial Chart - Below pie chart */}
            {(() => {
              const totalTasks = aiModelsBiaxialData?.reduce((sum, item) => sum + (item.tasks || 0), 0) || 0;
              const totalHours = aiModelsBiaxialData?.reduce((sum, item) => sum + (item.hours || 0), 0) || 0;
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
                          <span>AI Models: AI Time vs AI Tasks by model</span>
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
                      data={aiModelsBiaxialData}
                      title=""
                      tasksColor={aiModelsBiaxialTasksColor}
                      hoursColor={aiModelsBiaxialHoursColor}
                      dataType={CARD_SYSTEM.CHART_DATA_TYPE.AI_MODEL}
                    />
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Users Section - Pie chart with biaxial below */}
          <div className="space-y-6">
            {/* Users by AI Time Pie Chart */}
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
                      <span>AI Time: AI usage time by user</span>
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
                      {usersAIPieTotal} tasks
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
                      {Math.round(usersAIPieHours * 10) / 10}h
                    </Badge>
                  </div>
                </div>
              </div>
              <div className="p-5">
                <SimplePieChart
                  data={usersAIData}
                  title=""
                  colors={usersAIColors}
                  showPercentages={true}
                  dataType={CARD_SYSTEM.CHART_DATA_TYPE.USER}
                />
              </div>
            </div>

            {/* Users AI Time vs AI Tasks Biaxial Chart - Below pie chart */}
            {(() => {
              const totalTasks = usersBiaxialData?.reduce((sum, item) => sum + (item.tasks || 0), 0) || 0;
              const totalHours = usersBiaxialData?.reduce((sum, item) => sum + (item.hours || 0), 0) || 0;
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
                          <span>Users AI: AI time vs AI tasks by user</span>
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
                      data={usersBiaxialData}
                      title=""
                      tasksColor={usersBiaxialTasksColor}
                      hoursColor={usersBiaxialTimeColor}
                      dataType={CARD_SYSTEM.CHART_DATA_TYPE.USER}
                    />
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
        </div>
      </div>
    </div>
  );
});

AIAnalyticsCard.displayName = 'AIAnalyticsCard';

export default AIAnalyticsCard;