import React, { memo, useMemo } from "react";
import AnalyticsTable from "@/components/Table/AnalyticsTable";
import BiaxialBarChart from "@/components/Charts/BiaxialBarChart";
import { SkeletonAnalyticsCard } from "@/components/ui/Skeleton/Skeleton";
import ChartHeader from "./ChartHeader";
import { CARD_SYSTEM } from "@/constants";
import { Icons } from "@/components/icons";
import SmallCard from "@/components/Card/smallCards/SmallCard";

const ChartIcon = Icons.generic.chart;

const MonthToMonthComparisonCard = memo(
  ({
    title = "Month-to-Month Comparison",
    month1Name = "Month 1",
    month2Name = "Month 2",
    month3Name = null,
    month1Metrics = {},
    month2Metrics = {},
    month3Metrics = null,
    comparisonTableData = [],
    comparisonTableColumns = [],
    casinoChartData = [],
    sportChartData = [],
    casinoAcquisitionChartData = [],
    sportAcquisitionChartData = [],
    categoriesChartData = [],
    productsChartData = [],
    allMarketsChartData = [],
    usersChartData = [],
    className = "",
    isLoading = false,
    hasNoData = false,
  }) => {
    if (isLoading) {
      return <SkeletonAnalyticsCard className={className} />;
    }

    if (hasNoData) {
      return (
        <div className={`card-small-modern ${className}`}>
          <div className="text-center py-16">
            <Icons.generic.document className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No Data Available
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md">
              There is no data available for the selected months. Please select months with data to compare.
            </p>
          </div>
        </div>
      );
    }

    const cardColor = CARD_SYSTEM.COLOR_HEX_MAP.blue;

    // Calculate totals for display
    const totalTasksMonth1 = month1Metrics?.totalTasks || 0;
    const totalHoursMonth1 = Math.round((month1Metrics?.totalHours || 0) * 100) / 100;
    const totalTasksMonth2 = month2Metrics?.totalTasks || 0;
    const totalHoursMonth2 = Math.round((month2Metrics?.totalHours || 0) * 100) / 100;
    const totalTasksMonth3 = month3Metrics?.totalTasks || 0;
    const totalHoursMonth3 = month3Metrics ? Math.round((month3Metrics?.totalHours || 0) * 100) / 100 : 0;

    // Create SmallCard data for summary cards
    const summaryCards = useMemo(() => {
      const cards = [
      {
        id: "month1-tasks",
        title: month1Name,
        subtitle: "Total Tasks",
        icon: Icons.generic.task,
        color: "blue",
        value: totalTasksMonth1.toLocaleString(),
        description: `${totalTasksMonth1.toLocaleString()} tasks`,
        badge: {
          text: `${totalTasksMonth1.toLocaleString()} tasks`,
          color: "blue"
        },
        details: []
      },
      {
        id: "month1-hours",
        title: month1Name,
        subtitle: "Total Hours",
        icon: Icons.generic.clock,
        color: "blue",
        value: `${totalHoursMonth1.toLocaleString()}h`,
        description: `${totalHoursMonth1.toLocaleString()} hours`,
        badge: {
          text: `${totalHoursMonth1.toLocaleString()}h`,
          color: "blue"
        },
        details: []
      },
      {
        id: "month2-tasks",
        title: month2Name,
        subtitle: "Total Tasks",
        icon: Icons.generic.task,
        color: "green",
        value: totalTasksMonth2.toLocaleString(),
        description: `${totalTasksMonth2.toLocaleString()} tasks`,
        badge: {
          text: `${totalTasksMonth2.toLocaleString()} tasks`,
          color: "green"
        },
        details: []
      },
      {
        id: "month2-hours",
        title: month2Name,
        subtitle: "Total Hours",
        icon: Icons.generic.clock,
        color: "green",
        value: `${totalHoursMonth2.toLocaleString()}h`,
        description: `${totalHoursMonth2.toLocaleString()} hours`,
        badge: {
          text: `${totalHoursMonth2.toLocaleString()}h`,
          color: "green"
        },
        details: []
      }
    ];
    
    // Add month3 cards if month3 is available
    if (month3Name && month3Metrics) {
      cards.push(
        {
          id: "month3-tasks",
          title: month3Name,
          subtitle: "Total Tasks",
          icon: Icons.generic.task,
          color: "purple",
          value: totalTasksMonth3.toLocaleString(),
          description: `${totalTasksMonth3.toLocaleString()} tasks`,
          badge: {
            text: `${totalTasksMonth3.toLocaleString()} tasks`,
            color: "purple"
          },
          details: []
        },
        {
          id: "month3-hours",
          title: month3Name,
          subtitle: "Total Hours",
          icon: Icons.generic.clock,
          color: "purple",
          value: `${totalHoursMonth3.toLocaleString()}h`,
          description: `${totalHoursMonth3.toLocaleString()} hours`,
          badge: {
            text: `${totalHoursMonth3.toLocaleString()}h`,
            color: "purple"
          },
          details: []
        }
      );
    }
    
    return cards;
    }, [month1Name, month2Name, month3Name, totalTasksMonth1, totalHoursMonth1, totalTasksMonth2, totalHoursMonth2, totalTasksMonth3, totalHoursMonth3, month3Metrics]);

    // Helper to build chart bars array with optional month3
    const buildChartBars = (month1Color, month2Color, month3Color = CARD_SYSTEM.COLOR_HEX_MAP.purple) => {
      const bars = [
        {
          dataKey: month1Name,
          name: month1Name,
          color: month1Color,
        },
        {
          dataKey: month2Name,
          name: month2Name,
          color: month2Color,
        },
      ];
      if (month3Name) {
        bars.push({
          dataKey: month3Name,
          name: month3Name,
          color: month3Color,
        });
      }
      return bars;
    };

    return (
      <div id="month-to-month-comparison-card" className={`space-y-8 ${className}`}>
        {/* Summary Cards */}
        <div className={`grid grid-cols-1 md:grid-cols-2 ${month3Name ? 'lg:grid-cols-3 xl:grid-cols-6' : 'lg:grid-cols-4'} gap-6`}>
          {summaryCards.map((card) => (
            <SmallCard key={card.id} card={card} />
          ))}
        </div>

        {/* Comparison Table */}
        {comparisonTableData && comparisonTableData.length > 0 && (
          <div>
            <AnalyticsTable
              data={comparisonTableData}
              columns={comparisonTableColumns}
              title="Month-to-Month Comparison"
            />
          </div>
        )}

        {/* Casino and Sport Charts */}
        <div>
          <div className="mb-4">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
              Casino & Sport Comparison
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Task distribution by markets for {month1Name} vs {month2Name}
            </p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Casino Chart */}
            <ChartHeader
              variant="section"
              title="Casino Tasks by Markets"
              badges={[
                `${(month1Metrics?.casino?.tasks || 0) + (month2Metrics?.casino?.tasks || 0)} tasks`,
                `${Math.round(((month1Metrics?.casino?.hours || 0) + (month2Metrics?.casino?.hours || 0)) * 10) / 10}h`,
              ]}
              color={CARD_SYSTEM.COLOR_HEX_MAP.crimson}
              className="group hover:shadow-xl transition-all duration-300"
            >
              {casinoChartData && casinoChartData.length > 0 ? (
                <BiaxialBarChart
                  data={casinoChartData}
                  title=""
                  bars={buildChartBars(CARD_SYSTEM.COLOR_HEX_MAP.crimson, CARD_SYSTEM.COLOR_HEX_MAP.blue)}
                  dataType={CARD_SYSTEM.CHART_DATA_TYPE.MARKET}
                />
              ) : (
                <div className="text-center py-8">
                  <Icons.generic.document className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-3" />
                  <p className="text-gray-500 dark:text-gray-400 font-medium">
                    No casino data available
                  </p>
                </div>
              )}
            </ChartHeader>

            {/* Sport Chart */}
            <ChartHeader
              variant="section"
              title="Sport Tasks by Markets"
              badges={[
                `${(month1Metrics?.sport?.tasks || 0) + (month2Metrics?.sport?.tasks || 0)} tasks`,
                `${Math.round(((month1Metrics?.sport?.hours || 0) + (month2Metrics?.sport?.hours || 0)) * 10) / 10}h`,
              ]}
              color={CARD_SYSTEM.COLOR_HEX_MAP.green}
              className="group hover:shadow-xl transition-all duration-300"
            >
              {sportChartData && sportChartData.length > 0 ? (
                <BiaxialBarChart
                  data={sportChartData}
                  title=""
                  bars={buildChartBars(CARD_SYSTEM.COLOR_HEX_MAP.green, CARD_SYSTEM.COLOR_HEX_MAP.blue)}
                  dataType={CARD_SYSTEM.CHART_DATA_TYPE.MARKET}
                />
              ) : (
                <div className="text-center py-8">
                  <Icons.generic.document className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-3" />
                  <p className="text-gray-500 dark:text-gray-400 font-medium">
                    No sport data available
                  </p>
                </div>
              )}
            </ChartHeader>
          </div>
        </div>

        {/* Market Acquisition Charts */}
        <div>
          <div className="mb-4">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
              Market Acquisition Comparison
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Acquisition tasks by markets for {month1Name} vs {month2Name}
            </p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Casino Acquisition Chart */}
            <ChartHeader
              variant="section"
              title="Casino Acquisition by Markets"
              badges={[
                `${(month1Metrics?.casinoAcquisition?.tasks || 0) + (month2Metrics?.casinoAcquisition?.tasks || 0)} tasks`,
                `${Math.round(((month1Metrics?.casinoAcquisition?.hours || 0) + (month2Metrics?.casinoAcquisition?.hours || 0)) * 10) / 10}h`,
              ]}
              color={CARD_SYSTEM.COLOR_HEX_MAP.amber}
              className="group hover:shadow-xl transition-all duration-300"
            >
              {casinoAcquisitionChartData && casinoAcquisitionChartData.length > 0 ? (
                <BiaxialBarChart
                  data={casinoAcquisitionChartData}
                  title=""
                  bars={buildChartBars(CARD_SYSTEM.COLOR_HEX_MAP.amber, CARD_SYSTEM.COLOR_HEX_MAP.blue)}
                  dataType={CARD_SYSTEM.CHART_DATA_TYPE.MARKET}
                />
              ) : (
                <div className="text-center py-8">
                  <Icons.generic.document className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-3" />
                  <p className="text-gray-500 dark:text-gray-400 font-medium">
                    No casino acquisition data available
                  </p>
                </div>
              )}
            </ChartHeader>

            {/* Sport Acquisition Chart */}
            <ChartHeader
              variant="section"
              title="Sport Acquisition by Markets"
              badges={[
                `${(month1Metrics?.sportAcquisition?.tasks || 0) + (month2Metrics?.sportAcquisition?.tasks || 0)} tasks`,
                `${Math.round(((month1Metrics?.sportAcquisition?.hours || 0) + (month2Metrics?.sportAcquisition?.hours || 0)) * 10) / 10}h`,
              ]}
              color={CARD_SYSTEM.COLOR_HEX_MAP.cyan}
              className="group hover:shadow-xl transition-all duration-300"
            >
              {sportAcquisitionChartData && sportAcquisitionChartData.length > 0 ? (
                <BiaxialBarChart
                  data={sportAcquisitionChartData}
                  title=""
                  bars={buildChartBars(CARD_SYSTEM.COLOR_HEX_MAP.cyan, CARD_SYSTEM.COLOR_HEX_MAP.blue)}
                  dataType={CARD_SYSTEM.CHART_DATA_TYPE.MARKET}
                />
              ) : (
                <div className="text-center py-8">
                  <Icons.generic.document className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-3" />
                  <p className="text-gray-500 dark:text-gray-400 font-medium">
                    No sport acquisition data available
                  </p>
                </div>
              )}
            </ChartHeader>
          </div>
        </div>

        {/* Comprehensive Charts Section */}
        <div>
          <div className="mb-4">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
              Comprehensive Task Analysis
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Complete breakdown of all tasks by category, product, markets, and users
            </p>
          </div>

          {/* Categories and Products */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Categories Chart */}
            <ChartHeader
              variant="section"
              title="Tasks by Category"
              badges={[
                `${((month1Metrics?.categories?.marketing?.tasks || 0) + (month1Metrics?.categories?.product?.tasks || 0) + (month1Metrics?.categories?.acquisition?.tasks || 0) + (month1Metrics?.categories?.misc?.tasks || 0)) + ((month2Metrics?.categories?.marketing?.tasks || 0) + (month2Metrics?.categories?.product?.tasks || 0) + (month2Metrics?.categories?.acquisition?.tasks || 0) + (month2Metrics?.categories?.misc?.tasks || 0))} tasks`,
              ]}
              color={CARD_SYSTEM.COLOR_HEX_MAP.blue}
              className="group hover:shadow-xl transition-all duration-300"
            >
              {categoriesChartData && categoriesChartData.length > 0 ? (
                <BiaxialBarChart
                  data={categoriesChartData}
                  title=""
                  bars={buildChartBars(CARD_SYSTEM.COLOR_HEX_MAP.blue, CARD_SYSTEM.COLOR_HEX_MAP.purple)}
                  dataType={CARD_SYSTEM.CHART_DATA_TYPE.PRODUCT}
                />
              ) : (
                <div className="text-center py-8">
                  <Icons.generic.document className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-3" />
                  <p className="text-gray-500 dark:text-gray-400 font-medium">
                    No category data available
                  </p>
                </div>
              )}
            </ChartHeader>

            {/* Products Chart */}
            <ChartHeader
              variant="section"
              title="Tasks by Product Type"
              badges={[
                `${((month1Metrics?.products?.casino?.tasks || 0) + (month1Metrics?.products?.sport?.tasks || 0) + (month1Metrics?.products?.poker?.tasks || 0) + (month1Metrics?.products?.lotto?.tasks || 0)) + ((month2Metrics?.products?.casino?.tasks || 0) + (month2Metrics?.products?.sport?.tasks || 0) + (month2Metrics?.products?.poker?.tasks || 0) + (month2Metrics?.products?.lotto?.tasks || 0))} tasks`,
              ]}
              color={CARD_SYSTEM.COLOR_HEX_MAP.green}
              className="group hover:shadow-xl transition-all duration-300"
            >
              {productsChartData && productsChartData.length > 0 ? (
                <BiaxialBarChart
                  data={productsChartData}
                  title=""
                  bars={buildChartBars(CARD_SYSTEM.COLOR_HEX_MAP.green, CARD_SYSTEM.COLOR_HEX_MAP.blue)}
                  dataType={CARD_SYSTEM.CHART_DATA_TYPE.PRODUCT}
                />
              ) : (
                <div className="text-center py-8">
                  <Icons.generic.document className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-3" />
                  <p className="text-gray-500 dark:text-gray-400 font-medium">
                    No product data available
                  </p>
                </div>
              )}
            </ChartHeader>
          </div>

          {/* Markets and Users */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* All Markets Chart */}
            <ChartHeader
              variant="section"
              title="Tasks by Markets (Top 15)"
              badges={[
                `${(month1Metrics?.totalTasks || 0) + (month2Metrics?.totalTasks || 0)} tasks`,
              ]}
              color={CARD_SYSTEM.COLOR_HEX_MAP.amber}
              className="group hover:shadow-xl transition-all duration-300"
            >
              {allMarketsChartData && allMarketsChartData.length > 0 ? (
                <BiaxialBarChart
                  data={allMarketsChartData}
                  title=""
                  bars={buildChartBars(CARD_SYSTEM.COLOR_HEX_MAP.amber, CARD_SYSTEM.COLOR_HEX_MAP.blue)}
                  dataType={CARD_SYSTEM.CHART_DATA_TYPE.MARKET}
                />
              ) : (
                <div className="text-center py-8">
                  <Icons.generic.document className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-3" />
                  <p className="text-gray-500 dark:text-gray-400 font-medium">
                    No market data available
                  </p>
                </div>
              )}
            </ChartHeader>

            {/* Users Chart */}
            <ChartHeader
              variant="section"
              title="Tasks by Users (Top 15)"
              badges={[
                `${(month1Metrics?.totalTasks || 0) + (month2Metrics?.totalTasks || 0)} tasks`,
              ]}
              color={CARD_SYSTEM.COLOR_HEX_MAP.purple}
              className="group hover:shadow-xl transition-all duration-300"
            >
              {usersChartData && usersChartData.length > 0 ? (
                <BiaxialBarChart
                  data={usersChartData}
                  title=""
                  bars={buildChartBars(CARD_SYSTEM.COLOR_HEX_MAP.purple, CARD_SYSTEM.COLOR_HEX_MAP.blue)}
                  dataType={CARD_SYSTEM.CHART_DATA_TYPE.USER}
                />
              ) : (
                <div className="text-center py-8">
                  <Icons.generic.document className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-3" />
                  <p className="text-gray-500 dark:text-gray-400 font-medium">
                    No user data available
                  </p>
                </div>
              )}
            </ChartHeader>
          </div>
        </div>
      </div>
    );
  }
);

MonthToMonthComparisonCard.displayName = "MonthToMonthComparisonCard";

export default MonthToMonthComparisonCard;

