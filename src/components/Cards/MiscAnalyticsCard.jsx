import React, { memo, useMemo } from "react";
import AnalyticsTable from "@/components/Table/AnalyticsTable";
import SimplePieChart from "@/components/Charts/SimplePieChart";
import BiaxialBarChart from "@/components/Charts/BiaxialBarChart";
import { SkeletonAnalyticsCard } from "@/components/ui/Skeleton/Skeleton";
import ChartHeader from "./ChartHeader";
import { CHART_COLORS } from "./configs/analyticsSharedConfig";
import { CARD_SYSTEM } from "@/constants";
import Badge from "@/components/ui/Badge/Badge";
import { Icons } from "@/components/icons";

const ChartIcon = Icons.generic.chart;

const MiscAnalyticsCard = memo(({
  title,
  miscTableData,
  miscTableColumns,
  usersMiscTableData,
  usersMiscTableColumns,
  categoryPieData,
  categoryPieTitle,
  categoryPieColors,
  categoryBiaxialData,
  categoryBiaxialTitle,
  categoryBiaxialTasksColor,
  categoryBiaxialHoursColor,
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

  return (
    <div id="misc-analytics-card" className={`${className}`}>
      {/* Grid Container */}
      <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
        {/* Tables Section */}
        <div>
          {/* Misc Statistics Table */}
          {miscTableData && miscTableData.length > 0 ? (
            <div className="table-container">
              <AnalyticsTable
                data={miscTableData}
                columns={miscTableColumns}
                sectionTitle="Misc Statistics"
              />
            </div>
          ) : (
            <div className="card">
              <div className="text-center py-8">
                <p className="text-gray-500 dark:text-gray-400">No misc product data available</p>
              </div>
            </div>
          )}

          {/* Users Misc Statistics Table */}
          {usersMiscTableData && usersMiscTableData.length > 0 ? (
            <div className="table-container mt-6">
              <AnalyticsTable
                data={usersMiscTableData}
                columns={usersMiscTableColumns}
                sectionTitle="Users Misc Statistics"
              />
            </div>
          ) : null}
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
          
          {/* Pie Charts Container */}
          <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
            {/* Misc Categories Pie Chart */}
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
                      <span>Misc Categories: Task by category</span>
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
                      {categoryPieTotal} tasks
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
                      {Math.round(categoryPieHours * 10) / 10}h
                    </Badge>
                  </div>
                </div>
              </div>
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
          </div>

          {/* Biaxial Charts Container */}
          <div className="grid grid-cols-1 lg:grid-cols-1 gap-6 mt-6">
            {/* Misc Categories Biaxial Chart */}
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
                          <span>Misc Categories: Tasks & Hours by Category</span>
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
          </div>
        </div>
      </div>
    </div>
  );
});

MiscAnalyticsCard.displayName = 'MiscAnalyticsCard';

export default MiscAnalyticsCard;

