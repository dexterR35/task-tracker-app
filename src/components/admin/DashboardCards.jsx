import React, { useMemo } from "react";
import DynamicCard from "@/components/ui/Card/DynamicCard";
import {
  calculateTaskMetrics,
  calculateReporterMetrics,
  calculateUserMetrics,
  calculateDesignMetrics,
  calculateAIMetrics,
  calculateMarketMetrics,
  calculateProductMetrics,
  calculateVideoMetrics,
  calculateDeveloperMetrics,
  generateChartData,
  calculateTrend,
} from "@/utils/analyticsUtils";
import { FiUser, FiZap, FiPackage, FiTarget, FiGlobe, FiShoppingBag } from "react-icons/fi";

/**
 * Dashboard Cards Component
 * Generates dynamic cards for admin dashboard based on real data
 */
const DashboardCards = ({ tasks = [], users = [], reporters = [], isLoading = false }) => {
  
  // Calculate all metrics
  const metrics = useMemo(() => {
    // Ensure we have valid data
    const validTasks = Array.isArray(tasks) ? tasks : [];
    const validUsers = Array.isArray(users) ? users : [];
    const validReporters = Array.isArray(reporters) ? reporters : [];
    
    const taskMetrics = calculateTaskMetrics(validTasks);
    const reporterMetrics = calculateReporterMetrics(validTasks, validReporters);
    const userMetrics = calculateUserMetrics(validTasks, validUsers);
    const designMetrics = calculateDesignMetrics(validTasks, validReporters);
    const aiMetrics = calculateAIMetrics(validTasks);
    const marketMetrics = calculateMarketMetrics(validTasks);
    const productMetrics = calculateProductMetrics(validTasks);
    const videoMetrics = calculateVideoMetrics(validTasks, validReporters);
    const devMetrics = calculateDeveloperMetrics(validTasks, validReporters);
    
    // Generate chart data for last 7 days with error handling
    let chartData = [];
    try {
      chartData = generateChartData(validTasks, 7);
    } catch (error) {
      console.warn('Error generating chart data:', error);
      // Fallback to empty chart data
      chartData = Array.from({ length: 7 }, (_, i) => ({
        name: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][i],
        value: 0,
        date: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      }));
    }
    
    return {
      taskMetrics,
      reporterMetrics,
      userMetrics,
      designMetrics,
      aiMetrics,
      marketMetrics,
      productMetrics,
      videoMetrics,
      devMetrics,
      chartData
    };
  }, [tasks, users, reporters]);

  // Card configurations
  const cardConfigs = useMemo(() => [
    // Total Tasks Card
    {
      id: "total-tasks",
      type: "total-tasks",
      title: "Total Tasks",
      subtitle: "Active Tasks",
      value: metrics.taskMetrics.totalTasks,
      valueType: "number",
      chartType: "bar",
      chartData: metrics.chartData,
      additionalData: [
        {
          icon: FiUser,
          label: "Avg per User",
          value: `${metrics.userMetrics.averageTasksPerUser} tasks`
        },
        {
          icon: FiTarget,
          label: "Avg per Reporter",
          value: `${metrics.reporterMetrics.averageTasksPerReporter} tasks`
        }
      ]
    },

    // Total Hours Card
    {
      id: "total-hours",
      type: "total-hours",
      title: "Total Hours",
      subtitle: "Hours Tracked",
      value: metrics.taskMetrics.totalHours,
      valueType: "hours",
      chartType: "line",
      chartData: metrics.chartData,
      additionalData: [
        {
          icon: FiUser,
          label: "Avg per Task",
          value: `${metrics.taskMetrics.averageHoursPerTask} hrs`
        },
        {
          icon: FiTarget,
          label: "AI Hours",
          value: `${metrics.taskMetrics.totalAIHours} hrs`
        }
      ]
    },

    // AI Tasks Card
    {
      id: "ai-tasks",
      type: "ai-tasks",
      title: "AI Tasks",
      subtitle: "AI Enhanced Tasks",
      value: metrics.aiMetrics.totalAITasks,
      valueType: "number",
      chartType: "blocks",
      chartData: metrics.chartData,
      additionalData: [
        {
          icon: FiZap,
          label: "AI Hours",
          value: `${metrics.aiMetrics.totalAIHours} hrs`
        },
        {
          icon: FiTarget,
          label: "Usage %",
          value: `${metrics.aiMetrics.aiUsagePercentage}%`
        },
        {
          icon: FiUser,
          label: "Avg per Task",
          value: `${metrics.aiMetrics.averageAIHoursPerTask} hrs`
        }
      ],
      topItems: metrics.aiMetrics.topAIModels.map(item => ({
        name: item.model,
        count: item.count
      }))
    },

    // Design Card
    {
      id: "design",
      type: "design",
      title: "Design",
      subtitle: "Design Tasks",
      value: metrics.designMetrics.totalDesignTasks,
      valueType: "number",
      chartType: "area",
      chartData: metrics.chartData,
      additionalData: [
        {
          icon: FiPackage,
          label: "Deliverables",
          value: `${metrics.designMetrics.tasksWithDeliverables} tasks`
        },
        {
          icon: FiTarget,
          label: "Total Hours",
          value: `${metrics.designMetrics.totalDesignHours} hrs`
        },
        {
          icon: FiZap,
          label: "AI Hours",
          value: `${metrics.designMetrics.aiHours} hrs`
        }
      ],
      topItems: [
        ...metrics.designMetrics.topAIModels.map(item => ({
          name: item.model,
          count: item.count,
          type: 'ai'
        })),
        ...metrics.designMetrics.topMarkets.map(item => ({
          name: item.market,
          count: item.count,
          type: 'market'
        })),
        ...metrics.designMetrics.topReporters.map(item => ({
          name: item.name,
          count: item.count,
          type: 'reporter'
        }))
      ].slice(0, 3),
      // Separate sections for better organization
      aiItems: metrics.designMetrics.topAIModels.map(item => ({
        name: item.model,
        count: item.count,
        type: 'ai'
      })),
      marketItems: metrics.designMetrics.topMarkets.map(item => ({
        name: item.market,
        count: item.count,
        type: 'market'
      })),
      reporterItems: metrics.designMetrics.topReporters.map(item => ({
        name: item.name,
        count: item.count,
        type: 'reporter'
      }))
    },

    // Video Card
    {
      id: "video",
      type: "video",
      title: "Video",
      subtitle: "Video Tasks",
      value: metrics.videoMetrics.totalVideoTasks,
      valueType: "number",
      chartType: "bar",
      chartData: metrics.chartData,
      additionalData: [
        {
          icon: FiTarget,
          label: "Total Hours",
          value: `${metrics.videoMetrics.totalVideoHours} hrs`
        },
        {
          icon: FiUser,
          label: "Avg Hours",
          value: `${metrics.videoMetrics.averageHoursPerVideoTask} hrs`
        },
        {
          icon: FiZap,
          label: "AI Hours",
          value: `${metrics.videoMetrics.aiHours} hrs`
        }
      ],
      topItems: [
        ...metrics.videoMetrics.topAIModels.map(item => ({
          name: item.model,
          count: item.count,
          type: 'ai'
        })),
        ...metrics.videoMetrics.topMarkets.map(item => ({
          name: item.market,
          count: item.count,
          type: 'market'
        })),
        ...metrics.videoMetrics.topReporters.map(item => ({
          name: item.name,
          count: item.count,
          type: 'reporter'
        }))
      ].slice(0, 3),
      // Separate sections for better organization
      aiItems: metrics.videoMetrics.topAIModels.map(item => ({
        name: item.model,
        count: item.count,
        type: 'ai'
      })),
      marketItems: metrics.videoMetrics.topMarkets.map(item => ({
        name: item.market,
        count: item.count,
        type: 'market'
      })),
      reporterItems: metrics.videoMetrics.topReporters.map(item => ({
        name: item.name,
        count: item.count,
        type: 'reporter'
      }))
    },

    // Developer Card
    {
      id: "developer",
      type: "developer",
      title: "Development",
      subtitle: "Dev Tasks",
      value: metrics.devMetrics.totalDevTasks,
      valueType: "number",
      chartType: "line",
      chartData: metrics.chartData,
      additionalData: [
        {
          icon: FiTarget,
          label: "Total Hours",
          value: `${metrics.devMetrics.totalDevHours} hrs`
        },
        {
          icon: FiUser,
          label: "Avg Hours",
          value: `${metrics.devMetrics.averageHoursPerDevTask} hrs`
        },
        {
          icon: FiZap,
          label: "AI Hours",
          value: `${metrics.devMetrics.aiHours} hrs`
        }
      ],
      topItems: [
        ...metrics.devMetrics.topAIModels.map(item => ({
          name: item.model,
          count: item.count,
          type: 'ai'
        })),
        ...metrics.devMetrics.topMarkets.map(item => ({
          name: item.market,
          count: item.count,
          type: 'market'
        })),
        ...metrics.devMetrics.topReporters.map(item => ({
          name: item.name,
          count: item.count,
          type: 'reporter'
        }))
      ].slice(0, 3),
      // Separate sections for better organization
      aiItems: metrics.devMetrics.topAIModels.map(item => ({
        name: item.model,
        count: item.count,
        type: 'ai'
      })),
      marketItems: metrics.devMetrics.topMarkets.map(item => ({
        name: item.market,
        count: item.count,
        type: 'market'
      })),
      reporterItems: metrics.devMetrics.topReporters.map(item => ({
        name: item.name,
        count: item.count,
        type: 'reporter'
      }))
    },

    // Reporters Card
    {
      id: "reporters",
      type: "reporters",
      title: "Reporters",
      subtitle: "Active Reporters",
      value: metrics.reporterMetrics.totalActiveReporters,
      valueType: "number",
      chartType: "blocks",
      chartData: metrics.chartData,
      additionalData: [
        {
          icon: FiUser,
          label: "Avg Tasks",
          value: `${metrics.reporterMetrics.averageTasksPerReporter} tasks`
        }
      ],
      topItems: metrics.reporterMetrics.topReporters.map(item => ({
        name: item.name,
        count: item.taskCount
      }))
    },

    // Users Card
    {
      id: "users",
      type: "users",
      title: "Users",
      subtitle: "Active Users",
      value: metrics.userMetrics.totalActiveUsers,
      valueType: "number",
      chartType: "line",
      chartData: metrics.chartData,
      additionalData: [
        {
          icon: FiUser,
          label: "Avg Tasks",
          value: `${metrics.userMetrics.averageTasksPerUser} tasks`
        }
      ],
      topItems: metrics.userMetrics.topUsers.map(item => ({
        name: item.name,
        count: item.taskCount
      }))
    },

    // Markets Card
    {
      id: "markets",
      type: "markets",
      title: "Markets",
      subtitle: "Active Markets",
      value: metrics.marketMetrics.totalActiveMarkets,
      valueType: "number",
      chartType: "bar",
      chartData: metrics.chartData,
      additionalData: [
        {
          icon: FiGlobe,
          label: "Total Entries",
          value: `${metrics.marketMetrics.totalMarketEntries} entries`
        }
      ],
      topItems: metrics.marketMetrics.topMarkets.map(item => ({
        name: item.market,
        count: item.count
      }))
    },

    // Products Card
    {
      id: "products",
      type: "products",
      title: "Products",
      subtitle: "Active Products",
      value: metrics.productMetrics.totalActiveProducts,
      valueType: "number",
      chartType: "area",
      chartData: metrics.chartData,
      additionalData: [
        {
          icon: FiShoppingBag,
          label: "Total Entries",
          value: `${metrics.productMetrics.totalProductEntries} entries`
        }
      ],
      topItems: metrics.productMetrics.topProducts.map(item => ({
        name: item.product,
        count: item.count
      }))
    }
  ], [metrics]);

  if (isLoading) {
    return (
      <div className="space-y-8">
        {/* Department Cards Loading Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, index) => (
            <DynamicCard
              key={`dept-${index}`}
              cardData={{}}
              isLoading={true}
            />
          ))}
        </div>

        {/* Other Cards Loading Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {Array.from({ length: 7 }).map((_, index) => (
            <DynamicCard
              key={`other-${index}`}
              cardData={{}}
              isLoading={true}
            />
          ))}
        </div>
      </div>
    );
  }

  // Separate department cards from other cards
  const departmentCards = cardConfigs.filter(card => 
    ['design', 'video', 'developer'].includes(card.id)
  );
  const otherCards = cardConfigs.filter(card => 
    !['design', 'video', 'developer'].includes(card.id)
  );

  return (
    <div className="space-y-8">
      {/* Department Cards Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {departmentCards.map((cardConfig) => (
          <DynamicCard
            key={cardConfig.id}
            cardData={cardConfig}
            isLoading={false}
          />
        ))}
      </div>

      {/* Other Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
        {otherCards.map((cardConfig) => (
          <DynamicCard
            key={cardConfig.id}
            cardData={cardConfig}
            isLoading={false}
          />
        ))}
      </div>
    </div>
  );
};

export default DashboardCards;
