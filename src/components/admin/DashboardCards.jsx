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
import { 
  FiUser, 
  FiZap, 
  FiPackage, 
  FiTarget, 
  FiGlobe, 
  FiShoppingBag, 
  FiTrendingUp, 
  FiTrendingDown,
  FiCheckCircle, 
  FiClock, 
  FiVideo, 
  FiCode 
} from "react-icons/fi";

/**
 * Dashboard Cards Component
 * Generates dynamic cards for admin dashboard based on real data
 */
const DashboardCards = ({ tasks = [], users = [], reporters = [], isLoading = false }) => {
  
  // Helper function to get trend indicator
  const getTrendIndicator = (current, previous = 0) => {
    const difference = current - previous;
    const percentage = previous > 0 ? Math.round((difference / previous) * 100) : 0;
    
    if (current > previous) {
      return { 
        trendDirection: "up", 
        trend: `+${percentage}%`,
        icon: FiTrendingUp, 
        color: "text-green-500" 
      };
    } else if (current < previous) {
      return { 
        trendDirection: "down", 
        trend: `${percentage}%`,
        icon: FiTrendingDown, 
        color: "text-red-500" 
      };
    } else {
      return { 
        trendDirection: "stable", 
        trend: "0%",
        icon: FiTrendingUp, 
        color: "text-gray-500" 
      };
    }
  };

  // Calculate all metrics
  const metrics = useMemo(() => {
    // Ensure we have valid data
    const validTasks = Array.isArray(tasks) ? tasks : [];
    const validUsers = Array.isArray(users) ? users : [];
    const validReporters = Array.isArray(reporters) ? reporters : [];
    
    // Debug: Log the data to see what we're working with
    console.log('Dashboard Data Debug:', {
      tasksCount: validTasks.length,
      usersCount: validUsers.length,
      reportersCount: validReporters.length,
      sampleTask: validTasks[0],
      sampleReporter: validReporters[0],
      sampleUser: validUsers[0]
    });
    
    const taskMetrics = calculateTaskMetrics(validTasks);
    const reporterMetrics = calculateReporterMetrics(validTasks, validReporters);
    const userMetrics = calculateUserMetrics(validTasks, validUsers);
    const designMetrics = calculateDesignMetrics(validTasks, validReporters);
    const aiMetrics = calculateAIMetrics(validTasks);
    const marketMetrics = calculateMarketMetrics(validTasks);
    const productMetrics = calculateProductMetrics(validTasks);
    const videoMetrics = calculateVideoMetrics(validTasks, validReporters);
    const devMetrics = calculateDeveloperMetrics(validTasks, validReporters);
    
    // Debug: Log the calculated metrics
    console.log('Calculated Metrics:', {
      aiMetrics: aiMetrics,
      reporterMetrics: reporterMetrics
    });
    
    // Generate meaningful chart data based on actual metrics
    const generateMetricChartData = (type, metrics) => {
      switch (type) {
        case 'total-tasks':
          return [
            { name: 'Total Tasks', value: metrics.taskMetrics.totalTasks },
            { name: 'AI Tasks', value: metrics.aiMetrics.totalAITasks },
            { name: 'Active Users', value: metrics.userMetrics.totalActiveUsers }
          ];
        case 'total-hours':
          return [
            { name: 'Total Hours', value: metrics.taskMetrics.totalHours },
            { name: 'AI Hours', value: metrics.aiMetrics.totalAIHours },
            { name: 'Avg per Task', value: Math.round(metrics.taskMetrics.averageHoursPerTask * 10) / 10 }
          ];
        case 'ai-tasks':
          return metrics.aiMetrics.topAIModels.slice(0, 5).map(item => ({
            name: item.model,
            value: item.count
          }));
        case 'design':
          return [
            { name: 'Tasks', value: metrics.designMetrics.totalDesignTasks },
            { name: 'Hours', value: Math.floor(metrics.designMetrics.totalDesignHours) },
            { name: 'AI Tasks', value: metrics.designMetrics.aiTasks },
            { name: 'Markets', value: metrics.designMetrics.topMarkets.length }
          ];
        case 'video':
          return [
            { name: 'Tasks', value: metrics.videoMetrics.totalVideoTasks },
            { name: 'Hours', value: Math.floor(metrics.videoMetrics.totalVideoHours) },
            { name: 'AI Tasks', value: metrics.videoMetrics.aiTasks },
            { name: 'Markets', value: metrics.videoMetrics.topMarkets.length }
          ];
        case 'developer':
          return [
            { name: 'Tasks', value: metrics.devMetrics.totalDevTasks },
            { name: 'Hours', value: Math.floor(metrics.devMetrics.totalDevHours) },
            { name: 'AI Tasks', value: metrics.devMetrics.aiTasks },
            { name: 'Markets', value: metrics.devMetrics.topMarkets.length }
          ];
        case 'reporters':
          return metrics.reporterMetrics.topReporters.slice(0, 5).map(item => ({
            name: item.name,
            value: item.taskCount
          }));
        case 'users':
          return metrics.userMetrics.topUsers.slice(0, 5).map(item => ({
            name: item.name,
            value: item.taskCount
          }));
        case 'markets':
          return metrics.marketMetrics.topMarkets.slice(0, 5).map(item => ({
            name: item.market,
            value: item.count
          }));
        case 'products':
          return metrics.productMetrics.topProducts.slice(0, 5).map(item => ({
            name: item.product,
            value: item.count
          }));
        default:
          return [
            { name: 'Data 1', value: 10 },
            { name: 'Data 2', value: 20 },
            { name: 'Data 3', value: 15 }
          ];
      }
    };
    
    // Mock previous values for trend calculation (in real app, you'd compare with previous period)
    const previousMetrics = {
      totalTasks: Math.max(0, taskMetrics.totalTasks - Math.floor(Math.random() * 5)),
      totalHours: Math.max(0, taskMetrics.totalHours - Math.floor(Math.random() * 10)),
      totalAITasks: Math.max(0, aiMetrics.totalAITasks - Math.floor(Math.random() * 3)),
      totalDesignTasks: Math.max(0, designMetrics.totalDesignTasks - Math.floor(Math.random() * 2)),
      totalVideoTasks: Math.max(0, videoMetrics.totalVideoTasks - Math.floor(Math.random() * 2)),
      totalDevTasks: Math.max(0, devMetrics.totalDevTasks - Math.floor(Math.random() * 2)),
      totalActiveReporters: Math.max(0, reporterMetrics.totalActiveReporters - Math.floor(Math.random() * 2)),
      totalActiveUsers: Math.max(0, userMetrics.totalActiveUsers - Math.floor(Math.random() * 2)),
      totalActiveMarkets: Math.max(0, marketMetrics.totalActiveMarkets - Math.floor(Math.random() * 2)),
      totalActiveProducts: Math.max(0, productMetrics.totalActiveProducts - Math.floor(Math.random() * 2)),
    };

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
      previousMetrics,
      generateMetricChartData
    };
  }, [tasks, users, reporters]);

  // Card configurations
  const cardConfigs = useMemo(() => [
    // Total Tasks Card
    {
      id: "total-tasks",
      type: "total-tasks",
      title: "Total Tasks",
      subtitle: "All Active Tasks",
      value: metrics.taskMetrics.totalTasks,
      valueType: "number",
      chartType: "bar",
      chartData: metrics.generateMetricChartData('total-tasks', metrics),
      ...getTrendIndicator(metrics.taskMetrics.totalTasks, metrics.previousMetrics.totalTasks),
      additionalData: [
        {
          icon: FiUser,
          label: "Active Users",
          value: `${metrics.userMetrics.totalActiveUsers} users`
        },
        {
          icon: FiTarget,
          label: "Active Reporters",
          value: `${metrics.reporterMetrics.totalActiveReporters} reporters`
        },
        {
          icon: FiTrendingUp,
          label: "Avg per User",
          value: `${metrics.userMetrics.averageTasksPerUser} tasks`
        },
        {
          icon: FiCheckCircle,
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
      subtitle: "All Hours Tracked",
      value: metrics.taskMetrics.totalHours,
      valueType: "hours",
      chartType: "line",
      chartData: metrics.generateMetricChartData('total-hours', metrics),
      ...getTrendIndicator(metrics.taskMetrics.totalHours, metrics.previousMetrics.totalHours),
      additionalData: [
        {
          icon: FiClock,
          label: "Avg per Task",
          value: `${metrics.taskMetrics.averageHoursPerTask} hrs`
        },
        {
          icon: FiZap,
          label: "AI Hours",
          value: `${metrics.aiMetrics.totalAIHours} hrs`
        },
        {
          icon: FiTrendingUp,
          label: "AI Usage %",
          value: `${metrics.aiMetrics.aiUsagePercentage}%`
        },
        {
          icon: FiUser,
          label: "Avg per Task",
          value: `${metrics.taskMetrics.averageHoursPerTask} hrs`
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
      chartData: metrics.generateMetricChartData('ai-tasks', metrics),
      ...getTrendIndicator(metrics.aiMetrics.totalAITasks, metrics.previousMetrics.totalAITasks),
      additionalData: [
        {
          icon: FiZap,
          label: "Total AI Hours",
          value: `${metrics.aiMetrics.totalAIHours} hrs`
        },
        {
          icon: FiTarget,
          label: "AI Usage %",
          value: `${metrics.aiMetrics.aiUsagePercentage}%`
        },
        {
          icon: FiTrendingUp,
          label: "Avg AI Hours",
          value: `${metrics.aiMetrics.averageAIHoursPerTask} hrs`
        },
        {
          icon: FiCheckCircle,
          label: "AI Models Used",
          value: `${metrics.aiMetrics.topAIModels.length} models`
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
      chartData: metrics.generateMetricChartData('design', metrics),
      ...getTrendIndicator(metrics.designMetrics.totalDesignTasks, metrics.previousMetrics.totalDesignTasks),
      additionalData: [
        {
          icon: FiPackage,
          label: "Total Tasks",
          value: `${metrics.designMetrics.totalDesignTasks} tasks`
        },
        {
          icon: FiTarget,
          label: "Total Hours",
          value: `${metrics.designMetrics.totalDesignHours} hrs`
        },
        {
          icon: FiZap,
          label: "AI Tasks",
          value: `${metrics.designMetrics.aiTasks} tasks`
        },
        {
          icon: FiClock,
          label: "AI Hours",
          value: `${metrics.designMetrics.aiHours} hrs`
        },
        {
          icon: FiTrendingUp,
          label: "Deliverables",
          value: `${metrics.designMetrics.tasksWithDeliverables} tasks`
        },
        {
          icon: FiCheckCircle,
          label: "Avg Hours",
          value: `${metrics.designMetrics.averageHoursPerDesignTask} hrs`
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
      chartData: metrics.generateMetricChartData('video', metrics),
      ...getTrendIndicator(metrics.videoMetrics.totalVideoTasks, metrics.previousMetrics.totalVideoTasks),
      additionalData: [
        {
          icon: FiVideo,
          label: "Total Tasks",
          value: `${metrics.videoMetrics.totalVideoTasks} tasks`
        },
        {
          icon: FiTarget,
          label: "Total Hours",
          value: `${metrics.videoMetrics.totalVideoHours} hrs`
        },
        {
          icon: FiZap,
          label: "AI Tasks",
          value: `${metrics.videoMetrics.aiTasks} tasks`
        },
        {
          icon: FiClock,
          label: "AI Hours",
          value: `${metrics.videoMetrics.aiHours} hrs`
        },
        {
          icon: FiTrendingUp,
          label: "Avg Hours",
          value: `${metrics.videoMetrics.averageHoursPerVideoTask} hrs`
        },
        {
          icon: FiCheckCircle,
          label: "AI Usage %",
          value: `${metrics.videoMetrics.totalVideoTasks > 0 ? Math.round((metrics.videoMetrics.aiTasks / metrics.videoMetrics.totalVideoTasks) * 100) : 0}%`
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
      chartData: metrics.generateMetricChartData('developer', metrics),
      ...getTrendIndicator(metrics.devMetrics.totalDevTasks, metrics.previousMetrics.totalDevTasks),
      additionalData: [
        {
          icon: FiCode,
          label: "Total Tasks",
          value: `${metrics.devMetrics.totalDevTasks} tasks`
        },
        {
          icon: FiTarget,
          label: "Total Hours",
          value: `${metrics.devMetrics.totalDevHours} hrs`
        },
        {
          icon: FiZap,
          label: "AI Tasks",
          value: `${metrics.devMetrics.aiTasks} tasks`
        },
        {
          icon: FiClock,
          label: "AI Hours",
          value: `${metrics.devMetrics.aiHours} hrs`
        },
        {
          icon: FiTrendingUp,
          label: "Avg Hours",
          value: `${metrics.devMetrics.averageHoursPerDevTask} hrs`
        },
        {
          icon: FiCheckCircle,
          label: "AI Usage %",
          value: `${metrics.devMetrics.totalDevTasks > 0 ? Math.round((metrics.devMetrics.aiTasks / metrics.devMetrics.totalDevTasks) * 100) : 0}%`
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
      chartData: metrics.generateMetricChartData('reporters', metrics),
      ...getTrendIndicator(metrics.reporterMetrics.totalActiveReporters, metrics.previousMetrics.totalActiveReporters),
      additionalData: [
        {
          icon: FiUser,
          label: "Total Reporters",
          value: `${metrics.reporterMetrics.totalActiveReporters} active`
        },
        {
          icon: FiTarget,
          label: "Avg Tasks",
          value: `${metrics.reporterMetrics.averageTasksPerReporter} tasks`
        },
        {
          icon: FiTrendingUp,
          label: "Top Performer",
          value: metrics.reporterMetrics.topReporters[0]?.name || "N/A"
        },
        {
          icon: FiCheckCircle,
          label: "Top Tasks",
          value: `${metrics.reporterMetrics.topReporters[0]?.taskCount || 0} tasks`
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
      chartData: metrics.generateMetricChartData('users', metrics),
      ...getTrendIndicator(metrics.userMetrics.totalActiveUsers, metrics.previousMetrics.totalActiveUsers),
      additionalData: [
        {
          icon: FiUser,
          label: "Total Users",
          value: `${metrics.userMetrics.totalActiveUsers} active`
        },
        {
          icon: FiTarget,
          label: "Avg Tasks",
          value: `${metrics.userMetrics.averageTasksPerUser} tasks`
        },
        {
          icon: FiTrendingUp,
          label: "Top User",
          value: metrics.userMetrics.topUsers[0]?.name || "N/A"
        },
        {
          icon: FiCheckCircle,
          label: "Top Tasks",
          value: `${metrics.userMetrics.topUsers[0]?.taskCount || 0} tasks`
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
      chartData: metrics.generateMetricChartData('markets', metrics),
      ...getTrendIndicator(metrics.marketMetrics.totalActiveMarkets, metrics.previousMetrics.totalActiveMarkets),
      additionalData: [
        {
          icon: FiGlobe,
          label: "Total Markets",
          value: `${metrics.marketMetrics.totalActiveMarkets} markets`
        },
        {
          icon: FiTarget,
          label: "Total Entries",
          value: `${metrics.marketMetrics.totalMarketEntries} entries`
        },
        {
          icon: FiTrendingUp,
          label: "Top Market",
          value: metrics.marketMetrics.topMarkets[0]?.market || "N/A"
        },
        {
          icon: FiCheckCircle,
          label: "Top Count",
          value: `${metrics.marketMetrics.topMarkets[0]?.count || 0} tasks`
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
      chartData: metrics.generateMetricChartData('products', metrics),
      ...getTrendIndicator(metrics.productMetrics.totalActiveProducts, metrics.previousMetrics.totalActiveProducts),
      additionalData: [
        {
          icon: FiShoppingBag,
          label: "Total Products",
          value: `${metrics.productMetrics.totalActiveProducts} products`
        },
        {
          icon: FiTarget,
          label: "Total Entries",
          value: `${metrics.productMetrics.totalProductEntries} entries`
        },
        {
          icon: FiTrendingUp,
          label: "Top Product",
          value: metrics.productMetrics.topProducts[0]?.product || "N/A"
        },
        {
          icon: FiCheckCircle,
          label: "Top Count",
          value: `${metrics.productMetrics.topProducts[0]?.count || 0} tasks`
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

        {/* Middle Cards Loading Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {Array.from({ length: 5 }).map((_, index) => (
            <DynamicCard
              key={`middle-${index}`}
              cardData={{}}
              isLoading={true}
            />
          ))}
        </div>

        {/* Total Cards Loading Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Array.from({ length: 2 }).map((_, index) => (
            <DynamicCard
              key={`total-${index}`}
              cardData={{}}
              isLoading={true}
            />
          ))}
        </div>
      </div>
    );
  }

  // Separate cards into different sections
  const departmentCards = cardConfigs.filter(card => 
    ['design', 'video', 'developer'].includes(card.id)
  );
  const middleCards = cardConfigs.filter(card => 
    !['design', 'video', 'developer', 'total-tasks', 'total-hours'].includes(card.id)
  );
  const totalCards = cardConfigs.filter(card => 
    ['total-tasks', 'total-hours'].includes(card.id)
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

      {/* Middle Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
        {middleCards.map((cardConfig) => (
          <DynamicCard
            key={cardConfig.id}
            cardData={cardConfig}
            isLoading={false}
          />
        ))}
      </div>

      {/* Total Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {totalCards.map((cardConfig) => (
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
