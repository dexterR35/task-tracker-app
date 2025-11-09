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
import { Icons } from "@/components/icons";

const ChartIcon = Icons.generic.chart;

const AcquisitionAnalyticsCard = memo(({
  title = "Acquisition Analytics",
  acquisitionTableData = [],
  acquisitionTableColumns = [],
  casinoAcquisitionData = [],
  casinoAcquisitionTitle = "Casino Acquisition by Markets",
  casinoAcquisitionColors = [],
  sportAcquisitionData = [],
  sportAcquisitionTitle = "Sport Acquisition by Markets",
  sportAcquisitionColors = [],
  casinoBiaxialData = [],
  casinoBiaxialTitle = "Casino Acquisition Tasks & Hours by Markets",
  casinoBiaxialTasksColor,
  casinoBiaxialHoursColor,
  sportBiaxialData = [],
  sportBiaxialTitle = "Sport Acquisition Tasks & Hours by Markets",
  sportBiaxialTasksColor,
  sportBiaxialHoursColor,
  casinoUsersCharts = [],
  sportUsersCharts = [],
  casinoUserTableData = [],
  casinoUserTableColumns = [],
  sportUserTableData = [],
  sportUserTableColumns = [],
  className = "",
  isLoading = false,
}) => {
  if (isLoading) {
    return <SkeletonAnalyticsCard className={className} />;
  }

  // Calculate totals for pie charts
  const casinoAcquisitionPieTotal = useMemo(() => 
    casinoAcquisitionData?.reduce((sum, item) => sum + (item.value || 0), 0) || 0,
    [casinoAcquisitionData]
  );
  const casinoAcquisitionPieHours = useMemo(() => 
    casinoBiaxialData?.reduce((sum, item) => sum + (item.hours || 0), 0) || 0,
    [casinoBiaxialData]
  );
  const sportAcquisitionPieTotal = useMemo(() => 
    sportAcquisitionData?.reduce((sum, item) => sum + (item.value || 0), 0) || 0,
    [sportAcquisitionData]
  );
  const sportAcquisitionPieHours = useMemo(() => 
    sportBiaxialData?.reduce((sum, item) => sum + (item.hours || 0), 0) || 0,
    [sportBiaxialData]
  );

  return (
    <div id="acquisition-analytics-card" className={`${className}`}>
      {/* Grid Container */}
      <div className="grid grid-cols-1 lg:grid-cols-1 gap-4">
        {/* Tables Section */}
        <div>
          {/* Acquisition Table */}
          {acquisitionTableData && acquisitionTableData.length > 0 ? (
            <div className="table-container mb-6">
              <AnalyticsTable
                data={acquisitionTableData}
                columns={acquisitionTableColumns}
                sectionTitle="Acquisition Table"
              />
            </div>
          ) : (
            <div className="card mb-6">
              <div className="text-center py-8">
                <p className="text-gray-500 dark:text-gray-400">No data</p>
              </div>
            </div>
          )}

          {/* Casino Acquisition: Per-User Table */}
          <div className="mb-6">
          {casinoUserTableData && casinoUserTableData.length > 0 ? (
            <div className="table-container">
              <AnalyticsTable
                data={casinoUserTableData}
                columns={casinoUserTableColumns}
                sectionTitle="Casino Acquisition: Per User"
              />
            </div>
          ) : (
            <div className="card">
              <div className="text-center py-8">
                <p className="text-gray-500 dark:text-gray-400">No casino acquisition user data</p>
              </div>
            </div>
          )}
        </div>

            {/* Sport Acquisition: Per-User Table */}
            <div className="mb-6">
              {sportUserTableData && sportUserTableData.length > 0 ? (
                <div className="table-container">
                  <AnalyticsTable
                    data={sportUserTableData}
                    columns={sportUserTableColumns}
                    sectionTitle="Sport Acquisition: Per User"
                  />
                </div>
              ) : (
                <div className="card">
                  <div className="text-center py-8">
                    <p className="text-gray-500 dark:text-gray-400">No sport acquisition user data</p>
                  </div>
                </div>
              )}
            </div>
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Casino Acquisition Chart */}
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
                  <ChartIcon className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <h5 className="font-semibold text-gray-900 dark:text-white text-base">
                    <span>Casino Acquisition: Tasks by markets</span>
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
                    {casinoAcquisitionPieTotal} tasks
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
                    {Math.round(casinoAcquisitionPieHours * 10) / 10}h
                  </Badge>
                </div>
              </div>
            </div>
            <div className="p-5">
              {casinoAcquisitionData && casinoAcquisitionData.length > 0 ? (
                <SimplePieChart
                  data={casinoAcquisitionData}
                  title=""
                  colors={casinoAcquisitionColors}
                  dataType={CARD_SYSTEM.CHART_DATA_TYPE.MARKET}
                />
              ) : (
                <div className="card">
                  <div className="text-center py-8">
                    <p className="text-gray-500 dark:text-gray-400">No casino acquisition data</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sport Acquisition Chart */}
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
                  <ChartIcon className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <h5 className="font-semibold text-gray-900 dark:text-white text-base">
                    <span>Sport Acquisition: Tasks by markets</span>
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
                    {sportAcquisitionPieTotal} tasks
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
                    {Math.round(sportAcquisitionPieHours * 10) / 10}h
                  </Badge>
                </div>
              </div>
            </div>
            <div className="p-5">
              {sportAcquisitionData && sportAcquisitionData.length > 0 ? (
                <SimplePieChart
                  data={sportAcquisitionData}
                  title=""
                  colors={sportAcquisitionColors}
                  dataType={CARD_SYSTEM.CHART_DATA_TYPE.MARKET}
                />
              ) : (
                <div className="card">
                  <div className="text-center py-8">
                    <p className="text-gray-500 dark:text-gray-400">No sport acquisition data</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Biaxial Charts Container */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Casino Biaxial Chart */}
          {(() => {
            const totalTasks = casinoBiaxialData?.reduce((sum, item) => sum + (item.tasks || 0), 0) || 0;
            const totalHours = casinoBiaxialData?.reduce((sum, item) => sum + (item.hours || 0), 0) || 0;
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
                        <span>Casino Acquisition: Tasks & Hours by Markets</span>
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
                  {casinoBiaxialData && casinoBiaxialData.length > 0 ? (
                    <BiaxialBarChart
                      data={casinoBiaxialData}
                      title=""
                      tasksColor={casinoBiaxialTasksColor}
                      hoursColor={casinoBiaxialHoursColor}
                      dataType={CARD_SYSTEM.CHART_DATA_TYPE.MARKET}
                    />
                  ) : (
                    <div className="card">
                      <div className="text-center py-8">
                        <p className="text-gray-500 dark:text-gray-400">No casino biaxial data</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })()}

          {/* Sport Biaxial Chart */}
          {(() => {
            const totalTasks = sportBiaxialData?.reduce((sum, item) => sum + (item.tasks || 0), 0) || 0;
            const totalHours = sportBiaxialData?.reduce((sum, item) => sum + (item.hours || 0), 0) || 0;
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
                        <span>Sport Acquisition: Tasks & Hours by Markets</span>
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
                  {sportBiaxialData && sportBiaxialData.length > 0 ? (
                    <BiaxialBarChart
                      data={sportBiaxialData}
                      title=""
                      tasksColor={sportBiaxialTasksColor}
                      hoursColor={sportBiaxialHoursColor}
                      dataType={CARD_SYSTEM.CHART_DATA_TYPE.MARKET}
                    />
                  ) : (
                    <div className="card">
                      <div className="text-center py-8">
                        <p className="text-gray-500 dark:text-gray-400">No sport biaxial data</p>
                      </div>
                    </div>
                  )}
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
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Individual user performance breakdown</p>
          </div>
          
          {/* Casino Acquisition: Per-User Charts */}
          <div className="mb-8">
            <div className="mb-5">
              <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                <span>Casino Acquisition: Per User</span>
              </h4>
            </div>
          {casinoUsersCharts && casinoUsersCharts.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {casinoUsersCharts.map((userChart) => (
                <div 
                  key={`casino-${userChart.userId}`} 
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
                          <p className="text-xs text-gray-500 dark:text-gray-400">{userChart.category} - Markets</p>
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
                <p className="text-gray-500 dark:text-gray-400 font-medium">No casino acquisition user data</p>
              </div>
            </div>
          )}
          </div>

          {/* Sport Acquisition: Per-User Charts */}
          <div>
            <div className="mb-5">
              <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                <span>Sport Acquisition: Per User</span>
              </h4>
            </div>
            {sportUsersCharts && sportUsersCharts.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {sportUsersCharts.map((userChart) => (
                  <div 
                    key={`sport-${userChart.userId}`} 
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
                            <p className="text-xs text-gray-500 dark:text-gray-400">{userChart.category} - Markets</p>
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
                        title={`${userChart.userName}: ${userChart.category}`}
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
                  <p className="text-gray-500 dark:text-gray-400 font-medium">No sport acquisition user data</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

AcquisitionAnalyticsCard.displayName = 'AcquisitionAnalyticsCard';

export default AcquisitionAnalyticsCard;
