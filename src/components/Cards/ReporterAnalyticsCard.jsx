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

const ReporterAnalyticsCard = memo(({
  title,
  reporterTableData,
  reporterTableColumns,
  reporterPieData1,
  reporterPieData2,
  reporterPieData3,
  reporterPieColors1,
  reporterPieColors2,
  reporterPieColors3,
  reporterBiaxialData,
  reporterBiaxialTitle,
  reporterBiaxialTasksColor,
  reporterBiaxialHoursColor,
  reporterMarketBiaxialDataCasino,
  reporterMarketBiaxialDataSport,
  reporterMarketBiaxialTasksColor,
  reporterMarketBiaxialHoursColor,
  className = "",
  isLoading = false,
}) => {
  if (isLoading) {
    return <SkeletonAnalyticsCard className={className} />;
  }

  // Calculate totals for pie charts
  const reporterPieTotal1 = useMemo(() => 
    reporterPieData1?.reduce((sum, item) => sum + (item.value || 0), 0) || 0,
    [reporterPieData1]
  );
  const reporterPieTotal2 = useMemo(() => 
    reporterPieData2?.reduce((sum, item) => sum + (item.value || 0), 0) || 0,
    [reporterPieData2]
  );
  const reporterPieTotal3 = useMemo(() => 
    reporterPieData3?.reduce((sum, item) => sum + (item.value || 0), 0) || 0,
    [reporterPieData3]
  );
  const reporterPieTotal = reporterPieTotal1 + reporterPieTotal2 + reporterPieTotal3;
  const reporterPieHours = useMemo(() => 
    reporterBiaxialData?.reduce((sum, item) => sum + (item.hours || 0), 0) || 0,
    [reporterBiaxialData]
  );

  return (
    <div id="reporter-analytics-card" className={`${className}`}>
      {/* Grid Container */}
      <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
        {/* Tables Section */}
        <div>
          {/* Reporter Statistics Table */}
          {reporterTableData && reporterTableData.length > 0 ? (
            <div className="card-small-modern">
              <div
                className="absolute top-0 left-0 right-0 h-1 rounded-t-xl"
                style={{
                  background: `linear-gradient(90deg, ${CARD_SYSTEM.COLOR_HEX_MAP.orange} 0%, ${CARD_SYSTEM.COLOR_HEX_MAP.orange}cc 50%, ${CARD_SYSTEM.COLOR_HEX_MAP.orange} 100%)`,
                }}
              />
              <div className="relative z-10 p-5">
                <AnalyticsTable
                  data={reporterTableData}
                  columns={reporterTableColumns}
                  sectionTitle=""
                  enablePagination={true}
                  showPagination={true}
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

        {/* Charts Section */}
        <div>
          {/* Charts Container */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Reporter Metrics Pie Chart 1 */}
          {reporterPieData1 && reporterPieData1.length > 0 && (
            <div className="group relative bg-white dark:bg-smallCard border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden">
              <ChartHeader
                title="Reporter Metrics: Task by reporter (Part 1)"
                badges={[`${reporterPieTotal1} tasks`]}
              />
              <div className="p-5">
                <SimplePieChart
                  data={reporterPieData1}
                  title=""
                  colors={reporterPieColors1}
                  showPercentages={true}
                  dataType={CARD_SYSTEM.CHART_DATA_TYPE.REPORTER}
                />
              </div>
            </div>
          )}

          {/* Reporter Metrics Pie Chart 2 */}
          {reporterPieData2 && reporterPieData2.length > 0 && (
            <div className="group relative bg-white dark:bg-smallCard border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden">
              <ChartHeader
                title="Reporter Metrics: Task by reporter (Part 2)"
                badges={[`${reporterPieTotal2} tasks`]}
              />
              <div className="p-5">
                <SimplePieChart
                  data={reporterPieData2}
                  title=""
                  colors={reporterPieColors2}
                  showPercentages={true}
                  dataType={CARD_SYSTEM.CHART_DATA_TYPE.REPORTER}
                />
              </div>
            </div>
          )}

          {/* Reporter Metrics Pie Chart 3 */}
          {reporterPieData3 && reporterPieData3.length > 0 && (
            <div className="group relative bg-white dark:bg-smallCard border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden">
              <ChartHeader
                title="Reporter Metrics: Task by reporter (Part 3)"
                badges={[`${reporterPieTotal3} tasks`]}
              />
              <div className="p-5">
                <SimplePieChart
                  data={reporterPieData3}
                  title=""
                  colors={reporterPieColors3}
                  showPercentages={true}
                  dataType={CARD_SYSTEM.CHART_DATA_TYPE.REPORTER}
                />
              </div>
            </div>
          )}
        </div>

        {/* Reporter Metrics Biaxial Chart - Single Column */}
        <div className="grid grid-cols-1 gap-6 mt-6">
          {(() => {
            const totalTasks = reporterBiaxialData?.reduce((sum, item) => sum + (item.tasks || 0), 0) || 0;
            const totalHours = reporterBiaxialData?.reduce((sum, item) => sum + (item.hours || 0), 0) || 0;
            return (
              <div className="group relative bg-white dark:bg-smallCard border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden">
                  <ChartHeader
                    title="Reporter Metrics: Tasks & Hours by reporter"
                    badges={[
                      `${totalTasks} tasks`,
                      `${totalHours}h`
                    ]}
                  />
                <div className="p-5">
                  <BiaxialBarChart
                    data={reporterBiaxialData}
                    title=""
                    tasksColor={reporterBiaxialTasksColor}
                    hoursColor={reporterBiaxialHoursColor}
                    dataType={CARD_SYSTEM.CHART_DATA_TYPE.REPORTER}
                  />
                </div>
              </div>
            );
          })()}
        </div>

          {/* Reporter-Market Biaxial Charts - Split by Product Type */}
          <div className="grid grid-cols-1 gap-6 mt-6">
            {/* Casino Reporter-Market Chart */}
            {(() => {
              const totalTasks = reporterMarketBiaxialDataCasino?.reduce((sum, item) => sum + (item.tasks || 0), 0) || 0;
              const totalHours = reporterMarketBiaxialDataCasino?.reduce((sum, item) => sum + (item.hours || 0), 0) || 0;
              if (!reporterMarketBiaxialDataCasino || reporterMarketBiaxialDataCasino.length === 0) return null;
              return (
                <div className="group relative bg-white dark:bg-smallCard border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden">
                  <ChartHeader
                    title="Reporters by Markets: Casino"
                    badges={[
                      `${totalTasks} tasks`,
                      `${Math.round(totalHours * 10) / 10}h`
                    ]}
                  />
                  <div className="p-5">
                    <BiaxialBarChart
                      data={reporterMarketBiaxialDataCasino}
                      title=""
                      tasksColor={reporterMarketBiaxialTasksColor}
                      hoursColor={reporterMarketBiaxialHoursColor}
                      dataType="reporter"
                    />
                  </div>
                </div>
              );
            })()}

            {/* Sport Reporter-Market Chart */}
            {(() => {
              const totalTasks = reporterMarketBiaxialDataSport?.reduce((sum, item) => sum + (item.tasks || 0), 0) || 0;
              const totalHours = reporterMarketBiaxialDataSport?.reduce((sum, item) => sum + (item.hours || 0), 0) || 0;
              if (!reporterMarketBiaxialDataSport || reporterMarketBiaxialDataSport.length === 0) return null;
              return (
                <div className="group relative bg-white dark:bg-smallCard border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden">
                  <ChartHeader
                    title="Reporters by Markets: Sport"
                    badges={[
                      `${totalTasks} tasks`,
                      `${Math.round(totalHours * 10) / 10}h`
                    ]}
                  />
                  <div className="p-5">
                    <BiaxialBarChart
                      data={reporterMarketBiaxialDataSport}
                      title=""
                      tasksColor={reporterMarketBiaxialTasksColor}
                      hoursColor={reporterMarketBiaxialHoursColor}
                      dataType="reporter"
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

ReporterAnalyticsCard.displayName = 'ReporterAnalyticsCard';

export default ReporterAnalyticsCard;