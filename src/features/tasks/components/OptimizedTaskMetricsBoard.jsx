import React, { useState, useMemo, useEffect } from "react";
import DynamicButton from "../../../shared/components/ui/DynamicButton";
import OptimizedSmallCard from "../../../shared/components/ui/OptimizedSmallCard";
import { useCentralizedAnalytics } from "../../../shared/hooks/useCentralizedAnalytics";
import { useAuth } from "../../../shared/hooks/useAuth";
import { ANALYTICS_TYPES, TASK_CATEGORIES } from "../../../shared/utils/analyticsTypes";

import {
  ClipboardDocumentListIcon,
  ClockIcon,
  SparklesIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  UserGroupIcon,
  GlobeAltIcon,
  CubeIcon,
  ChartBarIcon,
  CogIcon,
  CodeBracketIcon,
  VideoCameraIcon,
  PaintBrushIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from "@heroicons/react/24/outline";

// Memoized OptimizedSmallCard component to prevent unnecessary re-renders
const MemoizedOptimizedSmallCard = React.memo(OptimizedSmallCard);

// Occupation-based card filtering configuration
const OCCUPATION_CARD_MAPPING = {
  'designer': ['design', 'total-tasks', 'total-hours', 'total-time-with-ai', 'ai-tasks','markets', 'products', 'ai-models','user-performance'],
  'developer': ['development', 'total-tasks', 'total-hours', 'total-time-with-ai', 'ai-tasks','markets', 'products', 'ai-models','user-performance'],
  'video-editor': ['video', 'total-tasks', 'total-hours', 'total-time-with-ai', 'ai-tasks','markets', 'products', 'ai-models','user-performance'],
  'admin': ['total-tasks', 'total-hours', 'total-time-with-ai', 'ai-tasks', 'development', 'design', 'video', 'user-performance', 'markets', 'products', 'ai-models', 'deliverables'],
  'user': ['total-tasks', 'total-hours', 'total-time-with-ai', 'ai-tasks', 'development', 'design', 'video'] // Default for users without specific occupation
};

// Configuration array for all metric cards using type-based approach
const METRIC_CARDS_CONFIG = [
  {
    id: "total-tasks",
    title: "Total Tasks",
    type: ANALYTICS_TYPES.TOTAL_TASKS,
    icon: ClipboardDocumentListIcon,
    trend: true,
    trendValue: "This Month",
    trendDirection: "up",
  },
  {
    id: "total-hours",
    title: "Total Hours",
    type: ANALYTICS_TYPES.TOTAL_HOURS,
    icon: ClockIcon,
    trend: true,
    trendValue: "Total Time",
    trendDirection: "up",
  },
  {
    id: "total-time-with-ai",
    title: "Total Time with AI",
    type: ANALYTICS_TYPES.TOTAL_TIME_WITH_AI,
    icon: SparklesIcon,
    trend: true,
    trendValue: "AI Assisted",
    trendDirection: "up",
  },
  {
    id: "ai-tasks",
    title: "AI Tasks",
    type: ANALYTICS_TYPES.AI_TASKS,
    icon: SparklesIcon,
    trend: true,
    trendValue: "AI Usage",
    trendDirection: "up",
  },
  {
    id: "development",
    title: "Development",
    type: ANALYTICS_TYPES.DEVELOPMENT,
    category: TASK_CATEGORIES.DEV,
    icon: CodeBracketIcon,
    trend: true,
    trendValue: "Development",
    trendDirection: "up",
  },
  {
    id: "design",
    title: "Design",
    type: ANALYTICS_TYPES.DESIGN,
    category: TASK_CATEGORIES.DESIGN,
    icon: PaintBrushIcon,
    trend: true,
    trendValue: "Design Work",
    trendDirection: "up",
  },
  {
    id: "video",
    title: "Video",
    type: ANALYTICS_TYPES.VIDEO,
    category: TASK_CATEGORIES.VIDEO,
    icon: VideoCameraIcon,
    trend: true,
    trendValue: "Video Production",
    trendDirection: "up",
  },
  {
    id: "user-performance",
    title: "User Performance",
    type: ANALYTICS_TYPES.USER_PERFORMANCE,
    icon: UserGroupIcon,
    trend: true,
    trendValue: "Team Stats",
    trendDirection: "up",
  },
  {
    id: "markets",
    title: "Markets",
    type: ANALYTICS_TYPES.MARKETS,
    icon: GlobeAltIcon,
    trend: true,
    trendValue: "Active Markets",
    trendDirection: "up",
  },
  {
    id: "products",
    title: "Products",
    type: ANALYTICS_TYPES.PRODUCTS,
    icon: CubeIcon,
    trend: true,
    trendValue: "Active Products",
    trendDirection: "up",
  },
];


const OptimizedTaskMetricsBoard = ({
  monthId,
  userId = null,
  showSmallCards = true,
  className = "",
}) => {
  const [showKeyMetrics, setShowKeyMetrics] = useState(true);
  const { user } = useAuth();
  
  // For admins, always show all cards regardless of which user they're viewing
  // For regular users, filter based on their occupation
  const isAdmin = user?.role === 'admin';
  const userOccupation = isAdmin ? 'admin' : (user?.occupation || user?.role || 'user');
  
  // Get allowed cards for this occupation
  const allowedCardIds = OCCUPATION_CARD_MAPPING[userOccupation] || OCCUPATION_CARD_MAPPING['user'];
  
  // Filter cards based on occupation
  const filteredCardsConfig = METRIC_CARDS_CONFIG.filter(card => 
    allowedCardIds.includes(card.id)
  );
  
  // Log occupation-based filtering for debugging
  console.log(`[OptimizedTaskMetricsBoard] User: ${user?.name}, Role: ${user?.role}, Occupation: ${userOccupation}`);
  console.log(`[OptimizedTaskMetricsBoard] Showing ${filteredCardsConfig.length} cards out of ${METRIC_CARDS_CONFIG.length} total cards`);
  console.log(`[OptimizedTaskMetricsBoard] Allowed cards:`, allowedCardIds);
  
  const toggleTableButton = () => {
    setShowKeyMetrics(!showKeyMetrics);
  };

  // Use centralized analytics hook (now uses IndexedDB as data store)
  const {
    analytics,
    getMetric,
    getAllMetrics,
    hasData,
    isLoading,
    error,
    getCacheStatus,
    reload,
    refreshAnalytics
  } = useCentralizedAnalytics(monthId, userId);

  // Load analytics when component mounts or dependencies change
  useEffect(() => {
    if (monthId && refreshAnalytics) {
      // Initial load only
      refreshAnalytics();
    }
  }, [monthId, userId, refreshAnalytics]);

  // Add error boundary for analytics
  if (error) {
    console.error('OptimizedTaskMetricsBoard error:', error);
    return (
      <div className="text-center text-red-400 py-8">
        Error loading analytics: {error.message || 'Unknown error'}
      </div>
    );
  }

  // Memoize the cards to prevent unnecessary re-renders
  const metricCards = useMemo(() => {
    if (!showSmallCards || !showKeyMetrics || !monthId) {
      return null;
    }

    // If no data available, show loading state
    if (!hasData && isLoading) {
      return filteredCardsConfig.map((cardConfig) => (
        <MemoizedOptimizedSmallCard
          key={cardConfig.id}
          title={cardConfig.title}
          type={cardConfig.type}
          category={cardConfig.category}
          icon={cardConfig.icon}
          monthId={monthId}
          userId={userId}
          trend={cardConfig.trend}
          trendValue={cardConfig.trendValue}
          trendDirection={cardConfig.trendDirection}
          loading={true}
        />
      ));
    }

    // If error, show error state
    if (error) {
      return (
        <div className="col-span-full text-center text-red-400 py-8">
          Error loading analytics: {error.message || 'Unknown error'}
        </div>
      );
    }

    // If no data and not loading, show appropriate message
    if (!hasData) {
      if (userId) {
        return (
          <div className="card text-center py-8">
            <div className="text-gray-400 mb-2">No tasks found for selected user</div>
            <div className="text-sm text-gray-500">This user has no tasks for {monthId}</div>
          </div>
        );
      } else {
        return (
          <div className="card text-center py-8">
            <div className="text-gray-400 mb-2">No tasks available for this month</div>
            <div className="text-sm text-gray-500">No tasks have been created for {monthId}</div>
          </div>
        );
      }
    }

    // If analytics is null or undefined, show empty state
    if (!analytics) {
      return (
        <div className="card">
          No analytics data available
        </div>
      );
    }
 
    // Render cards with analytics data (filtered by occupation)
    return filteredCardsConfig.map((cardConfig) => {
      try {
        // Ensure analytics object exists and has required properties
        if (!analytics || typeof analytics !== 'object') {
          console.warn(`Analytics not available for card ${cardConfig.id}`);
          return (
            <MemoizedOptimizedSmallCard
              key={cardConfig.id}
              title={cardConfig.title}
              type={cardConfig.type}
              category={cardConfig.category}
              icon={cardConfig.icon}
              monthId={monthId}
              userId={userId}
              trend={cardConfig.trend}
              trendValue={cardConfig.trendValue}
              trendDirection={cardConfig.trendDirection}
              loading={true}
              analyticsData={{ value: 0, additionalData: {} }}
            />
          );
        }

        const metricData = getMetric(cardConfig.type, cardConfig.category);
        // console.log(`Card ${cardConfig.id}:`, metricData);
        
        return (
          <MemoizedOptimizedSmallCard
            key={cardConfig.id}
            title={cardConfig.title}
            type={cardConfig.type}
            category={cardConfig.category}
            icon={cardConfig.icon}
            monthId={monthId}
            userId={userId}
            trend={cardConfig.trend}
            trendValue={cardConfig.trendValue}
            trendDirection={cardConfig.trendDirection}
            loading={false}
            analyticsData={metricData}
          />
        );
      } catch (error) {
        console.error(`Error rendering card ${cardConfig.id}:`, error);
        return (
          <div key={cardConfig.id} className="text-center text-red-400 py-4">
            Error loading {cardConfig.title}
          </div>
        );
      }
    });
  }, [
    showSmallCards, 
    showKeyMetrics, 
    monthId, 
    userId, 
    hasData, 
    isLoading, 
    error, 
    getMetric,
    filteredCardsConfig
  ]);



  if (!monthId) {
    return (
      <div className="card">
        No month selected for metrics
      </div>
    );
  }

  // If loading, show loading state
  if (isLoading) {
    return (
      <div className="card">
        Loading metrics...
      </div>
    );
  }

  // If no data and not loading, show empty state
  if (!hasData && !isLoading) {
    return (
      <div className="card">
        No data available for this month
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>

      <div className="flex-center !flex-row !items-end !justify-between border-b border-gray-700 pb-2 mb-6">
        <h3 className="mb-0">Task Metrics Per Month</h3>
        <DynamicButton
                onClick={toggleTableButton}
                variant="outline" // You can customize the style
                icon={showKeyMetrics ? ChevronUpIcon : ChevronDownIcon}
               size="sm"
               className="w-38"
              >
                {showKeyMetrics ? "Hide Cards" : "Show Cards"}
              </DynamicButton>
      </div>
      
 
      {/* Small Cards Section */}
      {showSmallCards && showKeyMetrics && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {metricCards}
          </div>
        </div>
      )}


    </div>
  );
};

export default OptimizedTaskMetricsBoard;
