import React, { memo, useMemo } from "react";
import AnalyticsTable from "@/components/Table/AnalyticsTable";
import SimplePieChart from "@/components/Charts/SimplePieChart";
import BiaxialBarChart from "@/components/Charts/BiaxialBarChart";
import { SkeletonAnalyticsCard } from "@/components/ui/Skeleton/Skeleton";
import ChartHeader from "./ChartHeader";
import { CHART_COLORS } from "./configs/analyticsSharedConfig";
import { CARD_SYSTEM } from "@/constants";
import { Icons } from "@/components/icons";

const ChartIcon = Icons.generic.chart;

const AcquisitionAnalyticsCard = memo(
  ({
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
    sportCasinoUserTableData = [],
    sportCasinoUserTableColumns = [],
    className = "",
    isLoading = false,
  }) => {
    if (isLoading) {
      return <SkeletonAnalyticsCard className={className} />;
    }

    // Calculate totals for pie charts
    const casinoAcquisitionPieTotal = useMemo(
      () =>
        casinoAcquisitionData?.reduce(
          (sum, item) => sum + (item.value || 0),
          0
        ) || 0,
      [casinoAcquisitionData]
    );
    const casinoAcquisitionPieHours = useMemo(
      () =>
        casinoBiaxialData?.reduce((sum, item) => sum + (item.hours || 0), 0) ||
        0,
      [casinoBiaxialData]
    );
    const sportAcquisitionPieTotal = useMemo(
      () =>
        sportAcquisitionData?.reduce(
          (sum, item) => sum + (item.value || 0),
          0
        ) || 0,
      [sportAcquisitionData]
    );
    const sportAcquisitionPieHours = useMemo(
      () =>
        sportBiaxialData?.reduce((sum, item) => sum + (item.hours || 0), 0) ||
        0,
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
                    <p className="text-gray-500 dark:text-gray-400">
                      No casino acquisition user data
                    </p>
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
                    <p className="text-gray-500 dark:text-gray-400">
                      No sport acquisition user data
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Sport + Casino: Per-User Table */}
            <div className="mb-6">
              {sportCasinoUserTableData && sportCasinoUserTableData.length > 0 ? (
                <div className="table-container">
                  <AnalyticsTable
                    data={sportCasinoUserTableData}
                    columns={sportCasinoUserTableColumns}
                    sectionTitle="Sport + Casino: Per User"
                  />
                </div>
              ) : (
                <div className="card">
                  <div className="text-center py-8">
                    <p className="text-gray-500 dark:text-gray-400">
                      No sport + casino acquisition user data
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Charts Section */}
       
            {/* Pie Charts Container */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 ">
              {/* Casino Acquisition Chart */}
              <div className="group relative bg-white dark:bg-smallCard  overflow-hidden">
                <ChartHeader
                  title="Casino Acquisition: Tasks by markets"
                  badges={[
                    `${casinoAcquisitionPieTotal} tasks`,
                    `${Math.round(casinoAcquisitionPieHours * 10) / 10}h`,
                  ]}
                />
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
                        <p className="text-gray-500 dark:text-gray-400">
                          No casino acquisition data
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Sport Acquisition Chart */}
              <div className="group relative bg-white dark:bg-smallCard overflow-hidden">
                <ChartHeader
                  title="Sport Acquisition: Tasks by markets"
                  badges={[
                    `${sportAcquisitionPieTotal} tasks`,
                    `${Math.round(sportAcquisitionPieHours * 10) / 10}h`,
                  ]}
                />
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
                        <p className="text-gray-500 dark:text-gray-400">
                          No sport acquisition data
                        </p>
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
                const totalTasks =
                  casinoBiaxialData?.reduce(
                    (sum, item) => sum + (item.tasks || 0),
                    0
                  ) || 0;
                const totalHours =
                  casinoBiaxialData?.reduce(
                    (sum, item) => sum + (item.hours || 0),
                    0
                  ) || 0;
                return (
                  <div className="group relative bg-white dark:bg-smallCard overflow-hidden">
                    <ChartHeader
                      title="Casino Acquisition: Tasks & Hours by Markets"
                      badges={[`${totalTasks} tasks`, `${totalHours}h`]}
                    />
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
                            <p className="text-gray-500 dark:text-gray-400">
                              No casino biaxial data
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* Sport Biaxial Chart */}
              {(() => {
                const totalTasks =
                  sportBiaxialData?.reduce(
                    (sum, item) => sum + (item.tasks || 0),
                    0
                  ) || 0;
                const totalHours =
                  sportBiaxialData?.reduce(
                    (sum, item) => sum + (item.hours || 0),
                    0
                  ) || 0;
                return (
                  <div className="group relative bg-white dark:bg-smallCard overflow-hidden">
                    <ChartHeader
                      title="Sport Acquisition: Tasks & Hours by Markets"
                      badges={[`${totalTasks} tasks`, `${totalHours}h`]}
                    />
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
                            <p className="text-gray-500 dark:text-gray-400">
                              No sport biaxial data
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>
         

          {/* User Charts Section */}
          <div className="mt-8">
            <div className="mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <span>User Analytics</span>
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Individual user performance breakdown
              </p>
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
                      className="group relative bg-white dark:bg-smallCard  overflow-hidden"
                    >
                      <ChartHeader
                        title={userChart.userName}
                        subtitle={`${userChart.category} - Markets`}
                        badges={[
                          `${userChart.totalTasks} tasks`,
                          `${userChart.totalHours}h`,
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
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="card rounded-xl">
                  <div className="text-center py-12">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center"></div>
                    <p className="text-gray-500 dark:text-gray-400 font-medium">
                      No casino acquisition user data
                    </p>
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
                      className="group relative bg-white dark:bg-smallCard overflow-hidden"
                    >
                      <ChartHeader
                        title={userChart.userName}
                        subtitle={`${userChart.category} - Markets`}
                        badges={[
                          `${userChart.totalTasks} tasks`,
                          `${userChart.totalHours}h`,
                        ]}
                      />

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
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center"></div>
                    <p className="text-gray-500 dark:text-gray-400 font-medium">
                      No sport acquisition user data
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }
);

AcquisitionAnalyticsCard.displayName = "AcquisitionAnalyticsCard";

export default AcquisitionAnalyticsCard;
