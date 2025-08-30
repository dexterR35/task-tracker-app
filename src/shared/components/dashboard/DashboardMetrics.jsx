import React, { useState, useMemo, useCallback } from "react";
import DynamicButton from "../ui/DynamicButton";
import OptimizedSmallCard from "../ui/OptimizedSmallCard";
import { useCentralizedDataAnalytics } from "../../hooks/analytics/useCentralizedDataAnalytics";
import { useAuth } from "../../hooks/useAuth";
import { ANALYTICS_TYPES, TASK_CATEGORIES } from "../../utils/analyticsTypes";


import {
  ClipboardDocumentListIcon,
  ClockIcon,
  SparklesIcon,
  UserGroupIcon,
  GlobeAltIcon,
  CubeIcon,
  CodeBracketIcon,
  VideoCameraIcon,
  PaintBrushIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  UserIcon,
} from "@heroicons/react/24/outline";

// Memoized OptimizedSmallCard component to prevent unnecessary re-renders
const MemoizedOptimizedSmallCard = React.memo(OptimizedSmallCard);

// Occupation-based card filtering configuration
const OCCUPATION_CARD_MAPPING = {
  'designer': ['design', 'total-tasks', 'total-hours', 'ai-combined','markets', 'products', 'ai-models','user-performance', 'top-reporter'],
  'developer': ['development', 'total-tasks', 'total-hours', 'ai-combined','markets', 'products', 'ai-models','user-performance', 'top-reporter'],
  'video-editor': ['video', 'total-tasks', 'total-hours', 'ai-combined','markets', 'products', 'ai-models','user-performance', 'top-reporter'],
  'admin': ['total-tasks', 'total-hours', 'ai-combined', 'development', 'design', 'video', 'user-performance', 'markets', 'products', 'ai-models', 'deliverables', 'top-reporter'],
  'user': ['total-tasks', 'total-hours', 'ai-combined', 'development', 'design', 'video', 'top-reporter'] // Default for users without specific occupation
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
    id: "ai-combined",
    title: "AI Analytics",
    type: ANALYTICS_TYPES.AI_COMBINED,
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
    id: "top-reporter",
    title: "Reporters",
    type: ANALYTICS_TYPES.TOP_REPORTER,
    icon: UserIcon,
    trend: true,
    trendValue: "Reporter Stats",
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
  userId = null,
  showSmallCards = true,
  className = "",
  userOccupation = null, // Allow passing specific occupation
}) => {
  const [showKeyMetrics, setShowKeyMetrics] = useState(true);
  const { user } = useAuth();
  
  // Use the centralized hook directly
  const {
    analytics,
    getMetric,
    getAllMetrics,
    hasData,
    error,
    isLoading,
    monthId,
    tasks,
    users,
    reporters,
    getFilteredData,
    getUserById,
    getReporterById
  } = useCentralizedDataAnalytics(userId);
  
  // Don't render if not authenticated
  if (!user) {
    return null;
  }
  
  // For admins, always show all cards regardless of which user they're viewing
  // For regular users, filter based on their occupation
  const isAdmin = user?.role === 'admin';
  const occupation = userOccupation || (isAdmin ? 'admin' : (user?.occupation || user?.role || 'user'));
  
  // Get allowed cards for this occupation - memoized to prevent recalculation
  const allowedCardIds = useMemo(() => 
    OCCUPATION_CARD_MAPPING[occupation] || OCCUPATION_CARD_MAPPING['user'],
    [occupation]
  );
  
  // Filter cards based on occupation - memoized to prevent recalculation
  const filteredCardsConfig = useMemo(() => 
    METRIC_CARDS_CONFIG.filter(card => allowedCardIds.includes(card.id)),
    [allowedCardIds]
  );
  
  const toggleTableButton = useCallback(() => {
    setShowKeyMetrics(!showKeyMetrics);
  }, [showKeyMetrics]);

  // Add error boundary for analytics
  if (error) {
    return (
      <div className="text-center text-red-400 py-8">
        Error loading analytics: {error?.message || 'Unknown error'}
      </div>
    );
  }

  // Memoize the cards to prevent unnecessary re-renders
  const metricCards = useMemo(() => {
    if (!showSmallCards || !showKeyMetrics || !monthId) {
      return null;
    }

    // If error, show error state
    if (error) {
      return (
        <div className="col-span-full text-center text-red-400 py-8">
          Error loading analytics: {error?.message || 'Unknown error'}
        </div>
      );
    }

    // Show loading state while data is being fetched
    if (isLoading) {
      return (
        <div className="col-span-full text-center py-8">
          <div className="flex items-center justify-center space-x-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
            <span className="text-gray-400">Loading analytics...</span>
          </div>
        </div>
      );
    }

    // Show message when no analytics data is available
    if (!analytics || typeof analytics !== 'object') {
      return (
        <div className="col-span-full text-center py-8">
          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-lg p-6">
            <div className="text-gray-400 mb-2">
              <svg className="w-8 h-8 mx-auto mb-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-200 mb-2">No Analytics Data</h3>
            <p className="text-sm text-gray-400">
              {monthId ? `No board exists for ${monthId}. Create a board to start tracking tasks and view analytics.` : 'Select a month to view analytics.'}
            </p>
          </div>
        </div>
      );
    }

    return filteredCardsConfig.map((cardConfig) => {
      try {
        const metricData = getMetric(cardConfig.type, cardConfig.category);
        
        return (
          <MemoizedOptimizedSmallCard
            key={cardConfig.id}
            title={cardConfig.title}
            type={cardConfig.type}
            category={cardConfig.category}
            icon={cardConfig.icon}
            userId={userId}
            trend={cardConfig.trend}
            trendValue={cardConfig.trendValue}
            trendDirection={cardConfig.trendDirection}
            analyticsData={metricData}
          />
        );
      } catch (error) {
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
    error, 
    isLoading,
    getMetric,
    filteredCardsConfig,
    analytics
  ]);

  if (!monthId) {
    return (
      <div className="card">
        No month selected for metrics
      </div>
    );
  }

  // ALWAYS show the metrics board - don't hide it when no data
  // The cards will show zero values if no data is available
  return (
    <div className={`space-y-6 ${className}`}>
      <div className="flex-center !flex-row !items-end !justify-between border-b border-gray-700 pb-2 mb-6">
        <h3 className="mb-0">Task Metrics Per Month</h3>
        <DynamicButton
          onClick={toggleTableButton}
          variant="outline"
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

export default React.memo(OptimizedTaskMetricsBoard);
