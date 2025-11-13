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
  totalTasks = 0, // Unique tasks count
  className = "",
  isLoading = false,
}) => {
  if (isLoading) {
    return <SkeletonAnalyticsCard className={className} />;
  }

  // Calculate totals for pie charts
  // Pie chart segments show per category/market/user counts, but totals should show unique tasks (not sum of counts)
  const productsAIPieTotal = useMemo(() => {
    // Use unique tasks count from props (totalTasks is already unique tasks)
    return totalTasks || 0;
  }, [totalTasks]);
  
  const productsAIPieHours = useMemo(() => 
    productsBiaxialData?.reduce((sum, item) => sum + (item.hours || 0), 0) || 0,
    [productsBiaxialData]
  );
  
  const marketsAIPieTotal = useMemo(() => {
    // Use unique tasks count from props (totalTasks is already unique tasks)
    return totalTasks || 0;
  }, [totalTasks]);
  
  const marketsAIPieHours = useMemo(() => 
    marketsBiaxialData?.reduce((sum, item) => sum + (item.hours || 0), 0) || 0,
    [marketsBiaxialData]
  );
  
  const aiModelsPieTotal = useMemo(() => {
    // Use unique tasks count from props (totalTasks is already unique tasks)
    return totalTasks || 0;
  }, [totalTasks]);
  
  const aiModelsPieHours = useMemo(() => 
    aiModelsBiaxialData?.reduce((sum, item) => sum + (item.hours || 0), 0) || 0,
    [aiModelsBiaxialData]
  );
  
  const usersAIPieTotal = useMemo(() => {
    // Use unique tasks count from props (totalTasks is already unique tasks)
    return totalTasks || 0;
  }, [totalTasks]);
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
            <AnalyticsTable
              data={aiTableData}
              columns={aiTableColumns}
              title="AI Usage Statistics"
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
    
          {/* Charts Container */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column: Products */}
          <div className="space-y-6">
            {/* Products AI Usage Pie Chart */}
            <ChartHeader
              variant="section"
              title="Products AI: AI usage by product"
              badges={[
                `${productsAIPieTotal} tasks`,
                `${Math.round(productsAIPieHours * 10) / 10}h`
              ]}
              color={CARD_SYSTEM.COLOR_HEX_MAP.purple}
            >
              <SimplePieChart
                data={productsAIData}
                title=""
                colors={productsAIColors}
                showPercentages={true}
                dataType={CARD_SYSTEM.CHART_DATA_TYPE.PRODUCT}
              />
            </ChartHeader>

            {/* Products AI Analysis Biaxial Chart - Below pie chart */}
            {(() => {
              // Use unique tasks count (not sum of product counts)
              const productsBiaxialTotalTasks = totalTasks || 0;
              const totalHours = productsBiaxialData?.reduce((sum, item) => sum + (item.hours || 0), 0) || 0;
              return (
                <ChartHeader
                  variant="section"
                  title="Products AI: AI Time vs AI Tasks by product"
                  badges={[
                    `${productsBiaxialTotalTasks} tasks`,
                    `${totalHours}h`
                  ]}
                  color={CARD_SYSTEM.COLOR_HEX_MAP.purple}
                >
                  <BiaxialBarChart
                    data={productsBiaxialData}
                    title=""
                    tasksColor={productsBiaxialTasksColor}
                    hoursColor={productsBiaxialTimeColor}
                    dataType={CARD_SYSTEM.CHART_DATA_TYPE.PRODUCT}
                  />
                </ChartHeader>
              );
            })()}
          </div>

          {/* Right Column: Markets */}
          <div className="space-y-6">
            {/* Markets AI Usage Pie Chart */}
            <ChartHeader
              variant="section"
              title="Markets AI: AI usage by market"
              badges={[
                `${marketsAIPieTotal} tasks`,
                `${Math.round(marketsAIPieHours * 10) / 10}h`
              ]}
              color={CARD_SYSTEM.COLOR_HEX_MAP.purple}
            >
              <SimplePieChart
                data={marketsAIData}
                title=""
                colors={marketsAIColors}
                showPercentages={true}
                dataType={CARD_SYSTEM.CHART_DATA_TYPE.MARKET}
              />
            </ChartHeader>

            {/* Markets AI Analysis Biaxial Chart - Below pie chart */}
            {(() => {
              // Use unique tasks count (not sum of market counts)
              const marketsBiaxialTotalTasks = totalTasks || 0;
              const totalHours = marketsBiaxialData?.reduce((sum, item) => sum + (item.hours || 0), 0) || 0;
              return (
                <ChartHeader
                  variant="section"
                  title="Markets AI: AI Time vs AI Tasks by market"
                  badges={[
                    `${marketsBiaxialTotalTasks} tasks`,
                    `${totalHours}h`
                  ]}
                  color={CARD_SYSTEM.COLOR_HEX_MAP.purple}
                >
                  <BiaxialBarChart
                    data={marketsBiaxialData}
                    title=""
                    tasksColor={marketsBiaxialTasksColor}
                    hoursColor={marketsBiaxialTimeColor}
                    dataType={CARD_SYSTEM.CHART_DATA_TYPE.MARKET}
                  />
                </ChartHeader>
              );
            })()}
          </div>

          {/* AI Models Section - Pie chart with biaxial below */}
          <div className="space-y-6">
            {/* AI Models Usage Pie Chart */}
            <ChartHeader
              variant="section"
              title="AI Models: Distribution of AI models used"
              badges={[
                `${aiModelsPieTotal} tasks`,
                `${Math.round(aiModelsPieHours * 10) / 10}h`
              ]}
              color={CARD_SYSTEM.COLOR_HEX_MAP.purple}
            >
              <SimplePieChart
                data={aiModelsData}
                title=""
                colors={aiModelsColors}
                showPercentages={true}
                dataType={CARD_SYSTEM.CHART_DATA_TYPE.AI_MODEL}
              />
            </ChartHeader>

            {/* AI Models Biaxial Chart - Below pie chart */}
            {(() => {
              // Use unique tasks count (not sum of model counts)
              const aiModelsBiaxialTotalTasks = totalTasks || 0;
              const totalHours = aiModelsBiaxialData?.reduce((sum, item) => sum + (item.hours || 0), 0) || 0;
              return (
                <ChartHeader
                  variant="section"
                  title="AI Models: AI Time vs AI Tasks by model"
                  badges={[
                    `${aiModelsBiaxialTotalTasks} tasks`,
                    `${totalHours}h`
                  ]}
                  color={CARD_SYSTEM.COLOR_HEX_MAP.purple}
                >
                  <BiaxialBarChart
                    data={aiModelsBiaxialData}
                    title=""
                    tasksColor={aiModelsBiaxialTasksColor}
                    hoursColor={aiModelsBiaxialHoursColor}
                    dataType={CARD_SYSTEM.CHART_DATA_TYPE.AI_MODEL}
                  />
                </ChartHeader>
              );
            })()}
          </div>

          {/* Users Section - Pie chart with biaxial below */}
          <div className="space-y-6">
            {/* Users by AI Time Pie Chart */}
            <ChartHeader
              variant="section"
              title="AI Time: AI usage time by user"
              badges={[
                `${usersAIPieTotal} tasks`,
                `${Math.round(usersAIPieHours * 10) / 10}h`
              ]}
              color={CARD_SYSTEM.COLOR_HEX_MAP.purple}
            >
              <SimplePieChart
                data={usersAIData}
                title=""
                colors={usersAIColors}
                showPercentages={true}
                dataType={CARD_SYSTEM.CHART_DATA_TYPE.USER}
              />
            </ChartHeader>

            {/* Users AI Time vs AI Tasks Biaxial Chart - Below pie chart */}
            {(() => {
              // Use unique tasks count (not sum of user counts)
              const usersBiaxialTotalTasks = totalTasks || 0;
              const totalHours = usersBiaxialData?.reduce((sum, item) => sum + (item.hours || 0), 0) || 0;
              return (
                <ChartHeader
                  variant="section"
                  title="Users AI: AI time vs AI tasks by user"
                  badges={[
                    `${usersBiaxialTotalTasks} tasks`,
                    `${totalHours}h`
                  ]}
                  color={CARD_SYSTEM.COLOR_HEX_MAP.purple}
                >
                  <BiaxialBarChart
                    data={usersBiaxialData}
                    title=""
                    tasksColor={usersBiaxialTasksColor}
                    hoursColor={usersBiaxialTimeColor}
                    dataType={CARD_SYSTEM.CHART_DATA_TYPE.USER}
                    showHours={true}
                  />
                </ChartHeader>
              );
            })()}
          </div>
        </div>
       
      </div>
    </div>
  );
});

AIAnalyticsCard.displayName = 'AIAnalyticsCard';

export default AIAnalyticsCard;