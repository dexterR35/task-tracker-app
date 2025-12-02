import React, { memo, useMemo } from "react";
import AnalyticsTable from "@/components/Table/AnalyticsTable";
import SimplePieChart from "@/components/Charts/SimplePieChart";
import BiaxialBarChart from "@/components/Charts/BiaxialBarChart";
import { SkeletonAnalyticsCard } from "@/components/ui/Skeleton/Skeleton";
import Badge from "@/components/ui/Badge/Badge";
import ChartHeader from "./ChartHeader";
import { CARD_SYSTEM } from "@/constants";
import { Icons } from "@/components/icons";
import CollapsibleSection from "@/components/ui/CollapsibleSection/CollapsibleSection";

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
  totalTasks = 0, // Unique tasks count
  className = "",
  isLoading = false,
}) => {
  if (isLoading) {
    return <SkeletonAnalyticsCard className={className} />;
  }

  // Calculate totals for pie charts
  // Pie chart segments show per reporter counts, but totals should show unique tasks (not sum of reporter counts)
  // Note: Individual pie charts (1, 2, 3) are split views, but each should still show unique task counts
  // Since tasks can only have one reporter, summing pie values should equal unique tasks, but use totalTasks for consistency
  const reporterPieTotal1 = useMemo(() => {
    // Use unique tasks count from props (totalTasks is already unique tasks)
    // For split pie charts, we calculate from data but ensure it doesn't exceed totalTasks
    const pieSum = reporterPieData1?.reduce((sum, item) => sum + (item.value || 0), 0) || 0;
    // Use the smaller value to ensure we don't exceed total unique tasks
    return Math.min(pieSum, totalTasks || 0);
  }, [reporterPieData1, totalTasks]);
  
  const reporterPieTotal2 = useMemo(() => {
    const pieSum = reporterPieData2?.reduce((sum, item) => sum + (item.value || 0), 0) || 0;
    return Math.min(pieSum, totalTasks || 0);
  }, [reporterPieData2, totalTasks]);
  
  const reporterPieTotal3 = useMemo(() => {
    const pieSum = reporterPieData3?.reduce((sum, item) => sum + (item.value || 0), 0) || 0;
    return Math.min(pieSum, totalTasks || 0);
  }, [reporterPieData3, totalTasks]);
  
  // Use unique tasks count for combined total (not sum of pie chart values)
  const reporterPieTotal = totalTasks || 0;
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
            <AnalyticsTable
              data={reporterTableData}
              columns={reporterTableColumns}
              title="Reporter Statistics"
              enablePagination={true}
              showPagination={true}
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

        {/* Charts Section */}
        <CollapsibleSection title="Reporter Metrics Distribution" defaultOpen={true}>
          {/* Charts Container */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Reporter Metrics Pie Chart 1 */}
          {reporterPieData1 && reporterPieData1.length > 0 && (
            <ChartHeader
              variant="section"
              title="Reporter Metrics: Task by reporter (Part 1)"
              badges={[`${reporterPieTotal1} tasks`]}
              color={CARD_SYSTEM.COLOR_HEX_MAP.orange}
            >
              <SimplePieChart
                data={reporterPieData1}
                title=""
                colors={reporterPieColors1}
                showPercentages={true}
                dataType={CARD_SYSTEM.CHART_DATA_TYPE.REPORTER}
                showLegend={false}
              />
            </ChartHeader>
          )}

          {/* Reporter Metrics Pie Chart 2 */}
          {reporterPieData2 && reporterPieData2.length > 0 && (
            <ChartHeader
              variant="section"
              title="Reporter Metrics: Task by reporter (Part 2)"
              badges={[`${reporterPieTotal2} tasks`]}
              color={CARD_SYSTEM.COLOR_HEX_MAP.orange}
            >
              <SimplePieChart
                data={reporterPieData2}
                title=""
                colors={reporterPieColors2}
                showPercentages={true}
                dataType={CARD_SYSTEM.CHART_DATA_TYPE.REPORTER}
                showLegend={false}
              />
            </ChartHeader>
          )}

          {/* Reporter Metrics Pie Chart 3 */}
          {reporterPieData3 && reporterPieData3.length > 0 && (
            <ChartHeader
              variant="section"
              title="Reporter Metrics: Task by reporter (Part 3)"
              badges={[`${reporterPieTotal3} tasks`]}
              color={CARD_SYSTEM.COLOR_HEX_MAP.orange}
            >
              <SimplePieChart
                data={reporterPieData3}
                title=""
                colors={reporterPieColors3}
                showPercentages={true}
                dataType={CARD_SYSTEM.CHART_DATA_TYPE.REPORTER}
                showLegend={false}
              />
            </ChartHeader>
          )}
          </div>
        </CollapsibleSection>

        {/* Reporter Metrics Biaxial Chart - Single Column */}
        <CollapsibleSection title="Reporter Metrics Performance" defaultOpen={true} className="mt-6">
          <div className="grid grid-cols-1 gap-6">
          {(() => {
            // Use unique tasks count (not sum of reporter counts)
            const reporterBiaxialTotalTasks = totalTasks || 0;
            const totalHours = reporterBiaxialData?.reduce((sum, item) => sum + (item.hours || 0), 0) || 0;
            return (
              <ChartHeader
                variant="section"
                title="Reporter Metrics: Tasks & Hours by reporter"
                badges={[
                  `${reporterBiaxialTotalTasks} tasks`,
                  `${totalHours}h`
                ]}
                color={CARD_SYSTEM.COLOR_HEX_MAP.orange}
              >
                <BiaxialBarChart
                  data={reporterBiaxialData}
                  title=""
                  tasksColor={reporterBiaxialTasksColor}
                  hoursColor={reporterBiaxialHoursColor}
                  dataType={CARD_SYSTEM.CHART_DATA_TYPE.REPORTER}
                />
              </ChartHeader>
            );
          })()}
          </div>
        </CollapsibleSection>

        {/* Reporter-Market Biaxial Charts - Split by Product Type */}
        <CollapsibleSection title="Reporters by Markets" defaultOpen={true} className="mt-6">
          <div className="grid grid-cols-1 gap-6">
            {/* Casino Reporter-Market Chart */}
            {(() => {
              // Use unique tasks count (not sum of market counts)
              const casinoBiaxialTotalTasks = totalTasks || 0;
              const totalHours = reporterMarketBiaxialDataCasino?.reduce((sum, item) => sum + (item.hours || 0), 0) || 0;
              if (!reporterMarketBiaxialDataCasino || reporterMarketBiaxialDataCasino.length === 0) return null;
              return (
                <ChartHeader
                  variant="section"
                  title="Reporters by Markets: Casino"
                  badges={[
                    `${casinoBiaxialTotalTasks} tasks`,
                    `${Math.round(totalHours * 10) / 10}h`
                  ]}
                  color={CARD_SYSTEM.COLOR_HEX_MAP.orange}
                >
                  <BiaxialBarChart
                    data={reporterMarketBiaxialDataCasino}
                    title=""
                    tasksColor={reporterMarketBiaxialTasksColor}
                    hoursColor={reporterMarketBiaxialHoursColor}
                    dataType="reporter"
                  />
                </ChartHeader>
              );
            })()}

            {/* Sport Reporter-Market Chart */}
            {(() => {
              // Use unique tasks count (not sum of market counts)
              const sportBiaxialTotalTasks = totalTasks || 0;
              const totalHours = reporterMarketBiaxialDataSport?.reduce((sum, item) => sum + (item.hours || 0), 0) || 0;
              if (!reporterMarketBiaxialDataSport || reporterMarketBiaxialDataSport.length === 0) return null;
              return (
                <ChartHeader
                  variant="section"
                  title="Reporters by Markets: Sport"
                  badges={[
                    `${sportBiaxialTotalTasks} tasks`,
                    `${Math.round(totalHours * 10) / 10}h`
                  ]}
                  color={CARD_SYSTEM.COLOR_HEX_MAP.orange}
                >
                  <BiaxialBarChart
                    data={reporterMarketBiaxialDataSport}
                    title=""
                    tasksColor={reporterMarketBiaxialTasksColor}
                    hoursColor={reporterMarketBiaxialHoursColor}
                    dataType="reporter"
                  />
                </ChartHeader>
              );
            })()}
          </div>
        </CollapsibleSection>
      </div>
    </div>
  );
});

ReporterAnalyticsCard.displayName = 'ReporterAnalyticsCard';

export default ReporterAnalyticsCard;